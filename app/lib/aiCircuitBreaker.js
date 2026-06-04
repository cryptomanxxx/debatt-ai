/**
 * aiCircuitBreaker.js — process-nivå circuit breaker för AI-providers.
 *
 * Lever i modulens scope på Vercel warm instances. Om en provider
 * returnerar 429 markeras den nere i COOLDOWN_MS. Alla efterföljande
 * anrop på samma instance hoppar direkt till nästa provider.
 *
 * Minnet återställs automatiskt när Vercel startar en ny cold instance.
 */

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minuter

const _downUntil = {
  groq:       0,
  groq_kanal: 0,
  gemini:     0,
  mistral:    0,
  cerebras:   0,
  sambanova:  0,
  deepseek:   0,
  cloudflare: 0,
};

export function providerReady(name) {
  return Date.now() > (_downUntil[name] ?? 0);
}

export function markProviderDown(name, ms = COOLDOWN_MS) {
  _downUntil[name] = Date.now() + ms;
}

export function providerStatus() {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(_downUntil).map(([k, v]) => [k, v > now ? "down" : "ok"])
  );
}
