import { NextResponse } from "next/server";

const FEEDS = [
  ["SVT Nyheter",  "https://www.svt.se/nyheter/rss.xml"],
  ["Aftonbladet",  "https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/"],
  ["Expressen",    "https://expressen.se/rss/nyheter/"],
  ["Dagens Arena", "https://www.dagensarena.se/feed/"],
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; debatt-ai/1.0)",
  "Accept": "application/rss+xml, application/xml, text/xml, */*",
};

// Extrahera rubriker från RSS/Atom-XML med regex (ingen extern parser krävs)
function extractTitles(xml, kalla) {
  const items = [];
  // Hitta item/entry-block
  const blockRx = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/g;
  const titleRx = /<title[^>]*>(?:<!\[CDATA\[)?\s*(.*?)\s*(?:\]\]>)?<\/title>/i;
  let block;
  while ((block = blockRx.exec(xml)) !== null && items.length < 3) {
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
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (!res.ok) return [];
      const text = await res.text();
      return extractTitles(text, namn);
    })
  );

  // Interleave: SVT[0], Aftonbladet[0], Expressen[0], SVT[1], Aftonbladet[1]...
  // Istället för alla SVT-items i rad följt av alla Aftonbladet-items
  const perKalla = results.map(r => r.status === "fulfilled" ? r.value : []);
  const maxLen = Math.max(...perKalla.map(a => a.length));
  const nyheter = [];
  for (let i = 0; i < maxLen; i++) {
    for (const items of perKalla) {
      if (items[i]) nyheter.push(items[i]);
    }
  }

  return NextResponse.json(nyheter, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
