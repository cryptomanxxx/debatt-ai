export const runtime = "edge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];

export async function POST(req) {
  const { rubrik, kalla, lang = "sv" } = await req.json().catch(() => ({}));
  if (!rubrik) return Response.json({ text: "" });

  const isEn = lang === "en";
  const systemPrompt = isEn
    ? `You are a TV news anchor. Translate this headline to English and expand it into a 3-sentence English news segment with context. Return ONLY the news text, nothing else.`
    : `Du är en professionell TV-nyhetsuppläsare. Expandera den här nyhetsrubriken till ett nyhetssegment på 3-4 meningar med kontext och bakgrund på flytande svenska. Returnera BARA nyhetstext, inga hälsningsfraser.`;

  const userContent = kalla ? `[${kalla}] ${rubrik}` : rubrik;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Try Groq (plain text output — more reliable than JSON mode for single items)
  if (groqKey) {
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          max_tokens: 350,
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(9000),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.choices[0].message.content.trim();
        if (text && text !== rubrik) return Response.json({ text });
      }
    } catch {}
  }

  // Gemini fallback
  if (geminiKey) {
    const payload = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: 350, temperature: 0.4 },
    });
    for (const model of GEMINI_MODELS) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: AbortSignal.timeout(9000) }
        );
        if (r.ok) {
          const data = await r.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
          if (text && text !== rubrik) return Response.json({ text });
        }
      } catch {}
    }
  }

  return Response.json({ text: rubrik });
}
