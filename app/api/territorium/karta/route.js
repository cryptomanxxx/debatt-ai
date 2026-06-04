export const dynamic = "force-dynamic";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  if (!event_id) return Response.json({ error: "Saknar event_id" }, { status: 400 });

  const [ar, dr] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/territorium_agare?event_id=eq.${event_id}`, { headers: H }),
    fetch(`${SB_URL}/rest/v1/territorium_drag?event_id=eq.${event_id}&order=skapad.desc&limit=25`, { headers: H }),
  ]);

  const [agare, senasteDrag] = await Promise.all([
    ar.ok ? ar.json() : [],
    dr.ok ? dr.json() : [],
  ]);

  return Response.json({ agare, senasteDrag }, { headers: { "Cache-Control": "no-store" } });
}
