#!/usr/bin/env node
/**
 * qa-observer.js
 *
 * Visuell QA-observatör: tar skärmdumpar av nyckelsidor på debatt-ai.se,
 * skickar dem till ett vision-LLM och rapporterar status.
 *
 * Primär: Groq (Llama 4 Scout) — generösa rate limits, 30 rpm.
 * Fallback: Gemini 2.0 Flash — används om Groq saknas eller svarar 429.
 *
 * Sparar resultat till Supabase (qa_snapshots) för veckovis jämförelse.
 * Hämtar föregående veckas data och visar diff: "förra veckan OK → nu FEL".
 *
 * Kräver:
 *   GROQ_API_KEY            — primär vision-provider (GitHub Secret)
 *   GEMINI_API_KEY          — fallback vision-provider (GitHub Secret)
 *   SUPABASE_ANON_KEY       — valfritt, aktiverar historik (GitHub Secret)
 *   BASE_URL                — valfritt, default https://www.debatt-ai.se
 *
 * Kör lokalt:
 *   GROQ_API_KEY=... SUPABASE_ANON_KEY=... node agents/qa-observer.js
 */

const fs   = require("fs");
const path = require("path");

const GROQ_KEY     = process.env.GROQ_API_KEY;
const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const SB_KEY       = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL     = (process.env.BASE_URL || "https://www.debatt-ai.se").replace(/\/$/, "");
const SUMMARY_FILE = process.env.GITHUB_STEP_SUMMARY;
const DISCUSSIONS  = path.join(__dirname, "../ai-bus/discussions");

if (!GROQ_KEY && !GEMINI_KEY) {
  console.error("Varken GROQ_API_KEY eller GEMINI_API_KEY är satt — avbryter");
  process.exit(1);
}

const VISION_PROVIDER = GROQ_KEY ? "groq" : "gemini";
console.log(`Vision-provider: ${VISION_PROVIDER}${GROQ_KEY && GEMINI_KEY ? " (Gemini som fallback)" : ""}`);

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

// ── ISO-vecka helpers ─────────────────────────────────────────────────────────
function isoVecka(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function föregåendeVecka(vecka) {
  const [year, wk] = vecka.split("-W").map(Number);
  // Hitta måndag i veckan, dra 7 dagar
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1 + (wk - 1) * 7);
  monday.setUTCDate(monday.getUTCDate() - 7);
  return isoVecka(monday);
}

// ── HTTPS helpers ─────────────────────────────────────────────────────────────
const https = require("https");

function httpsPost(host, urlPath, headers, body) {
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
    req.setTimeout(60000, () => { req.destroy(new Error("httpsPost timeout")); });
    req.write(data);
    req.end();
  });
}

function httpsGet(host, urlPath, headers) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: host, path: urlPath, method: "GET", headers },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          try { resolve(JSON.parse(buf)); }
          catch { resolve([]); }
        });
      }
    );
    req.on("error", () => resolve([]));
    req.end();
  });
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
function sbHeaders() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  };
}

async function sparaSnapshot(rad) {
  if (!SB_KEY) return;
  try {
    await httpsPost(
      "fmwxftnistkoqazfwnuj.supabase.co",
      "/rest/v1/qa_snapshots",
      sbHeaders(),
      rad
    );
  } catch (e) {
    console.error(`  ⚠ Kunde inte spara snapshot till Supabase: ${e.message}`);
  }
}

