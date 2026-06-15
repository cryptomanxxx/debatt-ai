export const runtime = 'edge';
export const revalidate = 0;

// Gate.io: öppen API, blockerar inte datacenter/cloud-IPs
// Binance (451) och Bybit (403) blockerar GitHub Actions och Vercel.

export async function GET() {
  try {
    const [histRes, tickRes] = await Promise.all([
      fetch(
        "https://api.gateio.ws/api/v4/futures/usdt/funding_rate?contract=BTC_USDT&limit=1",
        { cache: "no-store" }
      ),
      fetch(
        "https://api.gateio.ws/api/v4/futures/usdt/tickers?contract=BTC_USDT",
        { cache: "no-store" }
      ),
    ]);

    if (!histRes.ok || !tickRes.ok) {
      return Response.json(
        { error: `Gate.io HTTP ${histRes.status}/${tickRes.status}` },
        { status: 502 }
      );
    }

    const hist    = await histRes.json();
    const tickers = await tickRes.json();

    if (!hist.length) {
      return Response.json({ error: "No funding history from Gate.io" }, { status: 502 });
    }

    return Response.json({
      symbol: "BTCUSDT",
      funding_rate: parseFloat(hist[0].r ?? 0),           // decimalt, t.ex. 0.0001
      mark_price:   parseFloat(tickers[0]?.mark_price ?? 0),
      source: "gateio",
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
