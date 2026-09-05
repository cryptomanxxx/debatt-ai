// POST /api/oraklet-lasning — loggar varje gång en besökare låter Professor
// Oraklet läsa upp ett AI-forskningsfynd eller en vetenskaplig nyhet på
// /universitet. Ren loggning (uppläsningen sker klientsidan via
// AgentOverlay/responsiveVoice) — syftet är att synliggöra Oraklets
// uppläsningar i Senaste aktivitet-feeden på startsidan
// (app/api/aktivitet/route.js), som annars aldrig fick reda på att
// uppläsningar sker eftersom de inte lämnar något annat spår i databasen.
import { checkRateLimit } from "../../lib/kanalRateLimit";
import { logFel, getIp } from "../../lib/logFel";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// oraklet_lasningar saknar anon-skrivpolicy (RLS) — service role krävs,
// samma mönster som fraga_anna_peter_log/nyhetsanalys/labb_log.
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

const TYPER = new Set(["forskning", "nyhet"]);

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "oraklet-lasning-log", 60, 10 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ error: "För många förfrågningar." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const typ = body?.typ;
  if (!TYPER.has(typ)) {
    return Response.json({ error: "Ogiltig typ." }, { status: 400 });
  }
  const titel = typeof body?.titel === "string" ? body.titel.trim().slice(0, 300) : null;
  if (!titel) return Response.json({ error: "Titel saknas." }, { status: 400 });
  const refId = Number.isInteger(body?.ref_id) ? body.ref_id : null;

  const res = await fetch(`${SB_URL}/rest/v1/oraklet_lasningar`, {
    method: "POST",
    headers: {
      apikey: SB_WRITE_KEY,
      Authorization: `Bearer ${SB_WRITE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ typ, ref_id: refId, titel }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    logFel({ kalla: "oraklet-lasning", feltyp: "supabase_fail", meddelande: `HTTP ${res.status}`, ip, extra: { errText: errText.slice(0, 300) } });
    // Fail-open: loggningen misslyckades men uppläsningen har redan skett
    // klientsidan — svara ok så UI:t inte visar ett förvirrande fel för en
    // funktion (uppläsning) som redan fungerade.
    return Response.json({ ok: false });
  }

  return Response.json({ ok: true });
}
