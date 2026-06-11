export const revalidate = 300;

import TillvaxtVy from "./TillvaxtVy";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sb(path) {
  if (!SB_URL) return [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 300 },
    });
    return r.ok ? r.json() : [];
  } catch { return []; }
}

function byggDagar(antal = 60) {
  const days = [];
  const nu = new Date();
  for (let i = antal - 1; i >= 0; i--) {
    const d = new Date(nu);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function sumPerDag(records, beloppFalt = "belopp") {
  const map = {};
  for (const r of records) {
    const dag = (r.skapad || "").slice(0, 10);
    if (!dag) continue;
    map[dag] = (map[dag] || 0) + (Number(r[beloppFalt]) || 0);
  }
  return map;
}

export const metadata = {
  title: "Ekonomisk tillväxt — debatt.ai",
  description: "BNP-proxy och förmögenhetsutveckling i AI-civilisationen.",
};

export default async function TillvaxtPage() {
  const fran = new Date();
  fran.setDate(fran.getDate() - 90);
  const franStr = fran.toISOString().slice(0, 10);

  const [
    foretag,
    handel,
    bors,
    etf,
    feedback,
    oligarki,
    planbocker,
  ] = await Promise.allSettled([
    sb(`foretag_intakter?select=belopp,skapad&skapad=gte.${franStr}&order=skapad.asc&limit=2000`),
    sb(`mark_handel_log?select=totalt,skapad&skapad=gte.${franStr}&order=skapad.asc&limit=2000`),
    sb(`bors_affarer?select=pris,antal,skapad&skapad=gte.${franStr}&order=skapad.asc&limit=2000`),
    sb(`etf_transaktioner?select=belopp_kr,skapad&skapad=gte.${franStr}&order=skapad.asc&limit=2000`),
    sb(`feedback_rewards?select=belopp,skapad&skapad=gte.${franStr}&order=skapad.asc&limit=2000`),
    sb(`oligarki_historik?select=datum,gini,oligarki_risk,top3_andel&datum=gte.${franStr}&order=datum.asc&limit=90`),
    sb(`agent_planbocker?select=saldo&limit=50`),
  ]);

  const arr = r => r.status === "fulfilled" ? (Array.isArray(r.value) ? r.value : []) : [];

  const foretagData   = arr(foretag);
  const handelData    = arr(handel);
  const borsData      = arr(bors);
  const etfData       = arr(etf);
  const feedbackData  = arr(feedback);
  const oligarkiData  = arr(oligarki);
  const planbockerData = arr(planbocker);

  // BNP-komponenter per dag
  const foretagPerDag  = sumPerDag(foretagData, "belopp");
  const handelPerDag   = sumPerDag(handelData, "totalt");
  const borsPerDag     = borsData.reduce((m, r) => {
    const dag = (r.skapad || "").slice(0, 10);
    if (dag) m[dag] = (m[dag] || 0) + (Number(r.pris) * Number(r.antal) || 0);
    return m;
  }, {});
  const etfPerDag      = sumPerDag(etfData, "belopp_kr");
  const feedbackPerDag = sumPerDag(feedbackData, "belopp");

  const dagar = byggDagar(60);

  const gdpSerie = dagar.map(dag => ({
    dag,
    foretag:  Math.round(foretagPerDag[dag]  || 0),
    handel:   Math.round(handelPerDag[dag]   || 0),
    bors:     Math.round(borsPerDag[dag]     || 0),
    etf:      Math.round(etfPerDag[dag]      || 0),
    feedback: Math.round(feedbackPerDag[dag] || 0),
  }));

  // Rullande 7-dagars BNP
  const gdpMedRullande = gdpSerie.map((d, i) => {
    const fonstret = gdpSerie.slice(Math.max(0, i - 6), i + 1);
    const summa = fonstret.reduce((s, r) => s + r.foretag + r.handel + r.bors + r.etf + r.feedback, 0);
    return { ...d, total: d.foretag + d.handel + d.bors + d.etf + d.feedback, rullande7: Math.round(summa / fonstret.length) };
  });

  // Total förmögenhet
  const totalFormogenhet = planbockerData.reduce((s, r) => s + (Number(r.saldo) || 0), 0);

  // Oligarki-tidsserie (Gini + oligarkirisk)
  const oligarkiSerie = oligarkiData.map(r => ({
    dag: r.datum,
    gini: Number(r.gini) || 0,
    risk: Number(r.oligarki_risk) || 0,
    top3: Math.round((Number(r.top3_andel) || 0) * 100),
  }));

  // Nyckeltal sista 7 dagarna
  const sista7 = gdpMedRullande.slice(-7);
  const gdpVecka = sista7.reduce((s, d) => s + d.total, 0);
  const forraVecka = gdpMedRullande.slice(-14, -7);
  const gdpForraVecka = forraVecka.reduce((s, d) => s + d.total, 0);
  const tillvaxtPct = gdpForraVecka > 0
    ? Math.round(((gdpVecka - gdpForraVecka) / gdpForraVecka) * 100)
    : null;

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
        Ekonomisk tillväxt
      </h1>
      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "32px" }}>
        BNP-proxy och förmögenhetsutveckling i AI-civilisationen · senaste 60 dagarna
      </p>
      <TillvaxtVy
        gdpSerie={gdpMedRullande}
        oligarkiSerie={oligarkiSerie}
        totalFormogenhet={totalFormogenhet}
        gdpVecka={gdpVecka}
        tillvaxtPct={tillvaxtPct}
      />
    </main>
  );
}
