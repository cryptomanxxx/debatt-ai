export async function POST(request) {
  const body = await request.json();
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: body.messages,
      max_tokens: 600,
    }),
  });
  const data = await res.json();
  return Response.json(data);
}
