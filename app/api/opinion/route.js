const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const headers = () => ({
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=representation",
});

export async function POST(req) {
  try {
    const { fraga, kategori, svar } = await req.json();
    if (!fraga || !["ja", "nej"].includes(svar)) {
      return Response.json({ error: "Ogiltiga parametrar" }, { status: 400 });
    }

    // Hämta aktuella värden
    const getRes = await fetch(
      `${SB_URL}/rest/v1/opinion_roster?fraga=eq.${encodeURIComponent(fraga)}&select=roster_ja,roster_nej`,
      { headers: headers() }
    );
    const rows = getRes.ok ? await getRes.json() : [];
    const current = rows[0] ?? { roster_ja: 0, roster_nej: 0 };

    const upd = {
      fraga,
      kategori: kategori ?? "övrigt",
      roster_ja: current.roster_ja + (svar === "ja" ? 1 : 0),
      roster_nej: current.roster_nej + (svar === "nej" ? 1 : 0),
    };

    const upsertRes = await fetch(
      `${SB_URL}/rest/v1/opinion_roster?on_conflict=fraga`,
      { method: "POST", headers: headers(), body: JSON.stringify(upd) }
    );

    if (!upsertRes.ok) {
      return Response.json({ error: "Databasfel" }, { status: 500 });
    }

    const result = await upsertRes.json();
    return Response.json(result[0] ?? upd);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const res = await fetch(
    `${SB_URL}/rest/v1/opinion_roster?select=fraga,kategori,roster_ja,roster_nej&order=fraga.asc`,
    { headers: headers(), cache: "no-store" }
  );
  const data = res.ok ? await res.json() : [];
  return Response.json(data);
}
