"""
PIS Backfill — körs manuellt via GitHub Actions (workflow_dispatch).

Hämtar ALLA lagförslag i Supabase som saknar PIS-analys och/eller
Monte Carlo-data och kör dem i batch. Skiljer sig från den dagliga
parlament_test.py-körningen som bara hanterar 2–8 nya förslag.

Konfiguration via miljövariabler:
  MAX_PIS        — max antal förslag att PIS-analysera (default 50)
  MAX_MC         — max antal förslag att MC-analysera (default 20)
  SLEEP_PIS      — sekunder mellan varje PIS-anrop (default 2)
  SLEEP_MC       — sekunder mellan varje MC-anrop (default 5)
  MIN_ITERATIONER — re-kör MC på förslag med färre iterationer än detta värde (default 0 = av)
"""
import os
import sys
import time

import httpx

from supabase_utils import (
    SB_URL,
    analysera_forslag_pis,
    analysera_pis_monte_carlo,
)

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

MAX_PIS = int(os.environ.get("MAX_PIS", "50"))
MAX_MC = int(os.environ.get("MAX_MC", "20"))
SLEEP_PIS = float(os.environ.get("SLEEP_PIS", "2"))
SLEEP_MC = float(os.environ.get("SLEEP_MC", "5"))
MC_ITERATIONER = int(os.environ.get("MC_ITERATIONER", "15"))
MIN_ITERATIONER = int(os.environ.get("MIN_ITERATIONER", "0"))

HEADERS = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}", "Prefer": ""}


def hamta_alla_forslag_utan_pis(max_antal: int) -> list[dict]:
    """Hämtar upp till max_antal förslag (alla statusar) som saknar PIS-analys."""
    # Hämta alla PIS-analyserade lagforslag_id
    r_pis = httpx.get(
        f"{SB_URL}/rest/v1/pis_analyser?select=lagforslag_id",
        headers=HEADERS, timeout=15,
    )
    har_pis = {row["lagforslag_id"] for row in (r_pis.json() if r_pis.is_success else [])}

    # Hämta alla lagförslag i sidor om 1 000 tills vi har tillräckligt
    alla = []
    offset = 0
    page_size = 1000
    while len(alla) < max_antal * 3:
        r = httpx.get(
            f"{SB_URL}/rest/v1/lagforslag"
            f"?select=id,titel,beskrivning"
            f"&order=skapad.asc"
            f"&limit={page_size}&offset={offset}",
            headers=HEADERS, timeout=15,
        )
        if not r.is_success:
            break
        sida = r.json()
        if not sida:
            break
        alla.extend(sida)
        if len(sida) < page_size:
            break
        offset += page_size

    saknar = [f for f in alla if f["id"] not in har_pis]
    return saknar[:max_antal]


def hamta_alla_forslag_utan_mc(max_antal: int, min_iterationer: int = 0) -> list[dict]:
    """Hämtar upp till max_antal förslag (alla statusar) som har PIS men saknar MC.
    Om min_iterationer > 0 inkluderas också förslag vars befintliga MC har färre
    iterationer än gränsvärdet — för uppgradering till fler iterationer."""
    r_pis = httpx.get(
        f"{SB_URL}/rest/v1/pis_analyser?select=lagforslag_id",
        headers=HEADERS, timeout=15,
    )
    har_pis = {row["lagforslag_id"] for row in (r_pis.json() if r_pis.is_success else [])}

    r_mc = httpx.get(
        f"{SB_URL}/rest/v1/pis_monte_carlo?select=lagforslag_id,iterationer",
        headers=HEADERS, timeout=15,
    )
    mc_rader = r_mc.json() if r_mc.is_success else []
    har_mc = {row["lagforslag_id"] for row in mc_rader}

    # Förslag utan MC alls
    behöver_mc = har_pis - har_mc

    # Om MIN_ITERATIONER är satt: lägg även till förslag med för få iterationer
    if min_iterationer > 0:
        uppgradera = {
            row["lagforslag_id"] for row in mc_rader
            if (row.get("iterationer") or 0) < min_iterationer
        }
        behöver_mc = behöver_mc | uppgradera
        if uppgradera:
            print(f"  (varav {len(uppgradera)} uppgraderingar: iterationer < {min_iterationer})")

    if not behöver_mc:
        return []

    ids_str = ",".join(str(i) for i in behöver_mc)
    r_lag = httpx.get(
        f"{SB_URL}/rest/v1/lagforslag"
        f"?id=in.({ids_str})"
        f"&select=id,titel,beskrivning"
        f"&order=skapad.asc"
        f"&limit={max_antal}",
        headers=HEADERS, timeout=15,
    )
    return r_lag.json() if r_lag.is_success else []


