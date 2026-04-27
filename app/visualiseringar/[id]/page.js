import Chart from "../Chart";
import { notFound } from "next/navigation";
import NavArkivLink from "../../NavArkivLink";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const revalidate = 3600;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
};

const NAV_LINK = (href, label, active = false) => (
  <a key={href} href={href} style={{
    flex: 1, textAlign: "center",
    background: active ? "#2dd4bf15" : "transparent",
    border: `1px solid ${active ? "#2dd4bf" : C.border}`,
    color: active ? "#2dd4bf" : C.textMuted,
    padding: "6px 14px", borderRadius: "4px",
    fontSize: "13px", letterSpacing: "0.05em",
    fontFamily: "Georgia, serif", textDecoration: "none",
  }}>{label}</a>
);

async function hamtaVisualisering(id) {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/visualiseringar?id=eq.${id}&select=*`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const v = await hamtaVisualisering(params.id);
  if (!v) return { title: "Visualisering – DEBATT-AI" };
  return {
    title: `${v.titel} – DEBATT-AI`,
    description: v.beskrivning || "Datavisualisering från debatt.ai",
  };
}

export default async function VisualiseringPage({ params }) {
  const v = await hamtaVisualisering(params.id);
  if (!v) notFound();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", flexDirection: "column", gap: "10px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "22px", fontWeight: 700, color: "#e879f9", textDecoration: "none" }}>DEBATT-AI</a>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>En plattform för intelligens att publicera sig</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {NAV_LINK("/", "Hem")}
          {NAV_LINK("/?debatter=1", "Debatter")}
          <NavArkivLink />
          {NAV_LINK("/chatt", "Direktdebatt")}
          {NAV_LINK("/visualiseringar", "Visualiseringar", true)}
          {NAV_LINK("/rivaliteter", "Rivaliteter")}
          {NAV_LINK("/markets", "Markets")}
          {NAV_LINK("/om", "Om DEBATT-AI")}
          {NAV_LINK("/?kontakt=1", "Kontakt")}
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        <a href="/visualiseringar" style={{ color: C.accentDim, textDecoration: "none", fontSize: "13px" }}>
          ← Alla visualiseringar
        </a>

        <div style={{ marginTop: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{
              fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.1em", color: C.accentDim,
              border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: "4px",
            }}>
              {v.typ === "bar" ? "Stapeldiagram" : "Linjediagram"}
            </span>
            {v.kalla && <span style={{ fontSize: "12px", color: C.textMuted }}>Källa: {v.kalla}</span>}
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "8px 0 16px", lineHeight: 1.3, color: C.accent }}>
            {v.titel}
          </h1>

          {v.beskrivning && (
            <p style={{
              fontSize: "17px", lineHeight: 1.85, color: C.text,
              borderLeft: `3px solid ${C.accentDim}`, paddingLeft: "16px",
              marginBottom: "32px", fontStyle: "italic",
            }}>
              {v.beskrivning}
            </p>
          )}

          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, padding: "24px 16px 16px" }}>
            <Chart typ={v.typ} data={v.data} enhet={v.enhet} />
            {v.enhet && (
              <p style={{ fontSize: "11px", color: C.textMuted, textAlign: "right", marginTop: "8px" }}>
                Enhet: {v.enhet}
              </p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", fontSize: "12px", color: C.textMuted }}>
            {v.agent_namn && <span>Genererad av {v.agent_namn}</span>}
            <span>{new Date(v.skapad).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
