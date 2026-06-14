"""
hedgefond_test.py – Hedgefonder med poolat agent-kapital

Fyra fonder:
  ALPHA  (Kryptoanalytiker) – aggressiv momentum
  MACRO  (Nationalekonom)   – konservativ makro
  QUANT  (Teknikoptimist)   – självlärande, LLM justerar strategi varje körning
  STRAT  (Historiker)       – algoritmisk, ingen LLM, bästa backtest-strategi direkt

Flöde per körning:
  1. Hämta fonddata + NAV per fond
  2. Investeringsrunda: agenter investerar i fonder (~10% chans)
  3. Uttagsrunda: agenter tar ut vinst (~5% chans om P&L > 10%)
  4. QUANT: fråga LLM om handelsstrategi baserat på prestandahistorik
  5. ALPHA/MACRO/QUANT lägger ordrar på börsen (via bors_ordrar)
  6. Uppdatera NAV och spara snapshot i hedgefond_nav_historik
  7. QUANT paper trading mot riktiga marknadsdata
  8. STRAT paper trading — ren MA+volym-signal från backtest_resultat

Kör via GitHub Actions (.github/workflows/hedgefond-test.yml) dagligen 11:00 svensk tid.
"""

import os
import sys
import random
import math
import json
import urllib.parse
from datetime import datetime, timezone, timedelta

import httpx

from agenter import AGENTER
from supabase_utils import SB_URL, spara_civilisations_minne, kolla_och_bailout, kop_etf, salj_etf
from ai_klient import groq_post, gemini_post, github_models_post

# ─── Konstanter ───────────────────────────────────────────────────────────────

FONDER = {
    "ALPHA": {
        "förvaltare": "Kryptoanalytiker",
        "strategi": "aggressiv",
        "symboler": ["NOVA", "DBT"],
        "aggressivitet": 0.85,
    },
    "MACRO": {
        "förvaltare": "Nationalekonom",
        "strategi": "konservativ",
        "symboler": ["ETK", "DBT"],
        "aggressivitet": 0.35,
    },
    "QUANT": {
        "förvaltare": "Teknikoptimist",
        "strategi": "kvant",
        "symboler": ["DBT", "NOVA", "ETK"],
        "aggressivitet": 0.60,  # Justeras av LLM
    },
}

# Crypto-ETF-allokering per fond (andel av totalt kapital)
FOND_CRYPTO = {
    "ALPHA": {"andel": 0.20, "symboler": ["BTC", "ETH", "SOL"]},   # Aggressiv: 20%, valfri crypto
    "MACRO": {"andel": 0.05, "symboler": ["BTC"]},                  # Konservativ: 5%, bara BTC
    "QUANT": {"andel": None, "symboler": ["BTC", "ETH", "SOL", "XRP", "BNB"]},  # LLM beslutar
    # STRAT hanteras helt av kör_strat_paper_trading() — inte i FONDER
}

# Investeringsbelopp i SEK
MIN_INVESTERING = 100
MAX_INVESTERING = 200

# ─── HTTP-hjälpare ────────────────────────────────────────────────────────────

def _h(sb_key: str) -> dict:
    return {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _llm(system: str, prompt: str, max_tokens: int = 200) -> str:
    """LLM-anrop med fallback."""
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.5,
    }
    for fn in [
        lambda: groq_post(payload).json()["choices"][0]["message"]["content"].strip(),
        lambda: gemini_post(system, prompt, max_tokens=max_tokens),
        lambda: github_models_post(payload).json()["choices"][0]["message"]["content"].strip(),
    ]:
        try:
            result = fn()
            if result:
                return result
        except Exception:
            continue
    return ""

# ─── Supabase-anrop ──────────────────────────────────────────────────────────

def hamta_fond(sb_key: str, symbol: str) -> dict | None:
    try:
        url = f"{SB_URL}/rest/v1/hedgefonder?symbol=eq.{urllib.parse.quote(symbol)}&select=*"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return r.json()[0]
    except Exception as e:
        print(f"  [hamta_fond] {symbol}: {e}")
    return None


def hamta_investerare(sb_key: str, fond_id: int) -> list[dict]:
    try:
        url = f"{SB_URL}/rest/v1/hedgefond_investerare?fond_id=eq.{fond_id}&select=*"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success:
            return r.json()
    except Exception as e:
        print(f"  [hamta_investerare] fond {fond_id}: {e}")
    return []


def hamta_agent_investering(sb_key: str, fond_id: int, agent: str) -> dict | None:
    try:
        a_enc = urllib.parse.quote(agent)
        url = f"{SB_URL}/rest/v1/hedgefond_investerare?fond_id=eq.{fond_id}&agent=eq.{a_enc}&select=*"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return r.json()[0]
    except Exception as e:
        print(f"  [hamta_agent_investering] {agent}: {e}")
    return None


def hamta_saldo(sb_key: str, agent: str) -> float:
    try:
        url = f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent)}&select=saldo"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return float(r.json()[0].get("saldo", 0))
    except Exception as e:
        print(f"  [hamta_saldo] {agent}: {e}")
    return 0.0


def uppdatera_saldo(sb_key: str, agent: str, nytt_saldo: float) -> None:
    try:
        h_min = {**_h(sb_key), "Prefer": "return=minimal"}
        url = f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent)}"
        httpx.patch(url, headers=h_min, json={"saldo": round(nytt_saldo, 2), "uppdaterad": "now()"}, timeout=8)
    except Exception as e:
        print(f"  [uppdatera_saldo] {agent}: {e}")


VERCEL_URL = "https://www.debatt-ai.se"

# Pris-cache per körning — fylls av hamta_krypto_priser()
_PRIS_CACHE: dict[str, float] = {}


def hamta_krypto_priser(sb_key: str, symboler: list[str]) -> None:
    """
    Hämtar aktuella kryptovalutapriser via Vercel-endpointen /api/krypto-priser.
    Vercel kan nå Binance; GitHub Actions kan nå Vercel via HTTPS.
    Fyller _PRIS_CACHE för användning i kop_etf_fond().
    """
    sym_str = ",".join(symboler)
    try:
        r = httpx.get(
            f"{VERCEL_URL}/api/krypto-priser?symboler={sym_str}",
            timeout=15,
        )
        if r.is_success:
            data = r.json()
            for sym, pris in data.get("priser", {}).items():
                _PRIS_CACHE[sym] = float(pris)
                src = data.get("status", {}).get(sym, "?")
                print(f"  [pris] {sym}: {pris:.2f} USD ({src})")
            return
        print(f"  [krypto-priser] Vercel svarade {r.status_code} — faller tillbaka på ohlcv_cache")
    except Exception as e:
        print(f"  [krypto-priser] {e} — faller tillbaka på ohlcv_cache")

    # Fallback: läs direkt från ohlcv_cache om Vercel inte svarar
    for sym in symboler:
        if sym in _PRIS_CACHE:
            continue
        try:
            r2 = httpx.get(
                f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{urllib.parse.quote(sym)}"
                "&order=datum.desc&limit=1&select=pris,datum",
                headers=_h(sb_key), timeout=8,
            )
            if r2.is_success and r2.json():
                pris = float(r2.json()[0]["pris"])
                datum = r2.json()[0]["datum"]
                _PRIS_CACHE[sym] = pris
                print(f"  [pris] {sym}: {pris:.2f} USD (ohlcv_cache {datum})")
        except Exception as e2:
            print(f"  [ohlcv_cache] {sym}: {e2}")


