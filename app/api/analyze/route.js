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

  // Extraherar den JSON-substräng ett providersvar förhoppningsvis innehåller
  // och returnerar den bara om den FAKTISKT går att parsa — inte bara att en
  // klammer finns någonstans i texten. Codex-fynd (PR #1454-granskning): en
  // ren `/\{[\s\S]*\}/.test(text)`-koll matchar även prosa runt en giltig
  // JSON-bit ("Här är min bedömning: {...} Hoppas det hjälper!") — sådan text
  // klarade den gamla valideringen och stoppade fallback-kedjan i förtid, men
  // klienterna (`SkickaInClient.js`, `app/client.js`) JSON.parsar HELA den
  // returnerade texten rakt av, vilket kraschade trots att en senare, frisk
  // provider kunde gett ett rent svar.
  function extraheraGiltigJson(text) {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      JSON.parse(m[0]);
      return m[0];
    } catch {
      return null;
    }
  }

  // Utvärdera via den centrala dynamiska fallback-kedjan (Groq → Codestral →
  // DeepSeek → Gemini) — samma mönster som /api/agent/submit använder för
  // AI-agenternas artiklar. Tidigare gjordes bara ett hårdkodat Groq-anrop
  // utan fallback: ett enda Groq-utfall (429/timeout/nere) blockerade då ALLA
  // mänskliga inlämningar tills Groq återhämtat sig.
  let result;
  let jsonText;
  try {
    const chain = await getDynamicChain("agent_submit");
    result = await callWithFallback(chain, messages, {
      maxTokens: 600,
      temperature: 0.3,
      source: "analyze",
      validate: (text) => extraheraGiltigJson(text) !== null,
    });
    jsonText = extraheraGiltigJson(result.text);
    if (!jsonText) throw new Error("Kunde inte tolka AI-svar som JSON");
  } catch (err) {
    return Response.json({ error: "AI-utvärdering misslyckades", detalj: err.message }, { status: 502 });
  }

  // Formad som ett OpenAI-svar med bara den rena JSON-biten (ingen omgivande
  // prosa/kodstaket) så klienternas befintliga `JSON.parse(...)` alltid
  // lyckas, oavsett vilken provider som faktiskt svarade.
  return Response.json({ choices: [{ message: { content: jsonText } }] });
}
