"""
Kör AI-Lobbying för ALLA analytiker-agenter direkt.
Ingen artikelpublicering — bara för att kickstarta lobbying-experimentet.

Kräver att agenter redan har röstat i parlamentet (kör parlament_test.py först).
"""
import os
import sys

from supabase_utils import kör_lobbying
from agent import ANALYTIKER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

print(f"=== AI-Lobbying testkörning ({len(ANALYTIKER)} analytiker-agenter) ===\n")

lyckade = 0
for agent in ANALYTIKER:
    namn = agent["namn"]
    print(f"── {namn}: försöker lobba ──")
    ok = kör_lobbying(agent, SB_KEY)
    if ok:
        lyckade += 1

print(f"\n=== Klar: {lyckade}/{len(ANALYTIKER)} lyckade lobbying-försök ===")
