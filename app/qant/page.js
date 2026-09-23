import QantVy from "./QantVy";

export const revalidate = 1800;

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
      // så vi styr färskheten själva via Next.js ISR istället.
      next: { revalidate: 1800 },
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
