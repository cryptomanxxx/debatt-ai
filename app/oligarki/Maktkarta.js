"use client";
import { useState } from "react";

const W = 640;
const CX = 320;
const CY = 320;
const RING_R = 255;

function maktRingFarg(makt) {
  if (makt >= 65) return "#f87171";
  if (makt >= 45) return "#facc15";
  if (makt >= 25) return "#4ade80";
  return "#4a9eff";
}

function kortNamn(namn) {
  // "Den trötta" → "D.trötta", "Kryptoanalytiker" → "Krypto"
  const delar = namn.split(" ");
  if (delar.length === 1) return namn.slice(0, 8);
  if (delar[0].length <= 3) return delar[0][0] + "." + delar[1].slice(0, 6);
  return delar[0].slice(0, 7);
}

export default function Maktkarta({ nodes, edges }) {
  const [hovered, setHovered] = useState(null);
  if (!nodes || nodes.length === 0) return null;

  const n = nodes.length;
  // Assign positions
  const positions = {};
  nodes.forEach((node, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    positions[node.agent] = {
      x: CX + RING_R * Math.cos(angle),
      y: CY + RING_R * Math.sin(angle),
    };
  });

  const maxStyrka = Math.max(...edges.map(e => e.styrka), 1);
  const hovNode = hovered ? nodes.find(n => n.agent === hovered) : null;
  const hovPos  = hovered ? positions[hovered] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${W}`} style={{ display: "block", maxWidth: 640, margin: "0 auto" }}>
        <defs>
          <filter id="mk-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="mk-glow-sm" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Coalition edges */}
        {edges.map((e, i) => {
          const pa = positions[e.a];
          const pb = positions[e.b];
          if (!pa || !pb) return null;
          const isHovEdge = hovered === e.a || hovered === e.b;
          const opacity = isHovEdge ? 0.9 : Math.min(0.55, 0.15 + (e.styrka / maxStyrka) * 0.4);
          const w = 0.8 + (e.styrka / maxStyrka) * 3.5;
          const col = isHovEdge ? "#e879f9" : "#444";
          return (
            <line key={i}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={col} strokeWidth={w} opacity={opacity}
              style={{ transition: "opacity 0.15s" }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const p = positions[node.agent];
          if (!p) return null;
          const isHov  = hovered === node.agent;
          const isConn = hovered && edges.some(e => (e.a === hovered && e.b === node.agent) || (e.b === hovered && e.a === node.agent));
          const dimmed = hovered && !isHov && !isConn;
          const ringFarg = maktRingFarg(node.makt);
          const ringW = 1.5 + (node.makt / 100) * 5;
          const lbl = kortNamn(node.agent);

          return (
            <g key={node.agent}
              style={{ cursor: "pointer", opacity: dimmed ? 0.25 : 1, transition: "opacity 0.15s" }}
              onMouseEnter={() => setHovered(node.agent)}
              onMouseLeave={() => setHovered(null)}
              filter={isHov ? "url(#mk-glow)" : node.makt >= 60 ? "url(#mk-glow-sm)" : undefined}
            >
              {/* Power ring */}
              <circle cx={p.x} cy={p.y} r={node.nodeR + ringW + 1}
                fill="none" stroke={ringFarg} strokeWidth={ringW} opacity={0.85} />
              {/* Agent node */}
              <circle cx={p.x} cy={p.y} r={node.nodeR}
                fill="#0a0a0a" stroke={node.farg} strokeWidth={isHov ? 2.5 : 1.5} />
              {/* Label */}
              <text x={p.x} y={p.y + node.nodeR + 12}
                textAnchor="middle" fill={isHov ? node.farg : "#666"}
                fontSize={isHov ? 11 : 9} fontFamily="monospace"
                style={{ transition: "fill 0.15s, font-size 0.15s", userSelect: "none" }}
              >{lbl}</text>
            </g>
          );
        })}

        {/* Hover tooltip in center */}
        {hovNode && hovPos && (
          <g>
            <rect x={CX - 90} y={CY - 52} width={180} height={104} rx={10}
              fill="#111" stroke={hovNode.farg} strokeWidth={1.5} opacity={0.97} />
            <text x={CX} y={CY - 28} textAnchor="middle" fill={hovNode.farg}
              fontSize={13} fontFamily="monospace" fontWeight={700}>{hovNode.agent}</text>
            <text x={CX} y={CY - 10} textAnchor="middle" fill="#aaa" fontSize={11} fontFamily="monospace">
              {hovNode.saldo.toLocaleString("sv-SE")} kr
            </text>
            <text x={CX} y={CY + 8} textAnchor="middle" fill={maktRingFarg(hovNode.makt)} fontSize={11} fontFamily="monospace">
              Makt {hovNode.makt}/100
            </text>
            <text x={CX} y={CY + 26} textAnchor="middle" fill="#666" fontSize={10} fontFamily="monospace">
              Koalitioner: {edges.filter(e => e.a === hovNode.agent || e.b === hovNode.agent).length} band
            </text>
            <text x={CX} y={CY + 44} textAnchor="middle" fill="#555" fontSize={10} fontFamily="monospace">
              Rang #{hovNode.maktRank}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
        {[
          { farg: "#4a9eff", label: "Låg makt (0–24)" },
          { farg: "#4ade80", label: "Måttlig makt (25–44)" },
          { farg: "#facc15", label: "Hög makt (45–64)" },
          { farg: "#f87171", label: "Dominant (65+)" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", border: `3px solid ${l.farg}` }} />
            <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 3, background: "#444" }} />
          <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>Koalitionsband</span>
        </div>
      </div>
    </div>
  );
}
