// No edge runtime — Node.js enables full provider set

import { logAiCall } from "../../../lib/logAiCall";
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { providerReady, markProviderDown } from "../../../lib/aiCircuitBreaker";

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

  // 2. Sambanova — 10/10, 1.41s
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

  // 3. DeepSeek — 10/10, 2.67s
  if (dsKey && providerReady("deepseek")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${dsKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", messages: msgs, max_tokens: 1200, temperature: 0.3 }),
        signal: AbortSignal.timeout(18000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "deepseek", model: "deepseek-chat", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "deepseek", model: "deepseek-chat", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        if (r.status === 429) markProviderDown("deepseek");
        logAiCall({ provider: "deepseek", model: "deepseek-chat", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "deepseek", model: "deepseek-chat", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  // 4. Cloudflare — 10/10, 4.86s
  if (cfAcc && cfTok && providerReady("cloudflare")) {
    const t0 = Date.now();
    try {
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAcc}/ai/run/@cf/meta/llama-3.3-70b-instruct`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfTok}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, max_tokens: 1200 }),
        signal: AbortSignal.timeout(25000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json?.result?.response?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "cloudflare", model: "llama-3.3-70b-instruct", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0 });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "cloudflare", model: "llama-3.3-70b-instruct", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        if (r.status === 429) markProviderDown("cloudflare");
        logAiCall({ provider: "cloudflare", model: "llama-3.3-70b-instruct", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "cloudflare", model: "llama-3.3-70b-instruct", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  // 5. Groq — 7/10, 0.75s (sista utväg)
  if (groqKey && providerReady("groq_kanal")) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-specdec", messages: msgs, max_tokens: 1200, temperature: 0.3 }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices[0].message.content.trim();
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "groq", model: "llama-3.3-70b-specdec", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "groq", model: "llama-3.3-70b-specdec", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        if (r.status === 429) markProviderDown("groq_kanal");
        logAiCall({ provider: "groq", model: "llama-3.3-70b-specdec", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "groq", model: "llama-3.3-70b-specdec", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  logAiCall({ provider: "none", model: null, source: "kanal-batch", status: "all_failed", latency_ms: 0 });
  logFel({ kalla: "kanal/batch-expand", feltyp: "ai_fail", meddelande: "Alla providers misslyckades", ip });
  return Response.json({ expanded: [] });
}
