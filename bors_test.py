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

    h_min = {**_h(sb_key), "Prefer": "return=minimal"}

    # 1. Spara affären
    try:
        affar_payload = {
            "symbol": symbol,
            "kop_order_id": kop_order["id"],
            "salj_order_id": salj_order["id"],
            "kop_agent": kop_agent,
            "salj_agent": salj_agent,
            "pris": round(pris, 2),
            "antal": round(antal, 4),
        }
        r = httpx.post(f"{SB_URL}/rest/v1/bors_affarer", headers=h_min, json=affar_payload, timeout=10)
        if not r.is_success:
            print(f"  [execute_trade] spara affar: {r.status_code}")
            return False
    except Exception as e:
        print(f"  [execute_trade] affar-exception: {e}")
        return False

    # 2. Dra saldo från köparen
    try:
        kop_saldo = hamta_saldo(sb_key, kop_agent)
        nytt_kop_saldo = round(kop_saldo - total_kr, 2)
        if nytt_kop_saldo < 0:
            nytt_kop_saldo = 0.0
        kop_enc = urllib.parse.quote(kop_agent)
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{kop_enc}",
            headers=h_min,
            json={"saldo": nytt_kop_saldo, "uppdaterad": "now()"},
            timeout=8,
        )
    except Exception as e:
        print(f"  [execute_trade] saldo kop: {e}")

    # 3. Addera saldo till säljaren
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
    print("\n[1/4] Avbryter gamla ordrar...")
    avbryt_gamla_ordrar(sb_key)

    # Genesis (körs bara om börsen är tom)
    print("\n[2/4] Kontrollerar genesis...")
    genesis(sb_key)

    # Agenter placerar ordrar
    print(f"\n[3/4] {len(AGENTER)} agenter placerar ordrar...")
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

    # Matcha ordrar per symbol
    print("\n[4/4] Matchar ordrar...")
    total_affarer = 0
    total_volym   = 0.0

    for symbol in SYMBOLER:
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
