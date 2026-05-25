#!/usr/bin/env node
/**
 * qa-observer.js
 *
 * Visuell QA-observatör: tar skärmdumpar av nyckelssidor på debatt-ai.se,
 * skickar dem till Gemini 2.0 Flash vision och rapporterar status i
 * GITHUB_STEP_SUMMARY (eller stdout om variabeln saknas).
 *
 * Kräver:
 *   GEMINI_API_KEY   — redan konfigurerat som GitHub Secret
 *   BASE_URL         — valfritt, default https://www.debatt-ai.se
 *
 * Kör lokalt:
 *   GEMINI_API_KEY=... node agents/qa-observer.js
 */

const fs   = require("fs");
const path = require("path");

const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const BASE_URL     = (process.env.BASE_URL || "https://www.debatt-ai.se").replace(/\/$/, "");
const SUMMARY_FILE = process.env.GITHUB_STEP_SUMMARY;

if (!GEMINI_KEY) {
  console.error("GEMINI_API_KEY saknas — avbryter");
  process.exit(1);
}

// Sidor att granska
const SIDOR = [
  { path: "/",            namn: "Startsidan",         vikt: "hög" },
  { path: "/arkiv",       namn: "Arkivet",            vikt: "hög" },
  { path: "/bors",        namn: "Kryptobörsen",       vikt: "hög" },
  { path: "/etf",         namn: "Krypto-ETF",         vikt: "hög" },
  { path: "/hedgefonder", namn: "Hedgefonder",        vikt: "hög" },
  { path: "/stablecoin",  namn: "Stablecoin (STAB)",  vikt: "medel" },
  { path: "/markets",     namn: "Prediction Markets", vikt: "medel" },
  { path: "/ekonomi",     namn: "AI-Ekonomi",         vikt: "medel" },
  { path: "/opinion",     namn: "Besökaromröstning",  vikt: "medel" },
  { path: "/parlament",   namn: "AI-Parlamentet",     vikt: "medel" },
  { path: "/dynamik",     namn: "Agentdynamik",       vikt: "låg"   },
  { path: "/historia",    namn: "Civilisationsminne", vikt: "låg"   },
];

