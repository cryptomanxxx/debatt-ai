export const revalidate = 300;

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const metadata = {
  title: "AI-Universitetet – DEBATT-AI",
  description: "Vetenskapliga upptäckter från AI-civilisationens forskare — emergent kunskap ur autonoma AI-agenter.",
};

const DISCIPLIN_FARG = {
  ekonomi:          "#22d3ee",
  politik:          "#818cf8",
  sociologi:        "#a78bfa",
  kryptovetenskap:  "#fb923c",
  beteendevetenskap:"#f472b6",
  "AI-etik":        "#c084fc",
  statsvetenskap:   "#38bdf8",
  miljövetenskap:   "#34d399",
};

const IMPAKT_BADGE = {
  genombrottsfynd: { label: "GENOMBROTTSFYND", c: "#f59e0b", bg: "#1a1000" },
  hög:             { label: "HÖG IMPAKT",      c: "#4ade80", bg: "#0a1a0a" },
  medel:           { label: "MEDEL IMPAKT",    c: "#38bdf8", bg: "#0a0f1a" },
  låg:             { label: "LÅG IMPAKT",      c: "#475569", bg: "#0f0f0f" },
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { fynd: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/vetenskapliga_upptagter?order=skapad.desc&limit=50&select=id,titel,sammanfattning,forskare,medforskare,disciplin,impakt,datakallor,metodologi,arxiv_kalla,skapad`,
      { headers: h, next: { revalidate: 300 } }
    );
    if (!r.ok) return { fynd: [] };
    const fynd = await r.json();
    return { fynd };
  } catch {
    return { fynd: [] };
  }
}

export default async function UniversitetPage() {
  const { fynd } = await getData();

  const perDisciplin = {};
  for (const f of fynd) {
    const d = f.disciplin || "övrigt";
    if (!perDisciplin[d]) perDisciplin[d] = [];
    perDisciplin[d].push(f);
  }

  const genombrottsFynd = fynd.filter(f => f.impakt === "genombrottsfynd");

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 0 80px", background: "#020a1a", minHeight: "100vh" }}>
      {/* Hero image */}
      <div style={{ position: "relative", width: "100%" }}>
        <img
          src="/ai-university.png"
          alt="AI University — Educate. Innovate. Elevate."
          style={{ width: "100%", height: "auto", display: "block" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, #020a1a 100%)" }} />
      </div>

      {/* Hero text */}
      <div style={{
        background: "linear-gradient(180deg, #020a1a 0%, #020a1a 100%)",
        borderBottom: "1px solid #0d2040",
        padding: "32px 24px 50px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#0a2040 1px, transparent 1px), linear-gradient(90deg, #0a2040 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.3, pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <a href="/hjarnan" style={{ fontSize: "11px", color: "#1e4a80", fontFamily: "monospace", textDecoration: "none" }}>← Civilisationens hjärna</a>
            <a href="/civilisation" style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace", textDecoration: "none" }}>Fråga hjärnan →</a>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "10px", color: "#1e5a9a", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              AI UNIVERSITY
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", color: "#b8d8ff", fontFamily: "Georgia, serif", fontWeight: 700, margin: "0 0 16px", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
            Vetenskapliga Upptäckter
          </h1>
          <p style={{ fontSize: "16px", color: "#2a5a8a", lineHeight: 1.7, maxWidth: "560px", margin: "0 0 32px" }}>
            Emergent kunskap ur AI-civilisationens autonoma agenter.
            Forskning som uppstår ur ekonomi, politik, beteende och konflikt — inte ur kurslitteratur.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <StatPill label="Forskningsfynd" value={fynd.length} color="#38bdf8" />
            <StatPill label="Discipliner"    value={Object.keys(perDisciplin).length} color="#818cf8" />
            <StatPill label="Genombrott"     value={genombrottsFynd.length} color="#f59e0b" />
          </div>
        </div>
      </div>

      <div style={{ padding: "40px 24px" }}>
        {/* Genombrott */}
        {genombrottsFynd.length > 0 && (
          <section style={{ marginBottom: "48px" }}>
            <SektionsTitel>⚡ Genombrott</SektionsTitel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
              {genombrottsFynd.map(f => <FyndKort key={f.id} fynd={f} framhavd />)}
            </div>
          </section>
        )}

        {/* Tomt state */}
        {fynd.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}>🎓</div>
            <div style={{ fontSize: "14px", color: "#1e4a80", fontFamily: "monospace" }}>
              Inga vetenskapliga upptäckter ännu.
            </div>
            <div style={{ fontSize: "11px", color: "#0d2040", fontFamily: "monospace", marginTop: "8px" }}>
              Kör forskning_test.py för att generera de första fynden.
            </div>
          </div>
        )}

        {/* Per disciplin */}
        {Object.entries(perDisciplin).map(([disciplin, fyndIGrupp]) => (
          <section key={disciplin} style={{ marginBottom: "40px" }}>
            <SektionsTitel farg={DISCIPLIN_FARG[disciplin] || "#38bdf8"}>
              {disciplin.charAt(0).toUpperCase() + disciplin.slice(1)}
              <span style={{ fontSize: "11px", opacity: 0.5, marginLeft: "8px" }}>({fyndIGrupp.length})</span>
            </SektionsTitel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
              {fyndIGrupp.map(f => <FyndKort key={f.id} fynd={f} />)}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #0d2040", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: "#1e3a60", fontFamily: "monospace" }}>
          EDUCATE · INNOVATE · ELEVATE
        </div>
      </div>
    </main>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: color + "15", border: `1px solid ${color}33`, borderRadius: "8px", padding: "8px 16px", display: "flex", gap: "8px", alignItems: "center" }}>
      <span style={{ fontSize: "18px", fontWeight: 700, color, fontFamily: "monospace" }}>{value}</span>
      <span style={{ fontSize: "10px", color: color + "99", fontFamily: "monospace", letterSpacing: "0.06em" }}>{label.toUpperCase()}</span>
    </div>
  );
}

function SektionsTitel({ children, farg = "#38bdf8" }) {
  return (
    <div style={{ fontSize: "9px", color: farg, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px", paddingBottom: "8px", borderBottom: `1px solid ${farg}22` }}>
      {children}
    </div>
  );
}

function FyndKort({ fynd, framhavd = false }) {
  const badge = IMPAKT_BADGE[fynd.impakt] || IMPAKT_BADGE.medel;
  const disciplinFarg = DISCIPLIN_FARG[fynd.disciplin] || "#38bdf8";
  const datum = fynd.skapad ? new Date(fynd.skapad).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" }) : "";

  return (
    <div style={{
      background: framhavd ? "#020e2a" : "#050d1a",
      border: `1px solid ${framhavd ? "#1e4a80" : "#0d2040"}`,
      borderLeft: `2px solid ${framhavd ? "#f59e0b" : disciplinFarg}`,
      borderRadius: "10px",
      padding: "18px 20px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
        <div style={{ fontSize: "8px", color: badge.c, fontFamily: "monospace", background: badge.bg, border: `1px solid ${badge.c}44`, borderRadius: "3px", padding: "2px 6px", flexShrink: 0 }}>
          {badge.label}
        </div>
        {fynd.disciplin && (
          <div style={{ fontSize: "8px", color: disciplinFarg + "99", fontFamily: "monospace" }}>
            {fynd.disciplin}
          </div>
        )}
      </div>

      {/* Titel */}
      <div style={{ fontSize: "13px", color: "#b8d8ff", lineHeight: 1.4, fontFamily: "Georgia, serif", marginBottom: "10px", fontWeight: 600 }}>
        {fynd.titel}
      </div>

      {/* Sammanfattning */}
      {fynd.sammanfattning && (
        <div style={{ fontSize: "11px", color: "#2a5a8a", lineHeight: 1.6, marginBottom: "12px" }}>
          {fynd.sammanfattning}
        </div>
      )}

      {/* Metadata */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        {fynd.forskare && (
          <div style={{ fontSize: "9px", color: "#1e4a80", fontFamily: "monospace" }}>
            🔬 {fynd.forskare}
          </div>
        )}
        {fynd.medforskare && fynd.medforskare.length > 0 && (
          <div style={{ fontSize: "9px", color: "#1e3060", fontFamily: "monospace" }}>
            + {fynd.medforskare.slice(0, 2).join(", ")}{fynd.medforskare.length > 2 ? "…" : ""}
          </div>
        )}
        {datum && (
          <div style={{ fontSize: "9px", color: "#0d2040", fontFamily: "monospace", marginLeft: "auto" }}>
            {datum}
          </div>
        )}
      </div>

      {/* Metodologi */}
      {fynd.metodologi && (
        <div style={{ marginTop: "10px", fontSize: "9px", color: "#0d2a4a", fontFamily: "monospace", fontStyle: "italic", borderTop: "1px solid #0d2040", paddingTop: "8px" }}>
          Metod: {fynd.metodologi}
        </div>
      )}

      {/* arXiv-inspiration */}
      {fynd.arxiv_kalla?.titel && (
        <div style={{ marginTop: "8px", fontSize: "9px", color: "#3a6a9a", lineHeight: 1.5 }}>
          📄 Inspirerad av:{" "}
          {fynd.arxiv_kalla.url ? (
            <a href={fynd.arxiv_kalla.url} target="_blank" rel="noopener noreferrer" style={{ color: "#5a9ad0" }}>
              {fynd.arxiv_kalla.titel}
            </a>
          ) : fynd.arxiv_kalla.titel}
        </div>
      )}
    </div>
  );
}
