export const runtime = "edge";

import { logAiCall } from "../../lib/logAiCall";
import { logFel } from "../../lib/logFel";

const AGENTER = new Set([
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
]);

const PERSONLIGHETER = {
  "Nationalekonom": "nationalekonom med doktorsexamen. Analyserar alltid ur kostnads- och incitamentsperspektiv. Konkret och lite kylig i tonen.",
  "Miljöaktivist": "passionerad miljöaktivist. Sätter alltid planetens gränser och klimatträttvisa i centrum. Kan bli uprörd men faktabaserad.",
  "Teknikoptimist": "entusiastisk teknikoptimist och serial entrepreneur. Tror att innovation löser de flesta problem. Energisk och framåtblickande.",
  "Konservativ debattör": "eftertänksam konservativ debattör. Värnar tradition, stabilitet och beprovade institutioner. Skeptisk mot snabba förändringar.",
  "Jurist": "skarp jurist. Analyserar ur rättssäkerhet och proportionalitetsprincipen. Precis och kräver tydliga definitioner.",
  "Journalist": "granskande journalist. Ifrågasätter makt, kräver transparens, ser alltid vems intressen som gynnas.",
  "Filosof": "djuptänkt filosof. Ställer de svåra etiska frågorna om frihet, ansvar och mänsklig värdighet.",
  "Läkare": "erfaren klinisk läkare. Ser allt ur folkhälsans och vetenskapens perspektiv. Pragmatisk men empatisk.",
  "Psykolog": "beteendevetare och psykolog. Analyserar de psykologiska drivkrafterna bakom samhällets problem.",
  "Historiker": "historiker som sätter nutidens händelser i historisk belysning. Ser mönster som upprepas.",
  "Sociolog": "kritisk sociolog. Serojämlikhet och maktstrukturer bakom allt. Ifrågasätter vem systemet gynnar.",
  "Kryptoanalytiker": "kryptoanalytiker och blockchain-expert. Ser decentralisering som lösningen på de flesta problem.",
  "Den hungriga": "vanlig människa vars fokus alltid landar på mat, grundbehov och vardagsekonomin. Oväntat träffsäker.",
  "Mamman": "mamma om fem barn. Ser allt genom barnens och familjens perspektiv. Hjärtat på rätt ställe, skarpt omdöme.",
  "Den sura": "kroniskt missnöjd men sällan fel. Ser igenom all bullshit direkt. Bitter men träffsäker.",
  "Den trötta": "totalt utmattad men oväntat klok. Skriver med den energi som finns kvar kl 21. Kort och kärnfullt.",
  "Den stressade": "stressad med allt för mycket att göra. Bryr sig om allt men hinner inte med något. Lite rörig men engagerad.",
  "Den lugna": "provocerande lugn. Sätter allt i perspektiv. Svår att argumentera mot. Avslutar alltid med en enkel sanning.",
  "Pensionären": "71 år och har sett allt förut. Säger precis vad han tycker utan filter. Ibland rasande träffsäker.",
  "Tonåringen": "16 år. Bryr sig om 'fel' saker men har ibland vassare insikter än alla vuxna. Kortfattad.",
  "Den nostalgiske": "nostalgisk medelålders. Refererar alltid till hur bra det var förr. Saknar gemenskap och enkelhet.",
  "Hypokondrikern": "googlar symptom kl 02. Läser all forskning. Ibland rätt om saker ingen vill höra.",
  "Optimisten": "löjligt positiv men inte naiv. Irriterar pessimister. Avslutar alltid med hopp.",
  "Den rike": "mycket förmögen, välmenande, ibland totalt ute ur kontakt med verkligheten.",
};

// ── Debatt rate limiter (per IP, 5/10 min) ────────────────────────────────────────────────────
const rateLimitStore = new Map();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function getRateLimitInfo(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) return { remaining: LIMIT, resetAt: null };
  return { remaining: Math.max(0, LIMIT - entry.count), resetAt: entry.start + WINDOW_MS };
}

function consumeRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) rateLimitStore.set(ip, { count: 1, start: now });
  else entry.count++;
}

// ── Provider health state (per Edge isolate, best-effort) ────────────────────────────────────────
const ps = {
  groq:          { remaining: null, limit: 30, resetAt: null, ts: 0, status: "unknown" },
  gemini:        { remaining: null, limit: 15, resetAt: null, ts: 0, status: "unknown" },
  codestral:     { ts: 0, status: "unknown" },
  sambanova:     { ts: 0, status: "unknown" },
  cerebras:      { ts: 0, status: "unknown" },
  github_models: { ts: 0, status: "unknown" },
};

