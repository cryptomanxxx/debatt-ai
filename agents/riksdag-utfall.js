#!/usr/bin/env node
// Körs direkt från GitHub Actions — kringgår Vercels IP-begränsningar mot riksdagen.se.
// Hämtar voteringsutfall, matchar mot väntande lagförslag i Supabase, skriver direkt.

const SB_URL = process.env.SUPABASE_URL || "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const UA = "debatt-ai.se/1.0";

function sbH() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
}

async function get(url, timeoutMs = 15000) {
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

// Extraherar beteckning ur kompakt dok_id, t.ex. HC01FiU16 → "FiU16", HC01KU4 → "KU4"
function beteckning(dokId) {
  return dokId.match(/([A-Za-zÄÅÖäåö]{2,5}\d+)$/)?.[1] || null;
}

async function getVoteringUtfall(dokId) {
  // Steg A1: försök med rm=2024/25 + bet (specifik sessionssökning — snabbare)
  const bet = beteckning(dokId);
  if (bet) {
    for (const rm of ["2024/25", "2025/26", "2023/24"]) {
      const d = await get(
        `https://data.riksdagen.se/voteringlista/?rm=${encodeURIComponent(rm)}&bet=${encodeURIComponent(bet)}&utformat=json&sz=1`
      );
      const v = [].concat(d?.voteringlista?.votering || [])[0];
      if (v?.utfall) {
        const utfall = v.utfall === "Ja" ? "bifall" : v.utfall === "Nej" ? "avslag" : null;
        if (utfall) return { utfall, datum: v.datum || null, källa: `rm=${rm}&bet=${bet}` };
      }
    }
  }

  // Steg A2: generisk dokid-sökning
  const d2 = await get(
    `https://data.riksdagen.se/voteringlista/?dokid=${encodeURIComponent(dokId)}&utformat=json&sz=1`
  );
  const v2 = [].concat(d2?.voteringlista?.votering || [])[0];
  if (v2?.utfall) {
    const utfall = v2.utfall === "Ja" ? "bifall" : v2.utfall === "Nej" ? "avslag" : null;
    if (utfall) return { utfall, datum: v2.datum || null, källa: "dokid" };
  }

  return null;
}

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

  if (
    ["avslutad", "beslutat", "slutbehandlad"].some(s => dokStatus.includes(s)) &&
    !beslutText &&
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

  // 1. Hämta väntande
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

  // 2. Bulk-sökning (täcker nyligen röstade betänkanden i aktuell session)
  const bulk = await get(
    "https://data.riksdagen.se/voteringlista/?utformat=json&sz=500&sort=datum&sortorder=desc",
    20000
  );
  if (bulk) {
    const pendingMap = {};
    for (const p of pending) if (p.riksdagen_id) pendingMap[p.riksdagen_id] = p;

    const voteringar = [].concat(bulk?.voteringlista?.votering || []);
    for (const v of voteringar) {
      const dokId = (v.tillhor_dok_id || "").trim();
      if (!dokId || !pendingMap[dokId] || processed.has(dokId)) continue;
      const utfall = v.utfall === "Ja" ? "bifall" : v.utfall === "Nej" ? "avslag" : null;
      if (!utfall) continue;

      const r = await fetch(`${SB_URL}/rest/v1/lagforslag?id=eq.${pendingMap[dokId].id}`, {
        method: "PATCH",
        headers: { ...sbH(), Prefer: "return=minimal" },
        body: JSON.stringify({ riksdagen_utfall: utfall, riksdagen_utfall_datum: v.datum || null, status: "avgjort" }),
      });
      if (r.ok) { uppdaterade++; processed.add(dokId); console.log(`bulk: ${dokId} → ${utfall}`); }
    }
  }
  console.log(`Bulk klar: ${uppdaterade} uppdaterade`);

  // 3. Per-dokument (rm+bet → generisk voteringlista → dokumentstatus)
  for (const row of pending) {
    const dokId = row.riksdagen_id;
    if (!dokId || processed.has(dokId)) continue;

    let result = await getVoteringUtfall(dokId);
    if (!result) result = await getDokstatusUtfall(dokId, row.riksdagen_url || "");
    if (!result) {
      console.log(`miss: ${dokId}`);
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

    // Kort paus för att undvika rate-limiting
    await new Promise(res => setTimeout(res, 300));
  }

  console.log(`\nTotalt uppdaterade: ${uppdaterade} av ${pending.length}`);
  console.log(JSON.stringify({ uppdaterade, vantande: pending.length - uppdaterade }));
}

main().catch(e => { console.error(e); process.exit(1); });
