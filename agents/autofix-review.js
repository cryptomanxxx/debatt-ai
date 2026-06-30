#!/usr/bin/env node
/**
 * agents/autofix-review.js
 * Analyserar PR-reviewkommentarer med GitHub Models (Llama 3.3 70B)
 * och applicerar fixes direkt i källfilerna.
 *
 * Miljövariabler (sätts av workflowen):
 *   GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUM, REVIEWER, BRANCH
 */

"use strict";
const fs = require("fs");
const https = require("https");

const PR_NUM   = process.env.PR_NUM;
const REVIEWER = process.env.REVIEWER || "okänd";
const BRANCH   = process.env.BRANCH   || "unknown";
const TOKEN    = process.env.GITHUB_TOKEN;
const REPO     = process.env.GITHUB_REPOSITORY;

// ── HTTP-helpers ──────────────────────────────────────────────────────────────

function httpGet(hostname, urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    let data = "";
    https.get(
      { hostname, path: urlPath, headers: { "User-Agent": "autofix-bot", ...headers } },
      res => {
        res.on("data", c => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); } catch { resolve(data); }
        });
      }
    ).on("error", reject);
  });
}

function httpPost(hostname, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(JSON.stringify(body));
    const req = https.request(
      {
        hostname, path: urlPath, method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": buf.length,
          ...headers,
        },
      },
      res => {
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(data)); }
        });
      }
    );
    req.on("error", reject);
    req.write(buf);
    req.end();
  });
}

// ── GitHub REST API ───────────────────────────────────────────────────────────

function ghApi(urlPath) {
  return httpGet("api.github.com", `/repos/${REPO}${urlPath}`, {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  });
}

// ── Groq (Llama 3.3 70B, 128k kontext) ───────────────────────────────────────

const GROQ_KEY = process.env.GROQ_API_KEY;

async function llm(messages) {
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY saknas");
  const res = await httpPost(
    "api.groq.com",
    "/openai/v1/chat/completions",
    { model: "llama-3.3-70b-specdec", messages, temperature: 0.05, max_tokens: 4096 },
    { Authorization: `Bearer ${GROQ_KEY}` }
  );
  if (res.error) throw new Error(JSON.stringify(res.error));
  const content = res?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Tomt svar: ${JSON.stringify(res)}`);
  return content;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!PR_NUM || !TOKEN || !REPO) {
    console.error("Saknar PR_NUM, GITHUB_TOKEN eller GITHUB_REPOSITORY");
    process.exit(1);
  }

  // Hämta inline-kommentarer
  const comments = await ghApi(`/pulls/${PR_NUM}/comments`);
  if (!Array.isArray(comments) || comments.length === 0) {
    const msg = "Inga inline-kommentarer — inget att fixa";
    console.log(msg);
    fs.writeFileSync("/tmp/autofix_output.txt", msg);
    return;
  }

  // Review body (sparad av workflowen)
  const reviewBody = fs.existsSync("/tmp/review_body.txt")
    ? fs.readFileSync("/tmp/review_body.txt", "utf8").trim()
    : "";

  // Gruppera kommentarer per fil
  const byFile = {};
  for (const c of comments) {
    if (!byFile[c.path]) byFile[c.path] = [];
    byFile[c.path].push({ line: c.line || c.original_line || "?", body: c.body });
  }

  // Läs filinnehåll
  let ctx = "";
  const loaded = {};
  for (const [filePath, comms] of Object.entries(byFile)) {
    if (!fs.existsSync(filePath)) {
      console.log(`Fil saknas lokalt: ${filePath} — hoppar över`);
      continue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    loaded[filePath] = content;
    ctx += `\n### ${filePath}\n\`\`\`\n${content}\n\`\`\`\n`;
    ctx += comms.map(c => `- Rad ${c.line}: ${c.body}`).join("\n") + "\n";
  }

  if (Object.keys(loaded).length === 0) {
    const msg = "Inga lokala filer att redigera";
    console.log(msg);
    fs.writeFileSync("/tmp/autofix_output.txt", msg);
    return;
  }

  const systemPrompt = `Du är en automatisk kodfix-bot för projektet Debatt-AI (Next.js + Python + Supabase).

UPPGIFT: Analysera review-kommentarer och fixa konkreta kodproblem.

REGLER:
1. Fixa BARA det kommentarerna explicit pekar ut — buggar, typos, fel logik, säkerhet
2. Minimala ändringar — ändra inte mer än nödvändigt
3. Hoppa över subjektiva preferenser, arkitekturfrågor och extern infrastruktur
4. Hoppa över oklara kommentarer

SVARSFORMAT — returnera ENBART en giltig JSON-array, inget annat:
[
  {
    "file": "exakt/relativ/sökväg.js",
    "old": "exakt kodsträng att ersätta (kopiera ordagrant från filkoden ovan)",
    "new": "ny kodsträng"
  }
]

Om inga ändringar behövs: returnera []

VIKTIGT: "old" måste vara en exakt delsträng av filinnehållet. Kopiera rakt ur koden, inga extra tecken.`;

  const userPrompt = [
    `Reviewer: ${REVIEWER} | PR #${PR_NUM} | Branch: ${BRANCH}`,
    reviewBody ? `\nREVIEW-SAMMANFATTNING:\n${reviewBody}` : "",
    `\nFILER OCH KOMMENTARER:\n${ctx}`,
    "Returnera JSON-arrayen. Enbart JSON.",
  ].join("\n");

  console.log(`Anropar GitHub Models för PR #${PR_NUM} (${Object.keys(loaded).length} fil(er))...`);

  let rawResponse;
  try {
    rawResponse = await llm([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
  } catch (err) {
    const msg = `GitHub Models API-fel: ${err.message}`;
    console.error(msg);
    fs.writeFileSync("/tmp/autofix_output.txt", msg);
    process.exit(1);
  }

  console.log("Svar:\n", rawResponse);
  fs.writeFileSync("/tmp/autofix_output.txt", rawResponse);

  // Parsa JSON-array ur svaret
  let fixes = [];
  try {
    const m = rawResponse.match(/\[[\s\S]*\]/);
    if (m) fixes = JSON.parse(m[0]);
  } catch {
    console.log("Kunde inte parsa JSON — inga ändringar");
    return;
  }

  if (!Array.isArray(fixes) || fixes.length === 0) {
    console.log("Inga fixes att applicera");
    return;
  }

  // Applicera fixes
  let applied = 0;
  for (const fix of fixes) {
    if (!fix?.file || fix.old === undefined || fix.new === undefined) continue;
    if (!fs.existsSync(fix.file)) {
      console.log(`Fil saknas: ${fix.file}`);
      continue;
    }
    const content = fs.readFileSync(fix.file, "utf8");
    if (!content.includes(fix.old)) {
      console.log(`Strängen hittades inte i ${fix.file} — hoppar över`);
      continue;
    }
    fs.writeFileSync(fix.file, content.replace(fix.old, fix.new), "utf8");
    console.log(`✓ Fixade ${fix.file}`);
    applied++;
  }

  console.log(`\n${applied} av ${fixes.length} fixes applicerade`);
}

main().catch(err => {
  console.error("Oväntat fel:", err);
  fs.writeFileSync("/tmp/autofix_output.txt", `Oväntat fel: ${err.message}`);
  process.exit(1);
});
