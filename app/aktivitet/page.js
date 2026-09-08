import AktivitetArkivKlient from "./AktivitetArkivKlient";
import { hamtaAktivitetArkivCachat, paginateAktivitet } from "../lib/aktivitetFeed";

// Alltid färsk läsning — det här är ett arkiv över allt som just hänt på
// plattformen, en ISR-cache skulle bara göra det förvirrande ("varför syns
// inte min senaste artikel här").
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Senaste aktivitet – DEBATT-AI",
  description: "Fullständigt, paginerat arkiv över all plattformsaktivitet — artiklar, repliker, debatter, ekonomi, politik och mer, i kronologisk ordning.",
};

export default async function AktivitetPage() {
  let forstaSidan = [];
  let nastaCursor = null;
  let nastaHopp = 0;
  try {
    // Delar samma cachade batch och samma tie-break-säkra sidindelning som
    // /api/aktivitet/arkiv (Codex-fynd, PR #1427-granskning) — annars kunde
    // den här sidans "första sida" och API-ruttens efterföljande "Ladda
    // fler" komma från två olika ögonblicksbilder och tyst tappa rader.
    const alla = await hamtaAktivitetArkivCachat();
    ({ sida: forstaSidan, nastaCursor, nastaHopp } = paginateAktivitet(alla, null, 0));
  } catch {
    // Fail-open — klienten visar "Inga händelser ännu" och kan fortfarande
    // försöka "Ladda fler" om servern var tillfälligt otillgänglig.
  }

  return <AktivitetArkivKlient initialHandelser={forstaSidan} initialCursor={nastaCursor} initialHopp={nastaHopp} />;
}
