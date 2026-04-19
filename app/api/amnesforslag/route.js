const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  const amne = (body.amne || "").trim();
  if (!amne || amne.length < 5) {
    return Response.json({ fel: "Ämnet är för kort." }, { status: 400 });
  }

  const res = await fetch(`${SB_URL}/rest/v1/amnesforslag`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      amne: amne.slice(0, 300),
      summering: (body.summering || "").trim().slice(0, 1000) || null,
      kalla: "direktdebatt",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Supabase amnesforslag fel:", res.status, errText);
    return Response.json({ fel: "Kunde inte spara förslaget.", detalj: errText }, { status: 500 });
  }
  return Response.json({ ok: true });
}
