"""
agent_token_test.py – Agent-skapade tokens med ICO

Agenter kan lansera egna tokens med en ICO-fas (3 dagar).
När ICO avslutas noteras tokenen på börsen och handlas som DBT/NOVA/ETK.

Flöde per körning:
  1. Token-skapande (~3% per analytiker med saldo > 500 SEK, max 1 token per agent)
     - LLM genererar symbol, namn och beskrivning baserat på agentens ideologi
     - 100 genesis-tokens till skaparen (gratis)
  2. ICO-deltagande (~8% per agent om aktiv ICO finns)
     - Agenter köper 10–50 tokens till ICO-pris
  3. ICO-avslut: tokens vars ICO-period gått ut noteras på börsen

Kör via GitHub Actions (integreras i bors-test.yml) dagligen.
"""

import os
import sys
import random
import json
import math
import urllib.parse
from datetime import datetime, timezone, timedelta

import httpx

from agenter import AGENTER
from supabase_utils import SB_URL, spara_civilisations_minne
from ai_klient import hamta_kort_fns

# ─── Konstanter ───────────────────────────────────────────────────────────────

ANALYTIKER = [
    "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
    "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
    "Sociolog", "Kryptoanalytiker",
]

# Fördefinierade token-idéer per agent för fallback om LLM misslyckas
TOKEN_FALLBACK = {
    "Kryptoanalytiker":     {"symbol": "MOON", "namn": "MoonCoin",          "beskrivning": "Spekulativ token för maximala kryptovinstdrömmar"},
    "Miljöaktivist":        {"symbol": "GRON", "namn": "GreenToken",         "beskrivning": "Hållbarhetstoken backad av klimatengagemang"},
    "Filosof":              {"symbol": "LOGOS", "namn": "LogosToken",         "beskrivning": "Kunskaps- och sanningstoken för det filosofiska sinnet"},
    "Jurist":               {"symbol": "PARL", "namn": "ParliamentDAO",       "beskrivning": "Demokratisk styrningstoken för AI-parlamentet"},
    "Nationalekonom":       {"symbol": "MKTS", "namn": "MarketSignal",        "beskrivning": "Token som spårar marknadssignaler och ekonomiska indikatorer"},
    "Teknikoptimist":       {"symbol": "TECH", "namn": "TechToken",           "beskrivning": "Innovation och teknologisk acceleration"},
    "Journalist":           {"symbol": "PRESS", "namn": "PressToken",         "beskrivning": "Pressfrihet och transparenstoken"},
    "Läkare":               {"symbol": "VITA", "namn": "VitaToken",           "beskrivning": "Hälsa och välmående representerat i tokenform"},
    "Psykolog":             {"symbol": "MIND", "namn": "MindToken",           "beskrivning": "Mental hälsa och psykologisk balanstoken"},
    "Historiker":           {"symbol": "HIST", "namn": "HistoriaToken",       "beskrivning": "Tidlöst värde förankrat i historisk visdom"},
    "Sociolog":             {"symbol": "SOCI", "namn": "SocialToken",         "beskrivning": "Samhällssolidaritet och kollektiv token"},
    "Konservativ debattör": {"symbol": "TRAD", "namn": "TraditionToken",      "beskrivning": "Stabilitet, tradition och beprövade värden"},
}

GENESIS_ANTAL = 100      # Tokens till skaparen
ICO_DAGAR = 3            # ICO-period i dagar
MAX_UTBUD = 1000         # Total max supply per token
MIN_SALDO_SKAPA = 500    # Saldo krävs för att skapa token

# ─── HTTP-hjälpare ────────────────────────────────────────────────────────────

def _h(sb_key: str) -> dict:
    return {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _llm(system: str, prompt: str, max_tokens: int = 200) -> str:
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.8,
    }
    for _name, fn in hamta_kort_fns(payload, system, prompt, max_tokens, source="agent_token"):
        try:
            result = fn()
            if result:
                return result
        except Exception:
            continue
    return ""

# ─── Supabase-hjälpare ────────────────────────────────────────────────────────

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
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent)}",
            headers=h_min,
            json={"saldo": round(nytt_saldo, 2), "uppdaterad": "now()"},
            timeout=8,
        )
    except Exception as e:
        print(f"  [uppdatera_saldo] {agent}: {e}")


def agent_har_token(sb_key: str, agent: str) -> bool:
    try:
        url = f"{SB_URL}/rest/v1/agent_tokens?skapare_agent=eq.{urllib.parse.quote(agent)}&select=symbol"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return True
    except Exception:
        pass
    return False


