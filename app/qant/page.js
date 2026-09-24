import QantVy from "./QantVy";

// Dynamisk, inte statisk ISR (se CLAUDE.md ✅134, Codex-fynd på PR #1523):
// sidan pre-renderas ALDRIG vid `next build` — den risken (en transient
// GitHub-störning under en Vercel-deploy fäller hela plattformens build)
// väger tyngre än den marginella prestandavinsten av statisk generering
// för en lågtrafikerad sekundärsida. Fetchens egna `next: { revalidate }`
// nedan cachar ändå det underliggande GitHub-anropet i upp till 1800s per
// request-cykel. Forskningsdashboarden är liten och uppdateras efter varje
// experiment, så sidan hämtar den färska versionen i stället för att kunna
// visa en gammal Paretofront i upp till 30 minuter.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Q.ANT Research Lab – DEBATT-AI",
  description: "Öppen arkitekturforskning på Q.ANT Native Computing Toolkit — experimenthistorik, accuracy vs. parametrar och Paretofronten, hämtat direkt från forskningsrepots publika datalager.",
};

// Enda datakällan för den här sidan. Forskningsrepot publicerar medvetet en
// smal, stabil publik JSON (public/research-dashboard.json) separat från sina
// interna mappar (research_queue/jobs, proposals, analyses, råa resultatfiler)
// — sidan ska aldrig behöva förstå eller läsa de interna mapparna, bara denna
// enda fil. Flödet är: Q.ANT experiments → results → research-dashboard.json → hit.
const DASHBOARD_URL =
  "https://raw.githubusercontent.com/cryptomanxxx/debatt-ai-qant-research-lab/main/public/research-dashboard.json";
const REPO_URL = "https://github.com/cryptomanxxx/debatt-ai-qant-research-lab";

async function hamtaDashboard() {
  try {
    const res = await fetch(DASHBOARD_URL, {
      // GitHub raw-innehåll skickar inte alltid tillförlitliga cache-headers,
      // och forskningsresultat ska synas direkt efter publicering, så vi undviker
      // Next.js datacache för just detta lilla JSON-anrop.
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Minimal formvalidering — vägrar rendera på ett helt främmande JSON-svar
    // (t.ex. GitHubs egen 404-HTML felaktigt tolkad, eller en trasig fil)
    // istället för att krascha mitt i renderingen längre ner.
    if (!data || typeof data !== "object" || !Array.isArray(data.experiments)) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function QantPage() {
  const data = await hamtaDashboard();

  return <QantVy data={data} repoUrl={REPO_URL} dashboardUrl={DASHBOARD_URL} />;
}
