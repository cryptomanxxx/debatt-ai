#!/usr/bin/env node
/**
 * codestral-worker.js
 *
 * Analyserar nyligen ändrade filer med Mistral Codestral och skriver
 * strukturerade förslag till /ai-bus/suggestions/.
 *
 * Körs av GitHub Actions (codestral-analysis.yml) eller manuellt:
 *   MISTRAL_API_KEY=xxx node agents/codestral-worker.js
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const MISTRAL_API_KEY  = process.env.MISTRAL_API_KEY;
const SUPABASE_URL     = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SUPABASE_KEY     = process.env.SUPABASE_ANON_KEY;
const SUGGESTIONS_DIR  = path.join(__dirname, "../ai-bus/suggestions");
const DAYS_BACK        = parseInt(process.env.DAYS_BACK || "7", 10);
const MAX_FILES        = parseInt(process.env.MAX_FILES || "15", 10);
const MAX_CHARS_TOTAL  = 12000;

// Filer som alltid granskas oavsett ålder (kritisk infrastruktur)
const ALWAYS_WATCH = [
  "app/api/agent/submit/route.js",
  "app/api/chatt/route.js",
  "app/api/beslut/route.js",
  "nyheter.py",
  "agenter.py",
];

async function main() {
  if (!MISTRAL_API_KEY) {
    console.error("MISTRAL_API_KEY saknas — avbryter");
    process.exit(1);
  }

  console.log(`Analyserar filer ändrade senaste ${DAYS_BACK} dagarna…`);

  const changedFiles = getChangedFiles();
  const alwaysFiles  = ALWAYS_WATCH.filter(f => fs.existsSync(f));
  const allFiles     = [...new Set([...changedFiles, ...alwaysFiles])].slice(0, MAX_FILES);

  if (allFiles.length === 0) {
    console.log("Inga filer att analysera.");
    return;
  }

  console.log(`Filer: ${allFiles.join(", ")}`);

  const runtimeData    = await fetchRuntimeData();
  const runtimeSummary = buildRuntimeSummary(runtimeData);
  if (runtimeSummary) console.log("Runtime-data hämtad från Supabase.");

  const codeBlock = buildCodeBlock(allFiles);
  const suggestions = await analyzeWithCodestral(codeBlock, runtimeSummary);

  if (!suggestions.length) {
    console.log("Inga förslag genererade.");
    return;
  }

  const written = writeSuggestions(suggestions);
  console.log(`✓ ${written} förslag skrivna till ai-bus/suggestions/`);
}

// ── Hämta ändrade filer ────────────────────────────────────────────────────

function getChangedFiles() {
  try {
    const since = new Date(Date.now() - DAYS_BACK * 86400_000).toISOString().slice(0, 10);
    const out = execSync(
      `git log --since="${since}" --name-only --pretty=format: | sort -u`,
      { encoding: "utf8" }
    );
    return out
      .split("\n")
      .map(f => f.trim())
      .filter(f => f && /\.(js|py)$/.test(f) && fs.existsSync(f))
      .filter(f => !f.includes("node_modules") && !f.includes(".next"));
  } catch {
    return [];
  }
}

// ── Bygg kod-block för prompt ──────────────────────────────────────────────

function buildCodeBlock(files) {
  const parts = [];
  let total = 0;
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, "utf8").slice(0, 3000);
      const chunk = `\n### ${f}\n\`\`\`\n${content}\n\`\`\`\n`;
      if (total + chunk.length > MAX_CHARS_TOTAL) break;
      parts.push(chunk);
      total += chunk.length;
    } catch (err) {
      console.warn(`  Kunde inte läsa ${f}: ${err.message}`);
    }
  }
  return parts.join("");
}

// ── Hämta runtime-data från Supabase ──────────────────────────────────────

async function fetchRuntimeData() {
  if (!SUPABASE_KEY) {
    console.log("SUPABASE_ANON_KEY saknas — hoppar över runtime-data");
    return null;
  }
  const since = new Date(Date.now() - DAYS_BACK * 86400_000).toISOString();
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  try {
    const [aiRes, felRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/ai_log?select=provider,status,source&skapad=gte.${since}&limit=2000`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/fel_log?select=kalla,feltyp,meddelande,skapad&skapad=gte.${since}&order=skapad.desc&limit=100`, { headers }),
    ]);
    const aiRows  = aiRes.ok  ? await aiRes.json()  : [];
    const felRows = felRes.ok ? await felRes.json() : [];
    return { aiRows, felRows };
  } catch (e) {
    console.warn("Kunde inte hämta runtime-data:", e.message);
    return null;
  }
}

function buildRuntimeSummary(data) {
  if (!data) return "";
  const { aiRows, felRows } = data;

  const counts = {};
  for (const r of aiRows) {
    const key = `${r.provider}:${r.status}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  const lines = ["=== Runtime-data senaste 7 dagarna ==="];
  const providers = ["groq", "gemini", "codestral", "cerebras", "openrouter", "sambanova"];
  for (const p of providers) {
    const ok    = counts[`${p}:ok`]           || 0;
    const rl    = counts[`${p}:rate_limited`] || 0;
    const err   = counts[`${p}:error`]        || 0;
    const tout  = counts[`${p}:timeout`]      || 0;
    if (ok + rl + err + tout > 0)
      lines.push(`${p}: ${ok} ok, ${rl} rate-limited, ${err} fel, ${tout} timeout`);
  }

  if (felRows.length > 0) {
    lines.push(`\nKritiska fel (fel_log): ${felRows.length} st`);
    for (const r of felRows.slice(0, 5))
      lines.push(`  - [${r.feltyp}] ${r.kalla}: ${r.meddelande || ""}`);
  } else {
    lines.push("\nKritiska fel (fel_log): inga");
  }

  return lines.join("\n");
}

// ── Codestral-analys ───────────────────────────────────────────────────────

async function analyzeWithCodestral(codeBlock, runtimeSummary) {
  const systemPrompt = `Du är en senior kodgranskare för ett Next.js + Python-projekt (debatt.ai).
Du får både källkod och runtime-statistik från produktionsmiljön.
Använd runtime-datan för att prioritera verkliga problem framför hypotetiska.

Svara ENDAST med ett JSON-objekt (inga andra tecken):
{
  "suggestions": [
    {
      "title": "Kort beskrivning (max 10 ord)",
      "type": "bug|perf|ux|security|architecture|duplicate|cleanup",
      "severity": "low|medium|high",
      "file": "relativ/sökväg/till/fil.js",
      "description": "Vad problemet är och varför det är ett problem (2-4 meningar)",
      "proposed_fix": "Konkret förslag på lösning med eventuell pseudokod"
    }
  ]
}

Regler:
- Max 5 förslag per analys — prioritera det viktigaste
- Enbart konkreta, actionable förslag — inga luddiga "förbättra felhantering"
- Ange alltid vilken fil problemet gäller
- Om runtime-data visar återkommande fel, prioritera dessa
- Om du inte hittar något viktigt, returnera suggestions: []`;

  const runtimeSection = runtimeSummary ? `\n\n${runtimeSummary}` : "";
  const userMsg = `Analysera dessa filer från debatt.ai:\n${codeBlock}${runtimeSection}`;

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "codestral-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMsg },
      ],
      max_tokens: 1500,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Codestral HTTP ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Kunde inte tolka Codestral-svar:", raw.slice(0, 300));
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  } catch (e) {
    console.error("JSON-parsning misslyckades:", e.message);
    return [];
  }
}

// ── Skriv suggestion-filer ─────────────────────────────────────────────────

function writeSuggestions(suggestions) {
  const today = new Date().toISOString().slice(0, 10);
  let written = 0;

  for (let i = 0; i < suggestions.length; i++) {
    const s = suggestions[i];
    if (!s.title || !s.description) continue;

    const id   = `${today}-${String(i + 1).padStart(3, "0")}`;
    const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const filename = `${id}-${slug}.md`;
    const filepath = path.join(SUGGESTIONS_DIR, filename);

    const content = `---
id: ${id}
title: "${s.title}"
type: ${s.type || "cleanup"}
severity: ${s.severity || "low"}
file: ${s.file || "okänd"}
status: pending
created: ${today}
---

## Problem

${s.description}

## Föreslagen lösning

${s.proposed_fix || "Se beskrivning ovan."}

## Åtgärd

- [ ] Godkänn: flytta till \`ai-bus/approved/\` eller ändra \`status: approved\`
- [ ] Avvisa: ändra \`status: rejected\` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
`;

    fs.writeFileSync(filepath, content, "utf8");
    written++;
    console.log(`  ✓ ${filename}`);
  }

  return written;
}

// ── Kör ────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error("Fel:", err.message);
  process.exit(1);
});
