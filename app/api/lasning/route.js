const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  const { id } = await req.json().catch(() => ({}));
  if (!id) return Response.json({ ok: false }, { status: 400 });

  const headers = {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
  };

  const get = await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}&select=lasningar`, { headers });
  if (!get.ok) return Response.json({ ok: false }, { status: 502 });
  const [row] = await get.json();
  if (!row) return Response.json({ ok: false }, { status: 404 });

  await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ lasningar: (row.lasningar || 0) + 1 }),
  });

  return Response.json({ ok: true });
}
