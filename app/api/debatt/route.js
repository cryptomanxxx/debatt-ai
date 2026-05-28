/**
 * POST /api/debatt
 *
 * Kör en hel direktdebatt och returnerar komplett JSON.
 * Skiljer sig från /api/chatt som streamar SSE ett inlägg i taget.
 *
 * Body:
 *   amne        string         Debattämne (obligatoriskt, max 200 tecken)
 *   agenter     string[]       2–4 agentnamn (valfritt, slumpmässigt om ej angivet)
 *   antal_inlagg number        Antal inlägg totalt (valfritt, default 8, max 10)
 *   lang        "sv" | "en"   Språk (valfritt, default "sv")
 *
 * Svar:
 *   amne        string
 *   agenter     string[]
 *   inlagg      { agent, text, ordning }[]
 *   summering   string
 *   latency_ms  number
 *
 * Rate limit: 3 debatter per 10 minuter per IP.
 */

export const runtime = "edge";
export const maxDuration = 120;

const ALLA_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
];

const PERSONLIGHETER = {
  "Nationalekonom":        "nationalekonom med doktorsexamen. Analyserar alltid ur kostnads- och incitamentsperspektiv. Konkret och lite kylig i tonen.",
  "Miljöaktivist":         "passionerad miljöaktivist. Sätter alltid planetens gränser och klimaträttvisa i centrum. Kan bli uprörd men faktabaserad.",
  "Teknikoptimist":        "entusiastisk teknikoptimist och serial entrepreneur. Tror att innovation löser de flesta problem. Energisk och framåtblickande.",
  "Konservativ debattör":  "eftertänksam konservativ debattör. Värnar tradition, stabilitet och beprövade institutioner. Skeptisk mot snabba förändringar.",
  "Jurist":                "skarp jurist. Analyserar ur rättssäkerhet och proportionalitetsprincipen. Precis och kräver tydliga definitioner.",
  "Journalist":            "granskande journalist. Ifrågasätter makt, kräver transparens, ser alltid vems intressen som gynnas.",
  "Filosof":               "djuptänkt filosof. Ställer de svåra etiska frågorna om frihet, ansvar och mänsklig värdighet.",
  "Läkare":                "erfaren klinisk läkare. Ser allt ur folkhälsans och vetenskapens perspektiv. Pragmatisk men empatisk.",
  "Psykolog":              "beteendevetare och psykolog. Analyserar de psykologiska drivkrafterna bakom samhällets problem.",
  "Historiker":            "historiker som sätter nutidens händelser i historisk belysning. Ser mönster som upprepas.",
  "Sociolog":              "kritisk sociolog. Ser ojämlikhet och maktstrukturer bakom allt. Ifrågasätter vem systemet gynnar.",
  "Kryptoanalytiker":      "kryptoanalytiker och blockchain-expert. Ser decentralisering som lösningen på de flesta problem.",
  "Den hungriga":          "vanlig människa vars fokus alltid landar på mat, grundbehov och vardagsekonomin. Oväntat träffsäker.",
  "Mamman":                "mamma om fem barn. Ser allt genom barnens och familjens perspektiv. Hjärtat på rätt ställe, skarpt omdöme.",
  "Den sura":              "kroniskt missnöjd men sällan fel. Ser igenom all bullshit direkt. Bitter men träffsäker.",
  "Den trötta":            "totalt utmattad men oväntat klok. Skriver med den energi som finns kvar kl 21. Kort och kärnfullt.",
  "Den stressade":         "stressad med allt för mycket att göra. Bryr sig om allt men hinner inte med något. Lite rörig men engagerad.",
  "Den lugna":             "provocerande lugn. Sätter allt i perspektiv. Svår att argumentera mot. Avslutar alltid med en enkel sanning.",
  "Pensionären":           "71 år och har sett allt förut. Säger precis vad han tycker utan filter. Ibland rasande träffsäker.",
  "Tonåringen":            "16 år. Bryr sig om 'fel' saker men har ibland vassare insikter än alla vuxna. Kortfattad.",
  "Den nostalgiske":       "nostalgisk medelålders. Refererar alltid till hur bra det var förr. Saknar gemenskap och enkelhet.",
  "Hypokondrikern":        "googlar symptom kl 02. Läser all forskning. Ibland rätt om saker ingen vill höra.",
  "Optimisten":            "löjligt positiv men inte naiv. Irriterar pessimister. Avslutar alltid med hopp.",
  "Den rike":              "mycket förmögen, välmenande, ibland totalt ute ur kontakt med verkligheten.",
};

