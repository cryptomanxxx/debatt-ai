#!/usr/bin/env python3
"""
vbnb_fetch.py — Hämtar daglig data för VanEck BNB ETF (VBNB) och sparar till Supabase.

Datakällor i prioritetsordning:
  1. VanEck holdings-sida (BNB in Trust direkt)
  2. yfinance (NAV/aktie, AUM via totalAssets)
  3. Beräknad: BNB in Trust = AUM / BNB-pris (från ohlcv_cache)
"""

import os, sys, json, re, datetime
import httpx
import yfinance as yf

SB_URL    = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY    = os.environ.get("SUPABASE_ANON_KEY", "")
TICKER    = "VBNB"
VANECK_URL = "https://www.vaneck.com/us/en/investments/bnb-etf-vbnb/overview/"

if not SB_KEY:
    print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

# ── Supabase-hjälpare ──────────────────────────────────────────────────────────

def sb_get(path: str) -> list:
    r = httpx.get(
        f"{SB_URL}/rest/v1/{path}",
        headers={"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def sb_upsert(table: str, row: dict) -> None:
    r = httpx.post(
        f"{SB_URL}/rest/v1/{table}",
        headers={
            "apikey": SB_KEY,
            "Authorization": f"Bearer {SB_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=row,
        timeout=15,
    )
    r.raise_for_status()


# ── BNB-pris från ohlcv_cache ─────────────────────────────────────────────────

def hamta_bnb_pris() -> float | None:
    """Hämtar senaste BNB-pris från ohlcv_cache (fylls av backtest_fetch.py)."""
    try:
        rows = sb_get("ohlcv_cache?select=close&symbol=eq.BNB&order=datum.desc&limit=1")
        if rows:
            return float(rows[0]["close"])
    except Exception as e:
        print(f"  ohlcv_cache-fel: {e}")
    # Fallback: hämta från Yahoo Finance direkt
    try:
        bnb = yf.Ticker("BNB-USD")
        hist = bnb.history(period="2d")
        if not hist.empty:
            return float(hist["Close"].iloc[-1])
    except Exception as e:
        print(f"  BNB yfinance-fel: {e}")
    return None


# ── VanEck-sidans sida (försöker extrahera BNB in Trust) ──────────────────────

def hamta_vaneck_bnb_in_trust() -> float | None:
    """
    Försöker hämta BNB in Trust direkt från VanEck-sidan.
    VanEck bäddar ibland in data som JSON i <script>-taggar.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; debatt-ai/1.0; +https://www.debatt-ai.se)",
            "Accept": "text/html,application/xhtml+xml",
        }
        r = httpx.get(VANECK_URL, headers=headers, timeout=20, follow_redirects=True)
        if not r.is_success:
            print(f"  VanEck HTTP {r.status_code}")
            return None

        text = r.text

        # Letar efter mönster som "BNB in Trust" eller "coins in trust" med ett tal
        patterns = [
            r"BNB\s+in\s+Trust[^0-9]*([0-9][0-9,\.]+)",
            r"coins?\s+in\s+trust[^0-9]*([0-9][0-9,\.]+)",
            r'"bnbInTrust"\s*:\s*([0-9\.]+)',
            r'"coinsInTrust"\s*:\s*([0-9\.]+)',
            r'"totalHoldings"\s*:\s*([0-9\.]+)',
        ]
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val_str = m.group(1).replace(",", "")
                val = float(val_str)
                if 1 < val < 10_000_000:  # Rimlighetskoll
                    print(f"  VanEck: BNB in Trust = {val:,.2f}")
                    return val

        # Försök hitta JSON-LD eller next-data
        json_scripts = re.findall(r'<script[^>]*type="application/json"[^>]*>(.*?)</script>', text, re.DOTALL)
        for js in json_scripts:
            try:
                data = json.loads(js)
                for key in ["bnbInTrust", "coinsInTrust", "totalHoldings", "btcInTrust"]:
                    if key in str(data):
                        val = _sokjson(data, key)
                        if val and 1 < val < 10_000_000:
                            print(f"  VanEck JSON: {key} = {val:,.2f}")
                            return float(val)
            except Exception:
                pass

        print("  VanEck: kunde inte extrahera BNB in Trust från sidan")
    except Exception as e:
        print(f"  VanEck-fel: {e}")
    return None


def _sokjson(obj, key):
    """Rekursiv sökning i JSON-struktur."""
    if isinstance(obj, dict):
        if key in obj:
            return obj[key]
        for v in obj.values():
            r = _sokjson(v, key)
            if r is not None:
                return r
    elif isinstance(obj, list):
        for item in obj:
            r = _sokjson(item, key)
            if r is not None:
                return r
    return None


# ── yfinance-hämtning ─────────────────────────────────────────────────────────

def hamta_yfinance() -> dict:
    """Hämtar VBNB-data via yfinance."""
    result = {}
    try:
        ticker = yf.Ticker(TICKER)
        info   = ticker.info

        # NAV/aktie
        result["nav_per_share"] = (
            info.get("navPrice")
            or info.get("previousClose")
            or info.get("regularMarketPrice")
        )

        # AUM (totalAssets är det bästa fältet för ETF:er)
        aum = info.get("totalAssets")
        if not aum:
            # Fallback: market cap
            aum = info.get("marketCap")
        if not aum and result.get("nav_per_share") and info.get("sharesOutstanding"):
            aum = result["nav_per_share"] * info["sharesOutstanding"]
        result["aum_usd"] = aum

        # Aktier utestående
        result["shares_outstanding"] = info.get("sharesOutstanding")

        # Senaste stängningskurs (kan skilja från NAV)
        hist = ticker.history(period="2d")
        if not hist.empty:
            pris = float(hist["Close"].iloc[-1])
            if not result["nav_per_share"]:
                result["nav_per_share"] = pris
            # Beräkna AUM från pris om totalAssets saknas
            if not result["aum_usd"] and result.get("shares_outstanding"):
                result["aum_usd"] = pris * result["shares_outstanding"]

        print(f"  yfinance: NAV={result.get('nav_per_share')}, AUM={result.get('aum_usd')}, "
              f"aktier={result.get('shares_outstanding')}")
    except Exception as e:
        print(f"  yfinance-fel: {e}")
    return result


# ── Huvudlogik ─────────────────────────────────────────────────────────────────

def main():
    datum = datetime.date.today().isoformat()
    print(f"=== VBNB Fetch — {datum} ===")

    # 1. yfinance (pris/AUM)
    yf_data = hamta_yfinance()

    # 2. BNB-pris
    bnb_pris = hamta_bnb_pris()
    if bnb_pris:
        print(f"  BNB-pris: ${bnb_pris:,.2f}")
    else:
        print("  Varning: kunde inte hämta BNB-pris")

    # 3. BNB in Trust: försök VanEck-sidan, fyll annars med beräkning
    bnb_in_trust  = hamta_vaneck_bnb_in_trust()
    datakalla     = "vaneck"

    if bnb_in_trust is None:
        aum = yf_data.get("aum_usd")
        if aum and bnb_pris and bnb_pris > 0:
            bnb_in_trust = aum / bnb_pris
            datakalla    = "beraknad"
            print(f"  Beräknad BNB in Trust: {bnb_in_trust:,.2f} (AUM / BNB-pris)")
        else:
            print("  Varning: kunde inte beräkna BNB in Trust")
            datakalla = "yfinance"

    if not bnb_in_trust and not yf_data.get("aum_usd"):
        print("FEL: ingen data hämtad — hoppar över sparning")
        sys.exit(1)

    row = {
        "datum":              datum,
        "bnb_in_trust":       round(bnb_in_trust, 4) if bnb_in_trust else None,
        "aum_usd":            round(yf_data["aum_usd"]) if yf_data.get("aum_usd") else None,
        "nav_per_share":      round(yf_data["nav_per_share"], 4) if yf_data.get("nav_per_share") else None,
        "bnb_price_usd":      round(bnb_pris, 4) if bnb_pris else None,
        "shares_outstanding": yf_data.get("shares_outstanding"),
        "datakalla":          datakalla,
    }

    print(f"\nSparar rad: {json.dumps(row, indent=2)}")
    sb_upsert("vbnb_data", row)
    print(f"\n✓ VBNB-data sparad för {datum}")

    if bnb_in_trust:
        status = "ÖVER" if bnb_in_trust >= 10_000 else "UNDER"
        print(f"  BNB in Trust: {bnb_in_trust:,.2f} — {status} 10 000-gränsen")


if __name__ == "__main__":
    main()
