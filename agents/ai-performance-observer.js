#!/usr/bin/env node
/**
 * ai-performance-observer.js
 *
 * Hämtar AI-provider-statistik från ai_log i Supabase och skriver
 * en daglig prestandarapport till ai-bus/discussions/.
 *
 * Körs av GitHub Actions (ai-performance-observer.yml) eller manuellt:
 *   SUPABASE_ANON_KEY=xxx node agents/ai-performance-observer.js
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");

const SB_KEY       = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY;
const SB_URL       = "https://fmwxftnistkoqazfwnuj.supabase.co";
const DISCUSSIONS  = path.join(__dirname, "../ai-bus/discussions");
const PERF_DIR     = path.join(DISCUSSIONS, "ai-performance");

// Räkna konfigurerade Groq-nycklar
const GROQ_KEY_NAMES = ["GROQ_API_KEY", ...Array.from({length: 11}, (_, i) => `GROQ_API_KEY_${i + 2}`)];
const groqKeys = GROQ_KEY_NAMES.filter(n => process.env[n]);
const groqKeyCount = groqKeys.length;
const GROQ_KANAL_CONFIGURED = !!process.env.GROQ_KANAL_API_KEY;

if (!SB_KEY) { console.error("SUPABASE_ANON_KEY saknas"); process.exit(1); }

function dagensDatum() {
  return new Date().toISOString().slice(0, 10);
}
function tidsstämpel() {
  return new Date().toISOString().slice(11, 16).replace(":", "");
}

// Idempotenscheck — en rapport per dag
const datum = dagensDatum();
try {
  const existing = fs.existsSync(PERF_DIR) && fs.readdirSync(PERF_DIR).find(
    f => f.startsWith(datum) && f.endsWith("-ai-performance.md")
  );
  if (existing) {
    console.log(`Rapport finns redan: ${existing} — hoppar över.`);
    process.exit(0);
  }
} catch {}

function httpGet(host, pathStr, headers) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: host, path: pathStr, method: "GET", headers },
      (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve([]); } });
      }
    );
    req.on("error", () => resolve([]));
    req.setTimeout(15000, () => { req.destroy(); resolve([]); });
    req.end();
  });
}

function httpPost(urlStr, headers, body) {
  return new Promise((resolve) => {
    const u = new URL(urlStr);
    const bodyStr = JSON.stringify(body);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: "POST",
        headers: { ...headers, "Content-Length": Buffer.byteLength(bodyStr) },
      },
      (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
      }
    );
    req.on("error", () => resolve(null));
    req.setTimeout(30000, () => { req.destroy(); resolve(null); });
    req.write(bodyStr);
    req.end();
  });
}

function sb(table, query = "") {
  return httpGet(
    "fmwxftnistkoqazfwnuj.supabase.co",
    `/rest/v1/${table}?${query}`,
    { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Accept: "application/json" }
  );
}

function arr(v) { return Array.isArray(v) ? v : []; }
function round(n, dec = 0) { return Math.round(n * 10 ** dec) / 10 ** dec; }

const RATE_LIMIT_STATUSES = new Set(["rate_limited", "rate_limit", "error_429"]);
const ERROR_STATUSES      = new Set(["error", "parse_fail", "all_failed"]);

// JS-sidan loggar "codestral" och "github", Python-sidan loggar "mistral" och "github_models".
// Normalisera till benchmarkens namnkonvention så att de slås ihop i rapporten.
const PROVIDER_ALIAS = { codestral: "mistral", github: "github_models" };

function agg(rows) {
  const stats = {};
  for (const row of rows) {
    const raw = row.provider || "unknown";
    const p   = PROVIDER_ALIAS[raw] || raw;
    if (!stats[p]) stats[p] = { ok: 0, rate_limits: 0, errors: 0, latencies: [] };
    if (row.status === "ok") {
      stats[p].ok++;
      if (row.latency_ms != null) stats[p].latencies.push(row.latency_ms);
    } else if (RATE_LIMIT_STATUSES.has(row.status)) {
      stats[p].rate_limits++;
    } else if (ERROR_STATUSES.has(row.status)) {
      stats[p].errors++;
    }
  }
  return stats;
}

function healthScore(stats) {
  let ok = 0, total = 0;
  for (const s of Object.values(stats)) {
    total += s.ok + s.rate_limits + s.errors;
    ok    += s.ok;
  }
  return total === 0 ? 100 : round((ok / total) * 100, 1);
}

function avgMs(latencies) {
  if (!latencies.length) return null;
  return round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
}

function trafiklampa(okPct) {
  if (okPct >= 80) return "🟢";
  if (okPct >= 50) return "🟡";
  return "🔴";
}

async function main() {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const since7d  = new Date(Date.now() -  7 * 24 * 3600 * 1000).toISOString();

  console.log("Hämtar data från Supabase…");
  const [log24h, log7d, configRows, benchLogRows] = await Promise.all([
    sb("ai_log", `ts=gte.${since24h}&select=provider,status,latency_ms&limit=5000`),
    sb("ai_log", `ts=gte.${since7d}&select=provider,status&limit=20000`),
    sb("provider_config", "id=eq.current&select=ranked_order,uppdaterad"),
    sb("provider_benchmark_log", "select=provider,lyckade,totalt,snitt_latens_s,kord_at&order=kord_at.desc&limit=200"),
  ]);

  const rows24 = arr(log24h);
  const rows7  = arr(log7d);
  const stats24 = agg(rows24);
  const stats7  = agg(rows7);
  const configRow     = arr(configRows)[0] || {};
  let   rankedOrder   = Array.isArray(configRow.ranked_order) ? configRow.ranked_order : [];
  const configUpdated = (configRow.uppdaterad || "").slice(0, 16).replace("T", " ");
  let   orderSource   = "provider_config";

  // Fallback: om provider_config är tom, rekonstruera ordningen från senaste benchmark-körning
  if (rankedOrder.length === 0) {
    const benchRows = arr(benchLogRows);
    if (benchRows.length > 0) {
      // Använd bara rader från senaste körnings-fönstret (inom 10 min av senaste kord_at)
      // för att undvika att blanda stale data från äldre delvisa körningar
      const maxKordAt = benchRows.reduce((max, r) => r.kord_at > max ? r.kord_at : max, "");
      const maxMs     = new Date(maxKordAt).getTime();
      const latestRun = benchRows.filter(r => maxMs - new Date(r.kord_at).getTime() < 10 * 60 * 1000);

      // Deduplicera per provider (ta senaste raden inom fönstret)
      const byProvider = {};
      for (const r of latestRun) {
        const p = PROVIDER_ALIAS[r.provider] || r.provider;
        if (!byProvider[p] || r.kord_at > byProvider[p].kord_at) byProvider[p] = r;
      }

      // Produktion-viktad formel — matchar benchmark:s spara_och_kalibrera():
      //   prod_ok * 70 + bench_ok * 30 − latens_s * 2   (prod_ok och bench_ok är 0–1 fraktioner)
      // Om 7d-produktionsdata finns används den; annars bench-only.
      rankedOrder = Object.entries(byProvider)
        .sort(([pa, a], [pb, b]) => {
          const prodA = stats7[pa] || {};
          const prodB = stats7[pb] || {};
          const totA  = (prodA.ok || 0) + (prodA.rate_limits || 0) + (prodA.errors || 0);
          const totB  = (prodB.ok || 0) + (prodB.rate_limits || 0) + (prodB.errors || 0);
          const pOkA  = totA >= 10 ? prodA.ok / totA : -1;
          const pOkB  = totB >= 10 ? prodB.ok / totB : -1;
          const bOkA  = a.totalt > 0 ? a.lyckade / a.totalt : -1;
          const bOkB  = b.totalt > 0 ? b.lyckade / b.totalt : -1;
          const latA  = a.snitt_latens_s || 0;
          const latB  = b.snitt_latens_s || 0;

          const scoreA = pOkA >= 0 && bOkA >= 0 ? pOkA * 70 + bOkA * 30 - latA * 2
                       : pOkA >= 0              ? pOkA * 70              - latA * 2
                       : bOkA >= 0              ? bOkA * 100             - latA * 2
                       : -999;
          const scoreB = pOkB >= 0 && bOkB >= 0 ? pOkB * 70 + bOkB * 30 - latB * 2
                       : pOkB >= 0              ? pOkB * 70              - latB * 2
                       : bOkB >= 0              ? bOkB * 100             - latB * 2
                       : -999;
          return scoreB - scoreA;
        })
        .map(([p]) => p);

      if (rankedOrder.length > 0) {
        orderSource = "provider_benchmark_log";
        console.log(`  ℹ️  provider_config tom — fallback från provider_benchmark_log: ${rankedOrder.join(" → ")}`);
      }
    }
  }

  const health24 = healthScore(stats24);
  const health7  = healthScore(stats7);

  // Sortera providers efter totalt anropsvolym
  const providers24 = Object.entries(stats24).sort((a, b) => {
    const tA = a[1].ok + a[1].rate_limits + a[1].errors;
    const tB = b[1].ok + b[1].rate_limits + b[1].errors;
    return tB - tA;
  });

  const problemProviders = providers24.filter(([, s]) => {
    const tot = s.ok + s.rate_limits + s.errors;
    return tot >= 3 && (s.rate_limits / tot > 0.30 || s.ok / tot < 0.50);
  }).map(([p]) => p);

  // Markdown-tabell
  const tableRows = providers24.map(([p, s]) => {
    const tot   = s.ok + s.rate_limits + s.errors;
    const okPct = tot > 0 ? round((s.ok / tot) * 100, 1) : 0;
    const rlPct = tot > 0 ? round((s.rate_limits / tot) * 100, 1) : 0;
    const ms    = avgMs(s.latencies);
    return `| ${trafiklampa(okPct)} \`${p}\` | ${tot} | ${s.ok} (${okPct}%) | ${s.rate_limits} (${rlPct}%) | ${s.errors} | ${ms != null ? ms + " ms" : "–"} |`;
  }).join("\n");

  // 7-dagars trend
  const trend7Lines = Object.entries(stats7)
    .sort((a, b) => {
      const tA = a[1].ok + a[1].rate_limits + a[1].errors;
      const tB = b[1].ok + b[1].rate_limits + b[1].errors;
      return tB - tA;
    })
    .map(([p, s]) => {
      const tot   = s.ok + s.rate_limits + s.errors;
      const okPct = tot > 0 ? round((s.ok / tot) * 100, 1) : 0;
      return `  ${trafiklampa(okPct)} ${p.padEnd(16)} ${okPct}% ok   (${tot} anrop, ${s.rate_limits} rl, ${s.errors} err)`;
    }).join("\n");

  // YAML frontmatter per provider
  const provYaml = providers24.map(([p, s]) => {
    const tot = s.ok + s.rate_limits + s.errors;
    const ms  = avgMs(s.latencies);
    return `  ${p}:\n    anrop: ${tot}\n    ok: ${s.ok}\n    rate_limits: ${s.rate_limits}\n    errors: ${s.errors}\n    snitt_ms: ${ms ?? "null"}`;
  }).join("\n");

  // Cerebras-analys (körs bara om nyckel finns)
  let analys = "";
  if (CEREBRAS_KEY && providers24.length > 0) {
    console.log("Genererar LLM-analys med Cerebras…");
    const summary = providers24.map(([p, s]) => {
      const tot   = s.ok + s.rate_limits + s.errors;
      const okPct = tot > 0 ? round((s.ok / tot) * 100, 1) : 0;
      const ms    = avgMs(s.latencies);
      return `${p}: ${tot} anrop, ${okPct}% ok, ${s.rate_limits} rate-limits, ${ms ?? "–"} ms`;
    }).join("\n");

    const result = await httpPost(
      "https://api.cerebras.ai/v1/chat/completions",
      { Authorization: `Bearer ${CEREBRAS_KEY}`, "Content-Type": "application/json" },
      {
        model: "gpt-oss-120b",
        max_tokens: 350,
        temperature: 0.5,
        messages: [{
          role: "user",
          content: `Du är en teknisk systemobservatör för AI-plattformen debatt-ai.se.
Skriv 3-4 meningar på svenska om AI-provider-prestandan senaste 24h.
Var konkret — nämn providers vid namn. Avsluta med en prioriterad rekommendation.

Hälsopoäng 24h: ${health24}% | 7d: ${health7}%
Totala anrop 24h: ${rows24.length}
Groq-nycklar: ${groqKeyCount} st konfigurerade + ${GROQ_KANAL_CONFIGURED ? "1 kanal-nyckel" : "ingen kanal-nyckel"} (OBS: TPD-kvoten ~144k gäller sannolikt per Groq-konto, inte per nyckel — ingen garanterad linjär kapacitetsökning)
Fallback-ordning: ${rankedOrder.join(" → ")}
Problemleverantörer (>30% rl eller <50% ok): ${problemProviders.join(", ") || "inga"}

Per provider:
${summary}`,
        }],
      }
    );
    analys = result?.choices?.[0]?.message?.content?.trim() || "";
  }

  // Groq nyckelrad för YAML och markdown — TPD-kvoten gäller sannolikt per konto, inte per nyckel
  const groqPoolLine = `groq_nycklar_konfigurerade: ${groqKeyCount}${GROQ_KANAL_CONFIGURED ? " + kanal-nyckel" : ""}`;
  const groqStats24 = stats24["groq"] || { ok: 0, rate_limits: 0, errors: 0, latencies: [] };
  const groqTot24   = groqStats24.ok + groqStats24.rate_limits + groqStats24.errors;
  const groqOkPct   = groqTot24 > 0 ? round((groqStats24.ok / groqTot24) * 100, 1) : 100;
  const groqRlPct   = groqTot24 > 0 ? round((groqStats24.rate_limits / groqTot24) * 100, 1) : 0;

  // Bygg rapporten
  const filename = `${datum}-${tidsstämpel()}-ai-performance.md`;
  const content = `---
date: ${datum}
type: ai-performance
overall_health_24h: ${health24}
overall_health_7d: ${health7}
total_calls_24h: ${rows24.length}
total_calls_7d: ${rows7.length}
${groqPoolLine}
problem_providers: [${problemProviders.map(p => `"${p}"`).join(", ")}]
ranked_order: [${rankedOrder.map(p => `"${p}"`).join(", ")}]
config_uppdaterad: "${configUpdated} UTC"
order_source: "${orderSource}"
providers_24h:
${provYaml}
---

# AI Provider Performance — ${datum}

## Hälsostatus

${trafiklampa(health24)} **${health24}%** lyckade anrop senaste 24h · ${rows24.length} anrop totalt
${trafiklampa(health7)} **${health7}%** lyckade anrop senaste 7 dagar · ${rows7.length} anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **${groqKeyCount}** | ${GROQ_KANAL_CONFIGURED ? "✅ konfigurerad" : "❌ saknas"} | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** ${groqTot24} anrop · ${groqStats24.ok} (${groqOkPct}%) OK · ${groqStats24.rate_limits} (${groqRlPct}%) rate-limits · ${groqStats24.errors} fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
${tableRows}

## Nuvarande Fallback-ordning

\`${rankedOrder.length > 0 ? rankedOrder.join(" → ") : "Okänd — ingen benchmarkdata tillgänglig"}\`

*(${orderSource === "provider_benchmark_log" ? "Rekonstruerad från provider_benchmark_log" : `Benchmark senast körde: ${configUpdated} UTC`})*

## 7-Dagars Trend

\`\`\`
${trend7Lines}
\`\`\`
${problemProviders.length > 0 ? `
## ⚠️ Problemleverantörer

${problemProviders.map(p => {
  const s = stats24[p];
  const tot = s.ok + s.rate_limits + s.errors;
  const okPct = round((s.ok / tot) * 100, 1);
  return `- **\`${p}\`**: ${s.ok}/${tot} ok (${okPct}%), ${s.rate_limits} rate-limits, ${s.errors} errors`;
}).join("\n")}
` : `
## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.
`}${analys ? `
## Analys

${analys}
` : ""}`;

  if (!fs.existsSync(PERF_DIR)) fs.mkdirSync(PERF_DIR, { recursive: true });
  fs.writeFileSync(path.join(PERF_DIR, filename), content);
  console.log(`✅ Rapport skriven: ai-bus/discussions/ai-performance/${filename}`);
}

main().catch(err => { console.error(err); process.exit(1); });