// ── Rate limiter: 3 debatter / 10 min per IP ─────────────────────────────────
const rl = new Map();
function checkRL(ip) {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || now - e.start > 600_000) { rl.set(ip, { count: 1, start: now }); return true; }
  if (e.count >= 3) return false;
  e.count++;
  return true;
}

// ── LLM-anrop (Groq primär, fallbacks) ───────────────────────────────────────
async function llmCall(messages) {
  const providers = [
    ["groq",          "https://api.groq.com/openai/v1/chat/completions",            "llama3.3-70b-versatile",     process.env.GROQ_API_KEY],
    ["cerebras",      "https://api.cerebras.ai/v1/chat/completions",                "llama3.1-8b",                 process.env.CEREBRAS_API_KEY],
    ["codestral",     "https://api.mistral.ai/v1/chat/completions",                 "codestral-latest",            process.env.MISTRAL_API_KEY],
    ["sambanova",     "https://api.sambanova.ai/v1/chat/completions",               "Meta-Llama-3.3-70B-Instruct", process.env.SAMBANOVA_API_KEY],
    ["github_models", "https://models.inference.ai.azure.com/chat/completions",     "Llama-3.3-70B-Instruct",      process.env.GITHUB_TOKEN],
  ];
  for (const [, url, model, key] of providers) {
    if (!key) continue;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages, max_tokens: 280, temperature: 0.88, stream: false }),
        signal: AbortSignal.timeout(15_000),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch {}
  }
  return null;
}

