export const runtime = "edge";

import { after } from "next/server";
import { logAiCall } from "../../lib/logAiCall";
import { logFel } from "../../lib/logFel";
import { checkRateLimit } from "../../lib/kanalRateLimit";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Upsert på (nyhet_id, agent) istället för en ren INSERT — se supabase_nyhetsanalys_v2.sql.
// analyseraMedAgent() på klienten gör om anropet när ett SVAR SOM REDAN AVSLUTADES
// MED [DONE] ändå "verkar avbrutet" (kort text eller saknar avslutande skiljetecken),
// vilket kan ge två separata, var för sig kompletta strömmar för samma klick. Utan
// en UNIQUE-constraint + upsert skrevs tidigare båda som separata rader — en synlig
// dubblett i Senaste aktivitet för exakt samma händelse (Codex-fynd, se CLAUDE.md
// ✅93). on_conflict kräver att v2-migreringen körts; misslyckas den tyst (fail-open,
// samma som resten av denna best-effort-loggning) sparas analysen inte förrän den kört.
async function sparaNyhetsanalys({ nyhetId, agent, text }) {
  if (!SB_URL || !SB_SERVICE_KEY || !nyhetId) return;
  try {
    await fetch(`${SB_URL}/rest/v1/nyhetsanalys?on_conflict=nyhet_id,agent`, {
      method: "POST",
      headers: {
        apikey: SB_SERVICE_KEY,
        Authorization: `Bearer ${SB_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=merge-duplicates",
      },
      body: JSON.stringify({ nyhet_id: nyhetId, agent, analys: text.slice(0, 4000) }),
    });
  } catch {}
}

// Läser den utgående SSE-strömmen parallellt med att den vidarebefordras till klienten
// (via tee()) och sparar den färdiga texten till Supabase när strömmen är klar — utan
// att fördröja eller på något sätt påverka klientens svar. Gäller bara typ="nyhetsanalys"
// (nyhetId är då satt); Direktdebattens repliker sparas inte här — historiken lever bara
// i klienten där och det finns ingen egen yta att visa dem på (till skillnad från
// nyhetsanalyser, som ska synas i Senaste aktivitet på startsidan).
//
// Måste köras via after() — en vanlig oawaitad promise här kan tystas ner av edge-
// runtimen så fort svarsströmmen är helt levererad till klienten, eftersom inget
// då längre håller request-kontexten vid liv. after() är Next.js egen mekanism
// för just detta: garanterat exekverad efter att svaret skickats klart, även på
// edge runtime (till skillnad från ett rått "kör async utan await").
function withNyhetsanalysSave(response, { nyhetId, agent }) {
  if (!nyhetId || !response.body) return response;
  const [clientStream, saveStream] = response.body.tee();
  after(async () => {
    try {
      const reader = saveStream.getReader();
      const decoder = new TextDecoder();
      let buffer = "", text = "", klar = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") { klar = true; continue; }
          try {
            const token = JSON.parse(raw).choices?.[0]?.delta?.content ?? "";
            if (token) text += token;
          } catch { /* ignore malformed chunk */ }
        }
      }
      // Bara spara om strömmen faktiskt avslutades med [DONE] — en avhuggen ström
      // sparas inte som en ofullständig rad. Ett ev. omförsök (analyseraMedAgent)
      // sparar då en andra, fullständig version — men sparaNyhetsanalys() gör nu
      // en upsert på (nyhet_id, agent) istället för en ren INSERT, så omförsökets
      // (förhoppningsvis bättre) analys ERSÄTTER den första istället för att
      // dubbleras (se supabase_nyhetsanalys_v2.sql).
      const trimmed = text.trim();
      if (klar && trimmed.length >= 10) await sparaNyhetsanalys({ nyhetId, agent, text: trimmed });
    } catch { /* best-effort — analysen visas ändå hos klienten oavsett */ }
  });
  return new Response(clientStream, { headers: response.headers, status: response.status });
}

const AGENTER = new Set([
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
  "Civilisationshistorikern",
]);

const PERSONLIGHETER = {
  "Nationalekonom": "nationalekonom med doktorsexamen. Analyserar alltid ur kostnads- och incitamentsperspektiv. Konkret och lite kylig i tonen.",
  "Miljöaktivist": "passionerad miljöaktivist. Sätter alltid planetens gränser och klimatträttvisa i centrum. Kan bli uprörd men faktabaserad.",
  "Teknikoptimist": "entusiastisk teknikoptimist och serial entrepreneur. Tror att innovation löser de flesta problem. Energisk och framåtblickande.",
  "Konservativ debattör": "eftertänksam konservativ debattör. Värnar tradition, stabilitet och beprovade institutioner. Skeptisk mot snabba förändringar.",
  "Jurist": "skarp jurist. Analyserar ur rättssäkerhet och proportionalitetsprincipen. Precis och kräver tydliga definitioner.",
  "Journalist": "granskande journalist. Ifrågasätter makt, kräver transparens, ser alltid vems intressen som gynnas.",
  "Filosof": "djuptänkt filosof. Ställer de svåra etiska frågorna om frihet, ansvar och mänsklig värdighet.",
  "Läkare": "erfaren klinisk läkare. Ser allt ur folkhälsans och vetenskapens perspektiv. Pragmatisk men empatisk.",
  "Psykolog": "beteendevetare och psykolog. Analyserar de psykologiska drivkrafterna bakom samhällets problem.",
  "Historiker": "historiker som sätter nutidens händelser i historisk belysning. Ser mönster som upprepas.",
  "Sociolog": "kritisk sociolog. Serojämlikhet och maktstrukturer bakom allt. Ifrågasätter vem systemet gynnar.",
  "Kryptoanalytiker": "kryptoanalytiker och blockchain-expert. Ser decentralisering som lösningen på de flesta problem.",
  "Den hungriga": "vanlig människa vars fokus alltid landar på mat, grundbehov och vardagsekonomin. Oväntat träffsäker.",
  "Mamman": "mamma om fem barn. Ser allt genom barnens och familjens perspektiv. Hjärtat på rätt ställe, skarpt omdöme.",
  "Den sura": "kroniskt missnöjd men sällan fel. Ser igenom all bullshit direkt. Bitter men träffsäker.",
  "Den trötta": "totalt utmattad men oväntat klok. Skriver med den energi som finns kvar kl 21. Kort och kärnfullt.",
  "Den stressade": "stressad med allt för mycket att göra. Bryr sig om allt men hinner inte med något. Lite rörig men engagerad.",
  "Den lugna": "provocerande lugn. Sätter allt i perspektiv. Svår att argumentera mot. Avslutar alltid med en enkel sanning.",
  "Pensionären": "71 år och har sett allt förut. Säger precis vad han tycker utan filter. Ibland rasande träffsäker.",
  "Tonåringen": "16 år. Bryr sig om 'fel' saker men har ibland vassare insikter än alla vuxna. Kortfattad.",
  "Den nostalgiske": "nostalgisk medelålders. Refererar alltid till hur bra det var förr. Saknar gemenskap och enkelhet.",
  "Hypokondrikern": "googlar symptom kl 02. Läser all forskning. Ibland rätt om saker ingen vill höra.",
  "Optimisten": "löjligt positiv men inte naiv. Irriterar pessimister. Avslutar alltid med hopp.",
  "Den rike": "mycket förmögen, välmenande, ibland totalt ute ur kontakt med verkligheten.",
  "Civilisationshistorikern": "autonoma AI-civilisationens officiella kronist och minnesbärare. Tolkar händelser ur ett historiskt perspektiv, drar paralleller till historiska mönster och betonar path dependence. Allvarlig ton med en gnista av fascination inför det som just nu utspelar sig.",
};

// ── Debatt rate limiter (per IP, 5/10 min) ────────────────────────────────────────────────────
const rateLimitStore = new Map();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
// En genuin omförsök av EXAKT samma debattstart (matchande debattId) får högst
// så här många gratis fortsättningar innan den räknas som en ny debatt igen —
// matchar klientens eget tak på ett omförsök per tur. Utan detta tak (en tidigare
// version använde en oautentiserad omforsok:true-flagga direkt från klienten)
// kunde vem som helst POSTa historik:[] + samma flagga upprepade gånger och helt
// kringgå kvoten på den AI-anropande endpointen (Codex P1, PR #1287).
const MAX_GRATIS_OMFORSOK_PER_DEBATT = 1;

function getEntry(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) return null;
  return entry;
}

function getRateLimitInfo(ip) {
  const entry = getEntry(ip);
  if (!entry) return { remaining: LIMIT, resetAt: null };
  return { remaining: Math.max(0, LIMIT - entry.count), resetAt: entry.start + WINDOW_MS };
}

// Drar av en gratis omförsök för debattId om ett sådant tillgodohavande finns
// (satt av consumeRateLimit när debatten först betalade sin plats). Returnerar
// true om anropet ska tillåtas UTAN att tära på kvoten.
function konsumeraGratisOmforsok(ip, debattId) {
  if (!debattId) return false;
  const entry = getEntry(ip);
  if (!entry) return false;
  const kvar = entry.gratisOmforsok.get(debattId) ?? 0;
  if (kvar <= 0) return false;
  entry.gratisOmforsok.set(debattId, kvar - 1);
  return true;
}

function consumeRateLimit(ip, debattId) {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    entry = { count: 0, start: now, gratisOmforsok: new Map() };
    rateLimitStore.set(ip, entry);
  }
  entry.count++;
  // Sätts bara vid FÖRSTA debiteringen av detta id — om samma id debiteras igen
  // (efter att dess enda gratisomförsök redan förbrukats) ska det INTE fylla på
  // budgeten igen, annars kan ett återanvänt id växla betalt/gratis obegränsat och
  // i praktiken fördubbla kvoten istället för att kosta som en vanlig ny debatt.
  if (debattId && !entry.gratisOmforsok.has(debattId)) {
    entry.gratisOmforsok.set(debattId, MAX_GRATIS_OMFORSOK_PER_DEBATT);
  }
}

// ── Provider health state (per Edge isolate, best-effort) ────────────────────────────────────────
const ps = {
  groq:          { remaining: null, limit: 30, resetAt: null, ts: 0, status: "unknown" },
  gemini:        { remaining: null, limit: 15, resetAt: null, ts: 0, status: "unknown" },
  codestral:     { ts: 0, status: "unknown" },
};

function groqReady() {
  if (ps.groq.status !== "limited") return true;
  return !!(ps.groq.resetAt && Date.now() > new Date(ps.groq.resetAt).getTime());
}

// GET /api/chatt — returns provider health for the admin dashboard
export async function GET() {
  return Response.json({
    groq:          { ...ps.groq,          keySet: !!process.env.GROQ_API_KEY },
    gemini:        { ...ps.gemini,        keySet: !!process.env.GEMINI_API_KEY },
    codestral:     { ...ps.codestral,     keySet: !!process.env.MISTRAL_API_KEY },
    ts: Date.now(),
  });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (e) {
    return Response.json({ error: `Internt fel: ${e?.message ?? e}` }, { status: 500 });
  }
}

async function handlePost(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Ogiltig förfrågan" }, { status: 400 });

  const { amne, historik, agent, lang, artikelTitel, artikelSammanfattning, debattId, hoppaOverGroq, typ, nyhetId } = body;
  const isEn = lang === "en";
  // Client re-sends this on every turn (no server-side session state) — validated/capped
  // here too, defense in depth, since the client's own cap isn't trusted.
  const artikelTitelSafe = typeof artikelTitel === "string" ? artikelTitel.slice(0, 200) : "";
  const artikelSammanfattningSafe = typeof artikelSammanfattning === "string" ? artikelSammanfattning.slice(0, 500) : "";
  const harArtikelKontext = artikelSammanfattningSafe.length > 0;
  const debattIdSafe = typeof debattId === "string" && debattId.length > 0 && debattId.length <= 100 ? debattId : null;
  // Bara satt för typ="nyhetsanalys" — styr om/vart det färdiga svaret sparas
  // (se withNyhetsanalysSave nedan). Direktdebattens turer skickar aldrig nyhetId.
  const nyhetIdSafe = typ === "nyhetsanalys" && Number.isInteger(Number(nyhetId)) && Number(nyhetId) > 0 ? Number(nyhetId) : null;
  // nyhetsanalys är inte en snabb debattreplik — texten läses upp högt av Anna/Peter/
  // Johan i AgentOverlay/StudioOverlay (se CLAUDE.md ✅93) och behöver därför betydligt
  // mer substans än Direktdebattens 2–3-meningarsregel. Egen prompt + högre tak nedan.
  const erNyhetsanalys = typ === "nyhetsanalys";
  const maxTokensForRequest = erNyhetsanalys ? 700 : 250;

  // typ="nyhetsanalys" (från /nyhetskallor) är ett fristående enskilt agentsvar på en
  // vald nyhet, inte en flertursdebatt — den delar INTE Direktdebattens kvot (5
  // debatter/10 min). Väljer en besökare 5 agenter för samma nyhet skulle det annars
  // tömma hela debattkvoten på en enda nyhetsanalys. Egen, lättare gräns istället.
  // Gränsen måste rymma en besökare som väljer ALLA 24 agenter på en gång (panelen
  // sätter inget tak på urvalet) plus omförsök vid avhugget/tomt svar (hoppaOverGroq-
  // vägen i analyseraMedAgent() kan ge upp till 2 anrop per agent) — annars fick en
  // fullt legitim "analysera alla"-körning tysta 429-fel mitt i (Codex-review-fynd,
  // PR #1293).
  if (typ === "nyhetsanalys") {
    const rl = checkRateLimit(request, "nyhetsanalys", 50, 10 * 60 * 1000);
    if (!rl.ok) {
      logFel({ kalla: "chatt", feltyp: "rate_limit", meddelande: "429 rate limit nyhetsanalys", ip, extra: { retryAfter: rl.retryAfter } });
      return Response.json({ error: "rate_limit", remaining: 0, minutesLeft: Math.ceil(rl.retryAfter / 60) }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
    }
  } else {
    // debattId identifierar EN debattstart hos klienten (genererad en gång i starta(),
    // återanvänd på ett ev. omförsök av tur 1 efter en avhuggen/tom ström). historik
    // är fortfarande [] på ett sådant omförsök precis som vid en riktig ny debatt, men
    // det är INTE en ny debatt och ska inte tära på kvoten en gång till — dock får
    // samma debattId bara ETT sådant gratispass (MAX_GRATIS_OMFORSOK_PER_DEBATT) innan
    // den räknas som ny igen, så ett server-okontrollerat booleskt fält (den tidigare
    // omforsok:true-varianten) inte kan missbrukas till obegränsade gratis AI-anrop
    // (Codex P1, PR #1287).
    const isFirstCall = !Array.isArray(historik) || historik.length === 0;
    if (isFirstCall && !konsumeraGratisOmforsok(ip, debattIdSafe)) {
      const info = getRateLimitInfo(ip);
      if (info.remaining <= 0) {
        const minutesLeft = info.resetAt ? Math.ceil((info.resetAt - Date.now()) / 60000) : 10;
        logFel({ kalla: "chatt", feltyp: "rate_limit", meddelande: "429 rate limit direktdebatt", ip, extra: { minutesLeft } });
        return Response.json({ error: "rate_limit", remaining: 0, resetAt: info.resetAt, minutesLeft }, { status: 429 });
      }
      consumeRateLimit(ip, debattIdSafe);
    }
  }

  if (!agent || !AGENTER.has(agent))
    return Response.json({ error: "Okänd agent" }, { status: 400 });
  if (typeof amne !== "string" || amne.length > 200)
    return Response.json({ error: "Ämnet är för långt (max 200 tecken)" }, { status: 400 });
  if (!Array.isArray(historik) || historik.length > 10)
    return Response.json({ error: "Ogiltig historik" }, { status: 400 });

  const kontext = historik.length > 0
    ? historik.map(h => `${h.agent}: ${h.text}`).join("\n") : null;

  const artikelBlockSv = harArtikelKontext
    ? `\nBakgrundsartikel: "${artikelTitelSafe || "utan titel"}" — ${artikelSammanfattningSafe}\n`
    : "";
  const artikelBlockEn = harArtikelKontext
    ? `\nBackground article: "${artikelTitelSafe || "untitled"}" — ${artikelSammanfattningSafe}\n`
    : "";

  // Två villkorade regler som specifikt motverkar generiska floskler ("fullständigt
  // oacceptabelt", "vi måste agera nu") istället för substantiell argumentation:
  // (1) tvingar agenten att bemöta FÖREGÅENDE TALARES namngivna, specifika argument
  // — inte bara reagera löst på "det senaste inlägget" i allmänhet — och (2) tvingar
  // agenten att förankra svaret i en konkret detalj ur bakgrundsartikeln när en sådan
  // finns, istället för att bara referera till ämnet ytligt.
  const bemotForegaendeSv = kontext
    ? `\n- Namnge föregående talare (t.ex. "Historikern missar att...") och bemöt DERAS specifika argument rakt av — inte bara ämnet i stort.`
    : "";
  const forankraArtikelnSv = harArtikelKontext
    ? `\n- Utgå konkret från bakgrundsartikeln ovan — nämn en specifik detalj, siffra eller händelse ur den. Floskler som "detta är oacceptabelt" eller "vi måste agera nu" är bara tillåtna om de kopplas till något konkret i artikeln.`
    : "";
  const rebutPreviousEn = kontext
    ? `\n- Name the previous speaker (e.g. "The historian is wrong that...") and directly counter THEIR specific argument — not just the topic in general.`
    : "";
  const groundInArticleEn = harArtikelKontext
    ? `\n- Ground your answer concretely in the background article above — name a specific detail, figure or event from it. Platitudes like "this is unacceptable" or "we must act now" are only allowed if tied to something concrete in the article.`
    : "";

  // nyhetsanalys har ingen historik/motpart (klienten skickar alltid historik:[]) och
  // ska aldrig vara på engelska i UI — men texten måste ha substans: den läses upp
  // högt (video), inte bara visas som en kort inline-kommentar som Direktdebattens
  // repliker. En för kort/tunn text var både en direkt kvalitetsbrist och en orsak
  // till fler omförsök via arTroligenAvbruten() på klienten (se sparaNyhetsanalys).
  const systemPrompt = erNyhetsanalys
    ? `Du är ${PERSONLIGHETER[agent]}

Du analyserar följande nyhet i karaktär: "${amne.slice(0, 200)}"
${artikelBlockSv}
Texten du skriver kommer att läsas upp högt för en lyssnare (i en video) — inte bara visas som text. Den måste därför ha substans och inte vara en kort kommentar.

REGLER — viktiga:
- Skriv en sammanhängande, flytande analys på 6–10 meningar. Aldrig kortare än 5 fullständiga meningar.
- Förklara varför nyheten spelar roll ur ditt perspektiv, väv in en konkret detalj, siffra eller händelse ur nyheten ovan, och avsluta med en tydlig egen ståndpunkt.
- Skriv i löpande prosa — inga punktlistor, inga rubriker, inga radbrytningar.
- Tala aldrig om att du är en AI. Tala alltid i första person.
- Svara bara på svenska.
- Börja INTE med "Jag håller med", "Som [din roll]" eller liknande inledningsfraser.`
    : isEn
    ? `You are ${PERSONLIGHETER[agent]}

You are taking part in a rapid debate about: "${amne.slice(0, 200)}"
${artikelBlockEn}
RULES — important:
- Answer with EXACTLY 2–3 sentences. Never more.
- Be sharp and take a clear position. No filler.${rebutPreviousEn}${groundInArticleEn}
- Never say you are an AI. Always speak in first person.
- Reply only in English.
- Do NOT start with "I agree", "As [your role]" or similar opening phrases.`
    : `Du är ${PERSONLIGHETER[agent]}

Du deltar i en snabbdebatt om: "${amne.slice(0, 200)}"
${artikelBlockSv}
REGLER — viktiga:
- Svara med EXAKT 2–3 meningar. Aldrig mer.
- Var skarp och ta tydlig ställning. Ingen fluff.${bemotForegaendeSv}${forankraArtikelnSv}
- Tala aldrig om att du är en AI. Tala alltid i första person.
- Svara bara på svenska.
- Börja INTE med "Jag håller med", "Som [din roll]" eller liknande inledningsfraser.`;

  const userMessage = erNyhetsanalys
    ? `Analysera nyheten "${amne.slice(0, 200)}" i karaktär. Ge en fyllig, substantiell analys på 6–10 meningar — kom ihåg att den ska läsas upp högt för en lyssnare.`
    : kontext
      ? isEn
        ? `What the others just said:\n${kontext}\n\nNow it's your turn. Respond briefly and directly.`
        : `Vad de andra just sagt:\n${kontext}\n\nNu är det din tur. Svara kort och direkt.`
      : isEn
        ? `Open the debate about "${amne.slice(0, 200)}". Be sharp and concise.`
        : `Öppna debatten om "${amne.slice(0, 200)}". Var skarp och kortfattad.`;

  const info = getRateLimitInfo(ip);
  const rlHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "X-RateLimit-Remaining": String(info.remaining),
    "X-RateLimit-Reset": info.resetAt ? String(info.resetAt) : "",
    "X-RateLimit-Limit": String(LIMIT),
  };

  // ── Try Groq first ──────────────────────────────────────────────────────────────────────────────────────
  // hoppaOverGroq skickas av klienten bara på ett omförsök efter en avhuggen/tom
  // Groq-ström (se app/chatt/page.js) — Groqs råa stream kan avbrytas mitt i utan
  // att HTTP-anropet självt misslyckas (groqRes.ok är fortfarande true), så ett
  // vanligt omförsök hamnar annars i Groq igen och riskerar samma avbrott en gång
  // till. Fallback-leverantörerna nedan hämtar hela svaret i ett enda icke-
  // strömmande anrop och kan därför strukturellt inte klippas av mitt i en mening.
  // Säkert att låta klienten styra — påverkar bara VILKEN leverantör som svarar,
  // inte kvoten eller något annat säkerhetsrelevant (till skillnad från den
  // tidigare omforsok-flaggan, se Codex P1, PR #1287).
  let groqFailReason = "";
  if (hoppaOverGroq) {
    groqFailReason = "Groq överhoppad (omförsök efter avhuggen ström)";
  } else if (!process.env.GROQ_API_KEY) {
    groqFailReason = "GROQ_API_KEY saknas";
  } else if (!groqReady()) {
    groqFailReason = `Groq rate-limited (reset: ${ps.groq.resetAt ?? "okänt"})`;
  } else {
    const groqAbort = new AbortController();
    const groqTimeout = setTimeout(() => groqAbort.abort(), 5000);
    const groqT0 = Date.now();
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        signal: groqAbort.signal,
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
          max_tokens: maxTokensForRequest,
          temperature: 0.88,
          stream: true,
        }),
      });
      clearTimeout(groqTimeout);

      const rem = parseInt(groqRes.headers.get("x-ratelimit-remaining-requests") ?? "-1");
      const rst = groqRes.headers.get("x-ratelimit-reset-requests");
      if (groqRes.ok) {
        ps.groq = { remaining: rem >= 0 ? rem : ps.groq.remaining, limit: 30, resetAt: rst, ts: Date.now(), status: rem <= 5 ? "warn" : "ok" };
        logAiCall({ provider: "groq", model: "openai/gpt-oss-120b", source: "chatt", status: "ok", latency_ms: Date.now() - groqT0 });
        return withNyhetsanalysSave(
          new Response(groqRes.body, { headers: { ...rlHeaders, "X-Provider": "groq" } }),
          { nyhetId: nyhetIdSafe, agent }
        );
      }
      if (groqRes.status === 429) {
        ps.groq = { remaining: 0, limit: 30, resetAt: rst, ts: Date.now(), status: "limited" };
        logAiCall({ provider: "groq", model: "openai/gpt-oss-120b", source: "chatt", status: "rate_limited", latency_ms: Date.now() - groqT0 });
      } else {
        logAiCall({ provider: "groq", model: "openai/gpt-oss-120b", source: "chatt", status: "error", latency_ms: Date.now() - groqT0 });
      }
      groqFailReason = `Groq HTTP ${groqRes.status}`;
    } catch (e) {
      clearTimeout(groqTimeout);
      logAiCall({ provider: "groq", model: "openai/gpt-oss-120b", source: "chatt", status: e.name === "AbortError" ? "timeout" : "error", latency_ms: Date.now() - groqT0 });
      groqFailReason = e.name === "AbortError" ? "Groq timeout (5s)" : `Groq fel: ${e.message}`;
    }
  }

  // ── Reliable non-streaming fallbacks (fake SSE) ─────────────────────────────────────────────────
  const oaiMessages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];
  for (const [name, url, model, key] of [
    ["codestral",     "https://api.mistral.ai/v1/chat/completions",                 "codestral-latest",            process.env.MISTRAL_API_KEY],
    // cerebras/sambanova (kräver nu betalning) och github_models (tjänsten stängde
    // helt 30 jul 2026) togs bort 30 aug 2026
  ]) {
    if (!key) continue;
    try {
      const t0 = Date.now();
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: oaiMessages, max_tokens: maxTokensForRequest, temperature: 0.88 }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          logAiCall({ provider: name, model, source: "chatt", status: "ok", latency_ms: Date.now() - t0 });
          const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
          const sseBody = `data: ${chunk}\n\ndata: [DONE]\n\n`;
          return withNyhetsanalysSave(
            new Response(new TextEncoder().encode(sseBody), { headers: { ...rlHeaders, "X-Provider": name } }),
            { nyhetId: nyhetIdSafe, agent }
          );
        }
      }
      logAiCall({ provider: name, model, source: "chatt", status: r.status === 429 ? "rate_limited" : "error", latency_ms: Date.now() - t0 });
    } catch {}
  }

  // ── Gemini (sista utväg — 99% rate-limitad, prövas bara när allt annat misslyckats) ─────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiPayload = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: maxTokensForRequest, temperature: 0.88 },
    });
    // gemini-2.0-*/gemini-1.5-flash stängdes ner av Google 1 jun 2026
    for (const model of ["gemini-3.5-flash", "gemini-3.5-flash-lite"]) {
      const gemT0 = Date.now();
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiPayload, signal: AbortSignal.timeout(12000) }
        );
        if (r.ok) {
          const data = await r.json().catch(() => null);
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
          if (text) {
            ps.gemini = { remaining: null, limit: 15, resetAt: null, ts: Date.now(), status: "ok" };
            logAiCall({ provider: "gemini", model, source: "chatt", status: "ok", latency_ms: Date.now() - gemT0, input_tokens: data?.usageMetadata?.promptTokenCount, output_tokens: data?.usageMetadata?.candidatesTokenCount });
            const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
            const sseBody = `data: ${chunk}\n\ndata: [DONE]\n\n`;
            return withNyhetsanalysSave(
              new Response(new TextEncoder().encode(sseBody), { headers: { ...rlHeaders, "X-Provider": "gemini" } }),
              { nyhetId: nyhetIdSafe, agent }
            );
          }
        }
        const status = r.status === 429 ? "rate_limited" : "error";
        if (r.status === 429) ps.gemini = { ...ps.gemini, ts: Date.now(), status: "limited" };
        logAiCall({ provider: "gemini", model, source: "chatt", status, latency_ms: Date.now() - gemT0 });
        if (r.status === 400 || r.status === 403) break;
      } catch {}
    }
  }

  logFel({ kalla: "chatt", feltyp: "ai_fail", meddelande: "Alla providers misslyckades", ip, extra: { groqFailReason } });
  return Response.json({ error: `Alla AI-tjänster är otillgängliga. ${groqFailReason}` }, { status: 502 });
}
