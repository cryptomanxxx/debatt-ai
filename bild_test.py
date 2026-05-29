"""
bild_test.py — Testar AI-bildgenerering och Supabase Storage-uppladdning.

Kör fyra bildtyper för en agent, visar om URL pekar mot Supabase Storage
eller föll tillbaka på Pollinations URL.

Kör:
  python bild_test.py               # slumpmässig agent
  python bild_test.py --agent Filosof  # specifik agent
"""

import argparse
import os
import random
import sys
import urllib.parse

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

# Minimal giltig JPEG (1×1 pixel, svart)
MINIMAL_JPEG = bytes([
    0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,
    0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,
    0x07,0x07,0x07,0x09,0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
    0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,0x24,0x2E,0x27,0x20,
    0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,
    0x39,0x3D,0x38,0x32,0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x01,
    0x00,0x01,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,0x01,0x05,0x01,0x01,
    0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,
    0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0xFF,0xC4,0x00,0xB5,0x10,0x00,0x02,0x01,0x03,
    0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7D,0x01,0x02,0x03,0x00,
    0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,0x22,0x71,0x14,0x32,
    0x81,0x91,0xA1,0x08,0x23,0x42,0xB1,0xC1,0x15,0x52,0xD1,0xF0,0x24,0x33,0x62,0x72,
    0x82,0x09,0x0A,0x16,0x17,0x18,0x19,0x1A,0x25,0x26,0x27,0x28,0x29,0x2A,0x34,0x35,
    0x36,0x37,0x38,0x39,0x3A,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x53,0x54,0x55,
    0x56,0x57,0x58,0x59,0x5A,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x73,0x74,0x75,
    0x76,0x77,0x78,0x79,0x7A,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8A,0x92,0x93,0x94,
    0x95,0x96,0x97,0x98,0x99,0x9A,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xB2,
    0xB3,0xB4,0xB5,0xB6,0xB7,0xB8,0xB9,0xBA,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,
    0xCA,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xE1,0xE2,0xE3,0xE4,0xE5,0xE6,
    0xE7,0xE8,0xE9,0xEA,0xF1,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFF,0xDA,
    0x00,0x08,0x01,0x01,0x00,0x00,0x3F,0x00,0xFB,0xD3,0xFF,0xD9,
])


def testa_storage_direkt(sb_key: str) -> bool:
    """Testar Storage-uppladdning direkt med en minimal JPEG. Returnerar True om OK."""
    print("\n── Storage-uppladdningstest ─────────────────────────────────")
    filename = f"_test_{random.randint(10000,99999)}.jpg"
    try:
        r = httpx.put(
            f"{SB_URL}/storage/v1/object/agent-bilder/{filename}",
            headers={
                "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                "Content-Type": "image/jpeg", "x-upsert": "true",
            },
            content=MINIMAL_JPEG, timeout=15,
        )
        if r.is_success:
            pub_url = f"{SB_URL}/storage/v1/object/public/agent-bilder/{filename}"
            print(f"  ✅ PUT lyckades (HTTP {r.status_code})")
            print(f"  URL: {pub_url}")
            # Rensa testfilen
            httpx.delete(
                f"{SB_URL}/storage/v1/object/agent-bilder/{filename}",
                headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
                timeout=10,
            )
            return True
        else:
            print(f"  ✗ PUT misslyckades: HTTP {r.status_code}")
            print(f"  Svar: {r.text[:300]}")
            return False
    except Exception as e:
        print(f"  ✗ Exception: {e}")
        return False


def testa_pollinations_download(url: str) -> bool:
    """Kontrollerar att Pollinations svarar med bilddata."""
    print("\n── Pollinations download-test ───────────────────────────────")
    try:
        r = httpx.get(url, timeout=45, follow_redirects=True)
        if r.is_success and r.content:
            print(f"  ✅ HTTP {r.status_code}, {len(r.content)} bytes")
            return True
        else:
            print(f"  ✗ HTTP {r.status_code} — ingen bilddata")
            return False
    except Exception as e:
        print(f"  ✗ Timeout/fel: {e}")
        return False


def url_typ(url: str) -> str:
    if url and SB_URL in url and "storage" in url:
        return "✅ SUPABASE STORAGE"
    elif url and "pollinations" in url:
        return "⚠️  POLLINATIONS FALLBACK"
    elif url:
        return "❓ OKÄND URL"
    return "✗  MISSLYCKADES"


def hamta_senaste_bilder(sb_key: str, agent: str, antal: int = 5) -> list:
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_bilder"
            f"?agent=eq.{agent}&order=skapad.desc&limit={antal}&select=bild_url,bildtyp,skapad",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        return r.json() if r.is_success else []
    except Exception:
        return []


