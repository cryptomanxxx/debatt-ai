/**
 * GET /api/nav-count — antal artiklar och direktdebatter för navigeringens
 * räknare ("Arkiv (N)", "Debatthistorik (N)").
 *
 * Tidigare hämtade varje besökares webbläsare id:t för varje artikel och varje
 * debatt direkt från Supabase vid varje sidvisning (NavArkivLink/
 * NavHistorikLink finns i GlobalNav på alla sidor). Det gav två ocachade
 * Supabase-anrop per sidvisning och fyllde loggkvoten. Dessutom capade
 * PostgREST svaret vid max-rows (1000), så räknarna kunde visa fel siffra.
 *
 * Nu räknas båda en gång per cachefönster på servern med HEAD + count=exact
 * (bara totalen läses ur content-range, inga rader skickas), och svaret cachas
 * även i CDN:en.
 */

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CACHE_SEKUNDER = 900;

async function rakna(tabell) {
  const res = await fetch(`${SB_URL}/rest/v1/${tabell}?select=id&limit=1`, {
    method: "HEAD",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: "count=exact" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  // content-range: "0-0/1834" (eller "*/0" för en tom tabell)
  const total = res.headers.get("content-range")?.split("/")[1];
  return /^\d+$/.test(total || "") ? Number(total) : null;
}

const hamtaAntal = unstable_cache(
  async () => {
    const [artiklar, debatter] = await Promise.all([rakna("artiklar"), rakna("chatt_debatter")]);
    // Kasta vid fel så att ett misslyckat anrop aldrig cachas i 15 minuter.
    if (artiklar === null && debatter === null) throw new Error("nav-count: inga svar");
    return { artiklar, debatter };
  },
  ["nav-count-v1"],
  { revalidate: CACHE_SEKUNDER }
);

export async function GET() {
  try {
    const data = await hamtaAntal();
    return NextResponse.json(data, {
      headers: { "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SEKUNDER}, stale-while-revalidate=3600` },
    });
  } catch {
    return NextResponse.json({ artiklar: null, debatter: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
