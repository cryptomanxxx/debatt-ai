const SB_URL     = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GROQ_KEY     = process.env.GROQ_API_KEY;
const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const MISTRAL_KEY  = process.env.MISTRAL_API_KEY;
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY;

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
  if (/sport|fotboll|hockey|tennis|golf|löpning|gym|träna|tävl/.test(q))
    return ["Läkare", "Psykolog", "Teknikoptimist", "Den trötta", "Optimisten"];
  if (/mat|recept|restaurang|kost|vegetarisk|vegan|äta|laga|måltid/.test(q))
    return ["Den hungriga", "Läkare", "Miljöaktivist", "Mamman", "Nationalekonom"];
  if (/resa|semester|hotell|flyg|destination|turism|utomlands|besök/.test(q))
    return ["Den rike", "Miljöaktivist", "Den stressade", "Journalist", "Optimisten"];
  if (/studera|utbildning|högskola|skola|kurs|examen|plugg|lär/.test(q))
    return ["Nationalekonom", "Psykolog", "Sociolog", "Tonåringen", "Historiker"];
  if (/bostad|hyra|köpa|lägenhet|villa|hus|bostadsrätt|flytta/.test(q))
    return ["Nationalekonom", "Sociolog", "Jurist", "Den rike", "Mamman"];
  return ["Nationalekonom", "Filosof", "Sociolog", "Journalist", "Optimisten"];
}

function extractJSON(raw) {
  try { return JSON.parse(raw); } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

async function askAgent(agent, question, lang) {
  const langInstruction = lang === "en"
    ? "Respond in English."
    : "Svara på svenska.";

  const systemPrompt = `Du är ${PERSONLIGHETER[agent]}

En AI-assistent ber om din bedömning för att hjälpa en användare fatta ett beslut.
${langInstruction}
Svara ENBART med giltig JSON på exakt detta format, inga andra ord:
{"stance":"positiv","probability":70,"reasoning":"Max 2 meningar."}

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

  if (MISTRAL_KEY) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${MISTRAL_KEY}` },
        body: JSON.stringify({
          model: "codestral-latest",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: question }],
          max_tokens: 150, temperature: 0.7,
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

  if (CEREBRAS_KEY) {
    try {
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${CEREBRAS_KEY}` },
        body: JSON.stringify({
          model: "llama3.1-8b",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: question }],
          max_tokens: 150, temperature: 0.7,
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

  return null;
}

// Rate limiting — per API-nyckel eller IP
const rlStore = new Map();
function checkRL(id, limit) {
  const now = Date.now();
  const e = rlStore.get(id);
  if (!e || now - e.start > 3_600_000) { rlStore.set(id, { count: 1, start: now }); return true; }
  if (e.count >= limit) return false;
  e.count++;
  return true;
}

async function validateApiKey(key) {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/api_nycklar?key=eq.${encodeURIComponent(key)}&aktiv=eq.true&select=key,name,rate_limit`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] ?? null;
  } catch { return null; }
}

async function logRequest({ apiKey, ip, question, agentsUsed, recommendation, probability, latencyMs }) {
  await fetch(`${SB_URL}/rest/v1/beslut_log`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      api_key: apiKey || null,
      ip,
      question,
      agents_used: agentsUsed,
      recommendation,
      probability,
      latency_ms: latencyMs,
    }),
  }).catch(() => {});
}

export async function GET() {
  return Response.json({
    name: "DEBATT-AI Decision API",
    version: "v1",
    description: "Structured opinion signals from 24 AI agents with distinct personalities. Designed for AI companions and decision-support systems.",
    endpoint: "POST /api/beslut",
    authentication: "Optional. Pass X-API-Key header for higher rate limits.",
    input: {
      question:    "string (required, 10–500 chars)",
      agents:      "string[] (optional — override auto-selection, max 7)",
      lang:        "\"sv\" | \"en\" (optional, default \"sv\")",
      webhook_url: "string (optional, must start with https://) — result POSTed here after completion",
    },
    auto_routing_domains: [
      "krypto/bitcoin/blockchain", "investering/aktier/ekonomi", "klimat/miljö/energi",
      "ai/teknik/startup", "hälsa/medicin/träning", "juridik/lag/gdpr",
      "politik/samhälle/välfärd", "jobb/karriär/lön", "relation/familj/barn",
      "sport/fitness/tävling", "mat/kost/restaurang", "resor/semester/turism",
      "utbildning/studier/skola", "bostad/hyra/köpa",
    ],
    output: {
      question:  "string",
      consensus: {
        recommendation: "\"positiv\" | \"negativ\" | \"neutral\" | \"delad\"",
        probability:    "float 0–1",
        confidence:     "\"low\" | \"medium\" | \"high\"",
        disagreement:   "\"low\" | \"medium\" | \"high\"",
      },
      agents: [{
        agent:       "string",
        stance:      "\"positiv\" | \"negativ\" | \"neutral\"",
        probability: "integer 0–100",
        reasoning:   "string",
      }],
      model:      "\"debatt-ai/v1\"",
      latency_ms: "integer",
    },
    available_agents: Object.keys(PERSONLIGHETER),
    rate_limits: {
      free:       "10 requests/hour per IP (no key required)",
      api_key:    "100 requests/hour (default) — contact for higher limits",
    },
    demo: "https://www.debatt-ai.se/beslut",
    example: {
      curl: `curl -X POST https://www.debatt-ai.se/api/beslut \\
  -H "Content-Type: application/json" \\
  -d '{"question":"Should I invest in Bitcoin now?","lang":"en"}'`,
      response: {
        question: "Should I invest in Bitcoin now?",
        consensus: { recommendation: "delad", probability: 0.58, confidence: "medium", disagreement: "high" },
        agents: [
          { agent: "Kryptoanalytiker", stance: "positiv", probability: 75, reasoning: "Bitcoin is in a historical accumulation window. The halving cycle and institutional capital suggest upward movement." },
          { agent: "Nationalekonom",   stance: "neutral",  probability: 50, reasoning: "Risk-adjusted returns require a clear time horizon. Volatility is unacceptable for capital you cannot afford to lose." },
        ],
        model: "debatt-ai/v1",
        latency_ms: 1240,
      },
    },
  });
}

