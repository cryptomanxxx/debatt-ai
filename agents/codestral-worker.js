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
const REPORTS_DIR      = path.join(__dirname, "../ai-bus/reports");
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

  let runtimeData = null;
  try {
    runtimeData = await fetchRuntimeData();
    if (runtimeData) console.log("Runtime-data hämtad från Supabase.");
  } catch (e) {
    console.warn("Runtime-data misslyckades — fortsätter utan:", e.message);
  }

  let buildFailures = null;
  try {
    buildFailures = await fetchBuildFailures();
    if (buildFailures !== null)
      console.log(`Build failures hämtade: ${buildFailures.length} st senaste 30 körningarna.`);
  } catch (e) {
    console.warn("Build failures misslyckades — fortsätter utan:", e.message);
  }

  const runtimeSummary = buildRuntimeSummary(runtimeData, buildFailures);

  try {
    const snapshot = saveWeeklySnapshot(runtimeData, buildFailures);
    if (snapshot) console.log(`✓ Veckorapport sparad: ai-bus/reports/${snapshot}`);
  } catch (e) {
    console.warn("Veckorapport misslyckades:", e.message);
  }

  const codeBlock = buildCodeBlock(allFiles);

  let suggestions = [];
  try {
    suggestions = await analyzeWithCodestral(codeBlock, runtimeSummary);
  } catch (e) {
    console.error("Codestral-analys misslyckades:", e.message);
    return;
  }

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
  const h  = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  const SB = SUPABASE_URL;

  async function sb(path) {
    try {
      const r = await fetch(`${SB}/rest/v1/${path}`, { headers: h });
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  const [
    aiRows, felRows, artRows, chattRows,
    opinionRows, betRows, prenRows, beslutRows,
    fragaRows, forslagRows, inlamRows, nyhetsRows,
  ] = await Promise.all([
    sb(`ai_log?select=provider,status,latency_ms,source&skapad=gte.${since}&limit=2000`),
    sb(`fel_log?select=kalla,feltyp,meddelande,skapad&skapad=gte.${since}&order=skapad.desc&limit=100`),
    sb(`artiklar?select=forfattare,parent_id,arg,ori,rel,tro&skapad=gte.${since}&limit=500`),
    sb(`chatt_debatter?select=id,inlagg&skapad=gte.${since}&limit=200`),
    sb(`opinion_roster?select=roster_ja,roster_nej&limit=500`),
    sb(`agent_bets?select=id&skapad=gte.${since}&limit=500`),
    sb(`prenumeranter?select=id&aktiv=eq.true&skapad=gte.${since}&limit=200`),
    sb(`beslut_log?select=ip&skapad=gte.${since}&limit=1000`),
    sb(`agent_fragor?select=id,offentlig&skapad=gte.${since}&limit=500`),
    sb(`amnesforslag?select=id,behandlad&skapad=gte.${since}&limit=200`),
    sb(`inlamningar?select=status&skapad=gte.${since}&limit=300`),
    sb(`nyhetslog?select=antal&skapad=gte.${since}&limit=300`),
  ]);

  return {
    aiRows, felRows, artRows, chattRows,
    opinionRows, betRows, prenRows, beslutRows,
    fragaRows, forslagRows, inlamRows, nyhetsRows,
  };
}

// ── GitHub Actions build failures ─────────────────────────────────────────

async function fetchBuildFailures() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch(
      "https://api.github.com/repos/cryptomanxxx/debatt-ai/actions/runs?per_page=30",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "debatt-ai-codestral-worker",
        },
      }
    );
    if (!r.ok) return null;
    const json = await r.json();
    return (json.workflow_runs || [])
      .filter(run => run.conclusion === "failure" || run.conclusion === "timed_out")
      .map(run => ({
        workflow:   run.name,
        branch:     run.head_branch,
        conclusion: run.conclusion,
        created_at: run.created_at,
        url:        run.html_url,
      }))
      .slice(0, 10);
  } catch {
    return null;
  }
}

// ── Långsammaste endpoints ─────────────────────────────────────────────────

