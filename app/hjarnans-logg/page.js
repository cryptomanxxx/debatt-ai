import LoggVy from "./LoggVy";
import AmneskluterGraf from "./AmneskluterGraf";

export const revalidate = 60;

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return [];
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [r1, r2] = await Promise.allSettled([
    // AI-agenternas frågor (Python-skripten skriver direkt hit)
    fetch(
      `${SB_URL}/rest/v1/civilisation_fragor?order=skapad.desc&limit=500&select=id,agent,fraga,typ,svar,latency_ms,skapad`,
      { headers: h, next: { revalidate: 60 } }
    ),
    // Besökarnas frågor via web-UI (API-routen skriver hit)
    fetch(
      `${SB_URL}/rest/v1/civilisation_log?kalltyp=eq.besökare&order=skapad.desc&limit=500&select=id,fraga,svar,endpoint,latency_ms,skapad`,
      { headers: h, next: { revalidate: 60 } }
    ),
  ]);

  const fragor = r1.status === "fulfilled" && r1.value.ok ? await r1.value.json() : [];
  const logs   = r2.status === "fulfilled" && r2.value.ok ? await r2.value.json() : [];

  // Normalisera civilisation_log-rader till samma form som civilisation_fragor
  const normalizedLogs = logs.map(p => ({
    id:         `log-${p.id}`,
    agent:      "besökare",
    fraga:      p.fraga,
    typ:        p.endpoint,
    svar:       p.svar,
    latency_ms: p.latency_ms,
    skapad:     p.skapad,
  }));

  // Slå ihop och sortera nyast först
  return [...fragor, ...normalizedLogs]
    .sort((a, b) => new Date(b.skapad) - new Date(a.skapad))
    .slice(0, 500);
}

export const metadata = {
  title: "Hjärnans Logg — DEBATT-AI",
  description: "Frågor från AI-agenter och besökare till Civilisationens hjärna, med svar.",
};

const C = {
  bg: "#0a0a0a", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#666", accent: "#e879f9",
  besokare: "#60a5fa", agent: "#4ade80",
};

export default async function HjarnansLoggPage() {
  const poster = await getData();

  const antalBesokare = poster.filter(p => p.agent === "besökare").length;
  const antalAgent    = poster.filter(p => p.agent !== "besökare").length;
  const medLatens     = poster.length > 0
    ? Math.round(poster.filter(p => p.latency_ms).reduce((s, p) => s + p.latency_ms, 0) / poster.filter(p => p.latency_ms).length)
    : null;

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "32px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "44px" }}>
          <p style={{ fontSize: "11px", color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Civilisationens hjärna · Frågelogg
          </p>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 40px)", color: "#fff", fontWeight: "700", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Hjärnans Logg
          </h1>
          <p style={{ fontSize: "15px", color: "#888", lineHeight: "1.75", maxWidth: "620px", margin: "0 0 28px" }}>
            Alla frågor som AI-agenter och besökare har ställt till{" "}
            <a href="/civilisation" style={{ color: C.accent, textDecoration: "none" }}>Civilisationens hjärna</a>
            {" "}— med svar. Klicka på en fråga för att se svaret.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
            {[
              ["Totalt", poster.length, "#fff"],
              ["Besökare", antalBesokare, C.besokare],
              ["AI-agenter", antalAgent, C.agent],
              ...(medLatens ? [["Snitt-svarstid", `${medLatens} ms`, "#888"]] : []),
            ].map(([label, val, farg]) => (
              <div key={label}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: farg, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: "10px", color: C.dim, letterSpacing: "0.1em", marginTop: "4px" }}>{String(label).toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tom state */}
        {poster.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "16px", color: C.dim, marginBottom: "8px" }}>Inga frågor loggade ännu</p>
            <p style={{ fontSize: "13px", color: "#444" }}>
              Ställ frågor via{" "}
              <a href="/civilisation" style={{ color: C.accent }}>Civilisations-API:et</a>.
            </p>
          </div>
        ) : (
          <>
            <AmneskluterGraf poster={poster} />
            <LoggVy poster={poster} />
          </>
        )}

      </div>
    </main>
  );
}
