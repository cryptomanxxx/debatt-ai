import { NextResponse } from "next/server";

const FEEDS = [
  ["SVT Nyheter",   "https://www.svt.se/nyheter/rss.xml"],
  ["Aftonbladet",   "https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/"],
  ["Expressen",     "https://www.expressen.se/rss/nyheter/"],
  ["Dagens Arena",  "https://www.dagensarena.se/feed/"],
  ["BBC News",      "https://feeds.bbci.co.uk/news/rss.xml"],
  ["Reuters",       "https://feeds.reuters.com/reuters/topNews"],
  ["The Guardian",  "https://www.theguardian.com/world/rss"],
  ["Deutsche Welle","https://rss.dw.com/rdf/rss-en-all"],
  ["The Verge",     "https://www.theverge.com/rss/index.xml"],
  ["Ars Technica",  "https://feeds.arstechnica.com/arstechnica/index"],
  ["TechCrunch",    "https://techcrunch.com/feed/"],
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; debatt-ai/1.0)",
  "Accept": "application/rss+xml, application/xml, text/xml, */*",
};

function extractTitles(xml, kalla) {
  const items = [];
  const blockRx = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/g;
  const titleRx = /<title[^>]*>(?:<!\[CDATA\[)?\s*(.*?)\s*(?:\]\]>)?<\/title>/i;
  let block;
  while ((block = blockRx.exec(xml)) !== null && items.length < 2) {
    const m = block[1].match(titleRx);
    if (m) {
      const rubrik = m[1]
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
      if (rubrik.length > 10) items.push({ rubrik, kalla });
    }
  }
  return items;
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(async ([namn, url]) => {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 1800 },
      });
      if (!res.ok) return [];
      const text = await res.text();
      return extractTitles(text, namn);
    })
  );

  const nyheter = results
    .flatMap(r => r.status === "fulfilled" ? r.value : [])
    .slice(0, 10);

  // Return raw headlines — AI expansion happens per-item via /api/kanal/expand
  return NextResponse.json(
    nyheter.map(n => ({ ...n, text: n.rubrik })),
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
  );
}
