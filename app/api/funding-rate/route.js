export const revalidate = 0;

export async function GET() {
  try {
    const [histRes, idxRes] = await Promise.all([
      fetch(
        "https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1",
        { cache: "no-store" }
      ),
      fetch(
        "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT",
        { cache: "no-store" }
      ),
    ]);

    if (!histRes.ok || !idxRes.ok) {
      return Response.json(
        { error: `Binance HTTP ${histRes.status}/${idxRes.status}` },
        { status: 502 }
      );
    }

    const hist = await histRes.json();
    const idx  = await idxRes.json();

    if (!hist.length) {
      return Response.json({ error: "No funding history from Binance" }, { status: 502 });
    }

    return Response.json({
      symbol: "BTCUSDT",
      funding_rate: parseFloat(hist[0].fundingRate ?? 0),
      mark_price: parseFloat(idx.markPrice ?? 0),
      source: "binance",
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
