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

function decodeEntities(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

// Extrahera rubriker + länkar från RSS/Atom-XML med regex (ingen extern parser krävs)
function extractTitles(xml, kalla) {
  const items = [];
  const blockRx = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/g;
  const titleRx = /<title[^>]*>(?:<!\[CDATA\[)?\s*(.*?)\s*(?:\]\]>)?<\/title>/i;
  // Atom: <link href="url"/> eller RSS: <link>url</link>
  const linkRx  = /<link[^>]+href=["']([^"']+)["']|<link[^>]*>([^<]+)<\/link>/i;
  let block;
  while ((block = blockRx.exec(xml)) !== null && items.length < 6) {
    const tm = block[1].match(titleRx);
    if (!tm) continue;
    const rubrik = decodeEntities(tm[1]);
    if (rubrik.length <= 10) continue;
    const lm = block[1].match(linkRx);
    const url = lm ? (lm[1] || lm[2] || null)?.trim() : null;
    items.push({ rubrik, kalla, url: url?.startsWith("http") ? url : null });
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
