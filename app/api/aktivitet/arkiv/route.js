/**
 * GET /api/aktivitet/arkiv?cursor=<ISO>&vid=<JSON> — paginerad fortsättning
 * av Senaste aktivitet-arkivet på /aktivitet (✅107).
 *
 * Till skillnad från /api/aktivitet (startsidans widget, fast topp-10 med
 * garanterade artikelplatser) returnerar den här routen SIDA EFTER SIDA av
 * hela den kombinerade, tidssorterade händelselistan — ingen typ
 * prioriteras, allt visas i sin genuina kronologiska ordning.
 *
 * Cursor-baserad paginering (samma mönster som /nyhetskallors "Ladda fler",
 * ✅93): `cursor` är den senast visade radens `skapad`-tidsstämpel, `vid`
 * (JSON-array, Codex-fynd PR #1431-granskning) identiteterna för de rader
 * med EXAKT den tidsstämpeln som redan visats — se paginateAktivitet() i
 * app/lib/aktivitetFeed.js för varför cursorn kodas så istället för ett
 * rent antal ("hopp"): ett antal förutsätter att nästa anrop löses upp mot
 * exakt samma array-instans, vilket INTE stämmer i produktion (/aktivitet
 * och den här routen är separata Vercel-funktioner, var och en med sin
 * egen bundlade kopia av cachen). Identitetsbaserad tie-breaking fungerar
 * korrekt oavsett vilken oberoende hämtning av samma underliggande data
 * som filtret körs mot.
 *
 * Känd begränsning: paginering längre tillbaka än vad
 * AKTIVITET_ARKIV_LIMIT_PER_KALLA rader/källa täcker kan ge samma typ av
 * "vissa källor trängs ut"-problem som ✅106 löste för startsidan, fast i
 * miniatyr vid den bortre kanten av arkivet — en högfrekvent källa (t.ex.
 * bors_affarer) kan ha uttömt sin batch innan en lågfrekvent källas äldre
 * rader når fram. En proportionerlig avvägning, inte en fullständig
 * lösning — samma princip som redan används på flera ställen i den här
 * kodbasen (se t.ex. ✅93 "Kvarvarande skräprader").
 */

import { NextResponse } from "next/server";
import { hamtaAktivitetArkivCachat, paginateAktivitet } from "../../../lib/aktivitetFeed";

export const dynamic = "force-dynamic";

function parseraVid(rawVid) {
  if (!rawVid) return [];
  try {
    const parsed = JSON.parse(rawVid);
    return Array.isArray(parsed) ? parsed.filter(v => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const vid = parseraVid(searchParams.get("vid"));

  try {
    const alla = await hamtaAktivitetArkivCachat();
    const { sida, nastaCursor, nastaVid } = paginateAktivitet(alla, cursor, vid);
    return NextResponse.json(
      { handelser: sida, nastaCursor, nastaVid },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ handelser: [], nastaCursor: null, nastaVid: [] }, { status: 200 });
  }
}
