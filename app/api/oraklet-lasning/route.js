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

// Mappar typ → (tabell, PostgREST select, extraktor) för att slå upp den
// faktiska titeln server-side — se nedan för varför klient-inskickad titel
// inte litas på. "urval" (Professor Oraklets Läslista) refererar en rad i
// oraklet_urval, vars titel hämtas via en embeddad nyhetsflode-relation
// (FK nyhet_id) snarare än en egen kolumn.
const TYP_KALLA = {
  forskning: { tabell: "vetenskapliga_upptagter", select: "titel", extract: r => r?.titel },
  nyhet: { tabell: "nyhetsflode", select: "rubrik", extract: r => r?.rubrik },
  urval: { tabell: "oraklet_urval", select: "nyhetsflode(rubrik)", extract: r => r?.nyhetsflode?.rubrik },
};

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "oraklet-lasning-log", 60, 10 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ error: "För många förfrågningar." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const typ = body?.typ;
  const kalla = TYP_KALLA[typ];
  if (!kalla) {
    return Response.json({ error: "Ogiltig typ." }, { status: 400 });
  }
  // ref_id krävs (inte bara giltig om satt) och titeln slås upp server-side
  // ur den refererade raden — annars kan en obehörig anropare posta valfri
  // text med ref_id=null och fylla Senaste aktivitet-feeden med påhittade
  // uppläsningar trots RLS på oraklet_lasningar (Codex-fynd, PR #1365-review).
  const refId = Number(body?.ref_id);
  if (!Number.isInteger(refId) || refId <= 0) {
    return Response.json({ error: "Ogiltigt ref_id." }, { status: 400 });
  }

  const lookupRes = await fetch(
    `${SB_URL}/rest/v1/${kalla.tabell}?id=eq.${refId}&select=${kalla.select}`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const lookupRows = lookupRes.ok ? await lookupRes.json().catch(() => []) : [];
  const titel = (kalla.extract(lookupRows?.[0]) || "").toString().trim().slice(0, 300);
  if (!titel) {
    return Response.json({ error: "Referensen hittades inte." }, { status: 404 });
  }

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
