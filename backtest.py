#!/usr/bin/env python3
"""
backtest.py – Backtesta volym+pris-momentumstrategi på historisk kryptodata.

Signal: Köp när priset > N-dagars medelvärde OCH volymen > N-dagars medelvärde.
Exit:   Sälj efter M dagar (testas för M = 1, 3, 7).

Datakälla: Binance public API (ingen API-nyckel krävs)
Resultat:  Sparas i Supabase-tabellen backtest_resultat

Kör: python backtest.py
"""

import httpx
import os
import sys
import time
import statistics
from datetime import datetime, timezone

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

if not SB_KEY:
    print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

COINS = [
    ("BTC", "BTCUSDT", "Bitcoin"),
    ("ETH", "ETHUSDT", "Ethereum"),
    ("SOL", "SOLUSDT", "Solana"),
    ("XRP", "XRPUSDT", "XRP"),
    ("BNB", "BNBUSDT", "BNB"),
]

LOOKBACK = 10       # dagar för rullande medelvärde
EXITS    = [1, 3, 7]
DAYS     = 730      # 2 år historik


def hamta_binance(symbol: str) -> list[dict]:
    """Hämtar daglig OHLCV-data från Binance (ingen API-nyckel krävs)."""
    url = "https://api.binance.com/api/v3/klines"
    params = {"symbol": symbol, "interval": "1d", "limit": DAYS}

    for attempt in range(3):
        try:
            res = httpx.get(url, params=params, timeout=30)
            if res.status_code == 429:
                wait = 60 * (attempt + 1)
                print(f"  Rate limit — väntar {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            res.raise_for_status()
            rows = res.json()
            if not rows:
                return []

            result = []
            for row in rows:
                # [open_time, open, high, low, close, vol_base, close_time, vol_quote, ...]
                ts      = int(row[0])
                pris    = float(row[4])   # close-pris
                vol     = float(row[7])   # quote asset volume (USD)
                datum   = datetime.fromtimestamp(ts / 1000, tz=timezone.utc).date()
                result.append({"datum": datum, "pris": pris, "vol": vol})

            return sorted(result, key=lambda x: x["datum"])

        except Exception as e:
            print(f"  Binance fel ({symbol}, försök {attempt+1}): {e}", file=sys.stderr)
            if attempt < 2:
                time.sleep(5)
    return []


def backtesta(data: list[dict], exit_days: int) -> dict | None:
    """
    Simulerar strategin på dataserien.
    En ny position öppnas bara om föregående är stängd (inga överlappningar).
    """
    if len(data) < LOOKBACK + exit_days + 1:
        return None

    trades      = []
    i_exit      = -1   # index då pågående position stängs

    for i in range(LOOKBACK, len(data) - exit_days):
        if i <= i_exit:
            continue   # redan i en position

        window_pris = [data[j]["pris"] for j in range(i - LOOKBACK, i)]
        window_vol  = [data[j]["vol"]  for j in range(i - LOOKBACK, i)]
        avg_pris    = sum(window_pris) / LOOKBACK
        avg_vol     = sum(window_vol)  / LOOKBACK
        dag         = data[i]

        if dag["pris"] > avg_pris and dag["vol"] > avg_vol:
            kop_pris  = dag["pris"]
            salj_pris = data[i + exit_days]["pris"]
            avk       = (salj_pris - kop_pris) / kop_pris * 100
            trades.append({"datum": dag["datum"], "avkastning": avk})
            i_exit = i + exit_days

    if not trades:
        return {"antal_trades": 0,
                "period_start": data[LOOKBACK]["datum"].isoformat(),
                "period_slut":  data[-1]["datum"].isoformat()}

    avk_list  = [t["avkastning"] for t in trades]
    vinstrate = sum(1 for a in avk_list if a > 0) / len(avk_list) * 100
    avg_avk   = sum(avk_list) / len(avk_list)

    # Sammansatt avkastning (reinvesterar hela kapitalet per trade)
    kapital = 1.0
    for a in avk_list:
        kapital *= (1 + a / 100)
    total_avk = (kapital - 1) * 100

    # Buy & hold från dag LOOKBACK till sista dag
    buyhold = (data[-1]["pris"] - data[LOOKBACK]["pris"]) / data[LOOKBACK]["pris"] * 100

    # Förenklad Sharpe (utan riskfri ränta)
    sharpe = 0.0
    if len(avk_list) > 1:
        std = statistics.stdev(avk_list)
        if std > 0:
            sharpe = avg_avk / std

    # Max drawdown på hela prisserien
    peak   = data[LOOKBACK]["pris"]
    max_dd = 0.0
    for row in data[LOOKBACK:]:
        if row["pris"] > peak:
            peak = row["pris"]
        dd = (peak - row["pris"]) / peak * 100
        if dd > max_dd:
            max_dd = dd

    return {
        "antal_trades":       len(trades),
        "vinstrate":          round(vinstrate, 1),
        "avg_avkastning":     round(avg_avk, 2),
        "total_avkastning":   round(total_avk, 1),
        "buyhold_avkastning": round(buyhold, 1),
        "sharpe":             round(sharpe, 2),
        "max_drawdown":       round(max_dd, 1),
        "period_start":       data[LOOKBACK]["datum"].isoformat(),
        "period_slut":        data[-1]["datum"].isoformat(),
    }


def spara(symbol: str, strategi: str, res: dict):
    """Upsert ett backtest-resultat till Supabase."""
    row = {
        "symbol":             symbol,
        "strategi":           strategi,
        "period_start":       res["period_start"],
        "period_slut":        res["period_slut"],
        "antal_trades":       res["antal_trades"],
        "vinstrate":          res.get("vinstrate"),
        "avg_avkastning":     res.get("avg_avkastning"),
        "total_avkastning":   res.get("total_avkastning"),
        "buyhold_avkastning": res.get("buyhold_avkastning"),
        "sharpe":             res.get("sharpe"),
        "max_drawdown":       res.get("max_drawdown"),
        "kord":               datetime.now(timezone.utc).isoformat(),
    }
    headers = {
        "apikey":        SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates,return=minimal",
    }
    r = httpx.post(
        f"{SB_URL}/rest/v1/backtest_resultat?on_conflict=symbol,strategi",
        json=row, headers=headers, timeout=15,
    )
    if r.status_code in (200, 201, 204):
        tot = res.get("total_avkastning", 0) or 0
        bh  = res.get("buyhold_avkastning", 0) or 0
        vs  = "✓ BÄTTRE ÄN B&H" if tot > bh else "✗ sämre än B&H"
        print(f"  {strategi:30s}  {res['antal_trades']:3d} trades  "
              f"avg {res.get('avg_avkastning', 0):+.1f}%  "
              f"total {tot:+.0f}% vs B&H {bh:+.0f}%  {vs}")
    else:
        print(f"  ✗ Sparfel: {r.status_code} {r.text[:120]}", file=sys.stderr)


def main():
    print(f"\n=== BACKTEST {datetime.now().strftime('%Y-%m-%d %H:%M')} ===")
    print(f"Signal: pris > {LOOKBACK}d avg  OCH  vol > {LOOKBACK}d avg")
    print(f"Exit-perioder: {EXITS} dagar  |  Historik: {DAYS} dagar\n")

    for symbol, binance_symbol, namn in COINS:
        print(f"── {namn} ({symbol}) ──")
        data = hamta_binance(binance_symbol)
        if not data:
            print("  Ingen data — hoppar")
            continue
        print(f"  {len(data)} dagar  ({data[0]['datum']} → {data[-1]['datum']})")

        for exit_d in EXITS:
            strategi = f"vol{LOOKBACK}+pris{LOOKBACK}_exit{exit_d}d"
            res = backtesta(data, exit_d)
            if not res:
                print(f"  {strategi}: för lite data")
                continue
            if res["antal_trades"] == 0:
                print(f"  {strategi}: inga trades genererades")
                spara(symbol, strategi, res)
                continue
            spara(symbol, strategi, res)

        time.sleep(3)   # respektera CoinGecko rate limit

    print("\n=== KLART ===")


if __name__ == "__main__":
    main()
