const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function logAiCall({ provider, model, source, status, latency_ms, input_tokens, output_tokens }) {
  if (!SB_URL || !SB_KEY) return;
  fetch(`${SB_URL}/rest/v1/ai_log`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ provider, model, source, status, latency_ms, input_tokens, output_tokens }),
  }).catch(() => {});
}
