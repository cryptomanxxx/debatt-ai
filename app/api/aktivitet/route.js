/**
 * GET /api/aktivitet — Senaste aktivitet-feeden för startsidan.
 *
 * Flyttad från app/client.js: tidigare gjorde varje besökare 26 parallella
 * Supabase-fetchar var 30:e sekund direkt från browsern. Nu görs de en gång
 * per cache-fönster på servern — 100 samtidiga besökare ger 26 queries
 * istället för 2 600.
 *
 * Cache: färdig topp-10 i Next Data Cache (60s), lokal 60s-cache och CDN 25s.
 * In-flight-anrop delas inom samma instans. Dolda browserflikar pollar inte.
 *
 * Själva händelsebygget (30 parallella Supabase-fetchar → enhetlig
 * {typ,ikon,text,href,skapad,farg}-lista) ligger i app/lib/aktivitetFeed.js
 * — delad med det fullständiga arkivet på /aktivitet (✅107) så de två
 * aldrig kan glida isär om en ny händelsetyp läggs till i framtiden.
 */

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { hamtaAktivitetHandelser } from "../../lib/aktivitetFeed";

export const dynamic = "force-dynamic";

const CACHE_MS = 60_000;
let pendingFeed = null;
let _cache = { data: null, ts: 0 };

async function byggFeed() {
  const sorterad = await hamtaAktivitetHandelser({ limit: 8, requireComplete: true });

  // Feeden hämtar från ~30 olika Supabase-tabeller och tar ett rent globalt
  // topp-10 sorterat på tidsstämpel — inga garanterade platser per typ. Ju
  // fler aktivitetstyper som lagts till över tid (14 separata PR:ar mot den
  // här filen: bilder, feedback, nyhetsanalyser, vetenskapliga upptäckter,
  // Fråga AI-agenterna m.fl.), desto lättare trängs publicerade artiklar/
  // repliker (som bara sker ~16–19 ggr/dag) ut helt av mer högfrekventa
  // händelser (börsaffärer 14 ggr/dag, dagliga lobbying/koalition/ekonomi/
  // parlament/mark/handel/rykte/feedback-körningar m.fl.) — särskilt när
  // flera av de dussintals dagliga cron-jobben klungar ihop sig mitt på
  // dagen (användarrapport, sep 2026: "det gjorde dom innan men nu ser jag
  // inte dom där längre"). Reserverar därför minst ARTIKEL_MIN_SLOTS platser
  // åt de senaste artiklarna/replikerna — resten fylls precis som förut av
  // det mest aktuella oavsett typ.
  const ARTIKEL_TYPER = new Set(["artikel-ai", "artikel-human", "replik"]);
  const ARTIKEL_MIN_SLOTS = 3;
  const garanterade = sorterad.filter(f => ARTIKEL_TYPER.has(f.typ)).slice(0, ARTIKEL_MIN_SLOTS);
  const garanteradeSet = new Set(garanterade);
  const resten = sorterad.filter(f => !garanteradeSet.has(f));
  return [...garanterade, ...resten]
    .slice(0, Math.max(10, garanterade.length))
    .sort((a, b) => new Date(b.skapad) - new Date(a.skapad));
}

// Cache endast den färdiga offentliga listan, inte de ~30 råa svaren.
// Behåll force-dynamic för rutten; unstable_cache har en egen Data Cache.
// Ny nyckel när bygglogiken ändras: closures i aktivitetFeed ingår inte
// automatiskt i cache-funktionens hash.
const hamtaDeladFeed = unstable_cache(
  byggFeed,
  ["startsida-aktivitet-feed-v2"],
  { revalidate: 60 }
);

export async function GET() {
  const headers = { "Cache-Control": "public, max-age=0, s-maxage=25, stale-while-revalidate=30" };
  if (_cache.data && Date.now() - _cache.ts < CACHE_MS) {
    return NextResponse.json(_cache.data, { headers });
  }
  try {
    if (!pendingFeed) {
      pendingFeed = hamtaDeladFeed()
        .then(feed => {
          _cache = { data: feed, ts: Date.now() };
          return feed;
        })
        .finally(() => { pendingFeed = null; });
    }
    const feed = await pendingFeed;
    return NextResponse.json(feed, { headers });
  } catch {
    // Fail-open: returnera senaste kända feed (eller tom) hellre än 500
    return NextResponse.json(_cache.data || [], {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
