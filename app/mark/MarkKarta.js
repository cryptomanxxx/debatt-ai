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

// Ljusa terraingradienter — synliga på mörk bakgrund
const TERRAIN_STOPS = {
  energi:   [["#fef08a", 0.96], ["#f59e0b", 0.72], ["#78350f", 0.20]],
  jordbruk: [["#bbf7d0", 0.94], ["#22c55e", 0.70], ["#14532d", 0.20]],
  industri: [["#bfdbfe", 0.92], ["#3b82f6", 0.65], ["#1e3a8a", 0.18]],
  gruva:    [["#fed7aa", 0.94], ["#ea580c", 0.70], ["#7c2d12", 0.18]],
  stad:     [["#f3e8ff", 0.92], ["#9333ea", 0.65], ["#3b0764", 0.18]],
  kust:     [["#cffafe", 0.94], ["#0891b2", 0.70], ["#0c4a6e", 0.18]],
  skog:     [["#dcfce7", 0.94], ["#16a34a", 0.70], ["#14532d", 0.20]],
};

const HEX = 40;
const SQRT3 = Math.sqrt(3);
const SVG_W = 530;
const SVG_H = 490;

// Zoners faktiska hex-positioner (beräknade ur hexCenter-formeln)
// Gruva: ~(191,50),(260,50),(225,110),(295,110)
// Skog:  ~(121,50),(87,110),(364,110),(191,410)
// Kust:  ~(87,230),(52,290),(87,350),(398,290),(364,350),(121,410)
// Jordbruk: ~(121,290),(191,290),(156,350),(225,350)
// Stad:  ~(156,110),(191,170),(260,170),(156,230),(225,230)
// Energi: ~(329,50),(398,170),(364,230),(433,230),(329,290),(398,290),(260,410)

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
            borderRadius: "12px",
            background: "#060d18",
            border: "1px solid #0d1f2e",
            boxShadow: "0 4px 40px rgba(0,10,30,0.8)",
          }}
        >
          <defs>
            {/* ── Terrain radialgradienter ── */}
            {Object.entries(TERRAIN_STOPS).map(([typ, stops]) => (
              <radialGradient key={typ} id={`grad-${typ}`} cx="30%" cy="25%" r="80%">
                <stop offset="0%"   stopColor={stops[0][0]} stopOpacity={stops[0][1]} />
                <stop offset="50%"  stopColor={stops[1][0]} stopOpacity={stops[1][1]} />
                <stop offset="100%" stopColor={stops[2][0]} stopOpacity={stops[2][1]} />
              </radialGradient>
            ))}

            {/* ── Agent-gradienter ── */}
            {agentGrads.map(({ name, farg }) => (
              <radialGradient key={name} id={`grad-ag-${name.replace(/[^a-zA-Z]/g, "")}`} cx="32%" cy="25%" r="78%">
                <stop offset="0%"   stopColor={farg} stopOpacity="0.72" />
                <stop offset="50%"  stopColor={farg} stopOpacity="0.35" />
                <stop offset="100%" stopColor={farg} stopOpacity="0.08" />
              </radialGradient>
            ))}

            {/* ── 3D ytbelysning ── */}
            <linearGradient id="hex-light" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.14" />
              <stop offset="40%"  stopColor="white" stopOpacity="0.03" />
              <stop offset="100%" stopColor="black" stopOpacity="0.28" />
            </linearGradient>

            {/* ── Hover ── */}
            <radialGradient id="grad-hover" cx="50%" cy="38%" r="68%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
            </radialGradient>

            {/* ── Geografiska bakgrundsgradienter ── */}

            {/* Hav — vänsterkust (kust-zoner rad 3-5) */}
            <linearGradient id="ocean-west" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#0a2d4a" stopOpacity="1" />
              <stop offset="60%"  stopColor="#091e35" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#060d18" stopOpacity="0" />
            </linearGradient>

            {/* Hav — sydkust (kust-zoner rad 6) */}
            <linearGradient id="ocean-south" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#060d18"  stopOpacity="0" />
              <stop offset="55%"  stopColor="#071e30"  stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0a2d4a"  stopOpacity="1" />
            </linearGradient>

            {/* Hav — höger (kust-zoner rad 4-5 höger) */}
            <linearGradient id="ocean-east" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%"   stopColor="#0a2d4a" stopOpacity="0.85" />
              <stop offset="60%"  stopColor="#091e35" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#060d18" stopOpacity="0" />
            </linearGradient>

            {/* Fjällmark — bergsterräng (gruva norr) */}
            <linearGradient id="mountain-base" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#1e1508" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0e0c06" stopOpacity="0" />
            </linearGradient>

            {/* Skog — djup grön */}
            <radialGradient id="forest-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#0d2a10" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#060d08" stopOpacity="0" />
            </radialGradient>

            {/* Åkermark — varm grön/brun */}
            <radialGradient id="farm-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#1a3508" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#060d08" stopOpacity="0" />
            </radialGradient>

            {/* Energiplatå — varm amber */}
            <radialGradient id="energy-ambient" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#78350f" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </radialGradient>

            {/* Stad — urban lila glöd */}
            <radialGradient id="urban-ambient" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#3b0764" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
            </radialGradient>

            {/* Grundmark (landmassans basyta) */}
            <radialGradient id="land-base" cx="55%" cy="48%" r="58%">
              <stop offset="0%"   stopColor="#10200e" stopOpacity="1" />
              <stop offset="60%"  stopColor="#0a1a0a" stopOpacity="1" />
              <stop offset="100%" stopColor="#060d08" stopOpacity="0" />
            </radialGradient>

            {/* Edge vignette — mörknar kanter (ej cirkelklipp!) */}
            <radialGradient id="vignette" cx="50%" cy="50%" r="58%">
              <stop offset="68%" stopColor="#060d18" stopOpacity="0" />
              <stop offset="100%" stopColor="#060d18" stopOpacity="0.92" />
            </radialGradient>

            {/* ── Glow-filter ── */}
            <filter id="hexglow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="softglow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="textglow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="blur8" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id="blur14" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>

          {/* ══════════════════════════════════════════════════════
              GEOGRAFISKT TERRAINLAGER — matchar zonpositionerna
              ══════════════════════════════════════════════════════ */}

          {/* 1. Havsvatten — vänster (kust rad 3-5, col 0) */}
          <rect x="0" y="185" width="130" height="310" fill="url(#ocean-west)" />

          {/* 2. Havsvatten — sydkust (kust rad 6, col 1) */}
          <rect x="0" y="370" width="530" height="120" fill="url(#ocean-south)" />

          {/* 3. Havsvatten — höger (kust rad 4-5, col 5) */}
          <rect x="340" y="245" width="190" height="200" fill="url(#ocean-east)" />

          {/* 4. Kustlinje — vänster, subtil ljuslinje */}
          <line x1="105" y1="195" x2="70" y2="365" stroke="#0e4a6e" strokeWidth="8" opacity="0.25" filter="url(#blur8)" />
          <line x1="105" y1="195" x2="70" y2="365" stroke="#1a6b9a" strokeWidth="1.5" opacity="0.45" />

          {/* 5. Landmassans grundfärg */}
          <ellipse cx="270" cy="230" rx="240" ry="210" fill="url(#land-base)" />

          {/* 6. Bergsterräng norr (gruva-zoner rad 0-1, col 2-3) */}
          {/* Bred bergsplatå som bas */}
          <ellipse cx="230" cy="70" rx="110" ry="62" fill="url(#mountain-base)" />
          <ellipse cx="230" cy="70" rx="110" ry="62" fill="#1a1208" opacity="0.7" filter="url(#blur8)" />

          {/* Bergssiluetter — exakta positioner för gruva-zoner */}
          {/* Bakre bergkedja (ljusare, längre bak) */}
          <path d="M 148 132 L 170 88 L 185 108 L 200 78 L 215 100 L 230 68 L 248 95 L 263 72 L 278 92 L 295 75 L 312 110 L 320 132 Z"
            fill="#161008" />
          {/* Främre bergkedja (mörkare, mer framträdande) */}
          <path d="M 155 135 L 178 94 L 192 115 L 210 82 L 226 105 L 238 70 L 250 88 L 264 62 L 280 84 L 296 68 L 313 95 L 322 135 Z"
            fill="#1e1508" stroke="#2a1e0c" strokeWidth="0.8" strokeOpacity="0.5" />
          {/* Snötoppar */}
          <path d="M 210 89 L 218 82 L 226 89 Z" fill="white" opacity="0.22" />
          <path d="M 256 68 L 264 62 L 272 68 Z" fill="white" opacity="0.20" />
          <path d="M 178 101 L 185 94 L 193 101 Z" fill="white" opacity="0.16" />
          <path d="M 289 75 L 296 68 L 304 75 Z" fill="white" opacity="0.14" />

          {/* 7. Nordvästlig skog (skog rad 0, col 1 + rad 1, col 0) */}
          <ellipse cx="105" cy="80" rx="55" ry="48" fill="url(#forest-glow)" />
          {/* Gransilhuetter NV */}
          <g opacity="0.55">
            <polygon points="108,42 95,68 121,68" fill="#0d2a10" />
            <rect x="106" y="68" width="4" height="7" fill="#0a1e0b" />
            <polygon points="88,52 75,76 101,76" fill="#0b260e" />
            <rect x="86" y="76" width="4" height="6" fill="#081a09" />
            <polygon points="126,58 115,80 137,80" fill="#0c280f" />
            <rect x="124" y="80" width="4" height="6" fill="#0a1e0b" />
          </g>

          {/* 8. Nordostlig skog (skog rad 1, col 4) */}
          <ellipse cx="364" cy="110" rx="48" ry="40" fill="url(#forest-glow)" />
          <g opacity="0.50">
            <polygon points="366,76 354,100 378,100" fill="#0d2a10" />
            <rect x="364" y="100" width="4" height="7" fill="#0a1e0b" />
            <polygon points="346,86 334,108 358,108" fill="#0b260e" />
            <polygon points="383,88 372,110 394,110" fill="#0c280f" />
          </g>

          {/* 9. Sydlig skog (skog rad 6, col 2) */}
          <ellipse cx="191" cy="412" rx="44" ry="32" fill="url(#forest-glow)" />
          <g opacity="0.42">
            <polygon points="193,388 181,410 205,410" fill="#0d2a10" />
            <polygon points="174,393 163,414 185,414" fill="#0b260e" />
            <polygon points="210,395 199,415 221,415" fill="#0c280f" />
          </g>

          {/* 10. Åkermark (jordbruk rad 4-5, col 1-2) */}
          <ellipse cx="175" cy="320" rx="95" ry="72" fill="url(#farm-glow)" />
          {/* Odlingsrader-hint */}
          {[0,1,2,3,4].map(i => (
            <line key={i}
              x1="95" y1={275 + i * 14} x2="256" y2={275 + i * 14}
              stroke="#2a5010" strokeWidth="1.2" opacity="0.22"
            />
          ))}

          {/* 11. Energiplatå (energi höger, rad 0-4) */}
          <ellipse cx="390" cy="190" rx="115" ry="120" fill="url(#energy-ambient)" />

          {/* 12. Stadsglöd (stad centrum, rad 1-3) */}
          <ellipse cx="210" cy="190" rx="105" ry="88" fill="url(#urban-ambient)" />

          {/* 13. Havsvågor — vänster kust (animerade) */}
          {[0, 1, 2].map(i => (
            <path key={i}
              d={`M 20 ${220 + i * 55} Q 45 ${212 + i * 55} 70 ${220 + i * 55} Q 95 ${228 + i * 55} 108 ${220 + i * 55}`}
              fill="none" stroke="#1a5570" strokeWidth="1.2" opacity="0"
            >
              <animate attributeName="opacity" values={`0;0.35;0`}
                dur={`${4 + i * 1.8}s`} begin={`${i * 1.2}s`} repeatCount="indefinite" />
            </path>
          ))}

          {/* ══════════════════════════════════════════════════════
              HEXAGONER — utan fog-of-war, tydliga och klara
              ══════════════════════════════════════════════════════ */}
          <g>
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
                ? rgba(agFarg,  isAct ? 1.0 : 0.65)
                : rgba(typFarg, isAct ? 0.90 : 0.40);

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
                      strokeWidth={isAct ? 4.5 : 2.5}
                      filter="url(#hexglow)"
                    >
                      <animate attributeName="opacity"
                        values="0.10;0.55;0.10" dur="3.2s"
                        repeatCount="indefinite"
                      />
                    </polygon>
                  )}

                  {/* Mörk basfyllning — mindre dominans */}
                  <polygon points={pts} fill="#0a1410" stroke="none" />

                  {/* Terrainlager — ljust och tydligt */}
                  <polygon points={pts} fill={`url(#grad-${zon.typ})`} stroke="none" />

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
                    strokeWidth={isAct ? 2.2 : agFarg ? 1.6 : 0.8}
                  />

                  {/* Inre kant */}
                  <polygon
                    points={hexPts(cx, cy, HEX - 4)}
                    fill="none"
                    stroke={agFarg
                      ? rgba(agFarg, isAct ? 0.40 : 0.16)
                      : rgba(typFarg, isAct ? 0.24 : 0.12)}
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
                      ? rgba(agFarg, isAct ? 1 : 0.90)
                      : rgba(typFarg, isAct ? 1 : 0.80)}
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

          {/* ── Edge vignette (mörknar hörnen, INTE ett cirkelklipp) ── */}
          <rect x="0" y="0" width={SVG_W} height={SVG_H}
            fill="url(#vignette)"
            style={{ pointerEvents: "none" }}
          />

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
