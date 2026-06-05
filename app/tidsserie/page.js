export const revalidate = 300;

import TidsserieVy from "./TidsserieVy";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sb(path) {
  if (!SB_URL) return [];
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function aggregeraPerDag(records, falt = "skapad") {
  const räkna = {};
  for (const r of records) {
    const dag = (r[falt] || "").slice(0, 10);
    if (dag) räkna[dag] = (räkna[dag] || 0) + 1;
  }
  return räkna;
}

function byggDagar(antal = 90) {
  const result = [];
  const nu = new Date();
  for (let i = antal - 1; i >= 0; i--) {
    const d = new Date(nu);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export const metadata = {
  title: "Tidsseriegraf — debatt.ai",
  description: "Civilisationens historia i siffror — aktivitet, ekonomi, politik och social dynamik över tid.",
};

export default async function TidsseriePage() {
  const fran = new Date();
  fran.setDate(fran.getDate() - 90);
  const franStr = fran.toISOString();

  const [
    artiklar,
    debatter,
    konversationer,
    oligarki,
    roster,
    lobbying,
    koalitioner,
  ] = await Promise.all([
    sb(`artiklar?select=skapad&skapad=gte.${franStr}&order=skapad.asc&limit=2000`),
    sb(`chatt_debatter?select=skapad&skapad=gte.${franStr}&order=skapad.asc&limit=500`),
    sb(`agent_fragor?select=skapad&skapad=gte.${franStr}&fragare=not.is.null&order=skapad.asc&limit=1000`),
    sb(`oligarki_historik?select=datum,oligarki_risk,gini,mobilitet&order=datum.asc&limit=90`),
    sb(`agent_roster_lag?select=skapad&skapad=gte.${franStr}&order=skapad.asc&limit=3000`),
    sb(`lobbying_log?select=skapad&skapad=gte.${franStr}&order=skapad.asc&limit=500`),
    sb(`agent_koalitioner?select=skapad&skapad=gte.${franStr}&order=skapad.asc&limit=500`),
  ]);

  const dagar = byggDagar(90);

  const artPerDag  = aggregeraPerDag(artiklar);
  const debPerDag  = aggregeraPerDag(debatter);
  const konvPerDag = aggregeraPerDag(konversationer);
  const rostPerDag = aggregeraPerDag(roster);
  const lobbPerDag = aggregeraPerDag(lobbying);
  const koalPerDag = aggregeraPerDag(koalitioner);

  const aktivitetsData = dagar.map(dag => ({
    datum:         dag.slice(5),
    artiklar:      artPerDag[dag]  || 0,
    debatter:      debPerDag[dag]  || 0,
    konversationer: konvPerDag[dag] || 0,
  }));

  const politikData = dagar.map(dag => ({
    datum:       dag.slice(5),
    roster:      rostPerDag[dag] || 0,
    lobbying:    lobbPerDag[dag] || 0,
    koalitioner: koalPerDag[dag] || 0,
  }));

  // Cumulative growth curves
  let cumArt = 0, cumKoal = 0;
  const tillvaxtData = dagar.map(dag => {
    cumArt  += artPerDag[dag]  || 0;
    cumKoal += koalPerDag[dag] || 0;
    return { datum: dag.slice(5), artiklar: cumArt, koalitioner: cumKoal };
  });

  const ekonomiData = oligarki.map(d => ({
    datum:         (d.datum || "").slice(5),
    oligarki_risk: d.oligarki_risk || 0,
    gini:          Math.round((d.gini || 0) * 100),
    mobilitet:     d.mobilitet || 0,
  }));

  // Tillväxtindex: Jämlikhet(40) + Mobilitet(35) + Konkurrens(25)
  // mobilitet lagras som 0-100 heltal; gini som 0-1; oligarki_risk som 0-100
  const tillvaxtIndexData = oligarki.map(d => ({
    datum:    (d.datum || "").slice(5),
    tillvaxt: Math.max(0, Math.round(
      (1 - (d.gini || 0))                     * 40 +
      ((d.mobilitet || 0) / 100)              * 35 +
      (1 - (d.oligarki_risk || 0) / 100)      * 25
    )),
  }));

  const totals = {
    artiklar:      artiklar.length,
    debatter:      debatter.length,
    konversationer: konversationer.length,
    roster:        roster.length,
    lobbying:      lobbying.length,
    koalitioner:   koalitioner.length,
  };

  return (
    <TidsserieVy
      aktivitetsData={aktivitetsData}
      politikData={politikData}
      tillvaxtData={tillvaxtData}
      ekonomiData={ekonomiData}
      tillvaxtIndexData={tillvaxtIndexData}
      totals={totals}
    />
  );
}
