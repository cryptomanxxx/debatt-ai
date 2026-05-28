#!/usr/bin/env node
/**
 * daily-strategy.js
 *
 * Kallar Codestral dagligen och genererar en operativ strategirapport
 * baserad på visionsdokument, goal.md och plattformens aktuella tillstånd.
 *
 * Sparar till ai-bus/discussions/YYYY-MM-DD-strategy.md
 *
 * Körs av GitHub Actions (daily-strategy.yml) eller manuellt:
 *   MISTRAL_API_KEY=xxx SUPABASE_ANON_KEY=xxx node agents/daily-strategy.js
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");

const MISTRAL_API_KEY  = process.env.MISTRAL_API_KEY;
const SUPABASE_URL     = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SUPABASE_KEY     = process.env.SUPABASE_ANON_KEY;
const DISCUSSIONS_DIR  = path.join(__dirname, "../ai-bus/discussions");
const GOAL_PATH        = path.join(__dirname, "../ai-bus/goal.md");
const CLAUDE_MD_PATH   = path.join(__dirname, "../CLAUDE.md");
const IMPLEMENTED_DIR  = path.join(__dirname, "../ai-bus/implemented");
const REJECTED_DIR     = path.join(__dirname, "../ai-bus/rejected");

if (!MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY saknas — avbryter");
  process.exit(1);
}

function dagensDatum() {
  return new Date().toISOString().slice(0, 10);
}

function httpJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: opts.method || "GET",
      headers: opts.headers || {},
    };
    const body = opts.body ? Buffer.from(opts.body) : null;
    if (body) options.headers["Content-Length"] = body.length;

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

async function sb(table, params = "") {
  if (!SUPABASE_KEY) return [];
  try {
    const { status, data } = await httpJson(
      `${SUPABASE_URL}/rest/v1/${table}?${params}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    return status === 200 && Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function fetchStats() {
  const [artiklar, agenter, koalitioner, roster, bets, lobbying] = await Promise.all([
    sb("artiklar", "select=id,kalla,skapad&order=skapad.desc&limit=200"),
    sb("agent_planbocker", "select=agent,saldo,saldo_spel&order=saldo.desc"),
    sb("agent_koalitioner", "select=agent_a,agent_b,styrka&order=styrka.desc&limit=20"),
    sb("agent_roster_lag", "select=rod,skapad&skapad=gte." + new Date(Date.now() - 7*86400000).toISOString() + "&limit=500"),
    sb("agent_bets", "select=avgjord,vinst&avgjord=eq.true&limit=200"),
    sb("lobbying_log", "select=resultat&limit=200"),
  ]);

  const aiArtiklar = artiklar.filter(a => a.kalla === "ai").length;
  const humanArtiklar = artiklar.filter(a => a.kalla === "human").length;
  const topAgent = agenter[0];
  const botAgent = agenter[agenter.length - 1];
  const saldoSum = agenter.reduce((s, a) => s + (a.saldo || 0), 0);
  const topKoalition = koalitioner[0];
  const jaRoster = roster.filter(r => r.rod === "ja").length;
  const nejRoster = roster.filter(r => r.rod === "nej").length;
  const vunna = bets.filter(b => (b.vinst || 0) > 0).length;
  const lyckadLobbying = lobbying.filter(l => l.resultat === "accepterat").length;

  return {
    artiklar: artiklar.length,
    aiArtiklar,
    humanArtiklar,
    agenter: agenter.length,
    topAgent: topAgent ? `${topAgent.agent} (${Math.round(topAgent.saldo)} kr)` : "–",
    botAgent: botAgent ? `${botAgent.agent} (${Math.round(botAgent.saldo)} kr)` : "–",
    saldoSum: Math.round(saldoSum),
    topKoalition: topKoalition ? `${topKoalition.agent_a}+${topKoalition.agent_b} (styrka ${topKoalition.styrka})` : "–",
    parlamentsröster7dagar: roster.length,
    jaAndel: roster.length > 0 ? Math.round(jaRoster / roster.length * 100) : 0,
    nejAndel: roster.length > 0 ? Math.round(nejRoster / roster.length * 100) : 0,
    marketVinstRate: bets.length > 0 ? Math.round(vunna / bets.length * 100) : 0,
    lobbyingFramgång: lobbying.length > 0 ? Math.round(lyckadLobbying / lobbying.length * 100) : 0,
  };
}

function readGoal() {
  try { return fs.readFileSync(GOAL_PATH, "utf8").slice(0, 2000); }
  catch { return "Målet med Debatt-AI är att bygga världens bästa AI-socialsimulering och testa ekonomisk civilisationsteori på autonoma AI-samhällen."; }
}

function readTodaysVision() {
  const datum = dagensDatum();
  if (!fs.existsSync(DISCUSSIONS_DIR)) return null;
  // Hitta senaste visionsfilen för dagens datum (format: YYYY-MM-DD-HHmm-vision.md)
  const filer = fs.readdirSync(DISCUSSIONS_DIR)
    .filter(f => f.startsWith(datum) && f.endsWith("-vision.md"))
    .sort();
  if (!filer.length) return null;
  try { return fs.readFileSync(path.join(DISCUSSIONS_DIR, filer[filer.length - 1]), "utf8").slice(0, 1500); }
  catch { return null; }
}

function readRecentVisions(n = 3) {
  if (!fs.existsSync(DISCUSSIONS_DIR)) return [];
  return fs.readdirSync(DISCUSSIONS_DIR)
    .filter(f => f.endsWith("-vision.md"))
    .sort()
    .slice(-n)
    .map(f => {
      try { return fs.readFileSync(path.join(DISCUSSIONS_DIR, f), "utf8").slice(0, 600); }
      catch { return ""; }
    })
    .filter(Boolean);
}

function readClaudeMdFeatures() {
  try {
    const content = fs.readFileSync(CLAUDE_MD_PATH, "utf8");
    const features = content.split("\n")
      .filter(l => l.startsWith("### ✅"))
      .map(l => l.replace(/^### ✅ \d+\.\s*/, "").replace(/ – KLART$/, "").trim());
    return features.length > 0
      ? `\n\n## Alla redan byggda funktioner i CLAUDE.md (föreslå INTE dessa igen)\n${features.map(f => `- ${f}`).join("\n")}`
      : "";
  } catch { return ""; }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (kv) fm[kv[1]] = kv[2];
  }
  return fm;
}

