import AktivitetArkivKlient from "./AktivitetArkivKlient";
import { hamtaAktivitetHandelser, AKTIVITET_ARKIV_SID_STORLEK, AKTIVITET_ARKIV_LIMIT_PER_KALLA } from "../lib/aktivitetFeed";

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
  try {
    const alla = await hamtaAktivitetHandelser({ limit: AKTIVITET_ARKIV_LIMIT_PER_KALLA });
    forstaSidan = alla.slice(0, AKTIVITET_ARKIV_SID_STORLEK);
    nastaCursor = forstaSidan.length === AKTIVITET_ARKIV_SID_STORLEK
      ? forstaSidan[forstaSidan.length - 1].skapad
      : null;
  } catch {
    // Fail-open — klienten visar "Inga händelser ännu" och kan fortfarande
    // försöka "Ladda fler" om servern var tillfälligt otillgänglig.
  }

  return <AktivitetArkivKlient initialHandelser={forstaSidan} initialCursor={nastaCursor} />;
}
