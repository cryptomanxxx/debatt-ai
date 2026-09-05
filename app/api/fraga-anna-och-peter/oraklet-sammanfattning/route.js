// POST /api/fraga-anna-och-peter/oraklet-sammanfattning — Oraklet-läget för
// URL-fältet på "Fråga AI-agenterna" (/fraga-anna-och-peter).
//
// Historik: knappen "🎓 Oraklet förklarar den" läste tidigare bara upp den
// korta og:description-teasern som hamtaUrl() redan hämtat via
// /api/chatt/artikel-kontext (default-läge, ~500 tecken) — samma text som
// Anna/Peter/Johan läser, ingen sammanfattning, ingen översättning. En
// engelsk källa gav alltså en engelsk uppläsning. Användarrapport: "Hämtar
// han hela texten, översätter texten och sammanfattar artiklen på svenska
// och läser upp den?" — svaret var nej, så den här routen ger Oraklet
// specifikt samma djupare pipeline som redan finns på /universitet
// (Vetenskapliga Nyheter / Läslistan): hämta HELA artikelns brödtext, kör
// den genom en LLM som ignorerar sidchrome och skriver en svensk
// sammanfattning + ev. översatt rubrik.
//
// Skiljer sig från /api/nyhetsflode/forbered-lasning genom att INTE cacha
// något i Supabase — URL:en här är en godtycklig, besökarinskickad länk utan
// någon egen rad i nyhetsflode att cacha mot (till skillnad från Oraklets
// Läslista/Vetenskapliga Nyheter, som alltid utgår från en befintlig
// nyhetsflode-rad). Varje anrop kör alltså om hämtningen+sammanfattningen —
// rimligt för en sida där varje besökare typiskt klistrar in en annan länk.
//
// Fail-open: misslyckas hämtningen returneras ett fel (klienten faller då
// tillbaka på den redan hämtade korta teasern, precis som innan). Misslyckas
// bara LLM-sammanfattningen läses den råa (men chrome-strippade) brödtexten
// upp istället — ingen översättning i det fallet, men fortfarande mer text
// än den korta teasern.
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { hamtaArtikelInnehall } from "../../../lib/hamtaArtikelInnehall";
import { sammanfattaForOraklet } from "../../../lib/sammanfattaForOraklet";

const KALLMATERIAL_MAX = 8000;

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "fraga-oraklet-sammanfattning", 20, 10 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ error: "För många förfrågningar." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const { url } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim() || url.length > 2000) {
    return Response.json({ error: "Ogiltig URL" }, { status: 400 });
  }

  const result = await hamtaArtikelInnehall(url, { helText: true });
  if (!result.ok) {
    const status = result.fel === "ingen_text" ? 422 : (result.fel === "ogiltig_url" || result.fel === "url_format") ? 400 : 502;
    if (status === 502) {
      logFel({ kalla: "fraga-anna-och-peter/oraklet-sammanfattning", feltyp: "hamtning_fail", meddelande: result.fel, ip, extra: { url: url.slice(0, 300) } });
    }
    return Response.json({ error: result.publiktFel }, { status });
  }

  const rubrikFallback = result.titel || "";
  const kallmaterial = result.sammanfattning.slice(0, KALLMATERIAL_MAX);

  let genererat = null;
  try {
    genererat = await sammanfattaForOraklet(rubrikFallback, kallmaterial);
  } catch (e) {
    logFel({ kalla: "fraga-anna-och-peter/oraklet-sammanfattning", feltyp: "sammanfattning_fail", meddelande: String(e?.message || e), ip, extra: { url: url.slice(0, 300) } });
  }

  // LLM-anropet misslyckades — läs upp den råa (men chrome-strippade)
  // brödtexten istället för att inte läsa alls. Ingen översättning i det
  // fallet, men fortfarande mer text än den korta og:description-teasern.
  if (!genererat) {
    return Response.json({ titel: rubrikFallback, sammanfattning: kallmaterial, url: result.url });
  }

  return Response.json({
    titel: genererat.rubrik || rubrikFallback,
    sammanfattning: genererat.sammanfattning,
    url: result.url,
  });
}
