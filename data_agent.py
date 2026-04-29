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
from datetime import datetime, timezone, timedelta

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
CMC_API_KEY = os.environ.get("CMC_API_KEY", "")

if not SB_KEY:
    print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

# ── Krypto-coins för veckomarkets ────────────────────────────────────────────
KRYPTO_COINS = [
    ("Bitcoin",  "BTC"),
    ("Ethereum", "ETH"),
    ("Solana",   "SOL"),
    ("XRP",      "XRP"),
    ("BNB",      "BNB"),
]

# ── World Bank-indikatorer ────────────────────────────────────────────────────
# Format: (nyckel, namn, kategori, enhet, wb_indicator)
WB_INDIKATORER = [
    # Ekonomi (mrv=15 för indikatorer med lång eftersläpning)
    ("bnp_tillvaxt",       "BNP-tillväxt",                 "ekonomi",     "%",               "NY.GDP.MKTP.KD.ZG",  10),
    ("inflation",          "Inflation (KPI)",               "ekonomi",     "%",               "FP.CPI.TOTL.ZG",     10),
    ("export_bnp",         "Export (% av BNP)",             "ekonomi",     "% av BNP",        "NE.EXP.GNFS.ZS",     10),
    # Arbetsmarknad
    ("arbetslöshet",       "Arbetslöshet",                  "arbetsmarknad", "%",             "SL.UEM.TOTL.ZS",     10),
    ("ungdomsarbetslöshet","Ungdomsarbetslöshet (15–24 år)","arbetsmarknad", "%",             "SL.UEM.1524.ZS",     10),
    ("sysselsattning",     "Sysselsättningsgrad",           "arbetsmarknad", "%",             "SL.EMP.WORK.ZS",     10),
    # Klimat & energi (CO2 har lång eftersläpning – hämta 20 år bakåt)
    ("co2_per_capita",     "CO2-utsläpp per capita",        "klimat",      "ton/person",      "EN.ATM.CO2E.PC",     20),
    ("fornybar_el",        "Förnybar el (% av total)",      "klimat",      "%",               "EG.ELC.RNEW.ZS",     10),
    ("skogstäckning",      "Skogstäckning (% av land)",     "klimat",      "%",               "AG.LND.FRST.ZS",     10),
    # Välfärd & utbildning
    ("utbildning_bnp",     "Utbildningsutgifter (% av BNP)","valfard",     "% av BNP",       "SE.XPD.TOTL.GD.ZS",  15),
    ("halsa_bnp",          "Hälsovårdsutgifter (% av BNP)","valfard",     "% av BNP",        "SH.XPD.CHEX.GD.ZS",  10),
    ("livslangd",          "Medellivslängd",                "valfard",     "år",              "SP.DYN.LE00.IN",     10),
    ("gini",               "Gini-koefficient (ojämlikhet)", "valfard",     "index 0–100",     "SI.POV.GINI",        15),
]

