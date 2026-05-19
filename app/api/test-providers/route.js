// No edge runtime — use Node.js so providers don't block Vercel edge IPs

function makeMessages(providerName) {
  return [
    { role: "system", content: "Du är en hjälpsam assistent. Svara kort på svenska." },
    { role: "user", content: `Säg '${providerName} fungerar!' och inget annat.` },
  ];
}

async function testGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { ok: false, error: "GROQ_API_KEY saknas" };
  const model = "llama-3.3-70b-versatile";
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: makeMessages("Groq"), max_tokens: 30 }),
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

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "GEMINI_API_KEY saknas" };
  const model = "gemini-2.0-flash-lite";
  const t0 = Date.now();
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Säg 'Gemini fungerar!' och inget annat." }] }],
          generationConfig: { maxOutputTokens: 30 },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const latency = Date.now() - t0;
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, status: r.status, error: err.slice(0, 200), latency };
    }
    const json = await r.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    return { ok: true, text, latency, model };
  } catch (e) {
    return { ok: false, error: e.message, latency: Date.now() - t0 };
  }
}

async function testCerebras() {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) return { ok: false, error: "CEREBRAS_API_KEY saknas" };

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

  const model = "qwen-3-235b-a22b-instruct-2507";
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: makeMessages("Cerebras"), max_tokens: 30 }),
      signal: AbortSignal.timeout(15000),
    });
    const latency = Date.now() - t0;
    if (r.ok) {
      const json = await r.json();
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      return { ok: true, text, latency, model: json.model, availableModels };
    }
    const err = await r.text();
    return { ok: false, status: r.status, error: err.slice(0, 300), latency, availableModels };
  } catch (e) {
    return { ok: false, error: e.message, latency: Date.now() - t0, availableModels };
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
      body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: makeMessages("Sambanova"), max_tokens: 30 }),
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

async function testOpenRouter() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, error: "OPENROUTER_API_KEY saknas" };
  const model = "meta-llama/llama-3.3-70b-instruct:free";
  const t0 = Date.now();
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.debatt-ai.se",
        "X-Title": "debatt.ai",
      },
      body: JSON.stringify({ model, messages: makeMessages("OpenRouter"), max_tokens: 30 }),
      signal: AbortSignal.timeout(20000),
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

async function testCodestral() {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return { ok: false, error: "MISTRAL_API_KEY saknas" };
  const model = "codestral-latest";
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: makeMessages("Codestral"), max_tokens: 30 }),
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

async function testGithubModels() {
  const key = process.env.GITHUB_TOKEN;
  if (!key) return { ok: false, error: "GITHUB_TOKEN saknas" };
  const model = "Llama-3.3-70B-Instruct";
  const t0 = Date.now();
  try {
    const r = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: makeMessages("GitHub Models"), max_tokens: 30 }),
      signal: AbortSignal.timeout(15000),
    });
    const latency = Date.now() - t0;
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, status: r.status, error: err.slice(0, 200), latency };
    }
    const json = await r.json();
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { ok: true, text, latency, model: json.model ?? model };
  } catch (e) {
    return { ok: false, error: e.message, latency: Date.now() - t0 };
  }
}

async function testFireworks() {
  const key = process.env.FIREWORKS_API_KEY;
  if (!key) return { ok: false, error: "FIREWORKS_API_KEY saknas" };
  const model = "accounts/fireworks/models/llama-v3p3-70b-instruct";
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: makeMessages("Fireworks"), max_tokens: 30 }),
      signal: AbortSignal.timeout(15000),
    });
    const latency = Date.now() - t0;
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, status: r.status, error: err.slice(0, 200), latency };
    }
    const json = await r.json();
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { ok: true, text, latency, model: json.model ?? model };
  } catch (e) {
    return { ok: false, error: e.message, latency: Date.now() - t0 };
  }
}

async function testDeepSeek() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return { ok: false, error: "DEEPSEEK_API_KEY saknas" };
  const model = "deepseek-chat";
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: makeMessages("DeepSeek"), max_tokens: 30 }),
      signal: AbortSignal.timeout(20000),
    });
    const latency = Date.now() - t0;
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, status: r.status, error: err.slice(0, 200), latency };
    }
    const json = await r.json();
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { ok: true, text, latency, model: json.model ?? model };
  } catch (e) {
    return { ok: false, error: e.message, latency: Date.now() - t0 };
  }
}

async function testCloudflare() {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_API_TOKEN;
  if (!accountId || !token) return { ok: false, error: "CF_ACCOUNT_ID eller CF_API_TOKEN saknas" };
  const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  const t0 = Date.now();
  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: makeMessages("Cloudflare"), max_tokens: 30 }),
        signal: AbortSignal.timeout(20000),
      }
    );
    const latency = Date.now() - t0;
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, status: r.status, error: err.slice(0, 200), latency };
    }
    const json = await r.json();
    const text = json.result?.response?.trim() ?? "";
    return { ok: !!text, text, latency, model };
  } catch (e) {
    return { ok: false, error: e.message, latency: Date.now() - t0 };
  }
}

export async function GET() {
  const [groq, gemini, cerebras, sambanova, openrouter, codestral, github_models, fireworks, deepseek, cloudflare] = await Promise.all([
    testGroq(),
    testGemini(),
    testCerebras(),
    testSambanova(),
    testOpenRouter(),
    testCodestral(),
    testGithubModels(),
    testFireworks(),
    testDeepSeek(),
    testCloudflare(),
  ]);
  return Response.json(
    { groq, gemini, cerebras, sambanova, openrouter, codestral, github_models, fireworks, deepseek, cloudflare },
    { headers: { "Cache-Control": "no-store" } }
  );
}
