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

Många av de ~44 källorna är engelskspråkiga (Verge, TechCrunch, BBC, IGN,
r/worldnews m.fl.) — utan översättning blandas svenska och engelska
huvudlöst på /nyhetskallor. Innan insert körs därför en batch-LLM-detektion
+ översättning (_oversatt_batch) på de rader som är genuint NYA sedan
tidigare körningar (redan kända URL:er hoppas över — annars skulle samma
~300–400 rader per körning översättas på nytt sex gånger om dagen).
"""
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone

import httpx

from nyheter import hamta_nyheter, filtrera_nyheter, FEED_KATEGORIER
from supabase_utils import _llm_spel

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
OVERSATT_BATCH = 20
KANDA_URL_DAGAR = 3

SPRAK_SYSTEM = (
    "Du är en professionell nyhetsöversättare. Du får en JSON-lista med "
    'nyhetsobjekt (fälten "i", "rubrik", "beskrivning"). Om ett objekts text '
    "redan är på svenska, returnera det HELT OFÖRÄNDRAT. Om texten är på ett "
    "annat språk, översätt rubrik och beskrivning till naturlig, korrekt "
    "svenska — bevara sakinnehållet exakt, hitta inte på nya detaljer och "
    "förkorta inte. Svara ENDAST med en giltig JSON-lista i exakt samma "
    "format, ordning och antal objekt som indata. Inga andra tecken, ingen "
    "markdown, ingen förklaring."
)


def hamta_kanda_urls(dagar: int = KANDA_URL_DAGAR) -> set[str]:
    """URL:er som redan finns i nyhetsflode senaste `dagar` dagarna — används för
    att bara köra (kostsam) översättning på rader som faktiskt är nya."""
    sedan = (datetime.now(timezone.utc) - timedelta(days=dagar)).isoformat()
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/nyhetsflode?select=url&hamtad=gte.{sedan}&limit=8000",
            headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
            timeout=20,
        )
        if res.status_code == 200:
            return {r["url"] for r in res.json() if r.get("url")}
    except Exception as e:
        print(f"  Varning: kunde inte hämta kända URL:er ({e}) — översätter alla rader denna körning.", file=sys.stderr)
    return set()


def _oversatt_batch(objekt: list[dict]) -> list[dict]:
    """Detekterar språk + översätter en batch till svenska via LLM.
    Fail-open: returnerar originalobjekten oförändrade vid fel, tomt eller
    ogiltigt/felformat svar — en misslyckad översättning ska aldrig blockera
    att nyheten ändå sparas (på originalspråk)."""
    prompt = json.dumps(objekt, ensure_ascii=False)
    svar = _llm_spel(SPRAK_SYSTEM, prompt, max_tokens=3000)
    if not svar:
        return objekt
    text = svar.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(json)?\s*|\s*```$", "", text, flags=re.IGNORECASE).strip()
    try:
        oversatta = json.loads(text)
    except Exception:
        return objekt
    if not isinstance(oversatta, list) or len(oversatta) != len(objekt):
        return objekt

    by_i = {o.get("i"): o for o in oversatta if isinstance(o, dict) and "i" in o}
    resultat = []
    for orig in objekt:
        o = by_i.get(orig["i"])
        if o and isinstance(o.get("rubrik"), str) and o["rubrik"].strip():
            resultat.append({
                "i": orig["i"],
                "rubrik": o["rubrik"].strip()[:300],
                "beskrivning": (o.get("beskrivning") or "").strip()[:800] or None,
            })
        else:
            resultat.append(orig)
    return resultat


def oversatt_nya_rader(rader: list[dict], kanda_urls: set[str]) -> None:
    """Muterar `rader` på plats — översätter bara de rader vars URL inte redan
    finns i nyhetsflode. Körs batchvis (OVERSATT_BATCH åt gången) för att hålla
    varje LLM-anrop och prompt rimligt stor."""
    nya = [r for r in rader if r["url"] not in kanda_urls]
    if not nya:
        print("Inga nya rader att översätta.")
        return
    print(f"{len(nya)}/{len(rader)} rader är nya — kör språkdetektion/översättning på dem.")

    for i in range(0, len(nya), OVERSATT_BATCH):
        chunk = nya[i:i + OVERSATT_BATCH]
        objekt = [{"i": j, "rubrik": r["rubrik"], "beskrivning": r["beskrivning"] or ""} for j, r in enumerate(chunk)]
        oversatta = _oversatt_batch(objekt)
        if len(oversatta) != len(chunk):
            continue
        for j, o in enumerate(oversatta):
            if o.get("rubrik"):
                chunk[j]["rubrik"] = o["rubrik"]
            chunk[j]["beskrivning"] = o.get("beskrivning")


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

    kanda_urls = hamta_kanda_urls()
    oversatt_nya_rader(rader, kanda_urls)

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
