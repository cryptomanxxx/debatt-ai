"""
Kör ekonomispel (diktatorspelet / ultimatumspelet) för ALLA agenter direkt.
Ingen artikelpublicering — bara för att kickstarta och testa AI-Ekonomi.

Milljövariabel SPEL_TYP: "diktatorn" | "ultimatum" | "slump" (default)
"""
import os
import sys

from supabase_utils import (
    kör_ekonomispel,
    kör_diktatorspel,
    kör_ultimatum_erbjudande,
    hamta_pending_ultimatum,
    svara_ultimatum,
)
from agent import AGENTER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
SPEL_TYP = os.environ.get("SPEL_TYP", "slump").lower()

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

print(f"=== AI-Ekonomi testkörning ({len(AGENTER)} agenter, speltyp={SPEL_TYP}) ===\n")

for agent in AGENTER:
    namn = agent["namn"]

    # Svara alltid på väntande ultimatum oavsett speltyp
    pending = hamta_pending_ultimatum(SB_KEY, namn)
    if pending:
        print(f"── {namn}: svarar på pending ultimatum ──")
        svara_ultimatum(agent, pending, SB_KEY)
        continue

    print(f"── {namn}: startar nytt spel ({SPEL_TYP}) ──")
    if SPEL_TYP == "diktatorn":
        kör_diktatorspel(agent, SB_KEY)
    elif SPEL_TYP == "ultimatum":
        kör_ultimatum_erbjudande(agent, SB_KEY)
    else:
        kör_ekonomispel(agent, SB_KEY)

print("\n=== Klar ===")
