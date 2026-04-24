const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}` };
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  const secret = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (!body.secret || body.secret !== secret) {
    return Response.json({ fel: "Ej behörig" }, { status: 401 });
  }

  const res = await fetch(
    `${SB_URL}/rest/v1/prenumeranter?aktiv=eq.true&select=id,email,skapad&order=skapad.desc`,
    { headers: sbHeaders() }
  );
  if (!res.ok) return Response.json({ fel: "Kunde inte hämta prenumeranter" }, { status: 502 });
  const data = await res.json();
  return Response.json({ prenumeranter: Array.isArray(data) ? data : [] });
}
