export const runtime = "edge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OR_URL   = "https://openrouter.ai/api/v1/chat/completions";

// OpenRouter free models used as server-side fallback chain (one API call)
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

  const groqKey = process.env.GROQ_API_KEY;
  const gemKey  = process.env.GEMINI_API_KEY;
  const orKey   = process.env.OPENROUTER_API_KEY;

  // Single shared abort so the loser is cancelled as soon as the winner responds
  const abort = new AbortController();
  const sig   = abort.signal;

  async function tryOR() {
    if (!orKey) throw new Error("no key");
    const r = await fetch(OR_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${orKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.debatt-ai.se",
        "X-Title": "Debatt AI",
      },
      // Pass models array — OpenRouter routes server-side, one call covers all 5 models
      body: JSON.stringify({ models: OR_MODELS, messages: msgs, max_tokens: 350, temperature: 0.4 }),
      signal: sig,
    });
    if (!r.ok) throw new Error(`OR ${r.status}`);
    const text = (await r.json()).choices[0].message.content.trim();
    if (!text) throw new Error("empty");
    return text;
  }

  async function tryGroq() {
    if (!groqKey) throw new Error("no key");
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 350, temperature: 0.4 }),
      signal: sig,
    });
    if (!r.ok) throw new Error(`Groq ${r.status}`);
    const text = (await r.json()).choices[0].message.content.trim();
    if (!text) throw new Error("empty");
    return text;
  }

  async function tryGemini() {
    if (!gemKey) throw new Error("no key");
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
        signal: sig,
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const text = (await r.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) throw new Error("empty");
    return text;
  }

  // Race OpenRouter (covers 5 models in one call) against Groq and Gemini
  const candidates = [
    orKey   && tryOR(),    // 1 OR call → server routes across 5 free models
    groqKey && tryGroq(),  // direct Groq
    gemKey  && tryGemini(), // direct Gemini fallback
  ].filter(Boolean);

  if (candidates.length) {
    try {
      const text = await Promise.any(candidates);
      abort.abort(); // Cancel the slower losers immediately
      if (text && text !== rubrik) return Response.json({ text });
    } catch {
      abort.abort();
    }
  }

  return Response.json({ text: rubrik });
}
