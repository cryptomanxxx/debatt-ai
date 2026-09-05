// POST /api/nyhetsflode/forbered-lasning — förbereder en nyhetsflode-rad
// innan Professor Oraklet läser upp den (/universitet, "Vetenskapliga
// Nyheter"-fliken). Två oberoende steg körs i ordning innan uppläsningen
// startar:
//
// 1. Textberikning — om rubrik+beskrivning tillsammans är för kort för en
//    meningsfull uppläsning försöker vi hämta mer text från originalkällan
//    via samma SSRF-säkra hämtare som /api/nyhetsflode/importera
//    (app/lib/hamtaArtikelInnehall.js) och sparar den tillbaka på raden, så
//    framtida analyser/uppläsningar också får glädje av den.
// 2. Översättning — många av de ~44 bevakade källorna är engelskspråkiga.
//    nyhetsflode_test.py översätter redan NYA rader vid insamling (se
//    CLAUDE.md ✅93), men äldre rader eller besökarimporterade artiklar kan
//    fortfarande vara på originalspråk. En billig svensk-heuristik avgör om
//    ett LLM-anrop över huvud taget behövs, så det vanliga fallet (redan
//    svensk text) aldrig kostar ett anrop.
//
// Fail-open genomgående: om något steg misslyckas (nätverksfel, LLM nere,
// för kort text ändå) returneras den bästa tillgängliga texten — Oraklet
// läser hellre upp originaltexten (eller på engelska) än att inte läsa alls.
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { hamtaArtikelInnehall } from "../../../lib/hamtaArtikelInnehall";
import { callWithFallback, getDynamicChain } from "../../../lib/aiRouter.js";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

const MIN_TEXT_LEN = 120;

const SVENSKA_TECKEN = /[åäöÅÄÖ]/;
const SVENSKA_STOPPORD = new Set([
  "och", "att", "är", "det", "som", "en", "ett", "för", "med", "inte",
  "har", "om", "kan", "de", "den", "vi", "du", "jag", "på", "av", "till",
]);

// Billig heuristik istället för ett LLM-anrop bara för språkdetektion — å/ä/ö
// eller minst två svenska stoppord räcker för att anta att texten redan är
// på svenska (det vanliga fallet efter ✅93s översättning vid insamling).
function verkarSvensk(text) {
  if (!text || !text.trim()) return true;
  if (SVENSKA_TECKEN.test(text)) return true;
  const ord = text.toLowerCase().match(/[a-zåäö]+/g) || [];
  let traffar = 0;
  for (const w of ord) {
    if (SVENSKA_STOPPORD.has(w)) traffar++;
    if (traffar >= 2) return true;
  }
  return false;
}

function parseOversattning(raw) {
  let text = (raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  let parsed;
  try { parsed = JSON.parse(text.slice(start, end + 1)); } catch { return null; }
  if (typeof parsed?.rubrik !== "string" || typeof parsed?.beskrivning !== "string") return null;
  return { rubrik: parsed.rubrik.trim().slice(0, 500), beskrivning: parsed.beskrivning.trim().slice(0, 2000) };
}

async function oversattTillSvenska(rubrik, beskrivning) {
  const chain = await getDynamicChain("chatt");
  const { text } = await callWithFallback(chain,
    [
      {
        role: "system",
        content: "Du översätter en nyhetsrubrik och en nyhetsbeskrivning till naturlig svenska. Ändra inte innebörden och hitta inte på nytt innehåll. Om texten redan är på svenska, returnera den oförändrad. Svara ENDAST med giltig JSON i exakt detta format, ingen markdown, ingen förklaring: {\"rubrik\":\"...\",\"beskrivning\":\"...\"}",
      },
      { role: "user", content: `Rubrik: ${rubrik}\nBeskrivning: ${beskrivning || "(ingen beskrivning tillgänglig)"}` },
    ],
    { maxTokens: 600, temperature: 0.3, json: true, source: "oraklet-forbered-lasning", validate: (t) => !!parseOversattning(t) }
  );
  return parseOversattning(text);
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
    `${SB_URL}/rest/v1/nyhetsflode?id=eq.${radId}&select=id,rubrik,beskrivning,kalla,url`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const rader = radRes.ok ? await radRes.json().catch(() => []) : [];
  const rad = rader?.[0];
  if (!rad) return Response.json({ fel: "Nyheten hittades inte." }, { status: 404 });

  let rubrik = rad.rubrik || "";
  let beskrivning = rad.beskrivning || "";
  const patch = {};

  // Steg 1: berika för kort text via originalkällan (samma hämtare som besökarimport)
  const totalLen = `${rubrik} ${beskrivning}`.trim().length;
  if (totalLen < MIN_TEXT_LEN && rad.url) {
    try {
      const result = await hamtaArtikelInnehall(rad.url);
      if (result.ok && result.sammanfattning && result.sammanfattning.length > beskrivning.length) {
        beskrivning = result.sammanfattning;
        patch.beskrivning = beskrivning;
      }
    } catch (e) {
      logFel({ kalla: "nyhetsflode/forbered-lasning", feltyp: "berikning_fail", meddelande: String(e?.message || e), ip, extra: { id: radId } });
    }
  }

  // Steg 2: översätt om texten fortfarande verkar vara på ett annat språk än svenska
  if (!verkarSvensk(rubrik) || !verkarSvensk(beskrivning)) {
    try {
      const oversatt = await oversattTillSvenska(rubrik, beskrivning);
      if (oversatt) {
        rubrik = oversatt.rubrik || rubrik;
        beskrivning = oversatt.beskrivning || beskrivning;
        patch.rubrik = rubrik;
        patch.beskrivning = beskrivning;
      }
    } catch (e) {
      logFel({ kalla: "nyhetsflode/forbered-lasning", feltyp: "oversattning_fail", meddelande: String(e?.message || e), ip, extra: { id: radId } });
    }
  }

  if (Object.keys(patch).length > 0) {
    try {
      await fetch(`${SB_URL}/rest/v1/nyhetsflode?id=eq.${radId}`, {
        method: "PATCH",
        headers: {
          apikey: SB_WRITE_KEY,
          Authorization: `Bearer ${SB_WRITE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(patch),
      });
    } catch (e) {
      logFel({ kalla: "nyhetsflode/forbered-lasning", feltyp: "supabase_patch_fail", meddelande: String(e?.message || e), ip, extra: { id: radId } });
    }
  }

  return Response.json({ rubrik, beskrivning });
}
