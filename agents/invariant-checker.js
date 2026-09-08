#!/usr/bin/env node
/**
 * invariant-checker.js
 *
 * En samling konkreta, verifierbara påståenden om hur plattformen SKA
 * bete sig — varje check är en tidigare hittad och fixad bugg (✅97, ✅98,
 * ✅100, ✅101, ✅105, ✅106, ✅107) omvandlad till ett permanent
 * regressionsskydd. Två typer av checkar:
 *
 * - Källkodskontroller: läser filer direkt ur den incheckade repot (grep
 *   efter kända fix-markörer) — billiga, deterministiska, fångar "råkade
 *   någon återinföra buggen".
 * - Livedatakontroller: anropar produktionssajten och Supabase REST direkt
 *   — fångar "beter sig systemet faktiskt korrekt just nu", inklusive NYA
 *   instanser av samma buggklass som källkodskontrollerna inte kan se.
 *
 * Ingen AI-provider krävs — det här skriptet kan aldrig misslyckas för att
 * Groq/Gemini/etc är nere.
 *
 * Resultat skrivs till Supabase-tabellen invariant_checks (se
 * supabase_invariant_checks.sql) och visas på /status. Processen avslutas
 * med exit code 1 om någon check fail:ar eller error:ar — synligt direkt i
 * GitHub Actions-listan som en röd körning, ingen loggläsning krävs för att
 * märka att något gått sönder.
 *
 * Körs av GitHub Actions (invariant-check.yml) eller manuellt:
 *   SUPABASE_ANON_KEY=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node agents/invariant-checker.js
 *
 * Lägg till fler checkar allt eftersom nya buggklasser hittas och fixas —
 * det är hela poängen med det här skriptet.
 */

const fs = require("fs");
const path = require("path");

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;
const SITE_URL = "https://www.debatt-ai.se";
const REPO_ROOT = path.join(__dirname, "..");

if (!SB_KEY) { console.error("SUPABASE_ANON_KEY saknas — avbryter"); process.exit(1); }

