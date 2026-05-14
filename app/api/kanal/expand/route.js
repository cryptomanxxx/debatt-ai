export const runtime = "edge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OR_URL   = "https://openrouter.ai/api/v1/chat/completions";

const OR_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-3-27b-it:free",
  "microsoft/phi-4:free",
];

export async function POST(req) {
  const { rubrik, kalla, lang = "sv" } = await req.json().catch(() => ({}));
  if (!rubrik) return Response.json({ text: "" });

  const isEn = lang === "en";
  const system = isEn
    ? `You are a TV news anchor. Translate this headline to English and expand it into a 3-sentence English news segment. Return ONLY the news text, nothing else.`
    : `Du är en professionell TV-nyhetsuppläsare. Expandera rubriken till 3-4 meningar med kontext och bakgrund på flytande svenska. Returnera BARA nyhetstext, inga hälsningsfraser.`;
  const user = kalla ? `[${kalla}] ${rubrik}` : rubrik;
  const msgs = [{ role: "system", content: system }, { role: "user", content: user }];

  const groqKey = process.env.GROQ_API_KEY_KANAL;
  const gemKey  = process.env.GEMINI_API_KEY;
  const orKey   = process.env.OPENROUTER_API_KEY;

  // Gemini first — no daily token cap (only 15 req/min).
  // Groq shares its 100k tokens/day with agent.py (12 runs/day) and runs
  // out by afternoon. Use Groq as backup, OR as last resort.

  if (gemKey) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: user }] }],
            systemInstruction: { parts: [{ text: system }] },
            generationConfig: { maxOutputTokens: 350, temperature: 0.4 },
          }),
          signal: AbortSignal.timeout(8000),
        }
      );
      if (r.ok) {
        const text = (await r.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        if (text && text !== rubrik) return Response.json({ text }, { headers: { "X-Provider": "gemini" } });
      }
    } catch {}
  }

  if (groqKey) {
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) {
        const text = (await r.json()).choices[0].message.content.trim();
        if (text && text !== rubrik) return Response.json({ text }, { headers: { "X-Provider": "groq" } });
      }
    } catch {}
  }

  if (orKey) {
    try {
      const r = await fetch(OR_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${orKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.debatt-ai.se",
          "X-Title": "Debatt AI",
        },
        body: JSON.stringify({ models: OR_MODELS, messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const text = (await r.json()).choices[0].message.content.trim();
        if (text && text !== rubrik) return Response.json({ text }, { headers: { "X-Provider": "openrouter" } });
      }
    } catch {}
  }

  return Response.json({ text: rubrik }, { headers: { "X-Provider": "none" } });
}
