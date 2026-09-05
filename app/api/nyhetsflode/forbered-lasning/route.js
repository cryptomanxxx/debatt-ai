// POST /api/nyhetsflode/forbered-lasning — förbereder en nyhetsflode-rad
// innan Professor Oraklet läser upp den (/universitet, "Vetenskapliga
// Nyheter"-fliken).
//
// Historik: en tidigare version returnerade och sparade RÅ, oredigerad
// artikelbrödtext (hämtad via samma SSRF-säkra hämtare som besökarimport,
// app/lib/hamtaArtikelInnehall.js, { helText: true }). Det löste "för lite
// text"-problemet men skapade ett nytt: utan innehållsavgränsning fångas ALL
// synlig sidtext — sidnavigering, sidfot, cookie-/prenumerationsnotiser,
// upphovsrättstext — inte bara artikelns brödtext. Användarrapport (riktig
// Science Alert-artikel): uppläsningen blandade in "ScienceAlert Rymd Hälsa
// Miljö ... © 2026 ScienceAlert Pty Ltd"-skräp med artikelinnehållet.
//
// Fixen: hämta fortfarande hela sidans råa brödtext (samma { helText: true }-
// mekanism — den duger fint som RÅMATERIAL), men skicka den genom en LLM som
// uttryckligen instrueras att ignorera sidnavigering/sidfot/notiser och bara
// SAMMANFATTA artikelns faktiska innehåll på tydlig, sammanhängande svenska.
// Sammanfattningen cachas i den nya oraklet_sammanfattning-kolumnen
// (supabase_nyhetsflode_v2.sql) — genereras EN gång per artikel, aldrig om
// igen vid nästa klick på läs-knappen (användarkrav: "Sammanfattning behöver
// också sparas så att vi inte behöver göra om sammanfattning när någon
// trycker på knappen igen").
//
// beskrivning-kolumnen (den publika listförhandsvisningen i
// VetenskapsFlodeVy.js) lämnas medvetet ORÖRD av denna route från och med
// nu — den tidigare varianten skrev berikad/skräpig text dit också, vilket
// förorenade den vanliga listvyn, inte bara uppläsningen.
//
// Fail-open genomgående: misslyckas hämtningen eller LLM-anropet läser
// Oraklet upp den bästa redan tillgängliga texten (rubrik + beskrivning)
// istället för att inte läsa alls — och ingenting cachas vid ett misslyckande,
// så nästa försök kan lyckas.
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { hamtaArtikelInnehall } from "../../../lib/hamtaArtikelInnehall";
import { sammanfattaForOraklet } from "../../../lib/sammanfattaForOraklet";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

// Hur mycket rått källmaterial (brödtext eller fallback-beskrivning) som
// skickas in i sammanfattningsprompten. Matchar hamtaArtikelInnehall.js
// HEL_TEXT_MAX (höjd 4000 → 8000, Codex-fynd PR #1373-granskning — en lägre
// gräns kunde tysta klippa bort artikelns mitt/slut redan innan den nådde
// LLM:en) — vi trimmar inte bort något extra här, LLM:en får se allt den
// redan hämtade texten innehåller.
const KALLMATERIAL_MAX = 8000;

