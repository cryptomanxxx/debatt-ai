"""
Kör ekonomispel (diktatorspelet / ultimatumspelet) för ALLA agenter direkt.
Ingen artikelpublicering — bara för att kickstarta och testa AI-Ekonomi.
"""
import os
import sys
import random

from supabase_utils import (
    kör_ekonomispel,
    hamta_pending_ultimatum,
    svara_ultimatum,
)
from agent import AGENTER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

print(f"=== AI-Ekonomi testkörning ({len(AGENTER)} agenter) ===\n")

for agent in AGENTER:
    namn = agent["namn"]

    # Svara alltid på väntande ultimatum
    pending = hamta_pending_ultimatum(SB_KEY, namn)
    if pending:
        print(f"── {namn}: svarar på pending ultimatum ──")
        svara_ultimatum(agent, pending, SB_KEY)
        continue

    # Starta alltid ett nytt spel (skippar 5%-slumpen)
    print(f"── {namn}: startar nytt spel ──")
    kör_ekonomispel(agent, SB_KEY)

print("\n=== Klar ===")
