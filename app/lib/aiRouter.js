/**
 * aiRouter.js — centraliserad AI-provider-router.
 *
 * Exporterar:
 *   CHAINS                        — statiska fallback-kedjor per use-case (fallback)
 *   getDynamicChain(usecase)      — async, läser rankad ordning från Supabase (1h cache)
 *   callProvider(name, messages, opts)        — anropa en specifik provider
 *   callWithFallback(chain, messages, opts)   — prova providers i tur och ordning
 *
 * Providers: groq | gemini | cerebras | sambanova | codestral | deepseek | github
 *
 * opts:
 *   maxTokens    (default 800)
 *   temperature  (default 0.7)
 *   timeout      (override per-provider default, ms)
 *   source       (loggnamn för logAiCall)
 *   json         (true → skickar response_format: json_object på OpenAI-providers)
 *   validate     (text => bool) — hoppa vidare om svaret inte klarar validering
 */

import { providerReady, markProviderDown } from "./aiCircuitBreaker.js";
import { logAiCall as _log } from "./logAiCall.js";

function log(args) { try { _log(args); } catch {} }

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

const PROVIDERS = {
  groq: {
    url:     "https://api.groq.com/openai/v1/chat/completions",
    model:   "llama-3.3-70b-versatile",
    key:     () => process.env.GROQ_API_KEY,
    timeout: 15_000,
    cbKey:   "groq",
    shape:   "openai",
  },
  gemini: {
    url:     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    model:   "gemini-2.0-flash",
    key:     () => process.env.GEMINI_API_KEY,
    timeout: 15_000,
    cbKey:   "gemini",
    shape:   "gemini",
  },
  cerebras: {
    url:     "https://api.cerebras.ai/v1/chat/completions",
    model:   "gpt-oss-120b",
    key:     () => process.env.CEREBRAS_API_KEY,
    timeout: 15_000,
    cbKey:   "cerebras",
    shape:   "openai",
  },
  sambanova: {
    url:     "https://api.sambanova.ai/v1/chat/completions",
    model:   "Meta-Llama-3.3-70B-Instruct",
    key:     () => process.env.SAMBANOVA_API_KEY,
    timeout: 15_000,
    cbKey:   "sambanova",
    shape:   "openai",
  },
  codestral: {
    url:     "https://api.mistral.ai/v1/chat/completions",
    model:   "codestral-latest",
    key:     () => process.env.MISTRAL_API_KEY,
    timeout: 15_000,
    cbKey:   "mistral",
    shape:   "openai",
  },
  deepseek: {
    url:     "https://api.deepseek.com/chat/completions",
    model:   "deepseek-chat",
    key:     () => process.env.DEEPSEEK_API_KEY,
    timeout: 20_000,
    cbKey:   "deepseek",
    shape:   "openai",
  },
  // Sista utväg — ingen circuit breaker (GitHub Actions har alltid GITHUB_TOKEN)
  github: {
    url:     "https://models.inference.ai.azure.com/chat/completions",
    model:   "Llama-3.3-70B-Instruct",
    key:     () => process.env.GITHUB_TOKEN,
    timeout: 20_000,
    cbKey:   null,
    shape:   "openai",
  },
};

// Statiska kedjor — används om Supabase är otillgänglig
export const CHAINS = {
  general:      ["groq", "sambanova", "codestral", "deepseek", "cerebras", "gemini", "github"],
  beslut:       ["groq", "codestral", "sambanova", "cerebras", "deepseek", "gemini", "github"],
  agent_submit: ["groq", "codestral", "sambanova", "cerebras", "deepseek", "gemini", "github"],
  pis:          ["groq", "sambanova", "codestral", "cerebras", "deepseek", "gemini", "github"],
  chatt:        ["groq", "cerebras", "sambanova", "codestral", "deepseek", "gemini", "github"],
};

// ── Dynamisk Supabase-ordning (1h cache) ────────────────────────────────────

let _dynamicOrder = null;
let _dynamicOrderTs = 0;
const _CACHE_TTL = 3_600_000; // 1 timme

