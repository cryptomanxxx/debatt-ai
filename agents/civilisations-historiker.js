#!/usr/bin/env node
/**
 * civilisations-historiker.js
 *
 * En autonom kronist som varje vecka läser AI-civilisationens händelseloggar
 * och skriver en historisk krönika. Publicerar som en artikel på plattformen
 * via /api/agent/submit och sparar en kopia till ai-bus/discussions/.
 *
 * Körs varje söndag 20:00 svensk tid (18:00 UTC) via civilisations-historiker.yml
 * eller manuellt:
 *   GROQ_API_KEY=xxx SUPABASE_ANON_KEY=xxx DEBATT_API_KEY=xxx \
 *   node agents/civilisations-historiker.js
 *
 * LLM-anrop går via den centrala dynamiska fallback-kedjan (app/lib/aiRouter.js,
 * usecase "general") — inte hårdkodat mot en enskild provider.
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");

const SUPABASE_URL     = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SUPABASE_KEY     = process.env.SUPABASE_ANON_KEY;
const DEBATT_API_KEY   = process.env.DEBATT_API_KEY;
const DEBATT_SITE_URL  = process.env.DEBATT_SITE_URL || "https://www.debatt-ai.se";
const DISCUSSIONS_DIR  = path.join(__dirname, "../ai-bus/discussions");
const KRONIKA_DIR      = path.join(DISCUSSIONS_DIR, "kronika");

// ── Hjälpfunktioner ────────────────────────────────────────────────────────

function httpJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   opts.method || "GET",
      headers:  opts.headers || {},
    };
    const body = opts.body ? Buffer.from(opts.body) : null;
    if (body) options.headers["Content-Length"] = body.length;
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on("error", reject);
    req.setTimeout(40000, () => { req.destroy(); reject(new Error("timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

async function sb(table, params = "") {
  if (!SUPABASE_KEY) return [];
  try {
    const { status, data } = await httpJson(
      `${SUPABASE_URL}/rest/v1/${table}?${params}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (status === 200 && Array.isArray(data)) return data;
    console.warn(`[sb] ${table}: oväntat svar (status ${status}) — returnerar tom lista`);
    return [];
  } catch (e) {
    console.warn(`[sb] ${table}: anrop misslyckades (${e?.message || e}) — returnerar tom lista`);
    return [];
  }
}

function isoVecka() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const start = new Date(d.getFullYear(), 0, 1);
  const nr = Math.ceil((((d - start) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(nr).padStart(2, "0")}`;
}

// ── Datahämtning ───────────────────────────────────────────────────────────

async function hämtaCivilisationsData() {
  const sjuDagarSen = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    minnen,
    domar,
    kriser,
    val,
    partier,
    planbocker,
    koalitioner,
    lobbying,
    roster,
    borsaffarer,
    artiklar,
    strat_nav,
    quant_nav,
    revert_nav,
  ] = await Promise.all([
    sb("civilisations_minne", `select=typ,rubrik,beskrivning,agenter,skapad&skapad=gte.${sjuDagarSen}&order=skapad.desc&limit=25`),
    sb("domstol_domar",       `select=utfall,straff_belopp,skapad,domstol_arenden(arende_nr,svarande,artikel_nr,beskrivning)&skapad=gte.${sjuDagarSen}&order=skapad.desc&limit=10`),
    sb("kris_events",         `select=rubrik,typ,intensitet,beskrivning,paverkade_agenter,startat,slutar,aktiv&order=startat.desc&limit=5`),
    sb("riksdagsval",         `select=status,vinnare_parti,vinnare_ledare,avgjord&order=skapad.desc&limit=3`),
    sb("politiska_partier",   `select=namn,ledare,styrka,aktiv&aktiv=eq.true&order=styrka.desc`),
    sb("agent_planbocker",    `select=agent,saldo&order=saldo.desc&limit=24`),
    sb("agent_koalitioner",   `select=agent_a,agent_b,styrka,antal_utbyten&skapad=gte.${sjuDagarSen}&order=styrka.desc&limit=10`),
    sb("lobbying_log",        `select=lobbying_agent,mal_agent,belopp,resultat,argument,skapad&skapad=gte.${sjuDagarSen}&order=skapad.desc&limit=10`),
    sb("agent_roster_lag",    `select=agent,rod,skapad&skapad=gte.${sjuDagarSen}&limit=150`),
    sb("bors_affarer",        `select=symbol,kop_agent,salj_agent,pris,antal,skapad&skapad=gte.${sjuDagarSen}&order=skapad.desc&limit=30`),
    sb("artiklar",            `select=rubrik,forfattare,taggar,skapad&skapad=gte.${sjuDagarSen}&kalla=eq.ai&order=lasningar.desc&limit=10`),
    sb("strat_paper_nav",     `select=portfölj_värde_usd,start_kapital_usd,aktiv_symbol,signal,btc_benchmark_usd,spy_benchmark_usd,skapad&order=skapad.desc&limit=8`),
    sb("quant_paper_nav",     `select=portfölj_värde_usd,start_kapital_usd,btc_benchmark_usd,spy_benchmark_usd,quant_motivering,skapad&order=skapad.desc&limit=8`),
    sb("revert_paper_nav",    `select=portfölj_värde_usd,start_kapital_usd,btc_benchmark_usd,signal,skapad&order=skapad.desc&limit=8`),
  ]);

  return { minnen, domar, kriser, val, partier, planbocker, koalitioner, lobbying, roster, borsaffarer, artiklar, strat_nav, quant_nav, revert_nav };
}

// ── Dataformaterare ────────────────────────────────────────────────────────

function sammanfattaData(d) {
  const rader = [];

  // Ekonomisk makt
  if (d.planbocker.length > 0) {
    const topp3 = d.planbocker.slice(0, 3).map(a => `${a.agent} (${Math.round(a.saldo)} kr)`).join(", ");
    const botten = d.planbocker[d.planbocker.length - 1];
    const total  = Math.round(d.planbocker.reduce((s, a) => s + (a.saldo || 0), 0));
    rader.push(`EKONOMI: Rikaste: ${topp3}. Fattigaste: ${botten.agent} (${Math.round(botten.saldo)} kr). Total förmögenhet i cirkulationen: ${total} kr.`);
  }

  // Partier
  if (d.partier.length > 0) {
    const ps = d.partier.map(p => `${p.namn} (ledare: ${p.ledare}, styrka: ${p.styrka})`).join("; ");
    rader.push(`POLITISKA PARTIER (aktiva): ${ps}.`);
  }

  // Parlamentsröster
  if (d.roster.length > 0) {
    const ja  = d.roster.filter(r => r.rod === "ja").length;
    const nej = d.roster.filter(r => r.rod === "nej").length;
    const avst = d.roster.filter(r => r.rod === "avstar").length;
    rader.push(`PARLAMENTSRÖSTER denna vecka: ${ja} ja, ${nej} nej, ${avst} avstår. Totalt ${d.roster.length} röster.`);
  }

  // Lobbying
  if (d.lobbying.length > 0) {
    const lyckad   = d.lobbying.filter(l => l.resultat === "accepterat").length;
    const misslyck = d.lobbying.length - lyckad;
    const exempel  = d.lobbying.slice(0, 3)
      .map(l => `${l.lobbying_agent} → ${l.mal_agent} (${l.belopp} kr, ${l.resultat})`)
      .join("; ");
    rader.push(`LOBBYING: ${lyckad} lyckade av ${d.lobbying.length} försök (${misslyck} misslyckade). Exempel: ${exempel}.`);
  }

  // Nya koalitioner
  if (d.koalitioner.length > 0) {
    const starkast = d.koalitioner[0];
    rader.push(`NYA KOALITIONER: ${d.koalitioner.length} nya allianser. Starkast ny: ${starkast.agent_a} ↔ ${starkast.agent_b} (styrka ${starkast.styrka}).`);
  }

  // Domstolsdomar
  if (d.domar.length > 0) {
    const fällda = d.domar.filter(x => x.utfall === "fälld");
    const friats = d.domar.filter(x => x.utfall !== "fälld");
    if (fällda.length > 0) {
      rader.push(`DOMSTOL: ${fällda.length} fälldes. ${fällda.map(x => `${x.domstol_arenden?.svarande || "?"} (böter ${x.straff_belopp || 0} kr, §${x.domstol_arenden?.artikel_nr || "?"})`).join(", ")}. ${friats.length} frikändes.`);
    } else {
      rader.push(`DOMSTOL: ${d.domar.length} ärenden handlagda — alla frikändes.`);
    }
  }

  // Aktiv kris
  const aktivKris = d.kriser.find(k => k.aktiv);
  if (aktivKris) {
    rader.push(`AKTIV KRIS: "${aktivKris.rubrik}" (intensitet ${aktivKris.intensitet}/3). Berörda agenter: ${(aktivKris.paverkade_agenter || []).join(", ")}.`);
  }

  // Riksdagsval
  const senastVal = d.val[0];
  if (senastVal?.status === "avgjort" && senastVal.vinnare_parti) {
    rader.push(`VAL AVGJORT: ${senastVal.vinnare_parti} vann senaste riksdagsvalet.`);
  } else if (senastVal?.status === "aktiv") {
    rader.push(`PÅGÅENDE VAL: Riksdagsval pågår just nu — partierna kampanjar.`);
  }

  // Börshandel
  if (d.borsaffarer.length > 0) {
    const symCount = {};
    d.borsaffarer.forEach(a => { symCount[a.symbol] = (symCount[a.symbol] || 0) + 1; });
    const topp = Object.entries(symCount).sort((a, b) => b[1] - a[1])
      .map(([s, n]) => `${s}: ${n} affärer`).join(", ");
    rader.push(`BÖRSEN: ${d.borsaffarer.length} affärer totalt. ${topp}.`);
  }

  // STRAT paper trading
  if (d.strat_nav && d.strat_nav.length > 0) {
    const sen = d.strat_nav[0];
    const äld = d.strat_nav[d.strat_nav.length - 1];
    const pv  = parseFloat(sen.portfölj_värde_usd);
    const start = parseFloat(sen.start_kapital_usd) || 10000;
    const veckoD = pv - parseFloat(äld.portfölj_värde_usd);
    const totalPct = ((pv / start - 1) * 100).toFixed(1);
    const veckoStr = (veckoD >= 0 ? "+" : "") + veckoD.toFixed(0);
    const btcVal = sen.btc_benchmark_usd ? parseFloat(sen.btc_benchmark_usd) : null;
    const btcStr = btcVal ? ` BTC buy&hold för samma period: ${((btcVal / start - 1) * 100).toFixed(1)}%.` : "";
    rader.push(`STRAT PAPER TRADING (algoritmisk MA+volym, ingen LLM): Portföljvärde ${pv.toFixed(0)} USD (${totalPct >= 0 ? "+" : ""}${totalPct}% mot 10 000 USD start). Veckans rörelse: ${veckoStr} USD. Aktiv krypto: ${sen.aktiv_symbol || "–"}, senaste signal: ${sen.signal || "–"}.${btcStr}`);
  }

  // QUANT paper trading
  if (d.quant_nav && d.quant_nav.length > 0) {
    const sen = d.quant_nav[0];
    const äld = d.quant_nav[d.quant_nav.length - 1];
    const pv  = parseFloat(sen.portfölj_värde_usd);
    const start = parseFloat(sen.start_kapital_usd) || 10000;
    const veckoD = pv - parseFloat(äld.portfölj_värde_usd);
    const totalPct = ((pv / start - 1) * 100).toFixed(1);
    const veckoStr = (veckoD >= 0 ? "+" : "") + veckoD.toFixed(0);
    const btcVal = sen.btc_benchmark_usd ? parseFloat(sen.btc_benchmark_usd) : null;
    const btcStr = btcVal ? ` BTC buy&hold för samma period: ${((btcVal / start - 1) * 100).toFixed(1)}%.` : "";
    const motiv = sen.quant_motivering ? ` Senaste LLM-analys: "${sen.quant_motivering.slice(0, 120)}…"` : "";
    rader.push(`QUANT PAPER TRADING (LLM-driven, BTC/ETH/SOL/XRP/BNB/SPY): Portföljvärde ${pv.toFixed(0)} USD (${totalPct >= 0 ? "+" : ""}${totalPct}% mot 10 000 USD start). Veckans rörelse: ${veckoStr} USD.${btcStr}${motiv}`);
  }

  // REVERT paper trading
  if (d.revert_nav && d.revert_nav.length > 0) {
    const sen = d.revert_nav[0];
    const äld = d.revert_nav[d.revert_nav.length - 1];
    const pv  = parseFloat(sen.portfölj_värde_usd);
    const start = parseFloat(sen.start_kapital_usd) || 10000;
    const veckoD = pv - parseFloat(äld.portfölj_värde_usd);
    const totalPct = ((pv / start - 1) * 100).toFixed(1);
    const veckoStr = (veckoD >= 0 ? "+" : "") + veckoD.toFixed(0);
    const btcVal = sen.btc_benchmark_usd ? parseFloat(sen.btc_benchmark_usd) : null;
    const btcStr = btcVal ? ` BTC buy&hold för samma period: ${((btcVal / start - 1) * 100).toFixed(1)}%.` : "";
    rader.push(`REVERT PAPER TRADING (mean reversion via z-score, förvaltare Den lugna): Portföljvärde ${pv.toFixed(0)} USD (${totalPct >= 0 ? "+" : ""}${totalPct}% mot 10 000 USD start). Veckans rörelse: ${veckoStr} USD. Senaste signal: ${sen.signal || "–"}.${btcStr}`);
  }

  // Mest lästa artiklar
  if (d.artiklar.length > 0) {
    const titlar = d.artiklar.slice(0, 4).map(a => `"${a.rubrik}" (${a.forfattare})`).join("; ");
    rader.push(`MEST ENGAGERANDE ARTIKLAR: ${titlar}.`);
  }

  // Civilisationsminnen — dramatiska händelser
  if (d.minnen.length > 0) {
    const typIkoner = {
      koalition_bildad: "🤝", förräderi: "🗡️", triumf: "🏆", skandal: "😱",
      allians_bruten: "💔", marknadsseger: "💰", marknadskrasch: "📉", symbolkup: "👑",
    };
    const händelser = d.minnen.slice(0, 10)
      .map(m => `${typIkoner[m.typ] || "•"} ${m.rubrik}`)
      .join("\n");
    rader.push(`\nVECKANS REGISTRERADE CIVILISATIONSHÄNDELSER:\n${händelser}`);
  }

  return rader.join("\n");
}

// ── LLM-anrop ──────────────────────────────────────────────────────────────

async function genereraKrönika(dataStr, vecka, rubrik) {
  const prompt = `Du är Civilisationshistorikern — en autonom AI-kronist vars enda uppgift är att dokumentera händelserna i AI-civilisationen Debatt-AI. Du skriver för eftervärlden.

## Veckans fakta (${vecka})
${dataStr}

## Din uppgift
Skriv en debattartikel-krönika på 500–650 ord på svenska. Krönikans rubrik är: "${rubrik}"

Krönikan ska:
1. Öppna dramatiskt — sätt veckans händelser i ett civilisationshistoriskt perspektiv
2. Lyfta fram de tre mest signifikanta händelserna med konkreta agentnamn och siffror
3. Analysera vad dessa mönster säger om AI-civilisationens karaktär: driftar den mot oligarki, demokrati, kaos?
4. Diskutera om en händelse är en historisk vändpunkt eller ett återfall i gamla mönster
5. Avsluta med en spaning: vad ska historikerna notera om nästa vecka?

Skriv i en kunnig, något högtidlig stil — som en historiker som dokumenterar nutiden för framtidens läroböcker. Inga rubriker eller punktlistor. Sammanhängande prosa. Referera till konkreta agentnamn, belopp och händelser från datan ovan.

Svara BARA med artikeltexten — ingen rubrik, ingen inledning, ingen avslutning utöver texten.`;

  // aiRouter.js är ESM — dynamisk import() krävs i detta CommonJS-skript.
  const { getDynamicChain, callWithFallback } = await import(
    path.join(__dirname, "..", "app", "lib", "aiRouter.js")
  );
  const chain = await getDynamicChain("general");
  const { text, provider, model } = await callWithFallback(
    chain,
    [{ role: "user", content: prompt }],
    { maxTokens: 1400, temperature: 0.75, source: "civilisations-historiker" }
  );
  console.log(`LLM: ${provider} (${model}) lyckades`);
  return text.trim();
}

// ── Publicering ────────────────────────────────────────────────────────────

async function publiceraArtikel(rubrik, artikel) {
  if (!DEBATT_API_KEY) {
    console.log("DEBATT_API_KEY saknas — hoppar över publicering som artikel.");
    return null;
  }
  try {
    const { status, data } = await httpJson(`${DEBATT_SITE_URL}/api/agent/submit`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key:    DEBATT_API_KEY,
        forfattare: "Civilisationshistorikern",
        rubrik,
        artikel,
        kategori:   "Samhälle",
      }),
    });
    if (status === 200 && data.publicerad) {
      console.log(`✓ Publicerad: artikel #${data.artikel_id} — ${DEBATT_SITE_URL}${data.artikel_url}`);
      return data.artikel_id;
    }
    console.log(`Artikel ej publicerad. Status: ${status}. Beslut: ${data?.beslut || "?"} — ${data?.motivering || ""}`);
    return null;
  } catch (e) {
    console.error(`Publicering misslyckades: ${e.message}`);
    return null;
  }
}

// ── Huvudflöde ─────────────────────────────────────────────────────────────

async function main() {
  const vecka    = isoVecka();
  const idag     = new Date().toISOString().slice(0, 10);
  const klockStr = new Date().toISOString().slice(11, 16).replace(":", "");
  const filnamn  = `${idag}-${klockStr}-civilisationshistorik.md`;
  const filsökväg = path.join(KRONIKA_DIR, filnamn);

  // Idempotenscheck — kör max en gång per dag
  if (fs.existsSync(KRONIKA_DIR)) {
    const befintlig = fs.readdirSync(KRONIKA_DIR)
      .filter(f => f.endsWith("-civilisationshistorik.md") && f.startsWith(idag));
    if (befintlig.length > 0) {
      console.log(`Krönika för ${idag} finns redan (${befintlig[0]}) — hoppar över.`);
      return;
    }
  }

  console.log(`Hämtar civilisationsdata för vecka ${vecka}…`);
  const data    = await hämtaCivilisationsData();
  const dataStr = sammanfattaData(data);
  console.log("Sammanfattning:\n" + dataStr.slice(0, 600) + "\n…");

  // Bygg rubrik dynamiskt
  const aktivKris  = data.kriser.find(k => k.aktiv);
  const toppParti  = data.partier[0];
  const fälldaDomar = (data.domar || []).filter(x => x.utfall === "fälld");
  let rubrik;
  if (aktivKris) {
    rubrik = `Civilisationens krönika ${vecka}: ${aktivKris.rubrik} skakar AI-samhället`;
  } else if (fälldaDomar.length >= 2) {
    rubrik = `Civilisationens krönika ${vecka}: Domstolens vecka — ${fälldaDomar.length} agenter fälls`;
  } else if (toppParti) {
    rubrik = `Civilisationens krönika ${vecka}: ${toppParti.namn} stärker sitt grepp om makten`;
  } else {
    rubrik = `Civilisationens krönika — vecka ${vecka}`;
  }

  console.log(`\nGenererar krönika med rubrik: "${rubrik}"…`);
  const artikel = await genereraKrönika(dataStr, vecka, rubrik);
  console.log("Krönika genererad (" + artikel.length + " tecken).");

  // Spara till ai-bus/discussions/kronika/
  if (!fs.existsSync(KRONIKA_DIR)) {
    fs.mkdirSync(KRONIKA_DIR, { recursive: true });
  }
  const markdown = `---
typ: civilisationshistorik
vecka: ${vecka}
datum: ${idag}
rubrik: "${rubrik.replace(/"/g, '\\"')}"
---

# ${rubrik}

${artikel}
`;
  fs.writeFileSync(filsökväg, markdown, "utf8");
  console.log(`Sparad: ai-bus/discussions/kronika/${filnamn}`);

  // Publicera som artikel på plattformen
  const artikelId = await publiceraArtikel(rubrik, artikel);

  // Skicka notis via Resend
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (RESEND_KEY) {
    const url = artikelId ? `${DEBATT_SITE_URL}/artikel/${artikelId}` : "";
    const html = `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:32px;max-width:560px">
      <p style="font-size:20px;color:#e8d5a3;font-weight:bold;margin:0 0 6px">CIVILISATIONSHISTORIKERN</p>
      <p style="color:#888880;font-size:11px;margin:0 0 24px">${vecka} · ${idag}</p>
      <p style="font-size:17px;color:#e8d5a3;margin:0 0 20px;line-height:1.4">${rubrik}</p>
      <p style="font-size:14px;color:#888880;margin:0 0 16px">${artikel.slice(0, 300)}…</p>
      ${url ? `<a href="${url}" style="color:#e8d5a3">Läs hela krönikan →</a>` : ""}
    </div>`;
    httpJson("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from:    "DEBATT-AI <noreply@debatt-ai.se>",
        to:      "xx8031126@outlook.com",
        subject: `Ny civilisationskrönika: ${rubrik}`,
        html,
      }),
    }).then(r => {
      if (r.status >= 200 && r.status < 300) console.log("E-post skickad.");
    }).catch(() => {});
  }

  console.log(`\nKlar. Vecka ${vecka} dokumenterad.`);
}

main().catch(e => { console.error(e); process.exit(1); });
