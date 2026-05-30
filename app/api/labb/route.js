import { checkRateLimit } from "../../lib/kanalRateLimit";
import { logAiCall } from "../../lib/logAiCall";
import { logFel, getIp } from "../../lib/logFel";
import { providerReady, markProviderDown } from "../../lib/aiCircuitBreaker";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side deduplicering: blockerar identiska requests inom 10 sekunder
const recentDedup = new Map();
function dedupCheck(ip, amne, aggressivitet, faktafokus, humor, optimism) {
  const key = `${ip}_${amne.slice(0, 40)}_${aggressivitet}_${faktafokus}_${humor}_${optimism}`;
  const now = Date.now();
  for (const [k, ts] of recentDedup) { if (now - ts > 10000) recentDedup.delete(k); }
  if (recentDedup.has(key)) return true; // duplikat
  recentDedup.set(key, now);
  return false;
}

async function logLabb({ amne, aggressivitet, faktafokus, humor, optimism, provider }) {
  try {
    await fetch(`${SB_URL}/rest/v1/labb_log`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ amne: amne.slice(0, 300), aggressivitet, faktafokus, humor, optimism, provider }),
    });
  } catch {}
}

function buildSystemPrompt(aggressivitet, faktafokus, humor, optimism) {
  const aggrDesc =
    aggressivitet < 25 ? "försiktig och diplomatisk" :
    aggressivitet < 50 ? "bestämd men respektfull" :
    aggressivitet < 75 ? "direkt och utmanande" :
    "skarp, konfrontativ och provocerande";

  const faktaDesc =
    faktafokus < 25 ? "argumenterar intuitivt och känslomässigt, inga siffror eller data" :
    faktafokus < 50 ? "blandar personliga tolkningar med enstaka fakta" :
    faktafokus < 75 ? "stödjer påståenden med konkreta exempel och logik" :
    "strikt analytisk och datadriven, refererar till siffror och forskning";

  const humDesc =
    humor < 25 ? "helt allvarlig och saklig — noll humor" :
    humor < 50 ? "mestadels seriös med enstaka lättsamma formuleringar" :
    humor < 75 ? "lättsam och ironisk, humor är ett retoriskt verktyg" :
    "skämtsam och satirisk — humor är genomgående i varje mening";

  const optDesc =
    optimism < 25 ? "djupt pessimistisk — betonar risker, problem och katastrofscenarier" :
    optimism < 50 ? "skeptisk och kritisk — ifrågasätter framsteg och goda intentioner" :
    optimism < 75 ? "försiktigt optimistisk — ser möjligheter men erkänner hinder" :
    "genuint och smittande optimistisk — fokuserar på lösningar och framtidstro";

  return `Du är en AI-debattör med följande personlighetsprofil:
- Ton: ${aggrDesc}
- Argumentation: ${faktaDesc}
- Stil: ${humDesc}
- Världssyn: ${optDesc}

Skriv ett kort debattinlägg på 3–5 meningar om det givna ämnet. Anpassa din ton och stil exakt efter personlighetsprofilen ovan. Inga hälsningsfraser eller inledningsfraser — börja direkt med argumentet. Skriv på svenska.`;
}

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "labb", 10, 10 * 60 * 1000);
  if (!rl.ok) return Response.json({ error: "För många försök. Vänta en stund." }, { status: 429 });

  const { amne, aggressivitet, faktafokus, humor, optimism } = await req.json().catch(() => ({}));
  if (!amne || typeof amne !== "string" || amne.trim().length < 5) {
    return Response.json({ error: "Ange ett ämne (minst 5 tecken)." }, { status: 400 });
  }

  if (dedupCheck(ip, amne.trim(), Number(aggressivitet)||50, Number(faktafokus)||50, Number(humor)||50, Number(optimism)||50)) {
    return Response.json({ error: "Duplicat — vänta en stund." }, { status: 429 });
  }

  const system = buildSystemPrompt(
    Number(aggressivitet) || 50,
    Number(faktafokus) || 50,
    Number(humor) || 50,
    Number(optimism) || 50,
  );
  const msgs = [
    { role: "system", content: system },
    { role: "user", content: `Ämne: "${amne.trim().slice(0, 300)}"` },
  ];

  const gemKey  = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const cbKey   = process.env.CEREBRAS_API_KEY;
  const sbKey   = process.env.SAMBANOVA_API_KEY;
  const ghKey   = process.env.GITHUB_TOKEN;

  if (groqKey && providerReady("groq")) {
    const t0 = Date.now();
    try {
      const r = await fetch(GROQ_URL, { method: "POST", headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 250, temperature: 1.0 }),
        signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) { logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "labb", status: "ok", latency_ms: Date.now() - t0 }); await logLabb({ amne: amne.trim(), aggressivitet: Number(aggressivitet)||50, faktafokus: Number(faktafokus)||50, humor: Number(humor)||50, optimism: Number(optimism)||50, provider: "groq" }); return Response.json({ svar: text }); }
      }
      if (r.status === 429) markProviderDown("groq");
    } catch {}
  }

  if (cbKey && providerReady("cerebras")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.cerebras.ai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${cbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-oss-120b", messages: msgs, max_tokens: 250, temperature: 1.0 }),
        signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) { logAiCall({ provider: "cerebras", model: "gpt-oss-120b", source: "labb", status: "ok", latency_ms: Date.now() - t0 }); await logLabb({ amne: amne.trim(), aggressivitet: Number(aggressivitet)||50, faktafokus: Number(faktafokus)||50, humor: Number(humor)||50, optimism: Number(optimism)||50, provider: "cerebras" }); return Response.json({ svar: text }); }
      }
      if (r.status === 429) markProviderDown("cerebras");
    } catch {}
  }

  if (sbKey && providerReady("sambanova")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.sambanova.ai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 250, temperature: 1.0 }),
        signal: AbortSignal.timeout(10000) });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) { logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "labb", status: "ok", latency_ms: Date.now() - t0 }); await logLabb({ amne: amne.trim(), aggressivitet: Number(aggressivitet)||50, faktafokus: Number(faktafokus)||50, humor: Number(humor)||50, optimism: Number(optimism)||50, provider: "sambanova" }); return Response.json({ svar: text }); }
      }
      if (r.status === 429) markProviderDown("sambanova");
    } catch {}
  }

  if (gemKey && providerReady("gemini")) {
    const t0 = Date.now();
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: msgs[1].content }] }], systemInstruction: { parts: [{ text: system }] }, generationConfig: { maxOutputTokens: 250, temperature: 1.0 } }),
          signal: AbortSignal.timeout(8000) }
      );
      if (r.ok) {
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        if (text) { logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "labb", status: "ok", latency_ms: Date.now() - t0 }); await logLabb({ amne: amne.trim(), aggressivitet: Number(aggressivitet)||50, faktafokus: Number(faktafokus)||50, humor: Number(humor)||50, optimism: Number(optimism)||50, provider: "gemini" }); return Response.json({ svar: text }); }
      }
      if (r.status === 429) markProviderDown("gemini");
    } catch {}
  }

  if (ghKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://models.inference.ai.azure.com/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${ghKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 250, temperature: 1.0 }),
        signal: AbortSignal.timeout(12000) });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) { logAiCall({ provider: "github_models", model: "Llama-3.3-70B-Instruct", source: "labb", status: "ok", latency_ms: Date.now() - t0 }); await logLabb({ amne: amne.trim(), aggressivitet: Number(aggressivitet)||50, faktafokus: Number(faktafokus)||50, humor: Number(humor)||50, optimism: Number(optimism)||50, provider: "github_models" }); return Response.json({ svar: text }); }
      }
    } catch {}
  }

  logFel({ kalla: "api/labb", feltyp: "ai_fail", meddelande: "Alla providers misslyckades", ip });
  return Response.json({ error: "AI svarar inte just nu. Försök igen." }, { status: 503 });
}
