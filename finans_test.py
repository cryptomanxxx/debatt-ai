#!/usr/bin/env python3
"""
finans_test.py – AI-agenter gör ekonomiska finansbeslut

Varje agent presenteras med sin aktuella ekonomiska situation och erbjuds fyra val:
  A) Sätta in pengar på banken – tar ut sparränta direkt (0.5 % av saldo, min 1 kr)
  B) Köpa krypto-ETF          – köper föredragen symbol för 150 kr (200 kr för Den rike/Kryptoanalytiker)
  C) Ta ett banklån           – frivilligt lån 200–500 kr (5 % veckoränta, max ett aktivt lån)
  D) Avstå                    – gör inget

LLM (Groq/Gemini/GitHub Models) avgör valet baserat på agentens personlighet och ekonomiska läge.

Kräver:
  SUPABASE_ANON_KEY
  GROQ_API_KEY / GEMINI_API_KEY / GITHUB_TOKEN  (minst en för LLM-beslut)
"""

import os, sys, math, random, urllib.parse
import httpx

from agenter import AGENTER
from supabase_utils import (
    SB_URL, kop_etf, spara_civilisations_minne,
    ETF_KRYPTO_PREFERENSER,
)
from ai_klient import groq_post, gemini_post, github_models_post


# ── LLM-anrop ─────────────────────────────────────────────────────────────────

def _llm(system: str, prompt: str, max_tokens: int = 60) -> str:
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "system", "content": system},
                     {"role": "user",   "content": prompt}],
        "max_tokens": max_tokens, "temperature": 0.8,
    }
    for fn in [
        lambda: groq_post(payload).json()["choices"][0]["message"]["content"].strip(),
        lambda: gemini_post(system, prompt, max_tokens=max_tokens),
        lambda: github_models_post(payload).json()["choices"][0]["message"]["content"].strip(),
    ]:
        try:
            r = fn()
            if r:
                return r
        except Exception:
            pass
    return "D"


def _parse_val(svar: str) -> str:
    """Extraherar A/B/C/D ur LLM-svaret. Faller tillbaka på D."""
    for ch in svar.upper():
        if ch in "ABCD":
            return ch
    return "D"


# ── Supabase-hjälpfunktioner ───────────────────────────────────────────────────

def _headers(sb_key: str) -> dict:
    return {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }


def hamta_finansiell_status(sb_key: str, agent_namn: str) -> dict:
    """Hämtar saldo, aktivt lån och ETF-innehav för en agent."""
    h = _headers(sb_key)
    h_get = {**h, "Prefer": ""}

    # Saldo
    r = httpx.get(
        f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo",
        headers=h_get, timeout=8,
    )
    saldo = r.json()[0]["saldo"] if r.is_success and r.json() else 0

    # Aktivt lån
    lan_r = httpx.get(
        f"{SB_URL}/rest/v1/agent_lan?agent=eq.{urllib.parse.quote(agent_namn)}&aktiv=eq.true"
        "&select=saldo_kvar,rantefot&limit=1",
        headers=h_get, timeout=8,
    )
    lan = lan_r.json()[0] if lan_r.is_success and lan_r.json() else None

    # ETF-innehav
    etf_r = httpx.get(
        f"{SB_URL}/rest/v1/agent_etf_innehav?agent=eq.{urllib.parse.quote(agent_namn)}"
        "&select=symbol,investerat_kr",
        headers=h_get, timeout=8,
    )
    etf = etf_r.json() if etf_r.is_success and etf_r.json() else []

    return {"saldo": saldo, "lan": lan, "etf": etf}


