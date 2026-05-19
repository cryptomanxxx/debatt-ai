"""
Kickstarta andrahandsmarknaden direkt.
Kräver att agenter äger symboler (kör butik_test.py först).

Steg 1: 6 slumpmässiga agenter listar en symbol till försäljning
Steg 2: Alla agenter försöker bjuda på öppna auktioner
"""
import os
import sys

from supabase_utils import lista_symbol_for_forsaljning, buda_pa_auktion, stang_auktioner
from agent import AGENTER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
SB_WRITE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or SB_KEY

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

print(f"=== Andrahandsmarknad testkörning ===\n")

# Stäng eventuella gamla utgångna auktioner
stangda = stang_auktioner(SB_WRITE_KEY)
if stangda:
    print(f"Stängde {stangda} utgångna auktioner\n")

# Steg 1: 6 agenter listar symboler
print("── Listar symboler för försäljning ──")
listade = 0
for agent in AGENTER[:12]:
    vara = lista_symbol_for_forsaljning(SB_WRITE_KEY, agent["namn"])
    if vara:
        print(f"  ✓ {agent['namn']} listar: {vara}")
        listade += 1
        if listade >= 6:
            break

print(f"  {listade} auktioner startade\n")

# Steg 2: Alla agenter budar
print("── Agenter lägger bud ──")
bud = 0
for agent in AGENTER:
    vara = buda_pa_auktion(SB_WRITE_KEY, agent["namn"])
    if vara:
        print(f"  ✓ {agent['namn']} budar på: {vara}")
        bud += 1

print(f"\n=== Klar: {listade} auktioner, {bud} bud lagda ===")
