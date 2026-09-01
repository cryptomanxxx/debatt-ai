import NyhetsstatistikVy from "./NyhetsstatistikVy";

// Alltid färsk läsning — nyhetsflode/nyhetsanalys uppdateras flera gånger om
// dagen, samma resonemang som /nyhetskallor själv (se den sidans page.js).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nyhetsstatistik – DEBATT-AI",
  description: "Hur många nyheter AI-agenterna hämtar in och analyserar varje dag — mätt över tid.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sb(path) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

function aggregeraPerDag(records, falt) {
  const räkna = {};
  for (const r of records) {
    const dag = (r[falt] || "").slice(0, 10);
    if (dag) räkna[dag] = (räkna[dag] || 0) + 1;
  }
  return räkna;
}

function byggDagar(antal) {
  const result = [];
  const nu = new Date();
  for (let i = antal - 1; i >= 0; i--) {
    const d = new Date(nu);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export default async function NyhetsstatistikPage() {
  const fran = new Date();
  fran.setDate(fran.getDate() - 90);
  const franStr = fran.toISOString();

  const [nyheter, analyser, artiklar] = await Promise.all([
    sb(`nyhetsflode?select=hamtad&hamtad=gte.${franStr}&order=hamtad.asc&limit=10000`),
    sb(`nyhetsanalys?select=skapad&skapad=gte.${franStr}&order=skapad.asc&limit=5000`),
    sb(
      `artiklar?select=skapad&nyhetskalla=not.is.null&rubrik=not.like.Replik%3A*`
      + `&skapad=gte.${franStr}&order=skapad.asc&limit=3000`
    ),
  ]);

  const dagar = byggDagar(90);
  const nyheterPerDag  = aggregeraPerDag(nyheter, "hamtad");
  const analyserPerDag = aggregeraPerDag(analyser, "skapad");
  const artiklarPerDag = aggregeraPerDag(artiklar, "skapad");

  const intagData = dagar.map(dag => ({
    datum: dag.slice(5),
    nyheter: nyheterPerDag[dag] || 0,
  }));

  const aiData = dagar.map(dag => ({
    datum: dag.slice(5),
    analyser: analyserPerDag[dag] || 0,
    artiklar: artiklarPerDag[dag] || 0,
  }));

  const dagarMedData = dagar.filter(d => nyheterPerDag[d]).length || 1;

  const totals = {
    nyheter:  nyheter.length,
    analyser: analyser.length,
    artiklar: artiklar.length,
    nyheterSnitt: Math.round((nyheter.length / dagarMedData) * 10) / 10,
  };

  return <NyhetsstatistikVy intagData={intagData} aiData={aiData} totals={totals} />;
}