function slowestEndpoints(aiRows) {
  const bySource = {};
  for (const r of aiRows) {
    if (!r.source || !r.latency_ms) continue;
    if (!bySource[r.source]) bySource[r.source] = [];
    bySource[r.source].push(r.latency_ms);
  }
  return Object.entries(bySource)
    .map(([src, lats]) => ({
      source: src,
      count:  lats.length,
      avg:    Math.round(lats.reduce((a, b) => a + b, 0) / lats.length),
      max:    Math.max(...lats),
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);
}

// ── Veckovis metrics-snapshot ──────────────────────────────────────────────

function getISOWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function avg(arr) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
}

function countDir(dir) {
  try { return fs.readdirSync(dir).filter(f => f.endsWith(".md")).length; } catch { return 0; }
}

function saveWeeklySnapshot(data, buildFailures) {
  if (!data) return null;
  const {
    aiRows, felRows, artRows, chattRows,
    opinionRows, betRows, prenRows, beslutRows,
    fragaRows, forslagRows, inlamRows, nyhetsRows,
  } = data;

  // ── AI providers ──
  const providers = ["groq", "gemini", "codestral", "cerebras", "openrouter", "sambanova"];
  const ai_providers = {};
  for (const p of providers) {
    const rows = aiRows.filter(r => r.provider === p);
    if (!rows.length) continue;
    ai_providers[p] = {
      ok:           rows.filter(r => r.status === "ok").length,
      rate_limited: rows.filter(r => r.status === "rate_limited").length,
      error:        rows.filter(r => r.status === "error").length,
      timeout:      rows.filter(r => r.status === "timeout").length,
      avg_latency_ms: avg(rows.filter(r => r.latency_ms).map(r => r.latency_ms)),
    };
  }

  // ── Artiklar ──
  const repliker    = artRows.filter(r => r.parent_id).length;
  const originala   = artRows.length - repliker;
  const scores      = artRows.map(r => ((r.arg||0)+(r.ori||0)+(r.rel||0)+(r.tro||0))/4).filter(s => s > 0);
  const agentCount  = {};
  for (const r of artRows) agentCount[r.forfattare] = (agentCount[r.forfattare] || 0) + 1;
  const topAgent    = Object.entries(agentCount).sort((a,b) => b[1]-a[1])[0] || null;

  // ── Direktdebatter ──
  const debattLangder = chattRows.map(r => {
    try { return Array.isArray(r.inlagg) ? r.inlagg.length : JSON.parse(r.inlagg || "[]").length; } catch { return 0; }
  }).filter(n => n > 0);

  // ── Opinion ──
  const opinionTotalJa  = opinionRows.reduce((s, r) => s + (r.roster_ja  || 0), 0);
  const opinionTotalNej = opinionRows.reduce((s, r) => s + (r.roster_nej || 0), 0);

  // ── Nyhetslogg ──
  const nyhetsKorningar = nyhetsRows.length;
  const nyhetsAntal     = nyhetsRows.map(r => r.antal || 0).filter(n => n > 0);

  // ── Inlämningar ──
  const humanPubl = inlamRows.filter(r => r.status === "publicerad").length;
  const humanAvv  = inlamRows.filter(r => r.status === "avvisad").length;

  // ── Delta mot förra veckan ──
  const week     = getISOWeek();
  const filename = `${week}.json`;
  const filepath = path.join(REPORTS_DIR, filename);
  let prevSnapshot = null;
  try {
    const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith(".json")).sort();
    if (files.length > 0 && files[files.length - 1] !== filename)
      prevSnapshot = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, files[files.length - 1]), "utf8"));
  } catch {}

  const totalRateLimited = Object.values(ai_providers).reduce((s, p) => s + (p.rate_limited || 0), 0);
  const prev = prevSnapshot || {};

  const snapshot = {
    week,
    generated: new Date().toISOString(),

    ai_providers,

    plattform: {
      artiklar_publicerade:  artRows.length,
      artiklar_originala:    originala,
      artiklar_repliker:     repliker,
      replik_ratio_pct:      artRows.length ? Math.round(repliker / artRows.length * 100) : 0,
      genomsnittlig_score:   avg(scores),
      mest_aktiv_agent:      topAgent ? { agent: topAgent[0], antal: topAgent[1] } : null,

      direktdebatter:        chattRows.length,
      avg_debatt_langd:      avg(debattLangder),

      nyhetskanal_korningar:       nyhetsKorningar,
      nyheter_utvärderade_snitt:   avg(nyhetsAntal),

      opinion_roster_ja:     opinionTotalJa,
      opinion_roster_nej:    opinionTotalNej,

      prediction_bets:       betRows.length,
      nya_prenumeranter:     prenRows.length,
      api_anrop:             beslutRows.length,
      api_unika_anvandare:   new Set(beslutRows.map(r => r.ip).filter(Boolean)).size,
      agent_fragor:          fragaRows.length,
      agent_fragor_offentliga: fragaRows.filter(r => r.offentlig).length,
      amnesforslag:          forslagRows.length,

      inlamningar_publicerade: humanPubl,
      inlamningar_avvisade:    humanAvv,
    },

    kritiska_fel: felRows.length,

    slowest_endpoints: slowestEndpoints(aiRows),

    build_failures: buildFailures
      ? { count: buildFailures.length, senaste: buildFailures.slice(0, 3) }
      : null,

    ai_bus: {
      pending:     countDir(path.join(__dirname, "../ai-bus/suggestions")),
      implemented: countDir(path.join(__dirname, "../ai-bus/implemented")),
      rejected:    countDir(path.join(__dirname, "../ai-bus/rejected")),
    },

    vs_prev_week: prevSnapshot ? {
      rate_limited_delta:     totalRateLimited - Object.values(prev.ai_providers || {}).reduce((s,p) => s+(p.rate_limited||0), 0),
      kritiska_fel_delta:     felRows.length         - (prev.kritiska_fel || 0),
      artiklar_delta:         artRows.length         - (prev.plattform?.artiklar_publicerade || 0),
      direktdebatter_delta:   chattRows.length       - (prev.plattform?.direktdebatter || 0),
      prenumeranter_delta:    prenRows.length        - (prev.plattform?.nya_prenumeranter || 0),
      api_anrop_delta:        beslutRows.length      - (prev.plattform?.api_anrop || 0),
      agent_fragor_delta:     fragaRows.length       - (prev.plattform?.agent_fragor || 0),
    } : null,
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), "utf8");
  return filename;
}

