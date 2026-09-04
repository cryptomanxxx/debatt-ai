// POST /api/nyhetsflode/importera — besökare klistrar in en länk till en
// nyhetsartikel på /nyhetskallor som de vill lägga till i nyhetsflode
// (t.ex. en nyhet som inte täcks av de ~44 automatiskt bevakade källorna).
// Hämtar artikeln server-side med samma SSRF-säkra logik som
// /api/chatt/artikel-kontext (app/lib/hamtaArtikelInnehall.js) — ren
// klient-inskickad titel/sammanfattning litar vi INTE på här, eftersom
// nyhetsflode presenteras som "vad plattformen faktiskt hämtat" (samma
// integritetsprincip som nyhetskalla på artiklar, se ✅17/CLAUDE.md).
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { hamtaArtikelInnehall } from "../../../lib/hamtaArtikelInnehall";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// nyhetsflode saknar anon-skrivpolicy (RLS) — service role krävs, samma
// mönster som labb_log/nyhetsanalys/fraga_anna_peter_log. Fallback till
// anon bevaras för miljöer utan secreten (skrivningen misslyckas då tyst
// mot RLS istället för att krascha routen).
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

const NYHETSFLODE_SELECT = "id,rubrik,beskrivning,kalla,url,publicerad,kategori,hamtad";

// hamtaArtikelInnehall() extraherar kalla ur SIDANS EGNA metataggar (og:site_name)
// eller värdnamnet — det betyder att den importerade sidan själv väljer sitt
// visade källnamn. En illvillig sida kan sätta og:site_name till "SVT Nyheter"
// eller registrera en subdomän som "svt.se.attacker.example" (vars hostname-
// fallback ger "Svt") för att låtsas vara en riktig, automatiskt bevakad källa
// (Codex-fynd, PR #1359). Suffixet gör varje importerad rad permanent och
// synligt urskiljbar från de genuina RSS/Reddit-källorna — den fångas som en
// egen källpill (källfiltret byggs redan dynamiskt ur faktisk kalla-text) och
// kan aldrig råka kollidera med eller maskera en riktig bevakad källa.
const BESOKARIMPORT_SUFFIX = " (besökarimport)";
const KALLA_BAS_MAX = 100 - BESOKARIMPORT_SUFFIX.length;

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "nyhetsflode-importera", 10, 60 * 60 * 1000);
  if (!rl.ok) {
    logFel({ kalla: "nyhetsflode/importera", feltyp: "rate_limit", meddelande: "429 rate limit", ip, extra: { retryAfter: rl.retryAfter } });
    return Response.json({ fel: "För många importer — försök igen om en stund." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const { url } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim() || url.length > 2000) {
    return Response.json({ fel: "Ogiltig URL." }, { status: 400 });
  }

  const result = await hamtaArtikelInnehall(url);
  if (!result.ok) {
    const status = result.fel === "ingen_text" ? 422 : (result.fel === "ogiltig_url" || result.fel === "url_format") ? 400 : 502;
    if (status === 502) {
      logFel({ kalla: "nyhetsflode/importera", feltyp: "rss_fail", meddelande: result.fel, ip, extra: { url: url.slice(0, 300) } });
    }
    return Response.json({ fel: result.publiktFel }, { status });
  }

  // rubrik är NOT NULL i nyhetsflode — og:title/<title> kan i sällsynta fall
  // saknas även när sammanfattning hittades (t.ex. en sida utan <title>-tagg
  // men med meta description). Faller tillbaka på ett utdrag av sammanfattningen.
  const rubrik = (result.titel || result.sammanfattning.slice(0, 120)).slice(0, 500);
  const kalla = `${(result.kalla || "Okänd källa").slice(0, KALLA_BAS_MAX)}${BESOKARIMPORT_SUFFIX}`;

  const insertRes = await fetch(`${SB_URL}/rest/v1/nyhetsflode`, {
    method: "POST",
    headers: {
      apikey: SB_WRITE_KEY,
      Authorization: `Bearer ${SB_WRITE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      rubrik,
      beskrivning: result.sammanfattning,
      kalla,
      url: result.url,
      kategori: [],
    }),
  });

  // unique(url) — samma artikel importerad (eller redan automatiskt hämtad)
  // sedan tidigare. Hämtar den befintliga raden istället för att bara felas,
  // så besökaren ser att nyheten redan finns snarare än ett kryptiskt fel.
  if (insertRes.status === 409) {
    const existing = await fetch(
      `${SB_URL}/rest/v1/nyhetsflode?url=eq.${encodeURIComponent(result.url)}&select=${NYHETSFLODE_SELECT}`,
      { headers: { apikey: SB_WRITE_KEY, Authorization: `Bearer ${SB_WRITE_KEY}` } }
    );
    const rows = existing.ok ? await existing.json().catch(() => []) : [];
    if (rows[0]) return Response.json({ redanImporterad: true, rad: rows[0] });
    return Response.json({ fel: "Nyheten finns redan men kunde inte hämtas." }, { status: 500 });
  }

  if (!insertRes.ok) {
    const errText = await insertRes.text().catch(() => "");
    logFel({ kalla: "nyhetsflode/importera", feltyp: "supabase_fail", meddelande: `HTTP ${insertRes.status}`, ip, extra: { errText: errText.slice(0, 300) } });
    return Response.json({ fel: "Kunde inte spara artikeln." }, { status: 500 });
  }

  const rader = await insertRes.json().catch(() => []);
  return Response.json({ rad: rader?.[0] || null });
}
