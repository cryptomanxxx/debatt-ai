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
import { callWithFallback, getDynamicChain } from "../../../lib/aiRouter.js";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

// Övre gräns för en genuin sammanfattning — betydligt lägre än den råa
// brödtextens HEL_TEXT_MAX (4000, se hamtaArtikelInnehall.js), eftersom en
// sammanfattning ska vara just kort och koncis (5–8 meningar), inte en
// nästan lika lång återgivning av hela artikeln.
const SAMMANFATTNING_MAX = 1200;
// Hur mycket rått källmaterial (brödtext eller fallback-beskrivning) som
// skickas in i sammanfattningsprompten. Matchar hamtaArtikelInnehall.js
// HEL_TEXT_MAX (höjd 4000 → 8000, Codex-fynd PR #1373-granskning — en lägre
// gräns kunde tysta klippa bort artikelns mitt/slut redan innan den nådde
// LLM:en) — vi trimmar inte bort något extra här, LLM:en får se allt den
// redan hämtade texten innehåller.
const KALLMATERIAL_MAX = 8000;

function parseSammanfattning(raw) {
  let text = (raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  let parsed;
  try { parsed = JSON.parse(text.slice(start, end + 1)); } catch { return null; }
  if (typeof parsed?.sammanfattning !== "string" || !parsed.sammanfattning.trim()) return null;
  return {
    rubrik: typeof parsed.rubrik === "string" && parsed.rubrik.trim() ? parsed.rubrik.trim().slice(0, 500) : null,
    sammanfattning: parsed.sammanfattning.trim().slice(0, SAMMANFATTNING_MAX),
  };
}

// Ett enda LLM-anrop gör både jobbet: skriver en tydlig svensk sammanfattning
// av artikelns FAKTISKA innehåll (oavsett källspråk) och, om rubriken inte
// redan är på svenska, en översatt rubrik — ersätter den tidigare separata
// två-stegs verkarSvensk()/oversattTillSvenska()-logiken, som bara
// översatte ordagrant istället för att sammanfatta.
async function sammanfattaForOraklet(rubrik, kallmaterial) {
  const chain = await getDynamicChain("chatt");
  const { text } = await callWithFallback(
    chain,
    [
      {
        role: "system",
        content:
          "Du är Professor Oraklet, en AI-professor som förklarar nyhetsartiklar för lyssnare som inte har läst dem själva. " +
          "Du får rubriken och råtext hämtad direkt från en nyhetssida. Råtexten kan innehålla sidnavigering, cookie-notiser, " +
          "prenumerationserbjudanden, sidfötter, relaterade artiklar och annat webbplats-skräp blandat med den faktiska " +
          "artikeltexten — IGNORERA allt sådant helt, nämn det aldrig, och låtsas inte att det är en del av nyheten. " +
          "Skriv en sammanfattning av vad ARTIKELN FAKTISKT HANDLAR OM: 5–8 sammanhängande meningar, löpande prosa (inga " +
          "punktlistor eller rubriker), tydlig och lättbegriplig svenska — som om du förklarar nyheten muntligt för någon. " +
          "Hitta aldrig på fakta, siffror eller detaljer som inte finns i texten. Om råtexten är för skräpig eller kort för " +
          "att förstå vad artikeln handlar om, sammanfatta det du faktiskt kan utläsa av rubriken och det som finns. " +
          "Om rubriken inte redan är på svenska, ge även en naturlig svensk översättning av den. " +
          'Svara ENDAST med giltig JSON i exakt detta format, ingen markdown, ingen förklaring: ' +
          '{"rubrik":"...","sammanfattning":"..."}',
      },
      {
        role: "user",
        content: `Rubrik: ${rubrik || "(okänd)"}\n\nRåtext från sidan:\n${kallmaterial || "(ingen text tillgänglig, utgå bara från rubriken)"}`,
      },
    ],
    {
      maxTokens: 700,
      temperature: 0.5,
      json: true,
      source: "oraklet-sammanfattning",
      validate: (t) => !!parseSammanfattning(t),
    }
  );
  return parseSammanfattning(text);
}

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
