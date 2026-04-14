const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ fel: "Ogiltig JSON" }, { status: 400 }); }

  const { token } = body;
  if (!token) return Response.json({ fel: "Token saknas." }, { status: 400 });

  const res = await fetch(`${SB_URL}/rest/v1/prenumeranter?token=eq.${encodeURIComponent(token)}`, {
    method: "PATCH",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ aktiv: false }),
  });

  if (!res.ok) return Response.json({ fel: "Kunde inte avsluta prenumeration." }, { status: 500 });
  return Response.json({ meddelande: "Du är avprenumererad." });
}
