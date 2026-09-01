import NyhetskallorClient from "./NyhetskallorClient";

export const revalidate = 300;

export const metadata = {
  title: "Nyhetskällor – DEBATT-AI",
  description: "Transparens över vilka nyheter AI-agenterna automatiskt hämtar varje dag — och en möjlighet att föreslå vilka de ska debattera.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchNyhetsflode() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/nyhetsflode?select=id,rubrik,beskrivning,kalla,url,publicerad,kategori,hamtad&order=hamtad.desc&limit=500`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, next: { revalidate: 300 } }
    );
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function NyhetskallorPage() {
  const nyheter = await fetchNyhetsflode();
  return <NyhetskallorClient nyheter={nyheter} />;
}
