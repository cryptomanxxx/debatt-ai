const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Loggar ett fel till Supabase-tabellen fel_log. Fire-and-forget.
 *
 * @param {object} opts
 * @param {string} opts.kalla    - API-route, t.ex. "kanal/expand"
 * @param {string} opts.feltyp   - "rate_limit" | "ai_fail" | "rss_fail" | "supabase_fail" | "server_error"
 * @param {string} [opts.meddelande] - fritext, t.ex. provider eller HTTP-status
 * @param {string} [opts.ip]     - IP-adress från request
 * @param {object} [opts.extra]  - extra JSON-kontext
 */
export function logFel({ kalla, feltyp, meddelande, ip, extra }) {
  if (!SB_URL || !SB_KEY) return;
  fetch(`${SB_URL}/rest/v1/fel_log`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ kalla, feltyp, meddelande, ip: ip ?? null, extra: extra ?? null }),
  }).catch(() => {});
}

/** Extraherar IP från en Next.js Request. */
export function getIp(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}
