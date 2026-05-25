#!/usr/bin/env node
/**
 * vision-agent.js
 *
 * Kallar Gemini dagligen och genererar en visionär text om nya funktioner
 * och idéer för att uppfylla Debatt-AI:s syfte.
 *
 * Sparar till ai-bus/discussions/YYYY-MM-DD-vision.md
 *
 * Körs av GitHub Actions (daily-vision.yml) eller manuellt:
 *   GEMINI_API_KEY=xxx node agents/vision-agent.js
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");

const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;
const DISCUSSIONS_DIR  = path.join(__dirname, "../ai-bus/discussions");
const GOAL_PATH        = path.join(__dirname, "../ai-bus/goal.md");

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY saknas — avbryter");
  process.exit(1);
}

function dagensDatum() {
  return new Date().toISOString().slice(0, 10);
}

function lastNVisions(n = 3) {
  if (!fs.existsSync(DISCUSSIONS_DIR)) return [];
  return fs.readdirSync(DISCUSSIONS_DIR)
    .filter(f => f.endsWith("-vision.md"))
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

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1200, temperature: 0.9 },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) reject(new Error("Gemini returnerade ingen text: " + data.slice(0, 200)));
          else resolve(text.trim());
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Gemini timeout")); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const datum = dagensDatum();
  const utfil = path.join(DISCUSSIONS_DIR, `${datum}-vision.md`);

  if (fs.existsSync(utfil)) {
    console.log(`Vision för ${datum} finns redan — hoppar över.`);
    return;
  }

  if (!fs.existsSync(DISCUSSIONS_DIR)) fs.mkdirSync(DISCUSSIONS_DIR, { recursive: true });

  const goal = readGoal();
  const tidigareVisioner = lastNVisions(3);
  const tidigareKontext = tidigareVisioner.length > 0
    ? `\n\nSenaste visionerna (undvik att upprepa samma idéer):\n${tidigareVisioner.map((v, i) => `--- Vision ${i + 1} ---\n${v}`).join("\n\n")}`
    : "";

  const prompt = `Du är en visionär AI-arkitekt med djup insikt i AI-simuleringar, civilisationsteori och social dynamik. Du analyserar plattformen Debatt-AI och genererar konkreta, innovativa idéer för att ta den till nästa nivå.

## Plattformens uppdrag och vision

${goal}
${tidigareKontext}

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

  console.log(`Kallar Gemini för vision ${datum}…`);
  let vision;
  try {
    vision = await callGemini(prompt);
  } catch (e) {
    console.error("Gemini misslyckades:", e.message);
    process.exit(1);
  }

  const innehall = `${vision}\n\n---\n*Genererad av vision-agent.js med Gemini 2.0 Flash, ${datum}*\n`;
  fs.writeFileSync(utfil, innehall, "utf8");
  console.log(`Vision sparad: ${utfil}`);
}

main().catch(e => { console.error(e); process.exit(1); });
