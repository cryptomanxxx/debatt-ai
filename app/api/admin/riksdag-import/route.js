import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

function sbHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function kategorifrånText(titel, beskrivning) {
  const text = ((titel || "") + " " + (beskrivning || "")).toLowerCase();
  if (/klimat|miljö|utsläpp|koldioxid|hållbar|energi|förnybar|kärnkraft|natur|biologisk mångfald|skog|vatten/.test(text)) return "Klimat & Miljö";
  if (/skatt|budget|ekonomi|tillväxt|inflation|skuld|finansiell|finans|kostnad|avgift|konjunktur/.test(text)) return "Ekonomi";
  if (/sjukvård|hälsa|vård|omsorg|patient|läkare|sjukhus|psykiatri|tandvård|folkhälsa/.test(text)) return "Sjukvård";
  if (/skola|utbildning|gymnasium|grundskola|högskola|universitet|lärare|elev|student/.test(text)) return "Utbildning";
  if (/migration|asyl|flyktingar|invandring|utvisning|medborgarskap/.test(text)) return "Migration";
  if (/försvar|militär|nato|säkerhet|krig|fred|totalförsvar|beredskap/.test(text)) return "Försvar";
  if (/bostäder|bostad|hyra|fastighet|mark|planering|byggande/.test(text)) return "Bostad";
  if (/kriminalitet|brott|polis|rättsväsen|straff|fängelse|gäng/.test(text)) return "Rättsväsen";
  if (/arbete|jobb|anställning|lön|arbetsmarknad|fackförbund|a-kassa|sysselsättning/.test(text)) return "Arbetsmarknad";
  if (/integration|segregation|diskriminering|jämlikhet|jämställdhet/.test(text)) return "Integration";
  if (/infrastruktur|trafik|väg|järnväg|kollektivtrafik|flygplats|hamn/.test(text)) return "Infrastruktur";
  if (/digitalisering|ai |teknik|internet|\bit\b|data|cybersäkerhet/.test(text)) return "Teknik";
  if (/socialbidrag|fattigdom|välfärd|barnbidrag|pension|äldre|försäkring/.test(text)) return "Välfärd";
  if (/jordbruk|lantbruk|livsmedel|mat|fiske|landsbygd/.test(text)) return "Jordbruk";
  if (/kultur|idrott|sport|media|konst|bibliotek|film/.test(text)) return "Kultur";
  return "Övrigt";
}

