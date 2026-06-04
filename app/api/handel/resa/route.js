const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" };

async function sbGet(table, qs) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${qs}`, { headers: H });
  return r.ok ? r.json() : [];
}

function resekostnad(a, b) {
  const dx = a.svg_x - b.svg_x, dy = a.svg_y - b.svg_y;
  return Math.max(15, Math.floor(Math.sqrt(dx * dx + dy * dy) / 4));
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body?.smeknamn || !body?.till_stad_id)
    return Response.json({ error: "Saknar parametrar" }, { status: 400 });

  const [spelare, tillStad] = await Promise.all([
    sbGet("handel_spelare", `smeknamn=eq.${encodeURIComponent(body.smeknamn)}&select=*`),
    sbGet("handel_städer",  `id=eq.${body.till_stad_id}&select=*`),
  ]);

  if (!spelare.length) return Response.json({ error: "Spelaren hittades inte" }, { status: 404 });
  if (!tillStad.length) return Response.json({ error: "Okänd stad" }, { status: 400 });

  const sp = spelare[0];
  const till = tillStad[0];

  if (sp.stad_id === till.id) return Response.json({ error: "Du är redan i den staden" }, { status: 400 });

  const frånStad = (await sbGet("handel_städer", `id=eq.${sp.stad_id}&select=*`))[0];
  if (!frånStad) return Response.json({ error: "Kunnat inte hitta nuvarande stad" }, { status: 500 });

  const kostnad = resekostnad(frånStad, till);
  if (sp.mynt < kostnad)
    return Response.json({ error: `Inte nog med mynt — resan kostar ${kostnad} 🪙 men du har bara ${sp.mynt} 🪙` }, { status: 400 });

  await fetch(`${SB_URL}/rest/v1/handel_spelare?smeknamn=eq.${encodeURIComponent(sp.smeknamn)}`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ stad_id: till.id, mynt: sp.mynt - kostnad, uppdaterad: new Date().toISOString() }),
  });

  await fetch(`${SB_URL}/rest/v1/handel_logg`, {
    method: "POST", headers: H,
    body: JSON.stringify({ spelare_id: sp.id, typ: "resa",
      beskrivning: `Reste från ${frånStad.namn} till ${till.namn}`, mynt_delta: -kostnad }),
  });

  return Response.json({ meddelande: `⛵ Anlände till ${till.namn}! Reste för ${kostnad} 🪙.` });
}
