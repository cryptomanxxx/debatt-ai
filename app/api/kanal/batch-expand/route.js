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
  const { items } = await req.json().catch(() => ({}));
  if (!Array.isArray(items) || !items.length) return Response.json({ expanded: [] });

  const system = `Du är en professionell TV-nyhetsuppläsare. Expandera varje rubrik till 2 meningar med kontext och bakgrund på flytande svenska. Returnera BARA en numrerad lista, en expansion per rad, i samma ordning. Inga radbrytningar inom en expansion.
Exempel:
1. Expanderad nyhetstext för rubrik ett på en rad.
2. Expanderad nyhetstext för rubrik två på en rad.`;

  const user = items.map((item, i) => `${i + 1}. [${item.kalla || ""}] ${item.rubrik}`).join("\n");

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
            generationConfig: { maxOutputTokens: 1200, temperature: 0.3 },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (r.ok) {
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) return Response.json({ expanded: parsed });
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
          max_tokens: 1200,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices[0].message.content.trim();
        const parsed = parseNumberedList(text, items.length);
        if (parsed) return Response.json({ expanded: parsed });
      }
    } catch {}
  }

  return Response.json({ expanded: [] });
}
