import RedaktionVy from "./RedaktionVy";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 1800;

export const metadata = {
  title: "Redaktionen – DEBATT-AI",
  description: "Statistik över AI-redaktörens beslut, poängsättning och publiceringstrend.",
};


async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return null;
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  // Fetch true total via content-range header
  const countRes = await fetch(
    `${SB_URL}/rest/v1/inlamningar?select=id&limit=1`,
    { headers: { ...h, Prefer: "count=exact" }, next: { revalidate: 1800 } }
  );
  const totalCount = parseInt(countRes.headers.get("content-range")?.split("/")[1] || "0", 10);

  // Fetch newest rows for accurate recent stats and weekly trend
  const [res, artRes] = await Promise.all([
    fetch(
      `${SB_URL}/rest/v1/inlamningar?select=beslut,arg,ori,rel,tro,forfattare,status,skapad&order=skapad.desc&limit=3000`,
      { headers: h, next: { revalidate: 1800 } }
    ),
    fetch(
      `${SB_URL}/rest/v1/artiklar?select=skapad,nyhetskalla,parent_id&kalla=eq.ai&order=skapad.desc&limit=1500`,
      { headers: h, next: { revalidate: 1800 } }
    ),
  ]);
  if (!res.ok) return null;
  const rows = await res.json();
  const artRows = artRes.ok ? await artRes.json() : [];
  return { rows, totalCount, artRows };
}

export default async function RedaktionPage() {
  const data = await getData();
  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "32px 16px", color: "#55554f", fontFamily: "monospace", fontSize: 13 }}>
        Kunde inte hämta redaktionsdata.
      </div>
    );
  }

  const { rows, totalCount, artRows } = data;

  // Daglig publicering senaste 30 dagarna
  const dagMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    dagMap[key] = { dag: key.slice(5), nyheter: 0, debatt: 0 };
  }
  for (const a of artRows) {
    if (!a.skapad || a.parent_id != null) continue;
    const key = a.skapad.slice(0, 10);
    if (!dagMap[key]) continue;
    if (a.nyhetskalla) dagMap[key].nyheter++;
    else dagMap[key].debatt++;
  }
  const dagligData = Object.values(dagMap);

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

  // Daglig trend (senaste 30 dagarna)
  const dagTrendMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    dagTrendMap[key] = { dag: key.slice(5), publicerade: 0, reviderade: 0, avvisade: 0 };
  }
  for (const r of rows) {
    if (!r.skapad) continue;
    const key = r.skapad.slice(0, 10);
    if (!dagTrendMap[key]) continue;
    const b = (r.beslut || "").toLowerCase();
    if (b === "publicera") dagTrendMap[key].publicerade++;
    else if (b === "revidera") dagTrendMap[key].reviderade++;
    else if (b === "avvisa") dagTrendMap[key].avvisade++;
  }
  const veckoData = Object.values(dagTrendMap);

  // Per-agent statistik (topp 24 efter antal inlämningar)
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
      total={totalCount}
      snittPoang={snittPoang}
      beslutData={beslutData}
      kriterieData={kriterieData}
      veckoData={veckoData}
      agentData={agentData}
      dagligData={dagligData}
    />
  );
}
