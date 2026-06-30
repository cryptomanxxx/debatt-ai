const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req) {
  const { text } = await req.json();
  if (!text) return Response.json({ translated: "" });
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return Response.json({ translated: text });

  try {
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "Translate the following Swedish text to fluent, natural English. Return ONLY the translated text, nothing else." },
          { role: "user", content: text },
        ],
        max_tokens: 600,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return Response.json({ translated: text });
    const data = await r.json();
    return Response.json({ translated: data.choices[0].message.content.trim() });
  } catch {
    return Response.json({ translated: text });
  }
}
