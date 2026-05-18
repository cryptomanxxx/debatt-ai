import { providerReady, markProviderDown } from "../../../lib/aiCircuitBreaker";

const MESSAGES = (agentText) => [
  {
    role: "system",
    content: "Du genererar svenska debattämnen. Svara ENDAST med själva ämnesfrågan — en mening, max 8 ord, ingen förklaring, inga citattecken.",
  },
  {
    role: "user",
    content: `Panelen består av: ${agentText}. Ge ett aktuellt, kontroversiellt och engagerande debattämne på svenska som passar just den här panelen. Bara frågan, inget annat.`,
  },
];

async function fetchAmne(url, headers, body) {
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ?? "";
  } catch {
    return "";
  }
}

export async function POST(request) {
  const { agenter } = await request.json();
  const agentText = Array.isArray(agenter) ? agenter.join(", ") : "blandade agenter";
  const messages = MESSAGES(agentText);
  const oaiBody = { messages, max_tokens: 40, temperature: 0.95 };

  // Groq
  if (process.env.GROQ_API_KEY && providerReady("groq")) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ ...oaiBody, model: "llama-3.3-70b-versatile" }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => null);
    if (res?.status === 429) markProviderDown("groq");
    if (res?.ok) {
      const data = await res.json();
      const amne = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ?? "";
      if (amne) return Response.json({ amne });
    }
  }

  // Gemini
  if (process.env.GEMINI_API_KEY && providerReady("gemini")) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: messages[1].content }] }],
            systemInstruction: { parts: [{ text: messages[0].content }] },
            generationConfig: { maxOutputTokens: 40, temperature: 0.95 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const amne = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/^["']|["']$/g, "") ?? "";
        if (amne) return Response.json({ amne });
      }
      if (res.status === 429) markProviderDown("gemini");
    } catch {}
  }

  // GitHub Models
  if (process.env.GITHUB_TOKEN) {
    const amne = await fetchAmne(
      "https://models.inference.ai.azure.com/chat/completions",
      { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      { ...oaiBody, model: "Llama-3.3-70B-Instruct" }
    );
    if (amne) return Response.json({ amne });
  }

  return Response.json({ amne: "" }, { status: 502 });
}
