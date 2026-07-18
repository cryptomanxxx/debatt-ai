import TeritoriumSpel from "./TeritoriumSpel";

export const revalidate = 300;

export const metadata = {
  title: "Territorium — debatt.ai",
  description: "Strategispel: erövra hexagoner, expandera ditt territorium och tävla mot AI-agenter. Ett drag per dag.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

async function getData() {
  const now = new Date().toISOString();
  const evRes = await fetch(
    `${SB_URL}/rest/v1/territorium_events?status=eq.aktiv&slut_datum=gte.${now}&order=skapad.desc&limit=1`,
    { headers: H, next: { revalidate: 60 } },
  ).catch(() => null);

  const events = evRes?.ok ? await evRes.json() : [];
  if (!events.length) return { event: null, hexagoner: [], agare: [], senasteDrag: [] };
  const event = events[0];

  const [hxRes, agRes, drRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/territorium_hexagoner?event_id=eq.${event.id}&order=hex_row.asc&order=hex_col.asc`, { headers: H }).catch(() => null),
    fetch(`${SB_URL}/rest/v1/territorium_agare?event_id=eq.${event.id}`, { headers: H }).catch(() => null),
    fetch(`${SB_URL}/rest/v1/territorium_drag?event_id=eq.${event.id}&order=skapad.desc&limit=25`, { headers: H }).catch(() => null),
  ]);

  const [hexagoner, agare, senasteDrag] = await Promise.all([
    hxRes.ok ? hxRes.json() : [],
    agRes.ok ? agRes.json() : [],
    drRes.ok ? drRes.json() : [],
  ]);

  return { event, hexagoner, agare, senasteDrag };
}

export default async function TeritoriumPage() {
  const data = await getData();
  return <TeritoriumSpel initialData={data} />;
}
