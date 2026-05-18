import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function sbHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// Hämtar befintliga riksdagen_id för att undvika dubletter
async function getBefintligaIds() {
  const r = await fetch(
    `${SB_URL}/rest/v1/lagforslag?kalla=eq.riksdagen&select=riksdagen_id`,
    { headers: sbHeaders() }
  );
  if (!r.ok) return new Set();
  const data = await r.json();
  return new Set(data.map(d => d.riksdagen_id).filter(Boolean));
}

// Försök 1: data.riksdagen.se JSON API
async function hämtaViaApi() {
  const r = await fetch(
    "https://data.riksdagen.se/dokumentlista/?doktyp=prop&utformat=json&sz=10&sort=datum&sortorder=desc",
    { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(10000) }
  );
  if (!r.ok) throw new Error(`API ${r.status}`);
  const data = await r.json();
  const dokument = data?.dokumentlista?.dokument || [];
  return (Array.isArray(dokument) ? dokument : [dokument]).map(d => ({
    dok_id: d.dok_id?.trim(),
    titel: d.titel?.trim().slice(0, 200),
    beskrivning: ((d.notis || "") + " " + (d.notis2 || "")).trim().slice(0, 2000) || `Proposition: ${d.titel}`,
    riksdagen_url: d.url?.startsWith("http") ? d.url : d.url ? `https://www.riksdagen.se${d.url}` : null,
  })).filter(d => d.dok_id && d.titel);
}

// Försök 2: scrapa HTML från riksdagen.se
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

  // Extrahera propositionslänkar
  const forslag = [];
  // Matcha href-mönster för propositioner: /sv/dokument-och-lagar/dokument/proposition/XX/
  const lankRegex = /href="(\/sv\/dokument-och-lagar\/dokument\/proposition\/[^"]+?)"/g;
  const titelRegex = /<h[23][^>]*>([^<]{10,200})<\/h[23]>/g;
  const seeddaRegex = /(\d{4}\/\d{2}:\d+)/g;

  const lankar = [...new Set([...html.matchAll(lankRegex)].map(m => m[1]))].slice(0, 10);

  for (const lank of lankar) {
    // Hämta detaljsida
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
  const { password } = await req.json().catch(() => ({}));
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Obehörig" }, { status: 401 });
  }

  const befintliga = await getBefintligaIds();
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
  const fel = [];

  for (const d of forslag) {
    if (befintliga.has(d.dok_id)) continue;
    const r = await fetch(`${SB_URL}/rest/v1/lagforslag`, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        titel: d.titel,
        beskrivning: d.beskrivning,
        kategori: "Övrigt",
        kalla: "riksdagen",
        riksdagen_id: d.dok_id,
        riksdagen_url: d.riksdagen_url,
        status: "omrostning",
      }),
    });
    if (r.ok) importerade++;
    else fel.push(d.titel?.slice(0, 40));
  }

  return NextResponse.json({ importerade, totalt: forslag.length, metod, fel });
}
