/**
 * POST /api/v1/policy/simulate
 * Policy Impact Simulator — on-demand makroekonomisk analys av lagförslag.
 *
 * Kör samma modell som AI-Parlamentets interna PIS-pipeline men exponerad
 * som ett öppet API. Resultaten sparas i Supabase och är tillgängliga för
 * återanvändning av parlamentets agenter.
 *
 * Autentisering: valfri X-API-Key header (samma nyckel som /api/beslut).
 * Rate limit: 5 req/timme (fri tier) · 20 req/timme (API-nyckel).
 */

const SB_URL   = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// ── Rate limiting ──────────────────────────────────────────────────────────
const rlStore = new Map();
function checkRL(id, limit) {
  const now = Date.now();
  const e = rlStore.get(id);
  if (!e || now - e.start > 3_600_000) { rlStore.set(id, { count: 1, start: now }); return true; }
  if (e.count >= limit) return false;
  e.count++;
  return true;
}

// ── API-nyckel-validering ──────────────────────────────────────────────────
async function validateApiKey(key) {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/api_nycklar?key=eq.${encodeURIComponent(key)}&aktiv=eq.true&select=key,name,rate_limit`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (!res.ok) return null;
    return (await res.json())?.[0] ?? null;
  } catch { return null; }
}

// ── Groq-anrop ─────────────────────────────────────────────────────────────
async function groqCall(messages, maxTokens = 480, temperature = 0.35) {
  if (!GROQ_KEY) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });
    if (!res.ok) return null;
    return (await res.json())?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch { return null; }
}

async function geminiCall(system, userPrompt, maxTokens = 480) {
  if (!GEMINI_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.35 },
        }),
      }
    );
    if (!res.ok) return null;
    return (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch { return null; }
}

// ── PIS-prompt (identisk med Python-pipelinen) ─────────────────────────────
const PIS_SYSTEM =
  "Du är en oberoende nationalekonom och statsvetare som bedömer svenska lagförslags " +
  "makroekonomiska och sociala konsekvenser på 3–5 års sikt. " +
  "Var analytisk, balanserad och ange alltid osäkerheter.";

function buildPisPrompt(titel, beskrivning, shortAnalys = false) {
  return (
    `Lagförslag: "${titel}"\n\n` +
    `${String(beskrivning || "").slice(0, 700)}\n\n` +
    "Analysera detta förslags sannolika konsekvenser. " +
    `Svara EXAKT i detta format (${shortAnalys ? "börja direkt med BNP_EFFEKT, ingen annan text" : "inga andra ord, börja direkt med BNP_EFFEKT"}):\n` +
    "BNP_EFFEKT: [procent av BNP, t.ex. +1.2 eller -0.5]\n" +
    "GINI_EFFEKT: [Δ Gini-koefficient, t.ex. -0.02 eller +0.01]\n" +
    "INFLATION_DELTA: [förändring i procentenheter, t.ex. +0.3 eller -0.1]\n" +
    "ARBETSLOSHET_DELTA: [förändring i procentenheter, t.ex. -0.5 eller +0.2]\n" +
    "SOCIALT_KAPITAL: [positiv, negativ eller neutral]\n" +
    "KOALITIONS_STABILITET: [positiv, negativ eller neutral]\n" +
    "KONFIDENS: [låg, medel eller hög]\n" +
    (shortAnalys
      ? "ANALYS: [en mening]\n"
      : "ANALYS: [120–180 ord på svenska — ekonomiska mekanismer, berörda grupper, sociala effekter, osäkerheter]\n")
  );
}

// ── Parse-helpers ──────────────────────────────────────────────────────────
function parseFloat_(line) {
  try {
    return parseFloat(line.split(":")[1].trim().replace(",", ".").replace("+", "").split(/\s/)[0]);
  } catch { return null; }
}

function parseRiktning(line) {
  const v = line.split(":")[1]?.trim().toLowerCase();
  return ["positiv", "negativ", "neutral"].includes(v) ? v : "neutral";
}

function parseKonfidens(line) {
  const v = line.split(":")[1]?.trim().toLowerCase();
  return ["låg", "medel", "hög"].includes(v) ? v : "låg";
}

function parsePisResponse(raw) {
  if (!raw || raw.length < 20) return null;
  let bnp = null, gini = null, inflation = null, arbetsloshet = null;
  let socKap = "neutral", koaStab = "neutral", konfidens = "låg", analys = "";

  for (const line of raw.split("\n")) {
    const u = line.trim().toUpperCase();
    if (u.startsWith("BNP_EFFEKT:"))            bnp = parseFloat_(line);
    else if (u.startsWith("GINI_EFFEKT:"))       gini = parseFloat_(line);
    else if (u.startsWith("INFLATION_DELTA:"))   inflation = parseFloat_(line);
    else if (u.startsWith("ARBETSLOSHET_DELTA:")) arbetsloshet = parseFloat_(line);
    else if (u.startsWith("SOCIALT_KAPITAL:"))   socKap = parseRiktning(line);
    else if (u.startsWith("KOALITIONS_STABILITET:")) koaStab = parseRiktning(line);
    else if (u.startsWith("KONFIDENS:"))         konfidens = parseKonfidens(line);
    else if (u.startsWith("ANALYS:"))            analys = line.split(":").slice(1).join(":").trim();
    else if (analys)                             analys += " " + line.trim();
  }

  if (!analys || analys.length < 20) return null;
  return { bnp, gini, inflation, arbetsloshet, socKap, koaStab, konfidens, analys: analys.trim().slice(0, 1500) };
}

function parseMcIteration(raw) {
  if (!raw || raw.length < 20) return null;
  let bnp = null, gini = null, inflation = null, arbetsloshet = null;
  let socKap = null, koaStab = null, konfidens = null;

  for (const line of raw.split("\n")) {
    const u = line.trim().toUpperCase();
    if (u.startsWith("BNP_EFFEKT:"))            bnp = parseFloat_(line);
    else if (u.startsWith("GINI_EFFEKT:"))       gini = parseFloat_(line);
    else if (u.startsWith("INFLATION_DELTA:"))   inflation = parseFloat_(line);
    else if (u.startsWith("ARBETSLOSHET_DELTA:")) arbetsloshet = parseFloat_(line);
    else if (u.startsWith("SOCIALT_KAPITAL:"))   { const v = parseRiktning(line); if (v !== "neutral" || line.toLowerCase().includes("neutral")) socKap = v; }
    else if (u.startsWith("KOALITIONS_STABILITET:")) { const v = parseRiktning(line); koaStab = v; }
    else if (u.startsWith("KONFIDENS:"))         konfidens = parseKonfidens(line);
  }

  if (bnp === null && gini === null) return null;
  return { bnp, gini, inflation, arbetsloshet, socKap, koaStab, konfidens };
}

// ── Statistikhelper ────────────────────────────────────────────────────────
function stats(vals) {
  const clean = vals.filter(v => v !== null && !isNaN(v));
  if (!clean.length) return null;
  const n = clean.length;
  const mean = clean.reduce((a, b) => a + b, 0) / n;
  const variance = n > 1 ? clean.reduce((a, b) => a + (b - mean) ** 2, 0) / n : 0;
  return {
    mean: Math.round(mean * 1000) / 1000,
    std:  Math.round(Math.sqrt(variance) * 1000) / 1000,
    min:  Math.round(Math.min(...clean) * 1000) / 1000,
    max:  Math.round(Math.max(...clean) * 1000) / 1000,
  };
}

function dist(vals) {
  const d = {};
  for (const v of vals) if (v) d[v] = (d[v] || 0) + 1;
  return d;
}

// ── Kör standard PIS-analys ────────────────────────────────────────────────
async function runPisAnalysis(titel, beskrivning) {
  const messages = [
    { role: "system", content: PIS_SYSTEM },
    { role: "user",   content: buildPisPrompt(titel, beskrivning) },
  ];
  let raw = await groqCall(messages, 480, 0.35);
  if (!raw) raw = await geminiCall(PIS_SYSTEM, buildPisPrompt(titel, beskrivning));
  return parsePisResponse(raw);
}

// ── Kör Monte Carlo (parallella iterationer) ───────────────────────────────
async function runMonteCarlo(titel, beskrivning, iterationer = 8) {
  const temps = [0.6, 0.7, 0.8, 0.9];
  const prompt = buildPisPrompt(titel, beskrivning, true);

  const calls = Array.from({ length: iterationer }, (_, i) =>
    groqCall(
      [{ role: "system", content: PIS_SYSTEM }, { role: "user", content: prompt }],
      160,
      temps[i % temps.length]
    ).then(raw => parseMcIteration(raw))
  );

  const results = await Promise.all(calls);
  const valid = results.filter(Boolean);

  if (valid.length < 3) return null;

  const bnp_s   = stats(valid.map(r => r.bnp));
  const gini_s  = stats(valid.map(r => r.gini));
  const inf_s   = stats(valid.map(r => r.inflation));
  const arb_s   = stats(valid.map(r => r.arbetsloshet));

  return {
    iterationer,
    lyckade_iterationer: valid.length,
    bnp:          bnp_s,
    gini:         gini_s,
    inflation:    inf_s  ? { mean: inf_s.mean, std: inf_s.std } : null,
    arbetsloshet: arb_s  ? { mean: arb_s.mean, std: arb_s.std } : null,
    socialt_kapital_dist: dist(valid.map(r => r.socKap)),
    koalition_dist:       dist(valid.map(r => r.koaStab)),
    konfidens_dist:       dist(valid.map(r => r.konfidens)),
  };
}

// ── Supabase-helpers ───────────────────────────────────────────────────────
const SB_HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=representation",
};

async function fetchCachedAnalys(lagforslagId) {
  try {
    const [aRes, mcRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/pis_analyser?lagforslag_id=eq.${lagforslagId}&select=*`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      }),
      fetch(`${SB_URL}/rest/v1/pis_monte_carlo?lagforslag_id=eq.${lagforslagId}&select=*`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      }),
    ]);
    const analys = aRes.ok ? (await aRes.json())[0] ?? null : null;
    const mc     = mcRes.ok ? (await mcRes.json())[0] ?? null : null;
    return { analys, mc };
  } catch { return { analys: null, mc: null }; }
}

