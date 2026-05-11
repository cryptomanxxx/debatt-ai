const FEEDS = [
  ["SVT Nyheter",        "https://www.svt.se/nyheter/rss.xml"],
  ["Aftonbladet",        "https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/"],
  ["Dagens Arena",       "https://www.dagensarena.se/feed/"],
  ["The Verge",          "https://www.theverge.com/rss/index.xml"],
  ["TechCrunch",         "https://techcrunch.com/feed/"],
  ["Wired",              "https://www.wired.com/feed/rss"],
  ["Ars Technica",       "https://feeds.arstechnica.com/arstechnica/index"],
  ["Hacker News",        "https://hnrss.org/frontpage"],
  ["Engadget",           "https://www.engadget.com/rss.xml"],
  ["BBC News",           "https://feeds.bbci.co.uk/news/rss.xml"],
  ["Al Jazeera",         "https://www.aljazeera.com/xml/rss/all.xml"],
  ["Google Research",    "https://research.google/blog/rss/"],
  ["TED Talks",          "https://www.ted.com/talks/rss"],
  ["Reddit Sverige",     "https://www.reddit.com/r/sweden/.rss"],
  ["Reddit Ekonomi",     "https://www.reddit.com/r/Economics/.rss"],
  ["Reddit Klimat",      "https://www.reddit.com/r/environment/.rss"],
  ["Reddit Samhälle",    "https://www.reddit.com/r/europe/.rss"],
  ["Reddit EU",          "https://www.reddit.com/r/europeanunion/.rss"],
  ["Reddit AI",          "https://www.reddit.com/r/artificial/.rss"],
  ["Reddit Singularity", "https://www.reddit.com/r/singularity/.rss"],
  ["Reddit OpenAI",      "https://www.reddit.com/r/OpenAI/.rss"],
  ["Reddit LocalLLM",    "https://www.reddit.com/r/LocalLLaMA/.rss"],
  ["Reddit Futurology",  "https://www.reddit.com/r/Futurology/.rss"],
  ["Reddit Technology",  "https://www.reddit.com/r/technology/.rss"],
  ["Reddit ML",          "https://www.reddit.com/r/MachineLearning/.rss"],
  ["Reddit Geopolitics", "https://www.reddit.com/r/geopolitics/.rss"],
  ["Reddit Philosophy",  "https://www.reddit.com/r/philosophy/.rss"],
  ["Reddit ChangeMyView","https://www.reddit.com/r/changemyview/.rss"],
  ["Reddit World News",  "https://www.reddit.com/r/worldnews/.rss"],
  ["Reddit Science",     "https://www.reddit.com/r/science/.rss"],
  ["Reddit Finance",     "https://www.reddit.com/r/finance/.rss"],
  ["Reddit Stocks",      "https://www.reddit.com/r/stocks/.rss"],
  ["Reddit Energy",      "https://www.reddit.com/r/energy/.rss"],
  ["Reddit Renewable",   "https://www.reddit.com/r/RenewableEnergy/.rss"],
  ["Reddit Climate",     "https://www.reddit.com/r/climatechange/.rss"],
  ["Reddit Nuclear",     "https://www.reddit.com/r/nuclear/.rss"],
  ["Reddit Crypto",      "https://www.reddit.com/r/CryptoCurrency/.rss"],
  ["Reddit Bitcoin",     "https://www.reddit.com/r/Bitcoin/.rss"],
  ["Reddit Gaming",      "https://www.reddit.com/r/gaming/.rss"],
  ["Reddit Games",       "https://www.reddit.com/r/Games/.rss"],
  ["Reddit TV",          "https://www.reddit.com/r/television/.rss"],
];

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async ([namn, url]) => {
      const start = Date.now();
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      const ms = Date.now() - start;
      return { namn, url, ok: res.ok, status: res.status, ms };
    })
  );

  const data = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return { namn: FEEDS[i][0], url: FEEDS[i][1], ok: false, status: 0, ms: 0, error: r.reason?.message ?? "Timeout" };
  });

  return Response.json(data);
}
