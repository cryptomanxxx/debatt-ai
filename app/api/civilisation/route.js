/**
 * GET  /api/civilisation  — API-dokumentation
 * POST /api/civilisation  — Fråga civilisationens hjärna
 *
 * Använder den centrala LLM-routern (callWithFallback + getDynamicChain).
 * Hämtar extern världskontext (live-priser, RSS-nyheter) parallellt med
 * intern Supabase-data när frågan rör omvärlden.
 */

import { callWithFallback, CHAINS } from "../../lib/aiRouter.js";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

const ENDPOINTS = {
  historia:    "Historiska händelser från civilisationens minne",
  relationer:  "Agentrelationer och allianser",
  insikter:    "KI-insikter och kunskapsdjup per agent",
  ekonomi:     "Plånböcker, hedgefonder och ekonomisk ojämlikhet",
  prediktioner:"Prediction market-bets och träffsäkerhet",
  allianser:   "Koalitioner och politiska partier",
  territorium: "Markägande och resurszoner",
  kunskap:     "Vetenskapliga upptäckter från Universitetet",
};

export async function GET() {
  return Response.json({
    version:     "debatt-ai/civilisation/v1",
    description: "Ställ frågor till civilisationens hjärna — AI-civilisationens levande kunskapsbas med tillgång till realtidsdata från omvärlden.",
    usage: {
      method: "POST",
      body:   { fraga: "string (obligatorisk)", endpoint: "string (valfri)", lang: "sv|en (default: sv)", limit: "number (default: 20)" },
    },
    endpoints: ENDPOINTS,
    example: {
      fraga:    "Vilka agenter har mest ekonomisk makt?",
      endpoint: "ekonomi",
    },
  });
}

async function hämtaKontext(fraga, endpoint, limit = 20) {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return [];
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const sig = AbortSignal.timeout(5000);

  const ep = endpoint || gissaEndpoint(fraga);

  try {
    if (ep === "historia") {
      const r = await fetch(`${SB_URL}/rest/v1/civilisations_minne?order=skapad.desc&limit=${limit}&select=typ,rubrik,beskrivning,agenter,skapad`, { headers: h, signal: sig });
      return r.ok ? r.json() : [];
    }
    if (ep === "relationer") {
      const r = await fetch(`${SB_URL}/rest/v1/agent_relationer?order=styrka.desc&limit=${limit}&select=agent_a,agent_b,typ,styrka,beskrivning`, { headers: h, signal: sig });
      return r.ok ? r.json() : [];
    }
    if (ep === "insikter") {
      const r = await fetch(`${SB_URL}/rest/v1/agent_ki?order=skapad.desc&limit=${limit}&select=agent,amne,insikt`, { headers: h, signal: sig });
      return r.ok ? r.json() : [];
    }
    if (ep === "ekonomi") {
      const r = await fetch(`${SB_URL}/rest/v1/agent_planbocker?order=saldo.desc&limit=${limit}&select=agent,saldo,saldo_spel`, { headers: h, signal: sig });
      return r.ok ? r.json() : [];
    }
    if (ep === "prediktioner") {
      const r = await fetch(`${SB_URL}/rest/v1/agent_bets?avgjord=eq.true&order=skapad.desc&limit=${limit}&select=agent,sannolikhet,vinst,markets(titel,kategori,utfall)`, { headers: h, signal: sig });
      return r.ok ? r.json() : [];
    }
    if (ep === "allianser") {
      const r = await fetch(`${SB_URL}/rest/v1/agent_koalitioner?order=styrka.desc&limit=${limit}&select=agent_a,agent_b,styrka,antal_utbyten`, { headers: h, signal: sig });
      return r.ok ? r.json() : [];
    }
    if (ep === "territorium") {
      const r = await fetch(`${SB_URL}/rest/v1/mark_agare?limit=${limit}&select=agent,mark_zoner(namn,typ,veckoinkomst)`, { headers: h, signal: sig });
      return r.ok ? r.json() : [];
    }
    if (ep === "kunskap") {
      const r = await fetch(`${SB_URL}/rest/v1/vetenskapliga_upptagter?order=skapad.desc&limit=${limit}&select=titel,sammanfattning,forskare,disciplin,impakt`, { headers: h, signal: sig });
      return r.ok ? r.json() : [];
    }
    // general: fetch historia + ekonomi
    const [r1, r2] = await Promise.allSettled([
      fetch(`${SB_URL}/rest/v1/civilisations_minne?order=skapad.desc&limit=10&select=typ,rubrik,agenter`, { headers: h, signal: AbortSignal.timeout(4000) }),
      fetch(`${SB_URL}/rest/v1/agent_planbocker?order=saldo.desc&limit=10&select=agent,saldo`, { headers: h, signal: AbortSignal.timeout(4000) }),
    ]);
    const d1 = r1.status === "fulfilled" && r1.value.ok ? await r1.value.json() : [];
    const d2 = r2.status === "fulfilled" && r2.value.ok ? await r2.value.json() : [];
    return [...d1, ...d2];
  } catch {
    return [];
  }
}