function normTitle(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

async function getBefintligaData() {
  const r = await fetch(
    `${SB_URL}/rest/v1/lagforslag?kalla=eq.riksdagen&select=riksdagen_id,titel`,
    { headers: sbHeaders() }
  );
  if (!r.ok) return { ids: new Set(), titlar: new Set() };
  const data = await r.json();
  return {
    ids: new Set(data.map(d => d.riksdagen_id).filter(Boolean)),
    titlar: new Set(data.map(d => normTitle(d.titel)).filter(Boolean)),
  };
}

function byggUrl(d) {
  if (d.url?.startsWith("http")) return d.url;
  if (d.url) return `https://www.riksdagen.se${d.url}`;
  return d.dok_id ? `https://data.riksdagen.se/dokument/${d.dok_id}.html` : null;
}

async function hämtaDoktyp(doktyp, rm = null) {
  const rmParam = rm ? `&rm=${encodeURIComponent(rm)}` : "";
  const r = await fetch(
    `https://data.riksdagen.se/dokumentlista/?doktyp=${doktyp}&utformat=json&sz=50&sort=datum&sortorder=desc${rmParam}`,
    { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(10000) }
  );
  if (!r.ok) throw new Error(`API ${r.status}`);
  const data = await r.json();
  const dokument = data?.dokumentlista?.dokument || [];
  const fallback = doktyp === "prop" ? "Proposition" : doktyp === "mot" ? "Motion" : "Betänkande";
  return (Array.isArray(dokument) ? dokument : [dokument]).map(d => {
    let url = byggUrl(d);
    // Säkerställ rätt URL-struktur per dokumenttyp — ParlamentKlient.js filtrerar på dessa
    if (doktyp === "prop" && url && !url.includes("/proposition/")) {
      url = `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/proposition/${d.dok_id?.trim()}/`;
    } else if (doktyp === "bet" && url && !url.includes("/betankande/")) {
      url = `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/${d.dok_id?.trim()}/`;
    }
    return {
      dok_id: d.dok_id?.trim(),
      titel: d.titel?.trim().slice(0, 200),
      beskrivning: ((d.notis || "") + " " + (d.notis2 || "")).trim().slice(0, 2000) || `${fallback}: ${d.titel}`,
      riksdagen_url: url,
    };
  }).filter(d => d.dok_id && d.titel);
}

async function hämtaViaApi() {
  // Betänkanden (bet) importeras för att riksdagen röstar på dem direkt →
  // tillhor_dok_id i voteringlista matchar bet-dok_id → utfall kan hämtas automatiskt.
  // Hämtar även förra sessionen (2024/25) som är helt avslutad — alla bet har röstats på.
  const [propositioner, motioner, betankanden, betGamla] = await Promise.allSettled([
    hämtaDoktyp("prop"),
    hämtaDoktyp("mot"),
    hämtaDoktyp("bet"),
    hämtaDoktyp("bet", "2024/25"),
  ]);

  // Om alla fyra misslyckas — kasta så att HTML-fallbacken i POST aktiveras
  if (propositioner.status === "rejected" && motioner.status === "rejected" && betankanden.status === "rejected" && betGamla.status === "rejected") {
    throw new Error(`prop: ${propositioner.reason?.message} | mot: ${motioner.reason?.message} | bet: ${betankanden.reason?.message} | bet2024: ${betGamla.reason?.message}`);
  }

  const forslag = [
    ...(propositioner.status === "fulfilled" ? propositioner.value : []),
    ...(motioner.status === "fulfilled" ? motioner.value : []),
    ...(betankanden.status === "fulfilled" ? betankanden.value : []),
    ...(betGamla.status === "fulfilled" ? betGamla.value : []),
  ];

  await Promise.all(forslag.map(async (item) => {
    try {
      const dr = await fetch(
        `https://data.riksdagen.se/dokumentstatus/${item.dok_id}.json`,
        { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(8000) }
      );
      if (!dr.ok) return;
      const dd = await dr.json();
      const sammanfattning = dd?.dokumentstatus?.dokument?.sammanfattning?.trim();
      if (sammanfattning && sammanfattning.length > (item.beskrivning?.length || 0)) {
        item.beskrivning = sammanfattning.slice(0, 3000);
      }
    } catch {}
  }));

  await Promise.all(forslag.map(async (item) => {
    if ((item.beskrivning?.length || 0) >= 500) return;
    const url = item.riksdagen_url;
    if (!url) return;
    try {
      const dr = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; debatt-ai.se/1.0)",
          "Accept": "text/html",
          "Accept-Language": "sv-SE,sv;q=0.9",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!dr.ok) return;
      const html = await dr.text();

      const huvud = html.match(
        /Propositionens huvudsakliga inneh[åa]ll([\s\S]{100,4000}?)(?=<h[123]|<\/(?:div|section|article)>)/i
      )?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      const brödtext = html.match(
        /<(?:article|main)[^>]*>([\s\S]{200,4000}?)<\/(?:article|main)>/
      )?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      const kandidater = [huvud, brödtext].filter(t => t && t.length > 200);
      const bäst = kandidater.sort((a, b) => b.length - a.length)[0];
      if (bäst && bäst.length > (item.beskrivning?.length || 0)) {
        item.beskrivning = bäst.slice(0, 3000);
      }
    } catch {}
  }));

  return forslag;
}

