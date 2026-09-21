// POST /api/nyhetsflode/importera-youtube — besökare klistrar in en länk
// till en YouTube-video på /nyhetskallor, precis som den redan befintliga
// "Importera en nyhetsartikel" (app/api/nyhetsflode/importera/route.js),
// fast för video istället för en artikel-URL.
//
// Video-id:t extraheras/valideras server-side via app/lib/youtube.js →
// extraheraYoutubeId() — samma modul som ✅121s artikel-embedding redan
// använder för att aldrig lita på en rå, klient-inskickad URL. Titel och
// kanalnamn hämtas via YouTubes publika oEmbed-endpoint (ingen API-nyckel
// krävs). Målhosten (youtube.com) är fast och aldrig besökarstyrd, så
// samma SSRF-skydd som artikelimporten (hamtaArtikelInnehall.js) behövs
// inte här.
//
// kalla formateras "YouTube: {kanal} (besökarimport)" — matchar EXAKT
// samma "YouTube: {kanal_namn}"-prefix som nyheter.py → hamta_youtube_
// nyheter() redan använder för de automatiskt hämtade YouTube-nyheterna
// (se nyheter.py rad ~196). Det gör att en importerad video, precis som en
// automatiskt hämtad, flödar rätt genom den redan befintliga pipelinen:
// analyseras på /nyhetskallor → nyhetsanalys → "Föreslå artikelämne"
// (/nyhetsanalyser) → /api/nyhetsval → amnesforslag.kalla_namn →
// agent.py:s forslag_amne-gren, vars `forslag_kalla_namn.startswith(
// "YouTube: ")`-koll (se CLAUDE.md ✅121, Codex-fynd PR #1468) sätter
// youtube_url så videon bäddas in direkt i den färdiga artikeln — inte
// bara länkas i källhänvisningen.
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { extraheraYoutubeId } from "../../../lib/youtube";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// nyhetsflode saknar anon-skrivpolicy (RLS) — service role krävs, samma
// mönster som den vanliga artikelimporten. Fallback till anon bevaras för
// miljöer utan secreten (skrivningen misslyckas då tyst mot RLS istället
// för att krascha routen).
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

const NYHETSFLODE_SELECT = "id,rubrik,beskrivning,kalla,url,publicerad,kategori,hamtad";

const YOUTUBE_PREFIX = "YouTube: ";
const BESOKARIMPORT_SUFFIX = " (besökarimport)";
const KALLA_MAX_TOTAL = 100;
const KANAL_MAX = KALLA_MAX_TOTAL - YOUTUBE_PREFIX.length - BESOKARIMPORT_SUFFIX.length;

const OEMBED_TIMEOUT_MS = 8000;

async function hamtaOembed(watchUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || typeof data.title !== "string" || !data.title.trim()) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "nyhetsflode-importera-youtube", 10, 60 * 60 * 1000);
  if (!rl.ok) {
    logFel({ kalla: "nyhetsflode/importera-youtube", feltyp: "rate_limit", meddelande: "429 rate limit", ip, extra: { retryAfter: rl.retryAfter } });
    return Response.json({ fel: "För många importer — försök igen om en stund." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const { url } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim() || url.length > 2000) {
    return Response.json({ fel: "Ogiltig länk." }, { status: 400 });
  }

  const videoId = extraheraYoutubeId(url.trim());
  if (!videoId) {
    return Response.json({ fel: "Kunde inte tolka länken som en YouTube-video." }, { status: 400 });
  }

  // Normaliserad watch-URL oavsett hur besökaren klistrade in länken
  // (youtu.be/shorts/embed/live m.fl.) — matchar exakt det format
  // nyheter.py själv skriver, och ger en entydig unique(url)-dedup oavsett
  // vilken variant av länken som pastas in.
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const oembed = await hamtaOembed(watchUrl);
  if (!oembed) {
    logFel({ kalla: "nyhetsflode/importera-youtube", feltyp: "oembed_fail", meddelande: "oEmbed misslyckades", ip, extra: { videoId } });
    return Response.json({ fel: "Videon kunde inte hittas — den kan vara privat, borttagen eller åldersbegränsad." }, { status: 422 });
  }

  const rubrik = oembed.title.trim().slice(0, 500);
  const kanal = (oembed.author_name || "Okänd kanal").trim().slice(0, KANAL_MAX);
  const kalla = `${YOUTUBE_PREFIX}${kanal}${BESOKARIMPORT_SUFFIX}`;

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
      beskrivning: null,
      kalla,
      url: watchUrl,
      kategori: [],
    }),
  });

  // unique(url) — samma video importerad (eller redan automatiskt hämtad
  // från en bevakad YouTube-kanal) sedan tidigare. Hämtar den befintliga
  // raden istället för att bara felas, så besökaren ser att videon redan
  // finns snarare än ett kryptiskt fel.
  if (insertRes.status === 409) {
    const existing = await fetch(
      `${SB_URL}/rest/v1/nyhetsflode?url=eq.${encodeURIComponent(watchUrl)}&select=${NYHETSFLODE_SELECT}`,
      { headers: { apikey: SB_WRITE_KEY, Authorization: `Bearer ${SB_WRITE_KEY}` } }
    );
    const rows = existing.ok ? await existing.json().catch(() => []) : [];
    if (rows[0]) return Response.json({ redanImporterad: true, rad: rows[0] });
    return Response.json({ fel: "Videon finns redan men kunde inte hämtas." }, { status: 500 });
  }

  if (!insertRes.ok) {
    const errText = await insertRes.text().catch(() => "");
    logFel({ kalla: "nyhetsflode/importera-youtube", feltyp: "supabase_fail", meddelande: `HTTP ${insertRes.status}`, ip, extra: { errText: errText.slice(0, 300) } });
    return Response.json({ fel: "Kunde inte spara videon." }, { status: 500 });
  }

  const rader = await insertRes.json().catch(() => []);
  return Response.json({ rad: rader?.[0] || null });
}