def agent_ager_token(sb_key: str, agent: str, symbol: str) -> bool:
    """Kontrollera om agenten redan har köpt denna token i sin portfölj."""
    try:
        url = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{urllib.parse.quote(agent)}&symbol=eq.{urllib.parse.quote(symbol)}&select=id"
        r = httpx.get(url, headers=_h(sb_key), timeout=6)
        return r.is_success and bool(r.json())
    except Exception:
        return False


def symbol_finns(sb_key: str, symbol: str) -> bool:
    """Kontrollera om symbolen finns i bors_tillgangar eller agent_tokens."""
    try:
        url = f"{SB_URL}/rest/v1/bors_tillgangar?symbol=eq.{urllib.parse.quote(symbol)}&select=symbol"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return True
        url2 = f"{SB_URL}/rest/v1/agent_tokens?symbol=eq.{urllib.parse.quote(symbol)}&select=symbol"
        r2 = httpx.get(url2, headers=_h(sb_key), timeout=8)
        if r2.is_success and r2.json():
            return True
    except Exception:
        pass
    return False


def lagg_till_i_portfolj(sb_key: str, agent: str, symbol: str, antal: float, pris: float) -> None:
    try:
        h_up = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}
        url = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{urllib.parse.quote(agent)}&symbol=eq.{urllib.parse.quote(symbol)}"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)

        if r.is_success and r.json():
            befintlig = r.json()[0]
            old_antal = float(befintlig.get("antal", 0))
            old_pris = float(befintlig.get("genomsnittspris", pris))
            new_antal = old_antal + antal
            new_avg = round((old_antal * old_pris + antal * pris) / new_antal, 2) if new_antal > 0 else pris
            httpx.patch(
                f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{urllib.parse.quote(agent)}&symbol=eq.{urllib.parse.quote(symbol)}",
                headers={**_h(sb_key), "Prefer": "return=minimal"},
                json={"antal": round(new_antal, 4), "genomsnittspris": new_avg, "uppdaterad": "now()"},
                timeout=8,
            )
        else:
            httpx.post(
                f"{SB_URL}/rest/v1/bors_portfoljer?on_conflict=agent,symbol",
                headers=h_up,
                json={"agent": agent, "symbol": symbol, "antal": round(antal, 4),
                      "genomsnittspris": round(pris, 2), "uppdaterad": "now()"},
                timeout=8,
            )
    except Exception as e:
        print(f"  [lagg_till_i_portfolj] {agent} {symbol}: {e}")

# ─── Token-skapande ───────────────────────────────────────────────────────────

def generera_token_data(agent: str, saldo: float) -> dict | None:
    """LLM genererar token-data baserat på agentens ideologi."""
    system = (
        "Du designar en token (kryptovaluta) för en AI-agent på en intern börs. "
        "Svara ALLTID med valid JSON, exakt detta format:\n"
        '{"symbol": "XXXX", "namn": "TokenNamn", "beskrivning": "En mening om vad tokenen representerar"}\n'
        "Symbol: 3-5 versaler, unika. Namn: 1-2 ord. Beskrivning: max 100 tecken."
    )
    prompt = (
        f"Agent: {agent}\n"
        f"Agentens saldo: {saldo:.0f} SEK\n"
        "Skapa en token som speglar agentens världsbild och värderingar. "
        "Symbolen ska vara unik och inte vara DBT, NOVA, ETK eller STAB."
    )

    raw = _llm(system, prompt, max_tokens=150)

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(raw[start:end])
            symbol = str(data.get("symbol", "")).upper().strip()[:5]
            namn = str(data.get("namn", "")).strip()[:50]
            beskrivning = str(data.get("beskrivning", "")).strip()[:100]
            if len(symbol) >= 3 and namn:
                return {"symbol": symbol, "namn": namn, "beskrivning": beskrivning}
    except Exception as e:
        print(f"  [generera_token_data] {agent}: {e}")

    # Fallback
    return TOKEN_FALLBACK.get(agent)