def kop_etf_fond(sb_key: str, fond_symbol: str, crypto_symbol: str, belopp_kr: float) -> bool:
    """Köper krypto-ETF direkt för en fond. Använder priser från _PRIS_CACHE."""
    if belopp_kr <= 0:
        return False
    pris_usd = _PRIS_CACHE.get(crypto_symbol)
    if not pris_usd:
        print(f"  [kop_etf_fond] {crypto_symbol}: inget pris i cache")
        return False

    h = {**_h(sb_key), "Content-Type": "application/json", "Prefer": "return=minimal"}
    idag = datetime.now(timezone.utc).date().isoformat()

    # Hämta befintligt innehav
    ih_r = httpx.get(
        f"{SB_URL}/rest/v1/agent_etf_innehav"
        f"?agent=eq.{urllib.parse.quote(fond_symbol)}&symbol=eq.{crypto_symbol}"
        "&select=investerat_kr,kopt_pris_usd",
        headers=_h(sb_key), timeout=8,
    )
    innehav = ih_r.json() if ih_r.is_success else []

    try:
        if innehav:
            old_inv  = float(innehav[0]["investerat_kr"])
            old_pris = float(innehav[0]["kopt_pris_usd"])
            new_inv  = old_inv + belopp_kr
            new_pris = (old_inv * old_pris + belopp_kr * pris_usd) / new_inv
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_etf_innehav"
                f"?agent=eq.{urllib.parse.quote(fond_symbol)}&symbol=eq.{crypto_symbol}",
                headers=h,
                json={"investerat_kr": round(new_inv, 2), "kopt_pris_usd": round(new_pris, 4),
                      "uppdaterad": "now()"},
                timeout=8,
            )
        else:
            httpx.post(
                f"{SB_URL}/rest/v1/agent_etf_innehav",
                headers=h,
                json={"agent": fond_symbol, "symbol": crypto_symbol,
                      "investerat_kr": round(belopp_kr, 2), "kopt_pris_usd": round(pris_usd, 4)},
                timeout=8,
            )
        # Loggtransaktion
        httpx.post(
            f"{SB_URL}/rest/v1/etf_transaktioner",
            headers=h,
            json={"agent": fond_symbol, "symbol": crypto_symbol, "typ": "kop",
                  "belopp_kr": round(belopp_kr, 2), "pris_usd": round(pris_usd, 4)},
            timeout=8,
        )
        # Spara i ohlcv_cache så /etf-sidan kan beräkna P&L
        httpx.post(
            f"{SB_URL}/rest/v1/ohlcv_cache?on_conflict=symbol,datum",
            headers={**h, "Prefer": "resolution=merge-duplicates,return=minimal"},
            json={"symbol": crypto_symbol, "datum": idag,
                  "pris": round(pris_usd, 2), "vol": 0},
            timeout=8,
        )
        return True
    except Exception as e:
        print(f"  [kop_etf_fond] {fond_symbol} {crypto_symbol}: {e}")
        return False


def sync_fond_planbok(sb_key: str, fond_symbol: str, saldo: float) -> None:
    """Skapar/uppdaterar agent_planbocker för fond-symbolen (används för kop_etf)."""
    try:
        h = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}
        httpx.post(f"{SB_URL}/rest/v1/agent_planbocker", headers=h,
                   json={"agent": fond_symbol, "saldo": round(saldo, 2), "uppdaterad": "now()"},
                   timeout=8)
    except Exception as e:
        print(f"  [sync_fond_planbok] {fond_symbol}: {e}")


def hamta_fond_etf_varde(sb_key: str, fond_symbol: str) -> float:
    """Hämtar totalt värde av fondens ETF-innehav (investerat_kr)."""
    try:
        url = f"{SB_URL}/rest/v1/agent_etf_innehav?agent=eq.{urllib.parse.quote(fond_symbol)}&select=investerat_kr"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success:
            return sum(float(row["investerat_kr"]) for row in r.json())
    except Exception as e:
        print(f"  [hamta_fond_etf_varde] {fond_symbol}: {e}")
    return 0.0


def handla_crypto_etf(sb_key: str, fond_symbol: str, total_kapital: float,
                      quant_rec: dict | None = None) -> None:
    """Fonden köper krypto-ETF baserat på sin allokering."""
    conf = FOND_CRYPTO[fond_symbol]
    etf_varde = hamta_fond_etf_varde(sb_key, fond_symbol)

    if fond_symbol == "QUANT" and quant_rec:
        andel = float(quant_rec.get("crypto_andel", 0.10))
        symboler = quant_rec.get("crypto_symboler", ["BTC", "ETH"])
    else:
        andel = conf["andel"]
        symboler = conf["symboler"]

    mål_allokering = total_kapital * andel
    om_investera = max(0, mål_allokering - etf_varde)

    if om_investera < 50:
        print(f"  {fond_symbol} crypto ETF: redan allokerat ({etf_varde:.0f} kr, mål {mål_allokering:.0f} kr)")
        return

    # Hämta priser via Vercel → Binance (en batch-förfrågan för alla symboler)
    saknar_pris = [s for s in symboler if s not in _PRIS_CACHE]
    if saknar_pris:
        hamta_krypto_priser(sb_key, saknar_pris)

    per_symbol = round(om_investera / len(symboler), 2)
    print(f"  {fond_symbol} crypto ETF: försöker allokera {om_investera:.0f} kr → {symboler}")
    for sym in symboler:
        if per_symbol < 20:
            break
        ok = kop_etf_fond(sb_key, fond_symbol, sym, per_symbol)
        if ok:
            print(f"  {fond_symbol} allokerar {per_symbol:.0f} kr → {sym} ETF ✓")
        else:
            print(f"  {fond_symbol} → {sym} ETF misslyckades")


def hamta_nav_historik(sb_key: str, fond_id: int, limit: int = 20) -> list[dict]:
    try:
        url = (f"{SB_URL}/rest/v1/hedgefond_nav_historik"
               f"?fond_id=eq.{fond_id}&select=nav_per_andel,total_tillgangar,skapad"
               f"&order=skapad.desc&limit={limit}")
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success:
            return r.json()
    except Exception as e:
        print(f"  [hamta_nav_historik] fond {fond_id}: {e}")
    return []


def hamta_fond_trades(sb_key: str, fond_id: int, limit: int = 30) -> list[dict]:
    try:
        url = (f"{SB_URL}/rest/v1/hedgefond_trades"
               f"?fond_id=eq.{fond_id}&select=symbol,typ,pris,antal,vinst_forlust,skapad"
               f"&order=skapad.desc&limit={limit}")
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success:
            return r.json()
    except Exception as e:
        print(f"  [hamta_fond_trades] fond {fond_id}: {e}")
    return []


def hamta_pris(sb_key: str, symbol: str) -> float:
    try:
        url = f"{SB_URL}/rest/v1/bors_tillgangar?symbol=eq.{urllib.parse.quote(symbol)}&select=senaste_pris"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return float(r.json()[0].get("senaste_pris", 100.0))
    except Exception as e:
        print(f"  [hamta_pris] {symbol}: {e}")
    return 100.0


def spara_nav_snapshot(sb_key: str, fond_id: int, nav: float, total_tillgangar: float) -> None:
    try:
        h_post = {**_h(sb_key), "Prefer": "return=minimal"}
        url = f"{SB_URL}/rest/v1/hedgefond_nav_historik"
        httpx.post(url, headers=h_post,
                   json={"fond_id": fond_id, "nav_per_andel": round(nav, 4), "total_tillgangar": round(total_tillgangar, 2)},
                   timeout=8)
    except Exception as e:
        print(f"  [spara_nav_snapshot] fond {fond_id}: {e}")