def main():
    parser = argparse.ArgumentParser(description="Testa AI-bildgenerering + Storage-uppladdning")
    parser.add_argument("--agent", default="", help="Specifik agent (default: slumpmässig)")
    args = parser.parse_args()

    sb_key = os.environ.get("SUPABASE_ANON_KEY")
    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
        sys.exit(1)

    # Välj agent
    if args.agent:
        match = [a for a in AGENTER if a["namn"] == args.agent]
        if not match:
            print(f"FEL: Hittade ingen agent med namn '{args.agent}'", file=sys.stderr)
            sys.exit(1)
        agent = match[0]
    else:
        agent = random.choice(AGENTER)

    print(f"\n{'='*62}")
    print(f"  Bildgenererings-test:  {agent['namn']}")
    print(f"{'='*62}\n")

    # ── Förtest: Storage + Pollinations ─────────────────────────────────────
    storage_ok = testa_storage_direkt(sb_key)
    if not storage_ok:
        print("\n  ⛔ Storage-uppladdning fungerar INTE — avslutar.")
        print("  Kontrollera bucket 'agent-bilder' och INSERT-policy i Supabase.")
        sys.exit(1)

    # Testa Pollinations med en enkel prompt
    test_prompt = "a simple red circle on white background"
    test_encoded = urllib.parse.quote(test_prompt)
    test_pollen_url = f"https://image.pollinations.ai/prompt/{test_encoded}?width=64&height=64&nologo=true&model=flux&seed=1"
    testa_pollinations_download(test_pollen_url)
    print()

    # Hämta agentens kontext
    status     = hamta_agent_status(sb_key, agent["namn"]) or {}
    saldo      = float(status.get("saldo") or 500)
    parti_obj  = hamta_agent_parti(sb_key, agent["namn"])
    parti_namn = parti_obj.get("namn", "") if parti_obj else ""
    pos_text   = hamta_agent_positioner(sb_key, agent["namn"]) or ""
    ideologi   = pos_text[:80]

    print(f"  Saldo:    {saldo} kr")
    print(f"  Parti:    {parti_namn or '(inget)'}")
    print(f"  Ideologi: {ideologi[:60] or '(ingen)'}\n")

    resultat = []

    # ── 1. Tillståndsfoto ────────────────────────────────────────────────────
    print("── 1/4  TILLSTÅND ──────────────────────────────────────────")
    url = generera_och_spara_bild(sb_key, agent["namn"],
                                   saldo=saldo, parti=parti_namn, ideologi=ideologi)
    t = url_typ(url)
    print(f"  {t}")
    if url:
        print(f"  URL: {url}")
    resultat.append(("tillstand", url))

    # ── 2. Meme ──────────────────────────────────────────────────────────────
    print("\n── 2/4  MEME ───────────────────────────────────────────────")
    andra = [a for a in AGENTER if a["namn"] != agent["namn"]]
    mal_agent = random.choice(andra)["namn"]
    print(f"  Målagent: {mal_agent}")
    url = generera_meme(sb_key, agent["namn"], mal_agent, saldo=saldo)
    t = url_typ(url)
    print(f"  {t}")
    if url:
        print(f"  URL: {url}")
    resultat.append(("meme", url))

    # ── 3. Propaganda ────────────────────────────────────────────────────────
    print("\n── 3/4  PROPAGANDA ─────────────────────────────────────────")
    url = generera_propaganda(sb_key, agent["namn"],
                               parti=parti_namn, ideologi=ideologi, saldo=saldo)
    t = url_typ(url)
    print(f"  {t}")
    if url:
        print(f"  URL: {url}")
    resultat.append(("propaganda", url))

    # ── 4. Valkampanj ────────────────────────────────────────────────────────
    print("\n── 4/4  VALKAMPANJ ─────────────────────────────────────────")
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
        manifest_utdrag = "Ett rättvisare samhälle för alla"
        test_parti = parti_namn or "Testpartiet"
        print(f"  Inget aktivt val — simulerar med parti: {test_parti}")
        parti_namn = test_parti

    url = generera_valkampanj(sb_key, agent["namn"], parti_namn,
                               manifest_utdrag=manifest_utdrag, saldo=saldo)
    t = url_typ(url)
    print(f"  {t}")
    if url:
        print(f"  URL: {url}")
    resultat.append(("valkampanj", url))

    # ── Verifiera sparade bilder i Supabase ──────────────────────────────────
    print(f"\n── Verifierar sparade bilder i Supabase ────────────────────")
    sparade = hamta_senaste_bilder(sb_key, agent["namn"], antal=4)
    if sparade:
        storage_antal = sum(1 for b in sparade if SB_URL in (b.get("bild_url") or "") and "storage" in (b.get("bild_url") or ""))
        pollen_antal  = len(sparade) - storage_antal
        print(f"  Senaste {len(sparade)} bilder i DB:")
        for b in sparade:
            typ = url_typ(b.get("bild_url", ""))
            ts = (b.get("skapad") or "")[:16]
            print(f"    [{ts}] {b.get('bildtyp','?'):12s} → {typ}")
    else:
        print("  (inga bilder funna i DB)")

    # ── Sammanfattning ────────────────────────────────────────────────────────
    storage_ok  = sum(1 for _, u in resultat if u and SB_URL in u and "storage" in u)
    pollen_fall = sum(1 for _, u in resultat if u and "pollinations" in u)
    missade     = sum(1 for _, u in resultat if not u)

    print(f"\n{'='*62}")
    print(f"  RESULTAT: {storage_ok}/4 sparade i Supabase Storage")
    if pollen_fall:
        print(f"  {pollen_fall}/4 föll tillbaka på Pollinations URL")
    if missade:
        print(f"  {missade}/4 misslyckades helt")
    print(f"\n  Visa på: https://www.debatt-ai.se/ai-bilder"
          f"?agent={agent['namn'].replace(' ', '%20')}")
    print(f"{'='*62}\n")

    if storage_ok == 0 and pollen_fall > 0:
        print("  ⚠️  Alla bilder pekar mot Pollinations — Storage-uppladdning verkar inte fungera.")
        print("  Kontrollera att bucket 'agent-bilder' finns och att INSERT-policy är aktiv.")
        sys.exit(1)


if __name__ == "__main__":
    main()
