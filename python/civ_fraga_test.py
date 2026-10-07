"""
Kör alla 24 agenter och låter varje agent ställa en fråga till
Civilisationens hjärna (/api/civilisation). Loggar till civilisation_fragor
och destillerar KI-insikter.

Miljövariabler:
  SUPABASE_URL          (valfri, har default)
  SUPABASE_ANON_KEY     (krävs)
  GROQ_API_KEY          (primär LLM)
  GEMINI_API_KEY        (fallback)
  MISTRAL_API_KEY       (fallback)

Valfri env:
  AGENTER_SUBSET   komma-separerade agentnamn, t.ex. "Filosof,Juristen"
                   — om tom körs alla 24
"""

import os
import random
import sys
import time

from agenter import AGENTER
from supabase_utils import AGENT_CIV_FRAGA, fraga_civilisationen

# Försök importera dynamisk frågegenerering från agent.py.
# Faller tillbaka på AGENT_CIV_FRAGA-dict om importen misslyckas.
try:
    from agent import _generera_civ_fraga
    _dynamic = True
except Exception:
    _dynamic = False


def _fraga_for_agent(agent: dict) -> tuple[str, str]:
    """Returnerar (fraga, typ) — dynamisk om möjligt, annars fallback."""
    if _dynamic:
        try:
            return _generera_civ_fraga(agent)
        except Exception:
            pass
    fb = AGENT_CIV_FRAGA.get(
        agent["namn"],
        ("Vad är det viktigaste i civilisationen just nu?", "general"),
    )
    return fb


def main() -> None:
    sb_key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
        sys.exit(1)

    # Valfri delmängd av agenter via miljövariabel
    subset_env = os.environ.get("AGENTER_SUBSET", "").strip()
    if subset_env:
        names = {n.strip() for n in subset_env.split(",")}
        agenter = [a for a in AGENTER if a["namn"] in names]
        if not agenter:
            print(f"FEL: inga agenter matchade AGENTER_SUBSET={subset_env!r}", file=sys.stderr)
            sys.exit(1)
    else:
        agenter = list(AGENTER)

    # Slumpa ordning så loggarna inte alltid börjar med samma agent
    random.shuffle(agenter)

    print(f"🧠 Startar civilisationsfrågor för {len(agenter)} agenter "
          f"({'dynamisk' if _dynamic else 'fallback'} frågegenerering)\n")

    ok = 0
    for agent in agenter:
        namn = agent["namn"]
        fraga, typ = _fraga_for_agent(agent)
        print(f"  [{namn}] {fraga!r}  (typ={typ})")
        t0 = time.time()
        svar = fraga_civilisationen(sb_key, namn, fraga, typ)
        elapsed = time.time() - t0
        if svar:
            print(f"    ✓ svar ({len(svar)} tecken, {elapsed:.1f}s)\n")
            ok += 1
        else:
            print(f"    ✗ inget svar ({elapsed:.1f}s)\n")
        # Kort paus för att inte hammra LLM-providern
        time.sleep(1.5)

    print(f"\n✅ Klart: {ok}/{len(agenter)} lyckades")
    if ok == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
