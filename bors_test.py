"""
bors_test.py – Intern kryptobörsen för debatt.ai

Agenter placerar köp- och säljordrar baserat på personlighet (heuristik, inga LLM-anrop).
Order book matchas automatiskt. Affärer genomförs och saldo/portfölj uppdateras.

Kör via GitHub Actions (.github/workflows/bors-test.yml) två gånger per dag.
"""

import os
import sys
import random
import math
import urllib.parse
from datetime import datetime, timezone, timedelta

import httpx

from agenter import AGENTER
from supabase_utils import SB_URL, spara_civilisations_minne

# ─── Konstanter ───────────────────────────────────────────────────────────────

SYMBOLER = ["DBT", "NOVA", "ETK"]

# Trading-personlighet per agent
TRADING_STIL = {
    "Nationalekonom":       {"aggressivitet": 0.5, "bias": "neutral", "risk": "medel"},
    "Miljöaktivist":        {"aggressivitet": 0.2, "bias": "salj",    "risk": "lag"},
    "Teknikoptimist":       {"aggressivitet": 0.7, "bias": "kop",     "risk": "hog"},
    "Konservativ debattör": {"aggressivitet": 0.3, "bias": "salj",    "risk": "lag"},
    "Jurist":               {"aggressivitet": 0.3, "bias": "neutral", "risk": "lag"},
    "Journalist":           {"aggressivitet": 0.4, "bias": "salj",    "risk": "medel"},
    "Filosof":              {"aggressivitet": 0.4, "bias": "neutral", "risk": "medel"},
    "Läkare":               {"aggressivitet": 0.3, "bias": "neutral", "risk": "lag"},
    "Psykolog":             {"aggressivitet": 0.5, "bias": "neutral", "risk": "medel"},
    "Historiker":           {"aggressivitet": 0.5, "bias": "kop",     "risk": "medel"},
    "Sociolog":             {"aggressivitet": 0.3, "bias": "salj",    "risk": "lag"},
    "Kryptoanalytiker":     {"aggressivitet": 0.9, "bias": "kop",     "risk": "hog"},
    "Den hungriga":         {"aggressivitet": 0.4, "bias": "salj",    "risk": "medel"},
    "Mamman":               {"aggressivitet": 0.2, "bias": "neutral", "risk": "lag"},
    "Den sura":             {"aggressivitet": 0.6, "bias": "salj",    "risk": "medel"},
    "Den trötta":           {"aggressivitet": 0.2, "bias": "neutral", "risk": "lag"},
    "Den stressade":        {"aggressivitet": 0.7, "bias": "kop",     "risk": "hog"},
    "Den lugna":            {"aggressivitet": 0.3, "bias": "neutral", "risk": "lag"},
    "Pensionären":          {"aggressivitet": 0.2, "bias": "salj",    "risk": "lag"},
    "Tonåringen":           {"aggressivitet": 0.8, "bias": "kop",     "risk": "hog"},
    "Den nostalgiske":      {"aggressivitet": 0.2, "bias": "salj",    "risk": "lag"},
    "Hypokondrikern":       {"aggressivitet": 0.5, "bias": "salj",    "risk": "medel"},
    "Optimisten":           {"aggressivitet": 0.7, "bias": "kop",     "risk": "hog"},
    "Den rike":             {"aggressivitet": 0.8, "bias": "kop",     "risk": "hog"},
}

# Föredragna symboler per agent
SYMBOL_PREFS = {
    "Kryptoanalytiker":  ["NOVA", "DBT", "ETK"],
    "Teknikoptimist":    ["DBT", "NOVA"],
    "Filosof":           ["ETK", "DBT"],
    "Psykolog":          ["ETK", "DBT"],
    "Läkare":            ["ETK"],
    "Tonåringen":        ["NOVA", "DBT"],
    "Optimisten":        ["NOVA", "DBT"],
    "Den rike":          ["DBT", "NOVA"],
    "Historiker":        ["DBT"],
    "Den stressade":     ["NOVA", "DBT"],
    "Miljöaktivist":     ["ETK"],
}

# Genesis-tilldelning (gratis airdrop, dras inte från saldo)
GENESIS = {
    "DBT":  {a["namn"]: 5 for a in AGENTER},  # Alla 24 agenter får 5 DBT
    "NOVA": {
        "Kryptoanalytiker": 30,
        "Tonåringen": 20,
        "Optimisten": 15,
        "Den stressade": 10,
        "Teknikoptimist": 10,
    },
    "ETK": {
        "Filosof": 20,
        "Psykolog": 15,
        "Läkare": 15,
        "Sociolog": 10,
        "Mamman": 10,
        "Den lugna": 5,
    },
}

# Motiveringsmallar
KOP_MOTIVERINGAR = [
    "ser potential i {symbol} — köper in",
    "teknisk analys pekar uppåt",
    "priset är attraktivt just nu",
    "diversifierar portföljen",
    "FOMO — kan inte missa detta",
    "positiv på marknaden",
    "ackumulerar position",
]

SALJ_MOTIVERINGAR = [
    "tar hem vinst",
    "behöver likviditet",
    "rebalanserar portföljen",
    "marknaden känns övervärderad",
    "minskar risk",
    "skeptisk till {symbol} i nuläget",
    "säljer av position",
]

# Staking sannolikhet och APY per agent
STAKING_PROFIL = {
    "Den lugna":        {"sannolikhet": 0.20, "apy": 0.08},
    "Nationalekonom":   {"sannolikhet": 0.18, "apy": 0.06},
    "Historiker":       {"sannolikhet": 0.18, "apy": 0.06},
    "Läkare":           {"sannolikhet": 0.15, "apy": 0.05},
    "Pensionären":      {"sannolikhet": 0.15, "apy": 0.07},
    "Filosof":          {"sannolikhet": 0.15, "apy": 0.05},
    "Den nostalgiske":  {"sannolikhet": 0.12, "apy": 0.05},
    "Mamman":           {"sannolikhet": 0.12, "apy": 0.05},
    "Kryptoanalytiker": {"sannolikhet": 0.04, "apy": 0.05},
    "Tonåringen":       {"sannolikhet": 0.03, "apy": 0.05},
    "Den stressade":    {"sannolikhet": 0.04, "apy": 0.05},
}
DEFAULT_STAKING = {"sannolikhet": 0.08, "apy": 0.05}

# Market making — agenter med analytisk/lugn personlighet bidrar med likviditet
MARKET_MAKER_PROFIL = {
    # agent: (sannolikhet att lägga MM-ordrar, spread-tighthet som andel av spot)
    "Nationalekonom":       {"sannolikhet": 0.25, "tighthet": 0.04},
    "Den lugna":            {"sannolikhet": 0.25, "tighthet": 0.03},
    "Filosof":              {"sannolikhet": 0.20, "tighthet": 0.05},
    "Jurist":               {"sannolikhet": 0.18, "tighthet": 0.04},
    "Läkare":               {"sannolikhet": 0.15, "tighthet": 0.05},
    "Psykolog":             {"sannolikhet": 0.15, "tighthet": 0.05},
    "Historiker":           {"sannolikhet": 0.15, "tighthet": 0.06},
    "Sociolog":             {"sannolikhet": 0.12, "tighthet": 0.06},
    "Mamman":               {"sannolikhet": 0.12, "tighthet": 0.05},
    "Pensionären":          {"sannolikhet": 0.12, "tighthet": 0.06},
    "Konservativ debattör": {"sannolikhet": 0.10, "tighthet": 0.05},
}
LIKVIDITET_SPANN  = 0.10   # ordrar inom ±10 % av spot räknas som nära
LIKVIDITET_BELOPP = 1.5    # SEK per kvalificerande (agent, symbol)-par per körning

AVGIFT_SATS = 0.005        # 0,5 % handelsavgift på varje genomförd affär → Börskassan

# ─── Automatisk Market Maker (AMM) ────────────────────────────────────────────

AMM_SPREAD           = 0.04   # 4 % varje sida av spotpriset
AMM_ANTAL            = 3.0    # tokens per AMM-order
AMM_MIN_ORDERS       = 2      # minimum ordrar per sida innan AMM agerar
AMM_REFILL_TROSKEL   = 10.0   # auto-refill om token-inventariet sjunker under detta
AMM_REFILL_ANTAL     = 50.0   # antal tokens som fylls på vid refill

# ─── Korta positioner ─────────────────────────────────────────────────────────

