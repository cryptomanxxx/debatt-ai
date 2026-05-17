"use client";
import { useState } from "react";
import { AGENT_VISUELL } from "../agentData";

const ALLA_AGENTER = Object.keys(AGENT_VISUELL);
const SVG_W = 580;
const SVG_H = 580;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const R = 220;

function nodePositions() {
  return ALLA_AGENTER.map((namn, i) => {
    const angle = (i / ALLA_AGENTER.length) * 2 * Math.PI - Math.PI / 2;
    return { namn, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  });
}

function trustColor(score) {
  if (score >= 70) return "#4ade80";
  if (score >= 55) return "#86efac";
  if (score >= 40) return "#facc15";
  if (score >= 25) return "#fb923c";
  return "#f87171";
}

export default function TrustGraph({ pairs, byAgent }) {
  const [hovered, setHovered] = useState(null);
  const nodes = nodePositions();
  const nodeMap = Object.fromEntries(nodes.map(n => [n.namn, n]));

  // Show top 45 highest-trust pairs + any with score < 25
  const visiblePairs = [
    ...pairs.slice(0, 45),
    ...pairs.filter(p => p.score < 25),
  ].filter((p, i, arr) => arr.findIndex(x => x.a === p.a && x.b === p.b) === i);

  const maxScore = Math.max(...pairs.map(p => p.score), 1);

  return (
    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
      {/* SVG graph */}
      <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", overflow: "hidden", flex: "0 0 auto" }}>
        <svg width={SVG_W} height={SVG_H} style={{ display: "block", maxWidth: "100%" }}>
          {/* Edges */}
          {visiblePairs.map((p, i) => {
            const a = nodeMap[p.a];
            const b = nodeMap[p.b];
            if (!a || !b) return null;

            const isActive = hovered && (p.a === hovered || p.b === hovered);
            const dimmed = hovered && !isActive;
            const opacity = dimmed ? 0.03 : hovered ? 0.9 : 0.15 + (p.score / maxScore) * 0.5;
            const strokeW = 0.4 + (p.score / maxScore) * 3;
            const color = trustColor(p.score);

            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={color}
                strokeWidth={isActive ? strokeW + 1.5 : strokeW}
                opacity={opacity}
                strokeLinecap="round"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(({ namn, x, y }) => {
            const av = AGENT_VISUELL[namn];
            const farg = av?.ikonFarg || "#888";
            const ikon = av?.ikon || "·";
            const isHovered = hovered === namn;
            const agentPairs = byAgent[namn] || [];
            const avgTrust = agentPairs.length
              ? Math.round(agentPairs.reduce((s, p) => s + p.score, 0) / agentPairs.length)
              : 10;
            const nodeR = 7 + (avgTrust / 100) * 8;
            const dimmed = hovered && !isHovered && !visiblePairs.some(p => (p.a === hovered && p.b === namn) || (p.b === hovered && p.a === namn));

            return (
              <g key={namn} onMouseEnter={() => setHovered(namn)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
                <circle
                  cx={x} cy={y} r={isHovered ? nodeR + 4 : nodeR}
                  fill={isHovered ? farg + "22" : "#111"}
                  stroke={farg}
                  strokeWidth={isHovered ? 2 : 0.8}
                  opacity={dimmed ? 0.2 : 1}
                />
                <text x={x} y={y + 4} textAnchor="middle" fontSize={isHovered ? 11 : 9} fill={farg} opacity={dimmed ? 0.2 : 1}>
                  {ikon}
                </text>
                {isHovered && (() => {
                  const sorted = [...agentPairs].sort((a, b) => b.score - a.score);
                  const topAlly = sorted[0];
                  const topRival = sorted[sorted.length - 1];
                  return (
                    <>
                      <text x={x} y={y + nodeR + 14} textAnchor="middle" fontSize={8} fill="#e8e8e8" fontFamily="monospace">
                        {namn.length > 16 ? namn.slice(0, 15) + "…" : namn}
                      </text>
                      <text x={x} y={y + nodeR + 25} textAnchor="middle" fontSize={7} fill="#888" fontFamily="monospace">
                        snitt {avgTrust}%
                      </text>
                      {topAlly && (
                        <text x={x} y={y + nodeR + 36} textAnchor="middle" fontSize={7} fill="#4ade80" fontFamily="monospace">
                          ↑ {topAlly.agent.split(" ")[0]} {topAlly.score}%
                        </text>
                      )}
                      {topRival && topRival.score < 30 && (
                        <text x={x} y={y + nodeR + 46} textAnchor="middle" fontSize={7} fill="#f87171" fontFamily="monospace">
                          ↓ {topRival.agent.split(" ")[0]} {topRival.score}%
                        </text>
                      )}
                    </>
                  );
                })()}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center", minWidth: "140px" }}>
        <p style={{ fontSize: "10px", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: "monospace" }}>Förtroendenivå</p>
        {[
          { color: "#4ade80", label: "Starkt (70–100)" },
          { color: "#86efac", label: "Gott (55–70)" },
          { color: "#facc15", label: "Neutralt (40–55)" },
          { color: "#fb923c", label: "Svagt (25–40)" },
          { color: "#f87171", label: "Lågt (0–25)" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "3px", background: color, borderRadius: "2px" }} />
            <span style={{ fontSize: "11px", color: "#888", fontFamily: "monospace" }}>{label}</span>
          </div>
        ))}
        <p style={{ fontSize: "10px", color: "#444", margin: "16px 0 0", lineHeight: 1.6, fontFamily: "monospace" }}>
          Beräknas från:<br />
          koalitionsstyrka<br />
          parlamentssamsyn<br />
          lobbyingutfall
        </p>
      </div>
    </div>
  );
}