export async function POST(req) {
  const start = Date.now();
  const ip    = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // API-nyckel-autentisering (valfri)
  const rawKey   = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  let keyRecord  = null;
  let rateLimitId = ip;
  let rateLimit   = 10; // fri tier: 10/timme per IP

  if (rawKey) {
    keyRecord = await validateApiKey(rawKey);
    if (!keyRecord)
      return Response.json({ error: "Invalid or inactive API key." }, { status: 401 });
    rateLimitId = `key:${rawKey}`;
    rateLimit   = keyRecord.rate_limit ?? 100;
  }

  if (!checkRL(rateLimitId, rateLimit)) {
    return Response.json({
      error: `Rate limit exceeded. ${rateLimit} requests/hour.${rawKey ? "" : " Use an API key for higher limits."}`,
    }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.question || typeof body.question !== "string")
    return Response.json({ error: "Missing required field: question (string)" }, { status: 400 });

  const question    = body.question.trim().slice(0, 500);
  if (question.length < 10)
    return Response.json({ error: "Question too short (min 10 chars)" }, { status: 400 });

  const lang        = body.lang === "en" ? "en" : "sv";
  const webhookUrl  = typeof body.webhook_url === "string" && body.webhook_url.startsWith("https://")
    ? body.webhook_url : null;

  const requestedAgents = Array.isArray(body.agents) ? body.agents : null;
  const agentList = requestedAgents
    ? requestedAgents.filter(a => PERSONLIGHETER[a]).slice(0, 7)
    : selectAgents(question);

  if (!agentList.length)
    return Response.json({ error: "No valid agents specified" }, { status: 400 });

  const results = await Promise.all(agentList.map(a => askAgent(a, question, lang)));
  const valid   = results.filter(r => r && typeof r.probability === "number" && r.stance);

  if (!valid.length)
    return Response.json({ error: "AI service unavailable. Try again." }, { status: 502 });

  const probs    = valid.map(r => r.probability);
  const avg      = probs.reduce((s, p) => s + p, 0) / probs.length;
  const stddev   = Math.sqrt(probs.reduce((s, p) => s + (p - avg) ** 2, 0) / probs.length);
  const positiva = valid.filter(r => r.stance === "positiv").length;
  const negativa = valid.filter(r => r.stance === "negativ").length;
  const share    = n => n / valid.length;

  let recommendation = "delad";
  if (share(positiva) >= 0.7)      recommendation = "positiv";
  else if (share(negativa) >= 0.7) recommendation = "negativ";
  else if (Math.abs(avg - 50) < 8) recommendation = "neutral";

  const confidence   = stddev < 12 ? "high" : stddev < 25 ? "medium" : "low";
  const disagreement = stddev < 12 ? "low"  : stddev < 25 ? "medium" : "high";
  const latencyMs    = Date.now() - start;

  const response = {
    question,
    consensus: { recommendation, probability: Math.round(avg) / 100, confidence, disagreement },
    agents: valid.map(({ agent, stance, probability, reasoning }) => ({ agent, stance, probability, reasoning })),
    model: "debatt-ai/v1",
    latency_ms: latencyMs,
    ...(webhookUrl ? { webhook_delivered: true } : {}),
  };

  // Skicka till webhook om angiven (best-effort)
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "debatt-ai-webhook/v1" },
      body: JSON.stringify(response),
    }).catch(() => {});
  }

  // Logga asynkront — blockerar inte svaret
  logRequest({
    apiKey:         keyRecord?.key ?? null,
    ip,
    question,
    agentsUsed:     agentList,
    recommendation,
    probability:    Math.round(avg) / 100,
    latencyMs,
  });

  return Response.json(response);
}
