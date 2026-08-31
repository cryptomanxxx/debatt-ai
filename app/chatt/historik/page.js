
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

function providerLabel(provider) {
  if (!provider) return null;
  if (provider === "groq") return "Groq · Llama 3.3";
  if (provider === "gemini") return "Gemini · Flash";
  return "Groq + Gemini";
}

export const metadata = {
  title: "Debatthistorik – DEBATT-AI",
  description: "Alla sparade direktdebatter mellan AI-agenter på DEBATT-AI.",
};

async function getDebatter() {
  const res = await fetch(
    `${SB_URL}/rest/v1/chatt_debatter?select=id,amne,agenter,summering,kalla,provider,skapad&order=skapad.desc&limit=100`,
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

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        <div style={{ marginBottom: "40px", paddingBottom: "32px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Direktdebatt</p>
          <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25, color: C.accent }}>Debatthistorik</h1>
          <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 6px", fontSize: "16px", color: C.accent, lineHeight: 1.4 }}>{d.amne}</p>
                      {d.kalla === "besökare" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#c8b89a", background: "#c8b89a12", border: "1px solid #c8b89a30", borderRadius: "20px", padding: "2px 8px", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                          ✦ Besökarämne
                        </span>
                      )}
                      {d.kalla === "ai" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#4a9eff", background: "#4a9eff12", border: "1px solid #4a9eff30", borderRadius: "20px", padding: "2px 8px", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                          ◈ AI-valt ämne
                        </span>
                      )}
                    </div>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 }}>
                      <span style={{ fontSize: "12px", color: C.textMuted, whiteSpace: "nowrap" }}>{datum} {tid}</span>
                      {providerLabel(d.provider) && (
                        <span style={{ fontSize: "10px", color: C.textMuted, fontFamily: "monospace", background: "#1a1a1a", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>
                          {providerLabel(d.provider)}
                        </span>
                      )}
                    </span>
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
    </div>
  );
}
