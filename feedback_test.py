"""
Interagent Feedback-löner (IFL)
================================
Agenter betalar varandra frivilligt upp till 20% av sitt saldo som social feedback.
Kategorier: världsbild | håller_ord | lobbyism | negativ

~15% chans per agent per körning att skicka feedback.
Kräver saldo > 100 kr. Belopp: 10–20% av saldo, max 100 kr.
"""
import os
import sys
import random
import urllib.parse

import httpx

from supabase_utils import _llm_spel, _hamta_saldo, _ekonomi_headers, spara_civilisations_minne
from agent import AGENTER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

KATEGORIER = ["världsbild", "håller_ord", "lobbyism", "negativ"]
KATEGORI_ETIKETT = {
    "världsbild": "Stödjer min världsbild",
    "håller_ord":  "Håller sitt ord",
    "lobbyism":    "Framgångsrik lobbyism",
    "negativ":     "Negativ anpassning",
}
CHANS = 0.15
AGENT_NAMN = [a["namn"] for a in AGENTER]


def hamta_senaste_feedback(sb_key: str, fran: str, dagar: int = 3) -> list[str]:
    """Returnerar agenter som fran_agent redan betalat de senaste dagarna."""
    try:
        cutoff = f"now() - interval '{dagar} days'"
        r = httpx.get(
            f"{SB_URL}/rest/v1/feedback_rewards?fran_agent=eq.{urllib.parse.quote(fran)}"
            f"&skapad=gte.{urllib.parse.quote(cutoff)}&select=till_agent",
            headers=_ekonomi_headers(sb_key), timeout=8,
        )
        return [row["till_agent"] for row in (r.json() if r.is_success else [])]
    except Exception:
        return []


def spara_feedback(sb_key: str, fran: str, till: str, belopp: float, kategori: str, motivering: str) -> bool:
    try:
        r = httpx.post(
            f"{SB_URL}/rest/v1/feedback_rewards",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={"fran_agent": fran, "till_agent": till, "belopp": round(belopp, 2),
                  "kategori": kategori, "motivering": motivering},
            timeout=8,
        )
        return r.is_success
    except Exception:
        return False


def överför_saldo(sb_key: str, fran: str, till: str, belopp: float) -> bool:
    """Drar belopp från avsändarens saldo och krediterar mottagarens.
    Kompenserar avsändaren om kreditering av mottagaren misslyckas.
    """
    try:
        saldo_fran = _hamta_saldo(sb_key, fran)
        if saldo_fran < belopp:
            return False
        r1 = httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(fran)}",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={"saldo": int(round(saldo_fran - belopp)), "uppdaterad": "now()"},
            timeout=8,
        )
        if not r1.is_success:
            return False
        saldo_till = _hamta_saldo(sb_key, till)
        r2 = httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(till)}",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={"saldo": int(round(saldo_till + belopp)), "uppdaterad": "now()"},
            timeout=8,
        )
        if not r2.is_success:
            # Rollback: återställ avsändarens saldo
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(fran)}",
                headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
                json={"saldo": saldo_fran, "uppdaterad": "now()"},
                timeout=8,
            )
            return False
        return True
    except Exception:
        return False


def generera_motivering(agent: dict, till_namn: str, kategori: str) -> str:
    system = (
        f"Du är {agent['namn']}. {agent.get('personlighet', '')} "
        "Skriv en kort, karaktärsenlig motivering (1-2 meningar) på svenska."
    )
    prompt = (
        f"Du ger {till_namn} en social feedback-betalning i kategorin '{KATEGORI_ETIKETT[kategori]}'. "
        "Varför? Var konkret och personlig."
    )
    svar = _llm_spel(system, prompt, max_tokens=80)
    return svar or f"{KATEGORI_ETIKETT[kategori]} — generisk motivering."


def kör_feedback(agent: dict, sb_key: str) -> bool:
    namn = agent["namn"]
    saldo = _hamta_saldo(sb_key, namn)

    if saldo < 100:
        print(f"  {namn}: saldo {saldo} kr — hoppar över")
        return False

    # 15% chans
    if random.random() > CHANS:
        return False

    # Välj mottagare (ej sig själv, ej nyligen betalad)
    nyligen = hamta_senaste_feedback(sb_key, namn, dagar=3)
    kandidater = [n for n in AGENT_NAMN if n != namn and n not in nyligen]
    if not kandidater:
        print(f"  {namn}: inga tillgängliga mottagare")
        return False

    till = random.choice(kandidater)
    belopp = round(min(saldo * random.uniform(0.05, 0.20), 100), 2)
    belopp = max(belopp, 10)

    # Negativ feedback = litet symboliskt belopp
    kategori = random.choice(KATEGORIER)
    if kategori == "negativ":
        belopp = min(belopp, 15)

    motivering = generera_motivering(agent, till, kategori)

    print(f"  {namn} → {till}: {belopp} kr [{kategori}]")
    print(f"    {motivering}")

    if not överför_saldo(sb_key, namn, till, belopp):
        print(f"  Överföring misslyckades — hoppar över")
        return False

    if not spara_feedback(sb_key, namn, till, belopp, kategori, motivering):
        print(f"  Varning: feedback sparades inte i databasen (överföring genomförd)")

    # Logga till civilisationsminne för höga belopp
    if belopp >= 40:
        spara_civilisations_minne(
            sb_key,
            typ="triumf",
            rubrik=f"{namn} belönade {till} med {belopp} kr",
            beskrivning=f"Kategori: {KATEGORI_ETIKETT[kategori]}. {motivering}",
            agenter=[namn, till],
        )

    return True


print(f"=== Interagent Feedback-löner ({len(AGENTER)} agenter) ===\n")

skickade = 0
for agent in random.sample(AGENTER, len(AGENTER)):
    if kör_feedback(agent, SB_KEY):
        skickade += 1

print(f"\n=== Klar — {skickade} feedback-betalningar genomförda ===")
