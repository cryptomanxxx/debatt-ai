#!/usr/bin/env python3
"""
backtest_fetch.py – Hämtar OHLCV-data från Yahoo Finance och cachar i Supabase (ohlcv_cache).

Körs separat från strategi-beräkningarna. Behöver bara köras när ny prisdata önskas
(t.ex. en gång i veckan). Strategikörningar (backtest.py) läser från cachen.
"""

import httpx
import os
import sys
from datetime import datetime

import yfinance as yf

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

if not SB_KEY:
    print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

COINS = [
    ("BTC", "BTC-USD"),
    ("ETH", "ETH-USD"),
    ("SOL", "SOL-USD"),
    ("XRP", "XRP-USD"),
    ("BNB", "BNB-USD"),
]
DAYS = 730


def hamta_yahoo(ticker: str) -> list[dict]:
    try:
        df = yf.download(ticker, period=f"{DAYS}d", interval="1d",
                         progress=False, auto_adjust=True)
        if df is None or df.empty:
            return []
        result = []
        for datum, row in df.iterrows():
            close = row["Close"]
            vol   = row["Volume"]
            if hasattr(close, "iloc"):
                close = float(close.iloc[0])
                vol   = float(vol.iloc[0])
            else:
                close = float(close)
                vol   = float(vol)
            if close > 0:
                result.append({
                    "datum": datum.date().isoformat(),
                    "pris":  close,
                    "vol":   vol,
                })
        return sorted(result, key=lambda x: x["datum"])
    except Exception as e:
        print(f"  Yahoo fel ({ticker}): {e}", file=sys.stderr)
        return []


def spara_ohlcv(symbol: str, rows: list[dict]):
    headers = {
        "apikey":        SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates,return=minimal",
    }
    data = [{"symbol": symbol, "datum": r["datum"],
             "pris": r["pris"], "vol": r["vol"]} for r in rows]
    # Batch-insert i grupper om 500 (under PostgREST-gränsen)
    for i in range(0, len(data), 500):
        batch = data[i:i + 500]
        r = httpx.post(
            f"{SB_URL}/rest/v1/ohlcv_cache?on_conflict=symbol,datum",
            json=batch, headers=headers, timeout=30,
        )
        if r.status_code not in (200, 201, 204):
            print(f"  ✗ Sparfel batch {i}: {r.status_code} {r.text[:80]}", file=sys.stderr)


def main():
    print(f"\n=== FETCH {datetime.now().strftime('%Y-%m-%d %H:%M')} ===")
    for symbol, ticker in COINS:
        print(f"  {symbol} ({ticker})…", end=" ", flush=True)
        rows = hamta_yahoo(ticker)
        if not rows:
            print("ingen data")
            continue
        spara_ohlcv(symbol, rows)
        print(f"{len(rows)} dagar ({rows[0]['datum']} → {rows[-1]['datum']})")
    print("=== KLART ===\n")


if __name__ == "__main__":
    main()
