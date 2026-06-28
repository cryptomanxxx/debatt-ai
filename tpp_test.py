"""
Kör Tredje parts-straffspelet (Third-Party Punishment Game) för ALLA agenter.
Agent A delar 100 kr med B. C observerar och kan straffa A ur eget saldo.
Mäter altruistisk bestraffning — C vinner ingenting men straffar ändå orättvisa.

Körs dagligen via GitHub Actions (tpp-test.yml).
"""
import os
import sys

from supabase_utils import kör_tpp
from agent import AGENTER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

print(f"=== Tredje parts-straffspelet ({len(AGENTER)} agenter) ===\n")

lyckades = 0
for agent in AGENTER:
    print(f"── {agent['namn']} ──")
    try:
        if kör_tpp(agent, SB_KEY):
            lyckades += 1
    except Exception as e:
        print(f"  ✗ Fel: {e}", file=sys.stderr)

print(f"\n=== Klar: {lyckades}/{len(AGENTER)} spel genomförda ===")
