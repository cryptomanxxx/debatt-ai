/**
 * GET /api/aktivitet/arkiv?cursor=<ISO> — paginerad fortsättning av
 * Senaste aktivitet-arkivet på /aktivitet (✅107).
 *
 * Till skillnad från /api/aktivitet (startsidans widget, fast topp-10 med
 * garanterade artikelplatser) returnerar den här routen SIDA EFTER SIDA av
 * hela den kombinerade, tidssorterade händelselistan — ingen typ
 * prioriteras, allt visas i sin genuina kronologiska ordning.
 *
 * Cursor-baserad paginering (samma mönster som /nyhetskallors "Ladda fler",
 * ✅93): `cursor` är den senast visade radens `skapad`-tidsstämpel, nästa
 * sida är allt äldre än den. En bred, kortlivad batch (60s in-memory-cache,
 * samma princip som /api/aktivitet) hämtas med ett större per-källa-urval
 * (ARKIV_LIMIT_PER_KALLA) än startsidans widget — annars skulle en enskild
 * "Ladda fler"-sida längre bak i tiden kunna sakna kandidater från
 * lågfrekventa källor bara för att de redan runnit ut ur den mindre
 * widget-batchen.
 *
 * Känd begränsning: paginering längre tillbaka än vad ARKIV_LIMIT_PER_KALLA
 * rader/källa täcker kan ge samma typ av "vissa källor trängs ut"-problem
 * som ✅106 löste för startsidan, fast i miniatyr vid den bortre kanten av
 * arkivet — en högfrekvent källa (t.ex. bors_affarer) kan ha uttömt sin
 * batch innan en lågfrekvent källas äldre rader når fram. En proportionerlig
 * avvägning, inte en fullständig lösning — samma princip som redan används
 * på flera ställen i den här kodbasen (se t.ex. ✅93 "Kvarvarande
 * skräprader").
 */

import { NextResponse } from "next/server";
import { hamtaAktivitetHandelser, AKTIVITET_ARKIV_SID_STORLEK, AKTIVITET_ARKIV_LIMIT_PER_KALLA } from "../../../lib/aktivitetFeed";

export const dynamic = "force-dynamic";

const CACHE_MS = 60_000;
let _cache = { data: null, ts: 0 };

async function hamtaAllaCachat() {
  if (_cache.data && Date.now() - _cache.ts < CACHE_MS) return _cache.data;
  const alla = await hamtaAktivitetHandelser({ limit: AKTIVITET_ARKIV_LIMIT_PER_KALLA });
  _cache = { data: alla, ts: Date.now() };
  return alla;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  try {
    const alla = await hamtaAllaCachat();
    const cursorMs = cursor ? new Date(cursor).getTime() : null;
    const filtrerad = cursorMs && !Number.isNaN(cursorMs)
      ? alla.filter(h => new Date(h.skapad).getTime() < cursorMs)
      : alla;
    const sida = filtrerad.slice(0, AKTIVITET_ARKIV_SID_STORLEK);
    const nastaCursor = sida.length === AKTIVITET_ARKIV_SID_STORLEK ? sida[sida.length - 1].skapad : null;
    return NextResponse.json(
      { handelser: sida, nastaCursor },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ handelser: [], nastaCursor: null }, { status: 200 });
  }
}
