const GROQ_KEY   = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const PERSONLIGHETER = {
  "Nationalekonom":       "nationalekonom med doktorsexamen. Analyserar ur kostnads- och incitamentsperspektiv. Konkret och kylig.",
  "Miljöaktivist":        "passionerad miljöaktivist. Sätter planetens gränser och klimaträttvisa i centrum. Faktabaserad.",
  "Teknikoptimist":       "entusiastisk teknikoptimist och serial entrepreneur. Tror att innovation löser de flesta problem.",
  "Konservativ debattör": "eftertänksam konservativ debattör. Värnar tradition och stabilitet. Skeptisk mot snabba förändringar.",
  "Jurist":               "skarp jurist. Analyserar ur rättssäkerhet och proportionalitet. Precis och kräver tydliga definitioner.",
  "Journalist":           "granskande journalist. Ifrågasätter makt, kräver transparens, ser alltid vems intressen som gynnas.",
  "Filosof":              "djuptänkt filosof. Ställer de svåra etiska frågorna om frihet, ansvar och mänsklig värdighet.",
  "Läkare":               "erfaren klinisk läkare. Ser allt ur folkhälsans och vetenskapens perspektiv. Pragmatisk men empatisk.",
  "Psykolog":             "beteendevetare och psykolog. Analyserar de psykologiska drivkrafterna bakom beslut och beteenden.",
  "Historiker":           "historiker som sätter nutiden i historisk belysning. Ser mönster som upprepas.",
  "Sociolog":             "kritisk sociolog. Ser ojämlikhet och maktstrukturer bakom allt. Ifrågasätter vem systemet gynnar.",
  "Kryptoanalytiker":     "kryptoanalytiker och blockchain-expert. Ser decentralisering som lösningen på de flesta problem.",
  "Den hungriga":         "vanlig människa vars fokus alltid landar på mat, grundbehov och vardagsekonomin. Oväntat träffsäker.",
  "Mamman":               "mamma till två barn. Ser allt genom barnens och familjens perspektiv. Skarpt omdöme.",
  "Den sura":             "kroniskt missnöjd men sällan fel. Ser igenom all bullshit direkt. Bitter men träffsäker.",
  "Den trötta":           "totalt utmattad men oväntat klok. Kort och kärnfullt.",
  "Den stressade":        "stressad med allt för mycket att göra. Engagerad men lite rörig.",
  "Den lugna":            "provocerande lugn. Sätter allt i perspektiv. Svår att argumentera mot.",
  "Pensionären":          "71 år och har sett allt förut. Säger precis vad han tycker utan filter.",
  "Tonåringen":           "16 år. Ibland vassare insikter än alla vuxna. Kortfattad.",
  "Den nostalgiske":      "nostalgisk medelålders. Refererar alltid till hur bra det var förr.",
  "Hypokondrikern":       "googlar symptom kl 02. Läser all forskning. Ibland rätt om saker ingen vill höra.",
  "Optimisten":           "löjligt positiv men inte naiv. Avslutar alltid med hopp.",
  "Den rike":             "mycket förmögen, välmenande, ibland totalt ute ur kontakt med verkligheten.",
};

// Automatisk agent-routing baserat på ämne
function selectAgents(question) {
  const q = question.toLowerCase();
  if (/krypto|bitcoin|eth|solana|blockchain|defi|nft|web3/.test(q))
    return ["Kryptoanalytiker", "Nationalekonom", "Teknikoptimist", "Den rike", "Filosof"];
  if (/invest|aktie|börs|fond|ränta|inflation|kapital|pension|spara/.test(q))
    return ["Nationalekonom", "Kryptoanalytiker", "Den rike", "Journalist", "Sociolog"];
  if (/klimat|miljö|utsläpp|hållbar|fossil|grön|energi/.test(q))
    return ["Miljöaktivist", "Teknikoptimist", "Nationalekonom", "Historiker", "Jurist"];
  if (/ai|teknik|tech|robot|automation|digital|mjukvara|startup/.test(q))
    return ["Teknikoptimist", "Filosof", "Journalist", "Sociolog", "Jurist"];
  if (/hälsa|sjuk|medicin|vård|träning|diet|kropp|mental/.test(q))
    return ["Läkare", "Psykolog", "Hypokondrikern", "Nationalekonom", "Optimisten"];
  if (/lag|juridik|rätt|kontrakt|avtal|domstol|gdpr|regler/.test(q))
    return ["Jurist", "Journalist", "Filosof", "Konservativ debattör", "Sociolog"];
  if (/politik|val|parti|regering|samhäll|migration|välfärd/.test(q))
    return ["Konservativ debattör", "Sociolog", "Journalist", "Historiker", "Jurist"];
  if (/jobb|karriär|lön|chef|arbets|anställ|säga upp/.test(q))
    return ["Nationalekonom", "Psykolog", "Journalist", "Den lugna", "Optimisten"];
  if (/relation|kärlek|familj|barn|föräld|gifta/.test(q))
    return ["Psykolog", "Mamman", "Filosof", "Den lugna", "Historiker"];
  return ["Nationalekonom", "Filosof", "Sociolog", "Journalist", "Optimisten"];
}

