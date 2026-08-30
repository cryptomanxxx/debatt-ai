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

  // Parsa senaste benchmark-körning per provider (för providers utan ai_log-anrop)
  const benchByProvider = {};
  {
    const benchRows = arr(benchLogRows);
    if (benchRows.length > 0) {
      const maxKordAt = benchRows.reduce((max, r) => r.kord_at > max ? r.kord_at : max, "");
      const maxMs     = new Date(maxKordAt).getTime();
      const latestRun = benchRows.filter(r => maxMs - new Date(r.kord_at).getTime() < 10 * 60 * 1000);
      for (const r of latestRun) {
        const p = PROVIDER_ALIAS[r.provider] || r.provider;
        if (!benchByProvider[p] || r.kord_at > (benchByProvider[p].kord_at || "")) benchByProvider[p] = r;
      }
    }
  }

  // Bygg fullständig providerlista: rankedOrder + ai_log (24h) + benchmark
  const knownProviders = new Set([...rankedOrder, ...Object.keys(stats24), ...Object.keys(benchByProvider)]);
  const allProviders = [
    ...rankedOrder.filter(p => knownProviders.has(p)),
    ...[...knownProviders].filter(p => !rankedOrder.includes(p)).sort((a, b) => {
      const tA = stats24[a] ? stats24[a].ok + stats24[a].rate_limits + stats24[a].errors : 0;
      const tB = stats24[b] ? stats24[b].ok + stats24[b].rate_limits + stats24[b].errors : 0;
      return tB - tA;
    }),
  ];

  const problemProviders = allProviders.filter(p => {
    const s = stats24[p];
    if (!s) return false;
    const tot = s.ok + s.rate_limits + s.errors;
    return tot >= 3 && (s.rate_limits / tot > 0.30 || s.ok / tot < 0.50);
  });

  // Markdown-tabell — alla kända providers, med benchmark-kolumn för de som inte anropades
  const tableRows = allProviders.map(p => {
    const s   = stats24[p];
    const b   = benchByProvider[p];
    const tot = s ? s.ok + s.rate_limits + s.errors : 0;
    const okPct = tot > 0 ? round((s.ok / tot) * 100, 1) : null;
    const rlPct = tot > 0 ? round((s.rate_limits / tot) * 100, 1) : 0;
    const ms    = s ? avgMs(s.latencies) : null;
    const lamp  = okPct !== null ? trafiklampa(okPct) : "⚪";
    const anropStr = tot > 0 ? `${tot}` : "–";
    const okStr    = tot > 0 ? `${s.ok} (${okPct}%)` : "–";
    const rlStr    = tot > 0 ? `${s.rate_limits} (${rlPct}%)` : "–";
    const errStr   = tot > 0 ? `${s.errors}` : "–";
    const msStr    = ms !== null ? `${ms} ms` : "–";
    let benchStr   = "–";
    if (b && b.totalt > 0) {
      const bOkPct = round(b.lyckade / b.totalt * 100, 1);
      const bMs    = b.snitt_latens_s != null ? `${round(b.snitt_latens_s * 1000)} ms` : "–";
      benchStr = `${bOkPct}% ok · ${bMs}`;
    }
    const inaktivTag = tot === 0 ? " _(ej anropad)_" : "";
    return `| ${lamp} \`${p}\`${inaktivTag} | ${anropStr} | ${okStr} | ${rlStr} | ${errStr} | ${msStr} | ${benchStr} |`;
  }).join("\n");

  // 7-dagars trend — alla kända providers
  const trend7Lines = allProviders
    .map(p => {
      const s   = stats7[p];
      const b   = benchByProvider[p];
      const tot = s ? s.ok + s.rate_limits + s.errors : 0;
      const okPct = tot > 0 ? round((s.ok / tot) * 100, 1) : null;
      if (tot === 0 && !b) return null;
      if (tot === 0) {
        const bOkPct = b && b.totalt > 0 ? round(b.lyckade / b.totalt * 100, 1) : null;
        return `  ⚪ ${p.padEnd(16)} ej anropad (7d)${bOkPct !== null ? `  ·  benchmark: ${bOkPct}% ok` : ""}`;
      }
      return `  ${trafiklampa(okPct)} ${p.padEnd(16)} ${okPct}% ok   (${tot} anrop, ${s.rate_limits} rl, ${s.errors} err)`;
    })
    .filter(Boolean)
    .join("\n");

  // YAML frontmatter per provider
  const provYaml = allProviders.map(p => {
    const s   = stats24[p];
    const tot = s ? s.ok + s.rate_limits + s.errors : 0;
    const ms  = s ? avgMs(s.latencies) : null;
    return `  ${p}:\n    anrop: ${tot}\n    ok: ${s?.ok ?? 0}\n    rate_limits: ${s?.rate_limits ?? 0}\n    errors: ${s?.errors ?? 0}\n    snitt_ms: ${ms ?? "null"}`;
  }).join("\n");

  // LLM-analys via central dynamisk fallback-kedja (app/lib/aiRouter.js,
  // usecase "general") — tidigare hårdkodad mot Cerebras direkt.
  let analys = "";
  if (allProviders.length > 0) {
    console.log("Genererar LLM-analys (dynamisk fallback-kedja)…");
    const summary = allProviders.map(p => {
      const s   = stats24[p];
      const b   = benchByProvider[p];
      const tot = s ? s.ok + s.rate_limits + s.errors : 0;
      const okPct = tot > 0 ? round((s.ok / tot) * 100, 1) : null;
      const ms    = s ? avgMs(s.latencies) : null;
      const benchNote = (tot === 0 && b && b.totalt > 0)
        ? ` [ej anropad — benchmark: ${round(b.lyckade / b.totalt * 100, 1)}% ok]`
        : "";
      return `${p}: ${tot} anrop, ${okPct ?? "–"}% ok, ${s?.rate_limits ?? 0} rate-limits, ${ms ?? "–"} ms${benchNote}`;
    }).join("\n");

    try {
      // aiRouter.js är ESM — dynamisk import() krävs i detta CommonJS-skript.
      const { getDynamicChain, callWithFallback } = await import(
        path.join(__dirname, "..", "app", "lib", "aiRouter.js")
      );
      const chain = await getDynamicChain("general");
      const { text } = await callWithFallback(
        chain,
        [{
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
        { maxTokens: 350, temperature: 0.5, source: "ai-performance-observer" }
      );
      analys = text.trim();
    } catch (e) {
      console.error("LLM-analys misslyckades:", e.message);
    }
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

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
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
