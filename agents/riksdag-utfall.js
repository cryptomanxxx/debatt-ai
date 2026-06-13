#!/usr/bin/env node
// Körs direkt från GitHub Actions — kringgår Vercels IP-begränsningar mot riksdagen.se.
// Hämtar voteringsutfall via röstningsräkning (Ja/Nej per ledamot), skriver direkt till Supabase.

const SB_URL = process.env.SUPABASE_URL || "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const UA = "debatt-ai.se/1.0";

function sbH() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
}

async function get(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    clearTimeout(t);
    return null;
  }
}

// HC01FiU16 → "FiU16", HC01KU4 → "KU4", HC01AU10 → "AU10"
function beteckning(dokId) {
  return dokId.match(/([A-Za-zÄÅÖäåö]{2,5}\d+)$/)?.[1] || null;
}

// Härleda riksmöte från dokId-prefix: HA=2022/23, HB=2023/24, HC=2024/25, HD=2025/26 …
// Förhindrar att fel riksmötes röster kopplas till ett nyare dokument med samma beteckning.
function rmFranDokId(dokId) {
  const m = dokId.match(/^H([A-Za-z])/);
  if (!m) return null;
  const offset = m[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  const startYear = 2022 + offset;
  return `${startYear}/${String(startYear + 1).slice(2)}`;
}

// Räkna faktiska ledamotsröster (rost=Ja/Nej) för att bestämma kammarbeslutet.
// voteringlista returnerar individuella röster, inte aggregerat utfall.
async function getVoteCountUtfall(dokId) {
  const bet = beteckning(dokId);
  if (!bet) return null;

  const derived = rmFranDokId(dokId);
  const allRms = ["2025/26", "2024/25", "2023/24", "2022/23"];
  // Prova härledd rm först — undviker att koppla föregående riksmötes röster till nyare dokument
  const rmsToTry = derived ? [derived, ...allRms.filter(r => r !== derived)] : allRms;

  for (const rm of rmsToTry) {
    const d = await get(
      `https://data.riksdagen.se/voteringlista/?rm=${rm}&bet=${encodeURIComponent(bet)}&utformat=json&sz=400`
    );
    const roster = [].concat(d?.voteringlista?.votering || []);
    if (roster.length < 10) continue;

    // Räkna Ja/Nej för punkt="1" (utskottets huvudrekommendation)
    const p1 = roster.filter(r => r.punkt === "1");
    const votes = p1.length >= 10 ? p1 : roster;

    let ja = 0, nej = 0;
    for (const r of votes) {
      if (r.rost === "Ja") ja++;
      else if (r.rost === "Nej") nej++;
    }
    if (ja + nej < 10) continue;

    const datum = (roster[0]?.systemdatum || "").slice(0, 10) || null;
    const utfall = ja >= nej ? "bifall" : "avslag";
    return { utfall, datum, källa: `röstning rm=${rm} (${ja}J/${nej}N)` };
  }
  return null;
}

// Fallback: dokumentstatus med besluttext-analys
async function getDokstatusUtfall(dokId, riksdagenUrl = "") {
  const ds = await get(`https://data.riksdagen.se/dokumentstatus/${dokId}.json`);
  if (!ds) return null;

  const dokStatus = (ds?.dokumentstatus?.dokument?.status || "").toLowerCase();
  const rawBeslut = ds?.dokumentstatus?.dokbeslut;
  const beslutObj = Array.isArray(rawBeslut) ? rawBeslut[0] : rawBeslut;
  const beslutText = (beslutObj?.beslut || "").toLowerCase();
  const datum = ds?.dokumentstatus?.dokument?.datum || null;

  const harBifall = /bifall|biföll|godkänn|antog|antagen|tillstyrk/.test(beslutText);
  const harAvslag = /om avslag|avslår propositionen|avslog propositionen|avvisad|avstyrk/.test(beslutText);

  if (harAvslag) return { utfall: "avslag", datum, källa: "dokumentstatus" };
  if (harBifall) return { utfall: "bifall", datum, källa: "dokumentstatus" };

  // Acklamationsbeslut: avslutad status + tom besluttext + betänkande/proposition
  const avslutad = ["avslutad", "beslutat", "slutbehandlad"].some(s => dokStatus.includes(s));
  if (
    avslutad && !beslutText &&
    (riksdagenUrl.includes("/proposition/") || riksdagenUrl.includes("/betankande/"))
  ) {
    return { utfall: "bifall", datum, källa: "dokumentstatus-acklamation" };
  }

  return null;
}

async function main() {
  if (!SB_KEY) {
    console.error("SUPABASE_ANON_KEY saknas — avbryter");
    process.exit(1);
  }

  // 1. Hämta väntande förslag
  const pendingRes = await fetch(
    `${SB_URL}/rest/v1/lagforslag?kalla=eq.riksdagen&riksdagen_utfall=is.null&select=id,riksdagen_id,riksdagen_url&order=skapad.desc&limit=200`,
    { headers: sbH() }
  );
  if (!pendingRes.ok) {
    console.error("Kunde inte hämta väntande förslag:", pendingRes.status);
    process.exit(1);
  }
  const pending = await pendingRes.json();
  console.log(`Väntande: ${pending.length}`);

  const processed = new Set();
  let uppdaterade = 0;

  // 2. Per-dokument: röstningsräkning → dokumentstatus-fallback
  for (const row of pending) {
    const dokId = row.riksdagen_id;
    if (!dokId || processed.has(dokId)) continue;

    let result = await getVoteCountUtfall(dokId);
    if (!result) result = await getDokstatusUtfall(dokId, row.riksdagen_url || "");
    if (!result) {
      console.log(`miss: ${dokId}`);
      await new Promise(res => setTimeout(res, 150));
      continue;
    }

    const r = await fetch(`${SB_URL}/rest/v1/lagforslag?id=eq.${row.id}`, {
      method: "PATCH",
      headers: { ...sbH(), Prefer: "return=minimal" },
      body: JSON.stringify({ riksdagen_utfall: result.utfall, riksdagen_utfall_datum: result.datum, status: "avgjort" }),
    });
    if (r.ok) {
      uppdaterade++;
      processed.add(dokId);
      console.log(`${result.källa}: ${dokId} → ${result.utfall}`);
    }

    await new Promise(res => setTimeout(res, 150));
  }

  console.log(`\nTotalt uppdaterade: ${uppdaterade} av ${pending.length}`);
  console.log(JSON.stringify({ uppdaterade, vantande: pending.length - uppdaterade }));
}

main().catch(e => { console.error(e); process.exit(1); });
