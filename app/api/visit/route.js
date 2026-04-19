const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }

  const { visitor_id } = body;
  if (!visitor_id || typeof visitor_id !== "string" || visitor_id.length > 36) {
    return Response.json({ ok: false }, { status: 400 });
  }

  await fetch(`${SB_URL}/rest/v1/visitor_sessions`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ visitor_id }),
  }).catch(() => {});

  return Response.json({ ok: true });
}
