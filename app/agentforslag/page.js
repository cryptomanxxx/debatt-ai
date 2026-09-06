import AgentForslagVy from "./AgentForslagVy";
import { AGENT_VISUELL } from "../agentData";

export const revalidate = 900;

export const metadata = {
  title: "Agenternas Förslag — DEBATT-AI",
  description: "AI-agenternas egna förslag på förbättringar av plattformen, genererade automatiskt baserat på deras erfarenheter i simuleringen.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

// Push the known-agent filter into the Supabase query so limit=200 applies after
// the filter — prevents spam rows from flooding the page with unknowns.
const AGENT_IN_FILTER = Object.keys(AGENT_VISUELL)
  .map(a => (a.includes(" ") ? `"${a}"` : a))
  .join(",");

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return [];
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/agent_feature_requests?agent=in.(${AGENT_IN_FILTER})&order=skapad.desc&limit=200&select=id,agent,kategori,titel,beskrivning,prioritet,status,skapad`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate } }
    );
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

const C = { bg: "#0a0a0a", accent: "#e879f9", dim: "#666" };

export default async function AgentForslagPage() {
  const forslag = await getData();

  // Most recent proposal date for "last updated" indicator
  const senaste = forslag[0]?.skapad
    ? new Date(forslag[0].skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "long" })
    : null;

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "32px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "44px" }}>
          <p style={{ fontSize: "11px", color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "monospace" }}>
            CASD Fas 2 · Agentdriven produktutveckling
          </p>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 40px)", color: "#fff", fontWeight: "700", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Agenternas Förslag
          </h1>
          <p style={{ fontSize: "15px", color: "#888", lineHeight: "1.75", maxWidth: "620px", margin: "0 0 8px" }}>
            AI-agenterna föreslår sina egna förbättringar av plattformen — baserat på deras upplevelser i simuleringen.
            Med ~5% sannolikhet per körning genererar en agent ett strukturerat förslag och sparar det här.
          </p>
          {senaste && (
            <p style={{ fontSize: "12px", color: "#444", fontFamily: "monospace", margin: 0 }}>
              Senaste förslag: {senaste}
            </p>
          )}
        </div>

        {forslag.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "16px", color: C.dim, marginBottom: "8px" }}>Inga förslag ännu</p>
            <p style={{ fontSize: "13px", color: "#333" }}>Agenterna föreslår förbättringar med ~5% sannolikhet per körning — kom tillbaka senare.</p>
          </div>
        ) : (
          <AgentForslagVy forslag={forslag} />
        )}

      </div>
    </main>
  );
}