function lasFil(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const resultat = [];

function rapportera(namn, status, detalj = "") {
  resultat.push({ namn, status, detalj });
  const ikon = status === "ok" ? "✓" : status === "fail" ? "✗" : "?";
  console.log(`${ikon} ${namn}${detalj ? " — " + detalj : ""}`);
}

// ==================== Källkodskontroller ====================

function checkAktivitetWidgetLank() {
  const namn = "aktivitet-widget-lank";
  try {
    const kod = lasFil("app/client.js");
    const idx = kod.indexOf("Senaste aktivitet");
    if (idx === -1) {
      rapportera(namn, "fail", "hittar inte 'Senaste aktivitet' i app/client.js — widgeten kan ha flyttats/bytt namn");
      return;
    }
    const fonster = kod.slice(idx, idx + 800);
    if (fonster.includes('href="/historia"')) {
      rapportera(namn, "fail", "'Se alla'-länken pekar fortfarande på /historia (✅107 återinförd?)");
      return;
    }
    if (!fonster.includes('href="/aktivitet"')) {
      rapportera(namn, "fail", 'hittar ingen href="/aktivitet" nära widget-rubriken');
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

function checkAktivitetReserveradePlatser() {
  const namn = "aktivitet-reserverade-platser";
  try {
    const kod = lasFil("app/api/aktivitet/route.js");
    if (!kod.includes("ARTIKEL_MIN_SLOTS")) {
      rapportera(namn, "fail", "ARTIKEL_MIN_SLOTS saknas — reservationslogiken från ✅106 kan vara borttagen");
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

function checkSenasteDebatternaFilter() {
  const namn = "senaste-debatterna-filter";
  try {
    const kod = lasFil("app/client.js");
    const idx = kod.indexOf("fetchLatestArtikel");
    if (idx === -1) {
      rapportera(namn, "fail", "hittar inte fetchLatestArtikel i app/client.js");
      return;
    }
    const fonster = kod.slice(idx, idx + 2000);
    if (!fonster.includes("parent_id.not.is.null")) {
      rapportera(namn, "fail", "fetchLatestArtikel filtrerar inte längre in repliker (✅105 återinförd?)");
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

function checkRubrikTrunkeringsskydd() {
  const namn = "rubrik-trunkeringsskydd";
  try {
    const kod = lasFil("artikel.py");
    const idx = kod.indexOf("def generera_rubrik");
    if (idx === -1) {
      rapportera(namn, "fail", "hittar inte generera_rubrik i artikel.py");
      return;
    }
    const fonster = kod.slice(idx, idx + 3000);
    const maxTokensMatch = fonster.match(/"max_tokens":\s*(\d+)/);
    const maxTokens = maxTokensMatch ? parseInt(maxTokensMatch[1], 10) : 0;
    if (maxTokens < 150) {
      rapportera(namn, "fail", `max_tokens i generera_rubrik-anropet är ${maxTokens} (< 150) — kan ge avhuggna rubriker igen (✅97)`);
      return;
    }
    if (!kod.includes("RUBRIK_MIN_LANGD")) {
      rapportera(namn, "fail", "RUBRIK_MIN_LANGD saknas i artikel.py — säkerhetsgolvet mot avhuggna rubriker kan vara borttaget");
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

function checkDirektdebattTokentak() {
  const namn = "direktdebatt-repliker-tokentak";
  try {
    const kod = lasFil("app/api/chatt/route.js");
    const match = kod.match(/maxTokensForRequest\s*=\s*erNyhetsanalys\s*\?\s*(\d+)\s*:\s*(\d+)/);
    if (!match) {
      rapportera(namn, "fail", "hittar inte maxTokensForRequest-tilldelningen i app/api/chatt/route.js");
      return;
    }
    const vanligTak = parseInt(match[2], 10);
    if (vanligTak < 500) {
      rapportera(namn, "fail", `maxTokensForRequest för vanliga repliker är ${vanligTak} (< 500) — risk för avhuggna repliker igen (✅101)`);
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

function checkAmnesforslagInteKonsumeratVidAvvisning() {
  const namn = "amnesforslag-inte-konsumerat-vid-avvisning";
  try {
    const kod = lasFil("agent.py");
    const idxMarkera = kod.indexOf("markera_forslag_behandlat(sb_key, forslag_id)");
    if (idxMarkera === -1) {
      rapportera(namn, "fail", "hittar inget markera_forslag_behandlat(sb_key, forslag_id)-anrop i agent.py");
      return;
    }
    const foreAnropet = kod.slice(Math.max(0, idxMarkera - 120), idxMarkera);
    if (!foreAnropet.includes("if publicerad")) {
      rapportera(namn, "fail", "markera_forslag_behandlat() villkoras inte längre av 'if publicerad' — kan konsumera avvisade förslag igen (✅98 återinförd?)");
      return;
    }
    if (!kod.includes("registrera_forslag_forsok")) {
      rapportera(namn, "fail", "registrera_forslag_forsok saknas i agent.py — bounded-retry-skyddet (✅98) kan vara borttaget");
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

function checkAmnesforslagKvotseparation() {
  const namn = "amnesforslag-kvotseparation";
  try {
    const kod = lasFil("agent.py");
    if (!kod.includes("kraver_kalla=kraver_kalla") || !kod.includes("kraver_kalla = not force_eget")) {
      rapportera(namn, "fail", "kraver_kalla-separationen mellan nyhets- och eget-kvoten (✅100) verkar saknas eller ha ändrats");
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

function checkRedaktionRaknarRepliker() {
  const namn = "redaktion-raknar-repliker";
  try {
    const kod = lasFil("app/redaktion/page.js");
    const idx = kod.indexOf("Daglig publicering senaste 30 dagarna");
    if (idx === -1) {
      rapportera(namn, "fail", "hittar inte dagligData-bygget i app/redaktion/page.js");
      return;
    }
    const fonster = kod.slice(idx, idx + 1200);
    if (fonster.includes("parent_id != null) continue")) {
      rapportera(namn, "fail", "dagligData hoppar fortfarande över repliker helt — kan vara ✅109 återinförd");
      return;
    }
    if (!fonster.includes(".repliker")) {
      rapportera(namn, "fail", "dagligData saknar en repliker-nyckel — ✅109 kan vara borttagen");
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

// ==================== Livedatakontroller ====================

async function hamtaSupabase(pathAndQuery) {
  const res = await fetch(`${SB_URL}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

async function checkAktivitetHarArtikelTyper() {
  const namn = "aktivitet-har-artikel-typer";
  try {
    const sedan = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const artiklar = await hamtaSupabase(`artiklar?select=id&skapad=gte.${encodeURIComponent(sedan)}&limit=5`);
    if (!Array.isArray(artiklar) || artiklar.length === 0) {
      rapportera(namn, "ok", "inga artiklar senaste 48h — kunde inte verifiera, hoppar över");
      return;
    }
    const res = await fetch(`${SITE_URL}/api/aktivitet`, { cache: "no-store" });
    if (!res.ok) {
      rapportera(namn, "error", `/api/aktivitet svarade ${res.status}`);
      return;
    }
    const feed = await res.json();
    const ARTIKEL_TYPER = new Set(["artikel-ai", "artikel-human", "replik"]);
    const antal = Array.isArray(feed) ? feed.filter(f => ARTIKEL_TYPER.has(f.typ)).length : 0;
    if (antal === 0) {
      rapportera(namn, "fail", "senaste 48h har publicerade artiklar, men /api/aktivitet visar noll artikel/replik-rader (✅106)");
      return;
    }
    rapportera(namn, "ok", `${antal} artikel/replik-rader i feeden`);
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

async function checkDagligPubliceringskvot() {
  const namn = "daglig-publiceringskvot";
  try {
    // Samma UTC-dygnsgräns och klassificeringslogik som
    // hamta_publicerade_idag_per_typ() i supabase_utils.py.
    const idagUtc = new Date();
    idagUtc.setUTCHours(0, 0, 0, 0);
    const rader = await hamtaSupabase(
      `artiklar?select=nyhetskalla,parent_id&kalla=eq.ai&skapad=gte.${idagUtc.toISOString()}&limit=200`
    );
    let replik = 0, nyhet = 0;
    for (const a of rader) {
      if (a.parent_id) replik++;
      else if (a.nyhetskalla) nyhet++;
    }
    const eget = rader.length - nyhet - replik;
    const overskridna = [];
    if (nyhet > 4) overskridna.push(`nyhet=${nyhet}`);
    if (replik > 4) overskridna.push(`replik=${replik}`);
    if (eget > 4) overskridna.push(`eget=${eget}`);
    if (overskridna.length > 0) {
      rapportera(namn, "fail", `4/4/4-kvoten överskriden idag: ${overskridna.join(", ")}`);
      return;
    }
    rapportera(namn, "ok", `nyhet=${nyhet} replik=${replik} eget=${eget}`);
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

async function checkAktivitetArkivSidaSvarar() {
  const namn = "aktivitet-arkiv-sida-svarar";
  try {
    const res = await fetch(`${SITE_URL}/aktivitet`, { cache: "no-store" });
    if (!res.ok) {
      rapportera(namn, "fail", `/aktivitet svarade ${res.status}`);
      return;
    }
    const html = await res.text();
    if (!html.includes("Senaste aktivitet")) {
      rapportera(namn, "fail", "/aktivitet svarade 200 men innehåller inte förväntad text");
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

// Vanliga svenska ord som aldrig legitimt avslutar en rubrik — en rubrik
// som slutar på ett sådant ord (t.ex. "...framåt för Sverige och") är ett
// lika starkt trunkeringstecken som ett kort sista ord, oavsett ordlängd.
const AVHUGGEN_SLUTORD = new Set([
  "och", "för", "av", "på", "i", "att", "som", "men", "eller", "till",
  "med", "ur", "om", "än", "så", "är", "en", "ett", "den", "det", "de",
  "vi", "man", "sig", "sin", "sitt", "sina", "har", "kan", "ska", "vill",
]);

// En KORT rubrik som börjar med en preposition och inte fortsätter till ett
// fullständigt påstående ("Om fem år") är nästan alltid avhuggen — en
// riktig rubrik som börjar så är i praktiken alltid längre ("Om fem år
// kommer klimatkrisen förändra allt"). Bara "om" ingår — det enda ordet
// med faktiskt belägg (✅97s ursprungliga buggexempel); att gissa på fler
// prepositioner utan belägg riskerar bara nya falska larm av samma sort
// som "Codex-fynd, PR #1428-granskning" nedan redan hittat en gång.
const AVHUGGEN_STARTORD = new Set(["om"]);
const KORT_STARTORD_TROSKEL = 20;

// Korta (högst 2 tecken) ord som ÄR legitima svenska ord/vanliga
// förkortningar trots sin längd — en avhuggen ordrest ("...ett nytt sk")
// är annars i praktiken omöjlig att skilja från ett kort men fullständigt
// sista ord utan en sådan lista (Codex-fynd, PR #1429-granskning, efter
// merge: den tidigare versionen tappade HELA den signalen och missade
// därmed just den typen av avhuggning). Byggd genom att lägga till varje
// ord som visat sig ge ett falskt larm i produktion eller test — samma
// iterativa process som redan format AVHUGGEN_SLUTORD/-STARTORD ovan.
// Inte uttömmande, se "Känd begränsning" i CLAUDE.md.
const KORT_SLUTORD_TILLATNA = new Set(["år", "nu", "få", "ny", "jo", "ja", "bo", "gå", "se", "ai", "eu", "fn"]);

function verkarAvhuggen(rubrik) {
  const r = (rubrik || "").trim();
  // Codex-fynd (PR #1428-granskning, efter merge): ett blankt "< 12 tecken
  // = avhuggen"-villkor flaggade ALLA korta men fullständiga rubriker (t.ex.
  // "Stoppa AI", 9 tecken) — motsäger dessutom generera_rubrik()s egen
  // 3-teckensgolv i artikel.py (✅97), som uttryckligen tillåter korta
  // rubriker när providerns finish_reason bekräftar att de INTE klipptes
  // av. Ersatt av (1) ett minimalt golv mot i praktiken tomma svar och (2)
  // två riktade signaler — sista ord i en stoppordslista, eller första ord
  // en preposition i en tillräckligt kort rubrik — istället för att gissa
  // på ren längd.
  if (r.length < 4) return true;
  if (/[.!?"'…”]$/.test(r)) return false;

  // Dela på blanksteg OCH bindestreck — annars slås "FN-för" ihop till
  // "fnför" och missar stoppordsträffen på "för" helt.
  const ord = r.split(/[\s-]+/).filter(Boolean);
  const sistaOrdRen = (ord[ord.length - 1] || "").toLowerCase().replace(/[^a-zåäö]/g, "");
  if (AVHUGGEN_SLUTORD.has(sistaOrdRen)) return true;
  // Ett sista ord på högst två tecken är i praktiken alltid antingen ett
  // stoppord (redan fångat ovan) eller en avhuggen ordrest — flaggas om
  // det inte står på den medvetet snäva allowlistan ovan.
  if (sistaOrdRen.length > 0 && sistaOrdRen.length <= 2 && !KORT_SLUTORD_TILLATNA.has(sistaOrdRen)) return true;

  const forstaOrdRen = (ord[0] || "").toLowerCase().replace(/[^a-zåäö]/g, "");
  if (r.length < KORT_STARTORD_TROSKEL && AVHUGGEN_STARTORD.has(forstaOrdRen)) return true;

  return false;
}

async function checkAvhuggnaRubriker() {
  const namn = "avhuggna-rubriker";
  try {
    const rader = await hamtaSupabase(`artiklar?select=id,rubrik&order=skapad.desc&limit=20`);
    const misstankta = rader.filter(a => verkarAvhuggen(a.rubrik));
    if (misstankta.length > 0) {
      rapportera(
        namn,
        "fail",
        `${misstankta.length} av de 20 senaste rubrikerna ser avhuggna ut, t.ex. id=${misstankta[0].id} "${misstankta[0].rubrik}"`
      );
      return;
    }
    rapportera(namn, "ok");
  } catch (e) {
    rapportera(namn, "error", String(e.message || e));
  }
}

// ==================== Kör alla checkar ====================

async function main() {
  checkAktivitetWidgetLank();
  checkAktivitetReserveradePlatser();
  checkSenasteDebatternaFilter();
  checkRubrikTrunkeringsskydd();
  checkDirektdebattTokentak();
  checkAmnesforslagInteKonsumeratVidAvvisning();
  checkAmnesforslagKvotseparation();
  checkRedaktionRaknarRepliker();

  await checkAktivitetHarArtikelTyper();
  await checkDagligPubliceringskvot();
  await checkAktivitetArkivSidaSvarar();
  await checkAvhuggnaRubriker();

  const kordAt = new Date().toISOString();
  const antalFail = resultat.filter(r => r.status === "fail").length;
  const antalError = resultat.filter(r => r.status === "error").length;

  console.log(`\n${resultat.length} checkar körda — ${antalFail} fail, ${antalError} error.`);

  // Codex-fynd (PR #1428-granskning, efter merge): en misslyckad sparning
  // till Supabase påverkade tidigare bara console.error — exit-koden
  // berodde uteslutande på check-utfallen. En trasig migrering, en saknad
  // service-role-secret eller ett RLS-avslag hade då kunnat lämna
  // workflowen GRÖN i GitHub Actions samtidigt som /status tyst visade
  // gammal eller ingen data — precis den typen av tyst fel dashboarden
  // finns till för att avslöja. `sparningLyckades` räknas nu in i
  // exit-koden på samma sätt som ett fail/error-utfall.
  let sparningLyckades = true;

  if (SB_WRITE_KEY) {
    try {
      const rows = resultat.map(r => ({
        kord_at: kordAt,
        check_namn: r.namn,
        status: r.status,
        detalj: r.detalj || null,
      }));
      const res = await fetch(`${SB_URL}/rest/v1/invariant_checks`, {
        method: "POST",
        headers: {
          apikey: SB_WRITE_KEY,
          Authorization: `Bearer ${SB_WRITE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(rows),
      });
      if (!res.ok) {
        sparningLyckades = false;
        console.error(`Kunde inte spara resultat till Supabase: ${res.status} ${await res.text().catch(() => "")}`);
      }
    } catch (e) {
      sparningLyckades = false;
      console.error("Kunde inte spara resultat till Supabase:", e.message || e);
    }
  } else {
    sparningLyckades = false;
    console.error("SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY saknas — resultat sparas inte till /status");
  }

  if (antalFail > 0 || antalError > 0 || !sparningLyckades) {
    process.exitCode = 1;
  }
}

main();