def uppdatera_fond_nav(sb_key: str, fond_id: int, nav: float, total_andelar: float) -> None:
    try:
        h_min = {**_h(sb_key), "Prefer": "return=minimal"}
        url = f"{SB_URL}/rest/v1/hedgefonder?id=eq.{fond_id}"
        httpx.patch(url, headers=h_min,
                    json={"nav_per_andel": round(nav, 4), "total_andelar": round(total_andelar, 4)},
                    timeout=8)
    except Exception as e:
        print(f"  [uppdatera_fond_nav] fond {fond_id}: {e}")


def lagg_bors_order(sb_key: str, agent: str, symbol: str, typ: str,
                    pris: float, antal: float, motivering: str) -> int | None:
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
        r = httpx.post(f"{SB_URL}/rest/v1/bors_ordrar", headers=h_post, json=payload, timeout=10)
        if r.is_success and r.json():
            return r.json()[0]["id"]
        else:
            print(f"  [lagg_bors_order] {agent} {typ} {symbol}: {r.status_code}")
    except Exception as e:
        print(f"  [lagg_bors_order] {agent}: {e}")
    return None


def spara_fond_trade(sb_key: str, fond_id: int, symbol: str, typ: str,
                     pris: float, antal: float, strategi_motiv: str = "") -> None:
    try:
        h_post = {**_h(sb_key), "Prefer": "return=minimal"}
        url = f"{SB_URL}/rest/v1/hedgefond_trades"
        httpx.post(url, headers=h_post, json={
            "fond_id": fond_id,
            "symbol": symbol,
            "typ": typ,
            "pris": round(pris, 2),
            "antal": round(antal, 4),
            "strategi_motiv": strategi_motiv,
        }, timeout=8)
    except Exception as e:
        print(f"  [spara_fond_trade] fond {fond_id}: {e}")

# ─── QUANT: Självlärande strategi via LLM ─────────────────────────────────────

def quant_strategi(sb_key: str, fond_id: int) -> dict:
    """
    Hämtar QUANT-fondens prestandahistorik och frågar LLM om handelsstrategi.
    Returnerar dict med lista av {symbol, bias, aggressivitet}.
    Fallback till standard-strategi om LLM misslyckas.
    """
    nav_hist = hamta_nav_historik(sb_key, fond_id, limit=20)
    trades = hamta_fond_trades(sb_key, fond_id, limit=30)

    default = [
        {"symbol": "DBT",  "bias": "kop",     "aggressivitet": 0.6},
        {"symbol": "NOVA", "bias": "neutral",  "aggressivitet": 0.5},
        {"symbol": "ETK",  "bias": "kop",      "aggressivitet": 0.4},
    ]

    if not nav_hist and not trades:
        print("  QUANT: inga historikdata — använder standard-strategi")
        return {"rekommendationer": default, "motivering": "Ingen historik ännu"}

    # Bygg performance-summary
    nav_values = [float(row["nav_per_andel"]) for row in nav_hist]
    nav_trend = ""
    if len(nav_values) >= 2:
        delta = nav_values[0] - nav_values[-1]
        pct = (delta / nav_values[-1]) * 100 if nav_values[-1] else 0
        nav_trend = f"NAV-trend senaste {len(nav_values)} körningar: {'+' if delta >= 0 else ''}{pct:.1f}%"

    # Räkna vinst/förlust per symbol
    symbol_pl: dict[str, float] = {}
    for t in trades:
        sym = t["symbol"]
        pl = float(t.get("vinst_forlust", 0))
        symbol_pl[sym] = symbol_pl.get(sym, 0) + pl

    trades_summary = "; ".join([f"{sym}: {'+' if pl >= 0 else ''}{pl:.0f} kr" for sym, pl in symbol_pl.items()])

    system = (
        "Du är en kvantitativ handelsalgoritm för en hedgefond på en intern AI-börs. "
        "Tillgängliga interna tokens: DBT, NOVA, ETK. "
        "Tillgängliga krypto-ETF: BTC, ETH, SOL, XRP, BNB. "
        "Svara ALLTID med valid JSON (inget annat), exakt detta format:\n"
        '{"rekommendationer": [{"symbol": "DBT", "bias": "kop", "aggressivitet": 0.7}], '
        '"crypto_andel": 0.10, "crypto_symboler": ["BTC", "ETH"], "motivering": "..."}\n'
        'Tillåtna bias-värden: "kop", "salj", "neutral". Aggressivitet 0.2–0.9. '
        'crypto_andel = andel av totalt kapital i krypto-ETF (0.0–0.30).'
    )
    prompt = (
        f"Prestandahistorik för Quant Fund:\n"
        f"- {nav_trend}\n"
        f"- Senaste 30 trades P&L per symbol: {trades_summary or 'Inga trades ännu'}\n"
        f"- Senaste NAV: {nav_values[0]:.2f} SEK/andel\n\n"
        "Baserat på denna historik — vilka symboler ska QUANT handla och i vilka riktningar? "
        "Bestäm också hur stor andel (0–30%) av kapitalet som ska till krypto-ETF och vilka kryptos.\n"
        "Inkludera alla tre interna tokens i rekommendationerna."
    )

    raw = _llm(system, prompt, max_tokens=400)

    # Extrahera JSON
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(raw[start:end])
            recs = data.get("rekommendationer", [])
            valid = []
            for rec in recs:
                if isinstance(rec, dict) and rec.get("symbol") in ["DBT", "NOVA", "ETK"]:
                    valid.append({
                        "symbol": rec["symbol"],
                        "bias": rec.get("bias", "neutral") if rec.get("bias") in ["kop", "salj", "neutral"] else "neutral",
                        "aggressivitet": max(0.2, min(0.9, float(rec.get("aggressivitet", 0.5)))),
                    })
            crypto_andel = max(0.0, min(0.30, float(data.get("crypto_andel", 0.10))))
            crypto_sym = [s for s in data.get("crypto_symboler", ["BTC"]) if s in ["BTC", "ETH", "SOL", "XRP", "BNB"]]
            if not crypto_sym:
                crypto_sym = ["BTC"]
            if valid:
                print(f"  QUANT LLM-strategi: {[(r['symbol'], r['bias']) for r in valid]}, crypto {crypto_andel:.0%} → {crypto_sym}")
                return {
                    "rekommendationer": valid,
                    "crypto_andel": crypto_andel,
                    "crypto_symboler": crypto_sym,
                    "motivering": data.get("motivering", ""),
                }
    except Exception as e:
        print(f"  QUANT: JSON-parsning misslyckades: {e} — raw: {raw[:200]}")

    return {"rekommendationer": default, "crypto_andel": 0.10, "crypto_symboler": ["BTC"], "motivering": "Fallback till standard-strategi"}

# ─── Investeringsrunda ────────────────────────────────────────────────────────

