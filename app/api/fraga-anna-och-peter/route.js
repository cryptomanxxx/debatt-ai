// Sparar en historikpost från /fraga-anna-och-peter varje gång en besökare
// låter Anna, Peter eller Johan läsa upp fri text/en nyhetsartikel, eller
// låter dem diskutera den i studion. Ren loggning — texten läses/spelas upp
// helt klientsidan (responsiveVoice/StudioOverlay), den här routen skriver
// bara undan en rad så historiken kan visas på sidan.
import { checkRateLimit } from "../../lib/kanalRateLimit";
import { logFel, getIp } from "../../lib/logFel";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// fraga_anna_peter_log saknar anon-skrivpolicy (RLS) — service role krävs,
// samma mönster som labb_log/nyhetsanalys. Fallback till anon bevaras för
// miljöer utan secreten (skrivningen misslyckas då tyst mot RLS istället för
// att krascha routen).
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

const TYPER = new Set(["fritext", "url"]);
const AKTIONER = new Set(["anna_sager", "peter_sager", "johan_sager", "oraklet_forklarar", "diskussion"]);
const MAX_TURNS = 9;
const MAX_TURN_LEN = 400;
// Codex-fynd, PR #1390-granskning: Oraklets sammanslagna uppläsningstext
// (rubrik upp till 500 + sammanfattning upp till 1200, se
// app/lib/sammanfattaForOraklet.js, + ev. motivering upp till 500 på
// Läslistan, se app/universitet/OrakletsLaslistaVy.js) kan bli upp till
// ~2200 tecken.
// Codex-fynd, PR #1389-granskning: den enskilda "Anna/Peter/Johan
// läser"-uppläsningen på /nyhetsanalyser (sparaLasningHistorik i
// app/nyhetsanalyser/page.js) skickar rubrik + ". " + hela nyhetsanalysen,
// och en analys kan sparas med upp till 4000 tecken (se
// app/api/chatt/route.js) — så textkolumnen behöver rymma betydligt mer än
// Oraklets 2200. `input_text` är en obegränsad Postgres text-kolumn (se
// supabase_fraga_anna_peter.sql) — den här gränsen är bara ett
// applikationslager-skydd mot orimligt stora payloads, inte en
// databasbegränsning, så den sätts generöst med marginal ovanför det
// största kända legitima fallet.
const MAX_INPUT_TEXT = 5000;

function stadaDialog(dialog) {
  if (!Array.isArray(dialog)) return null;
  const turns = dialog
    .filter(t => t && (t.speaker === "anna" || t.speaker === "peter" || t.speaker === "johan") && typeof t.text === "string" && t.text.trim())
    .slice(0, MAX_TURNS)
    .map(t => ({ speaker: t.speaker, text: t.text.trim().slice(0, MAX_TURN_LEN) }));
  return turns.length ? turns : null;
}

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "fraga-anna-peter-log", 40, 10 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ error: "För många förfrågningar." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const typ = body?.typ;
  const aktion = body?.aktion;
  if (!TYPER.has(typ) || !AKTIONER.has(aktion)) {
    return Response.json({ error: "Ogiltig typ eller aktion." }, { status: 400 });
  }

  const inputText = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_INPUT_TEXT) : null;
  const kallaUrl = typeof body?.url === "string" ? body.url.trim().slice(0, 2000) : null;
  // Codex-fynd, PR #1392-granskning: 200 tecken var för snålt för rubriker
  // från vissa producenter — nyhetsflode.rubrik kan vara upp till 300 tecken
  // (nyhetsflode_test.py) och Oraklets egen sammanfattningspipeline
  // (sammanfattaForOraklet.js) genererar rubriker upp till 500 tecken. En
  // avhuggen titel gjorde att spelaUppHistorik() ([rad.titel, rad.sammanfattning]
  // .join(". ")) tappade svansen av rubriken permanent — tidigare (innan
  // typ:"url" återanvändes för dessa uppläsningar) sparades hela den
  // sammanslagna texten som input_text under en betydligt högre gräns, så
  // förlusten är ny. Höjd till 500 för att täcka det största kända fallet.
  const titel = typeof body?.titel === "string" ? body.titel.trim().slice(0, 500) : null;
  // Gränsen matchade ursprungligen bara ORAKLET_SAMMANFATTNING_MAX (1200,
  // se app/lib/sammanfattaForOraklet.js) — Codex-fynd, PR #1378-granskning:
  // Oraklets full-text-sammanfattningspipeline (sagUrlOraklet()) kan
  // generera upp till 1200 tecken, och den gamla 800-teckensgränsen här
  // klippte tyst av svansen innan sparning.
  //
  // Höjd till MAX_INPUT_TEXT (5000, se ovan) sedan "sammanfattning"-fältet
  // började återanvändas för den enskilda uppläsningens nyhetsanalys-text
  // (`sparaLasningHistorik` i app/nyhetsanalyser/page.js, som skickar
  // typ "url" när nyheten har en källartikel, för att HistorikPost ska
  // kunna länka till den) — en nyhetsanalys kan vara upp till 4000 tecken
  // (se app/api/chatt/route.js), vilket den gamla 1200-gränsen hade klippt
  // av på precis samma sätt som MAX_INPUT_TEXT-fyndet ovan.
  const sammanfattning = typeof body?.sammanfattning === "string" ? body.sammanfattning.trim().slice(0, MAX_INPUT_TEXT) : null;
  const dialog = stadaDialog(body?.dialog);

  if (typ === "fritext" && !inputText) {
    return Response.json({ error: "Text saknas." }, { status: 400 });
  }
  if (typ === "url" && (!kallaUrl || !/^https:\/\//.test(kallaUrl))) {
    return Response.json({ error: "Ogiltig URL." }, { status: 400 });
  }
  // Utan detta kunde ett anrop med aktion="diskussion" men saknad/ogiltig
  // dialog (t.ex. direkt mot den här publika routen, utanför sidans egen
  // /api/studio-flöde) spara en permanent rad som ser ut som ett
  // studiosamtal men aldrig kan expanderas eller spelas upp — sidan gate:ar
  // "Spela upp igen" strikt på rad.aktion === "diskussion" (Codex-fynd,
  // PR #1345/#1346).
  if (aktion === "diskussion" && !dialog) {
    return Response.json({ error: "Ogiltig eller saknad dialog." }, { status: 400 });
  }

  const res = await fetch(`${SB_URL}/rest/v1/fraga_anna_peter_log`, {
    method: "POST",
    headers: {
      apikey: SB_WRITE_KEY,
      Authorization: `Bearer ${SB_WRITE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      typ, aktion,
      input_text: inputText,
      kalla_url: kallaUrl,
      titel, sammanfattning,
      dialog,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    logFel({ kalla: "fraga-anna-och-peter", feltyp: "supabase_fail", meddelande: `HTTP ${res.status}`, ip, extra: { errText: errText.slice(0, 300) } });
    return Response.json({ error: "Kunde inte spara." }, { status: 500 });
  }

  const rader = await res.json().catch(() => []);
  return Response.json({ ok: true, rad: rader?.[0] || null });
}
