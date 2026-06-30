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

import os, sys, math, random, re, urllib.parse
import httpx

from agenter import AGENTER
from supabase_utils import (
    SB_URL, kop_etf, spara_civilisations_minne,
    ETF_KRYPTO_PREFERENSER,
)
from ai_klient import hamta_kort_fns


# ── LLM-anrop ─────────────────────────────────────────────────────────────────

def _llm(system: str, prompt: str, max_tokens: int = 60) -> str:
    payload = {
        "model": "llama-3.3-70b-specdec",
        "messages": [{"role": "system", "content": system},
                     {"role": "user",   "content": prompt}],
        "max_tokens": max_tokens, "temperature": 0.8,
    }
    for _name, fn in hamta_kort_fns(payload, system, prompt, max_tokens, source="finans"):
        try:
            r = fn()
            if r:
                return r
        except Exception:
            pass
    return "4"


def _parse_val(svar: str) -> str:
    """
    Extraherar 1/2/3/4 ur LLM-svaret.
    Siffror förekommer inte i svenska ord — ingen risk för falska träffar.
    """
    # 1. Exakt rad
    for rad in svar.strip().splitlines():
        if rad.strip() in ("1", "2", "3", "4"):
            return rad.strip()

    # 2. Explicit prefix: "SVAR: 2" eller "VAL: 3"
    m = re.search(r'(?:SVAR|VAL|VÄLJER|CHOOSE)[:\s]+([1-4])', svar)
    if m:
        return m.group(1)

    # 3. Siffra med separator: "2)" eller "3."
    m = re.search(r'\b([1-4])[).:\s]', svar)
    if m:
        return m.group(1)

    # 4. Ensam siffra var som helst
    m = re.search(r'\b([1-4])\b', svar)
    if m:
        return m.group(1)

    return "4"


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


# ── Finansiell arketyp per agent ──────────────────────────────────────────────

# Styr vilken typ av finansiellt beteende som är naturligt för agenten.
# "etf"  → aktiv investerare, föredrar B
# "spar" → konservativ sparare, föredrar A
# "lan"  → risktagare eller kapitalbehövande, föredrar C
# "mix"  → blandat — LLM avgör fritt
AGENT_FINANS_ARKETYP: dict[str, str] = {
    "Nationalekonom":       "spar",   # data-driven, låg risk
    "Miljöaktivist":        "spar",   # skeptisk mot krypto, hellre trygghet
    "Teknikoptimist":       "etf",    # tror på innovation och tillväxt
    "Konservativ debattör": "spar",   # tradition och stabilitet
    "Jurist":               "spar",   # rättssäkerhet, undviker spekulationer
    "Journalist":           "lan",    # behöver likviditet, berättar om risker utifrån
    "Filosof":              "mix",    # väger för- och nackdelar, kan gå åt alla håll
    "Läkare":               "spar",   # lång planeringshorisont, låg riskaptit
    "Psykolog":             "mix",    # förstår beteenden, analyserar sina egna impulser
    "Historiker":           "etf",    # BTC som digitalt guld — historisk parallell
    "Sociolog":             "lan",    # ifrågasätter kapitalackumulering, tar risk för att omfördela
    "Kryptoanalytiker":     "etf",    # självklart val — lever och andas krypto
    "Den hungriga":         "lan",    # grundbehov först, lånar för att klara sig
    "Mamman":               "spar",   # trygghetsmentalitet, sparar för familjen
    "Den sura":             "lan",    # frustrerad, tar lån för att prova lyckan
    "Den trötta":           "spar",   # orkar inte tänka, tar minsta möjliga risk
    "Den stressade":        "lan",    # för mycket att göra, behöver kapital nu
    "Den lugna":            "spar",   # ser saker i perspektiv, väljer trygghet
    "Pensionären":          "spar",   # 71 år, vill ha ro, sparar det han har
    "Tonåringen":           "etf",    # FOMO, hoppas på snabb vinst
    "Den nostalgiske":      "spar",   # nostalgi = trygghet, undviker nytt
    "Hypokondrikern":       "spar",   # orolig för förluster, googlar risker kl 02
    "Optimisten":           "etf",    # alltid positiv — marknaden går upp!
    "Den rike":             "etf",    # har råd att ta risk, investerar stort
}

# Förklaringstext som injiceras i prompten baserat på arketyp
_ARKETYP_HINT = {
    "etf":  "Du är en aktiv investerare med hög riskaptit som ser kryptovalutor som ett naturligt placeringsalternativ.",
    "spar": "Du föredrar trygghet och stabilitet — att låta pengarna växa säkert i banken är din naturliga instinkt.",
    "lan":  "Du är beredd att ta finansiell risk och se lån som ett verktyg för att skaffa handlingsfrihet.",
    "mix":  "Du väger noga för- och nackdelar och väljer det alternativ som faktiskt passar din situation bäst just nu.",
}


# ── Beslutslogik ───────────────────────────────────────────────────────────────

