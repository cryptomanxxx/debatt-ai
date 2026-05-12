// RSS-proxy: fetchar externa feeds via Vercels servrar (kringgår GitHub Actions IP-block).
// Säkerhet: bara tillåtna domäner accepteras för att undvika öppen SSRF-proxy.
const TILLÅTNA_DOMÄNER = [
  "svt.se", "aftonbladet.se", "dagensarena.se",
  "techcrunch.com", "wired.com", "arstechnica.com", "feeds.arstechnica.com",
  "hnrss.org", "engadget.com",
  "feeds.bbci.co.uk", "aljazeera.com",
  "ted.com", "research.google",
  "theverge.com",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return Response.json({ error: "url saknas" }, { status: 400 });

  let parsed;
  try { parsed = new URL(url); } catch {
    return Response.json({ error: "Ogiltig URL" }, { status: 400 });
  }

  const host = parsed.hostname.replace(/^www\./, "");
  if (!TILLÅTNA_DOMÄNER.some(d => host === d || host.endsWith("." + d))) {
    return Response.json({ error: "Domän inte tillåten" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
    });

    const body = await res.arrayBuffer();
    return new Response(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=900, stale-while-revalidate=300",
        "X-Proxied-From": host,
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