def bootstrap_fond(sb_key: str, fond_symbol: str, fond: dict) -> None:
    """
    Om en fond saknar investerare investerar förvaltaren automatiskt 300 SEK i sin egna fond.
    "Eat your own cooking" — förvaltare ska ha skin in the game.
    """
    fond_id = fond["id"]
    förvaltare = FONDER[fond_symbol]["förvaltare"]
    nav = float(fond["nav_per_andel"])

    if nav <= 0:
        print(f"  {fond_symbol}: ogiltigt NAV ({nav}) — hoppar bootstrap")
        return

    befintlig = hamta_agent_investering(sb_key, fond_id, förvaltare)
    if befintlig:
        return  # Förvaltaren har redan investerat

    saldo = hamta_saldo(sb_key, förvaltare)
    belopp = min(300.0, saldo)
    if belopp < 50:
        print(f"  {fond_symbol}: förvaltaren {förvaltare} har för lågt saldo för bootstrap ({saldo:.0f} SEK)")
        return

    andelar = round(belopp / nav, 4)

    try:
        h_post = {**_h(sb_key), "Prefer": "return=minimal"}
        r = httpx.post(f"{SB_URL}/rest/v1/hedgefond_investerare", headers=h_post, json={
            "fond_id": fond_id,
            "agent": förvaltare,
            "andelar": andelar,
            "investerat_sek": belopp,
        }, timeout=8)
        if r.is_success:
            uppdatera_saldo(sb_key, förvaltare, saldo - belopp)
            ny_total = float(fond.get("total_andelar", 0)) + andelar
            uppdatera_fond_nav(sb_key, fond_id, nav, ny_total)
            print(f"  BOOTSTRAP: {förvaltare} investerar {belopp:.0f} SEK i sin egna fond {fond_symbol} ({andelar:.2f} andelar)")
        elif r.status_code == 409:
            print(f"  {fond_symbol}: bootstrap 409 — förvaltaren har redan en rad (race condition ignoreras)")
        else:
            print(f"  BOOTSTRAP misslyckades: {r.status_code}")
    except Exception as e:
        print(f"  [bootstrap_fond] {fond_symbol}: {e}")


def investeringsrunda(sb_key: str, agenter: list[dict]) -> None:
    """Agenter investerar i en slumpmässig fond (~10% chans per agent)."""
    fonddata = {}
    for symbol in FONDER:
        fond = hamta_fond(sb_key, symbol)
        if fond:
            fonddata[symbol] = fond

    if not fonddata:
        print("  Inga fonder hittade — hoppar investeringsrunda")
        return

    for agent_obj in agenter:
        agent = agent_obj["namn"]
        if random.random() > 0.10:
            continue

        saldo = hamta_saldo(sb_key, agent)
        if saldo < 300:
            continue

        # Välj en slumpmässig fond
        fond_symbol = random.choice(list(fonddata.keys()))
        fond = fonddata[fond_symbol]
        fond_id = fond["id"]
        nav = float(fond["nav_per_andel"])

        # Kontrollera om agenten redan investerat
        befintlig = hamta_agent_investering(sb_key, fond_id, agent)
        if befintlig:
            continue  # Bara en investering per agent per fond

        belopp = round(random.uniform(MIN_INVESTERING, min(MAX_INVESTERING, saldo * 0.2)), 2)
        andelar = round(belopp / nav, 4)

        # Dra saldo
        uppdatera_saldo(sb_key, agent, saldo - belopp)

        # Spara investering
        try:
            h_post = {**_h(sb_key), "Prefer": "return=minimal"}
            url = f"{SB_URL}/rest/v1/hedgefond_investerare"
            r = httpx.post(url, headers=h_post, json={
                "fond_id": fond_id,
                "agent": agent,
                "andelar": andelar,
                "investerat_sek": belopp,
            }, timeout=8)
            if r.is_success:
                # Uppdatera fondens total_andelar
                ny_total = float(fond.get("total_andelar", 0)) + andelar
                uppdatera_fond_nav(sb_key, fond_id, nav, ny_total)
                fonddata[fond_symbol]["total_andelar"] = ny_total
                print(f"  {agent} investerar {belopp:.0f} SEK i {fond_symbol} ({andelar:.2f} andelar @ {nav:.2f})")
        except Exception as e:
            print(f"  [investeringsrunda] {agent}: {e}")


def uttagsrunda(sb_key: str, agenter: list[dict]) -> None:
    """Agenter tar ut vinst (~5% chans om P&L > 10%)."""
    for agent_obj in agenter:
        agent = agent_obj["namn"]
        if random.random() > 0.05:
            continue

        # Hitta alla investeringar för agenten
        try:
            a_enc = urllib.parse.quote(agent)
            url = f"{SB_URL}/rest/v1/hedgefond_investerare?agent=eq.{a_enc}&select=*"
            r = httpx.get(url, headers=_h(sb_key), timeout=8)
            if not r.is_success or not r.json():
                continue
            investeringar = r.json()
        except Exception:
            continue

        for inv in investeringar:
            fond_id = inv["fond_id"]
            andelar = float(inv["andelar"])
            investerat = float(inv["investerat_sek"])

            # Hämta fond för aktuellt NAV
            try:
                url = f"{SB_URL}/rest/v1/hedgefonder?id=eq.{fond_id}&select=nav_per_andel,total_andelar,symbol"
                r = httpx.get(url, headers=_h(sb_key), timeout=8)
                if not r.is_success or not r.json():
                    continue
                fond = r.json()[0]
            except Exception:
                continue

            nav = float(fond["nav_per_andel"])
            aktuellt_varde = andelar * nav
            pl_pct = ((aktuellt_varde - investerat) / investerat * 100) if investerat > 0 else 0

            if pl_pct < 10:
                continue  # Bara ta ut om vinst > 10%

            # Lös in andelar
            saldo = hamta_saldo(sb_key, agent)
            uppdatera_saldo(sb_key, agent, saldo + aktuellt_varde)

            # Ta bort investerarrad
            try:
                h_del = {**_h(sb_key), "Prefer": "return=minimal"}
                url = f"{SB_URL}/rest/v1/hedgefond_investerare?id=eq.{inv['id']}"
                httpx.delete(url, headers=h_del, timeout=8)
            except Exception:
                pass

            # Uppdatera fondens total_andelar
            ny_total = max(0, float(fond.get("total_andelar", andelar)) - andelar)
            uppdatera_fond_nav(sb_key, fond_id, nav, ny_total)

            fond_symbol = fond.get("symbol", "?")
            print(f"  {agent} tar ut {aktuellt_varde:.0f} SEK från {fond_symbol} (P&L: +{pl_pct:.1f}%)")

# ─── Fondhandel ───────────────────────────────────────────────────────────────

def berakna_fond_kapital(sb_key: str, fond_symbol: str, fond_id: int) -> float:
    """Beräknar fondens tillgängliga kapital = summa av alla investerarinsättningar."""
    investerare = hamta_investerare(sb_key, fond_id)
    if not investerare:
        return 0.0
    return sum(float(inv["investerat_sek"]) for inv in investerare)