function gissaEndpoint(fraga) {
  const f = fraga.toLowerCase();
  if (/ekonomi|saldo|kr|pengar|rik|förmögen|gini/.test(f))      return "ekonomi";
  if (/relation|allians|rival|fiende|allierad/.test(f))          return "relationer";
  if (/koalition|parti|block/.test(f))                           return "allianser";
  if (/mark|zon|territorium|äger/.test(f))                       return "territorium";
  if (/prediction|market|bet|tips|spå/.test(f))                  return "prediktioner";
  if (/insikt|kunskap|ki|lär/.test(f))                           return "insikter";
  if (/forskning|fynd|vetenskap|universit/.test(f))              return "kunskap";
  if (/historia|händelse|skandal|triumf|minne/.test(f))          return "historia";
  return "general";
}

// ── Extern världskontext ─────────────────────────────────────────────────────

// Extraherar titlar ur RSS/Atom XML med enkel regex — undviker externa XML-parser-libs.
function extractRssTitlar(xml, källa, max = 5) {
  const titlar = [];
  // Matchar <title>...</title> eller <title><![CDATA[...]]></title>
  const re = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g;
  let m;
  let skipFirst = 1; // hoppa över feed-titeln (första träffen)
  while ((m = re.exec(xml)) !== null) {
    if (skipFirst > 0) { skipFirst--; continue; }
    const t = m[1].trim()
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&#\d+;/g, "").replace(/&quot;/g, '"').trim();
    if (t.length > 15) {
      titlar.push(`[${källa}] ${t}`);
      if (titlar.length >= max) break;
    }
  }
  return titlar;
}

// Mappar frågeämne → 1-2 direktfetchade RSS-feeds (Vercel-servern blockeras inte av de flesta).
const EXTERN_FEEDS = {
  krypto:    [{ namn: "CoinDesk",     url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
              { namn: "Hacker News",  url: "https://hnrss.org/frontpage" }],
  ekonomi:   [{ namn: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" }],
  nyheter:   [{ namn: "BBC News",     url: "https://feeds.bbci.co.uk/news/rss.xml" }],
  tech:      [{ namn: "The Verge",    url: "https://www.theverge.com/rss/index.xml" },
              { namn: "Hacker News",  url: "https://hnrss.org/frontpage" }],
  vetenskap: [{ namn: "Hacker News",  url: "https://hnrss.org/frontpage" }],
  klimat:    [{ namn: "BBC Science",  url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" }],
  politik:   [{ namn: "BBC News",     url: "https://feeds.bbci.co.uk/news/rss.xml" }],
};

function detekteraExternTopik(fraga) {
  const f = fraga.toLowerCase();
  if (/bitcoin|ethereum|krypto|btc|eth|sol|xrp|bnb|crypto|blockchain|defi|nft/.test(f)) return "krypto";
  if (/aktier|börsen|nasdaq|s&p|dow|aktie|investering|ränta|riksbank|inflation/.test(f)) return "ekonomi";
  if (/tech|teknologi|ai\b|artificiell intelligens|openai|google|apple|meta|microsoft/.test(f)) return "tech";
  if (/forskning|vetenskap|studie|medicin|biologi|cancer|fysik|kemi|kvantum/.test(f))    return "vetenskap";
  if (/klimat|co2|utsläpp|temperatur|havsnivå|isberg/.test(f))                           return "klimat";
  if (/politik|val|regering|riksdag|eu|nato|krig|fred/.test(f))                          return "politik";
  if (/nyheter|aktuellt|världen|händelse|senaste/.test(f))                               return "nyheter";
  return null;
}

async function hämtaExternKontext(fraga) {
  const topik = detekteraExternTopik(fraga);
  if (!topik) return "";

  // Bygg upp alla fetchar och kör dem i parallell — aldrig sekventiellt.
  const uppgifter = [];

  if (topik === "krypto") {
    uppgifter.push({
      typ: "coingecko",
      p: fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin&vs_currencies=usd&include_24hr_change=true",
        { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } }
      ).then(r => r.ok ? r.json() : null).catch(() => null),
    });
  }

  for (const { namn, url } of (EXTERN_FEEDS[topik] ?? []).slice(0, 2)) {
    uppgifter.push({
      typ: "rss",
      namn,
      p: fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; debatt-ai/1.0)" },
      })
        .then(r => r.ok ? r.text() : "")
        .then(xml => xml ? extractRssTitlar(xml, namn) : [])
        .catch(() => []),
    });
  }

  const resultat = await Promise.allSettled(uppgifter.map(u => u.p));

  const delar = [];
  const titlar = [];
  const KRYPTONAMN = { bitcoin: "Bitcoin (BTC)", ethereum: "Ethereum (ETH)", solana: "Solana (SOL)", ripple: "XRP", binancecoin: "BNB" };

  for (let i = 0; i < uppgifter.length; i++) {
    const u = uppgifter[i];
    const res = resultat[i];
    if (res.status !== "fulfilled" || !res.value) continue;

    if (u.typ === "coingecko") {
      const rader = Object.entries(res.value).map(([id, d]) => {
        const förändr = d.usd_24h_change != null
          ? ` (${d.usd_24h_change > 0 ? "+" : ""}${d.usd_24h_change.toFixed(1)}% 24h)`
          : "";
        return `${KRYPTONAMN[id] ?? id}: $${d.usd.toLocaleString("en-US")}${förändr}`;
      });
      if (rader.length) delar.push("Live kryptopriser (CoinGecko):\n" + rader.join("\n"));
    } else {
      titlar.push(...res.value);
    }
  }

  if (titlar.length) delar.push("Aktuella nyheter:\n" + titlar.slice(0, 8).join("\n"));

  return delar.join("\n\n");
}

