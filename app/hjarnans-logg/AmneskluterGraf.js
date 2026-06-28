"use client";
import { useState, useMemo } from "react";

const TYP_FARG = {
  general:   "#e879f9",
  ekonomi:   "#facc15",
  politik:   "#60a5fa",
  social:    "#4ade80",
  historia:  "#fb923c",
  hälsa:     "#f472b6",
  teknologi: "#a78bfa",
};

const TYP_LABEL = {
  general:   "Allmänt",
  ekonomi:   "Ekonomi",
  politik:   "Politik",
  social:    "Socialt",
  historia:  "Historia",
  hälsa:     "Hälsa",
  teknologi: "Teknologi",
};

function yPos(i, n, pad, H) {
  if (n === 1) return H / 2;
  return pad + i * ((H - pad * 2) / (n - 1));
}

export default function AmneskluterGraf({ poster }) {
  const [hovradAgent, setHovradAgent] = useState(null);
  const [hovradTyp,   setHovradTyp]   = useState(null);

  const { agenter, typer, kanter } = useMemo(() => {
    const agentMap = {};
    const typMap   = {};

    for (const p of poster) {
      const agent = p.agent || "besökare";
      const typ   = p.typ || "general";

      if (!agentMap[agent]) agentMap[agent] = { antal: 0, typer: {} };
      agentMap[agent].antal++;
      agentMap[agent].typer[typ] = (agentMap[agent].typer[typ] || 0) + 1;
      typMap[typ] = (typMap[typ] || 0) + 1;
    }

    const agenter = Object.entries(agentMap)
      .sort((a, b) => b[1].antal - a[1].antal)
      .map(([namn, d]) => ({ namn, ...d }));

    const typer = Object.entries(typMap)
      .sort((a, b) => b[1] - a[1])
      .map(([typ, antal]) => ({ typ, antal }));

    const kanter = [];
    for (const a of agenter) {
      for (const [typ, antal] of Object.entries(a.typer)) {
        kanter.push({ agent: a.namn, typ, antal });
      }
    }

    return { agenter, typer, kanter };
  }, [poster]);

  const W   = 700;
  const pad = 48;
  const ROW = 22;
  const H   = Math.max(280, Math.max(typer.length, agenter.length) * ROW + pad * 2);

  const LEFT_X  = 140;
  const RIGHT_X = 560;

  const typPos = {};
  typer.forEach((t, i) => {
    typPos[t.typ] = { x: LEFT_X, y: yPos(i, typer.length, pad, H) };
  });

  const agentPos = {};
  agenter.forEach((a, i) => {
    agentPos[a.namn] = { x: RIGHT_X, y: yPos(i, agenter.length, pad, H) };
  });

  const maxKant = Math.max(...kanter.map(k => k.antal), 1);

  return (
    <div style={{ marginBottom: "48px" }}>
      <h2 style={{
        fontSize: "13px", color: "#888", fontWeight: "400",
        letterSpacing: "0.12em", textTransform: "uppercase",
        margin: "0 0 6px", fontFamily: "monospace",
      }}>
        Ämneskluster
      </h2>
      <p style={{ fontSize: "12px", color: "#444", marginBottom: "16px", fontFamily: "monospace" }}>
        Hover på ett ämne eller agent för att se kopplingarna · kanttjocklek = antal frågor
      </p>
      <div style={{
        background: "#0c0c0c",
        border: "1px solid #1a1a1a",
        borderRadius: "12px",
        padding: "20px 16px",
        overflowX: "auto",
      }}>
        <svg width={W} height={H} style={{ display: "block", minWidth: "500px" }}>
          {/* Column labels */}
          <text x={LEFT_X}  y={22} textAnchor="middle" fill="#2a2a2a" fontSize="9" letterSpacing="0.14em">ÄMNEN</text>
          <text x={RIGHT_X} y={22} textAnchor="middle" fill="#2a2a2a" fontSize="9" letterSpacing="0.14em">AGENTER</text>

          {/* Edges */}
          {kanter.map((k, i) => {
            const from = typPos[k.typ];
            const to   = agentPos[k.agent];
            if (!from || !to) return null;

            const isHL  = hovradAgent === k.agent || hovradTyp === k.typ;
            const isDim =
              (hovradAgent !== null && hovradAgent !== k.agent) ||
              (hovradTyp   !== null && hovradTyp   !== k.typ);

            const farg = TYP_FARG[k.typ] || "#888";
            const sw   = 0.5 + (k.antal / maxKant) * 3.5;
            const cx   = (from.x + to.x) / 2;

            return (
              <path
                key={i}
                d={`M ${from.x} ${from.y} C ${cx} ${from.y}, ${cx} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                stroke={farg}
                strokeWidth={sw}
                strokeOpacity={isDim ? 0.03 : isHL ? 0.9 : 0.15}
                style={{ transition: "stroke-opacity 0.15s" }}
              />
            );
          })}

          {/* Topic nodes */}
          {typer.map((t) => {
            const pos  = typPos[t.typ];
            const farg = TYP_FARG[t.typ] || "#888";
            const r    = 8 + (t.antal / poster.length) * 18;
            const dim  = hovradTyp !== null && hovradTyp !== t.typ;

            return (
              <g
                key={t.typ}
                onMouseEnter={() => setHovradTyp(t.typ)}
                onMouseLeave={() => setHovradTyp(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={farg}
                  fillOpacity={dim ? 0.12 : 0.88}
                  stroke={farg}
                  strokeWidth="0.5"
                  strokeOpacity={dim ? 0.2 : 1}
                  style={{ transition: "fill-opacity 0.15s" }}
                />
                <text
                  x={pos.x} y={pos.y + 4}
                  textAnchor="middle"
                  fill={dim ? "transparent" : "#000"}
                  fontSize="11" fontWeight="700"
                >
                  {t.antal}
                </text>
                <text
                  x={pos.x - r - 10} y={pos.y + 4}
                  textAnchor="end"
                  fill={dim ? "#222" : "#ccc"}
                  fontSize="12"
                  fontFamily="Georgia, serif"
                  style={{ transition: "fill 0.15s" }}
                >
                  {TYP_LABEL[t.typ] || t.typ}
                </text>
              </g>
            );
          })}

          {/* Agent nodes */}
          {agenter.map((a) => {
            const pos   = agentPos[a.namn];
            const isBes = a.namn === "besökare";
            const farg  = isBes ? "#60a5fa" : "#4ade80";
            const dim   = hovradAgent !== null && hovradAgent !== a.namn;
            const r     = 4 + Math.min(a.antal / maxKant, 1) * 5;

            return (
              <g
                key={a.namn}
                onMouseEnter={() => setHovradAgent(a.namn)}
                onMouseLeave={() => setHovradAgent(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={farg}
                  fillOpacity={dim ? 0.12 : 0.88}
                  style={{ transition: "fill-opacity 0.15s" }}
                />
                <text
                  x={pos.x + r + 8} y={pos.y + 4}
                  fill={dim ? "#282828" : isBes ? "#60a5fa" : "#bbb"}
                  fontSize="12"
                  fontFamily="monospace"
                  style={{ transition: "fill 0.15s" }}
                >
                  {a.namn}
                  <tspan fill={dim ? "#1e1e1e" : "#444"} fontSize="10"> ({a.antal})</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
        {typer.map(t => (
          <div key={t.typ} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: TYP_FARG[t.typ] || "#888",
            }} />
            <span style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>
              {TYP_LABEL[t.typ] || t.typ}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>AI-agent</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#60a5fa" }} />
          <span style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>Besökare</span>
        </div>
      </div>
    </div>
  );
}
