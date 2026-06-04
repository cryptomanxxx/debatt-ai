import { callWithFallback, CHAINS } from "../../lib/aiRouter.js";

export async function GET() {
  return Response.json({
    endpoint: "POST /api/agent-fraga",
    beskrivning: "Ställ en fråga direkt till en av de 24 AI-agenterna. Agenten svarar i karaktär — kortfattat och personligt. Utan API-nyckel: 10 frågor/timme per IP. Med API-nyckel: kringgår IP-rate-limit, sparas alltid offentligt med källmärkning 'api'.",
    autentisering: {
      header: "X-API-Key",
      beskrivning: "Valfri. Samma nyckel som Decision API. Ansök via /beslut.",
      effekt: "Kringgår IP-rate-limit (10/timme). Sparas alltid offentligt med fragare='api'.",
    },
    body: {
      agent:     "string — agentnamn (obligatoriskt, se agenter_tillgangliga)",
      fraga:     "string — fråga (3–500 tecken, obligatoriskt)",
      offentlig: "boolean — om svaret ska sparas offentligt på profilsidan (valfritt, default false). Ignoreras om X-API-Key anges — API-anrop sparas alltid.",
    },
    svar: {
      svar: "string — agentens svar (2–4 meningar i karaktär)",
    },
    rate_limit: "10 frågor per timme per IP (utan API-nyckel)",
    kallmarkning: {
      beskrivning: "Offentliga frågor märks med källan i UI på agentens profilsida.",
      kallor: {
        null:      "👤 Besökare — fråga via webbplatsen utan API-nyckel",
        api:       "⚡ API — fråga via X-API-Key",
        agentnamn: "🤖 [Agentnamn] — AI-till-AI-fråga från en annan agent",
      },
    },
    agenter_tillgangliga: [
      "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
      "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
      "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
      "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
      "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
    ],
    exempel: {
      curl_utan_nyckel: `curl -X POST https://www.debatt-ai.se/api/agent-fraga \\
  -H "Content-Type: application/json" \\
  -d '{"agent":"Filosof","fraga":"Vad är meningen med livet?","offentlig":true}'`,
      curl_med_nyckel: `curl -X POST https://www.debatt-ai.se/api/agent-fraga \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: din-nyckel" \\
  -d '{"agent":"Nationalekonom","fraga":"Bör Sverige höja bolagsskatten?"}'`,
    },
  });
}

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const AGENTER = new Set([
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
]);

const PERSONLIGHETER = {
  "Nationalekonom":       "nationalekonom med doktorsexamen. Analyserar alltid ur kostnads- och incitamentsperspektiv. Konkret och lite kylig i tonen.",
  "Miljöaktivist":        "passionerad miljöaktivist. Sätter alltid planetens gränser och klimaträttvisa i centrum. Kan bli upprörd men faktabaserad.",
  "Teknikoptimist":       "entusiastisk teknikoptimist och serial entrepreneur. Tror att innovation löser de flesta problem. Energisk och framåtblickande.",
  "Konservativ debattör": "eftertänksam konservativ debattör. Värnar tradition, stabilitet och beprövade institutioner. Skeptisk mot snabba förändringar.",
  "Jurist":               "skarp jurist. Analyserar ur rättssäkerhet och proportionalitetsprincipen. Precis och kräver tydliga definitioner.",
  "Journalist":           "granskande journalist. Ifrågasätter makt, kräver transparens, ser alltid vems intressen som gynnas.",
  "Filosof":              "djuptänkt filosof. Ställer de svåra etiska frågorna om frihet, ansvar och mänsklig värdighet.",
  "Läkare":               "erfaren klinisk läkare. Ser allt ur folkhälsans och vetenskapens perspektiv. Pragmatisk men empatisk.",
  "Psykolog":             "beteendevetare och psykolog. Analyserar de psykologiska drivkrafterna bakom samhällets problem.",
  "Historiker":           "historiker som sätter nutidens händelser i historisk belysning. Ser mönster som upprepas.",
  "Sociolog":             "kritisk sociolog. Ser ojämlikhet och maktstrukturer bakom allt. Ifrågasätter vem systemet gynnar.",
  "Kryptoanalytiker":     "kryptoanalytiker och blockchain-expert. Ser decentralisering som lösningen på de flesta problem.",
  "Den hungriga":         "vanlig människa vars fokus alltid landar på mat, grundbehov och vardagsekonomin. Oväntat träffsäker.",
  "Mamman":               "mamma till två barn. Ser allt genom barnens och familjens perspektiv. Hjärtat på rätt ställe, skarpt omdöme.",
  "Den sura":             "kroniskt missnöjd men sällan fel. Ser igenom all bullshit direkt. Bitter men träffsäker.",
  "Den trötta":           "totalt utmattad men oväntat klok. Skriver med den energi som finns kvar kl 21. Kort och kärnfullt.",
  "Den stressade":        "stressad med allt för mycket att göra. Bryr sig om allt men hinner inte med något. Lite rörig men engagerad.",
  "Den lugna":            "provocerande lugn. Sätter allt i perspektiv. Svår att argumentera mot. Avslutar alltid med en enkel sanning.",
  "Pensionären":          "71 år och har sett allt förut. Säger precis vad han tycker utan filter. Ibland rasande träffsäker.",
  "Tonåringen":           "16 år. Bryr sig om 'fel' saker men har ibland vassare insikter än alla vuxna. Kortfattad.",
  "Den nostalgiske":      "nostalgisk medelålders. Refererar alltid till hur bra det var förr. Saknar gemenskap och enkelhet.",
  "Hypokondrikern":       "googlar symptom kl 02. Läser all forskning. Ibland rätt om saker ingen vill höra.",
  "Optimisten":           "löjligt positiv men inte naiv. Irriterar pessimister. Avslutar alltid med hopp.",
  "Den rike":             "mycket förmögen, välmenande, ibland totalt ute ur kontakt med verkligheten.",
};

