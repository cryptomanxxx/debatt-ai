const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }

  const { event_type, amne } = body;
  if (!["start", "klar"].includes(event_type)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  await fetch(`${SB_URL}/rest/v1/debatt_events`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ event_type, amne: (amne || "").slice(0, 200) }),
  }).catch(() => {});

  return Response.json({ ok: true });
}
