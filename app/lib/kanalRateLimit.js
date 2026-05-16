// Shared in-memory rate limiter for /api/kanal/* endpoints.
// State lives per Node.js process (Vercel serverless instance).
// Limits are generous enough for real users but block automated loops.

const stores = new Map(); // keyed by endpoint name

function getStore(endpoint) {
  if (!stores.has(endpoint)) stores.set(endpoint, new Map());
  return stores.get(endpoint);
}

/**
 * @param {Request} req
 * @param {string} endpoint - identifier, e.g. "expand"
 * @param {number} limit - max calls per window
 * @param {number} windowMs - window size in ms
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 */
export function checkRateLimit(req, endpoint, limit, windowMs) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const store = getStore(endpoint);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.start > windowMs) {
    store.set(ip, { count: 1, start: now });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.start + windowMs - now) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count, retryAfter: 0 };
}
