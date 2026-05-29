import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

function sbHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// ── BNB-pris från Supabase ohlcv_cache ────────────────────────────────────────
async function hamtaBnbPris() {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/ohlcv_cache?select=pris&symbol=eq.BNB&order=datum.desc&limit=1`,
      { headers: sbHeaders() }
    );
    if (r.ok) {
      const rows = await r.json();
      if (rows?.[0]?.pris) return parseFloat(rows[0].pris);
    }
  } catch {}
  // Fallback: Yahoo Finance för BNB-USD live-pris
  try {
    const r = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/BNB-USD?interval=1d&range=2d",
      { headers: YF_HEADERS, signal: AbortSignal.timeout(10000) }
    );
    if (r.ok) {
      const d = await r.json();
      const closes = d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      const pris = closes?.filter(Boolean).at(-1);
      if (pris) return pris;
    }
  } catch {}
  return null;
}

// ── VBNB via Yahoo Finance quoteSummary ────────────────────────────────────────
async function hamtaYahooData(log) {
  const result = { nav_per_share: null, aum_usd: null, shares_outstanding: null };

  // Endpoint 1: quoteSummary med defaultKeyStatistics + summaryDetail
  try {
    const r = await fetch(
      "https://query1.finance.yahoo.com/v10/finance/quoteSummary/VBNB?modules=defaultKeyStatistics,summaryDetail,price",
      { headers: YF_HEADERS, signal: AbortSignal.timeout(12000) }
    );
    if (r.ok) {
      const d = await r.json();
      const ks  = d?.quoteSummary?.result?.[0]?.defaultKeyStatistics;
      const sd  = d?.quoteSummary?.result?.[0]?.summaryDetail;
      const pr  = d?.quoteSummary?.result?.[0]?.price;

      result.shares_outstanding = ks?.sharesOutstanding?.raw ?? null;
      result.aum_usd            = ks?.totalAssets?.raw ?? sd?.totalAssets?.raw ?? null;
      result.nav_per_share      = pr?.navPrice?.raw ?? pr?.regularMarketPrice?.raw ?? ks?.navPrice?.raw ?? null;

      log.push(`YF quoteSummary: nav=${result.nav_per_share}, aum=${result.aum_usd}, shares=${result.shares_outstanding}`);
    } else {
      log.push(`YF quoteSummary HTTP ${r.status}`);
    }
  } catch (e) {
    log.push(`YF quoteSummary fel: ${e.message}`);
  }

  // Endpoint 2: chart för pris/stängningskurs om NAV saknas
  if (!result.nav_per_share) {
    try {
      const r = await fetch(
        "https://query1.finance.yahoo.com/v8/finance/chart/VBNB?interval=1d&range=5d",
        { headers: YF_HEADERS, signal: AbortSignal.timeout(10000) }
      );
      if (r.ok) {
        const d = await r.json();
        const meta   = d?.chart?.result?.[0]?.meta;
        const closes = d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        result.nav_per_share = closes?.filter(Boolean).at(-1) ?? meta?.regularMarketPrice ?? null;
        if (!result.aum_usd) result.aum_usd = meta?.regularMarketVolume ? null : null;
        log.push(`YF chart: nav=${result.nav_per_share}`);
      }
    } catch (e) {
      log.push(`YF chart fel: ${e.message}`);
    }
  }

  return result;
}

// ── Spara till Supabase ────────────────────────────────────────────────────────
async function sparaVbnbData(row) {
  // INSERT first; if datum-constraint fires (409), fall back to PATCH (UPDATE)
  const ins = await fetch(`${SB_URL}/rest/v1/vbnb_data`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
  if (ins.ok) return;

  if (ins.status === 409) {
    const upd = await fetch(
      `${SB_URL}/rest/v1/vbnb_data?datum=eq.${row.datum}`,
      {
        method: "PATCH",
        headers: { ...sbHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify(row),
      }
    );
    if (!upd.ok) throw new Error(`Supabase update ${upd.status}: ${await upd.text()}`);
    return;
  }

  throw new Error(`Supabase insert ${ins.status}: ${await ins.text()}`);
}

// ── POST /api/admin/vbnb-fetch ─────────────────────────────────────────────────
export async function POST(req) {
  const auth = req.headers.get("authorization") || "";
  if (auth.replace("Bearer ", "") !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
  }

  const datum = new Date().toISOString().slice(0, 10);
  const log = [`Datum: ${datum}`];

  // 1. BNB-pris
  const bnbPris = await hamtaBnbPris();
  log.push(`BNB-pris: ${bnbPris ? `$${bnbPris.toFixed(2)}` : "saknas"}`);

  // 2. VBNB-data från Yahoo Finance
  const yfData = await hamtaYahooData(log);

  // 3. BNB in Trust = AUM / BNB-pris (om båda finns)
  let bnbInTrust = null;
  let datakalla = "yfinance";

  if (yfData.aum_usd && bnbPris && bnbPris > 0) {
    bnbInTrust = yfData.aum_usd / bnbPris;
    datakalla = "beraknad";
    log.push(`Beräknad BNB in Trust: ${bnbInTrust.toFixed(0)} (${yfData.aum_usd.toFixed(0)} / ${bnbPris.toFixed(2)})`);
  } else if (yfData.shares_outstanding && yfData.nav_per_share && bnbPris && bnbPris > 0) {
    // Alternativ: shares × (NAV/BNB-pris) = total BNB
    bnbInTrust = yfData.shares_outstanding * (yfData.nav_per_share / bnbPris);
    datakalla = "beraknad";
    log.push(`Beräknad BNB in Trust: ${bnbInTrust.toFixed(0)} (aktier × NAV/BNB-pris)`);
  } else {
    log.push("BNB in Trust: kan inte beräknas (AUM och shares_outstanding saknas)");
  }

  const row = {
    datum,
    bnb_in_trust:       bnbInTrust ? Math.round(bnbInTrust * 100) / 100 : null,
    aum_usd:            yfData.aum_usd ? Math.round(yfData.aum_usd) : null,
    nav_per_share:      yfData.nav_per_share ? Math.round(yfData.nav_per_share * 10000) / 10000 : null,
    bnb_price_usd:      bnbPris ? Math.round(bnbPris * 10000) / 10000 : null,
    shares_outstanding: yfData.shares_outstanding ?? null,
    datakalla,
  };

  log.push(`Rad: ${JSON.stringify(row)}`);

  if (!row.nav_per_share && !row.bnb_price_usd) {
    return NextResponse.json({ error: "Ingen användbar data", log }, { status: 502 });
  }

  try {
    await sparaVbnbData(row);
    log.push("✓ Sparad till Supabase");
  } catch (e) {
    return NextResponse.json({ error: e.message, log }, { status: 500 });
  }

  const status = bnbInTrust
    ? `BNB in Trust: ${Math.round(bnbInTrust).toLocaleString("sv-SE")} (${bnbInTrust >= 10000 ? "ÖVER" : "UNDER"} 10 000-gränsen)`
    : "BNB in Trust: saknas — yfinance har inte totalAssets för VBNB ännu";

  return NextResponse.json({ ok: true, datum, row, status, log });
}