def handla_fond(sb_key: str, fond_symbol: str, fond: dict,
                strategi_recs: list[dict] | None = None) -> float:
    """
    Fonden handlar på börsen.
    Returnerar total portföljvärde efter handel.
    """
    fond_id = fond["id"]
    förvaltare = fond["förvaltare"]
    conf = FONDER[fond_symbol]
    total_kapital = berakna_fond_kapital(sb_key, fond_symbol, fond_id)

    if total_kapital < 50:
        print(f"  {fond_symbol}: för lite kapital ({total_kapital:.0f} SEK) — hoppar handel")
        return total_kapital

    aggressivitet = conf["aggressivitet"]
    symboler = conf["symboler"]

    # QUANT: använd LLM-strategi om tillgänglig
    if strategi_recs:
        recs_by_sym = {r["symbol"]: r for r in strategi_recs}
    else:
        recs_by_sym = {}

    total_portfölj = 0.0

    for symbol in symboler:
        pris = hamta_pris(sb_key, symbol)
        if pris <= 0:
            continue

        rec = recs_by_sym.get(symbol, {})
        bias = rec.get("bias", "kop" if random.random() < aggressivitet else "salj")
        agg = rec.get("aggressivitet", aggressivitet)

        if bias == "kop" or (bias == "neutral" and random.random() < agg):
            # Köporder: investera max 30% av kapital per symbol
            max_kr = total_kapital * 0.30
            kr = round(random.uniform(max_kr * 0.4, max_kr), 2)
            antal = round(kr / pris, 4)
            if antal >= 0.01:
                motiv = f"{fond_symbol}: {'QUANT-strategi köper' if strategi_recs else 'köporder'} {symbol}"
                oid = lagg_bors_order(sb_key, fond_symbol, symbol, "kop",
                                      pris * 1.01, antal, motiv)
                if oid:
                    spara_fond_trade(sb_key, fond_id, symbol, "kop", pris, antal,
                                     rec.get("motivering", "")[:200] if rec else "")
                    print(f"    {fond_symbol} KÖP {antal:.2f} {symbol} @ {pris:.2f} SEK ({kr:.0f} SEK)")
        elif bias == "salj":
            antal = round(random.uniform(1, 5), 4)
            motiv = f"{fond_symbol}: säljorder {symbol}"
            oid = lagg_bors_order(sb_key, fond_symbol, symbol, "salj",
                                  pris * 0.99, antal, motiv)
            if oid:
                spara_fond_trade(sb_key, fond_id, symbol, "salj", pris, antal)
                print(f"    {fond_symbol} SÄLJ {antal:.2f} {symbol} @ {pris:.2f} SEK")

        total_portfölj += hamta_pris(sb_key, symbol) * 1  # Approximation
    return total_kapital  # Använd investerat kapital som portföljvärde-proxy


def berakna_nav(sb_key: str, fond_symbol: str, fond_id: int, total_andelar: float) -> float:
    """Beräknar NAV per andel baserat på total fondförmögenhet."""
    if total_andelar <= 0:
        return 100.0

    # Hämta fondens portfölj på börsen
    try:
        f_enc = urllib.parse.quote(fond_symbol)
        url = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{f_enc}&select=symbol,antal"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        portfölj_varde = 0.0
        if r.is_success:
            for row in r.json():
                sym = row["symbol"]
                ant = float(row.get("antal", 0))
                portfölj_varde += ant * hamta_pris(sb_key, sym)
    except Exception:
        portfölj_varde = 0.0

    # Total kapital = investerat + portföljvärde
    investerat = berakna_fond_kapital(sb_key, fond_symbol, fond_id)
    total = investerat + portfölj_varde
    return round(total / total_andelar, 4) if total_andelar > 0 else 100.0

# ─── Civilisationsminne-trigger ───────────────────────────────────────────────

def kolla_prestation(sb_key: str, fond_symbol: str, fond_id: int, nav: float, förvaltare: str) -> None:
    """Loggar exceptionella fondprestationer i civilisationsminnet."""
    historik = hamta_nav_historik(sb_key, fond_id, limit=7)
    if len(historik) < 7:
        return

    start_nav = float(historik[-1]["nav_per_andel"])
    if start_nav <= 0:
        return

    förändring = (nav - start_nav) / start_nav * 100

    if förändring >= 10:
        spara_civilisations_minne(
            sb_key,
            typ="marknadsseger",
            rubrik=f"{fond_symbol} stiger {förändring:.1f}% på 7 körningar",
            beskrivning=f"Hedgefonden {fond_symbol} (förvaltad av {förvaltare}) har stigit {förändring:.1f}% de senaste 7 körningarna. NAV: {nav:.2f} SEK/andel.",
            agenter=[förvaltare],
        )
    elif förändring <= -20:
        spara_civilisations_minne(
            sb_key,
            typ="marknadskrasch",
            rubrik=f"{fond_symbol} tappar {abs(förändring):.1f}% på 7 körningar",
            beskrivning=f"Hedgefonden {fond_symbol} (förvaltad av {förvaltare}) har tappat {abs(förändring):.1f}% de senaste 7 körningarna. NAV: {nav:.2f} SEK/andel.",
            agenter=[förvaltare],
        )

# ─── Huvudflöde ───────────────────────────────────────────────────────────────

def main():
    sb_key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not sb_key:
        print("SUPABASE_ANON_KEY saknas — avbryter")
        sys.exit(1)

    print("=== Hedgefond körning startar ===")
    agenter = [a for a in AGENTER if a["namn"] not in [f["förvaltare"] for f in FONDER.values()]]

    # Säkerställ att fondförvaltare inte är bankrutta inför bootstrap
    for conf in FONDER.values():
        kolla_och_bailout(sb_key, conf["förvaltare"])

    # 1. Investeringsrunda
    print("\n--- Investeringsrunda ---")
    investeringsrunda(sb_key, AGENTER)

    # 2. Uttagsrunda
    print("\n--- Uttagsrunda ---")
    uttagsrunda(sb_key, AGENTER)

    # 3. Varje fond handlar på börsen
    print("\n--- Fondhandel ---")
    for fond_symbol, conf in FONDER.items():
        fond = hamta_fond(sb_key, fond_symbol)
        if not fond or not fond.get("aktiv"):
            print(f"  {fond_symbol}: fond saknas eller inaktiv")
            continue

        # Bootstrap: förvaltaren auto-investerar om fonden saknar kapital
        if float(fond.get("total_andelar", 0)) == 0:
            bootstrap_fond(sb_key, fond_symbol, fond)
            fond = hamta_fond(sb_key, fond_symbol) or fond  # Behåll gamla värdet vid fetch-fel

        fond_id = fond["id"]
        total_andelar = float(fond.get("total_andelar", 0))
        print(f"\n  {fond_symbol} ({conf['förvaltare']}, {total_andelar:.2f} andelar):")

        strategi_recs = None
        quant_crypto_rec = None
        if fond_symbol == "QUANT":
            print("  Hämtar QUANT LLM-strategi...")
            quant_res = quant_strategi(sb_key, fond_id)
            strategi_recs = quant_res.get("rekommendationer")
            quant_crypto_rec = {"crypto_andel": quant_res.get("crypto_andel", 0.10),
                                 "crypto_symboler": quant_res.get("crypto_symboler", ["BTC"])}
            print(f"  QUANT motivering: {quant_res.get('motivering', '')[:100]}")

        handla_fond(sb_key, fond_symbol, fond, strategi_recs)

        # Crypto-ETF-allokering
        total_kapital = berakna_fond_kapital(sb_key, fond_symbol, fond_id)
        if total_kapital >= 100:
            handla_crypto_etf(sb_key, fond_symbol, total_kapital, quant_crypto_rec)

        # 4. Beräkna och spara NAV
        nav = berakna_nav(sb_key, fond_symbol, fond_id, total_andelar)
        total_tillgangar = berakna_fond_kapital(sb_key, fond_symbol, fond_id)
        spara_nav_snapshot(sb_key, fond_id, nav, total_tillgangar)
        uppdatera_fond_nav(sb_key, fond_id, nav, total_andelar)
        print(f"  {fond_symbol} NAV: {nav:.4f} SEK/andel")

        # 5. Kolla prestation
        kolla_prestation(sb_key, fond_symbol, fond_id, nav, conf["förvaltare"])

    # QUANT paper trading mot riktiga marknadsdata (parallell, påverkar ej agentsaldon)
    kör_quant_paper_trading(sb_key)

    # STRAT paper trading — algoritmisk MA+volym-signal, ingen LLM
    kör_strat_paper_trading(sb_key)

    print("\n=== Hedgefond körning klar ===")