def bygg_prompt(agent: dict, status: dict) -> tuple[str, str]:
    """Returnerar (system, user) för LLM-beslutsanropet."""
    # Tre första icke-tomma raderna av systemprompt för mer kontext
    rader = [r.strip() for r in agent["system"].strip().splitlines() if r.strip()]
    system_kontext = " ".join(rader[:3])

    saldo    = status["saldo"]
    lan      = status["lan"]
    etf      = status["etf"]
    har_lan  = lan is not None
    etf_text = ", ".join(f"{e['symbol']} ({e['investerat_kr']:.0f} kr)" for e in etf) if etf else "inget"
    lan_text = f"{lan['saldo_kvar']:.0f} kr kvar (5 %/vecka)" if har_lan else "inget"

    arketyp      = AGENT_FINANS_ARKETYP.get(agent["namn"], "mix")
    arketyp_hint = _ARKETYP_HINT[arketyp]

    # Situationshint baserad på saldo
    if saldo < 200:
        situtations_hint = "Ditt saldo är mycket lågt — ett lån kan ge dig handlingsfrihet."
    elif saldo > 1500:
        situtations_hint = "Du har ett starkt saldo — du kan unna dig att ta risk eller spara tryggt."
    else:
        situtations_hint = ""

    system = (
        f"{system_kontext}\n\n"
        f"{arketyp_hint}"
        + (f" {situtations_hint}" if situtations_hint else "")
        + "\n\nDu fattar nu ett ekonomiskt beslut för din plånbok i AI-civilisationens ekonomisystem. "
        "Svara med EXAKT detta format och inget annat:\nSVAR: N\n(där N är siffran 1, 2, 3 eller 4)"
    )

    etf_prefs  = ETF_KRYPTO_PREFERENSER.get(agent["namn"], ["BTC", "ETH"])
    symbol     = etf_prefs[0] if etf_prefs else "BTC"
    etf_belopp = 200 if agent["namn"] in ("Den rike", "Kryptoanalytiker") else 150

    # Bygg val-listan — markera C som otillgänglig om agent redan har lån
    c_status = " ⚠ EJ MÖJLIGT — du har redan ett aktivt lån" if har_lan else ""

    user = (
        f"Din ekonomiska situation:\n"
        f"  Saldo:       {saldo:.0f} kr\n"
        f"  Aktivt lån:  {lan_text}\n"
        f"  ETF-innehav: {etf_text}\n\n"
        f"Välj ETT av fyra alternativ:\n"
        f"  1) Sätt in pengar på banken — sparränta betalas ut direkt (+0.5 % av saldo, min 1 kr)\n"
        f"  2) Köp {symbol}-ETF för {etf_belopp} kr — kryptopriset styr din avkastning\n"
        f"  3) Ta ett banklån — 200–500 kr, 5 % veckoränta, ger omedelbar likviditet{c_status}\n"
        f"  4) Avstå — väljs BARA om inget av alternativen ovan passar din personlighet\n\n"
        f"Din personlighetstyp pekar mot: "
        + {"etf": "2 (investering)", "spar": "1 (sparande)", "lan": "3 (lån)", "mix": "1, 2 eller 3 (välj fritt)"}[arketyp]
        + "\n\nSvara exakt så här (ersätt N med ditt val):\nSVAR: N"
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

    statistik = {"1": 0, "2": 0, "3": 0, "4": 0, "fel": 0}

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
        print(f"  LLM: {svar!r:.80} → val={val}")

        # Om 3 valt men agent redan har lån → falla tillbaka på 1
        if val == "3" and lan is not None:
            print(f"  [3] → lån ej möjligt (redan aktivt lån) → faller tillbaka på 1")
            val = "1"

        # Utför valet
        if val == "1":
            ranta = spara_i_bank(sb_key, namn, saldo)
            print(f"  [1] Sparar i banken → +{ranta} kr sparränta (saldo {saldo:.0f} → {saldo + ranta:.0f} kr)")

        elif val == "2":
            etf_prefs  = ETF_KRYPTO_PREFERENSER.get(namn, ["BTC", "ETH"])
            symbol     = etf_prefs[0] if etf_prefs else "BTC"
            etf_belopp = 200 if namn in ("Den rike", "Kryptoanalytiker") else 150
            if saldo < etf_belopp:
                print(f"  [2] ETF valt men saldo {saldo:.0f} < {etf_belopp} kr → faller tillbaka på 1")
                ranta = spara_i_bank(sb_key, namn, saldo)
                print(f"      Sparar i banken → +{ranta} kr")
                val = "1"
            else:
                ok = kop_etf(sb_key, namn, symbol, etf_belopp)
                if ok:
                    print(f"  [2] Köpte {symbol}-ETF för {etf_belopp} kr")
                else:
                    print(f"  [2] ETF-köp misslyckades (ingen prisdata?) → 4")
                    val = "4"

        elif val == "3":
            belopp = ta_lan_frivilligt(sb_key, namn, saldo)
            if belopp > 0:
                print(f"  [3] Tog lån på {belopp} kr (saldo {saldo:.0f} → {saldo + belopp:.0f} kr)")
            else:
                print(f"  [3] Lån ej möjligt → 4")
                val = "4"

        else:  # 4
            print(f"  [4] Avstår")

        statistik[val] = statistik.get(val, 0) + 1

    # Sammanfattning
    print(f"\n{'=' * 60}")
    print("  SAMMANFATTNING")
    print(f"{'=' * 60}")
    print(f"  1) Sparade i banken:  {statistik['1']} agenter")
    print(f"  2) Köpte krypto-ETF:  {statistik['2']} agenter")
    print(f"  3) Tog banklån:       {statistik['3']} agenter")
    print(f"  4) Avstod:            {statistik['4']} agenter")
    if statistik["fel"]:
        print(f"  ✗ Fel:               {statistik['fel']} agenter")
    print()


if __name__ == "__main__":
    main()
