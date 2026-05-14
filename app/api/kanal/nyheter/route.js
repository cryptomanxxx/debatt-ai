export const runtime = "edge";

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

function safeParseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  // Handle markdown code fences
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1].trim()); } catch {} }
  return null;
}

function buildResult(expanded, nyheter, lang) {
  if (!Array.isArray(expanded) || expanded.length === 0) return null;
  const result = nyheter.map((n, i) => {
    const expandedText = expanded[i]?.text || n.rubrik;
    const translatedRubrik = expanded[i]?.rubrik;
    const finalRubrik = translatedRubrik && translatedRubrik !== n.rubrik
      ? translatedRubrik
      : lang === "en" && expandedText !== n.rubrik
        ? expandedText.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, "").trim()
        : n.rubrik;
    return { ...n, rubrik: finalRubrik, text: expandedText };
  });
  // Only return if at least some items were actually expanded
  return result.some(n => n.text !== n.rubrik) ? result : null;
}

async function expanderaMedGroq(nyheter, lang = "sv") {
  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const lista = nyheter.map((n, i) => `${i + 1}. [${n.kalla}] ${n.rubrik}`).join("\n");

  const systemPrompt = lang === "en"
    ? `You are a TV news anchor. For each numbered headline translate it to English and write a 2-sentence English news segment. Reply ONLY with JSON: {"nyheter":[{"rubrik":"English headline","text":"2-sentence English segment"}]}`
    : `Du är en professionell TV-nyhetsuppläsare på svenska rikstäckande TV. Expandera varje nyhetsrubrik till en nyhetssnutt på 3-4 meningar med kontext och bakgrund. Alltid på flytande svenska oavsett källspråk. Inga häsningsfraser. Svara ENDAST med JSON: {"nyheter": [{"text": "..."}]}`;

  // ── Try Groq ──────────────────────────────────────────────────────────────
  if (groqKey) {
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
        signal: AbortSignal.timeout(12000),
      });

      if (r.ok) {
        const data = await r.json();
        const parsed = safeParseJSON(data.choices[0].message.content);
        const result = buildResult(parsed?.nyheter, nyheter, lang);
        if (result) return result;
      }
    } catch {}
  }

  // ── Fallback to Gemini ───────────────────────────────────────────────────
  if (geminiKey) {
    const geminiPayload = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: lista }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: 2500, temperature: 0.4 },
    });
    for (const model of ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"]) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: geminiPayload,
            signal: AbortSignal.timeout(12000),
          }
        );
        if (r.ok) {
          const data = await r.json();
          const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          const parsed = safeParseJSON(content);
          const result = buildResult(parsed?.nyheter, nyheter, lang);
          if (result) return result;
        }
      } catch {}
    }
  }

  return nyheter.map(n => ({ ...n, text: n.rubrik }));
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

  // Don't cache failed responses (text === rubrik means no AI expansion happened)
  const groqFailed = expanderade.length > 0 && expanderade.every(n => n.text === n.rubrik);

  return NextResponse.json(expanderade, {
    headers: {
      "Cache-Control": groqFailed
        ? "no-store"
        : "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
