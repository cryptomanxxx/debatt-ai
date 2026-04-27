#!/usr/bin/env python3
"""
backtest.py – Parameteroptimering av volym+pris-momentumstrategi.

Signal:  Köp när pris > lookback-dagars avg OCH vol > (threshold × lookback-dagars avg).
Exit:    Stop-loss vid X% nedgång, annars sälj efter M dagar.
Extras:  Transaktionskostnad (TC) per trade, BTC-regimfilter.

Parameterrutnät:
  exit_days      : 1, 3, 7
  vol_threshold  : 1.0, 1.5, 2.0  (multiplikator på volymgenomsnittet)
  lookback       : 5, 10, 20
  stoploss_pct   : None, 5.0
  tc_pct         : 0.0, 0.1       (% per trade, tur och retur = 2 ×)
  regime_filter  : False, True    (handla bara när BTC > eget lookback-avg)

Totalt: 3×3×3×2×2×2 = 216 kombinationer per mynt × 5 mynt = 1 080 rader

Datakälla: Yahoo Finance (yfinance)
Resultat:  Supabase backtest_resultat
"""

import httpx
import os
import sys
import time
import statistics
from datetime import datetime, timezone
from itertools import product

import yfinance as yf

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

if not SB_KEY:
    print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

COINS = [
    ("BTC", "BTC-USD", "Bitcoin"),
    ("ETH", "ETH-USD", "Ethereum"),
    ("SOL", "SOL-USD", "Solana"),
    ("XRP", "XRP-USD", "XRP"),
    ("BNB", "BNB-USD", "BNB"),
]
DAYS = 730

EXITS          = [1, 3, 7]
VOL_THRESHOLDS = [1.0, 1.5, 2.0]
LOOKBACKS      = [5, 10, 20]
STOP_LOSSES    = [None, 5.0]
TRANS_COSTS    = [0.0, 0.1]
REGIME_FILTERS = [False, True]

PARAM_GRID = list(product(EXITS, VOL_THRESHOLDS, LOOKBACKS,
                          STOP_LOSSES, TRANS_COSTS, REGIME_FILTERS))


def hamta_yahoo(ticker: str) -> list[dict]:
    """Hämtar daglig OHLCV-data från Yahoo Finance."""
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
                result.append({"datum": datum.date(), "pris": close, "vol": vol})
        return sorted(result, key=lambda x: x["datum"])
    except Exception as e:
        print(f"  Yahoo fel ({ticker}): {e}", file=sys.stderr)
        return []


def strategi_id(exit_days, vol_threshold, lookback, stoploss, tc, regime):
    sl = f"sl{int(stoploss)}" if stoploss else "sl0"
    tc_s = f"tc{str(tc).replace('.', '')}"
    rf = "rf1" if regime else "rf0"
    vt = str(vol_threshold).replace(".", "")
    return f"l{lookback}_v{vt}x_e{exit_days}d_{sl}_{tc_s}_{rf}"


def backtesta(data, btc_uptrend, exit_days, vol_threshold,
              lookback, stoploss_pct, tc_pct, regime_filter):
    """Simulerar strategin. Returnerar dict med statistik eller None."""
    if len(data) < lookback + exit_days + 1:
        return None

    trades = []
    i_exit = -1

    for i in range(lookback, len(data) - exit_days):
        if i <= i_exit:
            continue

        dag = data[i]

        # Regimfilter: handla bara om BTC är i upptrend
        if regime_filter:
            trend = btc_uptrend.get(dag["datum"])
            if trend is False:
                continue

        window_pris = [data[j]["pris"] for j in range(i - lookback, i)]
        window_vol  = [data[j]["vol"]  for j in range(i - lookback, i)]
        avg_pris    = sum(window_pris) / lookback
        avg_vol     = sum(window_vol)  / lookback

        if dag["pris"] > avg_pris and dag["vol"] > vol_threshold * avg_vol:
            kop_pris  = dag["pris"] * (1 + tc_pct / 100)
            salj_idx  = i + exit_days
            salj_pris = None

            # Stop-loss: kolla varje dag fram till exit
            if stoploss_pct:
                sl_trigger = dag["pris"] * (1 - stoploss_pct / 100)
                for j in range(i + 1, min(i + exit_days + 1, len(data))):
                    if data[j]["pris"] <= sl_trigger:
                        salj_pris = data[j]["pris"] * (1 - tc_pct / 100)
                        salj_idx  = j
                        break

            if salj_pris is None:
                salj_idx  = min(i + exit_days, len(data) - 1)
                salj_pris = data[salj_idx]["pris"] * (1 - tc_pct / 100)

            avk = (salj_pris - kop_pris) / kop_pris * 100
            trades.append(avk)
            i_exit = salj_idx

    period_start = data[lookback]["datum"].isoformat()
    period_slut  = data[-1]["datum"].isoformat()

    if not trades:
        return {"antal_trades": 0, "period_start": period_start,
                "period_slut": period_slut}

    vinstrate = sum(1 for a in trades if a > 0) / len(trades) * 100
    avg_avk   = sum(trades) / len(trades)

    kapital = 1.0
    for a in trades:
        kapital *= (1 + a / 100)
    total_avk = (kapital - 1) * 100

    # Buy & hold (med TC en gång in + en gång ut)
    bh_brutto = (data[-1]["pris"] - data[lookback]["pris"]) / data[lookback]["pris"] * 100
    buyhold   = bh_brutto - 2 * tc_pct

    sharpe = 0.0
    if len(trades) > 1:
        std = statistics.stdev(trades)
        if std > 0:
            sharpe = avg_avk / std

    peak   = data[lookback]["pris"]
    max_dd = 0.0
    for row in data[lookback:]:
        if row["pris"] > peak:
            peak = row["pris"]
        dd = (peak - row["pris"]) / peak * 100
        if dd > max_dd:
            max_dd = dd

    wins   = [a for a in trades if a > 0]
    losses = [abs(a) for a in trades if a < 0]
    kelly  = 0.0
    if wins and losses:
        avg_win  = sum(wins) / len(wins)
        avg_loss = sum(losses) / len(losses)
        b = avg_win / avg_loss
        p = vinstrate / 100
        kelly = max(0.0, (b * p - (1 - p)) / b * 100)

    return {
        "antal_trades":       len(trades),
        "vinstrate":          round(vinstrate, 1),
        "avg_avkastning":     round(avg_avk, 2),
        "total_avkastning":   round(total_avk, 1),
        "buyhold_avkastning": round(buyhold, 1),
        "sharpe":             round(sharpe, 2),
        "max_drawdown":       round(max_dd, 1),
        "kelly_fraction":     round(kelly, 1),
        "period_start":       period_start,
        "period_slut":        period_slut,
    }