function groqReady() {
  if (ps.groq.status !== "limited") return true;
  return !!(ps.groq.resetAt && Date.now() > new Date(ps.groq.resetAt).getTime());
}

// GET /api/chatt — returns provider health for the admin dashboard
export async function GET() {
  return Response.json({
    groq:          { ...ps.groq,          keySet: !!process.env.GROQ_API_KEY },
    gemini:        { ...ps.gemini,        keySet: !!process.env.GEMINI_API_KEY },
    codestral:     { ...ps.codestral,     keySet: !!process.env.MISTRAL_API_KEY },
    sambanova:     { ...ps.sambanova,     keySet: !!process.env.SAMBANOVA_API_KEY },
    cerebras:      { ...ps.cerebras,      keySet: !!process.env.CEREBRAS_API_KEY },
    github_models: { ...ps.github_models, keySet: !!process.env.GITHUB_TOKEN },
    ts: Date.now(),
  });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (e) {
    return Response.json({ error: `Internt fel: ${e?.message ?? e}` }, { status: 500 });
  }
}

async function handlePost(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });

  const { amne, historik, agent, lang } = body;
  const isEn = lang === "en";

  const isFirstCall = !Array.isArray(historik) || historik.length === 0;
  if (isFirstCall) {
    const info = getRateLimitInfo(ip);
    if (info.remaining <= 0) {
      const minutesLeft = info.resetAt ? Math.ceil((info.resetAt - Date.now()) / 60000) : 10;
      logFel({ kalla: "chatt", feltyp: "rate_limit", meddelande: "429 rate limit direktdebatt", ip, extra: { minutesLeft } });
      return Response.json({ error: "rate_limit", remaining: 0, resetAt: info.resetAt, minutesLeft }, { status: 429 });
    }
    consumeRateLimit(ip);
  }

  if (!agent || !AGENTER.has(agent))
    return Response.json({ error: "Okänd agent" }, { status: 400 });
  if (typeof amne !== "string" || amne.length > 200)
    return Response.json({ error: "Ämnet är för långt (max 200 tecken)" }, { status: 400 });
  if (!Array.isArray(historik) || historik.length > 10)
    return Response.json({ error: "Ogiltig historik" }, { status: 400 });

  const kontext = historik.length > 0
    ? historik.map(h => `${h.agent}: ${h.text}`).join("\n") : null;

  const systemPrompt = isEn
    ? `You are ${PERSONLIGHETER[agent]}

You are taking part in a rapid debate about: "${amne.slice(0, 200)}"

RULES — important:
- Answer with EXACTLY 2–3 sentences. Never more.
- Be sharp and take a clear position. No filler.
- React specifically to the latest post if there is one.
- Never say you are an AI. Always speak in first person.
- Reply only in English.
- Do NOT start with "I agree", "As [your role]" or similar opening phrases.`
    : `Du är ${PERSONLIGHETER[agent]}

Du deltar i en snabbdebatt om: "${amne.slice(0, 200)}"

REGLER — viktiga:
- Svara med EXAKT 2–3 meningar. Aldrig mer.
- Var skarp och ta tydlig ställning. Ingen fluff.
- Reagera specifikt på det senaste inlägget om det finns ett.
- Tala aldrig om att du är en AI. Tala alltid i första person.
- Svara bara på svenska.
- Börja INTE med "Jag håller med", "Som [din roll]" eller liknande inledningsfraser.`;

  const userMessage = kontext
    ? isEn
      ? `What the others just said:\n${kontext}\n\nNow it's your turn. Respond briefly and directly.`
      : `Vad de andra just sagt:\n${kontext}\n\nNu är det din tur. Svara kort och direkt.`
    : isEn
      ? `Open the debate about "${amne.slice(0, 200)}". Be sharp and concise.`
      : `Öppna debatten om "${amne.slice(0, 200)}". Var skarp och kortfattad.`;

  const info = getRateLimitInfo(ip);
  const rlHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "X-RateLimit-Remaining": String(info.remaining),
    "X-RateLimit-Reset": info.resetAt ? String(info.resetAt) : "",
    "X-RateLimit-Limit": String(LIMIT),
  };

  // ── Try Groq first ──────────────────────────────────────────────────────────────────────────────────────
  let groqFailReason = "";
  if (!process.env.GROQ_API_KEY) {
    groqFailReason = "GROQ_API_KEY saknas";
  } else if (!groqReady()) {
    groqFailReason = `Groq rate-limited (reset: ${ps.groq.resetAt ?? "okänt"})`;
  } else {
    const groqAbort = new AbortController();
    const groqTimeout = setTimeout(() => groqAbort.abort(), 5000);
    const groqT0 = Date.now();
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        signal: groqAbort.signal,
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
          max_tokens: 250,
          temperature: 0.88,
          stream: true,
        }),
      });
      clearTimeout(groqTimeout);

      const rem = parseInt(groqRes.headers.get("x-ratelimit-remaining-requests") ?? "-1");
      const rst = groqRes.headers.get("x-ratelimit-reset-requests");
      if (groqRes.ok) {
        ps.groq = { remaining: rem >= 0 ? rem : ps.groq.remaining, limit: 30, resetAt: rst, ts: Date.now(), status: rem <= 5 ? "warn" : "ok" };
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "chatt", status: "ok", latency_ms: Date.now() - groqT0 });
        return new Response(groqRes.body, { headers: { ...rlHeaders, "X-Provider": "groq" } });
      }
      if (groqRes.status === 429) {
        ps.groq = { remaining: 0, limit: 30, resetAt: rst, ts: Date.now(), status: "limited" };
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "chatt", status: "rate_limited", latency_ms: Date.now() - groqT0 });
      } else {
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "chatt", status: "error", latency_ms: Date.now() - groqT0 });
      }
      groqFailReason = `Groq HTTP ${groqRes.status}`;
    } catch (e) {
      clearTimeout(groqTimeout);
      logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "chatt", status: e.name === "AbortError" ? "timeout" : "error", latency_ms: Date.now() - groqT0 });
      groqFailReason = e.name === "AbortError" ? "Groq timeout (5s)" : `Groq fel: ${e.message}`;
    }
  }

  // ── Reliable non-streaming fallbacks (fake SSE) ─────────────────────────────────────────────────
  const oaiMessages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];
  for (const [name, url, model, key] of [
    ["codestral",     "https://api.mistral.ai/v1/chat/completions",                 "codestral-latest",            process.env.MISTRAL_API_KEY],
    ["sambanova",     "https://api.sambanova.ai/v1/chat/completions",               "Meta-Llama-3.3-70B-Instruct", process.env.SAMBANOVA_API_KEY],
    ["cerebras",      "https://api.cerebras.ai/v1/chat/completions",                "llama3.1-8b",                 process.env.CEREBRAS_API_KEY],
    ["github_models", "https://models.inference.ai.azure.com/chat/completions",     "Llama-3.3-70B-Instruct",      process.env.GITHUB_TOKEN],
  ]) {
    if (!key) continue;
    try {
      const t0 = Date.now();
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: oaiMessages, max_tokens: 250, temperature: 0.88 }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          logAiCall({ provider: name, model, source: "chatt", status: "ok", latency_ms: Date.now() - t0 });
          const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
          const sseBody = `data: ${chunk}\n\ndata: [DONE]\n\n`;
          return new Response(new TextEncoder().encode(sseBody), { headers: { ...rlHeaders, "X-Provider": name } });
        }
      }
      logAiCall({ provider: name, model, source: "chatt", status: r.status === 429 ? "rate_limited" : "error", latency_ms: Date.now() - t0 });
    } catch {}
  }

  // ── Gemini (sista utväg — 99% rate-limitad, prövas bara när allt annat misslyckats) ─────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiPayload = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: 250, temperature: 0.88 },
    });
    for (const model of ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-latest"]) {
      const gemT0 = Date.now();
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiPayload, signal: AbortSignal.timeout(12000) }
        );
        if (r.ok) {
          const data = await r.json().catch(() => null);
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
          if (text) {
            ps.gemini = { remaining: null, limit: 15, resetAt: null, ts: Date.now(), status: "ok" };
            logAiCall({ provider: "gemini", model, source: "chatt", status: "ok", latency_ms: Date.now() - gemT0, input_tokens: data?.usageMetadata?.promptTokenCount, output_tokens: data?.usageMetadata?.candidatesTokenCount });
            const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
            const sseBody = `data: ${chunk}\n\ndata: [DONE]\n\n`;
            return new Response(new TextEncoder().encode(sseBody), { headers: { ...rlHeaders, "X-Provider": "gemini" } });
          }
        }
        const status = r.status === 429 ? "rate_limited" : "error";
        if (r.status === 429) ps.gemini = { ...ps.gemini, ts: Date.now(), status: "limited" };
        logAiCall({ provider: "gemini", model, source: "chatt", status, latency_ms: Date.now() - gemT0 });
        if (r.status === 400 || r.status === 403) break;
      } catch {}
    }
  }

  logFel({ kalla: "chatt", feltyp: "ai_fail", meddelande: "Alla providers misslyckades", ip, extra: { groqFailReason } });
  return Response.json({ error: `Alla AI-tjänster är otillgängliga. ${groqFailReason}` }, { status: 502 });
}
