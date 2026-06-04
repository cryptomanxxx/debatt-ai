import { createClient } from "@supabase/supabase-js";
import TeritoriumSpel from "./TeritoriumSpel";

export const revalidate = 60;

export const metadata = {
  title: "Territorium — debatt.ai",
  description: "Strategispel: erövra hexagoner, expandera ditt territorium och tävla mot AI-agenter. Ett drag per dag.",
};

const SB = createClient(
  "https://fmwxftnistkoqazfwnuj.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function getData() {
  const { data: events } = await SB
    .from("territorium_events")
    .select("*")
    .eq("status", "aktiv")
    .order("skapad", { ascending: false })
    .limit(1);

  if (!events?.length) return { event: null, hexagoner: [], agare: [], senasteDrag: [] };
  const event = events[0];

  const [{ data: hexagoner }, { data: agare }, { data: senasteDrag }] = await Promise.all([
    SB.from("territorium_hexagoner").select("*").eq("event_id", event.id).order("hex_row").order("hex_col"),
    SB.from("territorium_agare").select("*").eq("event_id", event.id),
    SB.from("territorium_drag").select("*").eq("event_id", event.id).order("skapad", { ascending: false }).limit(25),
  ]);

  return {
    event,
    hexagoner:  hexagoner  ?? [],
    agare:      agare      ?? [],
    senasteDrag: senasteDrag ?? [],
  };
}

export default async function TeritoriumPage() {
  const data = await getData();
  return <TeritoriumSpel initialData={data} />;
}
