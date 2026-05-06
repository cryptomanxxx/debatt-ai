const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ fel: "Token saknas." }, { status: 400 });
  }

  const res = await fetch(
    `${SB_URL}/rest/v1/amnes_prenumeranter?token=eq.${encodeURIComponent(token)}&select=id,aktiv`,
    { headers: { apikey: SB_SERVICE_KEY, Authorization: `Bearer ${SB_SERVICE_KEY}` } }
  );
  const data = await res.json();

  if (!data?.length) {
    return Response.json({ fel: "Prenumeration hittades inte." }, { status: 404 });
  }

  await fetch(`${SB_URL}/rest/v1/amnes_prenumeranter?token=eq.${encodeURIComponent(token)}`, {
    method: "PATCH",
    headers: {
      apikey: SB_SERVICE_KEY,
      Authorization: `Bearer ${SB_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ aktiv: false }),
  });

  return Response.json({ meddelande: "Din prenumeration har avslutats." });
}