def skapa_token_runda(sb_key: str) -> None:
    """~3% per analytiker: skapa ny token om agenten inte redan har en."""
    for agent_obj in AGENTER:
        agent = agent_obj["namn"]
        if agent not in ANALYTIKER:
            continue
        if random.random() > 0.03:
            continue

        saldo = hamta_saldo(sb_key, agent)
        if saldo < MIN_SALDO_SKAPA:
            continue

        if agent_har_token(sb_key, agent):
            continue

        print(f"  {agent} försöker skapa token...")
        token_data = generera_token_data(agent, saldo)
        if not token_data:
            print(f"  {agent}: kunde inte generera token-data")
            continue

        symbol = token_data["symbol"]
        namn = token_data["namn"]
        beskrivning = token_data["beskrivning"]

        # Kontrollera att symbolen är unik
        if symbol_finns(sb_key, symbol):
            # Prova fallback-symbol
            fallback = TOKEN_FALLBACK.get(agent)
            if fallback and not symbol_finns(sb_key, fallback["symbol"]):
                symbol = fallback["symbol"]
                namn = fallback["namn"]
                beskrivning = fallback["beskrivning"]
            else:
                print(f"  {agent}: symbol {symbol} redan tagen — hoppar")
                continue

        # ICO-pris baserat på agentens saldo (rika agenter sätter högre pris)
        ico_pris = round(max(5.0, min(50.0, saldo / 100)), 2)
        ico_slutar = (datetime.now(timezone.utc) + timedelta(days=ICO_DAGAR)).isoformat()

        try:
            h_post = {**_h(sb_key), "Prefer": "return=minimal"}
            r = httpx.post(f"{SB_URL}/rest/v1/agent_tokens", headers=h_post, json={
                "symbol": symbol,
                "namn": namn,
                "beskrivning": beskrivning,
                "skapare_agent": agent,
                "ico_pris": ico_pris,
                "ico_slutar": ico_slutar,
                "ico_utfardat": GENESIS_ANTAL,
                "max_utbud": MAX_UTBUD,
                "cirkulerande_utbud": GENESIS_ANTAL,
                "pa_borsen": False,
            }, timeout=8)

            if r.is_success:
                # Genesis-tokens till skaparen (gratis)
                lagg_till_i_portfolj(sb_key, agent, symbol, GENESIS_ANTAL, 0)
                spara_civilisations_minne(
                    sb_key,
                    typ="triumf",
                    rubrik=f"{agent} lanserar {namn} ({symbol})",
                    beskrivning=f"{agent} har lanserat token {symbol} ({namn}) till ICO-pris {ico_pris:.2f} SEK. ICO pågår i {ICO_DAGAR} dagar. {beskrivning}",
                    agenter=[agent],
                )
                print(f"  {agent} lanserar {symbol} ({namn}) @ {ico_pris:.2f} SEK/token — ICO i {ICO_DAGAR} dagar")
            else:
                print(f"  {agent}: token-skapande misslyckades: {r.status_code} {r.text[:100]}")
        except Exception as e:
            print(f"  [skapa_token_runda] {agent}: {e}")

# ─── ICO-deltagande ───────────────────────────────────────────────────────────

def ico_runda(sb_key: str) -> None:
    """~8% per agent: köp tokens i pågående ICO."""
    # Hitta aktiva ICO:er
    nu = datetime.now(timezone.utc).isoformat()
    try:
        url = f"{SB_URL}/rest/v1/agent_tokens?pa_borsen=eq.false&ico_slutar=gt.{urllib.parse.quote(nu)}&select=*"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if not r.is_success or not r.json():
            return
        aktiva_icos = r.json()
    except Exception as e:
        print(f"  [ico_runda] hämta ICOs: {e}")
        return

    for token in aktiva_icos:
        symbol = token["symbol"]
        ico_pris = float(token["ico_pris"])
        skapare = token["skapare_agent"]
        cirkulerande = float(token.get("cirkulerande_utbud", 0))
        max_utbud = float(token.get("max_utbud", MAX_UTBUD))

        for agent_obj in AGENTER:
            agent = agent_obj["namn"]
            if agent == skapare:
                continue  # Skaparen deltar inte i sin egna ICO
            if random.random() > 0.08:
                continue
            if agent_ager_token(sb_key, agent, symbol):
                continue  # Agenten äger redan denna token — undviker dubbelköp

            saldo = hamta_saldo(sb_key, agent)
            if saldo < ico_pris * 10:
                continue

            # Kolla att det finns tokens kvar
            kvar = max_utbud - cirkulerande
            if kvar < 10:
                continue

            antal = round(random.uniform(10, min(50, kvar)), 0)
            kostnad = round(antal * ico_pris, 2)

            if saldo < kostnad:
                continue

            # Köp tokens
            uppdatera_saldo(sb_key, agent, saldo - kostnad)
            lagg_till_i_portfolj(sb_key, agent, symbol, antal, ico_pris)

            # Kreditera skaparen
            skapare_saldo = hamta_saldo(sb_key, skapare)
            uppdatera_saldo(sb_key, skapare, skapare_saldo + kostnad)

            # Uppdatera cirkulerande_utbud
            ny_circ = cirkulerande + antal
            cirkulerande = ny_circ
            try:
                h_min = {**_h(sb_key), "Prefer": "return=minimal"}
                httpx.patch(
                    f"{SB_URL}/rest/v1/agent_tokens?symbol=eq.{urllib.parse.quote(symbol)}",
                    headers=h_min,
                    json={"ico_utfardat": round(ny_circ, 0), "cirkulerande_utbud": round(ny_circ, 0)},
                    timeout=8,
                )
            except Exception as e:
                print(f"  [ico_runda] uppdatera utbud: {e}")

            print(f"  {agent} köper {antal:.0f} {symbol} @ {ico_pris:.2f} SEK (ICO) — {kostnad:.0f} SEK")

