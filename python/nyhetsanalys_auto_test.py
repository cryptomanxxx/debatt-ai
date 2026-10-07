#!/usr/bin/env python3
"""
nyhetsanalys_auto_test.py — Automatisk AI-analys av nyanlända nyheter i
nyhetsflode, utan att en besökare behöver klicka något på /nyhetskallor.

Triggas av GitHub Actions dels via workflow_run direkt efter varje
Nyhetsflöde-körning (6 ggr/dag, den pålitliga vägen — se
nyhetsanalys-auto.yml), dels som catch-up-bonus på ett */20-schema (GitHub
levererar scheman tätare än ~1h som "best effort" och droppar i praktiken
merparten — 20-minutersschemat är alltså inte den huvudsakliga leveransvägen
längre, bara extra täckning). Låter en slumpmässig agent reagera i karaktär
på nyanlända nyheter i nyhetsflode och skriver reaktionen till
nyhetsanalys — SAMMA tabell som besökarutlösta analyser från
POST /api/chatt (typ="nyhetsanalys", se app/api/chatt/route.js), så båda
syns identiskt i "Fråga AI-agenter"-panelen på /nyhetskallor och i
Senaste aktivitet-widgeten på startsidan.

Max MAX_PER_KORNING nyheter analyseras per körning (kostnadstak) — vid en
backlog jobbas den av gradvis över flera körningar, alltid nyaste nyheten
först (order=hamtad.desc), så det som just kom in prioriteras.
"""
import os
import random
import sys

import httpx

from agenter import AGENTER
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
}

MAX_PER_KORNING = 15
# Större än vad en enskild körning hinner beta av (se workflow-kommentaren om
# kapacitet mellan ingest-omgångar) — annars kan äldre nyheter i en stor
# insamlingsbatch trängas ut ur fönstret av nyare innan de någonsin hunnit
# analyseras, eftersom frågan bara ser de N senaste raderna.
NYHETER_ATT_GRANSKA = 120


def hamta_nyheter_utan_analys() -> list[dict]:
    """De senaste NYHETER_ATT_GRANSKA nyheterna som ännu saknar minst en
    nyhetsanalys-rad, nyaste först."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/nyhetsflode?select=id,rubrik,beskrivning&order=hamtad.desc&limit={NYHETER_ATT_GRANSKA}",
            headers=HEADERS, timeout=20,
        )
        r.raise_for_status()
        nyheter = r.json()
    except Exception as e:
        print(f"Kunde inte hämta nyhetsflode: {e}", file=sys.stderr)
        return []
    if not nyheter:
        return []

    ids = ",".join(str(n["id"]) for n in nyheter)
    try:
        r2 = httpx.get(
            f"{SB_URL}/rest/v1/nyhetsanalys?select=nyhet_id&nyhet_id=in.({ids})",
            headers=HEADERS, timeout=20,
        )
        r2.raise_for_status()
        analyserade = {rad["nyhet_id"] for rad in r2.json()}
    except Exception as e:
        print(f"Kunde inte hämta befintliga nyhetsanalys-rader: {e}", file=sys.stderr)
        analyserade = set()

    return [n for n in nyheter if n["id"] not in analyserade]


def bygg_prompt(agent: dict, nyhet: dict) -> tuple[str, str]:
    beskrivning = (nyhet.get("beskrivning") or "").strip()
    kontext = f'Rubrik: "{nyhet["rubrik"]}"'
    if beskrivning:
        kontext += f"\nBeskrivning: {beskrivning}"

    system = f"""{agent['system']}

Du reagerar spontant på en nyhet, i din karaktär ovan. Svara med EXAKT
2–3 meningar. Var skarp och ta tydlig ställning. Förankra svaret konkret
i nyheten — nämn en specifik detalj, siffra eller händelse ur den, inte
bara ämnet i stort. Tala aldrig om att du är en AI. Börja INTE med
hälsningsfraser, "Som [din roll]" eller liknande inledningar. Svara
bara på svenska."""

    user = f"{kontext}\n\nVad är din spontana reaktion?"
    return system, user


def analysera(agent: dict, nyhet: dict) -> str:
    system, user = bygg_prompt(agent, nyhet)
    text = _llm_spel(system, user, max_tokens=200)
    return text.strip()[:1500] if text else ""


def spara(nyhet_id: int, agent: str, text: str) -> bool:
    try:
        r = httpx.post(
            f"{SB_URL}/rest/v1/nyhetsanalys",
            headers={**HEADERS, "Prefer": "return=minimal"},
            json={"nyhet_id": nyhet_id, "agent": agent, "analys": text},
            timeout=20,
        )
        return r.status_code in (200, 201)
    except Exception as e:
        print(f"  ✗ Kunde inte spara analys för nyhet {nyhet_id}: {e}", file=sys.stderr)
        return False


def main():
    kandidater = hamta_nyheter_utan_analys()
    if not kandidater:
        print("Inga nyheter utan analys just nu — inget att göra.")
        return

    urval = kandidater[:MAX_PER_KORNING]
    print(f"{len(kandidater)} nyheter saknar analys, analyserar {len(urval)} denna körning.")

    for nyhet in urval:
        agent = random.choice(AGENTER)
        text = analysera(agent, nyhet)
        if not text:
            print(f"  ✗ Ingen AI-provider svarade för nyhet {nyhet['id']}: {nyhet['rubrik'][:60]}")
            continue
        if spara(nyhet["id"], agent["namn"], text):
            print(f"  ✓ {agent['namn']} analyserade nyhet {nyhet['id']}: {nyhet['rubrik'][:60]}")
        else:
            print(f"  ✗ Sparning misslyckades för nyhet {nyhet['id']}")


if __name__ == "__main__":
    main()
