"use client";
import { useState } from "react";
import { AGENT_VISUELL } from "../agentData";

const W = 640, H = 640, M = 72, PLOT = W - M * 2;

const KORT_NAMN = {
  "Nationalekonom": "Ekon.", "Miljöaktivist": "Miljö", "Teknikoptimist": "Teknik",
  "Konservativ debattör": "Konserv.", "Jurist": "Jurist", "Journalist": "Journ.",
  "Filosof": "Filosof", "Läkare": "Läkare", "Psykolog": "Psykolog",
  "Historiker": "Historik.", "Sociolog": "Sociolog", "Kryptoanalytiker": "Krypto",
  "Den hungriga": "Hungrig", "Mamman": "Mamman", "Den sura": "Sur",
  "Den trötta": "Trött", "Den stressade": "Stressad", "Den lugna": "Lugn",
  "Pensionären": "Pension.", "Tonåringen": "Tonår.", "Den nostalgiske": "Nostalg.",
  "Hypokondrikern": "Hypok.", "Optimisten": "Optimist", "Den rike": "Rik",
};

function cx(x) { return M + (x + 1) / 2 * PLOT; }
function cy(y) { return M + (1 - y) / 2 * PLOT; }

export default function IdeologiskKompass({ agenter }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", maxWidth: `${W}px`, display: "block", background: "#0d0d0d", borderRadius: "12px", border: "1px solid #1a1a1a" }}
      >
        {/* Quadrant fills */}
        <rect x={M} y={M} width={PLOT/2} height={PLOT/2} fill="rgba(74,222,128,0.04)" />
        <rect x={M+PLOT/2} y={M} width={PLOT/2} height={PLOT/2} fill="rgba(74,158,255,0.04)" />
        <rect x={M} y={M+PLOT/2} width={PLOT/2} height={PLOT/2} fill="rgba(248,113,113,0.04)" />
        <rect x={M+PLOT/2} y={M+PLOT/2} width={PLOT/2} height={PLOT/2} fill="rgba(247,147,26,0.04)" />

        {/* Subtle grid */}
        {[-0.5, 0.5].map(v => (
          <g key={v}>
            <line x1={cx(v)} y1={M} x2={cx(v)} y2={M+PLOT} stroke="#181818" strokeWidth="1" />
            <line x1={M} y1={cy(v)} x2={M+PLOT} y2={cy(v)} stroke="#181818" strokeWidth="1" />
          </g>
        ))}

        {/* Axes */}
        <line x1={M} y1={cy(0)} x2={M+PLOT} y2={cy(0)} stroke="#252525" strokeWidth="1.5" />
        <line x1={cx(0)} y1={M} x2={cx(0)} y2={M+PLOT} stroke="#252525" strokeWidth="1.5" />

        {/* Axis labels */}
        <text x={M-6} y={cy(0)+4} textAnchor="end" fill="#383838" fontSize="12" fontFamily="monospace">STAT</text>
        <text x={M+PLOT+6} y={cy(0)+4} textAnchor="start" fill="#383838" fontSize="12" fontFamily="monospace">MARKNAD</text>
        <text x={cx(0)} y={M-14} textAnchor="middle" fill="#383838" fontSize="12" fontFamily="monospace">PROGRESSIV</text>
        <text x={cx(0)} y={M+PLOT+22} textAnchor="middle" fill="#383838" fontSize="12" fontFamily="monospace">KONSERVATIV</text>

        {/* Quadrant labels */}
        <text x={M+10} y={M+18} fill="rgba(74,222,128,0.35)" fontSize="9" fontFamily="monospace" fontWeight="700" letterSpacing="0.08em">VÄNSTERLIBERAL</text>
        <text x={M+PLOT-10} y={M+18} textAnchor="end" fill="rgba(74,158,255,0.35)" fontSize="9" fontFamily="monospace" fontWeight="700" letterSpacing="0.08em">SOCIALLIBERAL</text>
        <text x={M+10} y={M+PLOT-6} fill="rgba(248,113,113,0.35)" fontSize="9" fontFamily="monospace" fontWeight="700" letterSpacing="0.08em">NATIONALKONSERVATIV</text>
        <text x={M+PLOT-10} y={M+PLOT-6} textAnchor="end" fill="rgba(247,147,26,0.35)" fontSize="9" fontFamily="monospace" fontWeight="700" letterSpacing="0.08em">KONSERVATIV</text>

        {/* Agent dots */}
        {agenter.map(a => {
          const av = AGENT_VISUELL[a.namn];
          const color = av?.ikonFarg || "#888";
          const isHov = hovered?.namn === a.namn;
          const r = isHov ? 9 : 7;
          const lx = cx(a.x), ly = cy(a.y);
          return (
            <g key={a.namn} onMouseEnter={() => setHovered(a)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
              {isHov && <circle cx={lx} cy={ly} r={r + 7} fill={color} opacity="0.10" />}
              {a.antalAndringar > 3 && (
                <circle cx={lx} cy={ly} r={r + 4} fill="none" stroke={color} strokeWidth="1" opacity="0.35" strokeDasharray="2 3" />
              )}
              <circle cx={lx} cy={ly} r={r} fill={color} opacity={isHov ? 1 : 0.82} />
              <text
                x={lx} y={ly + r + 11}
                textAnchor="middle"
                fill={isHov ? color : "#4a4a4a"}
                fontSize="8.5"
                fontFamily="monospace"
              >
                {KORT_NAMN[a.namn] || a.namn}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: "absolute", top: "14px", right: "14px",
          background: "#111", border: "1px solid #222", borderRadius: "8px",
          padding: "14px 16px", width: "210px", pointerEvents: "none",
          boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
        }}>
          <div style={{ fontSize: "13px", color: "#f0ede6", fontWeight: 600, marginBottom: "6px", lineHeight: 1.3 }}>
            {hovered.namn}
          </div>
          <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", marginBottom: "10px" }}>
            {hovered.x > 0.15 ? "MARKNAD" : hovered.x < -0.15 ? "STAT" : "NEUTRAL"} ·{" "}
            {hovered.y > 0.15 ? "PROGRESSIV" : hovered.y < -0.15 ? "KONSERVATIV" : "NEUTRAL"}
          </div>
          {hovered.positioner.length > 0 ? (
            hovered.positioner.slice(0, 4).map(p => (
              <div key={p.amne} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "9px", color: "#666", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{p.amne}</div>
                <div style={{ fontSize: "11px", color: "#aaa", lineHeight: 1.45 }}>{p.position}</div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: "11px", color: "#444", margin: 0, fontStyle: "italic" }}>
              Inga registrerade ståndpunkter ännu.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
