export const revalidate = 0;

export async function GET() {
  try {
    const [histRes, tickRes] = await Promise.all([
      fetch(
        "https://api.bybit.com/v5/market/funding/history?category=linear&symbol=BTCUSDT&limit=1",
        { cache: "no-store" }
      ),
      fetch(
        "https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT",
        { cache: "no-store" }
      ),
    ]);

    if (!histRes.ok || !tickRes.ok) {
      return Response.json(
        { error: `Bybit HTTP ${histRes.status}/${tickRes.status}` },
        { status: 502 }
      );
    }

    const histData = await histRes.json();
    const tickData = await tickRes.json();
    const histList = histData?.result?.list ?? [];
    const tickList = tickData?.result?.list ?? [];

    if (!histList.length) {
      return Response.json({ error: "No funding history from Bybit" }, { status: 502 });
    }

    return Response.json({
      symbol: "BTCUSDT",
      funding_rate: parseFloat(histList[0].fundingRate ?? 0),
      mark_price: parseFloat(tickList[0]?.markPrice ?? 0),
      source: "bybit",
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