async function _fetchDynamicOrder() {
  const sbKey = process.env.SUPABASE_ANON_KEY;
  if (!sbKey) return null;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/provider_config?id=eq.current&select=ranked_order`,
      {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
        signal: AbortSignal.timeout(3_000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.ranked_order ?? null;
  } catch {
    return null;
  }
}

/**
 * Returnerar dynamisk fallback-kedja från Supabase provider_config.
 * Faller tillbaka på statisk CHAINS[usecase] om Supabase är otillgänglig.
 */
export async function getDynamicChain(usecase = "general") {
  const now = Date.now();
  if (!_dynamicOrder || now - _dynamicOrderTs > _CACHE_TTL) {
    _dynamicOrder = await _fetchDynamicOrder();
    _dynamicOrderTs = now;
  }
  const base = CHAINS[usecase] ?? CHAINS.general;
  if (!_dynamicOrder) return base;

  // Filtrera till providers som finns i PROVIDERS, behåll github sist
  const ranked = _dynamicOrder.map(p => p.replace('mistral', 'codestral')).filter(p => p in PROVIDERS && p !== "github");
  // Lägg till providers från statisk kedja som saknas i Supabase-ordningen
  for (const p of base) {
    if (!ranked.includes(p)) ranked.push(p);
  }
  return ranked;
}

// ── Provider-anrop ───────────────────────────────────────────────────────────

function openAIBody(messages, model, opts) {
  return {
    model,
    messages,
    max_tokens:  opts.maxTokens ?? 800,
    temperature: opts.temperature ?? 0.7,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
  };
}

function geminiBody(messages, opts) {
  const sys  = messages.find(m => m.role === "system");
  const rest = messages.filter(m => m.role !== "system");
  const body = {
    contents: rest.map(m => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 800,
      temperature:     opts.temperature ?? 0.7,
    },
  };
  if (sys) body.systemInstruction = { parts: [{ text: sys.content }] };
  return body;
}

function extractText(json, shape) {
  if (shape === "openai") return json.choices?.[0]?.message?.content?.trim() ?? null;
  if (shape === "gemini") return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  return null;
}

export async function callProvider(name, messages, opts = {}) {
  const cfg = PROVIDERS[name];
  if (!cfg) throw new Error(`Okänd provider: ${name}`);

  const key = cfg.key();
  if (!key) throw new Error(`Ingen API-nyckel för: ${name}`);

  if (cfg.cbKey && !providerReady(cfg.cbKey))
    throw new Error(`${name} är i circuit-breaker cooldown`);

  const timeout = opts.timeout ?? cfg.timeout;
  const t0 = Date.now();

  let url = cfg.url;
  const headers = { "Content-Type": "application/json" };
  let body;

  if (cfg.shape === "openai") {
    headers["Authorization"] = `Bearer ${key}`;
    body = openAIBody(messages, cfg.model, opts);
  } else {
    url = `${cfg.url}?key=${key}`;
    body = geminiBody(messages, opts);
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });

  const latency = Date.now() - t0;

  if (res.status === 429) {
    if (cfg.cbKey) markProviderDown(cfg.cbKey);
    log({ provider: name, model: cfg.model, source: opts.source ?? "aiRouter", status: "rate_limit", latency_ms: latency });
    throw new Error(`${name}: 429 rate-limited`);
  }

  if (!res.ok) {
    log({ provider: name, model: cfg.model, source: opts.source ?? "aiRouter", status: `error_${res.status}`, latency_ms: latency });
    throw new Error(`${name}: HTTP ${res.status}`);
  }

  const json = await res.json();
  const text = extractText(json, cfg.shape);

  if (!text) {
    log({ provider: name, model: cfg.model, source: opts.source ?? "aiRouter", status: "empty", latency_ms: latency });
    throw new Error(`${name}: tomt svar`);
  }

  log({
    provider:      name,
    model:         cfg.model,
    source:        opts.source ?? "aiRouter",
    status:        "ok",
    latency_ms:    latency,
    input_tokens:  cfg.shape === "openai"
      ? json.usage?.prompt_tokens ?? null
      : json.usageMetadata?.promptTokenCount ?? null,
    output_tokens: cfg.shape === "openai"
      ? json.usage?.completion_tokens ?? null
      : json.usageMetadata?.candidatesTokenCount ?? null,
  });

  return { text, provider: name, model: cfg.model };
}

export async function callWithFallback(chain, messages, opts = {}) {
  const errors = [];
  for (const name of chain) {
    try {
      const result = await callProvider(name, messages, opts);
      if (opts.validate && !opts.validate(result.text)) {
        errors.push(`${name}: validation failed`);
        continue;
      }
      return result;
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  throw new Error(`Alla providers misslyckades — ${errors.join(" | ")}`);
}
