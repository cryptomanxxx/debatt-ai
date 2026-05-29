import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const VANECK_URL = "https://www.vaneck.com/us/en/investments/bnb-etf-vbnb/overview/";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

function sbHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// ── Hämtar BNB-pris från Supabase ohlcv_cache ─────────────────────────────────
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
  return null;
}

// ── Parsar VanEck-sidan ────────────────────────────────────────────────────────
async function hamtaVaneckData() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "no-cache",
  };

  const r = await fetch(VANECK_URL, { headers, signal: AbortSignal.timeout(20000) });

  if (!r.ok) throw new Error(`VanEck HTTP ${r.status}`);
  const text = await r.text();

  const result = {
    bnb_in_trust: null,
    aum_usd: null,
    nav_per_share: null,
    shares_outstanding: null,
    datakalla: "vaneck",
    raw_log: [],
  };

  // 1. Next.js __NEXT_DATA__ embedded JSON
  const nextDataMatch = text.match(/<script id="__NEXT_DATA__"[^>]*>(\{[\s\S]*?\})<\/script>/);
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      const found = sokIJson(nd, [
        "bnbInTrust", "coinsInTrust", "totalHoldings", "cryptoInTrust",
        "netAssets", "totalNetAssets", "aum", "totalAssets",
        "navPerShare", "nav", "navPrice",
        "sharesOutstanding", "sharesIssued",
      ]);
      for (const [key, val] of Object.entries(found)) {
        result.raw_log.push(`__NEXT_DATA__[${key}] = ${val}`);
        if (!result.bnb_in_trust && /trust|holdings/i.test(key)) result.bnb_in_trust = parseFloat(val);
        if (!result.aum_usd && /netAssets|aum|totalAssets/i.test(key)) result.aum_usd = parseFloat(val);
        if (!result.nav_per_share && /nav/i.test(key)) result.nav_per_share = parseFloat(val);
        if (!result.shares_outstanding && /shares/i.test(key)) result.shares_outstanding = parseInt(val);
      }
    } catch {}
  }

  // 2. Inline <script type="application/json"> block
  const jsonScripts = [...text.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of jsonScripts) {
    try {
      const data = JSON.parse(m[1]);
      const found = sokIJson(data, ["bnbInTrust", "coinsInTrust", "netAssets", "navPerShare"]);
      for (const [key, val] of Object.entries(found)) {
        result.raw_log.push(`JSON-script[${key}] = ${val}`);
        if (!result.bnb_in_trust && /trust|holdings/i.test(key)) result.bnb_in_trust = parseFloat(val);
        if (!result.aum_usd && /netAssets|aum/i.test(key)) result.aum_usd = parseFloat(val);
        if (!result.nav_per_share && /nav/i.test(key)) result.nav_per_share = parseFloat(val);
      }
    } catch {}
  }

  // 3. Regex-mönster i HTML-texten
  const patterns = [
    { key: "bnb_in_trust",    re: /BNB\s+in\s+Trust[^0-9]*([0-9][0-9,\.]+)/i },
    { key: "bnb_in_trust",    re: /[Cc]oins?\s+in\s+[Tt]rust[^0-9]*([0-9][0-9,\.]+)/ },
    { key: "bnb_in_trust",    re: /"coinsInTrust"\s*:\s*"?([0-9,\.]+)"?/ },
    { key: "aum_usd",         re: /AUM[^0-9$]*\$?\s*([0-9][0-9,\.]+)\s*(M|B|million|billion)?/i },
    { key: "aum_usd",         re: /Net\s+Assets[^0-9$]*\$?\s*([0-9][0-9,\.]+)\s*(M|B|million|billion)?/i },
    { key: "aum_usd",         re: /"netAssets"\s*:\s*"?([0-9,\.]+)"?/ },
    { key: "nav_per_share",   re: /NAV[^0-9$]*\$\s*([0-9][0-9,\.]+)/i },
    { key: "nav_per_share",   re: /"navPerShare"\s*:\s*"?([0-9,\.]+)"?/ },
    { key: "shares_outstanding", re: /Shares\s+Outstanding[^0-9]*([0-9][0-9,]+)/i },
  ];

  for (const { key, re } of patterns) {
    if (result[key] !== null) continue;
    const m = text.match(re);
    if (!m) continue;
    let val = parseFloat(m[1].replace(/,/g, ""));
    // Multiplicera om M/B suffix
    const suffix = m[2]?.toLowerCase();
    if (suffix === "m" || suffix === "million") val *= 1_000_000;
    if (suffix === "b" || suffix === "billion") val *= 1_000_000_000;
    if (!isNaN(val) && val > 0) {
      result[key] = val;
      result.raw_log.push(`regex[${key}] = ${val} (pattern: ${re.source.slice(0,40)})`);
    }
  }

  return result;
}

