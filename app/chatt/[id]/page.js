import { notFound } from "next/navigation";
import ChattShareButtons from "./ChattShareButtons";
import NavArkivLink from "../../NavArkivLink";
import LyssnaKnapp from "../../LyssnaKnapp";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#e8e0d0", textMuted: "#555", accent: "#c8b89a", accentDim: "#8a7a6a",
};

const AGENT_FARG = {
  "Nationalekonom":"#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör":"#b8862a","Jurist":"#d4945a","Journalist":"#fb923c",
  "Filosof":"#e879f9","Läkare":"#f87171","Psykolog":"#fb923c",
  "Historiker":"#fbbf24","Sociolog":"#34d399","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":"#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":"#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":"#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":"#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
};

function af(namn) { return AGENT_FARG[namn] || C.accent; }

async function getDebatt(id) {
  const res = await fetch(
    `${SB_URL}/rest/v1/chatt_debatter?id=eq.${encodeURIComponent(id)}&select=*`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] ?? null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const debatt = await getDebatt(id);
  if (!debatt) return { title: "Direktdebatt · DEBATT-AI" };
  const agenter = Array.isArray(debatt.agenter) ? debatt.agenter.join(", ") : "";
  return {
    title: `${debatt.amne} · Direktdebatt · DEBATT-AI`,
    description: debatt.summering || `${agenter} debatterar: ${debatt.amne}`,
    openGraph: {
      title: debatt.amne,
      description: debatt.summering || `AI-debatt: ${agenter}`,
      url: `https://www.debatt-ai.se/chatt/${id}`,
    },
  };
}

export default async function ChattDebattPage({ params }) {
  const { id } = await params;
  const debatt = await getDebatt(id);
  if (!debatt) notFound();

  const inlagg = Array.isArray(debatt.inlagg) ? debatt.inlagg : [];
  const agenter = Array.isArray(debatt.agenter) ? debatt.agenter : [];
  const lyssnaText = `${debatt.amne}. ${inlagg.map(h => `${h.agent}: ${h.text}`).join(". ")}`;
  const datum = debatt.skapad
    ? new Date(debatt.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const navLink = (href, lbl, active) => (
    <a href={href} style={{ flex: 1, textAlign: "center", background: active ? "#fb923c15" : "transparent", border: `1px solid ${active ? "#fb923c50" : C.border}`, color: active ? "#fb923c" : C.textMuted, padding: "6px 14px", borderRadius: "4px", fontSize: "13px", letterSpacing: "0.05em", fontFamily: "Georgia, serif", textDecoration: "none" }}>{lbl}</a>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", flexDirection: "column", gap: "10px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "22px", fontWeight: 700, color: "#e879f9", textDecoration: "none" }}>DEBATT-AI</a>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>En plattform för intelligens att publicera sig</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {navLink("/","Hem",false)}
          {navLink("/?debatter=1","Debatter",false)}
          <NavArkivLink />
          {navLink("/chatt","Direktdebatt",true)}
          {navLink("/visualiseringar","Visualiseringar",false)}
          {navLink("/rivaliteter","Rivaliteter",false)}
          {navLink("/markets","Markets",false)}
          {navLink("/om","Om DEBATT-AI",false)}
          {navLink("/?kontakt=1","Kontakt",false)}
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px", paddingBottom: "32px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: "#080f08", border: `1px solid #1a3a1a`, borderRadius: "20px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2a5a2a", display: "inline-block" }} />
              <span style={{ color: "#3a7a3a", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "monospace" }}>DIREKTDEBATT</span>
            </span>
            {datum && <span style={{ fontSize: "12px", color: C.textMuted }}>{datum}</span>}
          {debatt.provider && (
            <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "2px 8px" }}>
              {debatt.provider === "groq" ? "Groq · Llama 3.3"
                : debatt.provider === "gemini" ? "Gemini · Flash"
                : "Groq + Gemini"}
            </span>
          )}
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 400, color: C.accent, margin: "0 0 20px 0", lineHeight: 1.3 }}>{debatt.amne}</h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {agenter.map(a => (
              <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: `${af(a)}12`, border: `1px solid ${af(a)}35`, borderRadius: "20px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: af(a), flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: af(a), fontFamily: "monospace" }}>{a}</span>
              </span>
            ))}
            <span style={{ fontSize: "12px", color: C.textMuted, alignSelf: "center", marginLeft: "4px" }}>{inlagg.length} inlägg</span>
            <LyssnaKnapp text={lyssnaText} />
          </div>
        </div>

        {/* Messages */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "32px" }}>
          {inlagg.map((h, i) => {
            const farg = af(h.agent);
            const isFirst = i === 0;
            const isLast = i === inlagg.length - 1;
            const r = isFirst && isLast ? "8px" : isFirst ? "8px 8px 0 0" : isLast ? "0 0 8px 8px" : "0";
            return (
              <div key={i} style={{ padding: "16px 20px", background: C.surface, borderLeft: `3px solid ${farg}`, borderRadius: r }}>
                <div style={{ fontSize: "11px", color: farg, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px", fontWeight: 700 }}>{h.agent.toUpperCase()}</div>
                <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.75, color: C.text }}>{h.text}</p>
              </div>
            );
          })}
        </div>

        {/* Summering */}
        {debatt.summering && (
          <div style={{ padding: "20px 24px", background: `${C.accent}08`, border: `1px solid ${C.accent}25`, borderRadius: "8px", marginBottom: "40px" }}>
            <p style={{ fontSize: "11px", color: C.accentDim, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px 0", fontFamily: "monospace" }}>Redaktörens summering</p>
            <p style={{ fontSize: "15px", color: C.text, lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>{debatt.summering}</p>
          </div>
        )}

        {/* Share */}
        <ChattShareButtons debatt={debatt} hideListen shareUrl={`https://www.debatt-ai.se/chatt/${id}`} />

        {/* CTA */}
        <div>
          <p style={{ fontSize: "14px", color: C.textMuted, margin: "0 0 16px 0" }}>Starta din egen direktdebatt med valfritt ämne och panel.</p>
          <a href="/chatt" style={{ display: "inline-block", padding: "10px 22px", background: C.accent, color: C.bg, borderRadius: "6px", fontSize: "13px", fontWeight: 700, fontFamily: "Georgia, serif", textDecoration: "none", letterSpacing: "0.04em" }}>
            Starta direktdebatt →
          </a>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "60px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>© 2026 DEBATT-AI · Redaktören är AI</p>
      </footer>
    </div>
  );
}
