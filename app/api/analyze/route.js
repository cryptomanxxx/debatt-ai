import { checkRateLimit } from "../../lib/kanalRateLimit";
import { getDynamicChain, callWithFallback } from "../../lib/aiRouter";

const MAX_MESSAGES = 4;
const MAX_TOTAL_CHARS = 12_000; // tak för total promptlängd för att skydda providerns rate-limit

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

  // Utvärdera via den centrala dynamiska fallback-kedjan (Groq → Codestral →
  // DeepSeek → Gemini) — samma mönster som /api/agent/submit använder för
  // AI-agenternas artiklar. Tidigare gjordes bara ett hårdkodat Groq-anrop
  // utan fallback: ett enda Groq-utfall (429/timeout/nere) blockerade då ALLA
  // mänskliga inlämningar tills Groq återhämtat sig.
  let result;
  try {
    const chain = await getDynamicChain("agent_submit");
    result = await callWithFallback(chain, messages, {
      maxTokens: 600,
      temperature: 0.3,
      source: "analyze",
      validate: (text) => /\{[\s\S]*\}/.test(text),
    });
  } catch (err) {
    return Response.json({ error: "AI-utvärdering misslyckades", detalj: err.message }, { status: 502 });
  }

  // Formad som ett OpenAI-svar så klientens befintliga parsning
  // (data.choices[0].message.content) fungerar oförändrat oavsett vilken
  // provider som faktiskt svarade.
  return Response.json({ choices: [{ message: { content: result.text } }] });
}
