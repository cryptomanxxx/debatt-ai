"use client";
import { useState } from "react";
import { AGENT_VISUELL } from "../agentData";

const ALLA_AGENTER = Object.keys(AGENT_VISUELL);
const SVG_W = 560;
const SVG_H = 560;

function nodePositions(r, cx, cy) {
  return ALLA_AGENTER.map((namn, i) => {
    const angle = (i / ALLA_AGENTER.length) * 2 * Math.PI - Math.PI / 2;
    return { namn, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

export default function LobbyingNatverk({ flows, nodeActivity }) {
  const [hovered, setHovered] = useState(null);

  const nodes = nodePositions(210, SVG_W / 2, SVG_H / 2);
  const nodeMap = Object.fromEntries(nodes.map(n => [n.namn, n]));
  const maxTotal = Math.max(...flows.map(f => f.total), 1);
  const maxActivity = Math.max(...Object.values(nodeActivity).map(a => a.sent + a.received), 1);

  // Visa bara topp-40 flöden för läsbarhet
  const topFlows = [...flows].sort((a, b) => b.total - a.total).slice(0, 40);

  return (
    <div style={{ display: "flex", justifyContent: "center", background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", overflow: "hidden" }}>
      <svg width={SVG_W} height={SVG_H} style={{ display: "block", maxWidth: "100%" }}>
        <defs>
          <marker id="arrow-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#4ade80" />
          </marker>
          <marker id="arrow-y" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#facc15" />
          </marker>
          <marker id="arrow-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#f87171" />
          </marker>
        </defs>

        {/* Riktade pilar — lobbyingflöden */}
        {topFlows.map((f, i) => {
          const a = nodeMap[f.from];
          const b = nodeMap[f.to];
          if (!a || !b) return null;

          const isActive = hovered && (f.from === hovered || f.to === hovered);
          const opacity = hovered ? (isActive ? 0.9 : 0.04) : 0.25 + (f.total / maxTotal) * 0.55;
          const strokeW = 0.5 + (f.total / maxTotal) * 3.5;

          const successRate = f.forsok > 0 ? f.lyckade / f.forsok : 0;
          const markerId = successRate > 0.55 ? "arrow-g" : successRate > 0.25 ? "arrow-y" : "arrow-r";
          const strokeColor = successRate > 0.55 ? "#4ade80" : successRate > 0.25 ? "#facc15" : "#f87171";

          // Böjd kurva för att skilja A→B från B→A
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const curve = 28;
          const mx = (a.x + b.x) / 2 + curve * (-dy / len);
          const my = (a.y + b.y) / 2 + curve * (dx / len);

          // Förkorta slutpunkten så pilen inte överlappas av noden
          const t = (len - 14) / len;
          const ex = a.x + dx * t + curve * (-dy / len) * (1 - t) * 2;
          const ey = a.y + dy * t + curve * (dx / len) * (1 - t) * 2;

          return (
            <path
              key={i}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${ex} ${ey}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isActive ? strokeW + 1 : strokeW}
              opacity={opacity}
              markerEnd={`url(#${markerId})`}
              strokeLinecap="round"
            />
          );
        })}

        {/* Noder — agenter */}
        {nodes.map(({ namn, x, y }) => {
          const av = AGENT_VISUELL[namn];
          const farg = av?.ikonFarg || "#888";
          const ikon = av?.ikon || "·";
          const act = nodeActivity[namn] || { sent: 0, received: 0 };
          const actPct = (act.sent + act.received) / maxActivity;
          const r = 8 + actPct * 7;
          const isHovered = hovered === namn;
          const isConnected = hovered
            ? topFlows.some(f => (f.from === hovered && f.to === namn) || (f.from === namn && f.to === hovered))
            : false;
          const dimmed = hovered && !isHovered && !isConnected;

          return (
            <g
              key={namn}
              onMouseEnter={() => setHovered(namn)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={x} cy={y} r={isHovered ? r + 4 : r}
                fill={isHovered ? farg + "33" : "#111"}
                stroke={farg}
                strokeWidth={isHovered ? 2 : isConnected ? 1.5 : actPct > 0.1 ? 1 : 0.4}
                opacity={dimmed ? 0.25 : 1}
              />
              <text x={x} y={y + 4} textAnchor="middle"
                fontSize={isHovered ? 11 : 9}
                fill={farg}
                opacity={dimmed ? 0.25 : 1}
              >
                {ikon}
              </text>
              {isHovered && (
                <>
                  <text x={x} y={y + r + 14} textAnchor="middle"
                    fontSize={8} fill="#e8e8e8" fontFamily="monospace">
                    {namn.length > 15 ? namn.slice(0, 14) + "…" : namn}
                  </text>
                  {(act.sent > 0 || act.received > 0) && (
                    <text x={x} y={y + r + 24} textAnchor="middle"
                      fontSize={7} fill="#666" fontFamily="monospace">
                      {act.sent > 0 ? `↑${act.sent} skickat` : ""}
                      {act.sent > 0 && act.received > 0 ? "  " : ""}
                      {act.received > 0 ? `↓${act.received} mottaget` : ""}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
