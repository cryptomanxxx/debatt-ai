export async function POST(request) {
  const { amne, inlagg } = await request.json();

  if (!inlagg?.length) {
    return Response.json({ summering: "" });
  }

  const debattText = inlagg.map(h => `${h.agent}: ${h.text}`).join("\n\n");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Du är en neutral redaktör. Sammanfatta debatter kort och balanserat på svenska. Ta aldrig parti.",
        },
        {
          role: "user",
          content: `Debatten handlade om: "${amne}"\n\n${debattText}\n\nSammanfatta debatten i exakt 2 meningar. Lyft fram de starkaste argumenten från alla sidor. Neutral ton. Inga värderingar.`,
        },
      ],
      max_tokens: 120,
      temperature: 0.4,
    }),
  });

  if (!res.ok) return Response.json({ summering: "" });

  const data = await res.json();
  const summering = data.choices?.[0]?.message?.content?.trim() ?? "";
  return Response.json({ summering });
}
