export const runtime = "edge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function tryGroq(systemPrompt, userContent, key) {
  if (!key) throw new Error("no key");
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 350,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`groq ${r.status}`);
  const text = (await r.json()).choices[0].message.content.trim();
  if (!text) throw new Error("empty");
  return text;
}

async function tryGemini(model, systemPrompt, userContent, key) {
  if (!key) throw new Error("no key");
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 350, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  const text = (await r.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!text) throw new Error("empty");
  return text;
}

export async function POST(req) {
  const { rubrik, kalla, lang = "sv" } = await req.json().catch(() => ({}));
  if (!rubrik) return Response.json({ text: "" });

  const isEn = lang === "en";
  const systemPrompt = isEn
    ? `You are a TV news anchor. Translate this headline to English and expand it into a 3-sentence English news segment with context. Return ONLY the news text, nothing else.`
    : `Du är en professionell TV-nyhetsuppläsare. Expandera den här nyhetsrubriken till ett nyhetssegment på 3-4 meningar med kontext och bakgrund på flytande svenska. Returnera BARA nyhetstext, inga hälsningsfraser.`;

  const userContent = kalla ? `[${kalla}] ${rubrik}` : rubrik;
  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Race all providers in parallel — first valid response wins
  const candidates = [
    groqKey   && tryGroq(systemPrompt, userContent, groqKey),
    geminiKey && tryGemini("gemini-2.0-flash", systemPrompt, userContent, geminiKey),
    geminiKey && tryGemini("gemini-2.0-flash-lite", systemPrompt, userContent, geminiKey),
  ].filter(Boolean);

  if (candidates.length) {
    try {
      const text = await Promise.any(candidates);
      if (text && text !== rubrik) return Response.json({ text });
    } catch {}
  }

  return Response.json({ text: rubrik });
}