def kör_quant_paper_trading(sb_key: str):
    """
    QUANT paper trading mot riktiga marknadsdata (BTC, ETH, SOL, XRP, BNB, SPY).
    Körs parallellt med intern fondhandel — påverkar inte agenternas saldo.
    Startar med 10 000 USD fiktivt kapital. Jämför mot BTC- och SPY-benchmark.
    """
    START_KAPITAL = 10_000.0
    SYMBOLER = ["BTC", "ETH", "SOL", "XRP", "BNB", "SPY"]

    print("\n--- QUANT Paper Trading (riktiga marknadsdata) ---")

    # 1. Hämta aktuella priser från ohlcv_cache
    priser = {}
    for sym in SYMBOLER:
        try:
            r = httpx.get(
                f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{sym}&order=datum.desc&limit=20",
                headers=_h(sb_key), timeout=15,
            )
            if r.status_code == 200 and r.json():
                rows = r.json()
                priser[sym] = {
                    "senaste":  float(rows[0]["pris"]),
                    "historik": [float(x["pris"]) for x in reversed(rows)],
                }
        except Exception as e:
            print(f"  Prisfetch {sym}: {e}")

    if len(priser) < 2:
        print("  För få priser, hoppar över paper trading")
        return

    # 2. Hämta nuvarande positioner
    try:
        r = httpx.get(f"{SB_URL}/rest/v1/quant_paper_innehav", headers=_h(sb_key), timeout=10)
        innehav = {
            x["symbol"]: {"antal": float(x["antal"]), "kopt_pris_usd": float(x["kopt_pris_usd"])}
            for x in (r.json() if r.status_code == 200 else [])
        }
    except Exception:
        innehav = {}

    # 3. Hämta kontantnivå från senaste NAV-snapshot
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/quant_paper_nav?order=skapad.desc&limit=1",
            headers=_h(sb_key), timeout=10,
        )
        nav_rows = r.json() if r.status_code == 200 else []
        kontant = float(nav_rows[0]["kontant_usd"]) if nav_rows else START_KAPITAL
    except Exception:
        kontant = START_KAPITAL

    # 4. Beräkna aktuellt portföljvärde
    def portfölj_värde_nu():
        v = kontant
        for sym, pos in innehav.items():
            if sym in priser and pos["antal"] > 0:
                v += pos["antal"] * priser[sym]["senaste"]
        return v

    pv = portfölj_värde_nu()

    # 5. LLM-strategi
    pris_text = "\n".join([
        f"  {sym}: {info['senaste']:.2f} USD | trend: {info['historik'][0]:.2f}→{info['senaste']:.2f}"
        f" ({(info['senaste']/info['historik'][0]-1)*100:+.1f}%)"
        for sym, info in priser.items()
    ])
    innehav_text = "\n".join([
        f"  {sym}: {pos['antal']:.5f} × {priser.get(sym,{}).get('senaste',0):.2f} = "
        f"{pos['antal']*priser.get(sym,{}).get('senaste',0):.2f} USD"
        for sym, pos in innehav.items() if pos["antal"] > 0
    ]) or "  (inga positioner)"

    system = (
        "Du är QUANT, en självlärande kvantitativ handelsalgoritm. Paper trading, 10 000 USD startkapital. "
        "Symboler: BTC, ETH, SOL, XRP, BNB och SPY (S&P 500 ETF). "
        'Svara ALLTID med valid JSON: {"trades":[{"symbol":"BTC","action":"kop","andel":0.20}],"motivering":"..."}\n'
        "action = kop eller salj. andel = andel av kontant att köpa (0.05–0.40) "
        "ELLER andel av position att sälja (0.25–1.0). Max 3 trades."
    )
    prompt = (
        f"Paper portfolio:\nKontant: {kontant:.2f} USD\nPositioner:\n{innehav_text}\n"
        f"Totalt: {pv:.2f} USD ({(pv/START_KAPITAL-1)*100:+.1f}% mot start)\n\n"
        f"Marknadsdata:\n{pris_text}\n\nVad gör vi? Motivera kort."
    )

    motivering = ""
    raw = _llm(system, prompt, max_tokens=300)
    if not raw:
        print("  QUANT paper trading: LLM returnerade inget svar (dagsgräns?) — inga trades denna körning")
    else:
        try:
            start = raw.find("{"); end = raw.rfind("}") + 1
            if start < 0 or end <= start:
                print("  QUANT paper trading: LLM-svar saknar JSON — inga trades")
            else:
                data = json.loads(raw[start:end])
                motivering = data.get("motivering", "")[:500]

                for trade in data.get("trades", [])[:3]:
                    sym    = str(trade.get("symbol", "")).upper()
                    action = str(trade.get("action", ""))
                    andel  = float(trade.get("andel", 0.15))
                    if sym not in priser:
                        continue
                    pris = priser[sym]["senaste"]

                    if action == "kop" and kontant >= 200:
                        belopp  = kontant * min(0.40, max(0.05, andel))
                        antal   = belopp / pris
                        nuv     = innehav.get(sym, {"antal": 0.0, "kopt_pris_usd": pris})
                        ny_ant  = nuv["antal"] + antal
                        ny_sn   = (nuv["antal"] * nuv["kopt_pris_usd"] + antal * pris) / ny_ant
                        httpx.post(
                            f"{SB_URL}/rest/v1/quant_paper_innehav?on_conflict=symbol",
                            json={"symbol": sym, "antal": round(ny_ant, 8), "kopt_pris_usd": round(ny_sn, 4),
                                  "uppdaterad": datetime.now(timezone.utc).isoformat()},
                            headers={**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"},
                            timeout=10,
                        )
                        innehav[sym] = {"antal": ny_ant, "kopt_pris_usd": ny_sn}
                        kontant -= belopp
                        print(f"    Paper KÖP {antal:.5f} {sym} @ {pris:.2f} USD ({belopp:.0f} USD)")

                    elif action == "salj" and sym in innehav and innehav[sym]["antal"] > 0:
                        salj_ant = innehav[sym]["antal"] * min(1.0, max(0.10, andel))
                        kontant += salj_ant * pris
                        kvar     = max(0.0, innehav[sym]["antal"] - salj_ant)
                        httpx.post(
                            f"{SB_URL}/rest/v1/quant_paper_innehav?on_conflict=symbol",
                            json={"symbol": sym, "antal": round(kvar, 8),
                                  "kopt_pris_usd": innehav[sym]["kopt_pris_usd"],
                                  "uppdaterad": datetime.now(timezone.utc).isoformat()},
                            headers={**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"},
                            timeout=10,
                        )
                        innehav[sym] = {"antal": kvar, "kopt_pris_usd": innehav[sym]["kopt_pris_usd"]}
                        print(f"    Paper SÄLJ {salj_ant:.5f} {sym} @ {pris:.2f} USD")
        except Exception as e:
            print(f"  Paper trading LLM/trade-fel: {e}")

    # 6. Uppdaterat portföljvärde
    pv = portfölj_värde_nu()

    # 7. Benchmark: vad 10 000 USD i BTC / SPY från allra första körningen ger idag
    btc_benchmark = spy_benchmark = None
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/quant_paper_nav?order=skapad.asc&limit=1",
            headers=_h(sb_key), timeout=10,
        )
        first_rows = r.json() if r.status_code == 200 else []
        if first_rows:
            start_datum = first_rows[0]["skapad"][:10]
            for sym, attr in [("BTC", "btc"), ("SPY", "spy")]:
                if sym not in priser:
                    continue
                r2 = httpx.get(
                    f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{sym}"
                    f"&datum=gte.{start_datum}&order=datum.asc&limit=1",
                    headers=_h(sb_key), timeout=10,
                )
                if r2.status_code == 200 and r2.json():
                    sp = float(r2.json()[0]["pris"])
                    val = (START_KAPITAL / sp) * priser[sym]["senaste"]
                    if attr == "btc":
                        btc_benchmark = val
                    else:
                        spy_benchmark = val
        else:
            btc_benchmark = START_KAPITAL
            if "SPY" in priser:
                spy_benchmark = START_KAPITAL
    except Exception as e:
        print(f"  Benchmark-fel: {e}")

    # 8. Spara NAV-snapshot
    nav_row: dict = {
        "portfölj_värde_usd": round(pv, 4),
        "kontant_usd":        round(kontant, 4),
        "start_kapital_usd":  START_KAPITAL,
        "quant_motivering":   motivering or None,
    }
    if btc_benchmark is not None:
        nav_row["btc_benchmark_usd"] = round(btc_benchmark, 4)
    if spy_benchmark is not None:
        nav_row["spy_benchmark_usd"] = round(spy_benchmark, 4)
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/quant_paper_nav",
            json=nav_row,
            headers={**_h(sb_key), "Prefer": "return=minimal"},
            timeout=10,
        )
    except Exception as e:
        print(f"  NAV-spara fel: {e}")

    pnl = pv - START_KAPITAL
    print(f"  Paper portfölj: {pv:.2f} USD ({pnl:+.2f} USD / {pnl/START_KAPITAL*100:+.1f}%)")
    if btc_benchmark:
        print(f"  BTC benchmark:  {btc_benchmark:.2f} USD ({(btc_benchmark/START_KAPITAL-1)*100:+.1f}%)")
    if spy_benchmark:
        print(f"  SPY benchmark:  {spy_benchmark:.2f} USD ({(spy_benchmark/START_KAPITAL-1)*100:+.1f}%)")



