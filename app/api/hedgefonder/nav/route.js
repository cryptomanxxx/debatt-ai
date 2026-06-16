export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function headers() {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  };
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "60", 10), 365);

  const [stratRows, quantRows, arbiRows] = await Promise.all([
    fetchJson(
      `${BASE}/rest/v1/strat_paper_nav?select=skapad,portfölj_värde_usd,kontant_usd,btc_benchmark_usd,spy_benchmark_usd,aktiv_strategi,signal&order=skapad.desc&limit=${limit}`
    ),
    fetchJson(
      `${BASE}/rest/v1/quant_paper_nav?select=skapad,portfölj_värde_usd,kontant_usd,btc_benchmark_usd,spy_benchmark_usd,quant_motivering&order=skapad.desc&limit=${limit}`
    ),
    fetchJson(
      `${BASE}/rest/v1/arbi_paper_nav?select=skapad,portfölj_värde_usd,inkomst_usd,position_storlek_usd,funding_rate_pct,apr_pct,position_riktning,btc_benchmark_usd&order=skapad.desc&limit=${limit}`
    ),
  ]);

  function mapStrat(rows) {
    return (rows ?? []).reverse().map((r) => ({
      timestamp: r.skapad,
      nav_usd: r.portfölj_värde_usd,
      kontant_usd: r.kontant_usd,
      benchmark: {
        btc_buy_hold_usd: r.btc_benchmark_usd,
        spy_buy_hold_usd: r.spy_benchmark_usd,
      },
      aktiv_strategi: r.aktiv_strategi ?? null,
      signal: r.signal ?? null,
    }));
  }

  function mapQuant(rows) {
    return (rows ?? []).reverse().map((r) => ({
      timestamp: r.skapad,
      nav_usd: r.portfölj_värde_usd,
      kontant_usd: r.kontant_usd,
      benchmark: {
        btc_buy_hold_usd: r.btc_benchmark_usd,
        spy_buy_hold_usd: r.spy_benchmark_usd,
      },
      llm_motivering: r.quant_motivering ?? null,
    }));
  }

  function mapArbi(rows) {
    return (rows ?? []).reverse().map((r) => ({
      timestamp: r.skapad,
      nav_usd: r.portfölj_värde_usd,
      inkomst_usd: r.inkomst_usd,
      position_storlek_usd: r.position_storlek_usd,
      funding_rate_pct: r.funding_rate_pct,
      apr_pct: r.apr_pct,
      position_riktning: r.position_riktning,
      benchmark: {
        btc_buy_hold_usd: r.btc_benchmark_usd ?? null,
      },
    }));
  }

  const stratData = mapStrat(stratRows);
  const quantData = mapQuant(quantRows);
  const arbiData  = mapArbi(arbiRows);

  function latest(arr) {
    return arr.length ? arr[arr.length - 1] : null;
  }

  return Response.json({
    generated_at: new Date().toISOString(),
    disclaimer:
      "Experimentella paper trading-signaler. Inte finansiell rådgivning. " +
      "Fiktivt startkapital 10 000 USD.",
    params: { limit },
    funds: {
      STRAT: {
        latest_nav: latest(stratData),
        data_points: stratData.length,
        history: stratData,
      },
      QUANT: {
        latest_nav: latest(quantData),
        data_points: quantData.length,
        history: quantData,
      },
      ARBI: {
        latest_nav: latest(arbiData),
        data_points: arbiData.length,
        history: arbiData,
      },
    },
  });
}