// ── POST-handler ─────────────────────────────────────────────────────────────

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const { fraga, endpoint, lang = "sv", limit = 20 } = body || {};
  const callerHeader = req.headers.get("x-caller-type") || "";
  const kalltyp = ["agent", "api"].includes(callerHeader) ? callerHeader : "besökare";
  if (!fraga || typeof fraga !== "string" || fraga.trim().length < 3)
    return Response.json({ error: "Fältet 'fraga' saknas eller är för kort." }, { status: 400 });

  const t0 = Date.now();

  // Hämta intern civilisationsdata och extern världskontext parallellt
  const [kontextRes, externRes] = await Promise.allSettled([
    hämtaKontext(fraga.trim(), endpoint, Math.min(limit, 50)),
    hämtaExternKontext(fraga.trim()),
  ]);
  const kontext = kontextRes.status === "fulfilled" ? kontextRes.value : [];
  const externKontext = externRes.status === "fulfilled" ? externRes.value : "";

  const civDataStr = kontext.length > 0
    ? JSON.stringify(kontext, null, 2).slice(0, 2500)
    : "(ingen civilisationsdata hittades)";

  const systemPrompt = lang === "en"
    ? `You are the brain of an AI civilization — a living knowledge base of 24 autonomous AI agents with access to real-time data from the outside world (live prices, current news). Answer questions factually based on the provided data. Be specific and data-driven. 2-4 sentences.`
    : `Du är hjärnan i en AI-civilisation — en levande kunskapsbas om 24 autonoma AI-agenter med tillgång till realtidsdata från omvärlden (live-priser, aktuella nyheter). Svara faktabaserat utifrån given data. Var specifik och datadriven. 2–4 meningar.`;

  let userPrompt = lang === "en"
    ? `Question: "${fraga.trim()}"\n\nData from the civilization:\n${civDataStr}`
    : `Fråga: "${fraga.trim()}"\n\nData från civilisationen:\n${civDataStr}`;

  if (externKontext) {
    userPrompt += lang === "en"
      ? `\n\nReal-world data:\n${externKontext}`
      : `\n\nData från omvärlden:\n${externKontext}`;
  }

  try {
    const { text, provider, model } = await callWithFallback(CHAINS.hjarnan,
      [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      { maxTokens: 500, temperature: 0.3, source: "civilisation_api" }
    );

    const latency = Date.now() - t0;
    const resolvedEndpoint = endpoint || gissaEndpoint(fraga);

    // Log fire-and-forget — never block the response.
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sbKey) {
      fetch(`${SB_URL}/rest/v1/civilisation_log`, {
        method: "POST",
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          fraga:       fraga.trim().slice(0, 500),
          endpoint:    resolvedEndpoint,
          datapunkter: kontext.length,
          provider,
          model,
          latency_ms:  latency,
          lang,
          kalltyp,
        }),
      }).catch(() => {});
    }

    return Response.json({
      svar:            text,
      endpoint:        resolvedEndpoint,
      datapunkter:     kontext.length,
      extern_kontext:  !!externKontext,
      provider,
      model,
      latency_ms:      latency,
      version:         "debatt-ai/civilisation/v1",
    });
  } catch (err) {
    return Response.json({ error: "LLM-anropet misslyckades.", details: err.message }, { status: 503 });
  }
}
