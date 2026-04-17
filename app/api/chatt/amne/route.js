export async function POST(request) {
  const { agenter } = await request.json();
  const agentText = Array.isArray(agenter) ? agenter.join(", ") : "blandade agenter";

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
          content: "Du genererar svenska debattämnen. Svara ENDAST med själva ämnesfrågan — en mening, max 8 ord, ingen förklaring, inga citattecken.",
        },
        {
          role: "user",
          content: `Panelen består av: ${agentText}. Ge ett aktuellt, kontroversiellt och engagerande debattämne på svenska som passar just den här panelen. Bara frågan, inget annat.`,
        },
      ],
      max_tokens: 40,
      temperature: 0.95,
    }),
  });

  if (!res.ok) return Response.json({ amne: "" }, { status: 502 });
  const data = await res.json();
  const amne = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ?? "";
  return Response.json({ amne });
}