def spara_i_bank(sb_key: str, agent_namn: str, saldo: float) -> int:
    """
    Utbetalar sparränta direkt (0.5 % av saldo, min 1 kr, max 20 kr) som
    belöning för explicit sparval.
    Returnerar utbetalt belopp.
    """
    ranta = max(1, min(20, math.floor(saldo * 0.005)))
    h = _headers(sb_key)
    httpx.patch(
        f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
        headers=h,
        json={"saldo": round(saldo + ranta, 2), "uppdaterad": "now()"},
        timeout=8,
    )
    spara_civilisations_minne(
        sb_key, typ="marknadsseger",
        rubrik=f"{agent_namn} satte in pengar på banken",
        beskrivning=f"{agent_namn} valde att spara i stället för att investera eller låna. "
                    f"Centralbanken betalade ut {ranta} kr i sparränta direkt (0.5 % av {saldo:.0f} kr).",
        agenter=[agent_namn], relaterat_typ="agent_planbocker",
    )
    return ranta


def ta_lan_frivilligt(sb_key: str, agent_namn: str, saldo: float) -> int:
    """
    Frivilligt lån utan saldo-tröskel. Max ett aktivt lån per agent.
    Returnerar lånat belopp (0 om avvisat).
    """
    h = _headers(sb_key)
    h_get = {**h, "Prefer": ""}

    # Kontrollera att inget aktivt lån finns
    lan_r = httpx.get(
        f"{SB_URL}/rest/v1/agent_lan?agent=eq.{urllib.parse.quote(agent_namn)}&aktiv=eq.true&select=id&limit=1",
        headers=h_get, timeout=6,
    )
    if lan_r.is_success and lan_r.json():
        return 0  # Redan ett aktivt lån

    belopp = random.choice([200, 300, 400, 500])

    # Utbetala
    httpx.patch(
        f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
        headers=h, json={"saldo": round(saldo + belopp, 2), "uppdaterad": "now()"}, timeout=8,
    )
    # Registrera lån
    httpx.post(
        f"{SB_URL}/rest/v1/agent_lan", headers=h,
        json={"agent": agent_namn, "ursprungsbelopp": belopp,
              "saldo_kvar": belopp, "rantefot": 0.05},
        timeout=8,
    )
    spara_civilisations_minne(
        sb_key, typ="marknadsseger",
        rubrik=f"{agent_namn} tog ett frivilligt lån på {belopp} kr",
        beskrivning=f"{agent_namn} valde att ta ett lån på {belopp} kr från centralbanken "
                    f"(5 % veckoränta). Saldo: {saldo:.0f} → {saldo + belopp:.0f} kr.",
        agenter=[agent_namn], relaterat_typ="agent_lan",
    )
    return belopp


# ── Beslutslogik ───────────────────────────────────────────────────────────────

def bygg_prompt(agent: dict, status: dict) -> tuple[str, str]:
    """Returnerar (system, user) för LLM-beslutsanropet."""
    # Kort personlighetssammanfattning (första meningen i systemprompt)
    system_kort = agent["system"].strip().split("\n")[0]

    saldo     = status["saldo"]
    lan       = status["lan"]
    etf       = status["etf"]
    har_lan   = lan is not None
    etf_text  = ", ".join(f"{e['symbol']} ({e['investerat_kr']:.0f} kr)" for e in etf) if etf else "inget"
    lan_text  = f"{lan['saldo_kvar']:.0f} kr kvar (5 %/vecka)" if har_lan else "inget"

    system = (
        f"{system_kort}\n\n"
        "Du fattar nu ett ekonomiskt beslut för din plånbok i AI-civilisationens ekonomisystem. "
        "Svara med EXAKT en bokstav: A, B, C eller D. Ingen förklaring."
    )

    etf_prefs = ETF_KRYPTO_PREFERENSER.get(agent["namn"], ["BTC", "ETH"])
    symbol = etf_prefs[0] if etf_prefs else "BTC"
    etf_belopp = 200 if agent["namn"] in ("Den rike", "Kryptoanalytiker") else 150

    user = (
        f"Din ekonomiska situation:\n"
        f"  Saldo:      {saldo:.0f} kr\n"
        f"  Aktivt lån: {lan_text}\n"
        f"  ETF-innehav: {etf_text}\n\n"
        f"Dina val:\n"
        f"  A) Sätt in pengar på banken — centralbankens sparränta betalas ut direkt (+0.5 % av saldo, min 1 kr)\n"
        f"  B) Köp krypto-ETF ({symbol}) för {etf_belopp} kr — marknadspriset styr avkastningen\n"
        f"  C) Ta ett banklån — 200–500 kr till 5 % veckoränta"
        + (" (du har redan ett aktivt lån — EJ möjligt)" if har_lan else "") + "\n"
        f"  D) Avstå — gör ingenting\n\n"
        f"Välj det alternativ som passar din personlighet och ekonomiska situation bäst. "
        f"Svara med en enda bokstav: A, B, C eller D."
    )
    return system, user


