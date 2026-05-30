// No edge runtime — Node.js enables Cerebras fallback

import { logAiCall } from "../../../lib/logAiCall";
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { providerReady, markProviderDown } from "../../../lib/aiCircuitBreaker";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function parseNumberedList(text, count) {
  const lines = text.split("\n");
  const result = [];
  for (const line of lines) {
    const m = line.match(/^\d+\.\s+(.+)$/);
    if (m) result.push(m[1].trim());
  }
  return result.length === count ? result : null;
}

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "batch-expand", 5, 10 * 60 * 1000);
  if (!rl.ok) {
    logFel({ kalla: "kanal/batch-expand", feltyp: "rate_limit", meddelande: "429 rate limit", ip, extra: { retryAfter: rl.retryAfter } });
    return Response.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { items } = await req.json().catch(() => ({}));
  if (!Array.isArray(items) || !items.length) return Response.json({ expanded: [] });

  const system = `Du är en professionell TV-nyhetsuppläsare. Expandera varje rubrik till 2 meningar med kontext och bakgrund på flytande svenska. Returnera BARA en numrerad lista, en expansion per rad, i samma ordning. Inga radbrytningar inom en expansion.
Exempel:
1. Expanderad nyhetstext för rubrik ett på en rad.
2. Expanderad nyhetstext för rubrik två på en rad.`;

  const user = items.map((item, i) => `${i + 1}. [${item.kalla || ""}] ${item.rubrik}`).join("\n");
  const msgs = [{ role: "system", content: system }, { role: "user", content: user }];

  const gemKey  = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY_KANAL;
  const csKey   = process.env.MISTRAL_API_KEY;
  const sbKey   = process.env.SAMBANOVA_API_KEY;
  const cbKey   = process.env.CEREBRAS_API_KEY;

  if (groqKey && providerReady("groq_kanal")) {
    const t0 = Date.now();
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 1200, temperature: 0.3 }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices[0].message.content.trim();
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        if (r.status === 429) markProviderDown("groq_kanal");
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (csKey && providerReady("mistral")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${csKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "codestral-latest", messages: msgs, max_tokens: 1200, temperature: 0.3 }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "codestral", model: "codestral-latest", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "codestral", model: "codestral-latest", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        if (r.status === 429) markProviderDown("mistral");
        logAiCall({ provider: "codestral", model: "codestral-latest", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "codestral", model: "codestral-latest", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (sbKey && providerReady("sambanova")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.sambanova.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 1200, temperature: 0.3 }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        if (r.status === 429) markProviderDown("sambanova");
        logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (cbKey && providerReady("cerebras")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${cbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-oss-120b", messages: msgs, max_tokens: 1200, temperature: 0.3 }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "cerebras", model: "gpt-oss-120b", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "cerebras", model: "gpt-oss-120b", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        if (r.status === 429) markProviderDown("cerebras");
        logAiCall({ provider: "cerebras", model: "gpt-oss-120b", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "cerebras", model: "gpt-oss-120b", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  const ghKey = process.env.GITHUB_TOKEN;
  if (ghKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${ghKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 1200, temperature: 0.3 }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "github_models", model: "Llama-3.3-70B-Instruct", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0 });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "github_models", model: "Llama-3.3-70B-Instruct", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        logAiCall({ provider: "github_models", model: "Llama-3.3-70B-Instruct", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "github_models", model: "Llama-3.3-70B-Instruct", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  // Gemini (sista utväg — ofta rate-limitad)
  if (gemKey && providerReady("gemini")) {
    const t0 = Date.now();
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: user }] }], systemInstruction: { parts: [{ text: system }] }, generationConfig: { maxOutputTokens: 1200, temperature: 0.3 } }), signal: AbortSignal.timeout(15000) }
      );
      if (r.ok) {
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usageMetadata?.promptTokenCount ?? null, output_tokens: json.usageMetadata?.candidatesTokenCount ?? null });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        if (r.status === 429) markProviderDown("gemini");
        logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  logAiCall({ provider: "none", model: null, source: "kanal-batch", status: "all_failed", latency_ms: 0 });
  logFel({ kalla: "kanal/batch-expand", feltyp: "ai_fail", meddelande: "Alla providers misslyckades", ip });
  return Response.json({ expanded: [] });
}
