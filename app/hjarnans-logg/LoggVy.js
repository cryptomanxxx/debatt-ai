"use client";
import { useState } from "react";

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#666", accent: "#e879f9",
  besokare: "#60a5fa", agent: "#4ade80",
};

const TYP_IKON = {
  historia:     "📜",
  relationer:   "🤝",
  insikter:     "💡",
  ekonomi:      "💰",
  prediktioner: "📊",
  allianser:    "🏛",
  territorium:  "🗺️",
  kunskap:      "🎓",
  general:      "🧠",
};

function Ago({ skapad }) {
  const diff = Date.now() - new Date(skapad).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return <span>{m} min sedan</span>;
  const h = Math.floor(m / 60);
  if (h < 24) return <span>{h} tim sedan</span>;
  return <span>{Math.floor(h / 24)} dagar sedan</span>;
}

const PAGE_SIZE = 20;

export default function LoggVy({ poster }) {
  const [filter, setFilter] = useState("alla");
  const [expanded, setExpanded] = useState({});
  const [sida, setSida] = useState(1);

  const filtrerade = filter === "alla"
    ? poster
    : filter === "besökare"
      ? poster.filter(p => !p.agent || p.agent === "besökare")
      : poster.filter(p => !!p.agent && p.agent !== "besökare");

  const totalSidor = Math.max(1, Math.ceil(filtrerade.length / PAGE_SIZE));
  const visade = filtrerade.slice((sida - 1) * PAGE_SIZE, sida * PAGE_SIZE);

  const byttFilter = (id) => { setFilter(id); setSida(1); };
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const filterKnappar = [
    { id: "alla",     label: "Alla",       count: poster.length },
    { id: "besökare", label: "Besökare", ikon: "👤", count: poster.filter(p => !p.agent || p.agent === "besökare").length },
    { id: "agent",    label: "AI-agenter", ikon: "🤖", count: poster.filter(p => !!p.agent && p.agent !== "besökare").length },
  ];

  return (
    <div>
      {/* Filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
        {filterKnappar.map(({ id, label, ikon, count }) => (
          <button
            key={id}
            onClick={() => byttFilter(id)}
            style={{
              background: filter === id ? "#1a1a1a" : "transparent",
              border: `1px solid ${filter === id ? C.accent : C.border}`,
              borderRadius: "6px",
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: "12px",
              color: filter === id ? "#fff" : C.dim,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {ikon && <span>{ikon}</span>}
            {label}
            <span style={{
              background: "#222",
              borderRadius: "4px",
              padding: "1px 6px",
              fontSize: "10px",
              color: C.dim,
            }}>{count}</span>
          </button>
        ))}
      </div>

      {visade.length === 0 && (
        <p style={{ color: C.dim, fontSize: "14px", fontStyle: "italic" }}>
          Inga poster matchade filtret.
        </p>
      )}

      {/* Pagination info */}
      {filtrerade.length > PAGE_SIZE && (
        <div style={{ fontSize: "12px", color: C.dim, marginBottom: "16px" }}>
          Visar {(sida - 1) * PAGE_SIZE + 1}–{Math.min(sida * PAGE_SIZE, filtrerade.length)} av {filtrerade.length}
        </div>
      )}

      {/* Q&A-lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {visade.map((p) => {
          const isAgent = !!p.agent && p.agent !== "besökare";
          const typIkon = TYP_IKON[p.typ] ?? "🧠";
          const isOpen = !!expanded[p.id];
          const harSvar = p.svar && p.svar.trim().length > 0;

          return (
            <div
              key={p.id}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                onClick={() => harSvar && toggle(p.id)}
                style={{
                  padding: "16px 20px",
                  cursor: harSvar ? "pointer" : "default",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {/* Källikon */}
                <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>
                  {isAgent ? "🤖" : "👤"}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Fråga */}
                  <p style={{
                    fontSize: "14px",
                    color: C.text,
                    margin: "0 0 8px",
                    lineHeight: "1.5",
                    fontWeight: "500",
                  }}>
                    {p.fraga}
                  </p>

                  {/* Meta-rad */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {isAgent && (
                      <span style={{
                        fontSize: "10px",
                        color: C.agent,
                        fontFamily: "monospace",
                        background: `${C.agent}18`,
                        border: `1px solid ${C.agent}44`,
                        borderRadius: "4px",
                        padding: "2px 7px",
                      }}>
                        {p.agent}
                      </span>
                    )}
                    {!isAgent && (
                      <span style={{
                        fontSize: "10px",
                        color: C.besokare,
                        fontFamily: "monospace",
                        background: `${C.besokare}18`,
                        border: `1px solid ${C.besokare}44`,
                        borderRadius: "4px",
                        padding: "2px 7px",
                      }}>
                        Besökare
                      </span>
                    )}
                    <span style={{
                      fontSize: "10px",
                      color: C.dim,
                      fontFamily: "monospace",
                    }}>
                      {typIkon} {p.typ || "general"}
                    </span>
                    {p.latency_ms && (
                      <span style={{ fontSize: "10px", color: "#444", fontFamily: "monospace" }}>
                        {p.latency_ms} ms
                      </span>
                    )}
                    <span style={{ fontSize: "10px", color: "#333", fontFamily: "monospace", marginLeft: "auto" }}>
                      <Ago skapad={p.skapad} />
                    </span>
                  </div>
                </div>

                {/* Expandera-pil */}
                {harSvar && (
                  <span style={{ color: C.dim, fontSize: "12px", flexShrink: 0, marginTop: "3px" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                )}
              </div>

              {/* Svar (expanderbart) */}
              {harSvar && isOpen && (
                <div style={{
                  borderTop: `1px solid ${C.border}`,
                  padding: "16px 20px 16px 48px",
                  background: "#0c0c10",
                }}>
                  <p style={{
                    fontSize: "13px",
                    color: "#aaa",
                    lineHeight: "1.7",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}>
                    {p.svar}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Paginering */}
      {totalSidor > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "32px", justifyContent: "center" }}>
          <button
            onClick={() => setSida(s => Math.max(1, s - 1))}
            disabled={sida === 1}
            style={{
              background: "transparent",
              border: `1px solid ${sida === 1 ? "#222" : C.border}`,
              borderRadius: "6px",
              padding: "6px 14px",
              cursor: sida === 1 ? "default" : "pointer",
              fontSize: "12px",
              color: sida === 1 ? "#333" : C.dim,
            }}
          >← Föregående</button>

          {Array.from({ length: totalSidor }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setSida(n)}
              style={{
                background: n === sida ? "#1a1a1a" : "transparent",
                border: `1px solid ${n === sida ? C.accent : C.border}`,
                borderRadius: "6px",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "12px",
                color: n === sida ? "#fff" : C.dim,
                minWidth: "36px",
              }}
            >{n}</button>
          ))}

          <button
            onClick={() => setSida(s => Math.min(totalSidor, s + 1))}
            disabled={sida === totalSidor}
            style={{
              background: "transparent",
              border: `1px solid ${sida === totalSidor ? "#222" : C.border}`,
              borderRadius: "6px",
              padding: "6px 14px",
              cursor: sida === totalSidor ? "default" : "pointer",
              fontSize: "12px",
              color: sida === totalSidor ? "#333" : C.dim,
            }}
          >Nästa →</button>
        </div>
      )}
    </div>
  );
}