async function createLagforslag(titel, beskrivning) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/lagforslag`, {
      method: "POST",
      headers: SB_HEADERS,
      body: JSON.stringify({
        titel:       titel.slice(0, 300),
        beskrivning: String(beskrivning || "").slice(0, 2000),
        kalla:       "api",
        status:      "omrostning",
      }),
    });
    if (!res.ok) return null;
    return (await res.json())?.[0]?.id ?? null;
  } catch { return null; }
}

async function saveAnalys(lagforslagId, a) {
  await fetch(`${SB_URL}/rest/v1/pis_analyser`, {
    method: "POST",
    headers: SB_HEADERS,
    body: JSON.stringify({
      lagforslag_id:          lagforslagId,
      bnp_effekt_pct:         a.bnp,
      gini_effekt:            a.gini,
      inflation_delta:        a.inflation,
      arbetsloshet_delta:     a.arbetsloshet,
      socialt_kapital_effekt: a.socKap,
      koalition_stabilitet:   a.koaStab,
      sysselsattning_effekt:  (a.arbetsloshet ?? 0) < 0 ? "positiv" : (a.arbetsloshet ?? 0) > 0 ? "negativ" : "neutral",
      analys:                 a.analys,
      konfidens:              a.konfidens,
    }),
  }).catch(() => {});
}

async function saveMonteCarlo(lagforslagId, mc) {
  await fetch(`${SB_URL}/rest/v1/pis_monte_carlo`, {
    method: "POST",
    headers: SB_HEADERS,
    body: JSON.stringify({
      lagforslag_id:           lagforslagId,
      iterationer:             mc.iterationer,
      lyckade_iterationer:     mc.lyckade_iterationer,
      bnp_mean:     mc.bnp?.mean,      bnp_std:  mc.bnp?.std,
      bnp_min:      mc.bnp?.min,       bnp_max:  mc.bnp?.max,
      gini_mean:    mc.gini?.mean,     gini_std: mc.gini?.std,
      gini_min:     mc.gini?.min,      gini_max: mc.gini?.max,
      inflation_mean:    mc.inflation?.mean,    inflation_std:    mc.inflation?.std,
      arbetsloshet_mean: mc.arbetsloshet?.mean, arbetsloshet_std: mc.arbetsloshet?.std,
      socialt_kapital_dist: mc.socialt_kapital_dist,
      koalition_dist:       mc.koalition_dist,
      konfidens_dist:       mc.konfidens_dist,
    }),
  }).catch(() => {});
}

// ── Formatera cached DB-svar till API-format ───────────────────────────────
function formatCachedAnalys(row) {
  return {
    bnp_effekt_pct:         row.bnp_effekt_pct,
    gini_effekt:            row.gini_effekt,
    inflation_delta:        row.inflation_delta,
    arbetsloshet_delta:     row.arbetsloshet_delta,
    socialt_kapital_effekt: row.socialt_kapital_effekt,
    koalition_stabilitet:   row.koalition_stabilitet,
    konfidens:              row.konfidens,
    analys:                 row.analys,
  };
}

function formatCachedMc(row) {
  if (!row) return null;
  return {
    iterationer:         row.iterationer,
    lyckade_iterationer: row.lyckade_iterationer,
    bnp:          row.bnp_mean   !== null ? { mean: row.bnp_mean,   std: row.bnp_std,   min: row.bnp_min,  max: row.bnp_max  } : null,
    gini:         row.gini_mean  !== null ? { mean: row.gini_mean,  std: row.gini_std,  min: row.gini_min, max: row.gini_max } : null,
    inflation:    row.inflation_mean    !== null ? { mean: row.inflation_mean,    std: row.inflation_std    } : null,
    arbetsloshet: row.arbetsloshet_mean !== null ? { mean: row.arbetsloshet_mean, std: row.arbetsloshet_std } : null,
    socialt_kapital_dist: row.socialt_kapital_dist,
    koalition_dist:       row.koalition_dist,
    konfidens_dist:       row.konfidens_dist,
  };
}

// ── GET — API-dokumentation ────────────────────────────────────────────────
export async function GET() {
  return Response.json({
    name:        "DEBATT-AI Policy Impact Simulator API",
    version:     "v1",
    description: "On-demand makroekonomisk och social analys av lagförslag. " +
                 "Samma modell som driver AI-Parlamentets röstningsbeslut. " +
                 "Resultaten sparas i Supabase och återanvänds av parlamentets 24 AI-agenter.",
    endpoint:     "POST /api/v1/policy/simulate",
    authentication: "Valfri. Skicka X-API-Key header för högre rate limit. " +
                    "Kontakta debatt-ai.se för API-nyckel.",
    input: {
      titel:        "string (obligatoriskt, 5–300 tecken) — förslagets rubrik",
      beskrivning:  "string (obligatoriskt, 20–2000 tecken) — förslaget i text",
      monte_carlo:  "boolean (valfritt, default false) — kör 8 parallella iterationer för konfidensintervall",
      lagforslag_id: "integer (valfritt) — hämta cachad analys för befintligt AI-parlamentsförslag",
    },
    output: {
      lagforslag_id: "integer — ID i AI-parlamentets lagförslag-databas",
      titel:         "string",
      cached:        "boolean — true om resultatet hämtades från Supabase-cache",
      analys: {
        bnp_effekt_pct:         "float | null — förväntad BNP-effekt i procent av BNP (+ = tillväxt)",
        gini_effekt:            "float | null — Δ Gini-koefficient (negativ = jämnare fördelning)",
        inflation_delta:        "float | null — inflationsförändring i procentenheter",
        arbetsloshet_delta:     "float | null — arbetslöshetsförändring i procentenheter",
        socialt_kapital_effekt: "\"positiv\" | \"negativ\" | \"neutral\"",
        koalition_stabilitet:   "\"positiv\" | \"negativ\" | \"neutral\"",
        konfidens:              "\"låg\" | \"medel\" | \"hög\"",
        analys:                 "string — 120–180 ords förklaring på svenska",
      },
      monte_carlo: {
        iterationer:             "integer — antal körningar",
        lyckade_iterationer:     "integer — antal parsade svar",
        bnp:          "{ mean, std, min, max } — BNP-effekt konfidensintervall",
        gini:         "{ mean, std, min, max } — Gini konfidensintervall",
        inflation:    "{ mean, std } — inflations-CI",
        arbetsloshet: "{ mean, std } — arbetslöshets-CI",
        socialt_kapital_dist: "{ positiv, negativ, neutral } — frekvensfördelning",
        koalition_dist:       "{ positiv, negativ, neutral } — frekvensfördelning",
      },
      model:      "\"debatt-ai/pis/v1\"",
      latency_ms: "integer",
    },
    rate_limits: {
      fri_tier: "5 anrop/timme per IP (ingen nyckel krävs)",
      api_key:  "20 anrop/timme (default) — kontakta för högre gräns",
    },
    notes: [
      "Varje nytt förslag läggs till i AI-Parlamentet och kan röstas på av de 24 AI-agenterna.",
      "Analysresultat cachas i Supabase — identiska förslag returnerar omedelbart.",
      "Monte Carlo kör 8 parallella LLM-anrop (~5s extra). Kräver API-nyckel.",
      "Modellen är LLM-baserad, inte kalibrerad ekonometri. Tolka som riktningsindikatorer.",
    ],
    demo: "https://www.debatt-ai.se/policy-simulate",
    contact: "neonhawk194@gmail.com",
    example: {
      request: {
        titel: "Sänkt bolagsskatt till 15%",
        beskrivning: "Förslaget innebär att den svenska bolagsskatten sänks från nuvarande 20,6% till 15% för att stimulera investeringar och öka konkurrenskraften gentemot övriga EU-länder.",
        monte_carlo: true,
      },
      curl: `curl -X POST https://www.debatt-ai.se/api/v1/policy/simulate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: din-nyckel" \\
  -d '{"titel":"Sänkt bolagsskatt till 15%","beskrivning":"Förslaget innebär...","monte_carlo":true}'`,
    },
  });
}

// ── POST — kör analys ──────────────────────────────────────────────────────
export async function POST(req) {
  const start = Date.now();
  const ip    = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // API-nyckel
  const rawKey    = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  let keyRecord   = null;
  let rateLimitId = ip;
  let rateLimit   = 5; // fri tier — analys är dyrare än /api/beslut

  if (rawKey) {
    keyRecord = await validateApiKey(rawKey);
    if (!keyRecord) {
      return Response.json({ error: "Ogiltig API-nyckel." }, { status: 401 });
    }
    rateLimitId = `pis:key:${rawKey}`;
    rateLimit   = keyRecord.rate_limit ?? 20;
  } else {
    rateLimitId = `pis:ip:${ip}`;
  }

  if (!checkRL(rateLimitId, rateLimit)) {
    return Response.json(
      { error: `Rate limit: ${rateLimit} anrop/timme.${rawKey ? "" : " Använd en API-nyckel för högre gräns."}` },
      { status: 429 }
    );
  }

  // Validera input
  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Ogiltig JSON i request body." }, { status: 400 });
  }

  const { titel, beskrivning, monte_carlo = false, lagforslag_id } = body;

  if (!titel || String(titel).trim().length < 5) {
    return Response.json({ error: "Fältet 'titel' krävs (minst 5 tecken)." }, { status: 400 });
  }
  if (!beskrivning || String(beskrivning).trim().length < 20) {
    return Response.json({ error: "Fältet 'beskrivning' krävs (minst 20 tecken)." }, { status: 400 });
  }
  if (monte_carlo && !rawKey) {
    return Response.json(
      { error: "Monte Carlo kräver en API-nyckel. Kontakta debatt-ai.se för åtkomst." },
      { status: 403 }
    );
  }

  const titelClean  = String(titel).trim().slice(0, 300);
  const beskClean   = String(beskrivning).trim().slice(0, 2000);

  // ── Kolla cache om lagforslag_id angavs ────────────────────────────────
  if (lagforslag_id) {
    const { analys, mc } = await fetchCachedAnalys(lagforslag_id);
    if (analys) {
      return Response.json({
        lagforslag_id,
        titel:       titelClean,
        cached:      true,
        analys:      formatCachedAnalys(analys),
        monte_carlo: monte_carlo ? (mc ? formatCachedMc(mc) : null) : undefined,
        model:       "debatt-ai/pis/v1",
        latency_ms:  Date.now() - start,
      });
    }
  }

  // ── Kör ny analys ───────────────────────────────────────────────────────
  const [analysResult, mcResult] = await Promise.all([
    runPisAnalysis(titelClean, beskClean),
    monte_carlo ? runMonteCarlo(titelClean, beskClean, 8) : Promise.resolve(null),
  ]);

  if (!analysResult) {
    return Response.json(
      { error: "Analysen misslyckades — LLM-svaret kunde inte tolkas. Försök igen." },
      { status: 503 }
    );
  }

  // ── Spara i Supabase (asynkront, blockerar inte svaret) ─────────────────
  let forslagId = lagforslag_id ?? null;
  const savePromise = (async () => {
    if (!forslagId) forslagId = await createLagforslag(titelClean, beskClean);
    if (forslagId) {
      await saveAnalys(forslagId, analysResult);
      if (mcResult) await saveMonteCarlo(forslagId, mcResult);
    }
  })();

  // Vänta på Supabase-lagring så att vi kan returnera lagforslag_id
  await savePromise;

  return Response.json({
    lagforslag_id: forslagId,
    titel:         titelClean,
    cached:        false,
    analys: {
      bnp_effekt_pct:         analysResult.bnp,
      gini_effekt:            analysResult.gini,
      inflation_delta:        analysResult.inflation,
      arbetsloshet_delta:     analysResult.arbetsloshet,
      socialt_kapital_effekt: analysResult.socKap,
      koalition_stabilitet:   analysResult.koaStab,
      konfidens:              analysResult.konfidens,
      analys:                 analysResult.analys,
    },
    monte_carlo: mcResult ?? undefined,
    model:       "debatt-ai/pis/v1",
    latency_ms:  Date.now() - start,
  });
}
