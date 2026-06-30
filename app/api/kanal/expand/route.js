// No edge runtime — Node.js enables full provider set

import { logAiCall } from "../../../lib/logAiCall";
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { providerReady, markProviderDown } from "../../../lib/aiCircuitBreaker";

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

  const csKey  = process.env.MISTRAL_API_KEY;
  const sbKey  = process.env.SAMBANOVA_API_KEY;
  const dsKey  = process.env.DEEPSEEK_API_KEY;
  const cfAcc  = process.env.CF_ACCOUNT_ID;
  const cfTok  = process.env.CF_API_TOKEN;
  const groqKey = process.env.GROQ_API_KEY_KANAL;

  // 1. Mistral/Codestral — 10/10, 0.97s
  if (csKey && providerReady("mistral")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${csKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "codestral-latest", messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(10000),
      });
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text && text !== rubrik) {
          logAiCall({ provider: "codestral", model: "codestral-latest", source: "kanal", status: "ok", latency_ms, input_tokens: json?.usage?.prompt_tokens, output_tokens: json?.usage?.completion_tokens });
          return Response.json({ text }, { headers: { "X-Provider": "codestral" } });
        }
      } else {
        if (r.status === 429) markProviderDown("mistral");
        logAiCall({ provider: "codestral", model: "codestral-latest", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "codestral", model: "codestral-latest", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  // 2. Sambanova — 10/10, 1.41s
  if (sbKey && providerReady("sambanova")) {
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
        if (r.status === 429) markProviderDown("sambanova");
        logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  // 3. DeepSeek — 10/10, 2.67s
  if (dsKey && providerReady("deepseek")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${dsKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(12000),
      });
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (text && text !== rubrik) {
          logAiCall({ provider: "deepseek", model: "deepseek-chat", source: "kanal", status: "ok", latency_ms, input_tokens: json?.usage?.prompt_tokens, output_tokens: json?.usage?.completion_tokens });
          return Response.json({ text }, { headers: { "X-Provider": "deepseek" } });
        }
      } else {
        if (r.status === 429) markProviderDown("deepseek");
        logAiCall({ provider: "deepseek", model: "deepseek-chat", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "deepseek", model: "deepseek-chat", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  // 4. Cloudflare — 10/10, 4.86s
  if (cfAcc && cfTok && providerReady("cloudflare")) {
    const t0 = Date.now();
    try {
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAcc}/ai/run/@cf/meta/llama-3.3-70b-instruct`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfTok}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, max_tokens: 350 }),
        signal: AbortSignal.timeout(20000),
      });
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json?.result?.response?.trim() ?? "";
        if (text && text !== rubrik) {
          logAiCall({ provider: "cloudflare", model: "llama-3.3-70b-instruct", source: "kanal", status: "ok", latency_ms });
          return Response.json({ text }, { headers: { "X-Provider": "cloudflare" } });
        }
      } else {
        if (r.status === 429) markProviderDown("cloudflare");
        logAiCall({ provider: "cloudflare", model: "llama-3.3-70b-instruct", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "cloudflare", model: "llama-3.3-70b-instruct", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  // 5. Groq — 7/10, 0.75s (sista utväg)
  if (groqKey && providerReady("groq_kanal")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-specdec", messages: msgs, max_tokens: 350, temperature: 0.4 }),
        signal: AbortSignal.timeout(6000),
      });
      const latency_ms = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json.choices[0].message.content.trim();
        if (text && text !== rubrik) {
          logAiCall({ provider: "groq", model: "llama-3.3-70b-specdec", source: "kanal", status: "ok", latency_ms, input_tokens: json?.usage?.prompt_tokens, output_tokens: json?.usage?.completion_tokens });
          return Response.json({ text }, { headers: { "X-Provider": "groq" } });
        }
      } else {
        if (r.status === 429) markProviderDown("groq_kanal");
        logAiCall({ provider: "groq", model: "llama-3.3-70b-specdec", source: "kanal", status: r.status === 429 ? "rate_limited" : "error", latency_ms });
      }
    } catch {
      logAiCall({ provider: "groq", model: "llama-3.3-70b-specdec", source: "kanal", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  logAiCall({ provider: "none", source: "kanal", status: "error", latency_ms: 0 });
  logFel({ kalla: "kanal/expand", feltyp: "ai_fail", meddelande: "Alla providers misslyckades", ip });
  return Response.json({ text: rubrik }, { headers: { "X-Provider": "none" } });
}