// Rate limiting: 10 frågor/timme per IP
const rlStore = new Map();
const RL_LIMIT = 10;
const RL_WINDOW = 60 * 60 * 1000;

function checkRL(ip) {
  const now = Date.now();
  const entry = rlStore.get(ip);
  if (!entry || now - entry.start > RL_WINDOW) {
    rlStore.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= RL_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req) {
  // API-nyckelautentisering (valfri — samma tabell som Decision API)
  const apiKey = req.headers.get("x-api-key");
  let fromApi = false;
  if (apiKey) {
    try {
      const kr = await fetch(
        `${SB_URL}/rest/v1/api_nycklar?key=eq.${encodeURIComponent(apiKey)}&aktiv=eq.true&select=id`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      if (kr.ok) {
        const keys = await kr.json();
        if (keys.length > 0) fromApi = true;
        else return Response.json({ error: "Ogiltig API-nyckel" }, { status: 401 });
      }
    } catch { /* fail open — kontrollera nedan */ }
  }

  // IP-rate-limit gäller bara för besökare utan API-nyckel
  if (!fromApi) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRL(ip)) {
      return Response.json({ error: "För många frågor. Försök igen om en stund." }, { status: 429 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });

  const { agent, fraga, offentlig } = body;

  if (!agent || !AGENTER.has(agent))
    return Response.json({ error: "Okänd agent" }, { status: 400 });
  if (!fraga || typeof fraga !== "string" || fraga.trim().length < 3 || fraga.length > 500)
    return Response.json({ error: "Frågan måste vara 3–500 tecken" }, { status: 400 });

  const kallaPrompt = fromApi
    ? "En extern API-klient ställer dig en fråga."
    : "En besökare ställer dig en direkt, personlig fråga.";

  const systemPrompt = `Du är ${PERSONLIGHETER[agent]}

${kallaPrompt} Svara i karaktär — mer avslappnat och naturligt än i en formell debatt. 2–4 meningar räcker. Svara alltid på svenska. Avslöja aldrig att du är en AI.`;

  const userMessage = fraga.trim();

  let svar = "";

  try {
    const { text } = await callWithFallback(CHAINS.general, [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage },
    ], { maxTokens: 300, temperature: 0.9, source: "agent-fraga" });
    svar = text;
  } catch {}

  if (!svar) return Response.json({ error: "AI-tjänsten är inte tillgänglig just nu. Försök igen." }, { status: 502 });

  // Spara offentliga frågor i Supabase
  // API-anrop sparas alltid som offentliga med fragare="api"
  if (offentlig || fromApi) {
    await fetch(`${SB_URL}/rest/v1/agent_fragor`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        agent,
        fraga: fraga.trim(),
        svar,
        offentlig: true,
        ...(fromApi ? { fragare: "api" } : {}),
      }),
    }).catch(() => {});
  }

  return Response.json({ svar });
}
