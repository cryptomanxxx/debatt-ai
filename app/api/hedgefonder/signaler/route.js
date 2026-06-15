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

export async function GET() {
  const [
    stratNavRows,
    stratInnehav,
    quantNavRows,
    quantInnehav,
  ] = await Promise.all([
    fetchJson(`${BASE}/rest/v1/strat_paper_nav?select=*&order=skapad.desc&limit=1`),
    fetchJson(`${BASE}/rest/v1/strat_paper_innehav?select=*`),
    fetchJson(`${BASE}/rest/v1/quant_paper_nav?select=*&order=skapad.desc&limit=1`),
    fetchJson(`${BASE}/rest/v1/quant_paper_innehav?select=*`),
  ]);

  const stratNav  = stratNavRows?.[0]  ?? null;
  const quantNav  = quantNavRows?.[0]  ?? null;

  function buildBenchmark(nav) {
    if (!nav) return null;
    return {
      btc_buy_hold_usd: nav.btc_benchmark_usd ?? null,
      spy_buy_hold_usd: nav.spy_benchmark_usd ?? null,
    };
  }

  const strat = stratNav
    ? {
        fund: "STRAT",
        timestamp: stratNav.skapad,
        signal: stratNav.signal ?? null,
        asset: stratNav.aktiv_symbol ?? null,
        aktiv_strategi: stratNav.aktiv_strategi ?? null,
        backtest_avkastning_pct: stratNav.backtest_avk_pct ?? null,
        nav_usd: stratNav.portfölj_värde_usd ?? null,
        kontant_usd: stratNav.kontant_usd ?? null,
        benchmark: buildBenchmark(stratNav),
        innehav: (stratInnehav ?? []).map((r) => ({
          symbol: r.symbol,
          antal: r.antal,
          kopt_pris_usd: r.kopt_pris_usd,
          entry_datum: r.entry_datum ?? null,
        })),
        paper_trading: true,
      }
    : null;

  const quant = quantNav
    ? {
        fund: "QUANT",
        timestamp: quantNav.skapad,
        signal: null,
        asset: null,
        llm_motivering: quantNav.quant_motivering ?? null,
        nav_usd: quantNav.portfölj_värde_usd ?? null,
        kontant_usd: quantNav.kontant_usd ?? null,
        benchmark: buildBenchmark(quantNav),
        innehav: (quantInnehav ?? []).map((r) => ({
          symbol: r.symbol,
          antal: r.antal,
          kopt_pris_usd: r.kopt_pris_usd,
        })),
        paper_trading: true,
      }
    : null;

  return Response.json({
    generated_at: new Date().toISOString(),
    disclaimer:
      "Experimentella paper trading-signaler. Inte finansiell rådgivning. " +
      "Fiktivt startkapital 10 000 USD.",
    funds: {
      STRAT: strat,
      QUANT: quant,
    },
  });
}