async function hämtaFörraVeckan(vecka) {
  if (!SB_KEY) return [];
  const prev = föregåendeVecka(vecka);
  try {
    const rows = await httpsGet(
      "fmwxftnistkoqazfwnuj.supabase.co",
      `/rest/v1/qa_snapshots?vecka=eq.${prev}&select=sida_path,status,orsak`,
      { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    );
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

// ── Vision-analys (Groq primär, Gemini fallback) ──────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function byggPrompt(sidnamn, konsolfEl) {
  const konsoltext = konsolfEl.length
    ? `Konsolfel:\n${konsolfEl.slice(0, 5).map(e => `  • ${e}`).join("\n")}`
    : "Inga konsolfel.";
  return `Du är en QA-granskare för webbplatsen debatt-ai.se — en AI-socialsimulering med agenter, börser, hedgefonder och politiska system.

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
}

function tolkSvar(text) {
  const statusM = text.match(/STATUS:\s*(OK|VARNING|FEL)/i);
  const orsak   = text.match(/ORSAK:\s*(.+)/i)?.[1]?.trim() || "Ingen förklaring";
  const detalj  = text.match(/DETALJ:\s*(.+)/i)?.[1]?.trim() || "–";
  return { status: statusM?.[1]?.toUpperCase() || "VARNING", orsak, detalj };
}

async function analyseraGroq(sidnamn, b64, konsolfEl) {
  const res = await httpsPost(
    "api.groq.com",
    "/openai/v1/chat/completions",
    { Authorization: `Bearer ${GROQ_KEY}` },
    {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
          { type: "text", text: byggPrompt(sidnamn, konsolfEl) },
        ],
      }],
      max_tokens: 300,
      temperature: 0.1,
    }
  );
  if (res.status === 429) return null; // rate-limited → fallback
  if (res.status !== 200) {
    console.error(`  Groq API-fel ${res.status}:`, JSON.stringify(res.body).slice(0, 150));
    return null;
  }
  const text = res.body?.choices?.[0]?.message?.content || "";
  return tolkSvar(text);
}

async function analyseraGemini(sidnamn, b64, konsolfEl) {
  if (!GEMINI_KEY) return null;
  const res = await httpsPost(
    "generativelanguage.googleapis.com",
    `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {},
    {
      contents: [{ parts: [
        { inline_data: { mime_type: "image/png", data: b64 } },
        { text: byggPrompt(sidnamn, konsolfEl) },
      ]}],
      generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
    }
  );
  if (res.status !== 200) {
    console.error(`  Gemini API-fel ${res.status}:`, JSON.stringify(res.body).slice(0, 150));
    return null;
  }
  const text = res.body?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return tolkSvar(text);
}

async function analysera(sidnamn, b64, konsolfEl) {
  // Primär: Groq
  if (GROQ_KEY) {
    const r = await analyseraGroq(sidnamn, b64, konsolfEl);
    if (r) return r;
    console.log(`  ↩ Groq rate-limited — provar Gemini fallback för ${sidnamn}`);
  }
  // Fallback: Gemini (3s fördröjning för att undvika att även Gemini rate-limiteras)
  await sleep(3000);
  const r2 = await analyseraGemini(sidnamn, b64, konsolfEl);
  if (r2) return r2;
  return { status: "VARNING", orsak: "Alla vision-providers otillgängliga", detalj: "–" };
}

// ── Diff-tabell mot föregående vecka ─────────────────────────────────────────
function byggDiff(resultat, förra) {
  if (!förra.length) return null;

  const förraMap = Object.fromEntries(förra.map(r => [r.sida_path, r]));
  const ändringar = [];

  for (const r of resultat) {
    const fg = förraMap[r.path];
    if (!fg) continue;
    if (fg.status !== r.status) {
      const regression = (fg.status === "OK" && r.status !== "OK") ||
                         (fg.status === "VARNING" && r.status === "FEL");
      ändringar.push({ namn: r.namn, path: r.path, från: fg.status, till: r.status, regression });
    }
  }

  return ändringar;
}

// ── Huvudflöde ────────────────────────────────────────────────────────────────
async function kör() {
  let playwright;
  try {
    playwright = require("playwright");
  } catch {
    console.error("playwright saknas — installera med: npx playwright install chromium");
    process.exit(1);
  }

  const vecka    = isoVecka();
  const startTid = Date.now();
  const tmpDir   = fs.mkdtempSync(path.join(require("os").tmpdir(), "qa-"));

  console.log(`\n🔍 QA-observatör startar — ${BASE_URL} (${vecka})`);
  console.log(`   Kontrollerar ${SIDOR.length} sidor...\n`);

  // Hämta föregående veckas data parallellt med att vi startar browsern
  const förraLöfte = hämtaFörraVeckan(vecka);

  const browser = await playwright.chromium.launch({ args: ["--no-sandbox"] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: "Mozilla/5.0 (compatible; debatt-ai-qa/1.0)",
  });

  const resultat = [];

  for (const sida of SIDOR) {
    const url      = BASE_URL + sida.path;
    const konsolfEl = [];

    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") konsolfEl.push(msg.text().slice(0, 200));
    });
    page.on("pageerror", (err) => konsolfEl.push(`[pageerror] ${err.message.slice(0, 200)}`));

    let laddningsfel = null;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
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
        // 3s fördröjning håller oss under 20 rpm (Groq-gräns: 30 rpm)
        await sleep(3000);
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

    // Spara till Supabase direkt (icke-blockerande fel)
    sparaSnapshot({
      vecka,
      sida_path:          sida.path,
      sida_namn:          sida.namn,
      status:             analys.status,
      orsak:              analys.orsak,
      detalj:             analys.detalj,
      konsol_fel_antal:   konsolfEl.length,
      konsol_fel_exempel: konsolfEl.slice(0, 3),
      screenshot_b64:     fs.existsSync(skärmdumpPath)
                            ? fs.readFileSync(skärmdumpPath).toString("base64")
                            : null,
    });
  }

  await browser.close();

  // ── Hämta diff ────────────────────────────────────────────────────────────
  const förra    = await förraLöfte;
  const diff     = byggDiff(resultat, förra);
  const prevVecka = föregåendeVecka(vecka);

  // ── Bygg markdown-rapport ─────────────────────────────────────────────────
  const elapsed  = Math.round((Date.now() - startTid) / 1000);
  const antalOK  = resultat.filter(r => r.status === "OK").length;
  const antalVar = resultat.filter(r => r.status === "VARNING").length;
  const antalFel = resultat.filter(r => r.status === "FEL").length;

  const övergripande = antalFel > 0 ? "❌ FEL" : antalVar > 0 ? "⚠️ VARNING" : "✅ ALLT OK";

  const rader = resultat.map(r => {
    const ikon    = r.status === "OK" ? "✅" : r.status === "VARNING" ? "⚠️" : "❌";
    const konsFel = r.konsolfEl.length ? ` (${r.konsolfEl.length} konsolfel)` : "";
    const detalj  = r.detalj !== "–" ? `<br><sub>${r.detalj}</sub>` : "";
    return `| ${ikon} | [${r.namn}](${r.url}) | ${r.orsak}${konsFel}${detalj} |`;
  }).join("\n");

  // Diff-sektion
  let diffSektion = "";
  if (diff === null) {
    diffSektion = SB_KEY
      ? `\n> ℹ️ Ingen historik för ${prevVecka} — diff visas från och med nästa körning.\n`
      : `\n> ℹ️ SUPABASE_ANON_KEY saknas — historik och diff är inaktiverat.\n`;
  } else if (diff.length === 0) {
    diffSektion = `\n> ✅ Ingen statusändring jämfört med ${prevVecka}.\n`;
  } else {
    const diffRader = diff.map(d => {
      const frånIkon = d.från === "OK" ? "✅" : d.från === "VARNING" ? "⚠️" : "❌";
      const tillIkon = d.till === "OK" ? "✅" : d.till === "VARNING" ? "⚠️" : "❌";
      const typ      = d.regression ? "🔴 **REGRESSION**" : "🟢 Förbättring";
      return `| ${typ} | [${d.namn}](${BASE_URL}${d.path}) | ${frånIkon} ${d.från} | ${tillIkon} ${d.till} |`;
    }).join("\n");

    const antalReg = diff.filter(d => d.regression).length;
    diffSektion = `
### 📊 Förändringar jämfört med ${prevVecka}

${antalReg > 0 ? `> ⚠️ **${antalReg} regression(er) sedan förra veckan!**` : "> ✅ Inga regressioner — men statusen har ändrats."}

| Typ | Sida | Förra veckan | Den här veckan |
|---|---|---|---|
${diffRader}
`;
  }

  const rapport = `## 🔍 Visuell QA-rapport — ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC

**Övergripande status: ${övergripande}** (vecka ${vecka})

| | Sida | Observation |
|---|---|---|
${rader}
${diffSektion}
---
**Sammanfattning:** ${antalOK} OK · ${antalVar} varningar · ${antalFel} fel · ${elapsed}s total${SB_KEY ? ` · Sparat till Supabase (qa_snapshots, vecka ${vecka})` : ""}
`;

  console.log("\n" + rapport);

  if (SUMMARY_FILE) {
    fs.appendFileSync(SUMMARY_FILE, rapport);
    console.log(`Rapport skriven till ${SUMMARY_FILE}`);
  }

  // ── Spara till ai-bus/discussions/ så Claude Code läser det vid sessionsstart ─
  try {
    const ts       = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
    const filnamn  = path.join(DISCUSSIONS, `${ts}-qa.md`);
    const regressionerText = diff && diff.filter(d => d.regression).length > 0
      ? `regressions: ${diff.filter(d => d.regression).length}`
      : "regressions: 0";
    const frontmatter = `---
type: qa
date: ${new Date().toISOString().slice(0, 10)}
week: ${vecka}
overall: ${antalFel > 0 ? "FEL" : antalVar > 0 ? "VARNING" : "OK"}
ok: ${antalOK}
warnings: ${antalVar}
errors: ${antalFel}
${regressionerText}
---
`;
    if (!fs.existsSync(DISCUSSIONS)) fs.mkdirSync(DISCUSSIONS, { recursive: true });
    fs.writeFileSync(filnamn, frontmatter + rapport);
    console.log(`QA-rapport sparad: ${filnamn}`);
  } catch (e) {
    console.error(`Kunde inte spara till ai-bus/discussions/: ${e.message}`);
  }

  // Varningar loggas men bryter inte workflow — bara faktiska fel (inga sidor laddas)
  if (antalFel > 0) process.exit(1);
  process.exit(0);
}

kör().catch((e) => {
  console.error("Oväntat fel:", e);
  process.exit(1);
});