// sammanfattaForOraklet()/parseSammanfattning() bor nu i
// app/lib/sammanfattaForOraklet.js — delad med
// app/api/fraga-anna-och-peter/oraklet-sammanfattning/route.js så samma
// sammanfattnings-/översättningslogik inte dupliceras på två ställen.

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "oraklet-forbered-lasning", 30, 10 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ fel: "För många förfrågningar." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const { id } = await req.json().catch(() => ({}));
  const radId = Number(id);
  if (!Number.isInteger(radId) || radId <= 0) {
    return Response.json({ fel: "Ogiltigt id." }, { status: 400 });
  }

  const radRes = await fetch(
    `${SB_URL}/rest/v1/nyhetsflode?id=eq.${radId}&select=id,rubrik,beskrivning,kalla,url,oraklet_sammanfattning`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const rader = radRes.ok ? await radRes.json().catch(() => []) : [];
  const rad = rader?.[0];
  if (!rad) return Response.json({ fel: "Nyheten hittades inte." }, { status: 404 });

  // Redan sammanfattad tidigare — returnera den cachade texten direkt. Ingen
  // nätverkshämtning, inget LLM-anrop. Det här är kärnan i cache-kravet:
  // sammanfattningen görs EN gång per artikel, aldrig om.
  if (rad.oraklet_sammanfattning && rad.oraklet_sammanfattning.trim()) {
    return Response.json({ rubrik: rad.rubrik, beskrivning: rad.oraklet_sammanfattning });
  }

  const rubrikFallback = rad.rubrik || "";
  const beskrivningFallback = rad.beskrivning || "";

  // Hämta hela artikelns råa brödtext som källmaterial åt sammanfattningen.
  // Fail-open: misslyckas hämtningen används den korta RSS-beskrivningen som
  // källmaterial istället — sammanfattningsanropet nedan hanterar även det.
  let kallmaterial = beskrivningFallback;
  if (rad.url) {
    try {
      const result = await hamtaArtikelInnehall(rad.url, { helText: true });
      if (result.ok && result.sammanfattning) {
        kallmaterial = result.sammanfattning.slice(0, KALLMATERIAL_MAX);
      }
    } catch (e) {
      logFel({ kalla: "nyhetsflode/forbered-lasning", feltyp: "berikning_fail", meddelande: String(e?.message || e), ip, extra: { id: radId } });
    }
  }

  let genererat = null;
  try {
    genererat = await sammanfattaForOraklet(rubrikFallback, kallmaterial);
  } catch (e) {
    logFel({ kalla: "nyhetsflode/forbered-lasning", feltyp: "sammanfattning_fail", meddelande: String(e?.message || e), ip, extra: { id: radId } });
  }

  // LLM-anropet misslyckades helt — läs upp den bästa tillgängliga texten
  // utan att cacha något (så ett senare försök kan lyckas).
  if (!genererat) {
    return Response.json({ rubrik: rubrikFallback, beskrivning: beskrivningFallback });
  }

  const sammanfattning = genererat.sammanfattning;
  const rubrik = genererat.rubrik || rubrikFallback;

  const patch = { oraklet_sammanfattning: sammanfattning };
  if (genererat.rubrik && genererat.rubrik !== rubrikFallback) {
    patch.rubrik = genererat.rubrik;
  }

  try {
    const patchRes = await fetch(`${SB_URL}/rest/v1/nyhetsflode?id=eq.${radId}`, {
      method: "PATCH",
      headers: {
        apikey: SB_WRITE_KEY,
        Authorization: `Bearer ${SB_WRITE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patch),
    });
    // fetch() resolves även vid t.ex. RLS-avslag (saknad SUPABASE_SERVICE_ROLE_KEY
    // faller tillbaka på anon, som saknar UPDATE-policy) — utan denna koll
    // trodde vi tyst att sammanfattningen sparades, och nästa uppläsning
    // gjorde om samma (betalda) LLM-arbete istället för att läsa cachen
    // (Codex-fynd, PR #1365-review — samma princip gäller här).
    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => "");
      logFel({ kalla: "nyhetsflode/forbered-lasning", feltyp: "supabase_patch_fail", meddelande: `HTTP ${patchRes.status}`, ip, extra: { id: radId, errText: errText.slice(0, 300) } });
    }
  } catch (e) {
    logFel({ kalla: "nyhetsflode/forbered-lasning", feltyp: "supabase_patch_fail", meddelande: String(e?.message || e), ip, extra: { id: radId } });
  }

  return Response.json({ rubrik, beskrivning: sammanfattning });
}
