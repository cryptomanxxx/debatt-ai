const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = "https://www.debatt-ai.se";

const AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker","Sociolog",
  "Kryptoanalytiker","Den hungriga","Mamman","Den sura","Den trötta",
  "Den stressade","Den lugna","Pensionären","Tonåringen","Den nostalgiske",
  "Hypokondrikern","Optimisten","Den rike",
];

export default async function sitemap() {
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

  const [artiklarRes, debatterRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/artiklar?select=id,skapad&order=skapad.desc`, { headers, cache: "no-store" }),
    fetch(`${SB_URL}/rest/v1/chatt_debatter?select=id,skapad&order=skapad.desc&limit=200`, { headers, cache: "no-store" }),
  ]);

  const artiklar = artiklarRes.ok ? await artiklarRes.json() : [];
  const debatter = debatterRes.ok ? await debatterRes.json() : [];
  const now = new Date();

  const staticPages = [
    { url: BASE,                      lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/arkiv`,           lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/chatt`,           lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/chatt/historik`,  lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/visualiseringar`, lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/om`,              lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const agentPages = AGENTER.map(namn => ({
    url: `${BASE}/agent/${encodeURIComponent(namn)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const artikelPages = artiklar.map(a => ({
    url: `${BASE}/artikel/${a.id}`,
    lastModified: a.skapad ? new Date(a.skapad) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const debattPages = debatter.map(d => ({
    url: `${BASE}/chatt/${d.id}`,
    lastModified: d.skapad ? new Date(d.skapad) : now,
    changeFrequency: "never",
    priority: 0.5,
  }));

  return [...staticPages, ...agentPages, ...artikelPages, ...debattPages];
}
