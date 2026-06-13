#!/usr/bin/env node
/**
 * vision-agent.js
 *
 * Kallar Cerebras (Llama 3.3 70B) dagligen och genererar en visionär text
 * om nya funktioner och idéer för att uppfylla Debatt-AI:s syfte.
 *
 * Sparar till ai-bus/discussions/YYYY-MM-DD-vision.md
 *
 * Körs av GitHub Actions (daily-vision.yml) eller manuellt:
 *   CEREBRAS_API_KEY=xxx node agents/vision-agent.js
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");

const CEREBRAS_API_KEY  = process.env.CEREBRAS_API_KEY;
const GROQ_API_KEY      = process.env.GROQ_API_KEY;
const DISCUSSIONS_DIR   = path.join(__dirname, "../ai-bus/discussions");
const VISION_DIR        = path.join(DISCUSSIONS_DIR, "vision");
const KRONIKA_DIR       = path.join(DISCUSSIONS_DIR, "kronika");
const ECONOMY_DIR       = path.join(DISCUSSIONS_DIR, "economy");
const GOAL_PATH         = path.join(__dirname, "../ai-bus/goal.md");
const CLAUDE_MD_PATH    = path.join(__dirname, "../CLAUDE.md");
const REJECTED_DIR      = path.join(__dirname, "../ai-bus/rejected");
const IMPLEMENTED_DIR   = path.join(__dirname, "../ai-bus/implemented");

if (!CEREBRAS_API_KEY && !GROQ_API_KEY) {
  console.error("Varken CEREBRAS_API_KEY eller GROQ_API_KEY finns — avbryter");
  process.exit(1);
}

function dagensDatum() {
  return new Date().toISOString().slice(0, 10);
}

function tidsstämpel() {
  return new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
}

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function extractVisionTitle(content) {
  const m = content.match(/^#\s+Vision:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

function lastNVisions(n = 3) {
  if (!fs.existsSync(VISION_DIR)) return [];
  return fs.readdirSync(VISION_DIR)
    .filter(f => f.endsWith(".md"))
    .sort()
    .slice(-n)
    .map(f => {
      try { return fs.readFileSync(path.join(VISION_DIR, f), "utf8").slice(0, 800); }
      catch { return ""; }
    })
    .filter(Boolean);
}

function lastCronike() {
  if (!fs.existsSync(KRONIKA_DIR)) return "";
  const filer = fs.readdirSync(KRONIKA_DIR).filter(f => f.endsWith(".md")).sort();
  if (filer.length === 0) return "";
  try { return fs.readFileSync(path.join(KRONIKA_DIR, filer[filer.length - 1]), "utf8").slice(0, 1200); }
  catch { return ""; }
}

function lastEconomy() {
  if (!fs.existsSync(ECONOMY_DIR)) return "";
  const filer = fs.readdirSync(ECONOMY_DIR).filter(f => f.endsWith(".md")).sort();
  if (filer.length === 0) return "";
  try { return fs.readFileSync(path.join(ECONOMY_DIR, filer[filer.length - 1]), "utf8").slice(0, 800); }
  catch { return ""; }
}

function readGoal() {
  try { return fs.readFileSync(GOAL_PATH, "utf8").slice(0, 2000); }
  catch { return "Målet med Debatt-AI är att bygga världens bästa AI-socialsimulering och testa ekonomisk civilisationsteori på autonoma AI-samhällen."; }
}

/**
 * Läser beslutshistorik ur rejected/ och implemented/
 * Returnerar ett formaterat stycke för promptinjicering.
 */
