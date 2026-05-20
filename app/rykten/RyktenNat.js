"use client";
import { useState, useMemo } from "react";

const KANAL_FARG = { slumpmässig: "#a78bfa", konversation: "#34d399", koalition: "#fbbf24" };
const C = { bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e", text: "#c8c8c2", textMuted: "#55554f" };

function kortNamn(namn) {
  // Shorten long names for SVG labels
  const map = {
    "Konservativ debattör": "Konservativ",
    "Kryptoanalytiker": "Krypto",
    "Teknikoptimist": "Teknik",
    "Nationalekonom": "Ekonom",
    "Miljöaktivist": "Miljö",
    "Den nostalgiske": "Nostalgisk",
    "Hypokondrikern": "Hypo",
    "Den stressade": "Stressad",
    "Den hungriga": "Hungrig",
    "Den lugna": "Lugn",
    "Den trötta": "Trött",
    "Den rike": "Rik",
    "Den sura": "Sur",
    "Pensionären": "Pensionär",
    "Tonåringen": "Tonåring",
    "Optimisten": "Optimist",
    "Filosof": "Filosof",
    "Historiker": "Historiker",
    "Journalist": "Journalist",
    "Psykolog": "Psykolog",
    "Sociolog": "Sociolog",
    "Läkare": "Läkare",
    "Jurist": "Jurist",
    "Mamman": "Mamman",
    "Centralbanken": "Banken",
  };
  return map[namn] || namn.split(" ")[0];
}

export default function RyktenNat({ spridningar, rykten }) {
  const [hovradKant, setHovradKant] = useState(null);
  const [hovradNod, setHovradNod] = useState(null);

  const { agenter, kanterMap, nodIndex } = useMemo(() => {
    const involverada = new Set();
    for (const s of spridningar) {
      involverada.add(s.fran_agent);
      involverada.add(s.till_agent);
    }
    // Also add Centralbanken if it appears in rykten om_agent
    for (const r of rykten) {
      if (r.om_agent === "Centralbanken") involverada.add("Centralbanken");
    }
    const agenter = Array.from(involverada).sort();
    const nodIndex = {};
    agenter.forEach((a, i) => { nodIndex[a] = i; });

    // Build edges: (fran, till) → { count, kanaler: {k: n} }
    const kanterMap = {};
    for (const s of spridningar) {
      const key = `${s.fran_agent}→${s.till_agent}`;
      if (!kanterMap[key]) kanterMap[key] = { fran: s.fran_agent, till: s.till_agent, count: 0, kanaler: {} };
      kanterMap[key].count++;
      const k = s.kanal || "slumpmässig";
      kanterMap[key].kanaler[k] = (kanterMap[key].kanaler[k] || 0) + 1;
    }
    return { agenter, kanterMap, nodIndex };
  }, [spridningar, rykten]);

  if (agenter.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: C.textMuted, fontFamily: "monospace", fontSize: 13 }}>
        Nätverket byggs upp när rykten börjar spridas.
      </div>
    );
  }

  const W = 560, H = 560, CX = 280, CY = 280;
  const R = agenter.length <= 8 ? 160 : agenter.length <= 14 ? 200 : 230;

  // Node positions
  const pos = agenter.map((_, i) => {
    const angle = (2 * Math.PI * i) / agenter.length - Math.PI / 2;
    return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  });

  const kanter = Object.values(kanterMap);
  const maxCount = Math.max(...kanter.map(k => k.count), 1);

  function dominantKanal(kanaler) {
    return Object.entries(kanaler).sort((a, b) => b[1] - a[1])[0]?.[0] || "slumpmässig";
  }

  function bezierMid(p1, p2, curvature = 0.25) {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    return { cx: mx - dy * curvature, cy: my + dx * curvature };
  }

  function arrowPoint(p1, cp, p2, t = 0.85) {
    const mt = 1 - t;
    return {
      x: mt * mt * p1.x + 2 * mt * t * cp.x + t * t * p2.x,
      y: mt * mt * p1.y + 2 * mt * t * cp.y + t * t * p2.y,
    };
  }

  const NODE_R = 12;

  // Node stats for hover
  const nodStats = useMemo(() => {
    const stats = {};
    for (const s of spridningar) {
      if (!stats[s.fran_agent]) stats[s.fran_agent] = { skickat: 0, tagit_emot: 0 };
      if (!stats[s.till_agent]) stats[s.till_agent] = { skickat: 0, tagit_emot: 0 };
      stats[s.fran_agent].skickat++;
      stats[s.till_agent].tagit_emot++;
    }
    return stats;
  }, [spridningar]);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
      <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
        Spridningsnätverk
      </h2>
      <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", margin: "0 0 20px" }}>
        Pilar visar spridningsriktning. Tjocklek = antal spridningar. Färg = kanal.
      </p>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(KANAL_FARG).map(([k, f]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 24, height: 3, background: f, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ display: "block", margin: "0 auto" }}>
          <defs>
            {Object.entries(KANAL_FARG).map(([k, f]) => (
              <marker key={k} id={`arrow-${k}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={f} opacity="0.9" />
              </marker>
            ))}
          </defs>

          {/* Edges */}
          {kanter.map(kant => {
            const fi = nodIndex[kant.fran];
            const ti = nodIndex[kant.till];
            if (fi === undefined || ti === undefined) return null;
            const p1 = pos[fi], p2 = pos[ti];
            const cp = bezierMid(p1, p2, 0.3);
            const kanal = dominantKanal(kant.kanaler);
            const farg = KANAL_FARG[kanal] || "#888";
            const strokeW = 1 + (kant.count / maxCount) * 4;
            const key = `${kant.fran}→${kant.till}`;
            const isHov = hovradKant === key;
            const ap = arrowPoint(p1, cp, p2, 0.82);
            return (
              <g key={key}>
                <path
                  d={`M${p1.x},${p1.y} Q${cp.cx},${cp.cy} ${p2.x},${p2.y}`}
                  fill="none"
                  stroke={farg}
                  strokeWidth={isHov ? strokeW + 2 : strokeW}
                  strokeOpacity={isHov ? 1 : 0.55}
                  markerEnd={`url(#arrow-${kanal})`}
                  style={{ cursor: "pointer", transition: "stroke-opacity 0.15s" }}
                  onMouseEnter={() => setHovradKant(key)}
                  onMouseLeave={() => setHovradKant(null)}
                />
                {isHov && (
                  <text x={cp.cx} y={cp.cy - 8} textAnchor="middle"
                    fontSize={10} fill={farg} fontFamily="monospace">
                    {kant.count}×
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {agenter.map((agent, i) => {
            const { x, y } = pos[i];
            const isHov = hovradNod === agent;
            const isCentralbank = agent === "Centralbanken";
            const stats = nodStats[agent] || { skickat: 0, tagit_emot: 0 };
            // Label position: outside the circle
            const angle = (2 * Math.PI * i) / agenter.length - Math.PI / 2;
            const lx = CX + (R + 28) * Math.cos(angle);
            const ly = CY + (R + 28) * Math.sin(angle);
            const anchor = lx < CX - 10 ? "end" : lx > CX + 10 ? "start" : "middle";
            return (
              <g key={agent} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovradNod(agent)}
                onMouseLeave={() => setHovradNod(null)}>
                <circle
                  cx={x} cy={y} r={isHov ? NODE_R + 3 : NODE_R}
                  fill={isCentralbank ? "#1a1a0a" : C.surface}
                  stroke={isCentralbank ? "#fbbf24" : isHov ? "#e8d5a3" : "#333"}
                  strokeWidth={isCentralbank ? 2 : 1.5}
                  style={{ transition: "r 0.15s" }}
                />
                <text x={x} y={y + 4} textAnchor="middle"
                  fontSize={9} fill={isCentralbank ? "#fbbf24" : "#888"} fontFamily="monospace">
                  {stats.skickat}
                </text>
                <text x={lx} y={ly + 4} textAnchor={anchor}
                  fontSize={10} fill={isHov ? "#e8d5a3" : C.textMuted} fontFamily="monospace">
                  {kortNamn(agent)}
                </text>
              </g>
            );
          })}

          {/* Hover info box */}
          {hovradNod && nodStats[hovradNod] && (
            <g>
              <rect x={10} y={10} width={170} height={52} rx={6}
                fill="#0d0d0d" stroke="#2a2a2a" strokeWidth={1} />
              <text x={20} y={28} fontSize={11} fill="#e8d5a3" fontFamily="monospace" fontWeight="bold">
                {hovradNod}
              </text>
              <text x={20} y={43} fontSize={10} fill="#55554f" fontFamily="monospace">
                Skickat: {nodStats[hovradNod].skickat} · Tagit emot: {nodStats[hovradNod].tagit_emot}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