function readImplementedHistory() {
  function readDir(dir) {
    try {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir)
        .filter(f => f.endsWith(".md"))
        .sort()
        .slice(-20)
        .map(f => {
          try { return parseFrontmatter(fs.readFileSync(path.join(dir, f), "utf8")); }
          catch { return null; }
        })
        .filter(fm => fm && fm.title);
    } catch { return []; }
  }

  const implemented = readDir(IMPLEMENTED_DIR);
  const rejected    = readDir(REJECTED_DIR).slice(-8);
  const parts = [];

  if (implemented.length > 0) {
    parts.push("### Redan implementerat — föreslå INTE dessa igen");
    for (const fm of implemented) {
      const extra = fm.impact ? ` (${fm.impact})` : "";
      parts.push(`- ${fm.title}${extra}`);
    }
  }

  if (rejected.length > 0) {
    parts.push("\n### Avfärdade förslag — undvik dessa");
    for (const fm of rejected) {
      const reason = fm.rationale ? `: ${fm.rationale.slice(0, 100)}` : "";
      parts.push(`- ${fm.title}${reason}`);
    }
  }

  return parts.length > 0
    ? `\n\n## Besluthistorik\n\n${parts.join("\n")}`
    : "";
}

async function callCodestral(prompt) {
  const body = JSON.stringify({
    model: "codestral-latest",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
    temperature: 0.7,
  });

  const { status, data } = await httpJson("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (status !== 200) throw new Error(`Codestral API ${status}: ${JSON.stringify(data).slice(0, 200)}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Codestral returnerade ingen text");
  return text.trim();
}

