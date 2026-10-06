/**
 * GET /api/startsida — all widgetdata för startsidan i ett anrop.
 *
 * Tidigare gjorde varje besökares webbläsare cirka 18 egna Supabase-anrop
 * vid varje besök på startsidan. Nu byggs svaret på servern och delas
 * mellan alla besökare: Next Data Cache 60 s och CDN 60 s.
 *
 * Bara kompletta svar cachas. Om någon källa misslyckas skickas det som
 * gick att hämta med no-store, så att nästa anrop försöker igen istället
 * för att en widget saknas under hela cachefönstret.
 */

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { hamtaStartsidaData } from "../../lib/startsidaData";

export const dynamic = "force-dynamic";

const CACHE_SEKUNDER = 60;

// Samtidiga anrop inom samma instans delar en pågående hämtning, så att en
// kall cache inte ger ett helt nytt bygge (cirka 23 Supabase-anrop) per
// anrop. Samma mönster som /api/aktivitet.
let pagaende = null;

class OfullstandigtSvar extends Error {
  constructor(data) {
    super("startsida: ofullständigt svar");
    this.data = data;
  }
}

const hamtaKomplett = unstable_cache(
  async () => {
    const { data, ofullstandig } = await hamtaStartsidaData();
    if (ofullstandig > 0) throw new OfullstandigtSvar(data);
    return data;
  },
  ["startsida-v1"],
  { revalidate: CACHE_SEKUNDER }
);

export async function GET() {
  try {
    if (!pagaende) pagaende = hamtaKomplett().finally(() => { pagaende = null; });
    const data = await pagaende;
    return NextResponse.json(data, {
      headers: { "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SEKUNDER}, stale-while-revalidate=120` },
    });
  } catch (e) {
    const data = e && typeof e.data === "object" ? e.data : {};
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  }
}
