#!/usr/bin/env python3
"""
data_agent.py – Hämtar statistik från gratis-API:er och lagrar i Supabase.

Datakällor:
  - World Bank API  (gdp, inflation, unemployment, co2, energi)
  - Riksbanken API  (styrränta, KPIF)

Kräver miljövariabel:
  SUPABASE_ANON_KEY

Kör: python data_agent.py
"""

import httpx
import json
import os
import sys
from datetime import datetime, timezone

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

if not SB_KEY:
    print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

# ── World Bank-indikatorer ────────────────────────────────────────────────────
# Format: (nyckel, namn, kategori, enhet, wb_indicator)
WB_INDIKATORER = [
    # Ekonomi
    ("bnp_tillvaxt",       "BNP-tillväxt",                 "ekonomi",     "%",               "NY.GDP.MKTP.KD.ZG"),
    ("inflation",          "Inflation (KPI)",               "ekonomi",     "%",               "FP.CPI.TOTL.ZG"),
    ("statsskuld_bnp",     "Statsskuld (% av BNP)",         "ekonomi",     "% av BNP",        "GC.DOD.TOTL.GD.ZS"),
    ("export_bnp",         "Export (% av BNP)",             "ekonomi",     "% av BNP",        "NE.EXP.GNFS.ZS"),
    # Arbetsmarknad
    ("arbetslöshet",       "Arbetslöshet",                  "arbetsmarknad", "%",             "SL.UEM.TOTL.ZS"),
    ("ungdomsarbetslöshet","Ungdomsarbetslöshet (15–24 år)","arbetsmarknad", "%",             "SL.UEM.1524.ZS"),
    ("sysselsattning",     "Sysselsättningsgrad",           "arbetsmarknad", "%",             "SL.EMP.WORK.ZS"),
    # Klimat & energi
    ("co2_per_capita",     "CO2-utsläpp per capita",        "klimat",      "ton/person",      "EN.ATM.CO2E.PC"),
    ("fornybar_el",        "Förnybar el (% av total)",      "klimat",      "%",               "EG.ELC.RNEW.ZS"),
    ("skogstäckning",      "Skogstäckning (% av land)",     "klimat",      "%",               "AG.LND.FRST.ZS"),
    # Välfärd & utbildning
    ("utbildning_bnp",     "Utbildningsutgifter (% av BNP)","valfard",     "% av BNP",       "SE.XPD.TOTL.GD.ZS"),
    ("halsa_bnp",          "Hälsovårdsutgifter (% av BNP)","valfard",     "% av BNP",        "SH.XPD.CHEX.GD.ZS"),
    ("livslangd",          "Medellivslängd",                "valfard",     "år",              "SP.DYN.LE00.IN"),
    ("gini",               "Gini-koefficient (ojämlikhet)", "valfard",     "index 0–100",     "SI.POV.GINI"),
]

# ── Riksbanken-indikatorer ────────────────────────────────────────────────────
# Format: (nyckel, namn, kategori, enhet, series_id)
RB_INDIKATORER = [
    ("styrränta",   "Styrränta",    "ekonomi", "%", "SEREPMIN"),
    ("kpif",        "KPIF",         "ekonomi", "%", "SEKPIFEXT"),
]


def sb_headers():
    return {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }


def hamta_world_bank(indicator: str, country: str = "SE", n: int = 10) -> list[dict]:
    """Hämtar de senaste n värdena för en World Bank-indikator."""
    url = (
        f"https://api.worldbank.org/v2/country/{country}/indicator/{indicator}"
        f"?format=json&mrv={n}&per_page={n}"
    )
    try:
        res = httpx.get(url, timeout=15, follow_redirects=True)
        res.raise_for_status()
        payload = res.json()
        if not isinstance(payload, list) or len(payload) < 2:
            return []
        data = payload[1]
        if not data:
            return []
        punkter = []
        for row in data:
            if row.get("value") is not None:
                punkter.append({"period": str(row["date"]), "varde": round(float(row["value"]), 3)})
        punkter.sort(key=lambda x: x["period"])
        return punkter
    except Exception as e:
        print(f"  World Bank fel ({indicator}): {e}", file=sys.stderr)
        return []


