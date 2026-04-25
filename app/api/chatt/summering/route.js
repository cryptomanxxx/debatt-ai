const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function groqOrGemini({ messages, max_tokens, temperature, json = false }) {
  const groqHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` };
  const groqBody = { model: GROQ_MODEL, messages, max_tokens, temperature, ...(json ? { response_format: { type: "json_object" } } : {}) };
  const res = await fetch(GROQ_URL, { method: "POST", headers: groqHeaders, body: JSON.stringify(groqBody) });
  if (res.ok) {
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  // Groq failed — fall back to Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return "";
  const systemMsg = messages.find(m => m.role === "system")?.content ?? "";
  const userMsg   = messages.find(m => m.role === "user")?.content ?? "";
  const geminiBody = {
    contents: [{ role: "user", parts: [{ text: userMsg }] }],
    ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg }] } } : {}),
    generationConfig: { maxOutputTokens: max_tokens, temperature },
  };
  const gRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(geminiBody) }
  );
  if (!gRes.ok) return "";
  const gData = await gRes.json();
  return gData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function POST(request) {
  const { amne, inlagg } = await request.json();

  if (!inlagg?.length) {
    return Response.json({ summering: "", scores: null });
  }

  const debattText = inlagg.map(h => `${h.agent}: ${h.text}`).join("\n\n");
  const agenter = [...new Set(inlagg.map(h => h.agent))];

  const [sumText, scoreText] = await Promise.all([
    groqOrGemini({
      messages: [
        { role: "system", content: "Du är en neutral redaktör. Sammanfatta debatter kort och balanserat på svenska. Ta aldrig parti." },
        { role: "user", content: `Debatten handlade om: "${amne}"\n\n${debattText}\n\nSammanfatta debatten i exakt 2 meningar. Lyft fram de starkaste argumenten från alla sidor. Neutral ton. Inga värderingar.` },
      ],
      max_tokens: 220,
      temperature: 0.4,
    }),
    groqOrGemini({
      messages: [
        { role: "system", content: "Du är en retorisk domare. Svara ENDAST med ett JSON-objekt. Inga förklaringar, ingen text utanför JSON." },
        { role: "user", content: `Debatten handlade om: "${amne}"\n\n${debattText}\n\nGe varje deltagare ett heltalspoäng 1-10 för retorisk förmåga (argumentstyrka, originalitet, övertygande förmåga).\n\nDeltagarna är: ${agenter.map((a, i) => `${i + 1}. ${a}`).join(", ")}\n\nSvara med EXAKT detta format (ersätt talen med dina betyg):\n{"${agenter.join('": X, "')}: X}` },
      ],
      max_tokens: 80,
      temperature: 0.1,
      json: true,
    }),
  ]);

  const summering = sumText.trim();

  let scores = null;
  try {
    const raw = JSON.parse(scoreText || "{}");
    const rawLower = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
    scores = {};
    for (const agent of agenter) {
      const v = Number(raw[agent] ?? rawLower[agent.toLowerCase()]);
      if (Number.isInteger(v) && v >= 1 && v <= 10) scores[agent] = v;
    }
    if (Object.keys(scores).length === 0) scores = null;
  } catch {
    scores = null;
  }

  return Response.json({ summering, scores });
}
