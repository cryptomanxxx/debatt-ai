// No edge runtime — Node.js enables Cerebras fallback

import { logAiCall } from "../../../lib/logAiCall";

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
  const { rubriker } = await req.json().catch(() => ({}));
  if (!Array.isArray(rubriker) || !rubriker.length) return Response.json({ translated: [] });

  const system = `Translate Swedish news headlines to English. Return ONLY a numbered list, one per line, in the same order. Example:
1. English headline one
2. English headline two`;
  const user = rubriker.map((r, i) => `${i + 1}. ${r}`).join("\n");
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
            generationConfig: { maxOutputTokens: 600, temperature: 0.1 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (r.ok) {
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        const parsed = parseNumberedList(text, rubriker.length);
        if (parsed) {
          logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch-en", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usageMetadata?.promptTokenCount ?? null, output_tokens: json.usageMetadata?.candidatesTokenCount ?? null });
          return Response.json({ translated: parsed });
        }
        logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch-en", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch-en", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "gemini", model: "gemini-2.0-flash", source: "kanal-batch-en", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (groqKey) {
    const t0 = Date.now();
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 600, temperature: 0.1 }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices[0].message.content.trim();
        const parsed = parseNumberedList(text, rubriker.length);
        if (parsed) {
          logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch-en", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ translated: parsed });
        }
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch-en", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch-en", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "groq", model: "llama-3.3-70b-versatile", source: "kanal-batch-en", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (cbKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${cbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen-3-235b-a22b-instruct-2507", messages: msgs, max_tokens: 600, temperature: 0.1 }),
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        const parsed = parseNumberedList(text, rubriker.length);
        if (parsed) {
          logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal-batch-en", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ translated: parsed });
        }
        logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal-batch-en", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal-batch-en", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "cerebras", model: "qwen-3-235b-a22b-instruct-2507", source: "kanal-batch-en", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  if (sbKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.sambanova.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 600, temperature: 0.1 }),
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        const parsed = parseNumberedList(text, rubriker.length);
        if (parsed) {
          logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch-en", status: "ok", latency_ms: Date.now() - t0, input_tokens: json.usage?.prompt_tokens ?? null, output_tokens: json.usage?.completion_tokens ?? null });
          return Response.json({ translated: parsed });
        }
        logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch-en", status: "parse_fail", latency_ms: Date.now() - t0 });
      } else {
        logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch-en", status: `error_${r.status}`, latency_ms: Date.now() - t0 });
      }
    } catch {
      logAiCall({ provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct", source: "kanal-batch-en", status: "timeout", latency_ms: Date.now() - t0 });
    }
  }

  logAiCall({ provider: "none", model: null, source: "kanal-batch-en", status: "all_failed", latency_ms: 0 });
  return Response.json({ translated: rubriker });
}