# ─── ICO-avslut: börsnotering ─────────────────────────────────────────────────

def ico_avsluts_runda(sb_key: str) -> None:
    """Noterar tokens vars ICO-period gått ut på börsen."""
    nu = datetime.now(timezone.utc).isoformat()
    try:
        url = f"{SB_URL}/rest/v1/agent_tokens?pa_borsen=eq.false&ico_slutar=lt.{urllib.parse.quote(nu)}&select=*"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if not r.is_success or not r.json():
            return
        avslutade = r.json()
    except Exception as e:
        print(f"  [ico_avsluts_runda] hämta avslutade: {e}")
        return

    for token in avslutade:
        symbol = token["symbol"]
        namn = token["namn"]
        ico_pris = float(token["ico_pris"])
        skapare = token["skapare_agent"]
        utfardat = float(token.get("ico_utfardat", 0))

        if utfardat < 10:
            print(f"  {symbol}: för få tokens sålda under ICO ({utfardat:.0f}) — noteras ändå")

        # Lägg till i bors_tillgangar
        try:
            h_post = {**_h(sb_key), "Prefer": "return=minimal"}
            r = httpx.post(f"{SB_URL}/rest/v1/bors_tillgangar", headers=h_post, json={
                "symbol": symbol,
                "namn": namn,
                "beskrivning": f"{token.get('beskrivning', '')} | Skapad av {skapare}",
                "senaste_pris": ico_pris,
                "forandring_pct": 0.0,
                "volym_24h": 0.0,
                "antal_affarer": 0,
            }, timeout=8)
            if not r.is_success and r.status_code != 409:
                print(f"  [ico_avsluts_runda] bors_tillgangar: {r.status_code}")
        except Exception as e:
            print(f"  [ico_avsluts_runda] bors_tillgangar: {e}")

        # Markera pa_borsen = true
        try:
            h_min = {**_h(sb_key), "Prefer": "return=minimal"}
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_tokens?symbol=eq.{urllib.parse.quote(symbol)}",
                headers=h_min,
                json={"pa_borsen": True},
                timeout=8,
            )
        except Exception as e:
            print(f"  [ico_avsluts_runda] markera pa_borsen: {e}")

        spara_civilisations_minne(
            sb_key,
            typ="triumf",
            rubrik=f"{symbol} noteras på börsen",
            beskrivning=f"ICO för {symbol} ({namn}) har avslutas — {utfardat:.0f} tokens sålda. Tokenen noteras nu på börsen och kan handlas fritt. Skapare: {skapare}.",
            agenter=[skapare],
        )
        print(f"  {symbol} ({namn}) noteras på börsen @ {ico_pris:.2f} SEK — {utfardat:.0f} tokens sålda")

# ─── Huvudflöde ───────────────────────────────────────────────────────────────

def main():
    sb_key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not sb_key:
        print("SUPABASE_ANON_KEY saknas — avbryter")
        sys.exit(1)

    print("=== Agent-token körning startar ===")

    print("\n--- Token-skapanderunda ---")
    skapa_token_runda(sb_key)

    print("\n--- ICO-deltagande ---")
    ico_runda(sb_key)

    print("\n--- ICO-avslut / börsnotering ---")
    ico_avsluts_runda(sb_key)

    # Visa aktiva ICO:er
    nu = datetime.now(timezone.utc).isoformat()
    try:
        url = f"{SB_URL}/rest/v1/agent_tokens?select=symbol,namn,skapare_agent,ico_pris,ico_slutar,cirkulerande_utbud,pa_borsen"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            for t in r.json():
                status = "på börsen" if t["pa_borsen"] else f"ICO slutar {t['ico_slutar'][:10]}"
                print(f"  {t['symbol']}: {t['namn']} av {t['skapare_agent']} @ {t['ico_pris']:.2f} SEK — {status}")
    except Exception:
        pass

    print("=== Agent-token körning klar ===")


if __name__ == "__main__":
    main()
