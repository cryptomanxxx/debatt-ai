"use client";
import { useState } from "react";
import { AGENT_VISUELL } from "../agentData";

const C = {
  surface: "#111", border: "#222", text: "#f0ede6",
  muted: "#888880", accent: "#e8d5a3", gold: "#e8d5a3",
};

function styrkaBar(styrka, color) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "64px", height: "4px", background: "#1a1a1a", borderRadius: "2px", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${styrka * 10}%`, background: color, borderRadius: "2px", opacity: 0.85 }} />
      </div>
      <span style={{ fontSize: "9px", color: "#555", fontFamily: "monospace" }}>{styrka}/10</span>
    </div>
  );
}

function AgentDriftKort({ agent }) {
  const av = AGENT_VISUELL[agent.agent];
  const color = av?.ikonFarg || "#888";
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px",
      padding: "18px 20px", borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
          <a href={`/agent/${encodeURIComponent(agent.agent)}`} style={{
            fontSize: "13px", color: color, fontFamily: "monospace", fontWeight: 700, textDecoration: "none",
          }}>
            {agent.agent}
          </a>
        </div>
        <span style={{
          fontSize: "10px", color: C.gold, fontFamily: "monospace", fontWeight: 700,
          background: "#e8d5a308", border: "1px solid #e8d5a320", borderRadius: "20px", padding: "2px 9px",
        }}>
          ↻ {agent.total} {agent.total === 1 ? "ändring" : "ändringar"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {agent.ändringar.slice(0, 3).map((ä, i) => (
          <div key={i} style={{ borderTop: i > 0 ? `1px solid #1a1a1a` : "none", paddingTop: i > 0 ? "12px" : 0 }}>
            <div style={{ fontSize: "9px", color: color, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px" }}>
              {ä.amne.toUpperCase()}
            </div>
            <p style={{ fontSize: "12px", color: "#ccc", margin: "0 0 6px", lineHeight: 1.5 }}>
              {ä.nu.length > 90 ? ä.nu.slice(0, 89) + "…" : ä.nu}
            </p>
            <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", flexShrink: 0, marginTop: "2px" }}>HÖLL TIDIGARE</span>
              <p style={{ fontSize: "11px", color: "#555", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                "{ä.da.length > 80 ? ä.da.slice(0, 79) + "…" : ä.da}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PositionRad({ pos }) {
  const av = AGENT_VISUELL[pos.agent];
  const color = av?.ikonFarg || "#888";
  const andrad = pos.antal_andringar > 0;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "160px 1fr auto",
      gap: "16px", alignItems: "center",
      padding: "13px 16px",
      borderBottom: `1px solid ${C.border}`,
      background: andrad ? "#e8d5a303" : "transparent",
    }}>
      {/* Agent */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
        <a href={`/agent/${encodeURIComponent(pos.agent)}`} style={{
          fontSize: "12px", color: andrad ? color : C.muted, fontFamily: "monospace",
          textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontWeight: andrad ? 700 : 400,
        }}>
          {pos.agent}
        </a>
      </div>

      {/* Position text */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "12px", color: "#ccc", margin: 0, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pos.position}
        </p>
        {andrad && pos.foregaende_position && (
          <p style={{ fontSize: "10px", color: "#555", margin: "3px 0 0", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            ↻ Höll tidigare: "{pos.foregaende_position.length > 60 ? pos.foregaende_position.slice(0, 59) + "…" : pos.foregaende_position}"
          </p>
        )}
      </div>

      {/* Styrka */}
      <div style={{ flexShrink: 0 }}>
        {styrkaBar(pos.styrka, color)}
      </div>
    </div>
  );
}

export default function AsiktsdriftVy({ topAmnen, amneAgenter, rörliga, totalt }) {
  const [valt, setValt] = useState(topAmnen[0]?.amne || "");
  const current = amneAgenter[valt] || [];
  const totaltAndrat = rörliga.reduce((s, a) => s + a.total, 0);

  return (
    <div>
      {/* Statistikrad */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "40px" }}>
        {[
          { v: totalt, lbl: "registrerade ståndpunkter" },
          { v: topAmnen.length, lbl: "ämnesområden" },
          { v: rörliga.length, lbl: "agenter som driftat" },
          { v: totaltAndrat, lbl: "totala positionsändringar" },
        ].map(({ v, lbl }) => (
          <div key={lbl} style={{ borderRight: "1px solid #1a1a1a", paddingRight: "24px", lastChild: { borderRight: "none" } }}>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "monospace", color: C.accent, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Rörliga agenter */}
      {rörliga.length > 0 && (
        <section style={{ marginBottom: "52px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 400, margin: 0, color: C.accent }}>Ideologisk rörlighet</h2>
            <span style={{ fontSize: "11px", color: C.muted, fontFamily: "monospace" }}>agenter som ändrat ståndpunkt</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {rörliga.map(a => <AgentDriftKort key={a.agent} agent={a} />)}
          </div>
        </section>
      )}

      {/* Ämnesvy */}
      {topAmnen.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 400, margin: 0, color: C.accent }}>Ståndpunkter per ämne</h2>
            <span style={{ fontSize: "11px", color: C.muted, fontFamily: "monospace" }}>styrka 1–10 · guld = ändrad</span>
          </div>

          {/* Tab row */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            {topAmnen.map(({ amne, n }) => {
              const active = amne === valt;
              return (
                <button key={amne} onClick={() => setValt(amne)} style={{
                  background: active ? "#e8d5a315" : C.surface,
                  border: `1px solid ${active ? "#e8d5a340" : C.border}`,
                  borderRadius: "20px", padding: "5px 13px", cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                  <span style={{ fontSize: "12px", color: active ? C.gold : C.muted, fontFamily: "monospace" }}>{amne}</span>
                  <span style={{ fontSize: "10px", color: active ? "#b8a57a" : "#444", fontFamily: "monospace" }}>{n}</span>
                </button>
              );
            })}
          </div>

          {/* Position list */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "160px 1fr auto",
              gap: "16px", padding: "10px 16px",
              borderBottom: `1px solid ${C.border}`,
            }}>
              {["Agent", "Ståndpunkt", "Styrka"].map((h, i) => (
                <span key={h} style={{
                  fontSize: "10px", color: C.muted, fontFamily: "monospace",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  textAlign: i === 2 ? "right" : "left",
                }}>{h}</span>
              ))}
            </div>
            {current.length === 0 ? (
              <p style={{ padding: "32px 16px", color: "#444", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
                Inga ståndpunkter registrerade för detta ämne ännu.
              </p>
            ) : (
              current.map(pos => <PositionRad key={pos.agent} pos={pos} />)
            )}
          </div>
        </section>
      )}
    </div>
  );
}