# ── STEG 1: PIS-analys ──────────────────────────────────────────────────────
print(f"\n{'═'*60}")
print(f"  PIS Backfill — max {MAX_PIS} PIS + max {MAX_MC} MC")
print(f"{'═'*60}\n")

print(f"── Steg 1: PIS-analys (max {MAX_PIS} förslag) ──")
att_pis_analysera = hamta_alla_forslag_utan_pis(MAX_PIS)

if not att_pis_analysera:
    print("  ✓ Alla lagförslag har redan PIS-analys — inget att göra")
else:
    print(f"  {len(att_pis_analysera)} förslag saknar PIS — börjar analysera…")
    pis_ok = 0
    pis_fel = 0
    pis_consecutive_fel = 0
    PIS_MAX_CONSECUTIVE = 5
    for i, lag in enumerate(att_pis_analysera, 1):
        titel_kort = lag["titel"][:60] + ("…" if len(lag["titel"]) > 60 else "")
        print(f"  [{i:3d}/{len(att_pis_analysera)}] id={lag['id']} — {titel_kort}")
        ok = analysera_forslag_pis(
            SB_KEY, lag["id"], lag["titel"], lag.get("beskrivning") or ""
        )
        if ok:
            pis_ok += 1
            pis_consecutive_fel = 0
            print(f"          ✓ PIS klar")
        else:
            pis_fel += 1
            pis_consecutive_fel += 1
            print(f"          ✗ Misslyckades (LLM-fel) — försöks igen nästa körning")
            if pis_consecutive_fel >= PIS_MAX_CONSECUTIVE:
                print(f"\n  ⚠ {PIS_MAX_CONSECUTIVE} fel i rad — LLM verkar nere, avbryter PIS-batch")
                break
        if i < len(att_pis_analysera):
            time.sleep(SLEEP_PIS)
    print(f"\n  PIS-sammanfattning: {pis_ok} lyckades, {pis_fel} misslyckades")

# ── STEG 2: Monte Carlo ──────────────────────────────────────────────────────
uppg_info = f", uppgraderar iterationer < {MIN_ITERATIONER}" if MIN_ITERATIONER > 0 else ""
print(f"\n── Steg 2: Monte Carlo {MC_ITERATIONER} iterationer (max {MAX_MC} förslag{uppg_info}) ──")
att_mc_analysera = hamta_alla_forslag_utan_mc(MAX_MC, min_iterationer=MIN_ITERATIONER)

if not att_mc_analysera:
    print("  ✓ Alla PIS-förslag har redan MC-analys — inget att göra")
else:
    print(f"  {len(att_mc_analysera)} förslag saknar MC — börjar analysera…")
    mc_ok = 0
    mc_fel = 0
    mc_consecutive_fel = 0
    MC_MAX_CONSECUTIVE = 3
    for i, lag in enumerate(att_mc_analysera, 1):
        titel_kort = lag["titel"][:60] + ("…" if len(lag["titel"]) > 60 else "")
        print(f"  [{i:3d}/{len(att_mc_analysera)}] id={lag['id']} — {titel_kort}")
        print(f"          Kör {MC_ITERATIONER} MC-iterationer…")
        ok = analysera_pis_monte_carlo(
            SB_KEY, lag["id"], lag["titel"], lag.get("beskrivning") or "",
            iterationer=MC_ITERATIONER,
        )
        if ok:
            mc_ok += 1
            mc_consecutive_fel = 0
            print(f"          ✓ MC klar")
        else:
            mc_fel += 1
            mc_consecutive_fel += 1
            print(f"          ✗ Misslyckades (< 5 lyckade iterationer) — försöks igen nästa körning")
            if mc_consecutive_fel >= MC_MAX_CONSECUTIVE:
                print(f"\n  ⚠ {MC_MAX_CONSECUTIVE} MC-fel i rad — LLM verkar nere, avbryter MC-batch")
                break
        if i < len(att_mc_analysera):
            time.sleep(SLEEP_MC)
    print(f"\n  MC-sammanfattning: {mc_ok} lyckades, {mc_fel} misslyckades")

print(f"\n{'═'*60}")
print("  Backfill klar!")
print(f"{'═'*60}")
