const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// ai_log saknar anon-skrivpolicy (RLS) — service role krävs. Fallback till
// anon-nyckeln bevaras för miljöer utan secreten; fire-and-forget nedan gör
// att ett misslyckat POST bara ger ett hål i loggen, ingen funktionell påverkan.
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

export function logAiCall({ provider, model, source, status, latency_ms, input_tokens, output_tokens }) {
  if (!SB_URL || !SB_SERVICE_KEY) return;
  fetch(`${SB_URL}/rest/v1/ai_log`, {
    method: "POST",
    headers: {
      apikey: SB_SERVICE_KEY,
      Authorization: `Bearer ${SB_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ provider, model, source, status, latency_ms, input_tokens, output_tokens }),
  }).catch(() => {});
}
