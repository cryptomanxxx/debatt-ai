const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" };

async function sbGet(table, qs) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${qs}`, { headers: H });
  return r.ok ? r.json() : [];
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body?.smeknamn || !body?.vara_id || !body?.mangd)
    return Response.json({ error: "Saknar parametrar" }, { status: 400 });

  const mangd = parseInt(body.mangd);
  if (!Number.isInteger(mangd) || mangd < 1 || mangd > 100)
    return Response.json({ error: "Mängd måste vara 1–100" }, { status: 400 });

  const [spelare, vara] = await Promise.all([
    sbGet("handel_spelare", `smeknamn=eq.${encodeURIComponent(body.smeknamn)}&select=*`),
    sbGet("handel_varor",   `id=eq.${body.vara_id}&select=*`),
  ]);

  if (!spelare.length) return Response.json({ error: "Spelaren hittades inte" }, { status: 404 });
  if (!vara.length)    return Response.json({ error: "Okänd vara" },             { status: 400 });

  const sp = spelare[0];
  const v  = vara[0];

  // Can only hold one type at a time
  if (sp.last_mangd > 0 && sp.last_vara_id !== v.id)
    return Response.json({ error: `Du bär redan ${sp.last_mangd} enheter av en annan vara — sälj dem först` }, { status: 400 });

  const totalMangd = (sp.last_vara_id === v.id ? sp.last_mangd : 0) + mangd;
  if (totalMangd > 100)
    return Response.json({ error: `Lasten överstiger 100 enheter (du har redan ${sp.last_mangd})` }, { status: 400 });

  const pris = await sbGet("handel_priser", `stad_id=eq.${sp.stad_id}&vara_id=eq.${v.id}&select=kop_pris`);
  if (!pris.length) return Response.json({ error: "Varan säljs inte här" }, { status: 400 });

  const kop_pris = pris[0].kop_pris;
  const totalt   = kop_pris * mangd;

  if (sp.mynt < totalt)
    return Response.json({ error: `Inte nog med mynt — ${mangd}× ${v.namn} kostar ${totalt} 🪙 men du har ${sp.mynt} 🪙` }, { status: 400 });

  await fetch(`${SB_URL}/rest/v1/handel_spelare?smeknamn=eq.${encodeURIComponent(sp.smeknamn)}`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ mynt: sp.mynt - totalt, last_vara_id: v.id, last_mangd: totalMangd, uppdaterad: new Date().toISOString() }),
  });

  await fetch(`${SB_URL}/rest/v1/handel_logg`, {
    method: "POST", headers: H,
    body: JSON.stringify({ spelare_id: sp.id, typ: "kop",
      beskrivning: `Köpte ${mangd}× ${v.ikon} ${v.namn} för ${kop_pris} 🪙/st`, mynt_delta: -totalt }),
  });

  return Response.json({ meddelande: `🛒 Köpte ${mangd}× ${v.ikon} ${v.namn} för ${totalt} 🪙. Last: ${totalMangd}/100.` });
}
