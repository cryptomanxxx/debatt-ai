export async function POST(request) {
  const { amne, inlagg } = await request.json();

  if (!inlagg?.length) {
    return Response.json({ summering: "", scores: null });
  }

  const debattText = inlagg.map(h => `${h.agent}: ${h.text}`).join("\n\n");
  const agenter = [...new Set(inlagg.map(h => h.agent))];

  const [sumRes, scoreRes] = await Promise.all([
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Du är en neutral redaktör. Sammanfatta debatter kort och balanserat på svenska. Ta aldrig parti." },
          { role: "user", content: `Debatten handlade om: "${amne}"\n\n${debattText}\n\nSammanfatta debatten i exakt 2 meningar. Lyft fram de starkaste argumenten från alla sidor. Neutral ton. Inga värderingar.` },
        ],
        max_tokens: 220,
        temperature: 0.4,
      }),
    }),
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Du är en retorisk domare. Svara ENDAST med ett JSON-objekt. Inga förklaringar, ingen text utanför JSON.`,
          },
          {
            role: "user",
            content: `Debatten handlade om: "${amne}"\n\n${debattText}\n\nGe varje deltagare ett heltalspoäng 1-10 för retorisk förmåga (argumentstyrka, originalitet, övertygande förmåga).\n\nDeltagarna är: ${agenter.map((a, i) => `${i + 1}. ${a}`).join(", ")}\n\nSvara med EXAKT detta format (ersätt talen med dina betyg):\n{"${agenter.join('": X, "')}: X}`,
          },
        ],
        max_tokens: 80,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    }),
  ]);

  let summering = "";
  if (sumRes.ok) {
    const data = await sumRes.json();
    summering = data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  let scores = null;
  if (scoreRes.ok) {
    try {
      const data = await scoreRes.json();
      const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
      // Case-insensitive matching to handle model formatting variations
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
  }

  return Response.json({ summering, scores });
}
