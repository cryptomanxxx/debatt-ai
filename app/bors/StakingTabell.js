"use client";
import { useState } from "react";

const C = {
  text:      "#e8e8e2",
  textMuted: "#55554f",
  border:    "#1a1a1a",
  surface:   "#111111",
  surface2:  "#0d0d0d",
};

const BATCH = 8;

function symbolFarg(sym) {
  return sym === "DBT" ? "#fbbf24" : sym === "NOVA" ? "#a855f7" : "#22d3ee";
}
function symbolIkon(sym) {
  return sym === "DBT" ? "🟡" : sym === "NOVA" ? "🟣" : "🔵";
}

export default function StakingTabell({ rader }) {
  const [visa, setVisa] = useState(BATCH);
  const synliga = rader.slice(0, visa);
  const kvar    = rader.length - synliga.length;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      {/* Tabellhuvud */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 80px 80px 65px 95px 100px",
        padding: "10px 16px",
        fontSize: 9, color: C.textMuted, fontFamily: "monospace",
        letterSpacing: "0.08em",
        borderBottom: `1px solid ${C.border}`,
        background: C.surface2,
      }}>
        <span>AGENT</span>
        <span style={{ textAlign: "center" }}>TOKEN</span>
        <span style={{ textAlign: "right" }}>ANTAL</span>
        <span style={{ textAlign: "right" }}>POOL %</span>
        <span style={{ textAlign: "right" }}>FÖRFALLER</span>
        <span style={{ textAlign: "right" }}>YIELD KVAR</span>
      </div>

      {synliga.map((s, i) => {
        const farg    = symbolFarg(s.symbol);
        const ikon    = symbolIkon(s.symbol);
        const dagText = s.dagarKvar === 0 ? "idag" : `${s.dagarKvar}d`;
        const dagFarg = s.dagarKvar <= 1 ? "#fbbf24" : C.textMuted;
        const pct     = s.poolAndelPct != null ? `${s.poolAndelPct.toFixed(1)}%` : `APY ${(s.apy * 100).toFixed(0)}%`;
        return (
          <div key={s.id ?? i} style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 80px 65px 95px 100px",
            padding: "9px 16px",
            fontSize: 11, fontFamily: "monospace",
            borderBottom: `1px solid ${C.border}`,
            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
            alignItems: "center",
          }}>
            <span style={{ color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.agent}
            </span>
            <span style={{ color: farg, textAlign: "center" }}>
              {ikon} {s.symbol}
            </span>
            <span style={{ color: C.text, textAlign: "right" }}>
              {s.antal.toFixed(2)}
            </span>
            <span style={{ color: s.poolAndelPct != null ? "#a855f7" : "#4ade80", textAlign: "right" }}>
              {pct}
            </span>
            <span style={{ color: dagFarg, textAlign: "right" }}>
              {s.slut_datum} <span style={{ fontSize: 9 }}>({dagText})</span>
            </span>
            <span style={{ color: "#4ade80", textAlign: "right", fontWeight: 600 }}>
              +{s.yieldKvar.toFixed(2)} kr
            </span>
          </div>
        );
      })}

      {kvar > 0 && (
        <button
          onClick={() => setVisa(v => v + BATCH)}
          style={{
            display: "block", width: "100%",
            padding: "10px 0",
            background: "transparent",
            border: "none",
            borderTop: `1px solid ${C.border}`,
            color: C.textMuted,
            fontFamily: "monospace", fontSize: 11,
            cursor: "pointer",
          }}
          onMouseOver={e => e.currentTarget.style.color = C.text}
          onMouseOut={e  => e.currentTarget.style.color = C.textMuted}
        >
          Ladda mer ({kvar} kvar) ↓
        </button>
      )}
    </div>
  );
}
