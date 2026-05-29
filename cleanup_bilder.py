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

SB_URL         = "https://fmwxftnistkoqazfwnuj.supabase.co"
STORAGE_BUCKET = "agent-bilder"
MAX_AGE_DAYS   = 90
KEEP_PER_AGENT = 5


def main():
    sb_key  = os.environ.get("SUPABASE_ANON_KEY", "").strip()
    svc_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip() or sb_key
    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas.", file=sys.stderr)
        sys.exit(1)

    # Läsningar: anon-nyckeln räcker
    h_read = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    # Skrivningar (DELETE) kräver service-role — anon har inte DELETE-privilegium
    h_write = {
        "apikey": svc_key, "Authorization": f"Bearer {svc_key}",
        "Content-Type": "application/json",
    }
    h_write_plain = {"apikey": svc_key, "Authorization": f"Bearer {svc_key}"}

    cutoff = (datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS)).isoformat()

    # ── 1. Hämta alla bilder äldre än cutoff ─────────────────────────────────
    r = httpx.get(
        f"{SB_URL}/rest/v1/agent_bilder"
        f"?select=id,agent,bild_url,skapad&skapad=lt.{urllib.parse.quote(cutoff)}"
        f"&order=skapad.asc&limit=2000",
        headers=h_read, timeout=30,
    )
    gamla = r.json() if r.is_success else []
    print(f"Bilder äldre än {MAX_AGE_DAYS} dagar: {len(gamla)}")

    # ── 2. Bygg skyddade IDs via paginering (ingen global cap) ───────────────
    # Paginerar hela tabellen i desc-ordning tills vi har >= KEEP_PER_AGENT
    # per agent. Undviker att en inaktiv agents bilder faller utanför en fast
    # limit och felaktigt hamnar i raderingslistsan.
    PAGE = 1000
    offset = 0
    agent_raknare: dict[str, int] = {}
    skyddade_ids: set[int] = set()

    while True:
        rp = httpx.get(
            f"{SB_URL}/rest/v1/agent_bilder?select=id,agent&order=skapad.desc"
            f"&limit={PAGE}&offset={offset}",
            headers=h_read, timeout=30,
        )
        sida = rp.json() if rp.is_success else []
        if not sida:
            break
        for rad in sida:
            ag = rad.get("agent", "")
            agent_raknare[ag] = agent_raknare.get(ag, 0) + 1
            if agent_raknare[ag] <= KEEP_PER_AGENT:
                skyddade_ids.add(rad["id"])
        offset += len(sida)
        if len(sida) < PAGE:
            break  # sista sidan

    # ── 3. Filtrera bort skyddade bilder ─────────────────────────────────────
    att_radera = [b for b in gamla if b["id"] not in skyddade_ids]
    print(f"Bilder att radera (efter skydd av {KEEP_PER_AGENT} senaste/agent): {len(att_radera)}")

    if not att_radera:
        print("Inget att rensa.")
        return

    # ── 4. Radera Storage-filer för Supabase-URL:er ──────────────────────────
    storage_prefix = f"{SB_URL}/storage/v1/object/public/{STORAGE_BUCKET}/"
    storage_filnamn = [
        b["bild_url"].replace(storage_prefix, "")
        for b in att_radera
        if b.get("bild_url", "").startswith(storage_prefix)
    ]

    if storage_filnamn:
        chunk_size = 100
        raderade_filer = 0
        for i in range(0, len(storage_filnamn), chunk_size):
            batch = storage_filnamn[i:i + chunk_size]
            dr = httpx.delete(
                f"{SB_URL}/storage/v1/object/{STORAGE_BUCKET}",
                headers=h_write,
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
            headers={**h_write_plain, "Prefer": "return=minimal"},
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
