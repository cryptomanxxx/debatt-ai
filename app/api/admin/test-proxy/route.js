// Testar RSS-proxyn exakt som agent.py gör — avslöjar vad agent.py faktiskt ser
// till skillnad från test-feeds som hämtar direkt från Vercel utan proxy.
const PROXY = "https://www.debatt-ai.se/api/rss-proxy?url=";

const TEST_FEEDS = [
  ["SVT Nyheter",    "https://www.svt.se/nyheter/rss.xml"],
  ["Aftonbladet",    "https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/"],
  ["Dagens Arena",   "https://www.dagensarena.se/feed/"],
  ["The Verge",      "https://www.theverge.com/rss/index.xml"],
  ["TechCrunch",     "https://techcrunch.com/feed/"],
  ["Wired",          "https://www.wired.com/feed/rss"],
  ["Ars Technica",   "https://feeds.arstechnica.com/arstechnica/index"],
  ["Hacker News",    "https://hnrss.org/frontpage"],
  ["Engadget",       "https://www.engadget.com/rss.xml"],
  ["BBC News",       "https://feeds.bbci.co.uk/news/rss.xml"],
  ["Al Jazeera",     "https://www.aljazeera.com/xml/rss/all.xml"],
  ["Reddit Sverige", "https://www.reddit.com/r/sweden/.rss"],
  ["Reddit AI",      "https://www.reddit.com/r/artificial/.rss"],
  ["Google Research","https://research.google/blog/rss/"],
  ["TED Talks",      "https://www.ted.com/talks/rss"],
  ["YouTube SVT",    "https://www.youtube.com/feeds/videos.xml?channel_id=UCG-Et3jfinzlQql4uEYjAVw"],
];

function countItems(text) {
  const items   = (text.match(/<item[\s>]/g) || []).length;
  const entries = (text.match(/<entry[\s>]/g) || []).length;
  return Math.max(items, entries);
}

export async function GET() {
  const results = await Promise.allSettled(
    TEST_FEEDS.map(async ([namn, url]) => {
      const proxyUrl = PROXY + encodeURIComponent(url);
      const start = Date.now();
      try {
        const res = await fetch(proxyUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        const ms = Date.now() - start;
        const text = await res.text();
        const antal = res.ok ? countItems(text) : 0;
        const snippet = text.slice(0, 400).replace(/\s+/g, " ").trim();
        const contentType = res.headers.get("content-type") || "?";
        const proxiedStatus = res.headers.get("x-proxied-status") || "?";
        return {
          namn, url, proxyUrl,
          ok: res.ok && antal > 0,
          status: res.status,
          proxiedStatus,
          contentType,
          ms, antal, snippet,
        };
      } catch (e) {
        return {
          namn, url, proxyUrl,
          ok: false, status: 0, proxiedStatus: "?",
          contentType: "?", ms: Date.now() - start,
          antal: 0, snippet: "", error: e.message ?? "Timeout",
        };
      }
    })
  );

  const data = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      namn: TEST_FEEDS[i][0], url: TEST_FEEDS[i][1],
      ok: false, status: 0, proxiedStatus: "?", contentType: "?",
      ms: 0, antal: 0, snippet: "", error: r.reason?.message ?? "Timeout",
    };
  });

  return Response.json(data);
}