function readDecisionHistory() {
  function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    if (!match) return {};
    const fm = {};
    const lines = match[1].split("\n");
    let foldedKey = null;
    let foldedLines = [];
    for (const line of lines) {
      // Collect indented continuation lines for a folded scalar (key: >)
      if (foldedKey !== null) {
        if (/^\s+/.test(line)) {
          foldedLines.push(line.trim());
          continue;
        }
        fm[foldedKey] = foldedLines.join(" ");
        foldedKey = null;
        foldedLines = [];
      }
      // Folded scalar: key: >
      const folded = line.match(/^(\w+):\s*>\s*$/);
      if (folded) { foldedKey = folded[1]; continue; }
      // Regular single-line: key: value or key: "value"
      const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (kv) fm[kv[1]] = kv[2];
    }
    if (foldedKey !== null) fm[foldedKey] = foldedLines.join(" ");
    return fm;
  }

  function readDir(dir, filterType) {
    try {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir)
        .filter(f => f.endsWith(".md"))
        .sort()
        .slice(-15)
        .map(f => {
          try {
            const content = fs.readFileSync(path.join(dir, f), "utf8");
            return parseFrontmatter(content);
          } catch { return null; }
        })
        .filter(fm => fm && fm.title && (!filterType || fm.type === filterType));
    } catch { return []; }
  }

  const rejectedVisions  = readDir(REJECTED_DIR, "vision");
  const rejectedOther    = readDir(REJECTED_DIR, null).filter(fm => fm.type !== "vision").slice(-5);
  const implemented      = readDir(IMPLEMENTED_DIR, null).slice(-8);

  const parts = [];

  if (rejectedVisions.length > 0) {
    parts.push("### Avfärdade vision-förslag (föreslå INTE dessa igen utan ny motivering)");
    for (const fm of rejectedVisions) {
      parts.push(`- **${fm.title}** — ${fm.rationale || "ingen rationale angiven"}`);
    }
  }

  if (implemented.length > 0) {
    parts.push("\n### Nyligen implementerat (bygg PÅ detta, upprepa det inte)");
    for (const fm of implemented) {
      const extra = fm.impact ? ` → ${fm.impact}` : "";
      parts.push(`- ${fm.title}${extra}`);
    }
  }

  if (rejectedOther.length > 0) {
    parts.push("\n### Övriga avfärdade förslag (kontext)");
    for (const fm of rejectedOther) {
      parts.push(`- ${fm.title} [${fm.type || "?"}]${fm.rationale ? `: ${fm.rationale.slice(0, 100)}…` : ""}`);
    }
  }

  return parts.length > 0
    ? `\n\n## Besluthistorik — undvik cirkeltänkande\n\n${parts.join("\n")}`
    : "";
}

function readClaudeMdFeatures() {
  try {
    const content = fs.readFileSync(CLAUDE_MD_PATH, "utf8");
    const features = content.split("\n")
      .filter(l => l.startsWith("### ✅"))
      .map(l => l.replace(/^### ✅ \d+\.\s*/, "").replace(/ – KLART$/, "").trim());
    return features.length > 0
      ? `\n\n## Alla redan byggda funktioner i CLAUDE.md (föreslå INTE dessa — de finns redan)\n${features.map(f => `- ${f}`).join("\n")}`
      : "";
  } catch { return ""; }
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: "GET", headers },
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
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
    req.end();
  });
}

async function readFeatureRequests() {
  const sbKey = process.env.SUPABASE_ANON_KEY;
  if (!sbKey) return "";
  try {
    const { status, data } = await httpGet(
      "https://fmwxftnistkoqazfwnuj.supabase.co/rest/v1/agent_feature_requests" +
      "?status=eq.open&order=skapad.desc&limit=8&select=agent,kategori,titel,beskrivning,prioritet",
      { apikey: sbKey, Authorization: `Bearer ${sbKey}` }
    );
    if (status !== 200 || !Array.isArray(data) || data.length === 0) return "";
    const rader = data.map(r =>
      `- **[${r.kategori}/${r.prioritet}]** ${r.agent}: "${r.titel}" — ${r.beskrivning.slice(0, 120)}`
    );
    return `\n\n## Agenternas egna önskemål (direkt från simuleringen)\nDessa förslag kom från AI-agenter baserat på deras upplevelser — överväg dem som datapunkter:\n${rader.join("\n")}`;
  } catch { return ""; }
}

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
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
    req.setTimeout(60000, () => { req.destroy(); reject(new Error("Cerebras timeout")); });
    req.write(buf);
    req.end();
  });
}

async function callCerebras(prompt) {
  const body = JSON.stringify({
    model: "gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
    temperature: 0.9,
  });

  const delays = [5000, 15000, 30000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const { status, data } = await httpPost(
      "https://api.cerebras.ai/v1/chat/completions",
      { Authorization: `Bearer ${CEREBRAS_API_KEY}`, "Content-Type": "application/json" },
      body
    );
    if (status === 200) {
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error("Cerebras returnerade ingen text");
      return text.trim();
    }
    if ((status === 429 || status >= 500) && attempt < delays.length) {
      console.log(`  Cerebras ${status} — väntar ${delays[attempt] / 1000}s innan retry ${attempt + 1}/${delays.length}…`);
      await new Promise(r => setTimeout(r, delays[attempt]));
      continue;
    }
    throw new Error(`Cerebras API ${status}: ${JSON.stringify(data).slice(0, 200)}`);
  }
}

