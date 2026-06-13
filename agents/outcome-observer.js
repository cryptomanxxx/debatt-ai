#!/usr/bin/env node
/**
 * outcome-observer.js
 *
 * Bedömer utfallet av implementerade förbättringar i ai-bus/implemented/.
 * Filer >= 7 dagar gamla som saknar "## Utfall" kompletteras med en
 * LLM-genererad utfallsbedömning baserad på aktuell plattformsstatistik.
 *
 * Körs varje måndag (outcome-observer.yml) eller manuellt:
 *   CEREBRAS_API_KEY=xxx SUPABASE_ANON_KEY=xxx node agents/outcome-observer.js
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");

const CEREBRAS_KEY    = process.env.CEREBRAS_API_KEY;
const SUPABASE_URL    = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SUPABASE_KEY    = process.env.SUPABASE_ANON_KEY;
const IMPLEMENTED_DIR = path.join(__dirname, "../ai-bus/implemented");
const DISCUSSIONS_DIR = path.join(__dirname, "../ai-bus/discussions");

if (!CEREBRAS_KEY) {
  console.error("CEREBRAS_API_KEY saknas — avbryter");
  process.exit(1);
}

// ── Hjälpfunktioner ────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split("\n");
  let foldedKey = null;
  let foldedLines = [];
  for (const line of lines) {
    if (foldedKey !== null) {
      if (/^\s+/.test(line)) { foldedLines.push(line.trim()); continue; }
      fm[foldedKey] = foldedLines.join(" ");
      foldedKey = null; foldedLines = [];
    }
    const folded = line.match(/^(\w+):\s*>\s*$/);
    if (folded) { foldedKey = folded[1]; continue; }
    const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (kv) fm[kv[1]] = kv[2];
  }
  if (foldedKey !== null) fm[foldedKey] = foldedLines.join(" ");
  return fm;
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  if (isNaN(d)) return 999;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
}

function httpJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   opts.method || "GET",
      headers:  opts.headers || {},
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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("timeout")); });
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

// ── Plattformsstatistik ────────────────────────────────────────────────────

async function fetchPlatformMetrics() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [artiklar, agenter, koalitioner, lobbying, roster, errors] = await Promise.all([
    sb("artiklar", `select=id,kalla,skapad&skapad=gte.${sevenDaysAgo}&limit=500`),
    sb("agent_planbocker", "select=agent,saldo&order=saldo.desc"),
    sb("agent_koalitioner", "select=styrka,senast_aktiv&order=styrka.desc&limit=100"),
    sb("lobbying_log", `select=resultat&skapad=gte.${sevenDaysAgo}&limit=200`),
    sb("agent_roster_lag", `select=rod&skapad=gte.${sevenDaysAgo}&limit=500`),
    sb("civilisations_minne", `select=typ,rubrik&skapad=gte.${sevenDaysAgo}&limit=50`),
  ]);

  const aiArtiklar   = artiklar.filter(a => a.kalla === "ai").length;
  const lyckadLobby  = lobbying.filter(l => l.resultat === "accepterat").length;
  const saldoSum     = agenter.reduce((s, a) => s + (a.saldo || 0), 0);
  const koalMedel    = koalitioner.length > 0
    ? (koalitioner.reduce((s, k) => s + (k.styrka || 0), 0) / koalitioner.length).toFixed(1)
    : "0.0";
  const jaRoster    = roster.filter(r => r.rod === "ja").length;
  const skandaler   = errors.filter(e => e.typ === "skandal").length;
  const triumfer    = errors.filter(e => e.typ === "triumf").length;

  return {
    artiklarTotalt: artiklar.length,
    aiArtiklar,
    aktivaAgenter: agenter.length,
    totalEkonomi: Math.round(saldoSum),
    medelKoalitionStyrka: koalMedel,
    lobbyingFramgangPct: lobbying.length > 0 ? Math.round(lyckadLobby / lobbying.length * 100) : null,
    parlamentRosterJaPct: roster.length > 0 ? Math.round(jaRoster / roster.length * 100) : null,
    skandalerSenaste7d: skandaler,
    triumferSenaste7d: triumfer,
  };
}

// ── Senaste diskussioner som kontext ──────────────────────────────────────

function readRecentDiscussions(n = 4) {
  if (!fs.existsSync(DISCUSSIONS_DIR)) return "";
  const subdirs = ["vision", "strategy", "economy", "qa", "kronika", "ai-performance"];
  const allFiles = [];
  for (const sub of subdirs) {
    const subPath = path.join(DISCUSSIONS_DIR, sub);
    if (!fs.existsSync(subPath)) continue;
    fs.readdirSync(subPath)
      .filter(f => f.endsWith(".md"))
      .forEach(f => allFiles.push(path.join(subPath, f)));
  }
  allFiles.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
  return allFiles.slice(-n).map(f => {
    try { return fs.readFileSync(f, "utf8").slice(0, 350); }
    catch { return ""; }
  }).filter(Boolean).join("\n---\n");
}

// ── LLM-anrop med retry ────────────────────────────────────────────────────

async function kallaCerebras(prompt) {
  const body = JSON.stringify({
    model: "gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 700,
    temperature: 0.5,
  });

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { status, data } = await httpJson("https://api.cerebras.ai/v1/chat/completions", {
        method:  "POST",
        headers: { Authorization: `Bearer ${CEREBRAS_KEY}`, "Content-Type": "application/json" },
        body,
      });
      if (status !== 200) throw new Error(`Cerebras API ${status}: ${JSON.stringify(data).slice(0, 200)}`);
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error("Cerebras returnerade ingen text");
      return text.trim();
    } catch (e) {
      lastErr = e;
      if (attempt < 3) {
        console.warn(`Cerebras försök ${attempt} misslyckades: ${e.message} — försöker igen om ${attempt * 2}s`);
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }
  throw lastErr;
}

// ── Huvud ──────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(IMPLEMENTED_DIR)) {
    console.log("Ingen implemented/-katalog hittades — avslutar.");
    return;
  }

  const filer = fs.readdirSync(IMPLEMENTED_DIR)
    .filter(f => f.endsWith(".md"))
    .sort();

  const toBedöm = [];

  for (const f of filer) {
    const fp = path.join(IMPLEMENTED_DIR, f);
    let content;
    try { content = fs.readFileSync(fp, "utf8"); }
    catch { continue; }

    if (content.includes("## Utfall")) continue;

    const fm = parseFrontmatter(content);
    if (fm.status && fm.status !== "implemented") continue;

    const implDatum = fm.implemented || fm.created;
    if (!implDatum || daysSince(implDatum) < 7) continue;

    toBedöm.push({ fil: f, fp, content, fm });
  }

  if (toBedöm.length === 0) {
    console.log("Inga implementeringar att bedöma (alla < 7 dagar gamla eller redan bedömda).");
    return;
  }

  console.log(`Hämtar plattformsstatistik…`);
  const metrics = await fetchPlatformMetrics();
  console.log("Metrics:", JSON.stringify(metrics));

  const diskussioner = readRecentDiscussions(4);
  const dagens = new Date().toISOString().slice(0, 10);
  let bedömdaAntal = 0;

  for (const { fil, fp, content, fm } of toBedöm) {
    console.log(`\nBedömer: ${fil}`);
    const dagSedanImpl = Math.round(daysSince(fm.implemented || fm.created));

    // Extrahera implementeringens åtgärdstext (allt efter frontmattern)
    const åtgärd = content.replace(/^---[\s\S]+?---\n/, "").slice(0, 500);

    const prompt = `Du är en kritisk systemobservatör för plattformen Debatt-AI — en autonom AI-civilisationssimulering. Du bedömer om nyligen implementerade förbättringar faktiskt har gjort skillnad.\n\n## Implementering att bedöma\n- **Titel:** ${fm.title || "okänd"}\n- **Typ:** ${fm.type || "?"}\n- **Fil/komponent:** ${fm.file || "?"}\n- **Risk:** ${fm.risk || "?"}\n- **Implementerad:** ${fm.implemented || fm.created} (${dagSedanImpl} dagar sedan)\n- **Åtgärd/Beskrivning:**\n${åtgärd}\n\n## Plattformshälsa nu (${dagens})\n- Artiklar senaste 7 dagarna: ${metrics.artiklarTotalt} (AI: ${metrics.aiArtiklar})\n- Aktiva agenter: ${metrics.aktivaAgenter}\n- Total ekonomi: ${metrics.totalEkonomi} kr\n- Medel koalitionsstyrka: ${metrics.medelKoalitionStyrka}\n${metrics.lobbyingFramgangPct != null ? `- Lobbyingframgång: ${metrics.lobbyingFramgangPct}%` : ""}\n${metrics.parlamentRosterJaPct != null ? `- Ja-andel i parlamentet: ${metrics.parlamentRosterJaPct}%` : ""}\n- Skandaler senaste 7d: ${metrics.skandalerSenaste7d}\n- Triumfer senaste 7d: ${metrics.triumferSenaste7d}\n\n## Senaste AI-analyser (kontext)\n${diskussioner.slice(0, 600)}\n\n## Din uppgift\nSkriv en konkret utfallsbedömning (150–220 ord) på svenska. Svara på:\n1. Har implementeringen troligen haft effekt? (Ja/Nej/Svårt att mäta)\n2. Vilka plattformsmätvärden stöder eller motbevisar effekten?\n3. Finns tecken på kvarvarande problem i samma område?\n4. Slutrekommendation: Avsluta / Följ upp / Utöka\n\nAvsluta alltid med en rad i formatet:\n**Bedömning: POSITIV / NEUTRAL / NEGATIV**`;

    try {
      const assessment = await kallaCerebras(prompt);
      const appendix = `\n\n---\n\n## Utfall\n*Bedömt ${dagens} av outcome-observer.js (Cerebras gpt-oss-120b)*\n\n${assessment}\n`;
      fs.writeFileSync(fp, content + appendix, "utf8");
      console.log(`  ✓ Utfall tillagt: ${fil}`);
      bedömdaAntal++;
    } catch (e) {
      console.error(`  ✗ Kunde inte bedöma ${fil}: ${e.message}`);
    }
  }

  console.log(`\nKlar: ${bedömdaAntal} av ${toBedöm.length} implementeringar bedömda.`);
}

main().catch(e => { console.error(e); process.exit(1); });
