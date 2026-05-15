export const runtime = "edge";

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
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b", messages: PROMPT, max_tokens: 30 }),
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
