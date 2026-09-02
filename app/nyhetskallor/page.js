import NyhetskallorClient from "./NyhetskallorClient";

// Alltid färsk läsning, som /nyheter — nyhetsflode uppdateras 6 ggr/dag av
// nyhetsflode_test.py, och en ISR-cache (revalidate) riskerar att servera en
// tom snapshot i upp till cache-fönstret om sidan renderades innan tabellen
// hade data (exakt vad som hände direkt efter första manuella körningen).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nyhetskällor – DEBATT-AI",
  description: "Transparens över vilka nyheter AI-agenterna automatiskt hämtar varje dag — och en möjlighet att föreslå vilka de ska debattera.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Måste matcha PAGE_SIZE i NyhetskallorClient.js — sidan hämtar bara den
// FÖRSTA sidan här (SSR); "Ladda fler"-knappen hämtar resten datumbaserat
// (hamtad=lt.<senaste laddade tidsstämpel>) client-side. Tidigare en
// hårdkodad limit=500 utan paginering, vilket dolde all äldre historik och
// gav en missvisande "500 av 500"-etikett även när fler nyheter fanns.
export const NYHETSFLODE_PAGE_SIZE = 150;

// order=hamtad.desc ENSAMT ger ingen deterministisk ordning vid dubblettida
// tidsstämplar — Codex-fynd (PR #1319): nyhetsflode_test.py skriver batchar
// på upp till 200 rader i en enda INSERT, och Postgres now() fryser till EN
// tidsstämpel per sats, så alla rader i en batch kan dela exakt hamtad-värde.
// "Ladda fler"-cursorn (hamtad=lt.<senaste värde>) skulle då hoppa över hela
// resten av en delad tidsstämpel permanent. id (bigserial, monotont) som
// sekundär sorteringsnyckel gör ordningen entydig — måste vara EXAKT samma
// order-sats här som i klientens load-fler-fetch för att sidgränsen ska
// stämma utan luckor eller dubbletter.
export const NYHETSFLODE_ORDER = "hamtad.desc,id.desc";

async function fetchNyhetsflode() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/nyhetsflode?select=id,rubrik,beskrivning,kalla,url,publicerad,kategori,hamtad&order=${NYHETSFLODE_ORDER}&limit=${NYHETSFLODE_PAGE_SIZE}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function NyhetskallorPage() {
  const nyheter = await fetchNyhetsflode();
  return <NyhetskallorClient nyheter={nyheter} pageSize={NYHETSFLODE_PAGE_SIZE} order={NYHETSFLODE_ORDER} />;
}