async function callGroq(prompt) {
  const body = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
    temperature: 0.9,
  });

  const { status, data } = await httpPost(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body
  );

  if (status !== 200) throw new Error(`Groq API ${status}: ${JSON.stringify(data).slice(0, 200)}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returnerade ingen text");
  return text.trim();
}

async function main() {
  const datum = dagensDatum();
  const stämpel = tidsstämpel();
  let utfil = path.join(VISION_DIR, `${stämpel}-vision.md`);

  if (!fs.existsSync(VISION_DIR)) fs.mkdirSync(VISION_DIR, { recursive: true });

  const goal = readGoal();
  const tidigareVisioner = lastNVisions(3);
  const tidigareKontext = tidigareVisioner.length > 0
    ? `\n\nSenaste visionerna (undvik att upprepa samma idéer):\n${tidigareVisioner.map((v, i) => `--- Vision ${i + 1} ---\n${v}`).join("\n\n")}`
    : "";
  const beslutHistorik = readDecisionHistory();
  const claudeMdFeatures = readClaudeMdFeatures();
  if (claudeMdFeatures) console.log(`  📋 Injicerar ${claudeMdFeatures.split("\n").filter(l => l.startsWith("-")).length} byggda funktioner från CLAUDE.md`);
  const agentÖnskemål = await readFeatureRequests();
  if (agentÖnskemål) console.log(`  🤖 Injicerar ${agentÖnskemål.split("\n").filter(l => l.startsWith("-")).length} agentönskemål från simuleringen`);

  const cronike = lastCronike();
  const cronikeKontext = cronike
    ? `\n\n## Civilisationens narrativa tillstånd (senaste krönika från Civilisationshistorikern)\nDetta är vad som faktiskt händer i simuleringen just nu — använd som grund för att identifiera gap och möjligheter:\n${cronike}`
    : "";
  if (cronike) console.log("  📜 Injicerar senaste civilisationskrönikan");

  const economy = lastEconomy();
  const economyKontext = economy
    ? `\n\n## Ekonomisk analys (senaste rapport från Economy Observer)\n${economy}`
    : "";
  if (economy) console.log("  📊 Injicerar senaste ekonomianalysen");

  const prompt = `Du är en visionär AI-arkitekt med djup insikt i AI-simuleringar, civilisationsteori och social dynamik. Du analyserar plattformen Debatt-AI och genererar konkreta, innovativa idéer för att ta den till nästa nivå.\n\n## Plattformens uppdrag och vision\n\n${goal}\n${cronikeKontext}${economyKontext}${tidigareKontext}${claudeMdFeatures}${beslutHistorik}${agentÖnskemål}\n\n## Din uppgift idag (${datum})\n\nSkriv en visionär text (400-600 ord) på svenska som:\n\n1. **Identifierar ett specifikt gap** — vad saknar plattformen för att bli världsbäst inom AI-socialsimulering?\n2. **Föreslår en konkret ny funktion eller mekanism** — beskriv den tekniskt tillräckligt för att en utvecklare ska kunna implementera den\n3. **Kopplar till civilisationsteori** — hur relaterar förslaget till verkliga teorier om samhällen, ekonomi eller beteende?\n4. **Ger en implementeringsväg** — vilka filer/tabeller/APIs behöver skapas eller ändras?\n\nVar specifik, inte abstrakt. Inga floskler. Varje mening ska bära konkret information.\n\nFormatet ska vara:\n# Vision: [Rubrik]\n**Datum:** ${datum}\n\n## Identifierat gap\n\n## Förslag: [Funktionsnamn]\n\n## Koppling till teori\n\n## Implementeringsväg\n\n## Prioritet och komplexitet\n(Hög/Medel/Låg prioritet, Hög/Medel/Låg komplexitet)`;

  const avfardade = readDecisionHistory().match(/\*\*/g)?.length ?? 0;
  if (avfardade > 0) console.log(`  📚 Läser beslutshistorik: injicerar kontext från ai-bus/rejected/ och ai-bus/implemented/`);

  let vision;
  let modell;
  if (CEREBRAS_API_KEY) {
    console.log(`Kallar Cerebras (gpt-oss-120b) för vision ${datum}…`);
    try {
      vision = await callCerebras(prompt);
      modell = "Cerebras gpt-oss-120b";
    } catch (e) {
      console.error("Cerebras misslyckades efter retries:", e.message);
    }
  }
  if (!vision && GROQ_API_KEY) {
    console.log("Faller tillbaka till Groq (llama-3.3-70b-versatile)…");
    try {
      vision = await callGroq(prompt);
      modell = "Groq llama-3.3-70b-versatile";
    } catch (e) {
      console.error("Groq misslyckades:", e.message);
    }
  }
  if (!vision) {
    console.error("Alla providers misslyckades — avbryter");
    process.exit(1);
  }

  const rubrik = extractVisionTitle(vision);
  if (rubrik) {
    utfil = path.join(VISION_DIR, `${stämpel}-vision-${toSlug(rubrik)}.md`);
  }

  const innehall = `${vision}\n\n---\n*Genererad av vision-agent.js med ${modell}, ${datum}*\n`;
  fs.writeFileSync(utfil, innehall, "utf8");
  console.log(`Vision sparad: ${utfil}`);
}

main().catch(e => { console.error(e); process.exit(1); });
