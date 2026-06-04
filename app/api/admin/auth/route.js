const SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!body.pw || body.pw !== SECRET) {
    return Response.json({ ok: false }, { status: 401 });
  }
  return Response.json({ ok: true });
}
