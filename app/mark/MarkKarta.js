"use client";
import { useState } from "react";
import { AGENT_VISUELL } from "../agentData";

const TYP_FARG = {
  energi:   "#f59e0b",
  jordbruk: "#4ade80",
  industri: "#60a5fa",
  gruva:    "#fb923c",
  stad:     "#a855f7",
  kust:     "#22d3ee",
  skog:     "#86efac",
};

const TYP_IKON = {
  energi:   "⚡",
  jordbruk: "🌾",
  industri: "🏭",
  gruva:    "⛏️",
  stad:     "🏙️",
  kust:     "🌊",
  skog:     "🌲",
};

const TYP_NAMN = {
  energi:   "Energi",
  jordbruk: "Jordbruk",
  industri: "Industri",
  gruva:    "Gruva",
  stad:     "Stad",
  kust:     "Kust",
  skog:     "Skog",
};

const HEX = 40;
const SQRT3 = Math.sqrt(3);

function hexCenter(col, row) {
  const x = HEX * SQRT3 * (col + (row % 2 === 1 ? 0.5 : 0)) + 52;
  const y = HEX * 1.5 * row + 50;
  return [x, y];
}

function hexPts(cx, cy, size = HEX) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function relativeTime(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h sedan`;
  return `${Math.floor(diff / 86400)}d sedan`;
}

// Deterministisk stjärnbakgrund — samma varje render
const STARS = Array.from({ length: 55 }, (_, i) => ({
  x: parseFloat(((i * 137.508) % 530).toFixed(1)),
  y: parseFloat(((i * 97.314 + 13) % 490).toFixed(1)),
  r: [0.6, 0.9, 1.2][i % 3],
  op: 0.04 + (i % 5) * 0.018,
}));

export default function MarkKarta({ zoner, agare, transaktioner }) {
  const [hover, setHover]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [floats, setFloats]     = useState([]); // {id, cx, cy, ink}

  const agareMap = Object.fromEntries(agare.map(a => [a.zon_id, a]));

  // Unika agentfärger för gradientdefinitioner
  const agentGrads = [...new Set(agare.map(a => a.agent))]
    .map(name => ({ name, farg: AGENT_VISUELL[name]?.ikonFarg || "#888" }));

  // Leaderboard
  const leaderMap = {};
  agare.forEach(a => {
    const z = zoner.find(z => z.id === a.zon_id);
    if (!z) return;
    if (!leaderMap[a.agent]) leaderMap[a.agent] = { antal: 0, ink: 0 };
    leaderMap[a.agent].antal++;
    leaderMap[a.agent].ink += z.veckoinkomst;
  });
  const leaders = Object.entries(leaderMap).sort((a, b) => b[1].ink - a[1].ink).slice(0, 8);
  const maxInk = leaders[0]?.[1].ink || 1;

  const totalInk = agare.reduce((s, a) => {
    const z = zoner.find(z => z.id === a.zon_id);
    return s + (z?.veckoinkomst || 0);
  }, 0);

  const active = selected || hover;
  const activeAgare = active ? agareMap[active.id] : null;
  const activeAgentFarg = activeAgare
    ? (AGENT_VISUELL[activeAgare.agent]?.ikonFarg || "#888")
    : null;

  function handleEnter(zon) {
    setHover(zon);
    const [cx, cy] = hexCenter(zon.hex_col, zon.hex_row);
    const id = Math.random();
    setFloats(prev => [...prev.slice(-4), { id, cx, cy, ink: zon.veckoinkomst }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1600);
  }

  return (
    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>

      {/* ── HEX MAP ── */}
      <div style={{ flex: "0 0 auto" }}>
        <svg
          viewBox="0 0 530 490"
          width="530"
          height="490"
          style={{
            display: "block",
            maxWidth: "100%",
            borderRadius: "12px",
            background: "radial-gradient(ellipse at 40% 35%, #0a0f18 0%, #060606 70%)",
            border: "1px solid #1e1e1e",
            boxShadow: "0 0 40px rgba(0,0,0,0.8)",
          }}
        >
          <defs>
            {/* Radial gradient per typ — 3D kupol-effekt */}
            {Object.entries(TYP_FARG).map(([typ, farg]) => (
              <radialGradient key={typ} id={`grad-${typ}`} cx="35%" cy="28%" r="72%">
                <stop offset="0%"   stopColor={farg} stopOpacity="0.38" />
                <stop offset="60%"  stopColor={farg} stopOpacity="0.12" />
                <stop offset="100%" stopColor={farg} stopOpacity="0.03" />
              </radialGradient>
            ))}

            {/* Radial gradient per agent — ägda zoner */}
            {agentGrads.map(({ name, farg }) => (
              <radialGradient key={name} id={`grad-ag-${name.replace(/[^a-zA-Z]/g, "")}`} cx="35%" cy="28%" r="72%">
                <stop offset="0%"   stopColor={farg} stopOpacity="0.55" />
                <stop offset="55%"  stopColor={farg} stopOpacity="0.22" />
                <stop offset="100%" stopColor={farg} stopOpacity="0.06" />
              </radialGradient>
            ))}

            {/* Hover-highlight gradient */}
            <radialGradient id="grad-hover" cx="50%" cy="40%" r="70%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
            </radialGradient>

            {/* Glow filter */}
            <filter id="hexglow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="softglow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="textglow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Stjärnbakgrund */}
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#c8d8ff" opacity={s.op} />
          ))}

          {/* Hexagoner */}
          {zoner.map(zon => {
            const [cx, cy] = hexCenter(zon.hex_col, zon.hex_row);
            const agInfo  = agareMap[zon.id];
            const agName  = agInfo?.agent;
            const agFarg  = agName ? (AGENT_VISUELL[agName]?.ikonFarg || "#888") : null;
            const typFarg = TYP_FARG[zon.typ] || "#555";

            const isHov = hover?.id === zon.id;
            const isSel = selected?.id === zon.id;
            const isAct = isHov || isSel;

            const agGradId = agName
              ? `grad-ag-${agName.replace(/[^a-zA-Z]/g, "")}`
              : null;

            const strokeCol = agFarg
              ? rgba(agFarg,  isAct ? 0.95 : 0.50)
              : rgba(typFarg, isAct ? 0.70 : 0.24);

            const pts = hexPts(cx, cy);

            return (
              <g
                key={zon.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => handleEnter(zon)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setSelected(s => s?.id === zon.id ? null : zon)}
              >
                {/* Yttre glöd — pulsande för ägda zoner */}
                {agFarg && (
                  <polygon
                    points={hexPts(cx, cy, HEX + 5)}
                    fill="none"
                    stroke={agFarg}
                    strokeWidth={isAct ? 3.5 : 2}
                    filter="url(#hexglow)"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.12;0.40;0.12"
                      dur="2.8s"
                      repeatCount="indefinite"
                    />
                  </polygon>
                )}

                {/* Bas-fill: radial gradient för typ */}
                <polygon
                  points={pts}
                  fill={`url(#grad-${zon.typ})`}
                  stroke="none"
                />

                {/* Agent-fill ovanpå (om ägs) */}
                {agGradId && (
                  <polygon
                    points={pts}
                    fill={`url(#${agGradId})`}
                    stroke="none"
                  />
                )}

                {/* Hover/select overlay */}
                {isAct && (
                  <polygon points={pts} fill="url(#grad-hover)" stroke="none" />
                )}

                {/* Kant */}
                <polygon
                  points={pts}
                  fill="none"
                  stroke={strokeCol}
                  strokeWidth={isAct ? 1.8 : agFarg ? 1.2 : 0.6}
                />

                {/* Inre kant-highlight för djup */}
                <polygon
                  points={hexPts(cx, cy, HEX - 4)}
                  fill="none"
                  stroke={agFarg ? rgba(agFarg, isAct ? 0.30 : 0.12) : rgba(typFarg, 0.08)}
                  strokeWidth="0.8"
                />

                {/* Resurs-ikon */}
                <text
                  x={cx} y={agName ? cy - 10 : cy - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isAct ? 18 : 15}
                  filter={isAct ? "url(#textglow)" : undefined}
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {TYP_IKON[zon.typ]}
                </text>

                {/* Inkomst */}
                <text
                  x={cx} y={agName ? cy + 4 : cy + 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill={agFarg ? rgba(agFarg, isAct ? 1 : 0.8) : rgba(typFarg, isAct ? 0.9 : 0.65)}
                  fontFamily="monospace"
                  fontWeight={agFarg ? "700" : "400"}
                  filter={agFarg && isAct ? "url(#textglow)" : undefined}
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {zon.veckoinkomst}kr
                </text>

                {/* Agent-etikett */}
                {agName && (
                  <text
                    x={cx} y={cy + 17}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="6.5"
                    fill={agFarg}
                    fontFamily="monospace"
                    fontWeight="700"
                    filter={isAct ? "url(#softglow)" : undefined}
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {agName.slice(0, 6).toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}

          {/* Flytande inkomstbadgar */}
          {floats.map(f => (
            <text
              key={f.id}
              x={f.cx}
              y={f.cy - 20}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="700"
              filter="url(#softglow)"
              style={{ pointerEvents: "none" }}
            >
              +{f.ink}kr/v
              <animate attributeName="opacity" from="1" to="0" dur="1.5s" fill="freeze" />
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="0 -48"
                dur="1.5s"
                fill="freeze"
              />
            </text>
          ))}

          {/* Kartans titel */}
          <text x="12" y="18" fontSize="9" fill="#2a2a2a" fontFamily="monospace" letterSpacing="0.12em">
            MARKARTAN · {zoner.length} ZONER · {agare.length} ÄGDA
          </text>
        </svg>

        {/* Teckenförklaring */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
          {Object.entries(TYP_FARG).map(([typ, farg]) => (
            <span key={typ} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "1px", background: farg, opacity: 0.7 }} />
              <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>
                {TYP_IKON[typ]} {TYP_NAMN[typ]}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── SIDOPANEL ── */}
      <div style={{ flex: 1, minWidth: "220px", maxWidth: "320px" }}>

        {/* Zondetalj */}
        {active ? (
          <div style={{
            background: "#0e0e0e",
            border: `1px solid ${rgba(TYP_FARG[active.typ] || "#333", 0.35)}`,
            borderRadius: "8px", padding: "14px 16px", marginBottom: "16px",
            boxShadow: `0 0 20px ${rgba(TYP_FARG[active.typ] || "#333", 0.08)}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "20px" }}>{TYP_IKON[active.typ]}</span>
              <span style={{ fontSize: "15px", color: "#f0ede6", fontFamily: "Georgia, serif" }}>{active.namn}</span>
            </div>
            <p style={{ fontSize: "11px", color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>
              {active.beskrivning}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "8px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "2px" }}>VECKOINKOMST</div>
                <div style={{ fontSize: "18px", color: TYP_FARG[active.typ] || "#fff", lineHeight: 1 }}>
                  {active.veckoinkomst} <span style={{ fontSize: "10px" }}>kr/v</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "8px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "2px" }}>KÖPPRIS</div>
                <div style={{ fontSize: "18px", color: "#f0ede6", lineHeight: 1 }}>
                  {active.koppris} <span style={{ fontSize: "10px" }}>kr</span>
                </div>
              </div>
            </div>
            {activeAgare ? (
              <div style={{
                padding: "7px 10px",
                background: rgba(activeAgentFarg, 0.07),
                border: `1px solid ${rgba(activeAgentFarg, 0.25)}`,
                borderRadius: "4px",
              }}>
                <span style={{ fontSize: "10px", fontFamily: "monospace", color: activeAgentFarg }}>
                  ▣ ÄGES AV: {activeAgare.agent}
                </span>
              </div>
            ) : (
              <div style={{ padding: "7px 10px", background: "#0a140a", border: "1px solid #1a3a1a", borderRadius: "4px" }}>
                <span style={{ fontSize: "10px", color: "#4ade8077", fontFamily: "monospace" }}>◯ TILLGÄNGLIG FÖR KÖP</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px",
            padding: "12px 14px", marginBottom: "16px",
            fontSize: "11px", color: "#333", fontFamily: "monospace", textAlign: "center",
          }}>
            Hovra eller klicka på en zon
          </div>
        )}

        {/* Statistik */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          {[
            ["ZONER",     zoner.length,                "#666"],
            ["ÄGDA",      agare.length,                "#4ade80"],
            ["FRIA",      zoner.length - agare.length, "#38bdf8"],
            ["VECKOINK.", `${totalInk} kr`,            "#f59e0b"],
          ].map(([lbl, val, c]) => (
            <div key={lbl} style={{ background: "#0d0d0d", border: "1px solid #181818", borderRadius: "6px", padding: "8px 10px" }}>
              <div style={{ fontSize: "8px", color: "#3a3a3a", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: "3px" }}>{lbl}</div>
              <div style={{ fontSize: "17px", color: c, lineHeight: 1 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        {leaders.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 10px" }}>MARKÄGARE</p>
            {leaders.map(([agent, stats], i) => {
              const af = AGENT_VISUELL[agent]?.ikonFarg || "#888";
              return (
                <div key={agent} style={{ marginBottom: "9px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontSize: "11px", color: af, fontFamily: "monospace" }}>{i + 1}. {agent}</span>
                    <span style={{ fontSize: "10px", color: "#333", fontFamily: "monospace" }}>{stats.antal} zon{stats.antal !== 1 ? "er" : ""}</span>
                  </div>
                  <div style={{ height: "2px", background: "#181818", borderRadius: "2px" }}>
                    <div style={{
                      height: "2px", background: af, borderRadius: "2px",
                      width: `${(stats.ink / maxInk) * 100}%`,
                      boxShadow: `0 0 6px ${rgba(af, 0.6)}`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", marginTop: "2px" }}>{stats.ink} kr/vecka</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Senaste köp */}
        {transaktioner.length > 0 && (
          <div>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>SENASTE KÖP</p>
            {transaktioner.slice(0, 6).map((t, i) => {
              const af = AGENT_VISUELL[t.kop_agent]?.ikonFarg || "#888";
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 8px", background: "#0a0a0a",
                  borderLeft: `2px solid ${rgba(af, 0.4)}`,
                  marginBottom: "4px", borderRadius: "0 4px 4px 0",
                }}>
                  <div>
                    <div style={{ fontSize: "10px", color: af, fontFamily: "monospace" }}>{t.kop_agent}</div>
                    <div style={{ fontSize: "9px", color: "#444" }}>{t.zon_namn}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "monospace" }}>{t.pris} kr</div>
                    <div style={{ fontSize: "8px", color: "#333", fontFamily: "monospace" }}>{relativeTime(t.skapad)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
