const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ fel: "Inget ID" }, { status: 400 });

    const getRes = await fetch(
      `${SB_URL}/rest/v1/amnesforslag?id=eq.${id}&select=roster`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const [row] = await getRes.json();
    const newRoster = (row?.roster || 0) + 1;

    await fetch(`${SB_URL}/rest/v1/amnesforslag?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({ roster: newRoster }),
    });

    return Response.json({ roster: newRoster });
  } catch (e) {
    return Response.json({ fel: String(e) }, { status: 500 });
  }
}