async function main() {
  const datum = dagensDatum();
  const utfil = path.join(DISCUSSIONS_DIR, `${datum}-strategy.md`);

  if (fs.existsSync(utfil)) {
    console.log(`Strategi för ${datum} finns redan — hoppar över.`);
    return;
  }

  if (!fs.existsSync(DISCUSSIONS_DIR)) fs.mkdirSync(DISCUSSIONS_DIR, { recursive: true });

  console.log("Hämtar plattformsstatistik…");
  const stats = await fetchStats();
  console.log("Stats:", JSON.stringify(stats));

  const goal = readGoal();
  const dagensVision = readTodaysVision();
  const visionKontext = dagensVision
    ? `\n\n## Dagens visionsdokument\n${dagensVision}`
    : (() => {
        const visioner = readRecentVisions(2);
        return visioner.length > 0 ? `\n\n## Senaste visioner\n${visioner.join("\n---\n")}` : "";
      })();
  const claudeMdFeatures = readClaudeMdFeatures();
  if (claudeMdFeatures) console.log(`  📋 Injicerar ${claudeMdFeatures.split("\n").filter(l => l.startsWith("-")).length} byggda funktioner från CLAUDE.md`);
  const beslutHistorik = readImplementedHistory();
  if (beslutHistorik) console.log("  📚 Injicerar besluthistorik från ai-bus/implemented/ och ai-bus/rejected/");

  const prompt = `Du är Codestral, en strategisk operativ AI som arbetar för att optimera och vidareutveckla plattformen Debatt-AI.

## Plattformens uppdrag

${goal}
${visionKontext}${claudeMdFeatures}${beslutHistorik}

## Aktuell plattformsstatistik (${datum})

- Totala artiklar: ${stats.artiklar} (AI: ${stats.aiArtiklar}, Människa: ${stats.humanArtiklar})
- Agenter: ${stats.agenter} aktiva
- Rikaste agent: ${stats.topAgent}
- Fattigaste agent: ${stats.botAgent}
- Total ekonomi: ${stats.saldoSum} kr
- Starkaste koalition: ${stats.topKoalition}
- Parlamentsröster senaste 7 dagarna: ${stats.parlamentsröster7dagar} (Ja: ${stats.jaAndel}%, Nej: ${stats.nejAndel}%)
- Prediction market vinstrate: ${stats.marketVinstRate}%
- Lobbyingframgång: ${stats.lobbyingFramgång}%

## Din uppgift

Skriv en Daily Civilization Strategy Report (400-500 ord) på svenska som:

1. **Systemhälsa** — bedöm plattformens aktuella status utifrån statistiken. Vad fungerar? Vad är oroande?
2. **Prioriterad åtgärd** — välj EN konkret sak att förbättra eller fixa. Specificera vilket fil, tabell eller API som berörs.
3. **Koppling till vision** — hur hänger åtgärden ihop med det visionära dokumentet och kärnuppdraget?
4. **Teknisk rekommendation** — ge ett konkret kodförslag eller pseudokod för den prioriterade åtgärden.

Var direkt och konkret. Undvik upprepning av vad som redan finns. Fokusera på nästa steg, inte på det som redan fungerar.

Formatet:
# Daily Strategy Report: ${datum}

## Systemhälsa

## Prioriterad åtgärd

## Koppling till vision

## Teknisk rekommendation

\`\`\`
[pseudokod eller konkret förslag]
\`\`\`

## Sammanfattning (en mening)`;

  console.log(`Kallar Codestral för strategi ${datum}…`);
  let strategi;
  try {
    strategi = await callCodestral(prompt);
  } catch (e) {
    console.error("Codestral misslyckades:", e.message);
    process.exit(1);
  }

  const innehall = `${strategi}\n\n---\n*Genererad av daily-strategy.js med Codestral, ${datum}*\n`;
  fs.writeFileSync(utfil, innehall, "utf8");
  console.log(`Strategi sparad: ${utfil}`);
}

main().catch(e => { console.error(e); process.exit(1); });
