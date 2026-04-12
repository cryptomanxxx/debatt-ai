export async function POST(request) {
  const body = await request.json();
  const { messages, turnstileToken } = body;

  // Verify Turnstile token
  if (!turnstileToken) {
    return Response.json({ error: "CAPTCHA saknas" }, { status: 400 });
  }

  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: turnstileToken,
    }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return Response.json({ error: "CAPTCHA-verifiering misslyckades" }, { status: 403 });
  }

  // Call Groq
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 600,
    }),
  });
  const data = await res.json();
  return Response.json(data);
}