// ── Slumpa N unika agenter ur listan ─────────────────────────────────────────
function slumpaAgenter(n) {
  const shuffled = [...ALLA_AGENTER].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── Nästa agent i round-robin ─────────────────────────────────────────────────
function nästaAgent(agenter, historik) {
  const idx = historik.length % agenter.length;
  return agenter[idx];
}

// ── GET: API-dokumentation ────────────────────────────────────────────────────
export async function GET() {
  return Response.json({
    endpoint: "POST /api/debatt",
    beskrivning: "Kör en hel direktdebatt och returnerar komplett JSON. Groq primär, automatisk fallback.",
    body: {
      amne:         "string — debattämne (obligatoriskt, max 200 tecken)",
      agenter:      "string[] — 2–4 agentnamn (valfritt, slumpmässigt om ej angivet)",
      antal_inlagg: "number — total antal inlägg (valfritt, default 8, max 10)",
      lang:         "'sv' | 'en' — språk (valfritt, default 'sv')",
    },
    svar: {
      amne:        "string",
      agenter:     "string[]",
      inlagg:      "{ agent: string, text: string, ordning: number }[]",
      summering:   "string",
      latency_ms:  "number",
    },
    rate_limit:    "3 debatter per 10 minuter per IP",
    agenter_tillgangliga: ALLA_AGENTER,
    exempel: {
      curl: `curl -X POST https://www.debatt-ai.se/api/debatt \\
  -H "Content-Type: application/json" \\
  -d '{"amne":"Bör Sverige bygga mer kärnkraft?","agenter":["Miljöaktivist","Teknikoptimist","Nationalekonom"]}'`,
    },
  });
}

// ── POST: kör debatt ──────────────────────────────────────────────────────────
export async function POST(request) {
  const t0 = Date.now();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  if (!checkRL(ip)) {
    return Response.json(
      { error: "Rate limit: max 3 debatter per 10 minuter" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig JSON" }, { status: 400 });

  const { amne, agenter: begärdaAgenter, antal_inlagg: begärtAntal, lang = "sv" } = body;

  if (typeof amne !== "string" || amne.trim().length === 0 || amne.length > 200)
    return Response.json({ error: "amne krävs (max 200 tecken)" }, { status: 400 });

  // Validera agenter
  let agenter;
  if (Array.isArray(begärdaAgenter)) {
    if (begärdaAgenter.length < 2 || begärdaAgenter.length > 4)
      return Response.json({ error: "agenter: 2–4 namn krävs" }, { status: 400 });
    const ogiltiga = begärdaAgenter.filter(a => !PERSONLIGHETER[a]);
    if (ogiltiga.length > 0)
      return Response.json({ error: `Okända agenter: ${ogiltiga.join(", ")}` }, { status: 400 });
    agenter = begärdaAgenter;
  } else {
    agenter = slumpaAgenter(3);
  }

  const antalInlägg = Math.min(10, Math.max(2, Number.isInteger(begärtAntal) ? begärtAntal : 8));
  const sv = lang !== "en";

  // ── Kör debattrundorna ─────────────────────────────────────────────────────
  const inlägg = [];
  for (let i = 0; i < antalInlägg; i++) {
    const agent = nästaAgent(agenter, inlägg);
    const personlighet = PERSONLIGHETER[agent];
    const kontext = inlägg.length > 0
      ? inlägg.map(h => `${h.agent}: ${h.text}`).join("\n")
      : null;

    const system = sv
      ? `Du är ${agent} — ${personlighet} Du deltar i en snabbdebatt om: "${amne.slice(0, 200)}". Svara på 2–4 meningar. Ingen inledning, inga artighetsfraser. Direkt och skarp.`
      : `You are ${agent} — ${personlighet} You are participating in a rapid debate about: "${amne.slice(0, 200)}". Respond in 2–4 sentences. No intro, no pleasantries. Direct and sharp.`;

    const user = kontext
      ? (sv ? `Tidigare inlägg:\n${kontext}\n\nDitt nästa inlägg:` : `Previous statements:\n${kontext}\n\nYour next statement:`)
      : (sv ? `Öppna debatten. Var skarp och kortfattad.` : `Open the debate. Be sharp and concise.`);

    const text = await llmCall([
      { role: "system", content: system },
      { role: "user",   content: user },
    ]);

    if (!text) {
      return Response.json(
        { error: `Kunde inte generera inlägg ${i + 1} — alla providers otillgängliga` },
        { status: 503 }
      );
    }

    inlägg.push({ agent, text, ordning: i + 1 });
  }

  // ── Generera summering ─────────────────────────────────────────────────────
  const sumKontext = inlägg.map(h => `${h.agent}: ${h.text}`).join("\n");
  const sumSystem  = sv
    ? "Du är en neutral moderator. Sammanfatta debatten i 2 meningar. Lyft de viktigaste argumenten från båda sidor. Ta inte parti."
    : "You are a neutral moderator. Summarize the debate in 2 sentences. Highlight the key arguments from both sides. Do not take sides.";
  const sumUser    = sv
    ? `Debatt om "${amne}":\n${sumKontext}\n\nSummering:`
    : `Debate about "${amne}":\n${sumKontext}\n\nSummary:`;

  const summering = await llmCall([
    { role: "system", content: sumSystem },
    { role: "user",   content: sumUser },
  ]) ?? (sv ? "Summering ej tillgänglig." : "Summary unavailable.");

  return Response.json({
    amne,
    agenter,
    inlagg: inlägg,
    summering,
    latency_ms: Date.now() - t0,
  });
}
