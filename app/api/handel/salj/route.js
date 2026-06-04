const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" };

async function sbGet(table, qs) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${qs}`, { headers: H });
  return r.ok ? r.json() : [];
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body?.smeknamn) return Response.json({ error: "Saknar smeknamn" }, { status: 400 });

  const spelare = await sbGet("handel_spelare", `smeknamn=eq.${encodeURIComponent(body.smeknamn)}&select=*`);
  if (!spelare.length) return Response.json({ error: "Spelaren hittades inte" }, { status: 404 });

  const sp = spelare[0];
  if (!sp.last_mangd || sp.last_mangd === 0)
    return Response.json({ error: "Inget att sälja — lasten är tom" }, { status: 400 });

  const [vara, pris] = await Promise.all([
    sbGet("handel_varor",  `id=eq.${sp.last_vara_id}&select=*`),
    sbGet("handel_priser", `stad_id=eq.${sp.stad_id}&vara_id=eq.${sp.last_vara_id}&select=salj_pris`),
  ]);

  if (!pris.length) return Response.json({ error: "Varan köps inte upp här" }, { status: 400 });

  const salj_pris = pris[0].salj_pris;
  const totalt    = salj_pris * sp.last_mangd;
  const v         = vara[0];

  await fetch(`${SB_URL}/rest/v1/handel_spelare?smeknamn=eq.${encodeURIComponent(sp.smeknamn)}`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ mynt: sp.mynt + totalt, last_vara_id: null, last_mangd: 0, uppdaterad: new Date().toISOString() }),
  });

  await fetch(`${SB_URL}/rest/v1/handel_logg`, {
    method: "POST", headers: H,
    body: JSON.stringify({ spelare_id: sp.id, typ: "salj",
      beskrivning: `Sålde ${sp.last_mangd}× ${v?.ikon ?? ""} ${v?.namn ?? "vara"} för ${salj_pris} 🪙/st`, mynt_delta: totalt }),
  });

  return Response.json({ meddelande: `💰 Sålde ${sp.last_mangd}× ${v?.ikon ?? ""} ${v?.namn ?? "vara"} för ${totalt} 🪙!` });
}