# ── Riksbanken-indikatorer ────────────────────────────────────────────────────
# Kandidat-ID:n provas i ordning tills ett fungerar
# Format: (nyckel, namn, kategori, enhet, [kandidat_id, ...])
RB_INDIKATORER = [
    ("styrränta", "Styrränta", "ekonomi", "%",
     ["SECBREPOEFF", "SECBREPO", "SEREPMIN", "REPORATE", "SE.CB.PR"]),
    ("kpif", "KPIF", "ekonomi", "%",
     ["SEKPIF", "SECPIFXFE", "SEKPIFEXT", "CPIFSE"]),
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


def hamta_riksbanken(kandidater: list[str]) -> tuple[list[dict], str]:
    """Provar kandidat-ID:n i ordning och returnerar (historik, fungerande_id)."""
    for series_id in kandidater:
        for url_mall in [
            f"https://api.riksbank.se/swea/v1/Observations/{series_id}/latest/36",
            f"https://api.riksbank.se/swea/v1/Observations?seriesid={series_id}&latest=36",
        ]:
            try:
                res = httpx.get(url_mall, timeout=15, follow_redirects=True,
                                headers={"Accept": "application/json"})
                if not res.is_success:
                    continue
                data = res.json()
                if not isinstance(data, list) or not data:
                    continue
                punkter = []
                for row in data:
                    period = (row.get("date") or row.get("period") or "")[:7]
                    varde = row.get("value") or row.get("val")
                    if period and varde is not None:
                        punkter.append({"period": period, "varde": round(float(varde), 3)})
                if not punkter:
                    continue
                seen = {}
                for p in punkter:
                    seen[p["period"]] = p["varde"]
                historik = [{"period": k, "varde": v} for k, v in sorted(seen.items())]
                print(f"  Riksbanken: hittade serie {series_id}")
                return historik[-36:], series_id
            except Exception:
                continue
    print(f"  Riksbanken: inget av {kandidater} fungerade", file=sys.stderr)
    return [], ""


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

    # Upsert på nyckel-kolumnen (on_conflict krävs för att Supabase ska välja rätt unique key)
    headers = {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    res = httpx.post(f"{SB_URL}/rest/v1/statistik?on_conflict=nyckel",
                     json=row, headers=headers, timeout=15)

    if res.status_code in (200, 201, 204):
        print(f"  ✓ {namn}: {senaste['varde']} {enhet} ({senaste['period']})")
        return True
    else:
        print(f"  ✗ {namn}: HTTP {res.status_code} – {res.text[:120]}", file=sys.stderr)
        return False


def spara_krypto_historik() -> int:
    """Hämtar topp 50 kryptovalutor från CoinMarketCap och sparar daglig snapshot."""
    if not CMC_API_KEY:
        print("  Hoppar CoinMarketCap: CMC_API_KEY saknas", file=sys.stderr)
        return 0

    today = datetime.now(timezone.utc).date().isoformat()

    try:
        res = httpx.get(
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
            params={"start": 1, "limit": 50, "convert": "USD"},
            headers={"X-CMC_PRO_API_KEY": CMC_API_KEY, "Accept": "application/json"},
            timeout=20,
        )
        res.raise_for_status()
        coins = res.json().get("data", [])
    except Exception as e:
        print(f"  CoinMarketCap fel: {e}", file=sys.stderr)
        return 0

    if not coins:
        print("  CoinMarketCap: tom respons", file=sys.stderr)
        return 0

    rows = []
    for coin in coins:
        q = coin.get("quote", {}).get("USD", {})
        rows.append({
            "datum":          today,
            "symbol":         coin["symbol"],
            "namn":           coin["name"],
            "rank":           coin["cmc_rank"],
            "pris_usd":       q.get("price"),
            "marknadsvarde":  q.get("market_cap"),
            "volym_24h":      q.get("volume_24h"),
            "forandring_1h":  q.get("percent_change_1h"),
            "forandring_24h": q.get("percent_change_24h"),
            "forandring_7d":  q.get("percent_change_7d"),
            "cirkulation":    coin.get("circulating_supply"),
        })

    headers = {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    upsert = httpx.post(
        f"{SB_URL}/rest/v1/krypto_historik?on_conflict=datum,symbol",
        json=rows, headers=headers, timeout=30,
    )

    if upsert.status_code in (200, 201, 204):
        print(f"  ✓ CoinMarketCap: {len(rows)} mynt sparade ({today})")
        return len(rows)
    else:
        print(f"  ✗ CoinMarketCap: HTTP {upsert.status_code} – {upsert.text[:200]}", file=sys.stderr)
        return 0


def skapa_krypto_markets():
    """Skapar veckomarkets för topp-5 coins om inga öppna markets finns för dem."""
    hdrs = {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
    }
    today = datetime.now(timezone.utc).date()
    deadline_iso = f"{(today + timedelta(days=7)).isoformat()}T23:59:00+00:00"

    for namn, symbol in KRYPTO_COINS:
        kalla = f"krypto_historik:{symbol}"

        # Hoppa om öppet market redan finns
        chk = httpx.get(
            f"{SB_URL}/rest/v1/markets",
            params={"select": "id", "resolution_kalla": f"eq.{kalla}", "status": "eq.öppen"},
            headers=hdrs, timeout=10,
        )
        if chk.status_code == 200 and chk.json():
            print(f"  Market för {namn} finns redan — hoppar")
            continue

        # Hämta dagens startpris från krypto_historik
        pr = httpx.get(
            f"{SB_URL}/rest/v1/krypto_historik",
            params={"select": "pris_usd", "symbol": f"eq.{symbol}",
                    "datum": f"eq.{today.isoformat()}", "limit": "1"},
            headers=hdrs, timeout=10,
        )
        if pr.status_code != 200 or not pr.json():
            print(f"  Inget pris för {symbol} idag — hoppar", file=sys.stderr)
            continue

        start_pris = float(pr.json()[0]["pris_usd"])
        row = {
            "titel":            f"Är priset på {namn} högre om en vecka än idag?",
            "beskrivning":      json.dumps({
                "symbol":      symbol,
                "start_pris":  start_pris,
                "start_datum": today.isoformat(),
            }),
            "deadline":         deadline_iso,
            "resolution_kalla": kalla,
            "status":           "öppen",
            "kategori":         "krypto",
        }
        ins = httpx.post(
            f"{SB_URL}/rest/v1/markets",
            json=row, headers={**hdrs, "Prefer": "return=minimal"}, timeout=10,
        )
        if ins.status_code in (200, 201, 204):
            print(f"  ✓ Market skapat: {namn} @ {start_pris:,.0f} USD")
        else:
            print(f"  ✗ Market fel {namn}: {ins.status_code} {ins.text[:100]}", file=sys.stderr)


def lös_krypto_markets():
    """Löser utgångna krypto-markets genom att jämföra priser i krypto_historik."""
    hdrs = {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
    }
    now_iso = datetime.now(timezone.utc).isoformat()

    res = httpx.get(
        f"{SB_URL}/rest/v1/markets",
        params={
            "select": "id,titel,beskrivning,deadline",
            "resolution_kalla": "like.krypto_historik:*",
            "status": "eq.öppen",
            "deadline": f"lt.{now_iso}",
        },
        headers=hdrs, timeout=10,
    )
    if res.status_code != 200:
        print(f"  Fel vid hämtning av markets: {res.status_code}", file=sys.stderr)
        return

    utgångna = res.json()
    if not utgångna:
        print("  Inga krypto-markets att lösa")
        return

    for m in utgångna:
        try:
            info = json.loads(m["beskrivning"])
            symbol = info["symbol"]
            start_pris = float(info["start_pris"])
            deadline_date = m["deadline"][:10]
        except Exception as e:
            print(f"  Market {m['id']}: parse-fel – {e}", file=sys.stderr)
            continue

        # Hämta priset vid eller närmast efter deadline
        pr = httpx.get(
            f"{SB_URL}/rest/v1/krypto_historik",
            params={"select": "pris_usd,datum", "symbol": f"eq.{symbol}",
                    "datum": f"gte.{deadline_date}", "order": "datum.asc", "limit": "1"},
            headers=hdrs, timeout=10,
        )
        if pr.status_code != 200 or not pr.json():
            print(f"  Market {m['id']} ({symbol}): inget pris vid deadline — väntar")
            continue

        slut_pris = float(pr.json()[0]["pris_usd"])
        utfall = "ja" if slut_pris > start_pris else "nej"

        upd = httpx.patch(
            f"{SB_URL}/rest/v1/markets?id=eq.{m['id']}",
            json={"utfall": utfall, "status": "avgjord"},
            headers={**hdrs, "Prefer": "return=minimal"}, timeout=10,
        )
        if upd.status_code in (200, 201, 204):
            riktning = "↑ högre" if utfall == "ja" else "↓ lägre"
            print(f"  ✓ Löst: {symbol} {start_pris:,.0f} → {slut_pris:,.0f} USD = {riktning}")
        else:
            print(f"  ✗ Uppdatering misslyckades: {upd.status_code} {upd.text[:100]}", file=sys.stderr)


def main():
    print(f"\n=== DATA AGENT {datetime.now().strftime('%Y-%m-%d %H:%M')} ===\n")
    ok = 0
    fel = 0

    # World Bank
    print("── World Bank ──")
    for nyckel, namn, kategori, enhet, wb_id, mrv in WB_INDIKATORER:
        historik = hamta_world_bank(wb_id, n=mrv)
        url = f"https://data.worldbank.org/indicator/{wb_id}?locations=SE"
        if spara_statistik(nyckel, namn, kategori, enhet, "World Bank", url, historik):
            ok += 1
        else:
            fel += 1

    # Riksbanken (pausad – SWEA API kräver verifiering av rätt serie-ID)
    # print("\n── Riksbanken ──")
    # TODO: hitta fungerande serie-ID för styrränta och KPIF

    # CoinMarketCap – daglig kryptodata
    print("\n── CoinMarketCap ──")
    spara_krypto_historik()

    # Krypto-markets: lös utgångna, skapa nya
    print("\n── Krypto-markets ──")
    lös_krypto_markets()
    skapa_krypto_markets()

    print(f"\n=== KLART: {ok} uppdaterade, {fel} misslyckade ===")
    # Krascha bara om ingenting alls lyckades
    if ok == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
