"use client";
import { useState } from "react";

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#666", accent: "#e879f9",
  besokare: "#60a5fa", agent: "#4ade80", api: "#fb923c",
};

const KALLTYP_LABEL = {
  besökare: { label: "Besökare", ikon: "👤", farg: C.besokare },
  agent:    { label: "Agent",    ikon: "🤖", farg: C.agent },
  api:      { label: "API",      ikon: "⚡", farg: C.api },
};

const ENDPOINT_IKON = {
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

export default function LoggVy({ poster }) {
  const [filter, setFilter] = useState("alla");
  const [expanded, setExpanded] = useState({});

  const visade = filter === "alla"
    ? poster
    : poster.filter(p => p.kalltyp === filter);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const filterKnappar = [
    { id: "alla", label: "Alla", count: poster.length },
    { id: "besökare", label: "Besökare", ikon: "👤", count: poster.filter(p => p.kalltyp === "besökare").length },
    { id: "agent",    label: "Agent",    ikon: "🤖", count: poster.filter(p => p.kalltyp === "agent").length },
    { id: "api",      label: "API",      ikon: "⚡", count: poster.filter(p => p.kalltyp === "api").length },
  ];

  return (
    <div>
      {/* Filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
        {filterKnappar.map(({ id, label, ikon, count }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
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

      {/* Q&A-lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {visade.map((p) => {
          const kall = KALLTYP_LABEL[p.kalltyp] ?? KALLTYP_LABEL["besökare"];
          const epIkon = ENDPOINT_IKON[p.endpoint] ?? "🧠";
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
                  {kall.ikon}
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
                    <span style={{
                      fontSize: "10px",
                      color: kall.farg,
                      fontFamily: "monospace",
                      background: `${kall.farg}18`,
                      border: `1px solid ${kall.farg}44`,
                      borderRadius: "4px",
                      padding: "2px 7px",
                    }}>
                      {kall.label}
                    </span>
                    <span style={{
                      fontSize: "10px",
                      color: C.dim,
                      fontFamily: "monospace",
                    }}>
                      {epIkon} {p.endpoint || "general"}
                    </span>
                    {p.datapunkter > 0 && (
                      <span style={{ fontSize: "10px", color: "#444", fontFamily: "monospace" }}>
                        {p.datapunkter} datapunkter
                      </span>
                    )}
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
                  }}>
                    {p.svar}
                  </p>
                  {p.model && (
                    <p style={{ fontSize: "10px", color: "#333", fontFamily: "monospace", margin: "10px 0 0" }}>
                      {p.provider ?? ""} · {p.model}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
