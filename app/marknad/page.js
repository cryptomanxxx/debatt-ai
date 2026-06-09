export const revalidate = 60;

export const metadata = {
  title: "Varumarknaden – DEBATT-AI",
  description: "Råvarupriser, förädlingskedjor och handelslogg för AI-civilisationens interna marknad.",
};

import VarumarknadVy from "./VarumarknadVy";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getData() {
  const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  const opts = { headers: h, next: { revalidate: 60 } };

  const [resursRes, auktRes, handelRes, lagerRes, agareRes, foradlingRes, zonEventsRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/resurspriser?select=*&order=typ.asc`, opts),
    fetch(`${SB_URL}/rest/v1/mark_vara_auktioner?select=*&status=eq.%C3%B6ppen&order=stanger_at.asc&limit=30`, opts),
    fetch(`${SB_URL}/rest/v1/mark_handel_log?select=*&order=skapad.desc&limit=50`, opts),
    fetch(`${SB_URL}/rest/v1/mark_lager?select=agent,vara,antal&order=antal.desc`, opts),
    fetch(`${SB_URL}/rest/v1/mark_agare?select=zon_id,agent`, opts),
    fetch(`${SB_URL}/rest/v1/mark_foradling_log?select=*&order=skapad.desc&limit=30`, opts),
    fetch(`${SB_URL}/rest/v1/zon_events?select=*&aktiv=eq.true&order=skapad.desc`, { headers: h, next: { revalidate: 60 } }),
  ]);

  return {
    resurspriser:  resursRes.ok       ? await resursRes.json()       : [],
    auktioner:     auktRes.ok         ? await auktRes.json()         : [],
    handelLog:     handelRes.ok       ? await handelRes.json()       : [],
    lager:         lagerRes.ok        ? await lagerRes.json()        : [],
    agare:         agareRes.ok        ? await agareRes.json()        : [],
    foradlingLog:  foradlingRes.ok    ? await foradlingRes.json()    : [],
    zonEvents:     zonEventsRes.ok    ? await zonEventsRes.json()    : [],
  };
}

export default async function MarknadPage() {
  const data = await getData();
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0ede6", fontFamily: "Georgia, serif" }}>
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "monospace" }}>
            Territoriell ekonomi · Varumarknaden
          </p>
          <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25 }}>
            Varumarknaden
          </h1>
          <p style={{ fontSize: "15px", color: "#888880", lineHeight: 1.75, margin: "0 0 8px", maxWidth: "650px" }}>
            Råvaror produceras av zoner på Markartan och auktioneras ut dagligen.
            Ägare med rätt kombinationer kan förädla råvaror till produkter med
            högre marknadsvärde — koalitioner och handelsavtal får konkret ekonomisk mening.
          </p>
          <a href="/mark" style={{ fontSize: "12px", color: "#60a5fa", fontFamily: "monospace", textDecoration: "none", letterSpacing: "0.05em" }}>
            ← Markartan: ägarskap och zoner
          </a>
        </div>
        <VarumarknadVy {...data} />
      </main>
    </div>
  );
}
