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

async function expanderaMedGroq(nyheter, lang = "sv") {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return nyheter.map(n => ({ ...n, text: n.rubrik }));

  const lista = nyheter.map((n, i) => `${i + 1}. [${n.kalla}] ${n.rubrik}`).join("\n");

  const systemPrompt = lang === "en"
    ? `You are a professional TV news anchor. For each numbered headline: (1) translate the headline to English, (2) expand it into a 3–4 sentence news segment with context and background. Always in fluent, natural English regardless of the headline's original language. No greetings. Reply ONLY with JSON: {"nyheter": [{"rubrik": "translated headline", "text": "expanded segment"}]}`
    : `Du är en professionell TV-nyhetsuppläsare på svenska rikstäckande TV. Expandera varje nyhetsrubrik till en nyhetssnutt på 3-4 meningar med kontext och bakgrund. Alltid på flytande svenska oavsett källspråk. Inga häsningsfraser. Svara ENDAST med JSON: {"nyheter": [{"text": "..."}]}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: lista },
        ],
        max_tokens: 2500,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(18000),
    });

    if (!r.ok) return nyheter.map(n => ({ ...n, text: n.rubrik }));

    const data = await r.json();
    const expanded = JSON.parse(data.choices[0].message.content).nyheter;
    return nyheter.map((n, i) => {
      const expandedText = expanded[i]?.text || n.rubrik;
      const translatedRubrik = expanded[i]?.rubrik;
      // If Groq didn't return a translated rubrik, derive one from the first sentence of the English text
      const finalRubrik = translatedRubrik && translatedRubrik !== n.rubrik
        ? translatedRubrik
        : lang === "en" && expandedText !== n.rubrik
          ? expandedText.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, "").trim()
          : n.rubrik;
      return { ...n, rubrik: finalRubrik, text: expandedText };
    });
  } catch {
    return nyheter.map(n => ({ ...n, text: n.rubrik }));
  }
}

export async function GET(req) {
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "sv";

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

  if (!nyheter.length) return NextResponse.json([]);

  const expanderade = await expanderaMedGroq(nyheter, lang);

  return NextResponse.json(expanderade, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
