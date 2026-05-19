"""
Kör parlamentsröstning för ALLA agenter direkt.
Ingen artikelpublicering — bara för att kickstarta AI-Parlamentet.

Alla 24 agenter röstar på alla öppna lagförslag de inte röstat på ännu.
Analytiker-agenter kan dessutom skapa ett nytt lagförslag.
"""
import os
import sys
import random

from supabase_utils import (
    rösta_på_lagforslag_block,
    skapa_lagforslag_ai,
    hamta_lagforslag,
)
from agent import AGENTER, ANALYTIKER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

forslag = hamta_lagforslag(SB_KEY)
print(f"=== AI-Parlamentet testkörning ({len(AGENTER)} agenter, {len(forslag)} öppna förslag) ===\n")

if not forslag:
    print("Inga öppna lagförslag hittades — skapa förslag i admin eller vänta på nästa agent-körning.")
    sys.exit(0)

for agent in AGENTER:
    namn = agent["namn"]
    print(f"── {namn}: röstar ──")
    antal = rösta_på_lagforslag_block(agent, SB_KEY)
    if antal:
        print(f"  ✓ Röstade på {antal} förslag")
    else:
        print(f"  – Inga nya förslag att rösta på")

# Analytiker kan skapa nya lagförslag
print("\n── Skapar nya lagförslag ──")
for agent in ANALYTIKER[:3]:
    amnen = ["AI och demokrati", "Klimatpolitik", "Välfärdsreformer"]
    amne = amnen[ANALYTIKER.index(agent) % len(amnen)]
    ok = skapa_lagforslag_ai(agent, SB_KEY, amne)
    if ok:
        print(f"  ✓ {agent['namn']} skapade förslag om: {amne}")

print("\n=== Klar ===")
