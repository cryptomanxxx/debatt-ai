export const runtime = "edge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OR_URL   = "https://openrouter.ai/api/v1/chat/completions";

async function callOAI(url, authHeader, model, system, user, extra = {}) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader, ...extra },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 350,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`${r.status}`);
  const text = (await r.json()).choices[0].message.content.trim();
  if (!text) throw new Error("empty");
  return text;
}

async function callGemini(model, system, user, key) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: user }] }],
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { maxOutputTokens: 350, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!r.ok) throw new Error(`${r.status}`);
  const text = (await r.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!text) throw new Error("empty");
  return text;
}

export async function POST(req) {
  const { rubrik, kalla, lang = "sv" } = await req.json().catch(() => ({}));
  if (!rubrik) return Response.json({ text: "" });

  const isEn = lang === "en";
  const system = isEn
    ? `You are a TV news anchor. Translate this headline to English and expand it into a 3-sentence English news segment. Return ONLY the news text, nothing else.`
    : `Du är en professionell TV-nyhetsuppläsare. Expandera rubriken till 3-4 meningar med kontext och bakgrund på flytande svenska. Returnera BARA nyhetstext, inga hälsningsfraser.`;

  const user    = kalla ? `[${kalla}] ${rubrik}` : rubrik;
  const groqKey = process.env.GROQ_API_KEY;
  const gemKey  = process.env.GEMINI_API_KEY;
  const orKey   = process.env.OPENROUTER_API_KEY;
  const orExtra = { "HTTP-Referer": "https://www.debatt-ai.se", "X-Title": "Debatt AI" };

  // Race ALL available providers simultaneously — first valid response wins
  const candidates = [
    groqKey && callOAI(GROQ_URL, `Bearer ${groqKey}`, "llama-3.3-70b-versatile", system, user),
    gemKey  && callGemini("gemini-2.0-flash", system, user, gemKey),
    orKey   && callOAI(OR_URL, `Bearer ${orKey}`, "meta-llama/llama-3.3-70b-instruct:free", system, user, orExtra),
    orKey   && callOAI(OR_URL, `Bearer ${orKey}`, "google/gemini-2.0-flash-exp:free", system, user, orExtra),
    gemKey  && callGemini("gemini-2.0-flash-lite", system, user, gemKey),
    orKey   && callOAI(OR_URL, `Bearer ${orKey}`, "qwen/qwen-2.5-72b-instruct:free", system, user, orExtra),
  ].filter(Boolean);

  if (candidates.length) {
    try {
      const text = await Promise.any(candidates);
      if (text && text !== rubrik) return Response.json({ text });
    } catch {}
  }

  return Response.json({ text: rubrik });
}
