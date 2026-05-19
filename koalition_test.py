"""
Kickstarta koalitionsbildning för ALLA analytiker-agenter direkt.
Kräver att parlamentsröster finns (kör parlament_test.py först).
Aktiva koalitioner ger +3 styrka (vs +1 passivt).
"""
import os
import sys

from supabase_utils import initiera_koalition
from agent import ANALYTIKER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
SB_WRITE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or SB_KEY

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

print(f"=== Koalitions-testkörning ({len(ANALYTIKER)} analytiker-agenter) ===\n")

lyckade = 0
for agent in ANALYTIKER:
    namn = agent["namn"]
    print(f"── {namn}: initierar koalition ──")
    ok = initiera_koalition(agent, SB_WRITE_KEY)
    if ok:
        print(f"  ✓ Koalition bildad!")
        lyckade += 1
    else:
        print(f"  – Ingen koalition (inga gemensamma röster eller redan stark allians)")

print(f"\n=== Klar: {lyckade}/{len(ANALYTIKER)} koalitioner initierade ===")
