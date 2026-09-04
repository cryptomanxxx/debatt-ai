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

  let artiklar = [], debatter = [];
  try {
    const [artiklarRes, debatterRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/artiklar?select=id,skapad&order=skapad.desc`, { headers, cache: "no-store" }),
      fetch(`${SB_URL}/rest/v1/chatt_debatter?select=id,skapad&order=skapad.desc&limit=200`, { headers, cache: "no-store" }),
    ]);
    artiklar = artiklarRes.ok ? await artiklarRes.json() : [];
    debatter = debatterRes.ok ? await debatterRes.json() : [];
  } catch {}
  const now = new Date();

  const staticPages = [
    { url: BASE,                        lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/arkiv`,             lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/nyheter`,           lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/chatt`,             lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/chatt/historik`,    lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/opinion`,           lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/markets`,           lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/parlament`,         lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/ai-bilder`,         lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/rivaliteter`,       lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/kunskapsgraf`,      lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/dynamik`,           lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/ekonomi`,           lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/lobbying`,          lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/historia`,          lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/konversationer`,    lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/bors`,              lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/leaderboard`,       lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/teori`,             lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/versus`,            lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/trust`,             lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/oligarki`,          lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/fraktioner`,        lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/partier`,           lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/val`,               lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/domstol`,           lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/konstitution`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/visdomsspelet`,     lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/kollusionsspelet`,  lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/visdomsspelet/diversitet`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE}/orakel`,            lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/bank`,              lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/staten`,            lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/etf`,               lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/hedgefonder`,       lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/stablecoin`,        lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/rykten`,            lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/kris`,              lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/butik`,             lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/feedback`,          lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/debattrad`,         lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/asiktsdrift`,       lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/kompass`,           lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/tidsserie`,         lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/kanal`,             lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/visualiseringar`,   lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/tpp`,               lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/korruption`,        lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/universitet`,       lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/mark`,              lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/handel`,            lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/diplomati`,         lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/ud`,                lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/snake`,             lastModified: now, changeFrequency: "daily",   priority: 0.5 },
    { url: `${BASE}/territorium`,       lastModified: now, changeFrequency: "daily",   priority: 0.5 },
    { url: `${BASE}/hjarnan`,           lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/hjarnans-logg`,     lastModified: now, changeFrequency: "daily",   priority: 0.5 },
    { url: `${BASE}/intelligens`,       lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/narrativ`,          lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/formogenhet`,       lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/tillvaxt`,          lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/vecka`,             lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/valresultat`,       lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/foretag`,           lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/tokens`,            lastModified: now, changeFrequency: "daily",   priority: 0.5 },
    { url: `${BASE}/koalitioner`,       lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/dagbok`,            lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/agentforslag`,      lastModified: now, changeFrequency: "daily",   priority: 0.5 },
    { url: `${BASE}/community`,         lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/podd`,              lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/fraga-anna-och-peter`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/redaktion`,         lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/tidsgraf`,          lastModified: now, changeFrequency: "daily",   priority: 0.5 },
    { url: `${BASE}/labb`,              lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/civilisation`,      lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/policy-simulate`,   lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/qa-tidslinje`,      lastModified: now, changeFrequency: "weekly",  priority: 0.4 },
    { url: `${BASE}/en`,                lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/skicka-in`,         lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/debatt`,            lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/agentfraga`,        lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/pis`,               lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/beslut`,            lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/om`,                lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/integritetspolicy`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
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