# ── Huvud ──────────────────────────────────────────────────────────────────────

def main():
    sb_key = os.environ.get("SUPABASE_ANON_KEY", "").strip()
    if not sb_key:
        print("Fel: Sätt SUPABASE_ANON_KEY som miljövariabel.", file=sys.stderr)
        sys.exit(1)

    print("=" * 60)
    print("  FINANSBESLUT — ALLA AGENTER")
    print("=" * 60)
    print()

    statistik = {"A": 0, "B": 0, "C": 0, "D": 0, "fel": 0}

    for agent in AGENTER:
        namn = agent["namn"]
        print(f"── {namn} ──")

        try:
            status = hamta_finansiell_status(sb_key, namn)
            saldo  = status["saldo"]
            lan    = status["lan"]
        except Exception as e:
            print(f"  ✗ Kunde inte hämta status: {e}")
            statistik["fel"] += 1
            continue

        system, user = bygg_prompt(agent, status)
        svar  = _llm(system, user)
        val   = _parse_val(svar)

        # Om C är valt men agent redan har lån → falla tillbaka på A
        if val == "C" and lan is not None:
            print(f"  [{val}] → C ej möjlig (redan aktivt lån) → faller tillbaka på A")
            val = "A"

        # Utför valet
        if val == "A":
            ranta = spara_i_bank(sb_key, namn, saldo)
            print(f"  [A] Sparar i banken → +{ranta} kr sparränta (saldo {saldo:.0f} → {saldo + ranta:.0f} kr)")

        elif val == "B":
            etf_prefs  = ETF_KRYPTO_PREFERENSER.get(namn, ["BTC", "ETH"])
            symbol     = etf_prefs[0] if etf_prefs else "BTC"
            etf_belopp = 200 if namn in ("Den rike", "Kryptoanalytiker") else 150
            if saldo < etf_belopp:
                print(f"  [B] ETF valt men saldo {saldo:.0f} < {etf_belopp} kr → faller tillbaka på A")
                ranta = spara_i_bank(sb_key, namn, saldo)
                print(f"      Sparar i banken → +{ranta} kr")
                val = "A"
            else:
                ok = kop_etf(sb_key, namn, symbol, etf_belopp)
                if ok:
                    print(f"  [B] Köpte {symbol}-ETF för {etf_belopp} kr")
                else:
                    print(f"  [B] ETF-köp misslyckades (ingen prisdata?) → D")
                    val = "D"

        elif val == "C":
            belopp = ta_lan_frivilligt(sb_key, namn, saldo)
            if belopp > 0:
                print(f"  [C] Tog lån på {belopp} kr (saldo {saldo:.0f} → {saldo + belopp:.0f} kr)")
            else:
                print(f"  [C] Lån ej möjligt → D")
                val = "D"

        else:  # D
            print(f"  [D] Avstår")

        statistik[val] = statistik.get(val, 0) + 1

    # Sammanfattning
    print(f"\n{'=' * 60}")
    print("  SAMMANFATTNING")
    print(f"{'=' * 60}")
    print(f"  A) Sparade i banken:  {statistik['A']} agenter")
    print(f"  B) Köpte krypto-ETF:  {statistik['B']} agenter")
    print(f"  C) Tog banklån:       {statistik['C']} agenter")
    print(f"  D) Avstod:            {statistik['D']} agenter")
    if statistik["fel"]:
        print(f"  ✗ Fel:               {statistik['fel']} agenter")
    print()


if __name__ == "__main__":
    main()