# ─── STRAT: Algoritmisk strategi baserad på backtest ─────────────────────────

def strat_strategi(sb_key: str) -> dict | None:
    """
    Läser bästa backtest-strategi från backtest_resultat (flest trades, högst avkastning).
    Returnerar parametrar: symbol, lookback, vol_multiplikator, stoploss_pct.
    """
    try:
        url = (
            f"{SB_URL}/rest/v1/backtest_resultat"
            "?select=symbol,strategi,total_avkastning,lookback,vol_multiplikator,stoploss_pct"
            "&antal_trades=gte.5"
            "&order=total_avkastning.desc&limit=1"
        )
        r = httpx.get(url, headers=_h(sb_key), timeout=10)
        if r.is_success and r.json():
            row = r.json()[0]
            print(f"  STRAT: bästa strategi = {row['strategi']} ({row['symbol']}, "
                  f"avkastning {float(row['total_avkastning']):.1f}%)")
            return {
                "symbol":           row["symbol"],
                "strategi_id":      row["strategi"],
                "lookback":         int(row.get("lookback") or 10),
                "vol_multiplikator": float(row.get("vol_multiplikator") or 1.5),
                "stoploss_pct":     float(row["stoploss_pct"]) if row.get("stoploss_pct") else None,
                "total_avkastning": float(row.get("total_avkastning") or 0),
            }
    except Exception as e:
        print(f"  STRAT: kunde inte hämta strategi: {e}")
    return None


