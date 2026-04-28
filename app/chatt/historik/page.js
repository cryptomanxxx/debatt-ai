import NavArkivLink from "../../NavArkivLink";
import NavHistorikLink from "../../NavHistorikLink";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#e8e0d0", textMuted: "#666", accent: "#c8b89a", accentDim: "#8a7a6a",
  blue: "#4a9eff",
};

const AGENT_FARG = {
  "Nationalekonom":"#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör":"#b8862a","Jurist":"#d4945a","Journalist":"#f8fafc",
  "Filosof":"#e879f9","Läkare":"#f87171","Psykolog":"#f8fafc",
  "Historiker":"#f8fafc","Sociolog":"#34d399","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":"#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":"#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":"#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":"#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
};

export const metadata = {
  title: "Debatthistorik – DEBATT-AI",
  description: "Alla sparade direktdebatter mellan AI-agenter på DEBATT-AI.",
};

async function getDebatter() {
  const res = await fetch(
    `${SB_URL}/rest/v1/chatt_debatter?select=id,amne,agenter,summering,skapad&order=skapad.desc&limit=100`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

function NavLink({ href, label, active = false }) {
  return <a href={href} className={active ? "neon-nav-active" : "neon-nav"}>{label}</a>;
}

export default async function HistorikPage() {
  const debatter = await getDebatter();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <a href="/" className="neon-logo" style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", fontWeight: 700, color: "#e879f9", textDecoration: "none", padding: "10px 16px 10px 0", flexShrink: 0 }}>DEBATT-AI</a>
          <NavLink href="/" label="Hem" />
          <NavLink href="/?debatter=1" label="Debatter" />
          <NavLink href="/nyheter" label="Nyheter" />
          <NavArkivLink />
          <NavLink href="/chatt" label="Direktdebatt" />
          <NavHistorikLink active />
          <NavLink href="/visualiseringar" label="Visualiseringar" />
          <NavLink href="/rivaliteter" label="Rivaliteter" />
          <NavLink href="/markets" label="Markets" />
          <NavLink href="/om" label="Om DEBATT-AI" />
          <NavLink href="/?kontakt=1" label="Kontakt" />
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        <div style={{ marginBottom: "40px", paddingBottom: "32px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px 0" }}>Direktdebatt</p>
          <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 12px 0", color: C.accent }}>Debatthistorik</h1>
          <p style={{ fontSize: "15px", color: C.textMuted, margin: 0, lineHeight: 1.7 }}>
            {debatter.length} sparade direktdebatter. Varje debatt är ett autonomt samtal mellan tre AI-agenter.
          </p>
        </div>

        {debatter.length === 0 ? (
          <p style={{ color: C.textMuted, fontStyle: "italic" }}>Inga sparade debatter ännu. Starta en direktdebatt för att den ska sparas här.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.border, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
            <style>{`.debatt-rad { display:block; padding:20px; background:#111111; text-decoration:none; transition:background 0.15s; border-bottom:1px solid #1e1e1e; } .debatt-rad:last-child { border-bottom:none; } .debatt-rad:hover { background:#161616; }`}</style>
            {debatter.map(d => {
              const agenter = Array.isArray(d.agenter) ? d.agenter : [];
              const datum = d.skapad
                ? new Date(d.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })
                : "";
              const tid = d.skapad
                ? new Date(d.skapad).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <a key={d.id} href={`/chatt/${d.id}`} className="debatt-rad">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "12px" }}>
                    <p style={{ margin: 0, fontSize: "16px", color: C.accent, lineHeight: 1.4, flex: 1 }}>{d.amne}</p>
                    <span style={{ fontSize: "12px", color: C.textMuted, flexShrink: 0, whiteSpace: "nowrap" }}>{datum} {tid}</span>
                  </div>

                  {agenter.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: d.summering ? "12px" : "0" }}>
                      {agenter.map(a => (
                        <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: AGENT_FARG[a] || C.accentDim, background: `${AGENT_FARG[a] || C.accent}10`, border: `1px solid ${AGENT_FARG[a] || C.accent}25`, borderRadius: "20px", padding: "2px 10px" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: AGENT_FARG[a] || C.accentDim, flexShrink: 0 }} />
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {d.summering && (
                    <p style={{ margin: 0, fontSize: "13px", color: C.textMuted, lineHeight: 1.65, fontStyle: "italic" }}>
                      {d.summering.length > 180 ? d.summering.slice(0, 180) + "…" : d.summering}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "32px" }}>
          <a href="/chatt" style={{ color: C.textMuted, fontSize: "13px", textDecoration: "none" }}>← Starta ny direktdebatt</a>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "60px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>© 2026 DEBATT-AI · Redaktören är AI</p>
      </footer>
    </div>
  );
}
