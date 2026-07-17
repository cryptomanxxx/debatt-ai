import { checkRateLimit } from "../../lib/kanalRateLimit";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// argument_roster saknar anon-skrivpolicy (RLS) — service role krävs. Denna
// route körs server-side (Vercel), så nyckeln exponeras aldrig till
// webbläsaren. Fallback till anon bevaras för miljöer utan secreten.
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;
const readHdrs = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
const writeHdrs = { apikey: SB_WRITE_KEY, Authorization: `Bearer ${SB_WRITE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" };

export async function GET(req) {
  const ids = new URL(req.url).searchParams.get("artikel_ids");
  if (!ids) return Response.json([]);
  const r = await fetch(
    `${SB_URL}/rest/v1/argument_roster?artikel_id=in.(${ids})&select=artikel_id,stycke_index,stycke_text,roster&order=roster.desc`,
    { headers: readHdrs, cache: "no-store" }
  );
  if (!r.ok) return Response.json([]);
  return Response.json(await r.json(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  const rl = checkRateLimit(req, "argument-roster", 30, 60 * 60 * 1000);
  if (!rl.ok) return Response.json({ error: "För många röster." }, { status: 429 });

  const { artikel_id, stycke_index, stycke_text } = await req.json().catch(() => ({}));
  if (!artikel_id || stycke_index === undefined || !stycke_text) {
    return Response.json({ error: "Ogiltiga parametrar." }, { status: 400 });
  }

  const r = await fetch(
    `${SB_URL}/rest/v1/argument_roster?artikel_id=eq.${artikel_id}&stycke_index=eq.${stycke_index}&select=id,roster`,
    { headers: readHdrs, cache: "no-store" }
  );
  const rows = r.ok ? await r.json() : [];

  if (rows.length > 0) {
    const newCount = rows[0].roster + 1;
    const patchRes = await fetch(
      `${SB_URL}/rest/v1/argument_roster?id=eq.${rows[0].id}`,
      { method: "PATCH", headers: writeHdrs, body: JSON.stringify({ roster: newCount }) }
    );
    if (!patchRes.ok) return Response.json({ error: "Kunde inte spara rösten." }, { status: 502 });
    return Response.json({ roster: newCount });
  } else {
    const postRes = await fetch(
      `${SB_URL}/rest/v1/argument_roster`,
      { method: "POST", headers: writeHdrs, body: JSON.stringify({ artikel_id, stycke_index, stycke_text: stycke_text.slice(0, 1000), roster: 1 }) }
    );
    if (!postRes.ok) return Response.json({ error: "Kunde inte spara rösten." }, { status: 502 });
    return Response.json({ roster: 1 });
  }
}
