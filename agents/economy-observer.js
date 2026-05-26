#!/usr/bin/env node
/**
 * economy-observer.js
 *
 * Hämtar ekonomisk data från Supabase, beräknar nyckeltal och kallar
 * Cerebras (Qwen 3 235B) för en strukturerad ekonomianalys av AI-civilisationen.
 *
 * Sparar till ai-bus/discussions/YYYY-MM-DD-HHmm-economy.md
 *
 * Körs av GitHub Actions (economy-observer.yml) eller manuellt:
 *   CEREBRAS_API_KEY=xxx NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx node agents/economy-observer.js
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");

const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY;
const SB_KEY       = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_URL       = "https://fmwxftnistkoqazfwnuj.supabase.co";
const DISCUSSIONS  = path.join(__dirname, "../ai-bus/discussions");

if (!CEREBRAS_KEY) { console.error("CEREBRAS_API_KEY saknas"); process.exit(1); }
if (!SB_KEY)       { console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY saknas"); process.exit(1); }

function tidsstämpel() {
  return new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
}
function dagensDatum() {
  return new Date().toISOString().slice(0, 10);
}
function isoVecka() {
  const d = new Date();
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const wk = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(wk).padStart(2, "0")}`;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
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

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u   = new URL(url);
    const buf = Buffer.from(body);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: "POST",
        headers: { ...headers, "Content-Length": buf.length } },
      (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, data }); }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(buf);
    req.end();
  });
}

function sb(endpoint) {
  return httpGet("fmwxftnistkoqazfwnuj.supabase.co", `/rest/v1/${endpoint}`, {
    apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
  });
}

// ── Ekonomiska beräkningar ────────────────────────────────────────────────────
function beraknaGini(saldon) {
  if (!saldon.length) return 0;
  const s = [...saldon].sort((a, b) => a - b);
  const n = s.length;
  const sum = s.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let giniSum = 0;
  for (let i = 0; i < n; i++) giniSum += (2 * (i + 1) - n - 1) * s[i];
  return Math.round((giniSum / (n * sum)) * 1000) / 1000;
}

function topp3Andel(saldon) {
  if (!saldon.length) return 0;
  const s = [...saldon].sort((a, b) => b - a);
  const total = s.reduce((a, b) => a + b, 0);
  const topp3 = s.slice(0, 3).reduce((a, b) => a + b, 0);
  return total > 0 ? Math.round((topp3 / total) * 100) : 0;
}

// ── Hämta all data ────────────────────────────────────────────────────────────
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
    sb("agent_planbocker?select=agent,saldo,saldo_spel&agent=neq.Statskassa&order=saldo.desc"),
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

  return { planbocker, oligarkiHist, borsAffarer, borsPriser, budgetLog, aktiva_lan, ekonomiSpel, feedbackRew, hedgefondNav, etfInnehav, vecka };
}

// ── Beräkna nyckeltal ─────────────────────────────────────────────────────────
function beräknaNyckeltal(data) {
  const { planbocker, oligarkiHist, borsAffarer, budgetLog, aktiva_lan, ekonomiSpel, feedbackRew } = data;

  const saldon = planbocker.map(r => Number(r.saldo) || 0);
  const gini   = beraknaGini(saldon);
  const t3     = topp3Andel(saldon);
  const totalK = saldon.reduce((a, b) => a + b, 0);
  const medelS = saldon.length ? Math.round(totalK / saldon.length) : 0;
  const rikast = planbocker[0] || {};
  const fattig = [...planbocker].sort((a, b) => a.saldo - b.saldo)[0] || {};

  // Budgetloggens vecka
  const skattVecka   = budgetLog.filter(r => r.typ === "skatt").reduce((s, r) => s + Number(r.belopp), 0);
  const grundVecka   = budgetLog.filter(r => r.typ === "grundinkomst").reduce((s, r) => s + Number(r.belopp), 0);
  const bailoutVecka = budgetLog.filter(r => r.typ === "bailout").reduce((s, r) => s + Number(r.belopp), 0);

  // Lån
  const totSkuld   = aktiva_lan.reduce((s, r) => s + Number(r.saldo_kvar), 0);
  const antalLan   = aktiva_lan.length;

  // Börsen sista 7 dagarna
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const affarer7d = borsAffarer.filter(r => r.skapad > cutoff);
  const volym7d   = affarer7d.reduce((s, r) => s + Number(r.pris) * Number(r.antal), 0);

  // Ekonomispel accept-rate
  const avgjorda = ekonomiSpel.filter(r => r.svar);
  const acceptRate = avgjorda.length
    ? Math.round(avgjorda.filter(r => r.svar === "accepterat").length / avgjorda.length * 100)
    : null;

  // Feedback social kapital
  const totalFeedback = feedbackRew.reduce((s, r) => s + Number(r.belopp), 0);

  // Oligarki-trend (senaste vs 7 dagar sedan)
  const oligarkiTrend = oligarkiHist.length >= 2
    ? (Number(oligarkiHist[0].oligarki_risk) - Number(oligarkiHist[Math.min(6, oligarkiHist.length - 1)].oligarki_risk)).toFixed(1)
    : null;
  const senGini = oligarkiHist[0] ? Number(oligarkiHist[0].gini).toFixed(3) : gini;

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

// ── Bygg prompt ───────────────────────────────────────────────────────────────
function byggPrompt(nyckeltal, data, datum) {
  const k = nyckeltal;
  const { vecka } = data;

  // Topp 5 rikaste
  const topp5 = data.planbocker.slice(0, 5)
    .map((r, i) => `  ${i + 1}. ${r.agent}: ${r.saldo} kr`)
    .join("\n");

  // Aktiva lån
  const lanSamm = data.aktiva_lan.length
    ? data.aktiva_lan.map(r => `  - ${r.agent}: skuld ${Math.round(r.saldo_kvar)} kr (ränta ${r.rantefot * 100}%/v)`).join("\n")
    : "  Inga aktiva lån.";

  // Senaste börssymboler
  const symbolVol = {};
  data.borsAffarer.slice(0, 100).forEach(r => {
    symbolVol[r.symbol] = (symbolVol[r.symbol] || 0) + Number(r.pris) * Number(r.antal);
  });
  const symbolSamm = Object.entries(symbolVol)
    .sort((a, b) => b[1] - a[1])
    .map(([s, v]) => `  ${s}: ${Math.round(v)} kr`)
    .join("\n") || "  Ingen handelsdata.";

  // Oligarkirisk-trend
  const trendText = k.oligarkiTrend !== null
    ? (Number(k.oligarkiTrend) > 0 ? `↑ +${k.oligarkiTrend}` : `↓ ${k.oligarkiTrend}`)
    : "okänd";

  return `Du är en ekonomisk analytiker som specialiserar dig på AI-civilisationer och emergenta ekonomier. Du analyserar debatt-ai — en plattform med 24 autonoma AI-agenter med egna virtuella ekonomier.

## Ekonomidata — vecka ${vecka} (${datum})

### Förmögenhetsfördelning
- Gini-koefficient: ${k.senGini} (0=perfekt jämlikhet, 1=total koncentration)
- Topp-3 agenter äger: ${k.t3}% av total förmögenhet
- Total förmögenhet i omlopp: ${k.totalK} kr
- Medelsaldo: ${k.medelS} kr
- Rikast: ${k.rikastAgent} (${k.rikastSaldo} kr)
- Fattigast: ${k.fattigAgent} (${k.fattigSaldo} kr)

Topp 5 rikaste agenter:
${topp5}

### Statsbudget (vecka ${vecka})
- Skatteintäkter: ${k.skattVecka} kr (2% förmögenhetsskatt > 1 000 kr)
- Grundinkomst utbetald: ${k.grundVecka} kr
- Bailouts: ${k.bailoutVecka} kr
- Netto staten: ${k.skattVecka - k.grundVecka - k.bailoutVecka} kr

### Kreditmarknaden
- Aktiva lån: ${k.antalLan}
- Total skuldbörda: ${k.totSkuld} kr
${lanSamm}

### Börsen (senaste 7 dagarna)
- Handelsvolym: ${k.volym7d} kr (${k.antalAffarer7d} affärer)
- Volym per token:
${symbolSamm}

### Ekonomispel (diktatorspelet / ultimatumspelet)
- Accept-rate ultimatum: ${k.acceptRate !== null ? `${k.acceptRate}%` : "otillräcklig data"}

### Socialt kapital (IFL)
- Total social feedback-volym: ${k.totalFeedback} kr

### Oligarkirisk-trend
- Förändring senaste 7 dagarna: ${trendText} poäng

---

## Din uppgift

Skriv en ekonomianalys (400-600 ord) på svenska för AI-civilisationens ekonomi. Formatet ska vara:

# Ekonomianalys: [Rubrik som fångar veckans viktigaste trend]
**Datum:** ${datum}
**Vecka:** ${vecka}

## Nuläge
(3-4 meningar om det allmänna ekonomiska läget)

## Nyckelobservationer
(3-5 konkreta observationer med siffrorna som stöd)

## Varningar
(eventuella risker — hög skuldsättning, Gini > 0.5, handelsvolym faller, etc. Skriv "Inga kritiska varningar" om läget är stabilt)

## Rekommendationer till systemet
(2-3 konkreta åtgärder som civilisationen eller plattformsutvecklaren kan vidta)

## Nästa vecka — vad att bevaka
(1-2 konkreta saker att följa upp)

Var analytisk och specifik. Referera till faktiska siffror. Jämför med ekonomisk teori när relevant (Gini, Pareto, Keynes, etc.).`;
}

// ── Kalla Cerebras ────────────────────────────────────────────────────────────
async function kallaCerebras(prompt) {
  const body = JSON.stringify({
    model: "qwen-3-235b-a22b-instruct-2507",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1400,
    temperature: 0.7,
  });
  const { status, data } = await httpPost(
    "https://api.cerebras.ai/v1/chat/completions",
    { Authorization: `Bearer ${CEREBRAS_KEY}`, "Content-Type": "application/json" },
    body
  );
  if (status !== 200) throw new Error(`Cerebras ${status}: ${JSON.stringify(data).slice(0, 200)}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Cerebras returnerade ingen text");
  return text.trim();
}

// ── Huvud ─────────────────────────────────────────────────────────────────────
async function main() {
  const datum  = dagensDatum();
  const utfil  = path.join(DISCUSSIONS, `${tidsstämpel()}-economy.md`);

  if (!fs.existsSync(DISCUSSIONS)) fs.mkdirSync(DISCUSSIONS, { recursive: true });

  console.log("Hämtar ekonomidata från Supabase…");
  const data       = await hämtaData();
  const nyckeltal  = beräknaNyckeltal(data);

  console.log(`Gini: ${nyckeltal.senGini} | Topp-3: ${nyckeltal.t3}% | Börsvolym 7d: ${nyckeltal.volym7d} kr`);

  const prompt = byggPrompt(nyckeltal, data, datum);

  console.log("Kallar Cerebras för ekonomianalys…");
  let analys;
  try {
    analys = await kallaCerebras(prompt);
  } catch (e) {
    console.error("Cerebras misslyckades:", e.message);
    process.exit(1);
  }

  // Lägg till frontmatter med nyckeltal för maskinläsning
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

  const innehall = `${frontmatter}\n\n${analys}\n\n---\n*Genererad av economy-observer.js med Cerebras Qwen 3 235B, ${datum}*\n`;
  fs.writeFileSync(utfil, innehall, "utf8");
  console.log(`Ekonomianalys sparad: ${utfil}`);
}

main().catch(e => { console.error(e); process.exit(1); });
