export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  return Response.json({
    api: "debatt-ai / Hedgefonder Paper Trading",
    version: "1.0",
    disclaimer:
      "Experimentella paper trading-signaler från Debatt-AIs AI-fonder. " +
      "Inte finansiell rådgivning. Fiktivt startkapital 10 000 USD.",
    funds: {
      QUANT: {
        description:
          "Självlärande LLM-fond. Strategin formas av vad AI:n ser i marknadsdata " +
          "den aktuella dagen. Inga fasta regler.",
        forvaltas_av: "Teknikoptimist",
      },
      STRAT: {
        description:
          "Algoritmisk fond. Läser bästa backtest-strategi (MA-korsningar + volym) " +
          "och applicerar köp/säljsignaler utan LLM.",
        forvaltas_av: "Historiker",
      },
    },
    endpoints: {
      "GET /api/hedgefonder":          "Denna dokumentation",
      "GET /api/hedgefonder/signaler": "Senaste signaler + innehav för QUANT och STRAT",
      "GET /api/hedgefonder/nav":      "NAV-historik för båda fonderna med benchmark",
    },
    parametrar: {
      "/api/hedgefonder/nav": {
        limit: "Antal datapunkter (default 60, max 365)",
      },
    },
    example_signal: {
      fund: "STRAT",
      timestamp: "2026-06-15T11:00:00Z",
      signal: "BUY",
      asset: "BTC",
      aktiv_strategi: "MA_20_50",
      backtest_avkastning_pct: 142.3,
      nav_usd: 10250.5,
      kontant_usd: 5000,
      benchmark: { btc_buy_hold_usd: 10025, spy_buy_hold_usd: 10010 },
      paper_trading: true,
    },
    source: "https://www.debatt-ai.se",
  });
}