// ── Rekursiv JSON-nyckelssökning ───────────────────────────────────────────────
function sokIJson(obj, keys, depth = 0) {
  if (depth > 12 || typeof obj !== "object" || obj === null) return {};
  const result = {};
  if (Array.isArray(obj)) {
    for (const item of obj) Object.assign(result, sokIJson(item, keys, depth + 1));
  } else {
    for (const [k, v] of Object.entries(obj)) {
      if (keys.some(target => k.toLowerCase() === target.toLowerCase()) && typeof v !== "object") {
        result[k] = v;
      }
      Object.assign(result, sokIJson(v, keys, depth + 1));
    }
  }
  return result;
}

// ── Spara till Supabase ────────────────────────────────────────────────────────
async function sparaVbnbData(row) {
  const r = await fetch(`${SB_URL}/rest/v1/vbnb_data`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`Supabase upsert ${r.status}: ${await r.text()}`);
}

// ── POST /api/admin/vbnb-fetch ─────────────────────────────────────────────────
export async function POST(req) {
  // Auth-check
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (token !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
  }

  const datum = new Date().toISOString().slice(0, 10);
  const log = [`Datum: ${datum}`];
  let vaneckData = {};
  let bnbPris = null;

  // 1. Hämta BNB-pris
  bnbPris = await hamtaBnbPris();
  log.push(`BNB-pris: ${bnbPris ? `$${bnbPris.toFixed(2)}` : "saknas"}`);

  // 2. Hämta VanEck-data
  try {
    vaneckData = await hamtaVaneckData();
    log.push(`VanEck fetch OK`);
    log.push(...(vaneckData.raw_log || []));
  } catch (e) {
    log.push(`VanEck fel: ${e.message}`);
  }

  // 3. Beräkna BNB in Trust om det saknas men vi har AUM + BNB-pris
  let bnbInTrust = vaneckData.bnb_in_trust ?? null;
  let datakalla = vaneckData.datakalla ?? "vaneck";

  if (!bnbInTrust && vaneckData.aum_usd && bnbPris && bnbPris > 0) {
    bnbInTrust = vaneckData.aum_usd / bnbPris;
    datakalla = "beraknad";
    log.push(`Beräknad BNB in Trust: ${bnbInTrust.toFixed(2)}`);
  }

  const row = {
    datum,
    bnb_in_trust:       bnbInTrust ? Math.round(bnbInTrust * 10000) / 10000 : null,
    aum_usd:            vaneckData.aum_usd ? Math.round(vaneckData.aum_usd) : null,
    nav_per_share:      vaneckData.nav_per_share ?? null,
    bnb_price_usd:      bnbPris ?? null,
    shares_outstanding: vaneckData.shares_outstanding ?? null,
    datakalla,
  };

  log.push(`Rad: ${JSON.stringify(row)}`);

  if (!row.nav_per_share && !row.bnb_price_usd && !row.bnb_in_trust) {
    return NextResponse.json({ error: "Ingen data hämtad", log }, { status: 502 });
  }

  try {
    await sparaVbnbData(row);
    log.push("✓ Sparad till Supabase");
  } catch (e) {
    return NextResponse.json({ error: e.message, log }, { status: 500 });
  }

  const status = bnbInTrust
    ? `BNB in Trust: ${bnbInTrust.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} (${bnbInTrust >= 10000 ? "ÖVER" : "UNDER"} 10 000)`
    : "BNB in Trust: saknas (parsning misslyckades)";

  return NextResponse.json({ ok: true, datum, row, status, log });
}