def kör_strat_paper_trading(sb_key: str):
    """
    STRAT paper trading: algoritmisk fond baserad på bästa backtest-strategi.
    Ingen LLM — ren regelbaserad MA+volym-signal.
    Startar med 10 000 USD fiktivt kapital. Jämför mot BTC- och SPY-benchmark.
    """
    START_KAPITAL = 10_000.0

    print("\n--- STRAT Paper Trading (algoritmisk, ingen LLM) ---")

    # 1. Hämta bästa strategi från backtest_resultat
    strat = strat_strategi(sb_key)
    if not strat:
        print("  STRAT: ingen strategi hittad — kör backtest.py för att populera backtest_resultat")
        return

    aktiv_symbol     = strat["symbol"]
    lookback         = strat["lookback"]
    vol_mult         = strat["vol_multiplikator"]
    stoploss_pct     = strat["stoploss_pct"]
    strategi_id_val  = strat["strategi_id"]
    total_avk        = strat["total_avkastning"]

    # 2. Hämta prishistorik (lookback + 5 dagar, äldst → nyast)
    n_hämta = lookback + 5
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{aktiv_symbol}"
            f"&order=datum.desc&limit={n_hämta}",
            headers=_h(sb_key), timeout=15,
        )
        if not r.is_success or not r.json():
            print(f"  STRAT: ingen prisdata för {aktiv_symbol}")
            return
        rows = list(reversed(r.json()))
        priser  = [float(x["pris"]) for x in rows]
        volymer = [float(x["vol"])  for x in rows]
        senaste_pris = priser[-1]
        senaste_vol  = volymer[-1]
    except Exception as e:
        print(f"  STRAT: datahämtning misslyckades: {e}")
        return

    if len(priser) < lookback + 1:
        print(f"  STRAT: för lite historikdata ({len(priser)} dagar, behöver {lookback + 1})")
        return

    # 3. Beräkna MA+volym-signal
    window_pris = priser[-(lookback + 1):-1]
    window_vol  = volymer[-(lookback + 1):-1]
    avg_pris = sum(window_pris) / lookback
    avg_vol  = sum(window_vol)  / lookback

    pris_ok  = senaste_pris > avg_pris
    vol_ok   = senaste_vol  > vol_mult * avg_vol
    signal   = "KÖP" if (pris_ok and vol_ok) else "SÄLJ/HÅLL"

    print(f"  STRAT signal: {signal} ({aktiv_symbol} @ {senaste_pris:.2f} USD | "
          f"MA{lookback}: {avg_pris:.2f}, vol-mult: {vol_mult}x)")

    # 4. Hämta nuvarande positioner
    try:
        r = httpx.get(f"{SB_URL}/rest/v1/strat_paper_innehav", headers=_h(sb_key), timeout=10)
        innehav_raw = r.json() if r.status_code == 200 else []
    except Exception:
        innehav_raw = []
    nuv_pos = next(
        ({"antal": float(x["antal"]), "kopt_pris_usd": float(x["kopt_pris_usd"])}
         for x in innehav_raw if x["symbol"] == aktiv_symbol),
        {"antal": 0.0, "kopt_pris_usd": 0.0},
    )

    # 5. Hämta kontant från senaste NAV
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/strat_paper_nav?order=skapad.desc&limit=1",
            headers=_h(sb_key), timeout=10,
        )
        nav_rows = r.json() if r.status_code == 200 else []
        kontant = float(nav_rows[0]["kontant_usd"]) if nav_rows else START_KAPITAL
    except Exception:
        kontant = START_KAPITAL

    h_u = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}

    # 5b. Likvidera gamla positioner om aktiv_symbol bytte (hämta priser för stale symbols)
    for row in innehav_raw:
        stale_sym = row["symbol"]
        stale_ant = float(row["antal"])
        if stale_sym == aktiv_symbol or stale_ant < 1e-9:
            continue
        # Hämta senaste pris för stale symbol
        try:
            r_stale = httpx.get(
                f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{stale_sym}&order=datum.desc&limit=1",
                headers=_h(sb_key), timeout=10,
            )
            stale_pris = float(r_stale.json()[0]["pris"]) if r_stale.is_success and r_stale.json() else 0.0
        except Exception:
            stale_pris = 0.0
        intäkt = stale_ant * stale_pris
        kontant += intäkt
        httpx.post(
            f"{SB_URL}/rest/v1/strat_paper_innehav?on_conflict=symbol",
            json={"symbol": stale_sym, "antal": 0.0, "kopt_pris_usd": float(row["kopt_pris_usd"]),
                  "uppdaterad": datetime.now(timezone.utc).isoformat()},
            headers=h_u, timeout=10,
        )
        print(f"    STRAT LIKVIDERAR {stale_ant:.6f} {stale_sym} @ {stale_pris:.2f} USD "
              f"(symbolbyte → {aktiv_symbol}, intäkt {intäkt:.0f} USD)")

    # 6. Stop-loss check (på befintlig position INNAN ny signal)
    if stoploss_pct and nuv_pos["antal"] > 1e-9 and nuv_pos["kopt_pris_usd"] > 0:
        sl_trigger = nuv_pos["kopt_pris_usd"] * (1 - stoploss_pct / 100)
        if senaste_pris <= sl_trigger:
            salj_antal = nuv_pos["antal"]
            intäkt = salj_antal * senaste_pris
            kontant += intäkt
            httpx.post(
                f"{SB_URL}/rest/v1/strat_paper_innehav?on_conflict=symbol",
                json={"symbol": aktiv_symbol, "antal": 0.0,
                      "kopt_pris_usd": nuv_pos["kopt_pris_usd"],
                      "uppdaterad": datetime.now(timezone.utc).isoformat()},
                headers=h_u, timeout=10,
            )
            nuv_pos["antal"] = 0.0
            signal = "STOP-LOSS"
            print(f"    STRAT STOP-LOSS: {salj_antal:.6f} {aktiv_symbol} @ {senaste_pris:.2f} USD "
                  f"(trigger {sl_trigger:.2f}), intäkt {intäkt:.0f} USD")

    # 7. Exekvera signal
    if signal == "KÖP" and kontant >= 500 and nuv_pos["antal"] < 1e-9:
        # Öppna ny position med 80% av kontant
        belopp = kontant * 0.80
        antal  = belopp / senaste_pris
        httpx.post(
            f"{SB_URL}/rest/v1/strat_paper_innehav?on_conflict=symbol",
            json={"symbol":        aktiv_symbol,
                  "antal":         round(antal, 8),
                  "kopt_pris_usd": round(senaste_pris, 4),
                  "entry_datum":   datetime.now(timezone.utc).date().isoformat(),
                  "uppdaterad":    datetime.now(timezone.utc).isoformat()},
            headers=h_u, timeout=10,
        )
        nuv_pos["antal"] = antal
        nuv_pos["kopt_pris_usd"] = senaste_pris
        kontant -= belopp
        print(f"    STRAT KÖP {antal:.6f} {aktiv_symbol} @ {senaste_pris:.2f} USD ({belopp:.0f} USD)")

    elif signal == "SÄLJ/HÅLL" and nuv_pos["antal"] > 1e-9:
        # Stäng position vid säljsignal
        salj_antal = nuv_pos["antal"]
        intäkt = salj_antal * senaste_pris
        pnl_trade = intäkt - (salj_antal * nuv_pos["kopt_pris_usd"])
        kontant += intäkt
        httpx.post(
            f"{SB_URL}/rest/v1/strat_paper_innehav?on_conflict=symbol",
            json={"symbol":        aktiv_symbol,
                  "antal":         0.0,
                  "kopt_pris_usd": nuv_pos["kopt_pris_usd"],
                  "uppdaterad":    datetime.now(timezone.utc).isoformat()},
            headers=h_u, timeout=10,
        )
        nuv_pos["antal"] = 0.0
        print(f"    STRAT SÄLJ {salj_antal:.6f} {aktiv_symbol} @ {senaste_pris:.2f} USD "
              f"(P&L: {pnl_trade:+.0f} USD)")

    # 8. Aktuellt portföljvärde (kontant + aktiv position)
    pos_varde = nuv_pos["antal"] * senaste_pris if nuv_pos["antal"] > 1e-9 else 0.0
    pv = kontant + pos_varde

    # 9. Benchmark: BTC och SPY sedan allra första körningen
    btc_benchmark = spy_benchmark = None
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/strat_paper_nav?order=skapad.asc&limit=1",
            headers=_h(sb_key), timeout=10,
        )
        first_rows = r.json() if r.status_code == 200 else []
        if first_rows:
            start_datum = first_rows[0]["skapad"][:10]
            for bm_sym in ["BTC", "SPY"]:
                try:
                    r1 = httpx.get(
                        f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{bm_sym}"
                        f"&datum=gte.{start_datum}&order=datum.asc&limit=1",
                        headers=_h(sb_key), timeout=10,
                    )
                    r2 = httpx.get(
                        f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{bm_sym}&order=datum.desc&limit=1",
                        headers=_h(sb_key), timeout=10,
                    )
                    if r1.is_success and r1.json() and r2.is_success and r2.json():
                        sp = float(r1.json()[0]["pris"])
                        cp = float(r2.json()[0]["pris"])
                        val = (START_KAPITAL / sp) * cp
                        if bm_sym == "BTC":
                            btc_benchmark = val
                        else:
                            spy_benchmark = val
                except Exception:
                    pass
        else:
            # Första körningen — ingen historik att jämföra mot ännu
            btc_benchmark = spy_benchmark = START_KAPITAL
    except Exception as e:
        print(f"  STRAT benchmark-fel: {e}")

    # 10. Spara NAV-snapshot i strat_paper_nav
    nav_row: dict = {
        "portfölj_värde_usd": round(pv, 4),
        "kontant_usd":        round(kontant, 4),
        "start_kapital_usd":  START_KAPITAL,
        "aktiv_strategi":     strategi_id_val,
        "aktiv_symbol":       aktiv_symbol,
        "signal":             signal,
        "backtest_avk_pct":   round(total_avk, 2),
    }
    if btc_benchmark is not None:
        nav_row["btc_benchmark_usd"] = round(btc_benchmark, 4)
    if spy_benchmark is not None:
        nav_row["spy_benchmark_usd"] = round(spy_benchmark, 4)
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/strat_paper_nav",
            json=nav_row,
            headers={**_h(sb_key), "Prefer": "return=minimal"},
            timeout=10,
        )
    except Exception as e:
        print(f"  STRAT NAV-spara: {e}")

    # 11. Uppdatera hedgefonder.nav_per_andel för STRAT
    # NAV = pv / 100 referensenheter (10 000 USD start = 100 enheter à 100 USD/st).
    # STRAT är inte i Python-FONDER så inga investerare skapas via bootstrap/investeringsrunda.
    try:
        strat_fond = hamta_fond(sb_key, "STRAT")
        if strat_fond:
            strat_nav = round(pv / 100, 4)
            total_and = float(strat_fond.get("total_andelar") or 0)
            spara_nav_snapshot(sb_key, strat_fond["id"], strat_nav, round(pv, 2))
            uppdatera_fond_nav(sb_key, strat_fond["id"], strat_nav, total_and)
    except Exception as e:
        print(f"  STRAT hedgefond NAV-uppdatering: {e}")

    pnl = pv - START_KAPITAL
    print(f"  STRAT portfölj: {pv:.2f} USD ({pnl:+.2f} USD / {pnl/START_KAPITAL*100:+.1f}%)")
    if btc_benchmark:
        print(f"  BTC benchmark:  {btc_benchmark:.2f} USD ({(btc_benchmark/START_KAPITAL-1)*100:+.1f}%)")
    if spy_benchmark:
        print(f"  SPY benchmark:  {spy_benchmark:.2f} USD ({(spy_benchmark/START_KAPITAL-1)*100:+.1f}%)")


if __name__ == "__main__":
    main()