def hamta_riksbanken(series_id: str) -> list[dict]:
    """Hämtar de senaste värdena för en Riksbanken-serie."""
    url = f"https://api.riksbank.se/swea/v1/Observations/{series_id}/latest/24"
    try:
        res = httpx.get(url, timeout=15, follow_redirects=True,
                        headers={"Accept": "application/json"})
        res.raise_for_status()
        data = res.json()
        punkter = []
        for row in data:
            period = row.get("date", "")[:7]  # YYYY-MM
            varde = row.get("value")
            if period and varde is not None:
                punkter.append({"period": period, "varde": round(float(varde), 3)})
        # Deduplicera per period (ta senaste)
        seen = {}
        for p in punkter:
            seen[p["period"]] = p["varde"]
        punkter = [{"period": k, "varde": v} for k, v in sorted(seen.items())]
        return punkter[-24:]
    except Exception as e:
        print(f"  Riksbanken fel ({series_id}): {e}", file=sys.stderr)
        return []


def spara_statistik(nyckel: str, namn: str, kategori: str, enhet: str,
                    kalla: str, kalla_url: str, historik: list[dict]):
    """Lagrar statistik i Supabase med upsert på nyckel."""
    if not historik:
        print(f"  Hoppar över {nyckel}: ingen data")
        return False

    senaste = historik[-1]
    row = {
        "nyckel":         nyckel,
        "namn":           namn,
        "kategori":       kategori,
        "enhet":          enhet,
        "senaste_varde":  senaste["varde"],
        "period":         senaste["period"],
        "historik":       historik,
        "kalla":          kalla,
        "kalla_url":      kalla_url,
        "uppdaterad":     datetime.now(timezone.utc).isoformat(),
    }

    url = f"{SB_URL}/rest/v1/statistik?nyckel=eq.{nyckel}"
    # Försök PATCH (uppdatera befintlig)
    res = httpx.patch(url, json=row, headers=sb_headers(), timeout=15)
    if res.status_code == 404 or (res.status_code == 200 and "0 rows" in res.text):
        # Rad finns inte – skapa ny
        res = httpx.post(f"{SB_URL}/rest/v1/statistik", json=row,
                         headers=sb_headers(), timeout=15)

    if res.status_code in (200, 201, 204):
        print(f"  ✓ {namn}: {senaste['varde']} {enhet} ({senaste['period']})")
        return True
    else:
        print(f"  ✗ {namn}: HTTP {res.status_code} – {res.text[:120]}", file=sys.stderr)
        return False


def main():
    print(f"\n=== DATA AGENT {datetime.now().strftime('%Y-%m-%d %H:%M')} ===\n")
    ok = 0
    fel = 0

    # World Bank
    print("── World Bank ──")
    for nyckel, namn, kategori, enhet, wb_id in WB_INDIKATORER:
        historik = hamta_world_bank(wb_id)
        url = f"https://data.worldbank.org/indicator/{wb_id}?locations=SE"
        if spara_statistik(nyckel, namn, kategori, enhet, "World Bank", url, historik):
            ok += 1
        else:
            fel += 1

    # Riksbanken
    print("\n── Riksbanken ──")
    for nyckel, namn, kategori, enhet, series_id in RB_INDIKATORER:
        historik = hamta_riksbanken(series_id)
        url = f"https://www.riksbank.se/sv/statistik/sok-rantor--valutakurser/?s={series_id}"
        if spara_statistik(nyckel, namn, kategori, enhet, "Riksbanken", url, historik):
            ok += 1
        else:
            fel += 1

    print(f"\n=== KLART: {ok} uppdaterade, {fel} misslyckade ===")
    if fel > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
