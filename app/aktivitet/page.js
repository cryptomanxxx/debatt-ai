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
  let nastaVid = [];
  try {
    // Använder samma paginateAktivitet() som /api/aktivitet/arkiv — cursorn
    // den producerar är identitetsbaserad (se app/lib/aktivitetFeed.js) och
    // fungerar korrekt oavsett om den här sidans och API-ruttens efterföljande
    // "Ladda fler"-anrop råkar hämta olika ögonblicksbilder av samma data
    // (separata Vercel-funktioner, Codex-fynd PR #1431-granskning).
    const alla = await hamtaAktivitetArkivCachat();
    ({ sida: forstaSidan, nastaCursor, nastaVid } = paginateAktivitet(alla, null, []));
  } catch {
    // Fail-open — klienten visar "Inga händelser ännu" och kan fortfarande
    // försöka "Ladda fler" om servern var tillfälligt otillgänglig.
  }

  return <AktivitetArkivKlient initialHandelser={forstaSidan} initialCursor={nastaCursor} initialVid={nastaVid} />;
}
