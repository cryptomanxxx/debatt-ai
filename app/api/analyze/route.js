import { checkRateLimit } from "../../lib/kanalRateLimit";

const MAX_MESSAGES = 4;
const MAX_TOTAL_CHARS = 12_000; // tak för total promptlängd för att skydda Groq rate-limit
const GROQ_TIMEOUT_MS = 20_000;

export async function POST(request) {
  // IP-rate-limit utöver Turnstile — 5 anrop/timme per IP
  const rl = checkRateLimit(request, "analyze", 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ error: "För många förfrågningar. Försök igen senare." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ogiltig JSON" }, { status: 400 });
  }
  const { messages, turnstileToken } = body;

  // Validera meddelandestruktur — klienten ska inte kunna pumpa godtyckliga prompts
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return Response.json({ error: "Ogiltigt meddelandeformat" }, { status: 400 });
  }
  let totalChars = 0;
  for (const m of messages) {
    if (!m || typeof m.content !== "string" || !m.content.trim()) {
      return Response.json({ error: "Ogiltigt meddelandeformat" }, { status: 400 });
    }
    totalChars += m.content.length;
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    return Response.json({ error: `Texten är för lång (max ${MAX_TOTAL_CHARS} tecken).` }, { status: 400 });
  }

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
  let res;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
    });
  } catch {
    return Response.json({ error: "AI-tjänsten svarar inte" }, { status: 502 });
  }
  if (!res.ok) {
    return Response.json({ error: "AI-utvärdering misslyckades" }, { status: 502 });
  }
  const data = await res.json();
  return Response.json(data);
}
