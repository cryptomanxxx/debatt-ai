"""
cleanup_lasarbilder.py — Rensar föräldralösa besökaruppladdade bilder från
Supabase Storage-bucketen lasarbilder (/skicka-in, se CLAUDE.md ✅116).

Till skillnad från agent-bilder finns ingen egen spårningstabell för den här
bucketen — en bild laddas upp direkt via app/api/skicka-in/bild/route.js så
fort besökaren väljer en fil i formuläret, INNAN artikeln analyserats eller
publicerats. Filnamnet skrivs först till inlamningar.bild_url (vid analyze())
och senare, om artikeln godkänns och publiceras, till artiklar.bild_url.

En bild räknas som "använd" om dess filnamn förekommer i bild_url-kolumnen på
NÅGON av de två tabellerna. En bild som laddats upp men aldrig kopplats till
en inlämning (besökaren stängde fliken, avbröt, eller ersatte bilden med en
annan — det senare fallet tas redan bort direkt av klienten, se
SkickaInClient.js → valjBild()/taBortBild(), men det här skriptet är den
garanterade backstopen för allt UI-lagret inte hann fånga) är föräldralös
och städas bort efter MAX_AGE_HOURS.

Körs via GitHub Actions, se .github/workflows/cleanup-lasarbilder.yml.
"""
import os
import re
import sys
import httpx
from datetime import datetime, timezone, timedelta

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
BUCKET = "lasarbilder"
MAX_AGE_HOURS = 24

FILNAMN_RE = re.compile(r"/lasarbilder/([0-9a-f-]{36}\.(?:jpg|png|webp))", re.IGNORECASE)


def hamta_anvanda_filnamn(h_read):
    """Filnamn som förekommer i bild_url på inlamningar eller artiklar — dessa
    får aldrig raderas oavsett ålder."""
    anvanda = set()
    for tabell in ("inlamningar", "artiklar"):
        try:
            r = httpx.get(
                f"{SB_URL}/rest/v1/{tabell}?select=bild_url&bild_url=not.is.null&limit=10000",
                headers=h_read, timeout=30,
            )
            r.raise_for_status()
            for rad in r.json():
                m = FILNAMN_RE.search(rad.get("bild_url") or "")
                if m:
                    anvanda.add(m.group(1).lower())
        except Exception as e:
            # Fail-safe: om en tabell inte går att läsa, avbryt hellre hela
            # körningen än att riskera att radera bilder som faktiskt används
            # (okänt = skyddat, inte "inte hittat = ta bort").
            print(f"FEL: kunde inte läsa {tabell}: {e}", file=sys.stderr)
            sys.exit(1)
    return anvanda


def lista_bucket_objekt(h_write):
    objekt = []
    offset = 0
    limit = 1000
    while True:
        try:
            r = httpx.post(
                f"{SB_URL}/storage/v1/object/list/{BUCKET}",
                headers=h_write,
                json={"limit": limit, "offset": offset, "sortBy": {"column": "created_at", "order": "asc"}},
                timeout=30,
            )
            r.raise_for_status()
        except Exception as e:
            print(f"FEL: kunde inte lista {BUCKET}-bucketen: {e}", file=sys.stderr)
            return objekt
        batch = r.json() or []
        if not batch:
            break
        objekt.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return objekt


def main():
    sb_key = os.environ.get("SUPABASE_ANON_KEY", "").strip()
    svc_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip() or sb_key
    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas.", file=sys.stderr)
        sys.exit(1)

    h_read = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    h_write = {"apikey": svc_key, "Authorization": f"Bearer {svc_key}", "Content-Type": "application/json"}

    anvanda = hamta_anvanda_filnamn(h_read)
    print(f"📎 {len(anvanda)} bilder är refererade i inlamningar/artiklar")

    objekt = lista_bucket_objekt(h_write)
    print(f"🗂️  {len(objekt)} objekt i {BUCKET}-bucketen")
    if not objekt:
        print("Inget att rensa.")
        return

    cutoff = datetime.now(timezone.utc) - timedelta(hours=MAX_AGE_HOURS)
    att_ta_bort = []
    for obj in objekt:
        namn = (obj.get("name") or "").lower()
        if not namn or namn in anvanda:
            continue
        skapad_str = obj.get("created_at")
        if not skapad_str:
            continue
        try:
            skapad = datetime.fromisoformat(skapad_str.replace("Z", "+00:00"))
        except Exception:
            continue
        if skapad < cutoff:
            att_ta_bort.append(namn)

    print(f"🗑️  Föräldralösa bilder äldre än {MAX_AGE_HOURS}h: {len(att_ta_bort)}")
    if not att_ta_bort:
        print("Inget att rensa.")
        return

    raderade = 0
    chunk_size = 100
    for i in range(0, len(att_ta_bort), chunk_size):
        batch = att_ta_bort[i:i + chunk_size]
        # httpx.delete() saknar json=-stöd — httpx.request("DELETE", ...)
        # stödjer body oavsett httpx-version, samma mönster som
        # cleanup_bilder.py använder för agent-bilder-bucketens bulk-delete.
        dr = httpx.request(
            "DELETE", f"{SB_URL}/storage/v1/object/{BUCKET}",
            headers=h_write, json={"prefixes": batch}, timeout=30,
        )
        if dr.is_success:
            raderade += len(batch)
        else:
            print(f"  Storage-fel: {dr.status_code} {dr.text[:200]}")

    print(f"✓ {raderade} föräldralösa bilder raderade.")


if __name__ == "__main__":
    main()