def spara(symbol, strategi, res, vol_threshold, lookback,
          stoploss_pct, tc_pct, regime_filter):
    row = {
        "symbol":                  symbol,
        "strategi":                strategi,
        "period_start":            res["period_start"],
        "period_slut":             res["period_slut"],
        "antal_trades":            res["antal_trades"],
        "vinstrate":               res.get("vinstrate"),
        "avg_avkastning":          res.get("avg_avkastning"),
        "total_avkastning":        res.get("total_avkastning"),
        "buyhold_avkastning":      res.get("buyhold_avkastning"),
        "sharpe":                  res.get("sharpe"),
        "max_drawdown":            res.get("max_drawdown"),
        "kelly_fraction":          res.get("kelly_fraction"),
        "vol_multiplikator":       vol_threshold,
        "lookback":                lookback,
        "stoploss_pct":            stoploss_pct,
        "transaktionskostnad_pct": tc_pct,
        "regim_filter":            regime_filter,
        "kord":                    datetime.now(timezone.utc).isoformat(),
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
    if r.status_code not in (200, 201, 204):
        print(f"    ✗ Sparfel: {r.status_code} {r.text[:80]}", file=sys.stderr)


def main():
    print(f"\n=== BACKTEST {datetime.now().strftime('%Y-%m-%d %H:%M')} ===")
    print(f"{len(PARAM_GRID)} kombinationer × {len(COINS)} mynt = "
          f"{len(PARAM_GRID) * len(COINS)} totalt\n")

    # BTC-data för regimfilter
    print("Hämtar BTC-data för regimfilter…")
    btc_raw = hamta_yahoo("BTC-USD")
    btc_by_date = {r["datum"]: r["pris"] for r in btc_raw}

    # Förberäkna BTC-upptrend per (datum, lookback) — görs inline per lookback
    def btc_uptrend_for(lb):
        dates = sorted(btc_by_date.keys())
        result = {}
        for i in range(lb, len(dates)):
            window = [btc_by_date[dates[j]] for j in range(i - lb, i)]
            avg = sum(window) / lb
            result[dates[i]] = btc_by_date[dates[i]] > avg
        return result

    btc_trends = {lb: btc_uptrend_for(lb) for lb in LOOKBACKS}

    for symbol, ticker, namn in COINS:
        print(f"\n── {namn} ({symbol}) ──")
        data = btc_raw if symbol == "BTC" else hamta_yahoo(ticker)
        if not data:
            print("  Ingen data — hoppar")
            continue
        print(f"  {len(data)} dagar ({data[0]['datum']} → {data[-1]['datum']})")
        print(f"  Kör {len(PARAM_GRID)} kombinationer…")

        basta_alpha    = float("-inf")
        basta_strategi = ""
        sparade        = 0

        for exit_d, vol_t, lb, sl, tc, rf in PARAM_GRID:
            sid      = strategi_id(exit_d, vol_t, lb, sl, tc, rf)
            uptrend  = btc_trends[lb] if rf else {}
            res      = backtesta(data, uptrend, exit_d, vol_t, lb, sl, tc, rf)
            if res is None:
                continue
            spara(symbol, sid, res, vol_t, lb, sl, tc, rf)
            sparade += 1

            tot   = res.get("total_avkastning") or 0
            bh    = res.get("buyhold_avkastning") or 0
            alpha = tot - bh
            if alpha > basta_alpha and res["antal_trades"] > 0:
                basta_alpha    = alpha
                basta_strategi = sid

        print(f"  ✓ {sparade} sparade — "
              f"bästa alpha: {basta_strategi} ({basta_alpha:+.0f}pp vs B&H)")

        if symbol != "BTC":
            time.sleep(2)

    print("\n=== KLART ===")


if __name__ == "__main__":
    main()
