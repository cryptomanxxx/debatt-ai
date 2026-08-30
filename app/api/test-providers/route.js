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
  const model = "openai/gpt-oss-120b";
  const t0 = Date.now();
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: makeMessages("Groq"), max_tokens: 500 }),
      signal: AbortSignal.timeout(20000),
    });
    const latency = Date.now() - t0;
    if (!r.ok) {
      const err = await r.text();
      return { ok: false, status: r.status, error: err.slice(0, 200), latency };
    }
    const json = await r.json();
    const choice = json.choices?.[0];
    const text = choice?.message?.content?.trim() ?? "";
    const reasoning = choice?.message?.reasoning_content?.trim() ?? "";
    const debug = !text ? {
      finish_reason: choice?.finish_reason,
      message_keys: choice?.message ? Object.keys(choice.message) : null,
      reasoning_snippet: reasoning.slice(0, 150) || null,
      raw_choice: JSON.stringify(choice).slice(0, 300),
    } : undefined;
    return {
      ok: !!text,
      text,
      latency,
      model: json.model,
      debug,
      error: !text ? "Tomt svar — modellen förbrukade troligen hela token-budgeten på reasoning" : undefined,
    };
  } catch (e) {
    return { ok: false, error: e.message, latency: Date.now() - t0 };
  }
}

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "GEMINI_API_KEY saknas" };
  const model = "gemini-3.5-flash-lite"; // gemini-2.0-flash-lite stängdes ner av Google 1 jun 2026
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

// testCerebras()/testSambanova() borttagna 30 aug 2026 — båda providers
// kräver nu betalkort/betalning, vilket projektägaren valt att inte teckna.


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

// testGithubModels() borttagen 30 aug 2026 — GitHub Models stängde helt
// 30 jul 2026, ingen väg tillbaka för denna provider.


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
  const [groq, gemini, codestral, deepseek, cloudflare] = await Promise.all([
    testGroq(),
    testGemini(),
    testCodestral(),
    testDeepSeek(),
    testCloudflare(),
  ]);
  return Response.json(
    { groq, gemini, codestral, deepseek, cloudflare },
    { headers: { "Cache-Control": "no-store" } }
  );
}
