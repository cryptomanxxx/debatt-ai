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
          { role: "system", content: "Du är en neutral retorisk domare. Svara ALLTID med giltig JSON och ingenting annat." },
          { role: "user", content: `Debatten handlade om: "${amne}"\n\nDeltagare: ${agenter.join(", ")}\n\n${debattText}\n\nBedöm varje deltagares retoriska förmåga på en skala 1–10. Beakta: argumentstyrka, originalitet och övertygande förmåga.\n\nSvara med EXAKT denna JSON (inga kommentarer, ingen text utanför JSON):\n${JSON.stringify(Object.fromEntries(agenter.map(a => [a, 0])))}` },
        ],
        max_tokens: 120,
        temperature: 0.2,
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
      scores = {};
      for (const agent of agenter) {
        const v = Number(raw[agent]);
        if (v >= 1 && v <= 10) scores[agent] = v;
      }
      if (Object.keys(scores).length === 0) scores = null;
    } catch {
      scores = null;
    }
  }

  return Response.json({ summering, scores });
}
