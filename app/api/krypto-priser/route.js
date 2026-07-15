/**
 * GET /api/krypto-priser
 * Hämtar aktuella kryptovalutapriser från Binance och uppdaterar ohlcv_cache.
 * Körs från Vercel (kan nå Binance, till skillnad från GitHub Actions).
 *
 * Query-params:
 *   ?symboler=BTC,ETH,SOL,XRP,BNB   (standard: alla fem)
 *   ?refresh=true                    (tvinga ny hämtning även om dagsdata finns)
 *
 * Returnerar: { priser: { BTC: 107234.5, ETH: 3821.1, ... }, datum: "2026-05-25", cached: false }
 */

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// ohlcv_cache saknar anon-skrivpolicy (RLS) — service role krävs för att
// cacha priser. Fallback till anon-nyckeln bevaras för miljöer utan
// secreten (routen fungerar ändå, bara utan cache-skrivning).
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

const TILLÅTNA_SYMBOLER = new Set(["BTC", "ETH", "SOL", "XRP", "BNB"]);

const BINANCE = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  XRP: "XRPUSDT",
  BNB: "BNBUSDT",
};

async function hamtaBinancePris(symbol) {
  const ticker = BINANCE[symbol];
  if (!ticker) return null;
  const r = await fetch(
    `https://api.binance.com/api/v3/ticker/price?symbol=${ticker}`,
    { next: { revalidate: 0 } }
  );
  if (!r.ok) return null;
  const data = await r.json();
  return parseFloat(data.price);
}

async function hamtaOhlcvPris(symbol, datum) {
  if (!SB_KEY) return null;
  const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  const r = await fetch(
    `${SB_URL}/rest/v1/ohlcv_cache?symbol=eq.${symbol}&datum=eq.${datum}&select=pris`,
    { headers: h }
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return rows.length ? parseFloat(rows[0].pris) : null;
}

async function sparaPris(symbol, datum, pris) {
  if (!SB_WRITE_KEY) return;
  const h = {
    apikey: SB_WRITE_KEY,
    Authorization: `Bearer ${SB_WRITE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  };
  try {
    const r = await fetch(`${SB_URL}/rest/v1/ohlcv_cache?on_conflict=symbol,datum`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ symbol, datum, pris: Math.round(pris * 100) / 100, vol: 0 }),
    });
    if (!r.ok) console.error(`[krypto-priser] sparaPris ${symbol}: HTTP ${r.status}`);
  } catch (e) {
    console.error(`[krypto-priser] sparaPris ${symbol}:`, e);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbolerParam = searchParams.get("symboler") || "BTC,ETH,SOL,XRP,BNB";
  const symboler = symbolerParam
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(s => TILLÅTNA_SYMBOLER.has(s));

  if (symboler.length === 0) {
    return Response.json({ error: "Inga giltiga symboler. Tillåtna: BTC,ETH,SOL,XRP,BNB" }, { status: 400 });
  }
  const refresh = searchParams.get("refresh") === "true";

  const idag = new Date().toISOString().slice(0, 10);
  const priser = {};
  const status = {};

  await Promise.all(symboler.map(async (sym) => {
    if (!refresh) {
      const cached = await hamtaOhlcvPris(sym, idag);
      if (cached) {
        priser[sym] = cached;
        status[sym] = "cache";
        return;
      }
    }

    const live = await hamtaBinancePris(sym);
    if (live) {
      priser[sym] = live;
      status[sym] = "binance";
      await sparaPris(sym, idag, live);
      return;
    }

    // Ingen live-data — hämta senaste tillgängliga från ohlcv_cache
    const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
    const r = await fetch(
      `${SB_URL}/rest/v1/ohlcv_cache?symbol=eq.${sym}&order=datum.desc&limit=1&select=pris,datum`,
      { headers: h }
    );
    if (r.ok) {
      const rows = await r.json();
      if (rows.length) {
        priser[sym] = parseFloat(rows[0].pris);
        status[sym] = `ohlcv:${rows[0].datum}`;
      }
    }
  }));

  if (Object.keys(priser).length === 0) {
    return Response.json(
      { error: "Inga priser tillgängliga — varken Binance eller ohlcv_cache svarade", datum: idag },
      { status: 503 }
    );
  }

  return Response.json({ priser, datum: idag, status });
}