// ── Weekly digest för Codestral-prompten ─────────────────────────────────

function buildRuntimeSummary(data, buildFailures) {
  if (!data) return "";
  const { aiRows, felRows, artRows, chattRows, beslutRows, fragaRows, nyhetsRows, prenRows } = data;

  const week = getISOWeek();
  const lines = [`# Weekly Digest ${week} — debatt.ai`];

  // ── AI-providers ──
  lines.push("\n## AI-providers (senaste 7 dagarna)");
  lines.push("| Provider | OK | Rate-limited | Fel | Snitt-latens |");
  lines.push("|---|---|---|---|---|");
  const providers = ["groq", "gemini", "codestral", "cerebras", "openrouter", "sambanova"];
  for (const p of providers) {
    const rows = aiRows.filter(r => r.provider === p);
    if (!rows.length) continue;
    const ok  = rows.filter(r => r.status === "ok").length;
    const rl  = rows.filter(r => r.status === "rate_limited").length;
    const err = rows.filter(r => r.status === "error").length;
    const lats = rows.filter(r => r.latency_ms).map(r => r.latency_ms);
    const lat = lats.length ? `${Math.round(lats.reduce((a,b)=>a+b,0)/lats.length)}ms` : "–";
    lines.push(`| ${p} | ${ok} | ${rl} | ${err} | ${lat} |`);
  }

  // ── Top problem: rate limits ──
  const topRL = providers
    .map(p => ({ p, n: aiRows.filter(r => r.provider === p && r.status === "rate_limited").length }))
    .filter(x => x.n > 0)
    .sort((a,b) => b.n - a.n);
  if (topRL.length) {
    lines.push(`\n**Mest rate-limitad:** ${topRL[0].p} (${topRL[0].n} gånger)`);
  }

  // ── Långsammaste endpoints ──
  const endpoints = slowestEndpoints(aiRows);
  if (endpoints.length) {
    lines.push("\n## Långsammaste endpoints (snitt-latens)");
    lines.push("| Källa | Anrop | Snitt | Max |");
    lines.push("|---|---|---|---|");
    for (const e of endpoints)
      lines.push(`| ${e.source} | ${e.count} | ${e.avg}ms | ${e.max}ms |`);
  }

  // ── Build failures ──
  lines.push("\n## GitHub Actions build failures (senaste 30 körningar)");
  if (buildFailures === null) {
    lines.push("GITHUB_TOKEN saknas — data ej tillgänglig.");
  } else if (buildFailures.length === 0) {
    lines.push("Inga build failures. ✓");
  } else {
    lines.push(`${buildFailures.length} misslyckade körningar:`);
    for (const f of buildFailures.slice(0, 5))
      lines.push(`- **${f.workflow}** (${f.branch}) — ${f.conclusion} — ${f.created_at?.slice(0, 10)}`);
  }

  // ── Kritiska fel ──
  lines.push("\n## Kritiska fel (fel_log)");
  if (felRows.length === 0) {
    lines.push("Inga kritiska fel denna vecka. ✓");
  } else {
    lines.push(`${felRows.length} kritiska fel:`);
    for (const r of felRows.slice(0, 5))
      lines.push(`- [${r.feltyp}] ${r.kalla}: ${r.meddelande || ""}`);
  }

  // ── Plattform ──
  const repliker = artRows.filter(r => r.parent_id).length;
  const scores = artRows.map(r => ((r.arg||0)+(r.ori||0)+(r.rel||0)+(r.tro||0))/4).filter(s=>s>0);
  const avgScore = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : "–";
  lines.push("\n## Plattformsstatistik");
  lines.push(`- Artiklar: ${artRows.length} (${repliker} repliker, ${artRows.length-repliker} originala), snittpoäng ${avgScore}/10`);
  lines.push(`- Direktdebatter: ${chattRows.length}`);
  lines.push(`- Nyhetskanal-körningar: ${nyhetsRows.length}`);
  lines.push(`- Nya prenumeranter: ${prenRows.length}`);
  lines.push(`- API-anrop (beslut): ${beslutRows.length}`);
  lines.push(`- Agent-frågor: ${fragaRows.length}`);

  return lines.join("\n");
}