SHORT_COLLATERAL   = 1.50  # 150 % av positionsvärdet låses som säkerhet
SHORT_LIQ_TROSKEL  = 0.80  # likvideras när förlust > 80 % av collateral
SHORT_DAGLIG_AVGIFT = 0.30  # % per körning dras från saldo → Börskassan

# Agenter och deras benägenhet att shorta (sannolikhet per körning, max antal tokens)
SHORT_PROFIL = {
    "Kryptoanalytiker":     {"sannolikhet": 0.08, "max_antal": 3, "symboler": None},
    "Den sura":             {"sannolikhet": 0.06, "max_antal": 2, "symboler": None},
    "Konservativ debattör": {"sannolikhet": 0.05, "max_antal": 2, "symboler": None},
    "Journalist":           {"sannolikhet": 0.05, "max_antal": 2, "symboler": None},
    "Nationalekonom":       {"sannolikhet": 0.04, "max_antal": 2, "symboler": None},
    "Miljöaktivist":        {"sannolikhet": 0.04, "max_antal": 2, "symboler": ["NOVA"]},
    "Den stressade":        {"sannolikhet": 0.03, "max_antal": 1, "symboler": None},
}

# ─── Hjälpfunktioner ──────────────────────────────────────────────────────────

def _h(sb_key: str) -> dict:
    """Returnerar standard HTTP-headers för Supabase REST API."""
    return {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def hamta_pris(sb_key: str, symbol: str) -> float:
    """Hämtar senaste pris för en symbol. Returnerar 100.0 som fallback."""
    try:
        url = f"{SB_URL}/rest/v1/bors_tillgangar?symbol=eq.{urllib.parse.quote(symbol)}&select=senaste_pris"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success:
            rows = r.json()
            if rows:
                return float(rows[0].get("senaste_pris", 100.0))
    except Exception as e:
        print(f"  [hamta_pris] fel: {e}")
    return 100.0


def hamta_portfolj(sb_key: str, agent: str) -> dict:
    """Hämtar agentens portfölj som {symbol: antal}. Tom dict om inga innehav."""
    try:
        agent_enc = urllib.parse.quote(agent)
        url = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{agent_enc}&select=symbol,antal"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success:
            return {row["symbol"]: float(row["antal"]) for row in r.json() if float(row.get("antal", 0)) > 0}
    except Exception as e:
        print(f"  [hamta_portfolj] {agent}: {e}")
    return {}


def hamta_saldo(sb_key: str, agent: str) -> float:
    """Hämtar agentens saldo från agent_planbocker. Returnerar 0 om inte finns."""
    try:
        agent_enc = urllib.parse.quote(agent)
        url = f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{agent_enc}&select=saldo"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success:
            rows = r.json()
            if rows:
                return float(rows[0].get("saldo", 0))
    except Exception as e:
        print(f"  [hamta_saldo] {agent}: {e}")
    return 0.0


def genesis(sb_key: str) -> None:
    """
    Kontrollerar om bors_portfoljer är tom.
    Om tom: distribuera startpositioner (airdrop) till agenter.
    Saldo påverkas inte — detta är en gratis initial tilldelning.
    """
    try:
        url = f"{SB_URL}/rest/v1/bors_portfoljer?select=id&limit=1"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and len(r.json()) > 0:
            return  # Redan initialiserat
    except Exception as e:
        print(f"  [genesis] kontrollfel: {e}")
        return

    print("Genesis: distribuerar startpositioner...")
    h_insert = {**_h(sb_key), "Prefer": "resolution=ignore-duplicates,return=minimal"}

    for symbol, tilldelningar in GENESIS.items():
        rows = []
        for agent_namn, antal in tilldelningar.items():
            if antal > 0:
                rows.append({
                    "agent": agent_namn,
                    "symbol": symbol,
                    "antal": antal,
                    "genomsnittspris": 0,  # Gratis airdrop — kostnadsbas 0
                })
        if rows:
            try:
                url = f"{SB_URL}/rest/v1/bors_portfoljer?on_conflict=agent,symbol"
                r = httpx.post(url, headers=h_insert, json=rows, timeout=15)
                if r.is_success:
                    print(f"  {symbol}: {len(rows)} agenter tilldelade")
                else:
                    print(f"  {symbol}: fel vid genesis — {r.status_code}: {r.text[:200]}")
            except Exception as e:
                print(f"  {symbol}: genesis-exception: {e}")

    print("Genesis: distribuerade startpositioner.")


def avbryt_gamla_ordrar(sb_key: str) -> None:
    """Markerar ordrar äldre än 48h som avbrutna."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    try:
        h_patch = {**_h(sb_key), "Prefer": "return=minimal"}
        url = f"{SB_URL}/rest/v1/bors_ordrar?status=eq.öppen&skapad=lt.{urllib.parse.quote(cutoff)}"
        r = httpx.patch(url, headers=h_patch, json={"status": "avbruten"}, timeout=10)
        if r.is_success:
            print(f"  Gamla ordrar avbrutna (cutoff: {cutoff[:16]})")
        else:
            print(f"  Avbryt ordrar: {r.status_code}")
    except Exception as e:
        print(f"  [avbryt_gamla_ordrar] fel: {e}")

    # Avbryt även delvis ifyllda gamla ordrar
    try:
        h_patch = {**_h(sb_key), "Prefer": "return=minimal"}
        url = f"{SB_URL}/rest/v1/bors_ordrar?status=eq.delvis&skapad=lt.{urllib.parse.quote(cutoff)}"
        r = httpx.patch(url, headers=h_patch, json={"status": "avbruten"}, timeout=10)
    except Exception:
        pass


def lagg_order(sb_key: str, agent: str, symbol: str, typ: str,
               pris: float, antal: float, motivering: str) -> int | None:
    """Lägger en ny order. Returnerar order-id eller None vid fel."""
    payload = {
        "agent": agent,
        "symbol": symbol,
        "typ": typ,
        "pris": round(pris, 2),
        "antal": round(antal, 4),
        "ifylld_antal": 0,
        "status": "öppen",
        "motivering": motivering,
    }
    try:
        h_post = {**_h(sb_key), "Prefer": "return=representation"}
        url = f"{SB_URL}/rest/v1/bors_ordrar"
        r = httpx.post(url, headers=h_post, json=payload, timeout=10)
        if r.is_success:
            rows = r.json()
            if rows:
                return rows[0]["id"]
        else:
            print(f"  [lagg_order] {agent} {typ} {symbol}: {r.status_code} {r.text[:150]}")
    except Exception as e:
        print(f"  [lagg_order] {agent}: {e}")
    return None


def execute_trade(sb_key: str, kop_order: dict, salj_order: dict,
                  pris: float, antal: float, symbol: str) -> bool:
    """
    Genomför en affär:
    - Skapar rad i bors_affarer
    - Uppdaterar saldo för köpare och säljare
    - Uppdaterar portföljer (weighted avg för köparen)
    - Uppdaterar ordrarnas ifylld_antal och status
    - Uppdaterar bors_tillgangar med senaste pris
    """
    kop_agent  = kop_order["agent"]
    salj_agent = salj_order["agent"]
    total_kr   = round(pris * antal, 2)
    avgift_kr  = round(total_kr * AVGIFT_SATS, 2)

    h_min = {**_h(sb_key), "Prefer": "return=minimal"}

    # 1. Spara affären (inkl. faktisk avgift — beräknas nedan)
    kop_saldo_pre = hamta_saldo(sb_key, kop_agent)
    # Avgiften capped till vad köparen faktiskt har kvar efter handeln
    avgift_betald = min(avgift_kr, max(0.0, round(kop_saldo_pre - total_kr, 2)))

    try:
        affar_payload = {
            "symbol": symbol,
            "kop_order_id": kop_order["id"],
            "salj_order_id": salj_order["id"],
            "kop_agent": kop_agent,
            "salj_agent": salj_agent,
            "pris": round(pris, 2),
            "antal": round(antal, 4),
            "avgift": avgift_betald,
        }
        r = httpx.post(f"{SB_URL}/rest/v1/bors_affarer", headers=h_min, json=affar_payload, timeout=10)
        if not r.is_success:
            print(f"  [execute_trade] spara affar: {r.status_code}")
            return False
    except Exception as e:
        print(f"  [execute_trade] affar-exception: {e}")
        return False

    # 2. Dra saldo från köparen (handel + faktisk avgift)
    try:
        kop_saldo = kop_saldo_pre  # redan hämtat ovan
        nytt_kop_saldo = max(0.0, round(kop_saldo - total_kr - avgift_betald, 2))
        kop_enc = urllib.parse.quote(kop_agent)
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{kop_enc}",
            headers=h_min,
            json={"saldo": nytt_kop_saldo, "uppdaterad": "now()"},
            timeout=8,
        )
    except Exception as e:
        print(f"  [execute_trade] saldo kop: {e}")

    # 3. Addera saldo till säljaren (full handelsvolym — avgiften bärs av köparen)
    try:
        salj_saldo = hamta_saldo(sb_key, salj_agent)
        nytt_salj_saldo = round(salj_saldo + total_kr, 2)
        salj_enc = urllib.parse.quote(salj_agent)
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{salj_enc}",
            headers=h_min,
            json={"saldo": nytt_salj_saldo, "uppdaterad": "now()"},
            timeout=8,
        )
    except Exception as e:
        print(f"  [execute_trade] saldo salj: {e}")

    # 3b. Kreditera faktisk avgift till Börskassan
    if avgift_betald > 0:
        try:
            bk_saldo = hamta_saldo(sb_key, "Börskassan")
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.B%C3%B6rskassan",
                headers=h_min,
                json={"saldo": round(bk_saldo + avgift_betald, 2), "uppdaterad": "now()"},
                timeout=8,
            )
        except Exception as e:
            print(f"  [execute_trade] avgift borskassan: {e}")

    # 4. Uppdatera köparens portfölj (weighted average cost basis)
    try:
        kop_enc = urllib.parse.quote(kop_agent)
        sym_enc = urllib.parse.quote(symbol)
        url_pf = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{kop_enc}&symbol=eq.{sym_enc}"
        r_pf = httpx.get(url_pf, headers=_h(sb_key), timeout=8)
        if r_pf.is_success and r_pf.json():
            existing = r_pf.json()[0]
            old_antal = float(existing.get("antal", 0))
            old_pris  = float(existing.get("genomsnittspris", 0))
            new_antal = old_antal + antal
            if new_antal > 0:
                new_avg = round((old_antal * old_pris + antal * pris) / new_antal, 2)
            else:
                new_avg = round(pris, 2)
            httpx.patch(
                url_pf,
                headers=h_min,
                json={"antal": round(new_antal, 4), "genomsnittspris": new_avg, "uppdaterad": "now()"},
                timeout=8,
            )
        else:
            # Skapa ny portföljrad
            h_upsert = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}
            httpx.post(
                f"{SB_URL}/rest/v1/bors_portfoljer?on_conflict=agent,symbol",
                headers=h_upsert,
                json={
                    "agent": kop_agent,
                    "symbol": symbol,
                    "antal": round(antal, 4),
                    "genomsnittspris": round(pris, 2),
                    "uppdaterad": "now()",
                },
                timeout=8,
            )
    except Exception as e:
        print(f"  [execute_trade] portfolj kop: {e}")

    # 5. Minska säljarens portfölj
    try:
        salj_enc = urllib.parse.quote(salj_agent)
        sym_enc  = urllib.parse.quote(symbol)
        url_pfs = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{salj_enc}&symbol=eq.{sym_enc}"
        r_pfs = httpx.get(url_pfs, headers=_h(sb_key), timeout=8)
        if r_pfs.is_success and r_pfs.json():
            existing_salj = r_pfs.json()[0]
            old_salj_antal = float(existing_salj.get("antal", 0))
            new_salj_antal = max(0.0, round(old_salj_antal - antal, 4))
            httpx.patch(
                url_pfs,
                headers=h_min,
                json={"antal": new_salj_antal, "uppdaterad": "now()"},
                timeout=8,
            )
    except Exception as e:
        print(f"  [execute_trade] portfolj salj: {e}")

    # 6. Uppdatera köpordern (ifylld_antal + status)
    try:
        kop_ifylld = round(float(kop_order.get("ifylld_antal", 0)) + antal, 4)
        kop_total  = float(kop_order.get("antal", 0))
        kop_status = "ifylld" if kop_ifylld >= kop_total - 0.0001 else "delvis"
        httpx.patch(
            f"{SB_URL}/rest/v1/bors_ordrar?id=eq.{kop_order['id']}",
            headers=h_min,
            json={"ifylld_antal": kop_ifylld, "status": kop_status},
            timeout=8,
        )
    except Exception as e:
        print(f"  [execute_trade] kop-order status: {e}")

    # 7. Uppdatera säljordern (ifylld_antal + status)
    try:
        salj_ifylld = round(float(salj_order.get("ifylld_antal", 0)) + antal, 4)
        salj_total  = float(salj_order.get("antal", 0))
        salj_status = "ifylld" if salj_ifylld >= salj_total - 0.0001 else "delvis"
        httpx.patch(
            f"{SB_URL}/rest/v1/bors_ordrar?id=eq.{salj_order['id']}",
            headers=h_min,
            json={"ifylld_antal": salj_ifylld, "status": salj_status},
            timeout=8,
        )
    except Exception as e:
        print(f"  [execute_trade] salj-order status: {e}")

    # 8. Uppdatera bors_tillgangar senaste pris och antal_affarer
    try:
        sym_enc = urllib.parse.quote(symbol)
        url_tg = f"{SB_URL}/rest/v1/bors_tillgangar?symbol=eq.{sym_enc}&select=senaste_pris,antal_affarer,volym_24h"
        r_tg = httpx.get(url_tg, headers=_h(sb_key), timeout=8)
        if r_tg.is_success and r_tg.json():
            tg = r_tg.json()[0]
            gamla_pris     = float(tg.get("senaste_pris", pris))
            antal_affarer  = int(tg.get("antal_affarer", 0)) + 1
            volym_24h      = round(float(tg.get("volym_24h", 0)) + total_kr, 2)
            forandring_pct = round(((pris - gamla_pris) / gamla_pris) * 100, 2) if gamla_pris > 0 else 0.0
            httpx.patch(
                f"{SB_URL}/rest/v1/bors_tillgangar?symbol=eq.{sym_enc}",
                headers=h_min,
                json={
                    "senaste_pris":   round(pris, 2),
                    "forandring_pct": forandring_pct,
                    "antal_affarer":  antal_affarer,
                    "volym_24h":      volym_24h,
                },
                timeout=8,
            )
    except Exception as e:
        print(f"  [execute_trade] uppdatera tillgangar: {e}")

    return True


def matcha_ordrar(sb_key: str, symbol: str) -> list[dict]:
    """
    Matchar köp- och säljordrar för en symbol.
    Returnerar lista med genomförda affärer.
    Köpordrar sorteras desc pris (bäst pris först).
    Säljordrar sorteras asc pris (billigast först).
    """
    sym_enc = urllib.parse.quote(symbol)

    # Hämta öppna köpordrar (sorterade desc pris, asc skapad)
    try:
        url_kop = (
            f"{SB_URL}/rest/v1/bors_ordrar"
            f"?symbol=eq.{sym_enc}&typ=eq.kop&status=in.(öppen,delvis)"
            f"&order=pris.desc,skapad.asc"
        )
        r_kop = httpx.get(url_kop, headers=_h(sb_key), timeout=10)
        kop_ordrar = r_kop.json() if r_kop.is_success else []
    except Exception as e:
        print(f"  [matcha_ordrar] hämta kop: {e}")
        kop_ordrar = []

    # Hämta öppna säljordrar (sorterade asc pris, asc skapad)
    try:
        url_salj = (
            f"{SB_URL}/rest/v1/bors_ordrar"
            f"?symbol=eq.{sym_enc}&typ=eq.salj&status=in.(öppen,delvis)"
            f"&order=pris.asc,skapad.asc"
        )
        r_salj = httpx.get(url_salj, headers=_h(sb_key), timeout=10)
        salj_ordrar = r_salj.json() if r_salj.is_success else []
    except Exception as e:
        print(f"  [matcha_ordrar] hämta salj: {e}")
        salj_ordrar = []

    if not kop_ordrar or not salj_ordrar:
        return []

    # Gör muterbara kopior med lokalt spårad ifylld_antal
    kop_lista  = [dict(o) for o in kop_ordrar]
    salj_lista = [dict(o) for o in salj_ordrar]

    affarer = []
    ki = 0
    si = 0

    while ki < len(kop_lista) and si < len(salj_lista):
        kop  = kop_lista[ki]
        salj = salj_lista[si]

        kop_pris  = float(kop["pris"])
        salj_pris = float(salj["pris"])

        # Prisvillkor: köparen måste bjuda minst lika mycket som säljaren vill ha
        if kop_pris < salj_pris:
            break  # Ingen match möjlig

        # Samma agent kan inte sälja till sig själv
        if kop["agent"] == salj["agent"]:
            si += 1
            continue

        # Beräkna tillgängliga mängder
        kop_kvar  = float(kop["antal"]) - float(kop.get("ifylld_antal", 0))
        salj_kvar = float(salj["antal"]) - float(salj.get("ifylld_antal", 0))

        if kop_kvar <= 0:
            ki += 1
            continue
        if salj_kvar <= 0:
            si += 1
            continue

        # Affärspris: säljarens pris (price-time priority)
        affars_pris = salj_pris
        affars_antal = min(kop_kvar, salj_kvar)
        affars_antal = round(affars_antal, 4)

        print(f"  MATCH: {kop['agent']} köper {affars_antal} {symbol} @ {affars_pris} kr av {salj['agent']}")

        ok = execute_trade(sb_key, kop, salj, affars_pris, affars_antal, symbol)
        if ok:
            affar = {
                "symbol": symbol,
                "kop_agent": kop["agent"],
                "salj_agent": salj["agent"],
                "pris": affars_pris,
                "antal": affars_antal,
                "volym_kr": round(affars_pris * affars_antal, 2),
            }
            affarer.append(affar)

            # Uppdatera lokala ifylld_antal
            kop["ifylld_antal"]  = float(kop.get("ifylld_antal", 0)) + affars_antal
            salj["ifylld_antal"] = float(salj.get("ifylld_antal", 0)) + affars_antal

            # Flytta index om ordern är helt ifylld
            if kop["ifylld_antal"] >= float(kop["antal"]) - 0.0001:
                ki += 1
            if salj["ifylld_antal"] >= float(salj["antal"]) - 0.0001:
                si += 1
        else:
            # Om execute_trade misslyckades, skippa denna kombination
            si += 1

    return affarer


def logg_pris(sb_key: str, symbol: str, pris: float, volym: float) -> None:
    """Loggar ett pris i bors_priser (prishistorik)."""
    try:
        h_min = {**_h(sb_key), "Prefer": "return=minimal"}
        httpx.post(
            f"{SB_URL}/rest/v1/bors_priser",
            headers=h_min,
            json={"symbol": symbol, "pris": round(pris, 2), "volym": round(volym, 2)},
            timeout=8,
        )
    except Exception as e:
        print(f"  [logg_pris] {symbol}: {e}")


def agent_placera_ordrar(sb_key: str, agent_namn: str) -> list[dict]:
    """
    Heuristisk trading-logik per agent.
    Returnerar lista med lagda ordrar [{typ, symbol, pris, antal}].
    """
    # Standard-stil för okänd agent
    DEFAULT_STIL = {"aggressivitet": 0.4, "bias": "neutral", "risk": "medel"}
    stil = TRADING_STIL.get(agent_namn, DEFAULT_STIL)

    # Slumpmässigt hopp baserat på aggressivitet
    if random.random() > stil["aggressivitet"]:
        return []

    saldo    = hamta_saldo(sb_key, agent_namn)
    portfolj = hamta_portfolj(sb_key, agent_namn)

    # Välj symbol att handla
    pref_symboler = SYMBOL_PREFS.get(agent_namn, ["DBT"])
    # Filtrera till giltiga symboler
    pref_symboler = [s for s in pref_symboler if s in SYMBOLER]
    if not pref_symboler:
        pref_symboler = ["DBT"]
    symbol = pref_symboler[0]  # Föredragna symbolen

    # Hämta aktuellt pris
    aktuellt_pris = hamta_pris(sb_key, symbol)
    if aktuellt_pris <= 0:
        aktuellt_pris = 100.0

    # Bestäm typ (kop/salj) baserat på bias
    bias = stil["bias"]
    innehavet = portfolj.get(symbol, 0)

    if bias == "kop":
        typ = "kop" if random.random() < 0.75 else "salj"
    elif bias == "salj":
        typ = "salj" if random.random() < 0.75 else "kop"
    else:  # neutral
        typ = "kop" if random.random() < 0.5 else "salj"

    # Kan inte sälja utan innehav → byt till köp
    if typ == "salj" and innehavet <= 0:
        typ = "kop"

    # Bestäm antal baserat på riskprofil
    risk = stil["risk"]
    if risk == "lag":
        antal = random.randint(1, 2)
    elif risk == "hog":
        antal = random.randint(3, 6)
    else:  # medel
        antal = random.randint(2, 4)
    antal = float(antal)

    # Bestäm limitpris
    aggressivitet = stil["aggressivitet"]
    if typ == "kop":
        if aggressivitet > 0.6:
            # Aggressiv köpare: bjuder lite över marknadspris
            limit_pris = aktuellt_pris * (1 + random.uniform(0, 0.03))
        else:
            # Försiktig köpare: bjuder lite under
            limit_pris = aktuellt_pris * (1 - random.uniform(0.02, 0.07))
    else:  # salj
        if aggressivitet > 0.6:
            # Aggressiv säljare: säljer lite under marknad (snabbt)
            limit_pris = aktuellt_pris * (1 - random.uniform(0, 0.03))
        else:
            # Försiktig säljare: vill ha lite mer
            limit_pris = aktuellt_pris * (1 + random.uniform(0.02, 0.07))

    limit_pris = round(limit_pris, 2)
    if limit_pris < 0.01:
        limit_pris = 0.01

    # Kontrollera begränsningar
    if typ == "kop":
        kostnad = limit_pris * antal
        if saldo < kostnad:
            # Anpassa antal neråt
            max_antal = math.floor(saldo / limit_pris) if limit_pris > 0 else 0
            if max_antal <= 0:
                return []  # Har inte råd ens med 1 st
            antal = float(max_antal)
    else:  # salj
        if innehavet <= 0:
            return []  # Inget att sälja
        if antal > innehavet:
            antal = math.floor(innehavet)
            if antal <= 0:
                antal = innehavet  # Sälj hela (kan vara < 1)

    if antal <= 0:
        return []

    # Välj motivering
    if typ == "kop":
        mall = random.choice(KOP_MOTIVERINGAR)
    else:
        mall = random.choice(SALJ_MOTIVERINGAR)
    motivering = mall.format(symbol=symbol)

    # Lägg ordern
    order_id = lagg_order(sb_key, agent_namn, symbol, typ, limit_pris, antal, motivering)
    if order_id:
        return [{"typ": typ, "symbol": symbol, "pris": limit_pris, "antal": antal, "id": order_id}]
    return []


def hamta_mogna_stakes(sb_key: str) -> list[dict]:
    """Hämtar stakes vars slut_datum passerat och som ej betalats ut."""
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        url = (
            f"{SB_URL}/rest/v1/bors_staking"
            f"?utbetald=eq.false&slut_datum=lte.{today}"
            f"&select=id,agent,symbol,antal,apy,start_datum,slut_datum"
        )
        r = httpx.get(url, headers=_h(sb_key), timeout=10)
        return r.json() if r.is_success else []
    except Exception as e:
        print(f"  [hamta_mogna_stakes] {e}")
        return []


def betala_ut_staking(sb_key: str, stake: dict) -> None:
    """Betalar ut yield för en mogen stake och markerar den som utbetald."""
    try:
        pris = hamta_pris(sb_key, stake["symbol"])
        start = datetime.fromisoformat(stake["start_datum"])
        slut  = datetime.fromisoformat(stake["slut_datum"])
        dagar = max(1, (slut - start).days)
        yield_sek = round(float(stake["antal"]) * pris * float(stake["apy"]) * dagar / 365, 2)

        # Kreditera yield till agentens saldo
        agent_enc = urllib.parse.quote(stake["agent"])
        r_saldo = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{agent_enc}&select=saldo",
            headers=_h(sb_key), timeout=8,
        )
        saldo_ok = False
        if r_saldo.is_success and r_saldo.json():
            gammalt_saldo = float(r_saldo.json()[0]["saldo"])
            nytt_saldo = round(gammalt_saldo + yield_sek, 2)
            h_min = {**_h(sb_key), "Prefer": "return=minimal"}
            r_patch = httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{agent_enc}",
                headers=h_min,
                json={"saldo": nytt_saldo, "uppdaterad": "now()"},
                timeout=8,
            )
            saldo_ok = r_patch.is_success

        if not saldo_ok:
            print(f"  [betala_ut_staking] saldo-uppdatering misslyckades för {stake['agent']} — hoppar över utbetalning")
            return

        # Markera stake som utbetald (bara om saldo-krediteringen lyckades)
        h_min = {**_h(sb_key), "Prefer": "return=minimal"}
        httpx.patch(
            f"{SB_URL}/rest/v1/bors_staking?id=eq.{stake['id']}",
            headers=h_min,
            json={"utbetald": True},
            timeout=8,
        )
        print(f"  STAKING YIELD: {stake['agent']} +{yield_sek} kr ({stake['antal']} {stake['symbol']}, {dagar}d @ {float(stake['apy'])*100:.0f}%)")
    except Exception as e:
        print(f"  [betala_ut_staking] {e}")


def skapa_ny_stake(sb_key: str, agent: str, symbol: str, antal: float, dagar: int, apy: float) -> bool:
    """Skapar en ny staking-rad i databasen."""
    try:
        today = datetime.now(timezone.utc).date()
        slut  = today + timedelta(days=dagar)
        h_min = {**_h(sb_key), "Prefer": "return=minimal"}
        r = httpx.post(
            f"{SB_URL}/rest/v1/bors_staking",
            headers=h_min,
            json={
                "agent": agent,
                "symbol": symbol,
                "antal": round(antal, 4),
                "apy": apy,
                "start_datum": today.isoformat(),
                "slut_datum": slut.isoformat(),
                "utbetald": False,
            },
            timeout=10,
        )
        return r.is_success
    except Exception as e:
        print(f"  [skapa_ny_stake] {e}")
        return False


def kör_staking(sb_key: str) -> None:
    """Betalar ut mogna stakes och låter agenter staka nya tokens."""
    # 1. Betala ut mogna stakes
    mogna = hamta_mogna_stakes(sb_key)
    if mogna:
        print(f"  {len(mogna)} stakes löper ut — betalar ut yield...")
        for s in mogna:
            betala_ut_staking(sb_key, s)
    else:
        print("  Inga stakes att betala ut.")

    # 2. Ny staking per agent
    stakes_nya = 0

    # Hämta noterade symboler (bara dessa har ett pålitligt pris)
    try:
        r_tg = httpx.get(f"{SB_URL}/rest/v1/bors_tillgangar?select=symbol", headers=_h(sb_key), timeout=8)
        noterade_symboler = {row["symbol"] for row in r_tg.json()} if r_tg.is_success else set()
    except Exception:
        noterade_symboler = set()

    # Hämta aktiva stakes (utbetald=false) för att undvika dubbelstakning
    try:
        r_aktiva = httpx.get(
            f"{SB_URL}/rest/v1/bors_staking?utbetald=eq.false&select=agent,symbol,antal",
            headers=_h(sb_key), timeout=8,
        )
        aktiva_stakes = r_aktiva.json() if r_aktiva.is_success else []
    except Exception:
        aktiva_stakes = []
    # Bygg dict: {(agent, symbol): total_stakad}
    stakad = {}
    for s in aktiva_stakes:
        key = (s["agent"], s["symbol"])
        stakad[key] = stakad.get(key, 0) + float(s["antal"])

    agenter_lista = list(AGENTER)
    random.shuffle(agenter_lista)
    for agent_info in agenter_lista:
        agent_namn = agent_info["namn"]
        profil = STAKING_PROFIL.get(agent_namn, DEFAULT_STAKING)
        if random.random() > profil["sannolikhet"]:
            continue
        portfolj = hamta_portfolj(sb_key, agent_namn)
        if not portfolj:
            continue
        # Filtrera till noterade symboler med tillgängligt (ej stakad) saldo
        tillgangligt = {
            sym: max(0.0, antal - stakad.get((agent_namn, sym), 0))
            for sym, antal in portfolj.items()
            if sym in noterade_symboler
        }
        tillgangligt = {s: a for s, a in tillgangligt.items() if a >= 1}
        if not tillgangligt:
            continue
        # Välj symbol med störst tillgängligt saldo
        symbol = max(tillgangligt, key=lambda s: tillgangligt[s])
        innehavet = tillgangligt[symbol]
        if innehavet < 1:
            continue
        # Staka 25-50% av innehavet, minst 1
        andel = random.uniform(0.25, 0.50)
        antal = max(1.0, round(innehavet * andel, 4))
        dagar = random.randint(3, 7)
        apy   = profil["apy"]
        ok = skapa_ny_stake(sb_key, agent_namn, symbol, antal, dagar, apy)
        if ok:
            stakes_nya += 1
            print(f"  {agent_namn} STAKING: {antal} {symbol}, {dagar}d @ {apy*100:.0f}% APY")
    print(f"  Nya stakes: {stakes_nya}")


def kör_koalitions_airdrops(sb_key: str) -> None:
    """ICO-token-skapare airdroppar tokens till sina koalitionspartner."""
    try:
        # Hämta alla ICO-tokens med skapare
        r_tokens = httpx.get(
            f"{SB_URL}/rest/v1/agent_tokens?select=symbol,namn,skapare_agent&order=skapad.asc",
            headers=_h(sb_key), timeout=10,
        )
        if not r_tokens.is_success:
            return
        tokens = r_tokens.json()
        if not tokens:
            return

        # Hämta koalitioner
        r_koa = httpx.get(
            f"{SB_URL}/rest/v1/agent_koalitioner?select=agent_a,agent_b,styrka&order=styrka.desc",
            headers=_h(sb_key), timeout=10,
        )
        koalitioner = r_koa.json() if r_koa.is_success else []

        airdrops_gjorda = 0
        for token in tokens:
            if random.random() > 0.05:
                continue
            skapare = token["skapare_agent"]
            symbol  = token["symbol"]

            # Hitta skaparens koalitionspartner (topp 3)
            partners = []
            for k in koalitioner:
                if k["agent_a"] == skapare:
                    partners.append((k["agent_b"], k["styrka"]))
                elif k["agent_b"] == skapare:
                    partners.append((k["agent_a"], k["styrka"]))
            partners.sort(key=lambda x: x[1], reverse=True)
            partners = [p[0] for p in partners[:3]]
            if not partners:
                continue

            # Kolla skaparens innehav av denna symbol
            skapare_portfolj = hamta_portfolj(sb_key, skapare)
            skaparens_tokens = skapare_portfolj.get(symbol, 0)
            if skaparens_tokens < len(partners):
                continue

            # Bestäm airdrop-storlek per partner (strikt 5%-budget)
            budget = math.floor(skaparens_tokens * 0.05)
            if budget < len(partners):
                continue  # För lite tokens för att airdroppa till alla partner
            per_partner = min(10, math.floor(budget / len(partners)))

            h_min = {**_h(sb_key), "Prefer": "return=minimal"}
            h_upsert = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}

            for partner in partners:
                # Minska skaparens portfölj
                skapare_enc = urllib.parse.quote(skapare)
                sym_enc     = urllib.parse.quote(symbol)
                url_pf = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{skapare_enc}&symbol=eq.{sym_enc}"
                r_pf = httpx.get(url_pf, headers=_h(sb_key), timeout=8)
                if r_pf.is_success and r_pf.json():
                    gammalt = float(r_pf.json()[0].get("antal", 0))
                    nytt = max(0.0, gammalt - per_partner)
                    httpx.patch(url_pf, headers=h_min, json={"antal": nytt, "uppdaterad": "now()"}, timeout=8)

                # Addera till partners portfölj
                partner_enc = urllib.parse.quote(partner)
                url_pp = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{partner_enc}&symbol=eq.{sym_enc}"
                r_pp = httpx.get(url_pp, headers=_h(sb_key), timeout=8)
                if r_pp.is_success and r_pp.json():
                    gammalt_p = float(r_pp.json()[0].get("antal", 0))
                    httpx.patch(url_pp, headers=h_min, json={"antal": gammalt_p + per_partner, "uppdaterad": "now()"}, timeout=8)
                else:
                    httpx.post(
                        f"{SB_URL}/rest/v1/bors_portfoljer?on_conflict=agent,symbol",
                        headers=h_upsert,
                        json={"agent": partner, "symbol": symbol, "antal": float(per_partner), "genomsnittspris": 0, "uppdaterad": "now()"},
                        timeout=8,
                    )
                print(f"  AIRDROP: {skapare} → {partner} +{per_partner} {symbol}")

            airdrops_gjorda += 1
            spara_civilisations_minne(
                sb_key,
                typ="triumf",
                rubrik=f"Airdrop: {skapare} delar ut {symbol}",
                beskrivning=(
                    f"{skapare} genomför en koalitionsairdrop — delar ut {per_partner} {symbol} "
                    f"vardera till {len(partners)} partner: {', '.join(partners)}."
                ),
                agenter=[skapare] + partners,
                relaterat_typ="agent_tokens",
            )

        if airdrops_gjorda:
            print(f"  {airdrops_gjorda} koalitionsairdrop(s) genomförda.")
        else:
            print("  Inga airdrops denna körning.")

    except Exception as e:
        print(f"  [kör_koalitions_airdrops] {e}")


def lagg_market_maker_ordrar(sb_key: str, agent: str, symbol: str, tighthet: float) -> bool:
    """
    Lägger en köporder och en säljorder symmetriskt runt spotpriset.
    Returnerar True om båda ordrar lades framgångsrikt.
    """
    spot = hamta_pris(sb_key, symbol)
    if spot <= 0:
        return False

    saldo    = hamta_saldo(sb_key, agent)
    portfolj = hamta_portfolj(sb_key, agent)

    antal     = 1.0  # Litet belopp — market makers är nöjda med tunn volym
    kop_pris  = round(spot * (1 - tighthet), 2)
    salj_pris = round(spot * (1 + tighthet), 2)

    if saldo < kop_pris * antal:
        return False
    if portfolj.get(symbol, 0) < antal:
        return False

    kop_id  = lagg_order(sb_key, agent, symbol, "kop",  kop_pris,  antal, "market making — likviditet")
    salj_id = lagg_order(sb_key, agent, symbol, "salj", salj_pris, antal, "market making — likviditet")
    return kop_id is not None and salj_id is not None


def kör_amm(sb_key: str, alla_symboler: list[str]) -> None:
    """
    Automatisk Market Maker — garanterar minst AMM_MIN_ORDERS ordrar per sida
    för varje noterad symbol.  Körs som första handlingssteg så att agenter
    alltid har något att handla mot.

    Logik per körning:
    1. Avbryt egna AMM-ordrar äldre än 6h (prisen är inaktuella)
    2. Räkna kvarvarande öppna ordrar per symbol/sida
    3. Fyll på token-inventariet om det sjunker under AMM_REFILL_TROSKEL
    4. Lägg bid @ spot*(1-AMM_SPREAD) och/eller ask @ spot*(1+AMM_SPREAD)
       när antalet ordrar underskrider AMM_MIN_ORDERS
    """
    h     = _h(sb_key)
    h_min = {**h, "Prefer": "return=minimal"}
    amm_enc = urllib.parse.quote("Börskassan")

    # 1. Avbryt gamla Börskassan-ordrar (>6h)
    cutoff_amm = (datetime.now(timezone.utc) - timedelta(hours=6)).strftime("%Y-%m-%dT%H:%M:%SZ")
    r_old = httpx.get(
        f"{SB_URL}/rest/v1/bors_ordrar"
        f"?agent=eq.{amm_enc}&status=in.(öppen,delvis)"
        f"&skapad=lt.{urllib.parse.quote(cutoff_amm)}&select=id",
        headers=h, timeout=8,
    )
    cancelled = 0
    if r_old.is_success:
        for row in r_old.json():
            r = httpx.patch(
                f"{SB_URL}/rest/v1/bors_ordrar?id=eq.{row['id']}",
                headers=h_min, json={"status": "avbruten"}, timeout=6,
            )
            if r.is_success:
                cancelled += 1
    if cancelled:
        print(f"  AMM: avbröt {cancelled} inaktuella ordrar")

    # 2. Räkna öppna ordrar per symbol och sida
    r_ord = httpx.get(
        f"{SB_URL}/rest/v1/bors_ordrar?status=in.(öppen,delvis)&select=symbol,typ",
        headers=h, timeout=8,
    )
    ordrar = r_ord.json() if r_ord.is_success else []
    bid_count: dict[str, int] = {}
    ask_count: dict[str, int] = {}
    for o in ordrar:
        sym = o["symbol"]
        if o["typ"] == "kop":
            bid_count[sym] = bid_count.get(sym, 0) + 1
        else:
            ask_count[sym] = ask_count.get(sym, 0) + 1

    # 3. Börskassans saldo och token-portfölj
    amm_saldo = hamta_saldo(sb_key, "Börskassan")

    r_portf = httpx.get(
        f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{amm_enc}&select=symbol,antal",
        headers=h, timeout=8,
    )
    portfölj: dict[str, float] = {}
    if r_portf.is_success:
        for row in r_portf.json():
            portfölj[row["symbol"]] = float(row["antal"])

    placed = 0
    for symbol in alla_symboler:
        spot = _hamta_spotpris(sb_key, symbol)
        if not spot:
            continue

        sym_enc = urllib.parse.quote(symbol)

        # Auto-refill: om inventariet är lågt fyller Börskassan på från "börskassan"
        if portfölj.get(symbol, 0) < AMM_REFILL_TROSKEL:
            h_ups = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}
            httpx.post(
                f"{SB_URL}/rest/v1/bors_portfoljer?on_conflict=agent,symbol",
                headers=h_ups,
                json={
                    "agent":          "Börskassan",
                    "symbol":         symbol,
                    "antal":          AMM_REFILL_ANTAL,
                    "genomsnittspris": round(spot, 2),
                    "uppdaterad":     "now()",
                },
                timeout=8,
            )
            portfölj[symbol] = AMM_REFILL_ANTAL
            print(f"  AMM: påfyllning {symbol} → {AMM_REFILL_ANTAL:.0f} tokens")

        bid_pris = round(spot * (1 - AMM_SPREAD), 2)
        ask_pris = round(spot * (1 + AMM_SPREAD), 2)

        # Lägg bids tills vi nått AMM_MIN_ORDERS (loop för att fylla hela gapet)
        bids_kvar = max(0, AMM_MIN_ORDERS - bid_count.get(symbol, 0))
        for _ in range(bids_kvar):
            budget = round(AMM_ANTAL * bid_pris, 2)
            if amm_saldo < budget:
                break
            r = httpx.post(
                f"{SB_URL}/rest/v1/bors_ordrar",
                headers=h_min,
                json={
                    "agent":        "Börskassan",
                    "symbol":       symbol,
                    "typ":          "kop",
                    "pris":         bid_pris,
                    "antal":        AMM_ANTAL,
                    "ifylld_antal": 0,
                    "status":       "öppen",
                    "motivering":   "AMM — garanterad likviditet",
                },
                timeout=8,
            )
            if r.is_success:
                amm_saldo -= budget
                placed += 1
                print(f"  AMM BID  {symbol}: {AMM_ANTAL:.0f}st @ {bid_pris:.2f} kr")

        # Lägg asks tills vi nått AMM_MIN_ORDERS (loop för att fylla hela gapet)
        asks_kvar = max(0, AMM_MIN_ORDERS - ask_count.get(symbol, 0))
        for _ in range(asks_kvar):
            if portfölj.get(symbol, 0) < AMM_ANTAL:
                break
            r = httpx.post(
                f"{SB_URL}/rest/v1/bors_ordrar",
                headers=h_min,
                json={
                    "agent":        "Börskassan",
                    "symbol":       symbol,
                    "typ":          "salj",
                    "pris":         ask_pris,
                    "antal":        AMM_ANTAL,
                    "ifylld_antal": 0,
                    "status":       "öppen",
                    "motivering":   "AMM — garanterad likviditet",
                },
                timeout=8,
            )
            if r.is_success:
                portfölj[symbol] = portfölj.get(symbol, 0) - AMM_ANTAL
                placed += 1
                print(f"  AMM ASK  {symbol}: {AMM_ANTAL:.0f}st @ {ask_pris:.2f} kr")

    print(f"  AMM: {placed} nya ordrar lagda")


def kör_market_maker_ordrar(sb_key: str) -> int:
    """
    Låter agenter med MM-profil lägga tvåsidiga likviditetsordrar.
    Returnerar antal agenter som la ordrar.
    """
    mm_count = 0
    agenter_lista = list(AGENTER)
    random.shuffle(agenter_lista)
    for agent_info in agenter_lista:
        agent_namn = agent_info["namn"]
        profil = MARKET_MAKER_PROFIL.get(agent_namn)
        if not profil:
            continue
        if random.random() > profil["sannolikhet"]:
            continue
        # Välj helst agentens föredragna symbol, annars DBT
        pref = SYMBOL_PREFS.get(agent_namn, ["DBT"])
        pref = [s for s in pref if s in SYMBOLER]
        symbol = pref[0] if pref else "DBT"
        ok = lagg_market_maker_ordrar(sb_key, agent_namn, symbol, profil["tighthet"])
        if ok:
            mm_count += 1
            spot = hamta_pris(sb_key, symbol)
            print(
                f"  {agent_namn}: MM {symbol} "
                f"köp @ {round(spot*(1-profil['tighthet']),2)} / "
                f"sälj @ {round(spot*(1+profil['tighthet']),2)} kr"
            )
    return mm_count


def kör_liquidity_mining(sb_key: str) -> None:
    """
    Belönar agenter som bidrar med likviditet — har öppna köp- och säljordrar
    inom ±LIKVIDITET_SPANN av spotpriset för samma symbol. Betalar ut
    LIKVIDITET_BELOPP SEK per kvalificerande (agent, symbol)-par och
    loggar till bors_liquidity_log.
    """
    # Hämta alla öppna ordrar
    try:
        url = f"{SB_URL}/rest/v1/bors_ordrar?status=in.(öppen,delvis)&select=agent,symbol,typ,pris"
        r = httpx.get(url, headers=_h(sb_key), timeout=10)
        aktiva = r.json() if r.is_success else []
    except Exception as e:
        print(f"  [kör_liquidity_mining] hämta ordrar: {e}")
        return

    # Hämta spotpriser
    try:
        r_tg = httpx.get(
            f"{SB_URL}/rest/v1/bors_tillgangar?select=symbol,senaste_pris",
            headers=_h(sb_key), timeout=8,
        )
        spot_map = {t["symbol"]: float(t["senaste_pris"] or 100) for t in r_tg.json()} if r_tg.is_success else {}
    except Exception:
        spot_map = {}

    # Bästa köp- och säljpris per (agent, symbol)
    bud_map: dict[tuple, float] = {}   # (agent, symbol) → högsta köppris
    ask_map: dict[tuple, float] = {}   # (agent, symbol) → lägsta säljpris

    for o in aktiva:
        key  = (o["agent"], o["symbol"])
        pris = float(o["pris"] or 0)
        if o["typ"] == "kop":
            bud_map[key] = max(bud_map.get(key, 0.0), pris)
        elif o["typ"] == "salj":
            ask_map[key] = min(ask_map.get(key, float("inf")), pris)

    # Hitta kvalificerande par
    kvalar: list[tuple[str, str, float]] = []  # (agent, symbol, spread_pct)
    for key in bud_map:
        if key not in ask_map:
            continue
        agent, symbol = key
        spot = spot_map.get(symbol, 0.0)
        if spot <= 0:
            continue
        bud = bud_map[key]
        ask = ask_map[key]
        if bud < spot * (1 - LIKVIDITET_SPANN):
            continue
        if ask > spot * (1 + LIKVIDITET_SPANN):
            continue
        if ask <= bud:
            continue  # Korsad orderbok — ska ej förekomma efter matching
        spread_pct = round((ask - bud) / spot * 100, 2)
        kvalar.append((agent, symbol, spread_pct))

    if not kvalar:
        print("  Inga kvalificerande market makers denna körning.")
        return

    print(f"  {len(kvalar)} MM-par → {LIKVIDITET_BELOPP} kr/par")

    # Aggregera per agent och betala ut
    agent_pairs: dict[str, list[tuple[str, float]]] = {}
    for agent, symbol, spread_pct in kvalar:
        agent_pairs.setdefault(agent, []).append((symbol, spread_pct))

    h_min = {**_h(sb_key), "Prefer": "return=minimal"}

    for agent, pairs in agent_pairs.items():
        total = round(LIKVIDITET_BELOPP * len(pairs), 2)
        agent_enc = urllib.parse.quote(agent)

        r_sal = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{agent_enc}&select=saldo",
            headers=_h(sb_key), timeout=8,
        )
        if not r_sal.is_success or not r_sal.json():
            continue

        nytt_saldo = round(float(r_sal.json()[0]["saldo"]) + total, 2)
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{agent_enc}",
            headers=h_min,
            json={"saldo": nytt_saldo, "uppdaterad": "now()"},
            timeout=8,
        )

        for symbol, spread_pct in pairs:
            try:
                httpx.post(
                    f"{SB_URL}/rest/v1/bors_liquidity_log",
                    headers=h_min,
                    json={"agent": agent, "symbol": symbol, "beloning": LIKVIDITET_BELOPP, "spread_pct": spread_pct},
                    timeout=8,
                )
            except Exception:
                pass

        syms = ", ".join(s for s, _ in pairs)
        print(f"  LIQUIDITY MINING: {agent} +{total} kr ({syms})")


# ─── Korta positioner ─────────────────────────────────────────────────────────

def _hamta_spotpris(sb_key: str, symbol: str) -> float | None:
    """Hämtar aktuellt spotpris för en symbol."""
    try:
        sym_enc = urllib.parse.quote(symbol)
        r = httpx.get(
            f"{SB_URL}/rest/v1/bors_tillgangar?symbol=eq.{sym_enc}&select=senaste_pris",
            headers=_h(sb_key), timeout=6,
        )
        if r.is_success and r.json():
            return float(r.json()[0]["senaste_pris"])
    except Exception:
        pass
    return None


def öppna_short(sb_key: str, agent: str, symbol: str, antal: float) -> bool:
    """
    Öppnar en kort position via atomisk RPC (open_short_rpc):
    - Kontrollerar saldo och skapar short-rad i samma transaktion
    - Nettokostnad: 50 % av positionsvärdet (collateral - försäljningsintäkt)
    """
    spot = _hamta_spotpris(sb_key, symbol)
    if not spot:
        return False

    position_kr   = round(antal * spot, 2)
    collateral_kr = round(position_kr * SHORT_COLLATERAL, 2)
    netto_kostnad = round(collateral_kr - position_kr, 2)  # 50 % av position

    r = httpx.post(
        f"{SB_URL}/rest/v1/rpc/open_short_rpc",
        headers=_h(sb_key),
        json={
            "p_agent":         agent,
            "p_symbol":        symbol,
            "p_antal":         round(antal, 4),
            "p_ingangs_pris":  round(spot, 2),
            "p_collateral_kr": collateral_kr,
            "p_netto_kostnad": netto_kostnad,
            "p_daglig_avgift": SHORT_DAGLIG_AVGIFT,
        },
        timeout=10,
    )
    if not r.is_success:
        print(f"  SHORT MISSLYCKAD (rpc): {agent} {symbol} — {r.status_code}")
        return False

    result = r.json()
    if not result.get("ok"):
        print(f"  SHORT MISSLYCKAD: {agent} {symbol} — {result.get('error')}")
        return False

    print(f"  SHORT ÖPPNAD: {agent} shortar {antal} {symbol} @ {spot:.2f} kr (collateral {collateral_kr:.0f} kr)")
    return True


def stang_short(sb_key: str, short: dict, anledning: str = "frivillig") -> None:
    """
    Stänger en kort position via atomisk RPC (close_short_rpc):
    - Markerar short-raden som stängd och frigör collateral i samma transaktion
    """
    spot = _hamta_spotpris(sb_key, short["symbol"])
    if not spot:
        return

    antal         = float(short["antal"])
    ingangs_pris  = float(short["ingangs_pris"])
    collateral_kr = float(short["collateral_kr"])
    aterköps_kr   = round(antal * spot, 2)
    pl            = round((ingangs_pris - spot) * antal, 2)  # positivt = vinst
    saldo_delta   = round(collateral_kr - aterköps_kr, 2)
    status        = "likviderad" if anledning == "likvidation" else "stangd"

    r = httpx.post(
        f"{SB_URL}/rest/v1/rpc/close_short_rpc",
        headers=_h(sb_key),
        json={
            "p_short_id":      short["id"],
            "p_status":        status,
            "p_vinst_forlust": pl,
            "p_saldo_delta":   saldo_delta,
        },
        timeout=10,
    )
    if not r.is_success:
        print(f"  SHORT STÄNGNING MISSLYCKAD (rpc): {short['agent']} {short['symbol']} — {r.status_code}")
        return

    result = r.json()
    if not result.get("ok"):
        print(f"  SHORT STÄNGNING MISSLYCKAD: {short['agent']} {short['symbol']} — {result.get('error')}")
        return

    pl_str = f"+{pl:.2f}" if pl >= 0 else f"{pl:.2f}"
    print(f"  SHORT STÄNGD ({anledning}): {short['agent']} {short['symbol']} P&L {pl_str} kr")


def kör_shorts(sb_key: str, alla_symboler: list[str]) -> None:
    """
    Per körning:
    1. Dra daglig avgift på öppna shorts → Börskassan
    2. Likvidera positioner med för stor förlust
    3. Stäng positioner med bra vinst (take profit)
    4. Öppna nya shorts med viss sannolikhet
    """
    h = _h(sb_key)
    h_min = {**h, "Prefer": "return=minimal"}

    # ── Hämta alla öppna shorts ───────────────────────────────────────────────
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/bors_shorts?status=eq.öppen&select=*",
            headers=h, timeout=8,
        )
        öppna = r.json() if r.is_success else []
    except Exception:
        öppna = []

    # ── 1. Daglig avgift ─────────────────────────────────────────────────────
    total_avgifter = 0.0
    for s in öppna:
        avgift = round(float(s["collateral_kr"]) * SHORT_DAGLIG_AVGIFT / 100, 2)
        if avgift <= 0:
            continue
        agent_enc = urllib.parse.quote(s["agent"])
        saldo = hamta_saldo(sb_key, s["agent"])
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{agent_enc}",
            headers=h_min,
            json={"saldo": max(0.0, round(saldo - avgift, 2)), "uppdaterad": "now()"},
            timeout=8,
        )
        total_avgifter += avgift

    if total_avgifter > 0:
        bk_saldo = hamta_saldo(sb_key, "Börskassan")
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.B%C3%B6rskassan",
            headers=h_min,
            json={"saldo": round(bk_saldo + total_avgifter, 2), "uppdaterad": "now()"},
            timeout=8,
        )

    # ── 2 & 3. Likvidering och take-profit ───────────────────────────────────
    for s in öppna:
        spot = _hamta_spotpris(sb_key, s["symbol"])
        if not spot:
            continue
        antal        = float(s["antal"])
        ingangs_pris = float(s["ingangs_pris"])
        collateral   = float(s["collateral_kr"])
        förlust      = max(0.0, (spot - ingangs_pris) * antal)  # positivt om pris gått upp
        vinst        = max(0.0, (ingangs_pris - spot) * antal)

        if förlust >= collateral * SHORT_LIQ_TROSKEL:
            stang_short(sb_key, s, "likvidation")
        elif vinst >= 0.30 * ingangs_pris * antal:  # +30 % vinst = ta hem
            stang_short(sb_key, s, "take-profit")
        elif random.random() < 0.10:  # 10 % chans att stänga frivilligt
            stang_short(sb_key, s, "frivillig")

    # ── 4. Öppna nya shorts ──────────────────────────────────────────────────
    for agent, profil in SHORT_PROFIL.items():
        if random.random() > profil["sannolikhet"]:
            continue

        # Välj symbol
        kandidater = profil["symboler"] or [s for s in alla_symboler if s in ("DBT", "NOVA", "ETK")]
        kandidater = [s for s in kandidater if s in alla_symboler]
        if not kandidater:
            continue
        symbol = random.choice(kandidater)

        # Välj antal (1 till max)
        antal = random.randint(1, profil["max_antal"])
        öppna_short(sb_key, agent, symbol, antal)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    sb_key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas.")
        sys.exit(1)

    print("=" * 60)
    print("KRYPTOBÖRSEN – debatt.ai intern börs")
    print(f"Kör: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)

    # Avbryt gamla ordrar (>48h)
    print("\n[1/10] Avbryter gamla ordrar...")
    avbryt_gamla_ordrar(sb_key)

    # Genesis (körs bara om börsen är tom)
    print("\n[2/10] Kontrollerar genesis...")
    genesis(sb_key)

    # Hämta alla symboler tidigt (behövs av AMM och resten)
    try:
        r_sym = httpx.get(
            f"{SB_URL}/rest/v1/bors_tillgangar?select=symbol&order=symbol.asc",
            headers=_h(sb_key), timeout=8,
        )
        alla_symboler = [t["symbol"] for t in r_sym.json()] if r_sym.is_success and r_sym.json() else SYMBOLER
    except Exception:
        alla_symboler = SYMBOLER

    # AMM — garantera tvåsidig likviditet för alla symboler
    print(f"\n[3/10] AMM — garanterar likviditet ({', '.join(alla_symboler)})...")
    kör_amm(sb_key, alla_symboler)

    # Agenter placerar ordrar
    print(f"\n[4/10] {len(AGENTER)} agenter placerar ordrar...")
    agenter_lista = list(AGENTER)
    random.shuffle(agenter_lista)

    stats_kop  = 0
    stats_salj = 0
    stats_skip = 0

    for agent_info in agenter_lista:
        agent_namn = agent_info["namn"]
        try:
            ordrar = agent_placera_ordrar(sb_key, agent_namn)
            for o in ordrar:
                if o["typ"] == "kop":
                    stats_kop += 1
                    print(f"  {agent_namn}: KÖP {o['antal']} {o['symbol']} @ {o['pris']} kr")
                else:
                    stats_salj += 1
                    print(f"  {agent_namn}: SÄLJ {o['antal']} {o['symbol']} @ {o['pris']} kr")
            if not ordrar:
                stats_skip += 1
        except Exception as e:
            print(f"  {agent_namn}: FEL – {e}")
            stats_skip += 1

    print(f"\n  Ordrar: {stats_kop} köp, {stats_salj} sälj, {stats_skip} pass")

    # Market maker-ordrar (tvåsidiga likviditetsordrar)
    print("\n[5/10] Market maker-ordrar...")
    mm_count = kör_market_maker_ordrar(sb_key)
    print(f"  {mm_count} agenter la MM-ordrar.")

    # Matcha ordrar per symbol
    print("\n[6/10] Matchar ordrar...")
    total_affarer = 0
    total_volym   = 0.0

    print(f"  Symboler att matcha: {', '.join(alla_symboler)}")

    for symbol in alla_symboler:
        print(f"\n  {symbol}:")
        aktuellt_pris = hamta_pris(sb_key, symbol)
        affarer = matcha_ordrar(sb_key, symbol)
        total_affarer += len(affarer)

        symbol_volym = 0.0
        for affar in affarer:
            volym_kr = affar["volym_kr"]
            symbol_volym += volym_kr
            total_volym   += volym_kr

            # Spara till civilisationsminnet för stora affärer (>= 100 kr)
            if volym_kr >= 100:
                typ_minne = "marknadsseger"
                rubrik = f"Stor börsaffär: {affar['kop_agent']} köper {affar['symbol']}"
                beskrivning = (
                    f"{affar['kop_agent']} köper {affar['antal']} {affar['symbol']} "
                    f"av {affar['salj_agent']} för {volym_kr} kr "
                    f"@ {affar['pris']} kr/st på den interna börsen."
                )
                spara_civilisations_minne(
                    sb_key,
                    typ=typ_minne,
                    rubrik=rubrik,
                    beskrivning=beskrivning,
                    agenter=[affar["kop_agent"], affar["salj_agent"]],
                    relaterat_typ="bors_affarer",
                )

        if affarer:
            senaste_pris = affarer[-1]["pris"]
            logg_pris(sb_key, symbol, senaste_pris, symbol_volym)
            print(f"    {len(affarer)} affärer, volym {symbol_volym:.2f} kr, senaste pris {senaste_pris:.2f} kr")
        else:
            # Logga aktuellt pris även om inga affärer
            logg_pris(sb_key, symbol, aktuellt_pris, 0.0)
            print(f"    Inga matchningar (pris: {aktuellt_pris:.2f} kr)")

    # Liquidity mining-belöningar (beräknas på kvarvarande öppna ordrar)
    print("\n[7/10] Liquidity mining-belöningar...")
    kör_liquidity_mining(sb_key)

    # Korta positioner
    print("\n[8/10] Korta positioner (avgift, likvidering, nya)...")
    kör_shorts(sb_key, alla_symboler)

    # Staking
    print("\n[9/10] Staking — yield och nya stakes...")
    kör_staking(sb_key)

    # Koalitionsairdrops
    print("\n[10/10] Koalitionsairdrops...")
    kör_koalitions_airdrops(sb_key)

    # Sammanfattning
    print("\n" + "=" * 60)
    print("SAMMANFATTNING")
    print(f"  Köpordrar lagda:    {stats_kop}")
    print(f"  Säljordrar lagda:   {stats_salj}")
    print(f"  Pass (ej aktiva):   {stats_skip}")
    print(f"  Genomförda affärer: {total_affarer}")
    print(f"  Total handelsvolym: {total_volym:.2f} kr")
    print("=" * 60)
    print("Klar.")


if __name__ == "__main__":
    main()
