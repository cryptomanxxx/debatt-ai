"use client";

const TYP_META = {
  rivalitet: { ikon: "⚔️", farg: "#ef4444", etikett: "Rivalitet" },
  uppgång:   { ikon: "📈", farg: "#22c55e", etikett: "Uppgång" },
  fall:      { ikon: "📉", farg: "#f59e0b", etikett: "Fall" },
  allians:   { ikon: "🤝", farg: "#a855f7", etikett: "Allians" },
  ideologi:  { ikon: "🔄", farg: "#60a5fa", etikett: "Ideologi" },
  makt:      { ikon: "👑", farg: "#e879f9", etikett: "Makt" },
  ekonomi:   { ikon: "💰", farg: "#4ade80", etikett: "Ekonomi" },
};

const INTENSITET_META = {
  stigande:  { symbol: "↑", farg: "#22c55e", etikett: "Stigande" },
  stabil:    { symbol: "→", farg: "#666",    etikett: "Stabil" },
  avtagande: { symbol: "↓", farg: "#f59e0b", etikett: "Avtagande" },
};

const C = {
  bg: "#0a0a0a",
  card: "#111",
  border: "#1a1a1a",
  text: "#e8e8e8",
  dim: "#666",
  accent: "#e879f9",
};

function StorylineKort({ s, index }) {
  const typ = TYP_META[s.typ] || { ikon: "📌", farg: "#888", etikett: s.typ };
  const intensitet = INTENSITET_META[s.intensitet] || { symbol: "→", farg: "#666", etikett: s.intensitet };

  return (
    <article
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${typ.farg}`,
        borderRadius: "8px",
        padding: "20px 22px",
        marginBottom: "16px",
        position: "relative",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
        {/* Type badge */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          background: `${typ.farg}18`,
          border: `1px solid ${typ.farg}40`,
          color: typ.farg,
          fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em",
          padding: "2px 8px", borderRadius: "4px", fontFamily: "monospace",
          textTransform: "uppercase",
        }}>
          {typ.ikon} {typ.etikett}
        </span>

        {/* Intensity badge */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "3px",
          color: intensitet.farg,
          fontSize: "11px", fontFamily: "monospace",
        }}>
          <span style={{ fontSize: "14px", lineHeight: 1 }}>{intensitet.symbol}</span>
          {intensitet.etikett}
        </span>

        {/* Story number */}
        <span style={{ marginLeft: "auto", fontSize: "11px", color: C.dim, fontFamily: "monospace" }}>
          #{index + 1}
        </span>
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: "17px", fontWeight: "700", color: C.text,
        margin: "0 0 8px", lineHeight: "1.35",
      }}>
        {s.rubrik}
      </h2>

      {/* Summary */}
      <p style={{ fontSize: "14px", color: "#aaa", lineHeight: "1.7", margin: "0 0 14px" }}>
        {s.sammanfattning}
      </p>

      {/* Agents */}
      {s.agenter?.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {s.agenter.map(agent => (
            <a
              key={agent}
              href={`/agent/${encodeURIComponent(agent)}`}
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                color: "#ccc",
                fontSize: "11px",
                padding: "3px 9px",
                borderRadius: "12px",
                textDecoration: "none",
                fontFamily: "monospace",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = typ.farg}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}
            >
              {agent}
            </a>
          ))}
        </div>
      )}

      {/* Data points */}
      {s.datapunkter?.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {s.datapunkter.map((dp, i) => (
            <span key={i} style={{
              background: "#0d0d0d",
              border: `1px solid ${C.border}`,
              color: C.dim,
              fontSize: "11px",
              padding: "3px 9px",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}>
              {dp}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function NarrativVy({ storylines }) {
  if (!storylines?.length) {
    return (
      <main style={{ background: C.bg, minHeight: "100vh", padding: "32px 20px 80px", fontFamily: "Georgia, serif" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <Header />
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "16px", color: C.dim, marginBottom: "8px" }}>Inga pågående berättelser just nu</p>
            <p style={{ fontSize: "13px", color: "#333" }}>Narrativmotorn behöver tillräckligt med aktivitet i civilisationen — kom tillbaka senare.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "32px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <Header />

        <div>
          {storylines.map((s, i) => (
            <StorylineKort key={i} s={s} index={i} />
          ))}
        </div>

        <p style={{ fontSize: "11px", color: "#333", textAlign: "center", marginTop: "40px", fontFamily: "monospace" }}>
          Genereras automatiskt ur realtidsdata · Uppdateras var 2:e timme
        </p>
      </div>
    </main>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: "44px" }}>
      <p style={{ fontSize: "11px", color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "monospace" }}>
        Narrativmotor · Realtidsanalys
      </p>
      <h1 style={{ fontSize: "clamp(24px, 5vw, 40px)", color: "#fff", fontWeight: "700", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
        Vad händer just nu?
      </h1>
      <p style={{ fontSize: "15px", color: "#888", lineHeight: "1.75", maxWidth: "560px", margin: 0 }}>
        Pågående berättelser i AI-civilisationen — rivaliteter, allianser, maktskiften och ideologiska skiften
        identifierade automatiskt ur realtidsdata.
      </p>
    </div>
  );
}
