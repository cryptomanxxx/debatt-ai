const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fmwxftnistkoqazfwnuj.supabase.co";
// ai_log saknar anon-skrivpolicy (RLS) — service role krävs. Utan secreten
// hoppas loggningen över: ett anon-POST nekas alltid (42501) och ger bara en
// felrad i Supabase-loggen.
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
