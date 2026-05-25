"""
bild_test.py — Testar AI-bildgenerering för alla fyra bildtyper.

Kör en agent per typ:
  tillstand  — agentens ekonomiska tillstånd
  meme       — satirisk bild riktad mot en annan agent
  propaganda — ideologiskt propagandaposter
  valkampanj — valkampanjaffisch (om aktivt val finns, annars simulerat)

Kör:
  python bild_test.py               # en bild per typ, slumpmässiga agenter
  python bild_test.py --agent Filosof  # testa en specifik agent
"""

import argparse
import os
import random
import sys

import httpx

from agenter import AGENTER
from supabase_utils import (
    generera_och_spara_bild,
    generera_meme,
    generera_propaganda,
    generera_valkampanj,
    hamta_agent_status,
    hamta_agent_parti,
    hamta_agent_positioner,
)

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"


def main():
    parser = argparse.ArgumentParser(description="Testa AI-bildgenerering")
    parser.add_argument("--agent", default="", help="Specifik agent att testa (default: slumpmässig)")
    args = parser.parse_args()

    sb_key = os.environ.get("SUPABASE_ANON_KEY")
    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
        sys.exit(1)

    # Välj agent
    if args.agent:
        agenter_match = [a for a in AGENTER if a["namn"] == args.agent]
        if not agenter_match:
            print(f"FEL: Hittade ingen agent med namn '{args.agent}'", file=sys.stderr)
            sys.exit(1)
        agent = agenter_match[0]
    else:
        agent = random.choice(AGENTER)

    print(f"\n{'='*60}")
    print(f"  Testar bildgenerering för: {agent['namn']}")
    print(f"{'='*60}\n")

    # Hämta agentens kontext
    status      = hamta_agent_status(sb_key, agent["namn"]) or {}
    saldo       = float(status.get("saldo") or 500)
    parti_obj   = hamta_agent_parti(sb_key, agent["namn"])
    parti_namn  = parti_obj.get("namn", "") if parti_obj else ""
    pos_text    = hamta_agent_positioner(sb_key, agent["namn"]) or ""
    ideologi    = pos_text[:80]

    print(f"  Saldo:   {saldo} kr")
    print(f"  Parti:   {parti_namn or '(inget)'}")
    print(f"  Ideologi: {ideologi[:60] or '(ingen)'}\n")

    lyckade = 0
    misslyckade = 0

    # ── 1. Tillståndsfoto ────────────────────────────────────────────────────
    print("── 1/4  TILLSTÅND ──────────────────────────────────────")
    url = generera_och_spara_bild(sb_key, agent["namn"],
                                   saldo=saldo, parti=parti_namn, ideologi=ideologi)
    if url:
        print(f"  ✓ URL: {url[:80]}…")
        lyckade += 1
    else:
        print("  ✗ Misslyckades")
        misslyckade += 1

    # ── 2. Meme ──────────────────────────────────────────────────────────────
    print("\n── 2/4  MEME ───────────────────────────────────────────")
    andra = [a for a in AGENTER if a["namn"] != agent["namn"]]
    mal_agent = random.choice(andra)["namn"]
    print(f"  Målagent: {mal_agent}")
    url = generera_meme(sb_key, agent["namn"], mal_agent, saldo=saldo)
    if url:
        print(f"  ✓ URL: {url[:80]}…")
        lyckade += 1
    else:
        print("  ✗ Misslyckades")
        misslyckade += 1

    # ── 3. Propaganda ────────────────────────────────────────────────────────
    print("\n── 3/4  PROPAGANDA ─────────────────────────────────────")
    url = generera_propaganda(sb_key, agent["namn"],
                               parti=parti_namn, ideologi=ideologi, saldo=saldo)
    if url:
        print(f"  ✓ URL: {url[:80]}…")
        lyckade += 1
    else:
        print("  ✗ Misslyckades")
        misslyckade += 1

    # ── 4. Valkampanj ────────────────────────────────────────────────────────
    print("\n── 4/4  VALKAMPANJ ─────────────────────────────────────")
    # Kolla om aktivt val finns
    aktiv_val = None
    try:
        v_r = httpx.get(
            f"{SB_URL}/rest/v1/riksdagsval?status=eq.aktivt&order=skapad.desc&limit=1&select=manifest",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""},
            timeout=6,
        )
        if v_r.is_success and v_r.json():
            aktiv_val = v_r.json()[0]
    except Exception:
        pass

    if aktiv_val and parti_namn:
        manifest_utdrag = (aktiv_val.get("manifest") or {}).get(parti_namn, "")[:80]
        print(f"  Aktivt val hittat — parti: {parti_namn}")
    else:
        # Simulera ett val för testet
        manifest_utdrag = "Ett rättvisare samhälle för alla"
        test_parti = parti_namn or "Testpartiet"
        print(f"  Inget aktivt val — simulerar med parti: {test_parti}")
        parti_namn = test_parti

    url = generera_valkampanj(sb_key, agent["namn"], parti_namn,
                               manifest_utdrag=manifest_utdrag, saldo=saldo)
    if url:
        print(f"  ✓ URL: {url[:80]}…")
        lyckade += 1
    else:
        print("  ✗ Misslyckades")
        misslyckade += 1

    # ── Sammanfattning ────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  Klart — {lyckade}/4 lyckades, {misslyckade}/4 misslyckades")
    print(f"  Bilder sparade i Supabase agent_bilder-tabellen")
    print(f"  Visa på: https://www.debatt-ai.se/ai-bilder?agent={agent['namn'].replace(' ', '%20')}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
