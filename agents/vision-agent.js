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
const DISCUSSIONS_DIR   = path.join(__dirname, "../ai-bus/discussions");
const GOAL_PATH         = path.join(__dirname, "../ai-bus/goal.md");
const CLAUDE_MD_PATH    = path.join(__dirname, "../CLAUDE.md");
const REJECTED_DIR      = path.join(__dirname, "../ai-bus/rejected");
const IMPLEMENTED_DIR   = path.join(__dirname, "../ai-bus/implemented");

if (!CEREBRAS_API_KEY) {
  console.error("CEREBRAS_API_KEY saknas — avbryter");
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
  if (!fs.existsSync(DISCUSSIONS_DIR)) return [];
  return fs.readdirSync(DISCUSSIONS_DIR)
    .filter(f => f.includes("-vision"))
    .sort()
    .slice(-n)
    .map(f => {
      try { return fs.readFileSync(path.join(DISCUSSIONS_DIR, f), "utf8").slice(0, 800); }
      catch { return ""; }
    })
    .filter(Boolean);
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
    for (const line of match[1].split("\n")) {
      const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (kv) fm[kv[1]] = kv[2];
    }
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

  const { status, data } = await httpPost(
    "https://api.cerebras.ai/v1/chat/completions",
    { Authorization: `Bearer ${CEREBRAS_API_KEY}`, "Content-Type": "application/json" },
    body
  );

  if (status !== 200) throw new Error(`Cerebras API ${status}: ${JSON.stringify(data).slice(0, 200)}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Cerebras returnerade ingen text");
  return text.trim();
}

async function main() {
  const datum = dagensDatum();
  const stämpel = tidsstämpel();
  let utfil = path.join(DISCUSSIONS_DIR, `${stämpel}-vision.md`);

  if (!fs.existsSync(DISCUSSIONS_DIR)) fs.mkdirSync(DISCUSSIONS_DIR, { recursive: true });

  const goal = readGoal();
  const tidigareVisioner = lastNVisions(3);
  const tidigareKontext = tidigareVisioner.length > 0
    ? `\n\nSenaste visionerna (undvik att upprepa samma idéer):\n${tidigareVisioner.map((v, i) => `--- Vision ${i + 1} ---\n${v}`).join("\n\n")}`
    : "";
  const beslutHistorik = readDecisionHistory();
  const claudeMdFeatures = readClaudeMdFeatures();
  if (claudeMdFeatures) console.log(`  📋 Injicerar ${claudeMdFeatures.split("\n").filter(l => l.startsWith("-")).length} byggda funktioner från CLAUDE.md`);

  const prompt = `Du är en visionär AI-arkitekt med djup insikt i AI-simuleringar, civilisationsteori och social dynamik. Du analyserar plattformen Debatt-AI och genererar konkreta, innovativa idéer för att ta den till nästa nivå.

## Plattformens uppdrag och vision

${goal}
${tidigareKontext}${claudeMdFeatures}${beslutHistorik}

## Din uppgift idag (${datum})

Skriv en visionär text (400-600 ord) på svenska som:

1. **Identifierar ett specifikt gap** — vad saknar plattformen för att bli världsbäst inom AI-socialsimulering?
2. **Föreslår en konkret ny funktion eller mekanism** — beskriv den tekniskt tillräckligt för att en utvecklare ska kunna implementera den
3. **Kopplar till civilisationsteori** — hur relaterar förslaget till verkliga teorier om samhällen, ekonomi eller beteende?
4. **Ger en implementeringsväg** — vilka filer/tabeller/APIs behöver skapas eller ändras?

Var specifik, inte abstrakt. Inga floskler. Varje mening ska bära konkret information.

Formatet ska vara:
# Vision: [Rubrik]
**Datum:** ${datum}

## Identifierat gap

## Förslag: [Funktionsnamn]

## Koppling till teori

## Implementeringsväg

## Prioritet och komplexitet
(Hög/Medel/Låg prioritet, Hög/Medel/Låg komplexitet)`;

  const avfardade = readDecisionHistory().match(/\*\*/g)?.length ?? 0;
  if (avfardade > 0) console.log(`  📚 Läser beslutshistorik: injicerar kontext från ai-bus/rejected/ och ai-bus/implemented/`);

  console.log(`Kallar Cerebras (Llama 3.3 70B) för vision ${datum}…`);
  let vision;
  try {
    vision = await callCerebras(prompt);
  } catch (e) {
    console.error("Cerebras misslyckades:", e.message);
    process.exit(1);
  }

  const rubrik = extractVisionTitle(vision);
  if (rubrik) {
    utfil = path.join(DISCUSSIONS_DIR, `${stämpel}-vision-${toSlug(rubrik)}.md`);
  }

  const innehall = `${vision}\n\n---\n*Genererad av vision-agent.js med Cerebras Llama 3.3 70B, ${datum}*\n`;
  fs.writeFileSync(utfil, innehall, "utf8");
  console.log(`Vision sparad: ${utfil}`);
}

main().catch(e => { console.error(e); process.exit(1); });