// ── Gemini 2.0 Flash vision via raw HTTPS ─────────────────────────────────────
function httpsPost(host, urlPath, headers, body) {
  const https = require("https");
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req  = https.request(
      { hostname: host, path: urlPath, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers } },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
          catch { resolve({ status: res.statusCode, body: buf }); }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function analysera(sidnamn, skärmdump_b64, konsolfEl) {
  const konsoltext = konsolfEl.length
    ? `Konsolfel:\n${konsolfEl.slice(0, 5).map(e => `  • ${e}`).join("\n")}`
    : "Inga konsolfel.";

  const prompt = `Du är en QA-granskare för webbplatsen debatt-ai.se — en AI-socialsimulering med agenter, börser, hedgefonder och politiska system.

Granska skärmdumpen av sidan "${sidnamn}" och bedöm:
1. Visas sidan korrekt? (ingen tom yta, inga brutna layoutelement)
2. Verkar data ha laddats? (tabeller/listor/grafer är ifyllda, inte tomma)
3. Finns synliga felmeddelanden eller "undefined"/"null"-text?
4. Ser det visuellt tilltalande ut? (mörkt tema, rätt färger, inga överlappande element)

${konsoltext}

Svara EXAKT i detta format (tre rader):
STATUS: OK | VARNING | FEL
ORSAK: [en mening om vad som är rätt/fel]
DETALJ: [valfri extra observation, max 120 tecken, eller "–"]`;

  const res = await httpsPost(
    "generativelanguage.googleapis.com",
    `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {},
    {
      contents: [{
        parts: [
          { inline_data: { mime_type: "image/png", data: skärmdump_b64 } },
          { text: prompt },
        ],
      }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
    }
  );

  if (res.status !== 200) {
    console.error(`Gemini API-fel ${res.status}:`, JSON.stringify(res.body).slice(0, 200));
    return { status: "VARNING", orsak: `Gemini API svarade ${res.status}`, detalj: "–" };
  }

  const text = res.body?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const statusM = text.match(/STATUS:\s*(OK|VARNING|FEL)/i);
  const orsak   = text.match(/ORSAK:\s*(.+)/i)?.[1]?.trim() || "Ingen förklaring";
  const detalj  = text.match(/DETALJ:\s*(.+)/i)?.[1]?.trim() || "–";

  return {
    status: statusM?.[1]?.toUpperCase() || "VARNING",
    orsak,
    detalj,
  };
}

// ── Playwright-del ────────────────────────────────────────────────────────────
async function kör() {
  // Dynamisk import av playwright (installeras i workflow)
  let playwright;
  try {
    playwright = require("playwright");
  } catch (e) {
    console.error("playwright saknas — installera med: npx playwright install chromium");
    process.exit(1);
  }

  const startTid = Date.now();
  const tmpDir   = fs.mkdtempSync(path.join(require("os").tmpdir(), "qa-"));

  console.log(`\n🔍 QA-observatör startar — ${BASE_URL}`);
  console.log(`   Kontrollerar ${SIDOR.length} sidor...\n`);

  const browser = await playwright.chromium.launch({ args: ["--no-sandbox"] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: "Mozilla/5.0 (compatible; debatt-ai-qa/1.0)",
  });

  const resultat = [];

  for (const sida of SIDOR) {
    const url       = BASE_URL + sida.path;
    const konsolfEl = [];

    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") konsolfEl.push(msg.text().slice(0, 200));
    });
    page.on("pageerror", (err) => konsolfEl.push(`[pageerror] ${err.message.slice(0, 200)}`));

    let laddningsfel = null;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      // Lite extra tid för React-hydration
      await page.waitForTimeout(2000);
    } catch (e) {
      laddningsfel = e.message.slice(0, 120);
    }

    const skärmdumpPath = path.join(tmpDir, `${sida.path.replace(/\//g, "_") || "hem"}.png`);
    try {
      await page.screenshot({ path: skärmdumpPath, fullPage: false });
    } catch (e) {
      console.error(`  ⚠ Kunde inte ta skärmdump för ${sida.path}: ${e.message}`);
    }
    await page.close();

    let analys;
    if (laddningsfel) {
      analys = { status: "FEL", orsak: `Sidan laddades inte: ${laddningsfel}`, detalj: "–" };
    } else if (fs.existsSync(skärmdumpPath)) {
      const b64 = fs.readFileSync(skärmdumpPath).toString("base64");
      console.log(`  📸 Analyserar ${sida.namn}...`);
      try {
        analys = await analysera(sida.namn, b64, konsolfEl);
      } catch (e) {
        analys = { status: "VARNING", orsak: `Vision-anrop misslyckades: ${e.message.slice(0, 80)}`, detalj: "–" };
      }
    } else {
      analys = { status: "FEL", orsak: "Skärmdump saknas", detalj: "–" };
    }

    resultat.push({ ...sida, url, konsolfEl, ...analys });
    const ikon = analys.status === "OK" ? "✅" : analys.status === "VARNING" ? "⚠️" : "❌";
    console.log(`  ${ikon} ${sida.namn}: ${analys.status} — ${analys.orsak}`);
  }

  await browser.close();

  // ── Bygg markdown-rapport ─────────────────────────────────────────────────
  const elapsed  = Math.round((Date.now() - startTid) / 1000);
  const antalOK  = resultat.filter(r => r.status === "OK").length;
  const antalVar = resultat.filter(r => r.status === "VARNING").length;
  const antalFel = resultat.filter(r => r.status === "FEL").length;

  const övergripande = antalFel > 0 ? "❌ FEL" : antalVar > 0 ? "⚠️ VARNING" : "✅ ALLT OK";

  const rader = resultat.map(r => {
    const ikon   = r.status === "OK" ? "✅" : r.status === "VARNING" ? "⚠️" : "❌";
    const konsFel = r.konsolfEl.length ? ` (${r.konsolfEl.length} konsolfel)` : "";
    const detalj  = r.detalj !== "–" ? `<br><sub>${r.detalj}</sub>` : "";
    return `| ${ikon} | [${r.namn}](${r.url}) | ${r.orsak}${konsFel}${detalj} |`;
  }).join("\n");

  const rapport = `## 🔍 Visuell QA-rapport — ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC

**Övergripande status: ${övergripande}**

| | Sida | Observation |
|---|---|---|
${rader}

---
**Sammanfattning:** ${antalOK} OK · ${antalVar} varningar · ${antalFel} fel · ${elapsed}s total
`;

  console.log("\n" + rapport);

  if (SUMMARY_FILE) {
    fs.appendFileSync(SUMMARY_FILE, rapport);
    console.log(`\nRapport skriven till ${SUMMARY_FILE}`);
  }

  // Sätt exit-kod baserat på resultat
  if (antalFel > 0) process.exit(2);
  if (antalVar > 0) process.exit(1);
  process.exit(0);
}

kör().catch((e) => {
  console.error("Oväntat fel:", e);
  process.exit(1);
});
