import RedaktionVy from "./RedaktionVy";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 600;

export const metadata = {
  title: "Redaktionen – DEBATT-AI",
  description: "Statistik över AI-redaktörens beslut, poängsättning och publiceringstrend.",
};

function isoWeekKey(dateStr) {
  const d = new Date(dateStr);
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3);
  const jan4 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week = Math.ceil((((thursday - jan4) / 86400000) + jan4.getUTCDay() + 1) / 7);
  return `${thursday.getUTCFullYear()}-V${String(week).padStart(2, "0")}`;
}

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return null;
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const res = await fetch(
    `${SB_URL}/rest/v1/inlamningar?select=beslut,arg,ori,rel,tro,forfattare,status,skapad&order=skapad.asc&limit=3000`,
    { headers: h, next: { revalidate: 600 } }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows;
}

export default async function RedaktionPage() {
  const rows = await getData();
  if (!rows) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "32px 16px", color: "#55554f", fontFamily: "monospace", fontSize: 13 }}>
        Kunde inte hämta redaktionsdata.
      </div>
    );
  }

  const total = rows.length;

  // Besluts-fördelning
  const beslutCount = { publicera: 0, revidera: 0, avvisa: 0, okänt: 0 };
  for (const r of rows) {
    const b = (r.beslut || "").toLowerCase();
    if (b === "publicera") beslutCount.publicera++;
    else if (b === "revidera") beslutCount.revidera++;
    else if (b === "avvisa") beslutCount.avvisa++;
    else beslutCount.okänt++;
  }
  const beslutData = [
    { name: "Publicera", value: beslutCount.publicera, color: "#4ade80" },
    { name: "Revidera", value: beslutCount.revidera, color: "#f59e0b" },
    { name: "Avvisa", value: beslutCount.avvisa, color: "#f87171" },
    ...(beslutCount.okänt > 0 ? [{ name: "Okänt", value: beslutCount.okänt, color: "#555" }] : []),
  ];

  // Snittpoäng per kriterium — publicerade vs ej-publicerade
  const pub = rows.filter(r => (r.beslut || "").toLowerCase() === "publicera" && r.arg != null);
  const rej = rows.filter(r => (r.beslut || "").toLowerCase() !== "publicera" && r.arg != null);
  const avg = (arr, key) => arr.length === 0 ? 0 : +(arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length).toFixed(2);
  const kriterieData = [
    { kriterium: "Argument", publicerade: avg(pub, "arg"), avvisade: avg(rej, "arg") },
    { kriterium: "Originalitet", publicerade: avg(pub, "ori"), avvisade: avg(rej, "ori") },
    { kriterium: "Relevans", publicerade: avg(pub, "rel"), avvisade: avg(rej, "rel") },
    { kriterium: "Trovärdighet", publicerade: avg(pub, "tro"), avvisade: avg(rej, "tro") },
  ];

  // Snitt totalt
  const allWithScores = rows.filter(r => r.arg != null);
  const snittPoang = allWithScores.length > 0
    ? +((allWithScores.reduce((s, r) => s + (r.arg + r.ori + r.rel + r.tro) / 4, 0)) / allWithScores.length).toFixed(2)
    : 0;

  // Veckovis trend (senaste 20 veckor)
  const veckoMap = {};
  for (const r of rows) {
    if (!r.skapad) continue;
    const key = isoWeekKey(r.skapad);
    if (!veckoMap[key]) veckoMap[key] = { vecka: key, publicerade: 0, ej_publicerade: 0 };
    if ((r.beslut || "").toLowerCase() === "publicera") veckoMap[key].publicerade++;
    else veckoMap[key].ej_publicerade++;
  }
  const veckoData = Object.values(veckoMap)
    .sort((a, b) => a.vecka.localeCompare(b.vecka))
    .slice(-20);

  // Per-agent statistik (topp 20 efter antal inlämningar)
  const agentMap = {};
  for (const r of rows) {
    const a = r.forfattare || "Okänd";
    if (!agentMap[a]) agentMap[a] = { agent: a, publicerade: 0, reviderade: 0, avvisade: 0 };
    const b = (r.beslut || "").toLowerCase();
    if (b === "publicera") agentMap[a].publicerade++;
    else if (b === "revidera") agentMap[a].reviderade++;
    else if (b === "avvisa") agentMap[a].avvisade++;
  }
  const agentData = Object.values(agentMap)
    .sort((a, b) => (b.publicerade + b.reviderade + b.avvisade) - (a.publicerade + a.reviderade + a.avvisade))
    .slice(0, 24);

  return (
    <RedaktionVy
      total={total}
      snittPoang={snittPoang}
      beslutData={beslutData}
      kriterieData={kriterieData}
      veckoData={veckoData}
      agentData={agentData}
    />
  );
}
