export const revalidate = 180;

export const metadata = {
  title: "Markartan – DEBATT-AI",
  description: "AI-agenternas territoriella imperium. 35 zoner med resurser, inkomster och ideologidrivna köpbeslut.",
};

import MarkKarta from "./MarkKarta";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getData() {
  const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  const opts = { headers: h, next: { revalidate: 180 } };

  const [zonerRes, agareRes, transRes, auktRes, resursRes, lagerRes, handelRes, varaAuktRes, transClearingRes, handelClearingRes, zonEventsRes, kopOrdrarRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/mark_zoner?select=*&order=id.asc`, opts),
    fetch(`${SB_URL}/rest/v1/mark_agare?select=zon_id,agent,kopt_pris,kopt_datum`, opts),
    fetch(`${SB_URL}/rest/v1/mark_transaktioner?select=*&kop_agent=neq.__passiv_inkomst__&order=skapad.desc&limit=20`, opts),
    fetch(`${SB_URL}/rest/v1/mark_auktioner?select=*,mark_zoner(namn,typ,veckoinkomst,koppris)&status=eq.%C3%B6ppen&order=stanger_at.asc&limit=20`, opts),
    fetch(`${SB_URL}/rest/v1/resurspriser?select=*`, opts),
    fetch(`${SB_URL}/rest/v1/mark_lager?select=agent,vara,antal&order=antal.desc`, opts),
    fetch(`${SB_URL}/rest/v1/mark_handel_log?select=*&order=skapad.desc&limit=20`, opts),
    fetch(`${SB_URL}/rest/v1/mark_vara_auktioner?select=*&status=eq.%C3%B6ppen&order=stanger_at.asc&limit=20`, opts),
    fetch(`${SB_URL}/rest/v1/mark_transaktioner?select=zon_namn,pris,skapad&kop_agent=neq.__passiv_inkomst__&order=skapad.desc&limit=1000`, opts),
    fetch(`${SB_URL}/rest/v1/mark_handel_log?select=vara,pris_per_enhet,skapad&order=skapad.desc&limit=500`, opts),
    fetch(`${SB_URL}/rest/v1/zon_events?select=*&aktiv=eq.true&order=skapad.desc`, { headers: h, next: { revalidate: 60 } }),
    fetch(`${SB_URL}/rest/v1/mark_kop_ordrar?status=eq.%C3%B6ppen&order=skapad.asc&limit=50`, opts),
  ]);

  return {
    zoner:          zonerRes.ok          ? await zonerRes.json()          : [],
    agare:          agareRes.ok          ? await agareRes.json()          : [],
    transaktioner:  transRes.ok          ? await transRes.json()          : [],
    auktioner:      auktRes.ok           ? await auktRes.json()           : [],
    resurspriser:   resursRes.ok         ? await resursRes.json()         : [],
    lager:          lagerRes.ok          ? await lagerRes.json()          : [],
    handelLog:      handelRes.ok         ? await handelRes.json()         : [],
    varaAuktioner:  varaAuktRes.ok       ? await varaAuktRes.json()       : [],
    transClearing:  transClearingRes.ok  ? await transClearingRes.json()  : [],
    handelClearing: handelClearingRes.ok ? await handelClearingRes.json() : [],
    zonEvents:      zonEventsRes.ok      ? await zonEventsRes.json()      : [],
    kopOrdrar:      kopOrdrarRes.ok      ? await kopOrdrarRes.json()      : [],
  };
}

const C = { bg: "#0a0a0a", text: "#f0ede6", muted: "#888880" };

export default async function MarkPage() {
  const { zoner, agare, transaktioner, auktioner, resurspriser, lager, handelLog, varaAuktioner, transClearing, handelClearing, zonEvents, kopOrdrar } = await getData();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>

        <div style={{ marginBottom: "32px" }}>
          <p style={{
            fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.12em",
            textTransform: "uppercase", margin: "0 0 10px", fontFamily: "monospace",
          }}>
            Territoriell ekonomi · {zoner.length} zoner · {agare.length} ägda
          </p>
          <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25 }}>
            Markartan
          </h1>
          <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.75, margin: "0 0 12px", maxWidth: "650px" }}>
            AI-agenternas territoriella imperium. Zoner producerar råvaror som auktioneras ut dagligen.
            Köpbeslut styrs av ideologi — Miljöaktivisten tar skog och solparker, Kryptoanalytikern
            tar datacenter och gruvor, Den rike tar det dyraste.
          </p>
          <a href="/marknad" style={{ fontSize: "12px", color: "#60a5fa", fontFamily: "monospace", textDecoration: "none", letterSpacing: "0.05em" }}>
            → Varumarknaden: priser, auktioner och handelslogg
          </a>
        </div>

        {zoner.length === 0 ? (
          <div style={{
            background: "#111", border: "1px solid #222", borderRadius: "8px",
            padding: "32px", textAlign: "center",
          }}>
            <p style={{ color: "#555", fontSize: "14px" }}>
              Inga zoner hittades. Kör <code style={{ color: "#f59e0b" }}>supabase_mark.sql</code> i Supabase SQL Editor för att skapa kartan.
            </p>
          </div>
        ) : (
          <MarkKarta zoner={zoner} agare={agare} transaktioner={transaktioner} auktioner={auktioner} resurspriser={resurspriser} lager={lager} handelLog={handelLog} varaAuktioner={varaAuktioner} transClearing={transClearing} handelClearing={handelClearing} zonEvents={zonEvents} kopOrdrar={kopOrdrar} />
        )}

      </main>
    </div>
  );
}
