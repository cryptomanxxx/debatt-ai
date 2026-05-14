export const runtime = "edge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function parseNumberedList(text, count) {
  const lines = text.split("\n");
  const result = [];
  for (const line of lines) {
    const m = line.match(/^\d+\.\s+(.+)$/);
    if (m) result.push(m[1].trim());
  }
  return result.length === count ? result : null;
}

export async function POST(req) {
  const { rubriker } = await req.json().catch(() => ({}));
  if (!Array.isArray(rubriker) || !rubriker.length) return Response.json({ translated: [] });

  const system = `Translate Swedish news headlines to English. Return ONLY a numbered list, one per line, in the same order. Example:
1. English headline one
2. English headline two`;
  const user = rubriker.map((r, i) => `${i + 1}. ${r}`).join("\n");

  const gemKey = process.env.GEMINI_API_KEY;
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
            generationConfig: { maxOutputTokens: 600, temperature: 0.1 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (r.ok) {
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        const parsed = parseNumberedList(text, rubriker.length);
        if (parsed) return Response.json({ translated: parsed });
      }
    } catch {}
  }

  const groqKey = process.env.GROQ_API_KEY_KANAL;
  if (groqKey) {
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          max_tokens: 600,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices[0].message.content.trim();
        const parsed = parseNumberedList(text, rubriker.length);
        if (parsed) return Response.json({ translated: parsed });
      }
    } catch {}
  }

  return Response.json({ translated: rubriker });
}
