const P = (url) => `/api/rss-proxy?url=${encodeURIComponent(url)}`;

const FEEDS = [
  // Svenska nyheter – via proxy
  ["SVT Nyheter",        P("https://www.svt.se/nyheter/rss.xml")],
  ["Omni",               P("https://omni.se/rss")],
  ["Aftonbladet",        P("https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/")],
  ["Dagens Arena",       P("https://www.dagensarena.se/feed/")],
  // Svenska ämnen – Reddit
  ["Reddit Sverige",     "https://www.reddit.com/r/sweden/.rss"],
  ["Reddit Ekonomi",     "https://www.reddit.com/r/Economics/.rss"],
  ["Reddit Klimat",      "https://www.reddit.com/r/environment/.rss"],
  ["Reddit Samhälle",    "https://www.reddit.com/r/europe/.rss"],
  ["Reddit EU",          "https://www.reddit.com/r/europeanunion/.rss"],
  ["Reddit Sjukvård",    "https://www.reddit.com/r/medicine/.rss"],
  ["Reddit Bostäder",    "https://www.reddit.com/r/urbanplanning/.rss"],
  // Tech – via proxy + The Verge direkt
  ["The Verge",          "https://www.theverge.com/rss/index.xml"],
  ["TechCrunch",         P("https://techcrunch.com/feed/")],
  ["Wired",              P("https://www.wired.com/feed/rss")],
  ["Ars Technica",       P("https://feeds.arstechnica.com/arstechnica/index")],
  ["Hacker News",        P("https://hnrss.org/frontpage")],
  ["Engadget",           P("https://www.engadget.com/rss.xml")],
  // Internationellt – via proxy
  ["BBC News",           P("https://feeds.bbci.co.uk/news/rss.xml")],
  ["Al Jazeera",         P("https://www.aljazeera.com/xml/rss/all.xml")],
  ["Reddit World News",  "https://www.reddit.com/r/worldnews/.rss"],
  // Tech & AI – Reddit
  ["Reddit Technology",  "https://www.reddit.com/r/technology/.rss"],
  // Tech & AI – Reddit
  ["Reddit AI",          "https://www.reddit.com/r/artificial/.rss"],
  ["Reddit Singularity", "https://www.reddit.com/r/singularity/.rss"],
  ["Reddit OpenAI",      "https://www.reddit.com/r/OpenAI/.rss"],
  ["Reddit LocalLLM",    "https://www.reddit.com/r/LocalLLaMA/.rss"],
  ["Reddit Futurology",  "https://www.reddit.com/r/Futurology/.rss"],
  ["Reddit ML",          "https://www.reddit.com/r/MachineLearning/.rss"],
  // Politik & samhälle – Reddit
  ["Reddit Geopolitics", "https://www.reddit.com/r/geopolitics/.rss"],
  ["Reddit Philosophy",  "https://www.reddit.com/r/philosophy/.rss"],
  ["Reddit ChangeMyView","https://www.reddit.com/r/changemyview/.rss"],
  ["Reddit WorldPolitics","https://www.reddit.com/r/worldpolitics/.rss"],
  // Internationella nyheter
  ["Reddit World News",  "https://www.reddit.com/r/worldnews/.rss"],
  // Ekonomi – Reddit
  ["Reddit Finance",     "https://www.reddit.com/r/finance/.rss"],
  ["Reddit Stocks",      "https://www.reddit.com/r/stocks/.rss"],
  // Energi & klimat – Reddit
  ["Reddit Energy",      "https://www.reddit.com/r/energy/.rss"],
  ["Reddit Renewable",   "https://www.reddit.com/r/RenewableEnergy/.rss"],
  ["Reddit Climate",     "https://www.reddit.com/r/climatechange/.rss"],
  ["Reddit Nuclear",     "https://www.reddit.com/r/nuclear/.rss"],
  // Kryptovalutor – Reddit
  ["Reddit Crypto",      "https://www.reddit.com/r/CryptoCurrency/.rss"],
  ["Reddit Bitcoin",     "https://www.reddit.com/r/Bitcoin/.rss"],
  // Spel & underhållning – Reddit
  ["Reddit Gaming",      "https://www.reddit.com/r/gaming/.rss"],
  ["Reddit Games",       "https://www.reddit.com/r/Games/.rss"],
  ["Reddit TV",          "https://www.reddit.com/r/television/.rss"],
  // Medicin & forskning
  ["Reddit Science",     "https://www.reddit.com/r/science/.rss"],
  // AI-forskning & populärvetenskap – via proxy
  ["Google Research",    P("https://research.google/blog/rss/")],
  ["TED Talks",          P("https://www.ted.com/talks/rss")],
];

const ATOM = "http://www.w3.org/2005/Atom";

async function countItems(text) {
  try {
    // Enkel räkning av <item> eller <entry> utan full XML-parse
    const items = (text.match(/<item[\s>]/g) || []).length;
    const entries = (text.match(/<entry[\s>]/g) || []).length;
    return Math.max(items, entries);
  } catch { return 0; }
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async ([namn, url]) => {
      const start = Date.now();
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        });
        const ms = Date.now() - start;
        const text = await res.text();
        const antal = res.ok ? await countItems(text) : 0;
        return { namn, url, ok: res.ok && antal > 0, status: res.status, ms, antal };
      } catch (e) {
        return { namn, url, ok: false, status: 0, ms: Date.now() - start, antal: 0, error: e.message ?? "Timeout" };
      }
    })
  );

  const data = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return { namn: FEEDS[i][0], url: FEEDS[i][1], ok: false, status: 0, ms: 0, antal: 0, error: r.reason?.message ?? "Timeout" };
  });

  return Response.json(data);
}
