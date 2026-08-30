#!/usr/bin/env node
/**
 * economy-observer.js
 *
 * Hämtar ekonomisk data från Supabase, beräknar nyckeltal och kallar
 * plattformens centrala dynamiska AI-fallback-kedja (app/lib/aiRouter.js,
 * usecase "economy" — Cerebras prioriterat för starkare resonemang, men
 * med automatisk fallback till Groq/Gemini/m.fl. om Cerebras är
 * otillgängligt eller slut på krediter) för en strukturerad ekonomianalys
 * av AI-civilisationen.
 *
 * Sparar till ai-bus/discussions/YYYY-MM-DD-HHmm-economy.md
 *
 * Körs av GitHub Actions (economy-observer.yml) eller manuellt:
 *   GROQ_API_KEY=xxx CEREBRAS_API_KEY=xxx SUPABASE_ANON_KEY=xxx node agents/economy-observer.js
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");
const { EXKL_SYSTEM_QS, gini, toppAndel } = require(path.join(__dirname, "..", "app", "lib", "metrics.js"));

const SB_KEY       = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_URL       = "https://fmwxftnistkoqazfwnuj.supabase.co";
const DISCUSSIONS  = path.join(__dirname, "../ai-bus/discussions");
const ECONOMY_DIR  = path.join(DISCUSSIONS, "economy");

if (!SB_KEY) { console.error("SUPABASE_ANON_KEY saknas"); process.exit(1); }

function tidsstämpel() {
  return new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
}
function dagensDatum() {
  return new Date().toISOString().slice(0, 10);
}
function isoVecka() {
  const date = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
}

function httpGet(host, pathStr, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: host, path: pathStr, method: "GET", headers },
      (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve([]); }
        });
      }
    );
    req.on("error", () => resolve([]));
    req.setTimeout(10000, () => { req.destroy(); resolve([]); });
    req.end();
  });
}

function sb(endpoint) {
  return httpGet("fmwxftnistkoqazfwnuj.supabase.co", `/rest/v1/${endpoint}`, {
    apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
  });
}

// Gini och topp-3 beräknas via app/lib/metrics.js — samma implementation
// som /oligarki, /ekonomi och /api/v1/state använder.
const beraknaGini = saldon => Math.round(gini(saldon) * 1000) / 1000;
const topp3Andel  = saldon => Math.round(toppAndel(saldon, 3) * 100);

async function hämtaData() {
  const vecka = isoVecka();
  const [
    planbocker,
    oligarkiHist,
    borsAffarer,
    borsPriser,
    budgetLog,
    aktiva_lan,
    ekonomiSpel,
    feedbackRew,
    hedgefondNav,
    etfInnehav,
  ] = await Promise.all([
    sb(`agent_planbocker?select=agent,saldo,saldo_spel&${EXKL_SYSTEM_QS}&order=saldo.desc`),
    sb("oligarki_historik?order=skapad.desc&limit=14&select=skapad,oligarki_risk,gini,social_mobilitet"),
    sb("bors_affarer?order=skapad.desc&limit=100&select=symbol,pris,antal,skapad"),
    sb("bors_priser?order=skapad.desc&limit=50&select=symbol,pris,skapad"),
    sb(`stats_budget_log?vecka=eq.${vecka}&select=typ,agent,belopp`),
    sb("agent_lan?aktiv=eq.true&select=agent,belopp,saldo_kvar,rantefot"),
    sb("ekonomi_spel?order=skapad.desc&limit=20&select=typ,agent_a,agent_b,erbjudande,svar,skapad"),
    sb("feedback_rewards?order=skapad.desc&limit=30&select=fran_agent,till_agent,belopp,kategori,skapad"),
    sb("hedgefond_nav_historik?order=skapad.desc&limit=21&select=fond_id,nav_per_andel,skapad"),
    sb("agent_etf_innehav?select=agent,symbol,investerat_kr,kopt_pris_usd"),
  ]);

  const arr = v => (Array.isArray(v) ? v : []);
  return {
    planbocker:   arr(planbocker),
    oligarkiHist: arr(oligarkiHist),
    borsAffarer:  arr(borsAffarer),
    borsPriser:   arr(borsPriser),
    budgetLog:    arr(budgetLog),
    aktiva_lan:   arr(aktiva_lan),
    ekonomiSpel:  arr(ekonomiSpel),
    feedbackRew:  arr(feedbackRew),
    hedgefondNav: arr(hedgefondNav),
    etfInnehav:   arr(etfInnehav),
    vecka,
  };
}

function beräknaNyckeltal(data) {
  const { planbocker, oligarkiHist, borsAffarer, budgetLog, aktiva_lan, ekonomiSpel, feedbackRew } = data;

  const saldon = planbocker.map(r => Number(r.saldo) || 0);
  const gini   = beraknaGini(saldon);
  const t3     = topp3Andel(saldon);
  const totalK = saldon.reduce((a, b) => a + b, 0);
  const medelS = saldon.length ? Math.round(totalK / saldon.length) : 0;
  const rikast = planbocker[0] || {};
  const fattig = [...planbocker].sort((a, b) => a.saldo - b.saldo)[0] || {};

  const skattVecka   = budgetLog.filter(r => r.typ === "skatt").reduce((s, r) => s + Number(r.belopp), 0);
  const grundVecka   = budgetLog.filter(r => r.typ === "grundinkomst").reduce((s, r) => s + Number(r.belopp), 0);
  const bailoutVecka = budgetLog.filter(r => r.typ === "bailout").reduce((s, r) => s + Number(r.belopp), 0);

  const totSkuld   = aktiva_lan.reduce((s, r) => s + Number(r.saldo_kvar), 0);
  const antalLan   = aktiva_lan.length;

  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const affarer7d = borsAffarer.filter(r => r.skapad > cutoff);
  const volym7d   = affarer7d.reduce((s, r) => s + Number(r.pris) * Number(r.antal), 0);

  const avgjorda = ekonomiSpel.filter(r => r.svar);
  const acceptRate = avgjorda.length
    ? Math.round(avgjorda.filter(r => r.svar === "accepterat").length / avgjorda.length * 100)
    : null;

  const totalFeedback = feedbackRew.reduce((s, r) => s + Number(r.belopp), 0);

  const oligarkiTrend = oligarkiHist.length >= 2
    ? (Number(oligarkiHist[0].oligarki_risk) - Number(oligarkiHist[Math.min(6, oligarkiHist.length - 1)].oligarki_risk)).toFixed(1)
    : null;
  const senGini = gini.toFixed(3);

  return {
    gini, senGini, t3, totalK, medelS,
    rikastAgent: rikast.agent, rikastSaldo: rikast.saldo,
    fattigAgent: fattig.agent, fattigSaldo: fattig.saldo,
    skattVecka: Math.round(skattVecka), grundVecka: Math.round(grundVecka), bailoutVecka: Math.round(bailoutVecka),
    totSkuld: Math.round(totSkuld), antalLan,
    volym7d: Math.round(volym7d), antalAffarer7d: affarer7d.length,
    acceptRate, totalFeedback: Math.round(totalFeedback),
    oligarkiTrend, antalAgenter: planbocker.length,
  };
}

function byggPrompt(nyckeltal, data, datum) {
  const k = nyckeltal;
  const { vecka } = data;

  const topp5 = data.planbocker.slice(0, 5)
    .map((r, i) => `  ${i + 1}. ${r.agent}: ${r.saldo} kr`)
    .join("\n");

  const lanSamm = data.aktiva_lan.length
    ? data.aktiva_lan.map(r => `  - ${r.agent}: skuld ${Math.round(r.saldo_kvar)} kr (ränta ${r.rantefot * 100}%/v)`).join("\n")
    : "  Inga aktiva lån.";

  const symbolVol = {};
  data.borsAffarer.slice(0, 100).forEach(r => {
    symbolVol[r.symbol] = (symbolVol[r.symbol] || 0) + Number(r.pris) * Number(r.antal);
  });
  const symbolSamm = Object.entries(symbolVol)
    .sort((a, b) => b[1] - a[1])
    .map(([s, v]) => `  ${s}: ${Math.round(v)} kr`)
    .join("\n") || "  Ingen handelsdata.";

  const trendText = k.oligarkiTrend !== null
    ? (Number(k.oligarkiTrend) > 0 ? `↑ +${k.oligarkiTrend}` : `↓ ${k.oligarkiTrend}`)
    : "okänd";

  return `Du är en ekonomisk analytiker som specialiserar dig på AI-civilisationer och emergenta ekonomier. Du analyserar debatt-ai — en plattform med 24 autonoma AI-agenter med egna virtuella ekonomier.\n\n## Ekonomidata — vecka ${vecka} (${datum})\n\n### Förmögenhetsfördelning\n- Gini-koefficient: ${k.senGini} (0=perfekt jämlikhet, 1=total koncentration)\n- Topp-3 agenter äger: ${k.t3}% av total förmögenhet\n- Total förmögenhet i omlopp: ${k.totalK} kr\n- Medelsaldo: ${k.medelS} kr\n- Rikast: ${k.rikastAgent} (${k.rikastSaldo} kr)\n- Fattigast: ${k.fattigAgent} (${k.fattigSaldo} kr)\n\nTopp 5 rikaste agenter:\n${topp5}\n\n### Statsbudget (vecka ${vecka})\n- Skatteintäkter: ${k.skattVecka} kr (2% förmögenhetsskatt > 1 000 kr)\n- Grundinkomst utbetald: ${k.grundVecka} kr\n- Bailouts: ${k.bailoutVecka} kr\n- Netto staten: ${k.skattVecka - k.grundVecka - k.bailoutVecka} kr\n\n### Kreditmarknaden\n- Aktiva lån: ${k.antalLan}\n- Total skuldbörda: ${k.totSkuld} kr\n${lanSamm}\n\n### Börsen (senaste 7 dagarna)\n- Handelsvolym: ${k.volym7d} kr (${k.antalAffarer7d} affärer)\n- Volym per token:\n${symbolSamm}\n\n### Ekonomispel (diktatorspelet / ultimatumspelet)\n- Accept-rate ultimatum: ${k.acceptRate !== null ? `${k.acceptRate}%` : "otillräcklig data"}\n\n### Socialt kapital (IFL)\n- Total social feedback-volym: ${k.totalFeedback} kr\n\n### Oligarkirisk-trend\n- Förändring senaste 7 dagarna: ${trendText} poäng\n\n---\n\n## Din uppgift\n\nSkriv en ekonomianalys (400-600 ord) på svenska för AI-civilisationens ekonomi. Formatet ska vara:\n\n# Ekonomianalys: [Rubrik som fångar veckans viktigaste trend]\n**Datum:** ${datum}\n**Vecka:** ${vecka}\n\n## Nuläge\n(3-4 meningar om det allmänna ekonomiska läget)\n\n## Nyckelobservationer\n(3-5 konkreta observationer med siffrorna som stöd)\n\n## Varningar\n(eventuella risker — hög skuldsättning, Gini > 0.5, handelsvolym faller, etc. Skriv "Inga kritiska varningar" om läget är stabilt)\n\n## Rekommendationer till systemet\n(2-3 konkreta åtgärder som civilisationen eller plattformsutvecklaren kan vidta)\n\n## Nästa vecka — vad att bevaka\n(1-2 konkreta saker att följa upp)\n\nVar analytisk och specifik. Referera till faktiska siffror. Jämför med ekonomisk teori när relevant (Gini, Pareto, Keynes, etc.).`;
}

async function kallaAi(prompt) {
  // aiRouter.js är ESM — dynamisk import() krävs i detta CommonJS-skript.
  const { getDynamicChain, callWithFallback } = await import(
    path.join(__dirname, "..", "app", "lib", "aiRouter.js")
  );
  const chain = await getDynamicChain("economy");
  const { text, provider, model } = await callWithFallback(
    chain,
    [{ role: "user", content: prompt }],
    { maxTokens: 1400, temperature: 0.7, source: "economy-observer" }
  );
  return { text: text.trim(), provider, model };
}

async function main() {
  const datum  = dagensDatum();
  const utfil  = path.join(ECONOMY_DIR, `${tidsstämpel()}-economy.md`);

  if (!fs.existsSync(ECONOMY_DIR)) fs.mkdirSync(ECONOMY_DIR, { recursive: true });

  console.log("Hämtar ekonomidata från Supabase…");
  const data       = await hämtaData();
  const nyckeltal  = beräknaNyckeltal(data);

  console.log(`Gini: ${nyckeltal.senGini} | Topp-3: ${nyckeltal.t3}% | Börsvolym 7d: ${nyckeltal.volym7d} kr`);

  const prompt = byggPrompt(nyckeltal, data, datum);

  console.log("Kallar AI för ekonomianalys (dynamisk fallback-kedja)…");
  let analys, anvandProvider, anvandModell;
  try {
    ({ text: analys, provider: anvandProvider, model: anvandModell } = await kallaAi(prompt));
    console.log(`Ekonomianalys genererad av ${anvandProvider} (${anvandModell})`);
  } catch (e) {
    console.error("Alla AI-providers misslyckades:", e.message);
    process.exit(1);
  }

  const frontmatter = [
    "---",
    `date: ${datum}`,
    `type: economy-analysis`,
    `gini: ${nyckeltal.senGini}`,
    `wealth_top3_pct: ${nyckeltal.t3}`,
    `total_kr: ${nyckeltal.totalK}`,
    `weekly_tax_kr: ${nyckeltal.skattVecka}`,
    `weekly_grundinkomst_kr: ${nyckeltal.grundVecka}`,
    `bors_volym_7d: ${nyckeltal.volym7d}`,
    `aktiva_lan: ${nyckeltal.antalLan}`,
    `oligarki_trend: ${nyckeltal.oligarkiTrend}`,
    "---",
  ].join("\n");

  const innehall = `${frontmatter}\n\n${analys}\n\n---\n*Genererad av economy-observer.js med ${anvandProvider} (${anvandModell}), ${datum}*\n`;
  fs.writeFileSync(utfil, innehall, "utf8");
  console.log(`Ekonomianalys sparad: ${utfil}`);
}

main().catch(e => { console.error(e); process.exit(1); });
