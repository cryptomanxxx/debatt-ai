// No edge runtime — Node.js enables Cerebras fallback

import { logAiCall } from "../../../lib/logAiCall";
import { checkRateLimit } from "../../../lib/kanalRateLimit";

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
  const rl = checkRateLimit(req, "batch-expand", 5, 10 * 60 * 1000);
  if (!rl.ok) {
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
  const cbKey   = process.env.CEREBRAS_API_KEY;
  const sbKey   = process.env.SAMBANOVA_API_KEY;

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
            generationConfig: { maxOutputTokens: 1200, temperature: 0.3 },
          }),
          signal: AbortSignal.timeout(15000),
        }
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
        logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (groqKey) {
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
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (cbKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${cbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen-3-235b-a22b-instruct-2507", messages: msgs, max_tokens: 1200, temperature: 0.3 }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        const parsed = parseNumberedList(text, items.length);
        if (parsed) {
          logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal-batch", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ expanded: parsed });
        }
        logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal-batch", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (sbKey) {
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
        logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  logAiCall({ provider: "none", model: null, source: "kanal-batch", status: "all_failed", latency_ms: 0 });
  return Response.json({ expanded: [] });
}
