"""
cleanup_bilder.py — Rensar gamla AI-bilder från Supabase Storage och agent_bilder-tabellen.

Regler:
- Bilder äldre än 90 dagar tas bort
- De 5 senaste bilderna per agent behålls alltid (oavsett ålder)
- Endast Supabase Storage-URL:er raderas från Storage; gamla Pollinations-URL:er hoppas över
- Kör via GitHub Actions varje söndag 04:00 svensk tid
"""
import os
import sys
import httpx
import urllib.parse
from datetime import datetime, timezone, timedelta

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
STORAGE_BUCKET = "agent-bilder"
MAX_AGE_DAYS   = 90
KEEP_PER_AGENT = 5


def main():
    sb_key = os.environ.get("SUPABASE_ANON_KEY", "").strip()
    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas.", file=sys.stderr)
        sys.exit(1)

    h_json = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
    }
    h_plain = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}

    cutoff = (datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS)).isoformat()

    # ── 1. Hämta alla bilder äldre än cutoff ──────────────────────────────────
    r = httpx.get(
        f"{SB_URL}/rest/v1/agent_bilder"
        f"?select=id,agent,bild_url,skapad&skapad=lt.{urllib.parse.quote(cutoff)}"
        f"&order=skapad.asc&limit=2000",
        headers=h_plain, timeout=30,
    )
    gamla = r.json() if r.is_success else []
    print(f"Bilder äldre än {MAX_AGE_DAYS} dagar: {len(gamla)}")

    # ── 2. Hämta de KEEP_PER_AGENT senaste per agent (ska aldrig raderas) ────
    r2 = httpx.get(
        f"{SB_URL}/rest/v1/agent_bilder?select=id&order=skapad.desc&limit=2000",
        headers=h_plain, timeout=30,
    )
    alla = r2.json() if r2.is_success else []

    # Bygg skyddade IDs: de 5 senaste per agent
    agent_raknare: dict[str, int] = {}
    skyddade_ids: set[int] = set()
    for rad in alla:  # sorterade desc → senaste först
        # Supabase returnerar bara id här, inte agent — hämta agent separat
        pass

    # Enklare: hämta alla med agent + skapad sorterat desc
    r3 = httpx.get(
        f"{SB_URL}/rest/v1/agent_bilder?select=id,agent&order=skapad.desc&limit=5000",
        headers=h_plain, timeout=30,
    )
    alla_med_agent = r3.json() if r3.is_success else []
    for rad in alla_med_agent:
        ag = rad.get("agent", "")
        agent_raknare[ag] = agent_raknare.get(ag, 0) + 1
        if agent_raknare[ag] <= KEEP_PER_AGENT:
            skyddade_ids.add(rad["id"])

    # ── 3. Filtrera bort skyddade bilder ──────────────────────────────────────
    att_radera = [b for b in gamla if b["id"] not in skyddade_ids]
    print(f"Bilder att radera (efter skydd av {KEEP_PER_AGENT} senaste/agent): {len(att_radera)}")

    if not att_radera:
        print("Inget att rensa.")
        return

    # ── 4. Radera Storage-filer för Supabase-URL:er ───────────────────────────
    storage_prefix = f"{SB_URL}/storage/v1/object/public/{STORAGE_BUCKET}/"
    storage_filnamn = [
        b["bild_url"].replace(storage_prefix, "")
        for b in att_radera
        if b.get("bild_url", "").startswith(storage_prefix)
    ]

    if storage_filnamn:
        # Storage delete API: DELETE /storage/v1/object/{bucket} med JSON body
        chunk_size = 100
        raderade_filer = 0
        for i in range(0, len(storage_filnamn), chunk_size):
            batch = storage_filnamn[i:i + chunk_size]
            dr = httpx.delete(
                f"{SB_URL}/storage/v1/object/{STORAGE_BUCKET}",
                headers=h_json,
                json={"prefixes": batch},
                timeout=30,
            )
            if dr.is_success:
                raderade_filer += len(batch)
            else:
                print(f"  Storage-fel: {dr.status_code} {dr.text[:200]}")
        print(f"  Storage-filer raderade: {raderade_filer}")

    # ── 5. Radera DB-rader ────────────────────────────────────────────────────
    ids = [str(b["id"]) for b in att_radera]
    chunk_size = 500
    raderade_rader = 0
    for i in range(0, len(ids), chunk_size):
        batch = ids[i:i + chunk_size]
        id_param = f"in.({','.join(batch)})"
        dr = httpx.delete(
            f"{SB_URL}/rest/v1/agent_bilder?id={urllib.parse.quote(id_param)}",
            headers={**h_plain, "Prefer": "return=minimal"},
            timeout=30,
        )
        if dr.is_success:
            raderade_rader += len(batch)
        else:
            print(f"  DB-fel: {dr.status_code} {dr.text[:200]}")

    print(f"  DB-rader raderade: {raderade_rader}")
    print("✓ Cleanup klar.")


if __name__ == "__main__":
    main()
