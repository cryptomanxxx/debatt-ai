"""
Kör butik-köp för ALLA agenter direkt.
Ingen artikelpublicering — bara för att kickstarta Butiken.

Varje agent köper EN symbol baserat på sina preferenser.
Kräver att supabase_butik.sql har körts i Supabase.
"""
import os
import sys

from supabase_utils import kop_statussymbol
from agent import AGENTER, SYMBOL_PREFERENSER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

print(f"=== Butik testkörning ({len(AGENTER)} agenter) ===\n")

köpte = 0
for agent in AGENTER:
    namn = agent["namn"]
    preferenser = SYMBOL_PREFERENSER.get(namn, [])
    print(f"── {namn}: shoppar ──")
    symbol = kop_statussymbol(SB_KEY, namn, preferenser)
    if symbol:
        print(f"  ✓ Köpte: {symbol}")
        köpte += 1
    else:
        print(f"  – Inget köp (tomt saldo, redan ägd, eller inga varor tillgängliga)")

print(f"\n=== Klar: {köpte}/{len(AGENTER)} köp genomförda ===")