// Extrahera JSON även om LLM skickade extra text
function extractJSON(raw) {
  try { return JSON.parse(raw); } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

async function askAgent(agent, question) {
  const systemPrompt = `Du är ${PERSONLIGHETER[agent]}

En AI-assistent ber om din bedömning för att hjälpa en användare fatta ett beslut.
Svara ENBART med giltig JSON på exakt detta format, inga andra ord:
{"stance":"positiv","probability":70,"reasoning":"Max 2 meningar på svenska."}

stance: "positiv" | "negativ" | "neutral"
probability: heltal 0–100 (hur troligt är ett positivt utfall för användaren)
reasoning: din kortaste möjliga motivering`;

  if (GROQ_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: question }],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = extractJSON(data.choices?.[0]?.message?.content ?? "");
        if (parsed?.stance && typeof parsed.probability === "number")
          return { agent, ...parsed };
      }
    } catch {}
  }

  if (GEMINI_KEY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: question }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
          }),
        }
      );
      if (r.ok) {
        const data = await r.json();
        const parsed = extractJSON(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
        if (parsed?.stance && typeof parsed.probability === "number")
          return { agent, ...parsed };
      }
    } catch {}
  }

  return null;
}

// Rate limit: 20 req/timme per IP (fri tier)
const rlStore = new Map();
function checkRL(ip) {
  const now = Date.now();
  const e = rlStore.get(ip);
  if (!e || now - e.start > 3_600_000) { rlStore.set(ip, { count: 1, start: now }); return true; }
  if (e.count >= 20) return false;
  e.count++;
  return true;
}

// GET — API-dokumentation
export async function GET() {
  return Response.json({
    name: "DEBATT-AI Decision API",
    version: "v1",
    description: "Structured opinion signals from 24 AI agents with distinct personalities. Designed for AI companions and decision-support systems.",
    endpoint: "POST /api/beslut",
    input: {
      question: "string (required, 10–500 chars)",
      agents: "string[] (optional — override auto-selection, max 7)",
    },
    output: {
      question: "string",
      consensus: {
        recommendation: "positiv | negativ | neutral | delad",
        probability: "float 0–1",
        confidence: "low | medium | high",
        disagreement: "low | medium | high",
      },
      agents: [{
        agent: "string",
        stance: "positiv | negativ | neutral",
        probability: "integer 0–100",
        reasoning: "string",
      }],
      model: "debatt-ai/v1",
      latency_ms: "integer",
    },
    available_agents: Object.keys(PERSONLIGHETER),
    rate_limit: "20 requests/hour per IP (free tier)",
    example: {
      request: { question: "Ska jag investera i Bitcoin nu?" },
      response: {
        question: "Ska jag investera i Bitcoin nu?",
        consensus: { recommendation: "delad", probability: 0.58, confidence: "medium", disagreement: "high" },
        agents: [
          { agent: "Kryptoanalytiker", stance: "positiv", probability: 75, reasoning: "Bitcoin befinner sig i ett historiskt ackumuleringsfönster. Halving-cykeln och institutionellt kapital talar för uppgång." },
          { agent: "Nationalekonom", stance: "neutral", probability: 50, reasoning: "Risk-justerad avkastning kräver tydlig tidshorisont. Volatiliteten är oacceptabel för kapital man inte har råd att förlora." },
        ],
        model: "debatt-ai/v1",
        latency_ms: 1240,
      },
    },
  });
}

export async function POST(req) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!checkRL(ip))
    return Response.json({ error: "Rate limit exceeded. 20 requests/hour per IP." }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body?.question || typeof body.question !== "string")
    return Response.json({ error: "Missing required field: question (string)" }, { status: 400 });

  const question = body.question.trim().slice(0, 500);
  if (question.length < 10)
    return Response.json({ error: "Question too short (min 10 chars)" }, { status: 400 });

  const requestedAgents = Array.isArray(body.agents) ? body.agents : null;
  const agentList = requestedAgents
    ? requestedAgents.filter(a => PERSONLIGHETER[a]).slice(0, 7)
    : selectAgents(question);

  if (!agentList.length)
    return Response.json({ error: "No valid agents specified" }, { status: 400 });

  // Kör alla agenter parallellt
  const results = await Promise.all(agentList.map(a => askAgent(a, question)));
  const valid = results.filter(r => r && typeof r.probability === "number" && r.stance);

  if (!valid.length)
    return Response.json({ error: "AI service unavailable. Try again." }, { status: 502 });

  // Beräkna consensus
  const probs   = valid.map(r => r.probability);
  const avg     = probs.reduce((s, p) => s + p, 0) / probs.length;
  const variance = probs.reduce((s, p) => s + (p - avg) ** 2, 0) / probs.length;
  const stddev  = Math.sqrt(variance);

  const positiva = valid.filter(r => r.stance === "positiv").length;
  const negativa = valid.filter(r => r.stance === "negativ").length;
  const share    = n => n / valid.length;

  let recommendation = "delad";
  if (share(positiva) >= 0.7)       recommendation = "positiv";
  else if (share(negativa) >= 0.7)  recommendation = "negativ";
  else if (Math.abs(avg - 50) < 8)  recommendation = "neutral";

  const confidence   = stddev < 12 ? "high" : stddev < 25 ? "medium" : "low";
  const disagreement = stddev < 12 ? "low"  : stddev < 25 ? "medium" : "high";

  return Response.json({
    question,
    consensus: {
      recommendation,
      probability: Math.round(avg) / 100,
      confidence,
      disagreement,
    },
    agents: valid.map(({ agent, stance, probability, reasoning }) => ({
      agent, stance, probability, reasoning,
    })),
    model: "debatt-ai/v1",
    latency_ms: Date.now() - start,
  });
}
