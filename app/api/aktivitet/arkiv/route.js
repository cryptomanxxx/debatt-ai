/**
 * GET /api/aktivitet/arkiv?cursor=<ISO>&hopp=<N> — paginerad fortsättning av
 * Senaste aktivitet-arkivet på /aktivitet (✅107).
 *
 * Till skillnad från /api/aktivitet (startsidans widget, fast topp-10 med
 * garanterade artikelplatser) returnerar den här routen SIDA EFTER SIDA av
 * hela den kombinerade, tidssorterade händelselistan — ingen typ
 * prioriteras, allt visas i sin genuina kronologiska ordning.
 *
 * Cursor-baserad paginering (samma mönster som /nyhetskallors "Ladda fler",
 * ✅93): `cursor` är den senast visade radens `skapad`-tidsstämpel, `hopp`
 * (Codex-fynd, PR #1427-granskning) hur många rader med EXAKT den
 * tidsstämpeln som redan konsumerats — se paginateAktivitet() i
 * app/lib/aktivitetFeed.js för varför en ren tidsstämpel inte räcker som
 * cursor. Både denna route och SSR-sidan (app/aktivitet/page.js) läser ur
 * samma delade, kortlivade cache (hamtaAktivitetArkivCachat()) — annars kan
 * en cursor utfärdad av den ena peka på en position som inte finns i den
 * andras separat hämtade ögonblicksbild (samma Codex-fynd).
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

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const hopp = parseInt(searchParams.get("hopp") || "0", 10) || 0;

  try {
    const alla = await hamtaAktivitetArkivCachat();
    const { sida, nastaCursor, nastaHopp } = paginateAktivitet(alla, cursor, hopp);
    return NextResponse.json(
      { handelser: sida, nastaCursor, nastaHopp },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ handelser: [], nastaCursor: null, nastaHopp: 0 }, { status: 200 });
  }
}
