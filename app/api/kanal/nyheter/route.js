import { NextResponse } from "next/server";

const FEEDS = [
  ["SVT Nyheter",   "https://www.svt.se/nyheter/rss.xml"],
  ["Aftonbladet",   "https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/"],
  ["The Verge",     "https://www.theverge.com/rss/index.xml"],
  ["BBC News",      "https://feeds.bbci.co.uk/news/rss.xml"],
  ["Dagens Arena",  "https://www.dagensarena.se/feed/"],
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
  while ((block = blockRx.exec(xml)) !== null && items.length < 5) {
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

async function expanderaMedGroq(nyheter) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return nyheter.map(n => ({ ...n, text: n.rubrik }));

  const lista = nyheter.map((n, i) => `${i + 1}. [${n.kalla}] ${n.rubrik}`).join("\n");

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Du är en professionell TV-nyhetsuppläsare på svenska rikstäckande TV. Expandera varje nyhetsrubrik till en nyhetssnutt på 3-4 meningar med kontext och bakgrund. Alltid på flytande svenska oavsett källspråk. Inga häsningsfraser. Svara ENDAST med JSON: {\"nyheter\": [{\"text\": \"...\"}]}",
          },
          { role: "user", content: lista },
        ],
        max_tokens: 1800,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(18000),
    });

    if (!r.ok) return nyheter.map(n => ({ ...n, text: n.rubrik }));

    const data = await r.json();
    const expanded = JSON.parse(data.choices[0].message.content).nyheter;
    return nyheter.map((n, i) => ({ ...n, text: expanded[i]?.text || n.rubrik }));
  } catch {
    return nyheter.map(n => ({ ...n, text: n.rubrik }));
  }
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
    .slice(0, 7);

  if (!nyheter.length) return NextResponse.json([]);

  const expanderade = await expanderaMedGroq(nyheter);

  return NextResponse.json(expanderade, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
