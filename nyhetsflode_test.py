#!/usr/bin/env python3
"""
nyhetsflode_test.py — Hämtar ALLA nyheter (RSS/Reddit/YouTube, obubbel-
filtrerade) och sparar dem i nyhetsflode för transparens på /nyhetskallor.

Körs 6 gånger/dag av GitHub Actions. Återanvänder hamta_nyheter() från
nyheter.py utan agent_namn, vilket ger samtliga ~44 feeds + YouTube
istället för en enskild agents bubbel-filtrerade delmängd (jfr nyhetslog,
som bara loggar EN agents redan filtrerade urval per körning).

Skriver med SUPABASE_SERVICE_ROLE_KEY (nyhetsflode kräver service role
för INSERT, se supabase_nyhetsflode.sql). unique(url) + ignore-duplicates
gör körningen idempotent — redan kända artiklar hoppas bara över.
"""
import os
import sys

import httpx

from nyheter import hamta_nyheter, filtrera_nyheter, FEED_KATEGORIER

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "").strip()
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip() or ANON_KEY

if not SERVICE_KEY:
    print("Fel: SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY saknas")
    sys.exit(1)

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=ignore-duplicates,return=minimal",
}

BATCH_STORLEK = 200


def main():
    print("Hämtar samtliga nyhetsflöden (obubbel-filtrerat)...")
    nyheter, rss_stats = hamta_nyheter()
    nyheter = filtrera_nyheter(nyheter)
    print(f"{len(nyheter)} nyheter kvar efter tabloid-filter.")

    rader = []
    for n in nyheter:
        url = (n.get("url") or "").strip()
        rubrik = (n.get("rubrik") or "").strip()
        if not url or not rubrik:
            continue
        rader.append({
            "rubrik": rubrik[:300],
            "beskrivning": (n.get("beskrivning") or "")[:800] or None,
            "kalla": n["kalla"][:100],
            "url": url[:500],
            "publicerad": (n.get("publicerad") or "")[:100] or None,
            "kategori": FEED_KATEGORIER.get(n["kalla"], []),
        })

    if not rader:
        print("Inga nyheter att spara — avslutar.")
        return

    sparade = 0
    for i in range(0, len(rader), BATCH_STORLEK):
        batch = rader[i:i + BATCH_STORLEK]
        try:
            res = httpx.post(
                f"{SB_URL}/rest/v1/nyhetsflode?on_conflict=url",
                headers=HEADERS,
                json=batch,
                timeout=30,
            )
            if res.status_code in (200, 201):
                sparade += len(batch)
            else:
                print(f"  ✗ Batch {i}-{i+len(batch)}: HTTP {res.status_code} — {res.text[:200]}", file=sys.stderr)
        except Exception as e:
            print(f"  ✗ Batch {i}-{i+len(batch)}: {type(e).__name__}: {e}", file=sys.stderr)

    print(f"Klart. {sparade}/{len(rader)} nyheter skickade till nyhetsflode (dubbletter hoppas över tyst).")


if __name__ == "__main__":
    main()
