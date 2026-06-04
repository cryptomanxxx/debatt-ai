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

  const sn = body.smeknamn.trim();
  if (sn.length < 2 || sn.length > 20)
    return Response.json({ error: "Smeknamnet måste vara 2–20 tecken" }, { status: 400 });

  // Check if player already exists → treat as login
  const existing = await sbGet("handel_spelare", `smeknamn=eq.${encodeURIComponent(sn)}&select=id`);
  if (existing.length) return Response.json({ meddelande: `Välkommen tillbaka, ${sn}!` });

  // Find Stockholm
  const städer = await sbGet("handel_städer", `namn=eq.Stockholm&select=id`);
  if (!städer.length) return Response.json({ error: "Städer saknas — kör supabase_handel.sql" }, { status: 500 });

  await fetch(`${SB_URL}/rest/v1/handel_spelare`, {
    method: "POST", headers: H,
    body: JSON.stringify({ smeknamn: sn, mynt: 1000, stad_id: städer[0].id, last_mangd: 0 }),
  });

  return Response.json({ meddelande: `Välkommen, ${sn}! Du startar i Stockholm med 1 000 mynt. 🚢` });
}
