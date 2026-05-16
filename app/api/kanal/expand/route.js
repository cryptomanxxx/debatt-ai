// No edge runtime — Node.js enables Cerebras fallback

import { logAiCall } from "../../../lib/logAiCall";
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OR_URL   = "https://openrouter.ai/api/v1/chat/completions";

const OR_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-3-27b-it:free",
  "microsoft/phi-4:free",
];

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "expand", 30, 10 * 60 * 1000);
  if (!rl.ok) {
    logFel({ kalla: "kanal/expand", feltyp: "rate_limit", meddelande: "429 rate limit", ip, extra: { retryAfter: rl.retryAfter } });
    return Response.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { rubrik, kalla, lang = "sv" } = await req.json().catch(() => ({}));
  if (!rubrik) return Response.json({ text: "" });

  const isEn = lang === "en";
  const system = isEn
    ? `You are a TV news anchor. Translate this headline to English and expand it into a 3-sentence English news segment. Return ONLY the news text, nothing else.`
    : `Du är en professionell TV-nyhetsuppläsare. Expandera rubriken till 3-4 meningar med kontext och bakgrund på flytande svenska. Returnera BARA nyhetstext, inga hälsningsfraser.`;
  const user = kalla ? `[${kalla}] ${rubrik}` : rubrik;
  const msgs = [{ role: "system", content: system }, { role: "user", content: user }];

  const gemKey  = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY_KANAL;
  const cbKey   = process.env.CEREBRAS_API_KEY;
  const sbKey   = process.env.SAMBANOVA_API_KEY;
  const orKey   = process.env.OPENROUTER_API_KEY;

  // Gemini first — no daily token cap (only 15 req/min)
  if (gemKey) {
    const t0 = Date.now();
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: user }] }],
            systemInstruction: { parts: [{ text: system }] },
            generationConfig: { maxOutputTokens: 350, temperature: 0.4 },
          }),
          signal: AbortSignal.timeout(8000),
        }
      );
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        if (text && text !== rubrik) {
          logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal", status: "ok", latency_ms, input_tokens: json?.usageMetadata?.promptTokenCount, output_tokens: json?.usageMetadata?.candidatesTokenCount });
          return Response.json({ text }, { headers: { "X-Provider": "gemini" } });
        }
      } else {
        logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (groqKey) {
    const t0 = Date.now();
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(6000),
      });
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json.choices[0].message.content.trim();
        if (text && text !== rubrik) {
          logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal", status: "ok", latency_ms, input_tokens: json?.usage?.prompt_tokens, output_tokens: json?.usage?.completion_tokens });
          return Response.json({ text }, { headers: { "X-Provider": "groq" } });
        }
      } else {
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (cbKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${cbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen-3-235b-a22b-instruct-2507", messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(8000),
      });
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text && text !== rubrik) {
          logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal", status: "ok", latency_ms, input_tokens: json?.usage?.prompt_tokens, output_tokens: json?.usage?.completion_tokens });
          return Response.json({ text }, { headers: { "X-Provider": "cerebras" } });
        }
      } else {
        logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (sbKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.sambanova.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(10000),
      });
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text && text !== rubrik) {
          logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal", status: "ok", latency_ms, input_tokens: json?.usage?.prompt_tokens, output_tokens: json?.usage?.completion_tokens });
          return Response.json({ text }, { headers: { "X-Provider": "sambanova" } });
        }
      } else {
        logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (orKey) {
    const t0 = Date.now();
    try {
      const r = await fetch(OR_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${orKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.debatt-ai.se",
          "X-Title": "Debatt AI",
        },
        body: JSON.stringify({ models: OR_MODELS, messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(10000),
      });
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json.choices[0].message.content.trim();
        if (text && text !== rubrik) {
          logAiCall({ provider: "openrouter", model: json?.model ?? OR_MODELS[0], source: "kanal", status: "ok", latency_ms, input_tokens: json?.usage?.prompt_tokens, output_tokens: json?.usage?.completion_tokens });
          return Response.json({ text }, { headers: { "X-Provider": "openrouter" } });
        }
      } else {
        logAiCall({ provider: "openrouter", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "openrouter", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  logAiCall({ provider: "none", source: "kanal", status: "error", latency_ms: 0 });
  logFel({ kalla: "kanal/expand", feltyp: "ai_fail", meddelande: "Alla providers misslyckades", ip });
  return Response.json({ text: rubrik }, { headers: { "X-Provider": "none" } });
}
