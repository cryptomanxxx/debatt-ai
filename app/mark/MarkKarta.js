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

// Pollinations.ai fotorealistisk terrängbakgrund — Civ VI-stil, ljus och färgrik
// Geografisk logik matchar exakta zonpositioner:
//   Norr: grå berg med snötoppar (gruva rad 0-1)
//   NV+NO: tät grön skog (skog i hörnen)
//   Centrum: lysande lila-violett stad (stad rad 1-3)
//   Väster: gyllene jordbruksslätter (jordbruk rad 4-5)
//   Öster: orange-amber vulkanisk energizon (energi rad 0-4)
//   Väster+Söder: blå kustvatten med hamnar (kust col 0, rad 6)
const TERRAIN_BG = "https://image.pollinations.ai/prompt/bright%20colorful%20hexagonal%20strategy%20game%20world%20map%20top-down%20view%2C%20Civilization%20VI%20art%20style%2C%20organic%20island%20landmass%20surrounded%20by%20calm%20ocean%20water%2C%20grey%20snow-capped%20mountain%20range%20in%20north-center%2C%20dense%20lush%20green%20ancient%20forest%20in%20northwest%20corner%2C%20bright%20green%20forest%20patch%20in%20northeast%2C%20glowing%20violet%20purple%20city%20district%20in%20center%2C%20golden%20yellow%20wheat%20farmland%20plains%20in%20west-center%2C%20amber%20orange%20volcanic%20geothermal%20energy%20terrain%20in%20east%2C%20blue%20coastal%20water%20and%20harbor%20on%20west%20and%20south%20edges%2C%20small%20forest%20in%20south-center%2C%20vibrant%20saturated%20colors%2C%20bright%20dramatic%20game%20art%20lighting%20from%20above%2C%20highly%20detailed%20photorealistic%20terrain%20texture%2C%20no%20text%20no%20hexagons%20no%20UI%20no%20labels?width=530&height=490&nologo=true&seed=2048&model=flux";

// Terrainöverlager — tillräckligt synliga för zonidentitet, låter bakgrunden dominera
const TERRAIN_STOPS = {
  energi:   [["#fef08a", 0.28], ["#f59e0b", 0.16], ["#78350f", 0.04]],
  jordbruk: [["#bbf7d0", 0.26], ["#22c55e", 0.14], ["#14532d", 0.04]],
  industri: [["#bfdbfe", 0.24], ["#3b82f6", 0.13], ["#1e3a8a", 0.03]],
  gruva:    [["#fed7aa", 0.26], ["#ea580c", 0.14], ["#7c2d12", 0.03]],
  stad:     [["#f3e8ff", 0.28], ["#9333ea", 0.16], ["#3b0764", 0.04]],
  kust:     [["#cffafe", 0.26], ["#0891b2", 0.14], ["#0c4a6e", 0.04]],
  skog:     [["#dcfce7", 0.26], ["#16a34a", 0.14], ["#14532d", 0.04]],
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
            {/* ── Terrain radialgradienter (subtila färgtoner) ── */}
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
                <stop offset="0%"   stopColor={farg} stopOpacity="0.65" />
                <stop offset="50%"  stopColor={farg} stopOpacity="0.28" />
                <stop offset="100%" stopColor={farg} stopOpacity="0.05" />
              </radialGradient>
            ))}

            {/* ── 3D ytbelysning ── */}
            <linearGradient id="hex-light" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.12" />
              <stop offset="40%"  stopColor="white" stopOpacity="0.02" />
              <stop offset="100%" stopColor="black" stopOpacity="0.22" />
            </linearGradient>

            {/* ── Hover ── */}
            <radialGradient id="grad-hover" cx="50%" cy="38%" r="68%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
            </radialGradient>

            {/* ── Edge vignette ── */}
            <radialGradient id="vignette" cx="50%" cy="50%" r="58%">
              <stop offset="65%" stopColor="#060d18" stopOpacity="0" />
              <stop offset="100%" stopColor="#060d18" stopOpacity="0.88" />
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
          </defs>

          {/* ══════════════════════════════════════════════════════
              FOTOREALISTISK TERRÄNGBAKGRUND — Pollinations.ai Flux
              ══════════════════════════════════════════════════════ */}
          <image
            href={TERRAIN_BG}
            x="0" y="0"
            width={SVG_W} height={SVG_H}
            preserveAspectRatio="xMidYMid slice"
          />

          {/* ══════════════════════════════════════════════════════
              HEXAGONER — transparenta, låter terrängen synas igenom
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
                ? rgba(agFarg,  isAct ? 1.0 : 0.75)
                : rgba(typFarg, isAct ? 0.95 : 0.50);

              const pts = hexPts(cx, cy);

              return (
                <g
                  key={zon.id}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => handleEnter(zon)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(s => s?.id === zon.id ? null : zon)}
                >
                  {/* Yttre pulsglow för ägda zoner */}
                  {agFarg && (
                    <polygon
                      points={hexPts(cx, cy, HEX + 8)}
                      fill="none"
                      stroke={agFarg}
                      strokeWidth={isAct ? 5 : 3}
                      filter="url(#hexglow)"
                    >
                      <animate attributeName="opacity"
                        values="0.08;0.60;0.08" dur="3.2s"
                        repeatCount="indefinite"
                      />
                    </polygon>
                  )}

                  {/* Helt transparent basfyllning — terrängen syns igenom */}
                  <polygon points={pts} fill="rgba(0,0,0,0)" stroke="none" />

                  {/* Subtil terraintoning */}
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

                  {/* Yttre kant — tydlig, glödande */}
                  <polygon
                    points={pts}
                    fill="none"
                    stroke={strokeCol}
                    strokeWidth={isAct ? 2.8 : agFarg ? 2.0 : 1.4}
                  />

                  {/* Inre kant */}
                  <polygon
                    points={hexPts(cx, cy, HEX - 4)}
                    fill="none"
                    stroke={agFarg
                      ? rgba(agFarg, isAct ? 0.45 : 0.18)
                      : rgba(typFarg, isAct ? 0.28 : 0.14)}
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
                      ? rgba(agFarg, isAct ? 1 : 0.95)
                      : rgba(typFarg, isAct ? 1 : 0.85)}
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

          {/* ── Edge vignette ── */}
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