// ── Codestral-analys ───────────────────────────────────────────────────────

async function analyzeWithCodestral(codeBlock, runtimeSummary) {
  const systemPrompt = `Du är en senior kodgranskare för ett Next.js + Python-projekt (debatt.ai).
Du får både källkod och runtime-statistik från produktionsmiljön.
Använd runtime-datan för att prioritera verkliga problem framför hypotetiska.

Projektets faktiska filer (ange ENBART dessa i "file"-fältet):
Python: agent.py, agenter.py, ai_klient.py, artikel.py, nyheter.py, supabase_utils.py, kanal_debatt.py, backtest.py, backtest_fetch.py, data_agent.py
JS API-routes: app/api/agent/submit/route.js, app/api/chatt/route.js, app/api/beslut/route.js, app/api/agent-fraga/route.js, app/api/opinion-stats/route.js, app/api/youtube-transcript/route.js
JS övrigt: app/admin/client.js, app/agentData.js, agents/codestral-worker.js

Svara ENDAST med ett JSON-objekt (inga andra tecken):
{
  "suggestions": [
    {
      "title": "Kort beskrivning (max 10 ord)",
      "type": "bug|perf|ux|security|architecture|duplicate|cleanup",
      "severity": "low|medium|high",
      "risk": "low|medium|high",
      "file": "relativ/sökväg/till/fil.js",
      "description": "Vad problemet är och varför det är ett problem (2-4 meningar)",
      "proposed_fix": "Konkret förslag på lösning med eventuell pseudokod"
    }
  ]
}

Regler:
- Max 5 förslag per analys — prioritera det viktigaste
- Enbart konkreta, actionable förslag — inga luddiga "förbättra felhantering"
- Ange ALLTID en fil från listan ovan — hitta aldrig på filnamn
- Om runtime-data visar återkommande fel, prioritera dessa
- risk = konsekvens om förändringen implementeras fel (low=säkert ändra, medium=testa noga, high=kräver manuell verifiering)
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
risk: ${s.risk || "low"}
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
