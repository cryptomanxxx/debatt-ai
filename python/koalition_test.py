"""
Kickstarta koalitionsbildning för ALLA analytiker-agenter direkt.
Kräver att parlamentsröster finns (kör parlament_test.py först).
Aktiva koalitioner ger +3 styrka (vs +1 passivt).

Miljövariabel FORCE_PARTIER=true: beräknar partier med min_styrka=1 (bootstrap-läge
när inga partier finns ännu och koalitioner inte hunnit växa till styrka ≥ 3).
"""
import os
import sys

from supabase_utils import initiera_koalition, berakna_och_spara_partier
from agent import ANALYTIKER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
SB_WRITE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or SB_KEY
FORCE_PARTIER = os.environ.get("FORCE_PARTIER", "").lower() in ("true", "1", "yes")

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

# Beräkna partier direkt efter koalitionsbildning
print("\n── Partiuppdatering ──")
min_styrka = 1 if FORCE_PARTIER else 3
min_kluster = 2 if FORCE_PARTIER else 3
if FORCE_PARTIER:
    print(f"  [FORCE_PARTIER] Använder min_styrka={min_styrka}, min_kluster={min_kluster}")
n_partier = berakna_och_spara_partier(SB_WRITE_KEY, min_styrka=min_styrka, min_kluster=min_kluster)
if n_partier > 0:
    print(f"  ✓ {n_partier} aktiva partier beräknade och sparade")
else:
    print("  – Inga partier bildades (för få starka koalitioner)")
