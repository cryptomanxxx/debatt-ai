#!/usr/bin/env python3
"""
Genererar terrängbakgrundsbild via Pollinations.ai och laddar upp till
Supabase Storage bucket 'mark-assets'. Körs en gång manuellt via
GitHub Actions terrain-setup.yml.
"""
import httpx, os, sys, time

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

POLLINATIONS_URL = (
    "https://image.pollinations.ai/prompt/"
    "aerial%20top%20down%20view%20dark%20fantasy%20strategy%20game%20terrain"
    "%20dense%20forest%20canopy%20rocky%20mountains%20rivers%20dark%20moody"
    "%20cinematic%20lighting%20no%20text%20no%20labels%20no%20ui%20no%20hud"
    "?width=800&height=740&seed=3721&nologo=true&model=flux"
)
PUBLIC_URL = f"{SB_URL}/storage/v1/object/public/mark-assets/terrain.jpg"


def main():
    # Kolla om bilden redan finns
    try:
        r = httpx.get(PUBLIC_URL, timeout=10)
        if r.status_code == 200 and r.headers.get("content-type", "").startswith("image"):
            print("Terrängbild finns redan:", PUBLIC_URL)
            return
    except Exception:
        pass

    # Hämta från Pollinations (kan ta upp till 60s vid första genereringen)
    print("Genererar terrängbild via Pollinations.ai (vänta upp till 60s)...")
    img_content = None
    for attempt in range(3):
        try:
            img = httpx.get(POLLINATIONS_URL, timeout=90, follow_redirects=True)
            ct = img.headers.get("content-type", "")
            if img.status_code == 200 and ct.startswith("image"):
                img_content = img.content
                print(f"Nedladdad: {len(img_content)} bytes ({ct})")
                break
            else:
                print(f"Försök {attempt+1}: HTTP {img.status_code}, content-type: {ct}")
        except Exception as e:
            print(f"Försök {attempt+1} misslyckades: {e}")
        if attempt < 2:
            time.sleep(15)

    if not img_content:
        print("Kunde inte hämta bild från Pollinations.ai")
        sys.exit(1)

    h = {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
    }

    # Skapa bucket (ignorera fel om redan finns)
    br = httpx.post(
        f"{SB_URL}/storage/v1/bucket", headers=h,
        json={"id": "mark-assets", "name": "mark-assets", "public": True},
    )
    print(f"Bucket: {br.status_code} {br.text[:80]}")

    # Ladda upp
    up_h = {**h, "Content-Type": "image/jpeg", "x-upsert": "true"}
    r = httpx.post(
        f"{SB_URL}/storage/v1/object/mark-assets/terrain.jpg",
        headers=up_h, content=img_content, timeout=30,
    )
    if r.is_success:
        print("Uppladdad:", PUBLIC_URL)
    else:
        print("Uppladdning misslyckades:", r.status_code, r.text)
        sys.exit(1)


if __name__ == "__main__":
    main()
