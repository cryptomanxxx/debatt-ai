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
SB_WRITE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or SB_KEY

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

import httpx
SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
hdrs = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}

# Diagnostik
varor_r = httpx.get(f"{SB_URL}/rest/v1/butik_varor?select=id,namn,pris&order=pris.asc", headers=hdrs, timeout=8)
varor = varor_r.json() if varor_r.is_success else []
print(f"Butik_varor: {len(varor)} varor tillgängliga")
if not varor:
    print("FEL: butik_varor är tom — kör supabase_butik.sql i Supabase SQL Editor först!")
    sys.exit(1)
for v in varor[:5]:
    print(f"  {v['namn']} — {v['pris']} kr")
if len(varor) > 5:
    print(f"  ... och {len(varor)-5} till")

planbok_r = httpx.get(f"{SB_URL}/rest/v1/agent_planbocker?select=agent,saldo&order=saldo.desc&limit=3", headers=hdrs, timeout=8)
planbockar = planbok_r.json() if planbok_r.is_success else []
print(f"\nTopp-3 saldo: {[(p['agent'], p['saldo']) for p in planbockar]}")
print(f"Använder service role key: {'ja' if SB_WRITE_KEY != SB_KEY else 'nej (fallback till anon)'}")
print()

print(f"=== Butik testkörning ({len(AGENTER)} agenter) ===\n")

köpte = 0
for agent in AGENTER:
    namn = agent["namn"]
    preferenser = SYMBOL_PREFERENSER.get(namn, [])
    print(f"── {namn}: shoppar ──")
    symbol = kop_statussymbol(SB_WRITE_KEY, namn, preferenser)
    if symbol:
        print(f"  ✓ Köpte: {symbol}")
        köpte += 1
    else:
        print(f"  – Inget köp (tomt saldo, redan ägd, eller inga varor tillgängliga)")

print(f"\n=== Klar: {köpte}/{len(AGENTER)} köp genomförda ===")
