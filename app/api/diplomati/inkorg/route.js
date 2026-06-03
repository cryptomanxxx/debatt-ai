import { checkRateLimit } from "../../../lib/kanalRateLimit";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_ANON;

const GILTIGA_TYPER = ["halning", "handelsforslag", "allians", "varning", "svar", "annan"];

export async function GET() {
  if (!SB_ANON) return Response.json([], { status: 200 });
  const h = { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` };

  const r = await fetch(
    `${SB_URL}/rest/v1/diplomatiska_meddelanden` +
    `?select=id,riktning,avsandare,mottagare,amne,typ,status,svar_pa_id,kalla_url,meddelande,skapad,civ_id` +
    `&order=skapad.desc&limit=100`,
    { headers: h, next: { revalidate: 60 } }
  );
  if (!r.ok) return Response.json([], { status: 200 });
  const data = await r.json();
  return Response.json(Array.isArray(data) ? data : [], {
    headers: { "Cache-Control": "public, s-maxage=60" },
  });
}

export async function POST(req) {
  const rl = checkRateLimit(req, "diplomati-inkorg", 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ fel: "Rate limit exceeded. Try again later." }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Invalid JSON" }, { status: 400 }); }

  const { avsandare, meddelande, amne, typ, kalla_url } = body;
  if (!avsandare?.trim() || !meddelande?.trim()) {
    return Response.json({ fel: "avsandare and meddelande are required." }, { status: 400 });
  }
  if (meddelande.length > 2000) {
    return Response.json({ fel: "meddelande exceeds 2000 characters." }, { status: 400 });
  }

  const typNorm = GILTIGA_TYPER.includes(typ) ? typ : "annan";

  // Slå upp civ_id baserat på kalla_url
  let civ_id = null;
  if (kalla_url?.trim() && SB_ANON) {
    const civRes = await fetch(
      `${SB_URL}/rest/v1/community_civilisationer?status=eq.aktiv&select=id,hemsida_url`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` } }
    );
    if (civRes.ok) {
      const civs = await civRes.json();
      const matched = civs.find(c => c.hemsida_url && kalla_url.startsWith(c.hemsida_url.replace(/\/$/, "")));
      if (matched) civ_id = matched.id;
    }
  }

  const ins = await fetch(`${SB_URL}/rest/v1/diplomatiska_meddelanden`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      riktning: "inkommande",
      avsandare: avsandare.trim().slice(0, 120),
      mottagare: "Sverige",
      civ_id,
      amne: amne?.trim().slice(0, 200) || null,
      typ: typNorm,
      meddelande: meddelande.trim(),
      status: "inkommen",
      kalla_url: kalla_url?.trim().slice(0, 500) || null,
    }),
  });

  if (!ins.ok) {
    const errText = await ins.text();
    console.error("Supabase insert failed:", errText);
    return Response.json({ fel: "Could not save message." }, { status: 502 });
  }

  const rows = await ins.json();
  const id = Array.isArray(rows) && rows[0] ? rows[0].id : null;
  return Response.json({ ok: true, id });
}
