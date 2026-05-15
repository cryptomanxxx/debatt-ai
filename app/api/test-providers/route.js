// No edge runtime — use Node.js so Cerebras doesn't block Vercel edge IPs

const PROMPT = [
  { role: "system", content: "Du är en hjälpsam assistent. Svara kort på svenska." },
  { role: "user", content: "Säg 'Cerebras fungerar!' och inget annat." },
];

const PROMPT_SB = [
  { role: "system", content: "Du är en hjälpsam assistent. Svara kort på svenska." },
  { role: "user", content: "Säg 'Sambanova fungerar!' och inget annat." },
];

async function testCerebras() {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) return { ok: false, error: "CEREBRAS_API_KEY saknas" };

  // First: list available models
  let availableModels = [];
  try {
    const mr = await fetch("https://api.cerebras.ai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (mr.ok) {
      const mj = await mr.json();
      availableModels = (mj.data || []).map(m => m.id);
    }
  } catch {}

  // Try each plausible model name
  const candidates = ["llama-3.3-70b", "llama3.3-70b", "llama-3.3-70b-instruct", "llama3.3-70b-instruct"];
  for (const model of candidates) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: PROMPT, max_tokens: 30 }),
        signal: AbortSignal.timeout(15000),
      });
      const latency = Date.now() - t0;
      if (r.ok) {
        const json = await r.json();
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        return { ok: true, text, latency, model: json.model, availableModels };
      }
    } catch {}
  }
  return { ok: false, error: "Ingen av modellnamnen fungerade", availableModels };
}

async function testSambanova() {
  const key = process.env.SAMBANOVA_API_KEY;
  if (!key) return { ok: false, error: "SAMBANOVA_API_KEY saknas" };
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.sambanova.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: PROMPT_SB, max_tokens: 30 }),
      signal: AbortSignal.timeout(15000),
    });
    const latency = Date.now() - t0;
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, status: r.status, error: err.slice(0, 200), latency };
    }
    const json = await r.json();
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { ok: true, text, latency, model: json.model };
  } catch (e) {
    return { ok: false, error: e.message, latency: Date.now() - t0 };
  }
}

export async function GET() {
  const [cerebras, sambanova] = await Promise.all([testCerebras(), testSambanova()]);
  return Response.json({ cerebras, sambanova }, {
    headers: { "Cache-Control": "no-store" },
  });
}
