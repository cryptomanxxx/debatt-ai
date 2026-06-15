#!/usr/bin/env python3
"""
ARBI Paper Trading — Funding Rate Arbitrage Fund
Kör 3 gånger per dag (00:30, 08:30, 16:30 UTC) via GitHub Actions,
alignat med Binances 8h funding payments (00:00, 08:00, 16:00 UTC).

Strategi: spot-perpetual arbitrage på BTC.
- Positiv funding rate → köp BTC spot + shorta BTC-perp (long_spot_short_perp)
- Negativ funding rate → sälj BTC spot + longa BTC-perp (long_perp_short_spot)
- Rate < 0.001% → neutral (håll kassa, för liten spread)

Fonden är delta-neutral: prisrörelser i BTC påverkar inte NAV,
bara ackumulerade funding fees.
"""
import httpx
import os
import sys
from datetime import datetime, timezone

SB_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SB_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

START_KAP_USD = 10_000.0
POSITION_PCT  = 0.80    # 80% av kapital i arb-positionen, 20% kassa
MIN_RATE_PCT  = 0.001   # minsta meningsfull rate: 0.001% per 8h ≈ 0.44% APR


def _h():
    return {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def hamta_funding_data(symbol="BTCUSDT"):
    """Hämtar aktuell funding rate och mark price från Binance Futures."""
    try:
        r = httpx.get(
            f"https://fapi.binance.com/fapi/v1/premiumIndex?symbol={symbol}",
            timeout=10,
        )
        if not r.is_success:
            print(f"  ⚠️  Binance HTTP {r.status_code}")
            return None
        data = r.json()
        return {
            "funding_rate": float(data.get("lastFundingRate", 0)),
            "mark_price":   float(data.get("markPrice", 0)),
        }
    except Exception as e:
        print(f"  ⚠️  Binance API-fel: {e}")
        return None


def hamta_senaste_nav():
    """Hämtar senaste NAV-snapshot från Supabase."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/arbi_paper_nav?order=skapad.desc&limit=1",
            headers=_h(),
            timeout=10,
        )
        rows = r.json() if r.is_success else []
        return rows[0] if rows else None
    except Exception as e:
        print(f"  ⚠️  Supabase read-fel: {e}")
        return None


def spara_nav(nav_usd, inkomst_usd, position_usd, funding_rate_pct, apr_pct, riktning):
    try:
        r = httpx.post(
            f"{SB_URL}/rest/v1/arbi_paper_nav",
            headers=_h(),
            json={
                "portfölj_värde_usd":   round(nav_usd, 4),
                "inkomst_usd":           round(inkomst_usd, 4),
                "position_storlek_usd":  round(position_usd, 2),
                "funding_rate_pct":      round(funding_rate_pct, 6),
                "apr_pct":               round(apr_pct, 2),
                "symbol":                "BTCUSDT",
                "position_riktning":     riktning,
                "start_kapital_usd":     START_KAP_USD,
            },
            timeout=10,
        )
        return r.is_success
    except Exception as e:
        print(f"  ⚠️  Supabase write-fel: {e}")
        return False


def kör_arbi():
    print("━" * 52)
    print("ARBI Paper Trading — Funding Rate Arbitrage Fund")
    print(f"UTC: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}")
    print("━" * 52)

    # 1. Hämta funding rate från Binance
    fd = hamta_funding_data("BTCUSDT")
    if not fd:
        print("  ⚠️  Hoppade över körningen — Binance otillgänglig")
        return

    funding_rate     = fd["funding_rate"]       # per 8h, t.ex. 0.000312 = 0.0312%
    funding_rate_pct = funding_rate * 100        # i procent

    print(f"  BTC Funding Rate:  {funding_rate_pct:+.4f}% / 8h")
    print(f"  BTC Mark Price:    ${fd['mark_price']:,.2f}")

    # 2. Hämta aktuellt NAV
    senaste     = hamta_senaste_nav()
    current_nav = senaste["portfölj_värde_usd"] if senaste else START_KAP_USD
    accumulated = senaste["inkomst_usd"]         if senaste else 0.0

    position_usd = current_nav * POSITION_PCT

    # 3. Beräkna 8h-inkomst och APR
    if abs(funding_rate_pct) < MIN_RATE_PCT:
        riktning       = "neutral"
        funding_income = 0.0
        apr_pct        = 0.0
        print(f"  Rate för liten ({abs(funding_rate_pct):.4f}% < {MIN_RATE_PCT}%) → neutral position")
    elif funding_rate >= 0:
        riktning       = "long_spot_short_perp"
        funding_income = funding_rate * position_usd
        apr_pct        = funding_rate * 3 * 365 * 100
    else:
        riktning       = "long_perp_short_spot"
        funding_income = abs(funding_rate) * position_usd
        apr_pct        = abs(funding_rate) * 3 * 365 * 100

    new_nav    = current_nav + funding_income
    new_income = accumulated + funding_income

    print(f"  Position:          {riktning}")
    print(f"  Position-storlek:  ${position_usd:,.2f}")
    print(f"  8h inkomst:        ${funding_income:.4f}")
    print(f"  APR (annualiserad):{apr_pct:.2f}%")
    print(f"  Nytt NAV:          ${new_nav:,.4f}  (Δ +${new_nav - START_KAP_USD:.4f})")

    # 4. Spara
    ok = spara_nav(new_nav, new_income, position_usd, funding_rate_pct, apr_pct, riktning)
    print(f"  Supabase:          {'✅ sparat' if ok else '❌ misslyckades'}")


if __name__ == "__main__":
    if not SB_URL or not SB_KEY:
        print("⚠️  NEXT_PUBLIC_SUPABASE_URL eller NEXT_PUBLIC_SUPABASE_ANON_KEY saknas")
        sys.exit(1)
    kör_arbi()