async function hämtaViaHtml() {
  const r = await fetch(
    "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/proposition/",
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; debatt-ai.se/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "sv-SE,sv;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!r.ok) throw new Error(`HTML ${r.status}`);
  const html = await r.text();

  const forslag = [];
  const lankRegex = /href="(\/sv\/dokument-och-lagar\/dokument\/proposition\/[^"]+?)"/g;
  const lankar = [...new Set([...html.matchAll(lankRegex)].map(m => m[1]))].slice(0, 10);

  for (const lank of lankar) {
    try {
      const dr = await fetch(`https://www.riksdagen.se${lank}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; debatt-ai.se/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!dr.ok) continue;
      const dhtml = await dr.text();

      const titelMatch = dhtml.match(/<h1[^>]*>([^<]{10,300})<\/h1>/);
      const titel = titelMatch?.[1]?.replace(/&amp;/g, "&").replace(/&#\d+;/g, "").trim();
      if (!titel) continue;

      const ingress = dhtml.match(/class="[^"]*ingress[^"]*"[^>]*>([^<]{20,500})</)?.[1]?.trim()
        || dhtml.match(/<meta name="description" content="([^"]{20,400})"/)?.[1]?.trim()
        || "";

      const dokIdMatch = lank.match(/\/([a-z0-9]+\d+[a-z]?\d*)\/?$/i);
      const dok_id = dokIdMatch?.[1] || lank.replace(/\//g, "-").slice(-20);

      forslag.push({
        dok_id,
        titel: titel.slice(0, 200),
        beskrivning: ingress.slice(0, 2000) || `Proposition från riksdagen: ${titel}`,
        riksdagen_url: `https://www.riksdagen.se${lank}`,
      });
    } catch { continue; }
  }
  return forslag;
}

export async function POST(req) {
  const befintliga = await getBefintligaData();
  let forslag = [];
  let metod = "";

  try {
    forslag = await hämtaViaApi();
    metod = "api";
  } catch (e1) {
    try {
      forslag = await hämtaViaHtml();
      metod = "html";
    } catch (e2) {
      return NextResponse.json({ error: `Både API och HTML misslyckades. API: ${e1.message}. HTML: ${e2.message}` }, { status: 502 });
    }
  }

  let importerade = 0;
  let omkategoriserade = 0;
  const fel = [];

  for (const d of forslag) {
    const kategori = kategorifrånText(d.titel, d.beskrivning);
    const finnsByID = befintliga.ids.has(d.dok_id);
    // Betänkanden dedupliceras bara på dok_id — deras titlar matchar ofta propositionstitlar
    const isBetankande = d.riksdagen_url?.includes("/betankande/");
    const finnsByTitle = !isBetankande && befintliga.titlar.has(normTitle(d.titel));

    if (finnsByID || finnsByTitle) {
      if (finnsByID) {
        await fetch(
          `${SB_URL}/rest/v1/lagforslag?riksdagen_id=eq.${encodeURIComponent(d.dok_id)}`,
          {
            method: "PATCH",
            headers: { ...sbHeaders(), Prefer: "return=minimal" },
            body: JSON.stringify({
              kategori,
              beskrivning: d.beskrivning,
              ...(d.riksdagen_url ? { riksdagen_url: d.riksdagen_url } : {}),
            }),
          }
        );
        omkategoriserade++;
      }
      continue;
    }

    const r = await fetch(`${SB_URL}/rest/v1/lagforslag`, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        titel: d.titel,
        beskrivning: d.beskrivning,
        kategori,
        kalla: "riksdagen",
        riksdagen_id: d.dok_id,
        riksdagen_url: d.riksdagen_url,
        status: "omrostning",
      }),
    });
    if (r.ok) importerade++;
    else fel.push(d.titel?.slice(0, 40));
  }

  return NextResponse.json({ importerade, omkategoriserade, totalt: forslag.length, metod, fel });
}
