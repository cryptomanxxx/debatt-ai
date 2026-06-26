/**
 * GET  /api/civilisation  — API-dokumentation
 * POST /api/civilisation  — Fråga civilisationens hjärna
 *
 * Använder den centrala LLM-routern (callWithFallback + getDynamicChain).
 */

import { callWithFallback, getDynamicChain } from "../../lib/aiRouter.js";

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
    description: "Ställ frågor till civilisationens hjärna — AI-civilisationens levande kunskapsbas.",
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

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const { fraga, endpoint, lang = "sv", limit = 20 } = body || {};
  const callerHeader = req.headers.get("x-caller-type") || "";
  const kalltyp = ["agent", "api"].includes(callerHeader) ? callerHeader : "besökare";
  if (!fraga || typeof fraga !== "string" || fraga.trim().length < 3)
    return Response.json({ error: "Fältet 'fraga' saknas eller är för kort." }, { status: 400 });

  const t0 = Date.now();
  const kontext = await hämtaKontext(fraga.trim(), endpoint, Math.min(limit, 50));
  const kontextStr = kontext.length > 0
    ? JSON.stringify(kontext, null, 2).slice(0, 3000)
    : "(ingen data hittades)";

  const systemPrompt = lang === "en"
    ? `You are the brain of an AI civilization — a living knowledge base of 24 autonomous AI agents. Answer questions about the civilization concisely and factually based on the provided data. Be specific and data-driven. 2-4 sentences.`
    : `Du är hjärnan i en AI-civilisation — en levande kunskapsbas om 24 autonoma AI-agenter. Svara på frågor om civilisationen kort och faktabaserat utifrån given data. Var specifik och datadriven. 2–4 meningar.`;

  const userPrompt = lang === "en"
    ? `Question: "${fraga.trim()}"\n\nData from the civilization:\n${kontextStr}`
    : `Fråga: "${fraga.trim()}"\n\nData från civilisationen:\n${kontextStr}`;

  try {
    const chain = await getDynamicChain("general");
    const { text, provider, model } = await callWithFallback(chain,
      [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      { maxTokens: 400, temperature: 0.3, source: "civilisation_api" }
    );

    const latency = Date.now() - t0;
    const resolvedEndpoint = endpoint || gissaEndpoint(fraga);

    // Log fire-and-forget — never block the response.
    // Requires service role key so anon users cannot read or forge log rows.
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
      svar:         text,
      endpoint:     resolvedEndpoint,
      datapunkter:  kontext.length,
      provider,
      model,
      latency_ms:   latency,
      version:      "debatt-ai/civilisation/v1",
    });
  } catch (err) {
    return Response.json({ error: "LLM-anropet misslyckades.", details: err.message }, { status: 503 });
  }
}
