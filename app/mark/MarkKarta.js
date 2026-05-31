"use client";
import { useState } from "react";
import { AGENT_VISUELL } from "../agentData";

const TYP_FARG = {
  energi:   "#f59e0b",
  jordbruk: "#22c55e",
  industri: "#3b82f6",
  gruva:    "#ea580c",
  stad:     "#9333ea",
  kust:     "#0891b2",
  skog:     "#16a34a",
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

// Tre-stegs terraingradienter
const TERRAIN_STOPS = {
  energi:   [["#fef08a", 0.82], ["#f59e0b", 0.44], ["#92400e", 0.08]],
  jordbruk: [["#bbf7d0", 0.80], ["#22c55e", 0.44], ["#14532d", 0.08]],
  industri: [["#bfdbfe", 0.78], ["#3b82f6", 0.42], ["#1e3a8a", 0.08]],
  gruva:    [["#fcd34d", 0.80], ["#ea580c", 0.44], ["#7c2d12", 0.08]],
  stad:     [["#f0abfc", 0.78], ["#9333ea", 0.42], ["#3b0764", 0.08]],
  kust:     [["#a5f3fc", 0.80], ["#0891b2", 0.44], ["#0c4a6e", 0.08]],
  skog:     [["#d1fae5", 0.80], ["#16a34a", 0.44], ["#14532d", 0.08]],
};

const HEX = 40;
const SQRT3 = Math.sqrt(3);
const SVG_W = 530;
const SVG_H = 490;

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

// Deterministisk stjärnbakgrund
const BG_DOTS = Array.from({ length: 55 }, (_, i) => ({
  x: parseFloat(((i * 137.508) % SVG_W).toFixed(1)),
  y: parseFloat(((i * 97.314 + 13) % SVG_H).toFixed(1)),
  r: [0.5, 0.8, 1.2][i % 3],
  op: 0.03 + (i % 5) * 0.012,
}));

export default function MarkKarta({ zoner, agare, transaktioner }) {
  const [hover, setHover]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [floats, setFloats]     = useState([]);

  const agareMap = Object.fromEntries(agare.map(a => [a.zon_id, a]));
  const agentGrads = [...new Set(agare.map(a => a.agent))]
    .map(name => ({ name, farg: AGENT_VISUELL[name]?.ikonFarg || "#888" }));

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
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          style={{
            display: "block",
            maxWidth: "100%",
            borderRadius: "16px",
            background: "#030c18",
            border: "1px solid #0d1f35",
            boxShadow: "0 0 80px rgba(0,20,60,0.7), 0 0 30px rgba(0,0,0,0.95), inset 0 0 60px rgba(0,10,30,0.5)",
          }}
        >
          <defs>
            {/* ── Terrain radial gradients ── */}
            {Object.entries(TERRAIN_STOPS).map(([typ, stops]) => (
              <radialGradient key={typ} id={`grad-${typ}`} cx="28%" cy="22%" r="82%">
                <stop offset="0%"   stopColor={stops[0][0]} stopOpacity={stops[0][1]} />
                <stop offset="52%"  stopColor={stops[1][0]} stopOpacity={stops[1][1]} />
                <stop offset="100%" stopColor={stops[2][0]} stopOpacity={stops[2][1]} />
              </radialGradient>
            ))}

            {/* ── Agent ownership gradients ── */}
            {agentGrads.map(({ name, farg }) => (
              <radialGradient key={name} id={`grad-ag-${name.replace(/[^a-zA-Z]/g, "")}`} cx="32%" cy="25%" r="78%">
                <stop offset="0%"   stopColor={farg} stopOpacity="0.68" />
                <stop offset="50%"  stopColor={farg} stopOpacity="0.30" />
                <stop offset="100%" stopColor={farg} stopOpacity="0.06" />
              </radialGradient>
            ))}

            {/* ── Ytbelysning (3D-djup) ── */}
            <linearGradient id="hex-light" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.11" />
              <stop offset="40%"  stopColor="white" stopOpacity="0.02" />
              <stop offset="100%" stopColor="black" stopOpacity="0.24" />
            </linearGradient>

            {/* ── Hover overlay ── */}
            <radialGradient id="grad-hover" cx="50%" cy="38%" r="68%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
            </radialGradient>

            {/* ── Landbas-gradienter ── */}
            <radialGradient id="land-inner" cx="48%" cy="45%" r="55%">
              <stop offset="0%"   stopColor="#0d2510" stopOpacity="1" />
              <stop offset="45%"  stopColor="#081a10" stopOpacity="1" />
              <stop offset="100%" stopColor="#040d08" stopOpacity="1" />
            </radialGradient>
            <radialGradient id="coast-glow" cx="50%" cy="50%" r="50%">
              <stop offset="30%"  stopColor="#0d4a6e" stopOpacity="0" />
              <stop offset="75%"  stopColor="#0d4a6e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#051520" stopOpacity="0.8" />
            </radialGradient>

            {/* ── Terrainmönster per zontyp ── */}
            {/* Skog: tall träd-trianglar */}
            <pattern id="pat-skog" patternUnits="userSpaceOnUse" width="22" height="22">
              <polygon points="11,3 6,16 16,16" fill="#4ade80" opacity="0.18"/>
              <rect x="9.5" y="16" width="3" height="3.5" fill="#15803d" opacity="0.14"/>
              <polygon points="5,9 1,18 9,18" fill="#22c55e" opacity="0.12"/>
              <polygon points="18,11 14,19 22,19" fill="#16a34a" opacity="0.10"/>
            </pattern>

            {/* Kust: våglinjer */}
            <pattern id="pat-kust" patternUnits="userSpaceOnUse" width="32" height="14">
              <path d="M0,7 Q8,3 16,7 Q24,11 32,7" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.28"/>
              <path d="M0,11 Q8,8 16,11 Q24,14 32,11" fill="none" stroke="#0891b2" strokeWidth="1" opacity="0.18"/>
            </pattern>

            {/* Jordbruk: odlingsrader */}
            <pattern id="pat-jordbruk" patternUnits="userSpaceOnUse" width="22" height="9">
              <line x1="0" y1="4.5" x2="22" y2="4.5" stroke="#86efac" strokeWidth="1.2" opacity="0.22"/>
              <line x1="0" y1="8.5" x2="22" y2="8.5" stroke="#4ade80" strokeWidth="0.7" opacity="0.14"/>
            </pattern>

            {/* Gruva: bergskristaller */}
            <pattern id="pat-gruva" patternUnits="userSpaceOnUse" width="20" height="20">
              <polygon points="10,3 14,10 10,14 6,10" fill="#fb923c" opacity="0.16"/>
              <polygon points="4,12 7,17 1,17" fill="#ea580c" opacity="0.12"/>
              <polygon points="16,13 19,18 13,18" fill="#c2410c" opacity="0.10"/>
            </pattern>

            {/* Stad: byggnadssilhuetter */}
            <pattern id="pat-stad" patternUnits="userSpaceOnUse" width="26" height="22">
              <rect x="1"  y="10" width="6" height="12" fill="#a855f7" opacity="0.20"/>
              <rect x="9"  y="5"  width="5" height="17" fill="#9333ea" opacity="0.18"/>
              <rect x="16" y="8"  width="4" height="14" fill="#7c3aed" opacity="0.15"/>
              <rect x="22" y="12" width="4" height="10" fill="#a855f7" opacity="0.12"/>
              <line x1="0" y1="22" x2="26" y2="22" stroke="#7c3aed" strokeWidth="1" opacity="0.20"/>
            </pattern>

            {/* Energi: elektrisk strålning */}
            <pattern id="pat-energi" patternUnits="userSpaceOnUse" width="22" height="22">
              <path d="M11,2 L8,11 L13,11 L10,20" fill="none" stroke="#fbbf24" strokeWidth="1.8" opacity="0.24"/>
              <circle cx="11" cy="11" r="2.5" fill="#f59e0b" opacity="0.14"/>
            </pattern>

            {/* Industri: kretskort-mönster */}
            <pattern id="pat-industri" patternUnits="userSpaceOnUse" width="20" height="20">
              <circle cx="4"  cy="4"  r="1.2" fill="#60a5fa" opacity="0.20"/>
              <circle cx="10" cy="4"  r="1.2" fill="#60a5fa" opacity="0.16"/>
              <circle cx="16" cy="4"  r="1.2" fill="#60a5fa" opacity="0.14"/>
              <circle cx="4"  cy="10" r="1.2" fill="#60a5fa" opacity="0.16"/>
              <circle cx="10" cy="10" r="2.0" fill="#93c5fd" opacity="0.20"/>
              <circle cx="16" cy="10" r="1.2" fill="#60a5fa" opacity="0.16"/>
              <circle cx="4"  cy="16" r="1.2" fill="#60a5fa" opacity="0.14"/>
              <circle cx="10" cy="16" r="1.2" fill="#60a5fa" opacity="0.16"/>
              <circle cx="16" cy="16" r="1.2" fill="#60a5fa" opacity="0.14"/>
              <line x1="4"  y1="4"  x2="16" y2="4"  stroke="#3b82f6" strokeWidth="0.6" opacity="0.14"/>
              <line x1="4"  y1="10" x2="16" y2="10" stroke="#3b82f6" strokeWidth="0.6" opacity="0.12"/>
              <line x1="4"  y1="4"  x2="4"  y2="16" stroke="#3b82f6" strokeWidth="0.6" opacity="0.12"/>
              <line x1="10" y1="4"  x2="10" y2="16" stroke="#3b82f6" strokeWidth="0.6" opacity="0.10"/>
            </pattern>

            {/* ── Glow-filter ── */}
            <filter id="hexglow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="5.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="softglow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="textglow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="landglow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* ── Fog of war mask ── */}
            <radialGradient id="fog-grad" cx="50%" cy="50%" r="52%">
              <stop offset="18%" stopColor="white" stopOpacity="1.00" />
              <stop offset="55%" stopColor="white" stopOpacity="0.92" />
              <stop offset="78%" stopColor="white" stopOpacity="0.50" />
              <stop offset="100%" stopColor="white" stopOpacity="0.00" />
            </radialGradient>
            <mask id="fog-mask">
              <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#fog-grad)" />
            </mask>

            {/* ── Kustlinje-clip för landbas ── */}
            <clipPath id="land-clip">
              <path d="M 195 48 C 268 18, 400 38, 468 102 C 530 162, 524 282, 494 368 C 462 452, 372 492, 270 480 C 162 468, 82 414, 62 328 C 38 238, 66 138, 128 90 C 152 68, 174 55, 195 48 Z" />
            </clipPath>
          </defs>

          {/* ── BAKGRUND: djup ocean ── */}
          {BG_DOTS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#a0c4ff" opacity={s.op} />
          ))}

          {/* Animerade havsringar */}
          {[1, 2, 3].map(i => (
            <ellipse key={i}
              cx={SVG_W * 0.5} cy={SVG_H * 0.5}
              rx={SVG_W * 0.22 * i} ry={SVG_H * 0.20 * i}
              fill="none" stroke="#0a2848" strokeWidth="0.8" opacity="0"
            >
              <animate attributeName="opacity"
                values={`0;${0.18 / i};0`}
                dur={`${5.5 + i * 2.8}s`} begin={`${i * 1.4}s`}
                repeatCount="indefinite"
              />
            </ellipse>
          ))}

          {/* ── KUSTLJUS runt landmassan ── */}
          <path
            d="M 195 48 C 268 18, 400 38, 468 102 C 530 162, 524 282, 494 368 C 462 452, 372 492, 270 480 C 162 468, 82 414, 62 328 C 38 238, 66 138, 128 90 C 152 68, 174 55, 195 48 Z"
            fill="none"
            stroke="#0d4a6e"
            strokeWidth="28"
            opacity="0.55"
            filter="url(#landglow)"
          />

          {/* ── LANDBAS (organisk blob) ── */}
          <path
            d="M 195 48 C 268 18, 400 38, 468 102 C 530 162, 524 282, 494 368 C 462 452, 372 492, 270 480 C 162 468, 82 414, 62 328 C 38 238, 66 138, 128 90 C 152 68, 174 55, 195 48 Z"
            fill="url(#land-inner)"
          />

          {/* Kustlinje: subtil ljusrand */}
          <path
            d="M 195 48 C 268 18, 400 38, 468 102 C 530 162, 524 282, 494 368 C 462 452, 372 492, 270 480 C 162 468, 82 414, 62 328 C 38 238, 66 138, 128 90 C 152 68, 174 55, 195 48 Z"
            fill="none"
            stroke="#1a5070"
            strokeWidth="2.5"
            opacity="0.6"
          />

          {/* ── ALLA HEXAGONER: fog-of-war mask ── */}
          <g mask="url(#fog-mask)">
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
                ? rgba(agFarg,  isAct ? 1.0 : 0.58)
                : rgba(typFarg, isAct ? 0.85 : 0.30);

              const pts = hexPts(cx, cy);

              return (
                <g
                  key={zon.id}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => handleEnter(zon)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(s => s?.id === zon.id ? null : zon)}
                >
                  {/* Yttre pulsglöd för ägda zoner */}
                  {agFarg && (
                    <polygon
                      points={hexPts(cx, cy, HEX + 7)}
                      fill="none"
                      stroke={agFarg}
                      strokeWidth={isAct ? 4.5 : 2.8}
                      filter="url(#hexglow)"
                    >
                      <animate attributeName="opacity"
                        values="0.08;0.50;0.08" dur="3.4s"
                        repeatCount="indefinite"
                      />
                    </polygon>
                  )}

                  {/* Mörk basfyllning */}
                  <polygon points={pts} fill="#060e14" stroke="none" />

                  {/* Terrainlager */}
                  <polygon points={pts} fill={`url(#grad-${zon.typ})`} stroke="none" />

                  {/* Terrainmönster-textur */}
                  <polygon points={pts} fill={`url(#pat-${zon.typ})`} stroke="none" />

                  {/* Agentfärglager */}
                  {agGradId && (
                    <polygon points={pts} fill={`url(#${agGradId})`} stroke="none" />
                  )}

                  {/* Ytbelysning 3D */}
                  <polygon points={pts} fill="url(#hex-light)" stroke="none" />

                  {/* Hover/select-overlay */}
                  {isAct && (
                    <polygon points={pts} fill="url(#grad-hover)" stroke="none" />
                  )}

                  {/* Yttre kant */}
                  <polygon
                    points={pts}
                    fill="none"
                    stroke={strokeCol}
                    strokeWidth={isAct ? 2.2 : agFarg ? 1.5 : 0.7}
                  />

                  {/* Inre kant */}
                  <polygon
                    points={hexPts(cx, cy, HEX - 4)}
                    fill="none"
                    stroke={agFarg
                      ? rgba(agFarg, isAct ? 0.38 : 0.15)
                      : rgba(typFarg, isAct ? 0.22 : 0.10)}
                    strokeWidth="0.8"
                  />

                  {/* Resurs-ikon */}
                  <text
                    x={cx} y={agName ? cy - 11 : cy - 6}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={isAct ? 20 : 16}
                    filter={isAct ? "url(#textglow)" : undefined}
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {TYP_IKON[zon.typ]}
                  </text>

                  {/* Inkomstetikett */}
                  <text
                    x={cx} y={agName ? cy + 4 : cy + 9}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="8"
                    fill={agFarg
                      ? rgba(agFarg, isAct ? 1 : 0.84)
                      : rgba(typFarg, isAct ? 0.96 : 0.72)}
                    fontFamily="monospace"
                    fontWeight={agFarg ? "700" : "400"}
                    filter={agFarg && isAct ? "url(#textglow)" : undefined}
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {zon.veckoinkomst}kr
                  </text>

                  {/* Ägarnamn */}
                  {agName && (
                    <text
                      x={cx} y={cy + 18}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="6.5"
                      fill={agFarg}
                      fontFamily="monospace" fontWeight="700"
                      filter={isAct ? "url(#softglow)" : undefined}
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {agName.slice(0, 6).toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Flytande inkomstbadgar */}
          {floats.map(f => (
            <text
              key={f.id}
              x={f.cx} y={f.cy - 20}
              textAnchor="middle"
              fill="#fbbf24" fontSize="12"
              fontFamily="monospace" fontWeight="700"
              filter="url(#softglow)"
              style={{ pointerEvents: "none" }}
            >
              +{f.ink}kr/v
              <animate attributeName="opacity" from="1" to="0" dur="1.5s" fill="freeze" />
              <animateTransform attributeName="transform" type="translate"
                from="0 0" to="0 -52" dur="1.5s" fill="freeze"
              />
            </text>
          ))}

          {/* Kartans titeletikett */}
          <text x="12" y="18" fontSize="9" fill="#1a3050" fontFamily="monospace" letterSpacing="0.12em">
            MARKARTAN · {zoner.length} ZONER · {agare.length} ÄGDA
          </text>
        </svg>

        {/* Teckenförklaring */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
          {Object.entries(TYP_FARG).map(([typ, farg]) => (
            <span key={typ} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "1px", background: farg, opacity: 0.75 }} />
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
