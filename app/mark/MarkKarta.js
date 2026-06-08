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

// Fyra institutioner placerade på specifika zoner — synliga som glödande pins
const INSTITUTIONS = {
  "Storstaden":       { icon: "🏛", fullName: "AI-Parlamentet", color: "#c084fc" },
  "Handelsstaden":    { icon: "🏦", fullName: "Centralbanken",  color: "#fbbf24" },
  "Datacenterparken": { icon: "📈", fullName: "Kryptobörsen",   color: "#34d399" },
  "Kulturcentrum":    { icon: "⚖️", fullName: "AI-Domstolen",  color: "#f87171" },
};

const TERRAIN_BG = null; // ingen extern bild — använder CSS-gradient

const TERRAIN_STOPS = {
  energi:   [["#fef08a", 0.40], ["#f59e0b", 0.22], ["#78350f", 0.06]],
  jordbruk: [["#bbf7d0", 0.38], ["#22c55e", 0.20], ["#14532d", 0.05]],
  industri: [["#bfdbfe", 0.38], ["#3b82f6", 0.20], ["#1e3a8a", 0.05]],
  gruva:    [["#fed7aa", 0.40], ["#ea580c", 0.24], ["#7c2d12", 0.06]],
  stad:     [["#f0e0ff", 0.52], ["#9333ea", 0.30], ["#3b0764", 0.10]],
  kust:     [["#cffafe", 0.42], ["#0891b2", 0.22], ["#0c4a6e", 0.06]],
  skog:     [["#dcfce7", 0.38], ["#16a34a", 0.20], ["#14532d", 0.05]],
};

const HEX = 33;        // polygonradie (visuell storlek på hexagonen)
const HEX_SP = 40;     // gitteravstånd — frikopplat från radien så kartan inte komprimeras
const SQRT3 = Math.sqrt(3);
const SVG_W = 530;
const SVG_H = 490;

function hexCenter(col, row) {
  const x = HEX_SP * SQRT3 * (col + (row % 2 === 1 ? 0.5 : 0)) + 52;
  const y = HEX_SP * 1.5 * row + 50;
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

function timeLeft(ts) {
  if (!ts) return "";
  const diff = (new Date(ts) - Date.now()) / 1000;
  if (diff <= 0) return "Avslutar...";
  if (diff < 3600) return `${Math.floor(diff / 60)}m kvar`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h kvar`;
  return `${Math.floor(diff / 86400)}d kvar`;
}

// Baspris per vara (kr) — speglar BASPRIS i mark_test.py
const BASPRIS_VARA = {
  el: 15, spannmål: 10, maskiner: 25, malm: 20, tjänster: 18, fisk: 12, virke: 14,
};
const VARA_IKON = {
  el: "⚡", spannmål: "🌾", maskiner: "🏭", malm: "⛏️", tjänster: "🏙️", fisk: "🌊", virke: "🌲",
};
// Zontyp → vara
const TYP_VARA = {
  energi: "el", jordbruk: "spannmål", industri: "maskiner",
  gruva: "malm", stad: "tjänster", kust: "fisk", skog: "virke",
};

export default function MarkKarta({ zoner, agare, transaktioner, auktioner = [], resurspriser = [], lager = [], handelLog = [] }) {
  const [hover, setHover]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [floats, setFloats]     = useState([]);

  const agareMap = Object.fromEntries(agare.map(a => [a.zon_id, a]));
  const agentGrads = [...new Set(agare.map(a => a.agent))]
    .map(name => ({ name, farg: AGENT_VISUELL[name]?.ikonFarg || "#888" }));

  const dagInk = v => Math.round(v);
  const leaderMap = {};
  agare.forEach(a => {
    const z = zoner.find(z => z.id === a.zon_id);
    if (!z) return;
    if (!leaderMap[a.agent]) leaderMap[a.agent] = { antal: 0, ink: 0 };
    leaderMap[a.agent].antal++;
    leaderMap[a.agent].ink += dagInk(z.veckoinkomst);
  });
  const leaders = Object.entries(leaderMap).sort((a, b) => b[1].ink - a[1].ink).slice(0, 8);
  const maxInk = leaders[0]?.[1].ink || 1;
  const totalInk = agare.reduce((s, a) => {
    const z = zoner.find(z => z.id === a.zon_id);
    return s + dagInk(z?.veckoinkomst || 0);
  }, 0);

  // Resurspriser: map typ → { pris_multiplier, trend, bas_pris }
  const resursMap = Object.fromEntries(resurspriser.map(r => [r.typ, r]));

  const active = selected || hover;
  const activeAgare = active ? agareMap[active.id] : null;
  const activeAgentFarg = activeAgare
    ? (AGENT_VISUELL[activeAgare.agent]?.ikonFarg || "#888")
    : null;

  function handleEnter(zon) {
    setHover(zon);
    const [cx, cy] = hexCenter(zon.hex_col, zon.hex_row);
    const id = Math.random();
    setFloats(prev => [...prev.slice(-4), { id, cx, cy, ink: dagInk(zon.veckoinkomst) }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1600);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── HEX MAP ── max 700px */}
      <div style={{ width: "100%", maxWidth: "700px", position: "relative", borderRadius: "12px", overflow: "hidden", background: "linear-gradient(rgba(2,8,18,0.20),rgba(2,8,18,0.20)), url('/mark-terrain.jpg') center/cover no-repeat, #030a18", border: "1px solid #1a3020", boxShadow: "0 4px 40px rgba(0,10,30,0.9)" }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{
            display: "block",
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "auto",
            background: "transparent",
            mixBlendMode: "normal",
          }}
        >
          <defs>
            {Object.entries(TERRAIN_STOPS).map(([typ, stops]) => (
              <radialGradient key={typ} id={`grad-${typ}`} cx="30%" cy="25%" r="80%">
                <stop offset="0%"   stopColor={stops[0][0]} stopOpacity={stops[0][1]} />
                <stop offset="50%"  stopColor={stops[1][0]} stopOpacity={stops[1][1]} />
                <stop offset="100%" stopColor={stops[2][0]} stopOpacity={stops[2][1]} />
              </radialGradient>
            ))}
            {agentGrads.map(({ name, farg }) => (
              <radialGradient key={name} id={`grad-ag-${name.replace(/[^a-zA-Z]/g, "")}`} cx="32%" cy="25%" r="78%">
                <stop offset="0%"   stopColor={farg} stopOpacity="0.38" />
                <stop offset="50%"  stopColor={farg} stopOpacity="0.15" />
                <stop offset="100%" stopColor={farg} stopOpacity="0.03" />
              </radialGradient>
            ))}
            <linearGradient id="hex-light" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.07" />
              <stop offset="40%"  stopColor="white" stopOpacity="0.01" />
              <stop offset="100%" stopColor="black" stopOpacity="0.10" />
            </linearGradient>
            <radialGradient id="grad-hover" cx="50%" cy="38%" r="68%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
            </radialGradient>
            <radialGradient id="vignette" cx="50%" cy="50%" r="58%">
              <stop offset="65%" stopColor="#060d18" stopOpacity="0" />
              <stop offset="100%" stopColor="#060d18" stopOpacity="0.60" />
            </radialGradient>
            <filter id="softglow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="textglow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="cityglow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

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
              const agGradId = agName ? `grad-ag-${agName.replace(/[^a-zA-Z]/g, "")}` : null;
              const strokeCol = agFarg
                ? rgba(agFarg,  isAct ? 1.0 : 0.75)
                : rgba(typFarg, isAct ? 0.95 : 0.50);
              const pts = hexPts(cx, cy);
              return (
                <g key={zon.id} style={{ cursor: "pointer" }}
                  onMouseEnter={() => handleEnter(zon)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(s => s?.id === zon.id ? null : zon)}
                >
                  {zon.typ === "stad" && (
                    <>
                      <polygon points={hexPts(cx, cy, HEX + 8)} fill="none" stroke="#9333ea"
                        strokeWidth="1.5" filter="url(#cityglow)">
                        <animate attributeName="opacity" values="0.05;0.40;0.05" dur="2.2s" repeatCount="indefinite" />
                      </polygon>
                      <polygon points={hexPts(cx, cy, HEX + 3)} fill="none" stroke="#c084fc"
                        strokeWidth="1" filter="url(#softglow)">
                        <animate attributeName="opacity" values="0.10;0.55;0.10" dur="1.8s" repeatCount="indefinite" />
                      </polygon>
                    </>
                  )}

                  <polygon points={pts} fill="rgba(0,0,0,0)" stroke="none" />
                  <polygon points={pts} fill={`url(#grad-${zon.typ})`} stroke="none" />
                  {agGradId && <polygon points={pts} fill={`url(#${agGradId})`} stroke="none" />}
                  <polygon points={pts} fill="url(#hex-light)" stroke="none" />
                  {isAct && <polygon points={pts} fill="url(#grad-hover)" stroke="none" />}
                  <polygon points={pts} fill="none" stroke={strokeCol}
                    strokeWidth={isAct ? 2.8 : agFarg ? 2.0 : zon.typ === "stad" ? 2.2 : 1.4} />
                  {isAct && (
                    <polygon points={hexPts(cx, cy, HEX - 4)} fill="none"
                      stroke={agFarg ? rgba(agFarg, 0.45) : rgba(typFarg, 0.28)}
                      strokeWidth="0.8" />
                  )}
                  <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
                    fontSize={isAct ? 18 : 14} filter={isAct ? "url(#textglow)" : undefined}
                    style={{ userSelect: "none", pointerEvents: "none" }}>
                    {TYP_IKON[zon.typ]}
                  </text>
                  <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle"
                    fontSize="7.5"
                    fill={agFarg ? rgba(agFarg, isAct ? 1 : 0.95) : rgba(typFarg, isAct ? 1 : 0.85)}
                    fontFamily="monospace" fontWeight={agFarg ? "700" : "400"}
                    filter={agFarg && isAct ? "url(#textglow)" : undefined}
                    style={{ userSelect: "none", pointerEvents: "none" }}>
                    {dagInk(zon.veckoinkomst)}kr
                  </text>
                </g>
              );
            })}
          </g>

          {zoner.filter(zon => INSTITUTIONS[zon.namn]).map(zon => {
            const [cx, cy] = hexCenter(zon.hex_col, zon.hex_row);
            const inst = INSTITUTIONS[zon.namn];
            return (
              <g key={`inst-${zon.id}`} style={{ pointerEvents: "none" }}>
                <line x1={cx} y1={cy - HEX} x2={cx} y2={cy - HEX - 2}
                  stroke={inst.color} strokeWidth="1" strokeOpacity="0.55" />
                <circle cx={cx} cy={cy - HEX - 12} r={11}
                  fill="#060810" stroke={inst.color} strokeWidth="1.8"
                  filter="url(#softglow)">
                  <animate attributeName="opacity" values="0.65;1.0;0.65" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <text x={cx} y={cy - HEX - 12} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" style={{ userSelect: "none" }}>
                  {inst.icon}
                </text>
              </g>
            );
          })}

          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#vignette)" style={{ pointerEvents: "none" }} />

          {floats.map(f => (
            <text key={f.id} x={f.cx} y={f.cy - 20} textAnchor="middle"
              fill="#fbbf24" fontSize="12" fontFamily="monospace" fontWeight="700"
              filter="url(#softglow)" style={{ pointerEvents: "none" }}>
              +{f.ink}kr/dag
              <animate attributeName="opacity" from="1" to="0" dur="1.5s" fill="freeze" />
              <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -52" dur="1.5s" fill="freeze" />
            </text>
          ))}

          <text x="12" y="18" fontSize="9" fill="#1a3050" fontFamily="monospace" letterSpacing="0.12em">
            MARKARTAN · {zoner.length} ZONER · {agare.length} ÄGDA
          </text>
        </svg>
      </div>

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

      {/* ── BOTTENPANEL ── 3 kolumner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", alignItems: "start" }}>

        {active ? (
          <div style={{
            background: "#0e0e0e",
            border: `1px solid ${rgba(TYP_FARG[active.typ] || "#333", 0.35)}`,
            borderRadius: "8px", padding: "14px 16px",
            boxShadow: `0 0 20px ${rgba(TYP_FARG[active.typ] || "#333", 0.08)}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "20px" }}>{TYP_IKON[active.typ]}</span>
              <span style={{ fontSize: "15px", color: "#f0ede6", fontFamily: "Georgia, serif" }}>{active.namn}</span>
            </div>
            {INSTITUTIONS[active.namn] && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px",
                padding: "5px 10px", borderRadius: "4px",
                background: rgba(INSTITUTIONS[active.namn].color, 0.08),
                border: `1px solid ${rgba(INSTITUTIONS[active.namn].color, 0.30)}` }}>
                <span style={{ fontSize: "15px" }}>{INSTITUTIONS[active.namn].icon}</span>
                <div>
                  <div style={{ fontSize: "8px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em" }}>INSTITUTIONSPLATS</div>
                  <div style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "700",
                    color: INSTITUTIONS[active.namn].color }}>{INSTITUTIONS[active.namn].fullName}</div>
                </div>
              </div>
            )}
            <p style={{ fontSize: "11px", color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>{active.beskrivning}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "8px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "2px" }}>DAGSINKOMST</div>
                <div style={{ fontSize: "18px", color: TYP_FARG[active.typ] || "#fff", lineHeight: 1 }}>
                  {dagInk(active.veckoinkomst)} <span style={{ fontSize: "10px" }}>kr/dag</span>
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
              <div style={{ padding: "7px 10px", background: rgba(activeAgentFarg, 0.07), border: `1px solid ${rgba(activeAgentFarg, 0.25)}`, borderRadius: "4px" }}>
                <span style={{ fontSize: "10px", fontFamily: "monospace", color: activeAgentFarg }}>▣ ÄGES AV: {activeAgare.agent}</span>
              </div>
            ) : (
              <div style={{ padding: "7px 10px", background: "#0a140a", border: "1px solid #1a3a1a", borderRadius: "4px" }}>
                <span style={{ fontSize: "10px", color: "#4ade8077", fontFamily: "monospace" }}>◯ TILLGÄNGLIG FÖR KÖP</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "12px 14px", fontSize: "11px", color: "#333", fontFamily: "monospace", textAlign: "center" }}>
            Tryck på en zon för detaljer
          </div>
        )}

        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            {[
              ["ZONER",       zoner.length,                "#666"],
              ["ÄGDA",        agare.length,                "#4ade80"],
              ["FRIA",        zoner.length - agare.length, "#38bdf8"],
              ["DAGSINKOMST", `${totalInk} kr`,            "#f59e0b"],
            ].map(([lbl, val, c]) => (
              <div key={lbl} style={{ background: "#0d0d0d", border: "1px solid #181818", borderRadius: "6px", padding: "8px 10px" }}>
                <div style={{ fontSize: "8px", color: "#3a3a3a", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: "3px" }}>{lbl}</div>
                <div style={{ fontSize: "17px", color: c, lineHeight: 1 }}>{val}</div>
              </div>
            ))}
          </div>
          {leaders.length > 0 && (
            <div>
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
                      <div style={{ height: "2px", background: af, borderRadius: "2px", width: `${(stats.ink / maxInk) * 100}%`, boxShadow: `0 0 6px ${rgba(af, 0.6)}`, transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", marginTop: "2px" }}>{stats.ink} kr/dag</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {resurspriser.length > 0 && (
          <div>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>RESURSPRISER</p>
            {Object.keys(TYP_FARG).map(typ => {
              const r = resursMap[typ];
              if (!r) return null;
              const mult = parseFloat(r.pris_multiplier) || 1.0;
              const farg = TYP_FARG[typ];
              const trend = r.trend;
              const trendIkon = trend === "stigande" ? "↑" : trend === "fallande" ? "↓" : "→";
              const trendFarg = trend === "stigande" ? "#4ade80" : trend === "fallande" ? "#f87171" : "#666";
              const barW = Math.round(Math.min(100, (mult / 2.0) * 100));
              return (
                <div key={typ} style={{ marginBottom: "7px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <span style={{ fontSize: "10px", color: farg, fontFamily: "monospace" }}>
                      {TYP_IKON[typ]} {TYP_NAMN[typ]}
                    </span>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", color: trendFarg }}>
                      {trendIkon} ×{mult.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ height: "2px", background: "#181818", borderRadius: "2px" }}>
                    <div style={{ height: "2px", background: farg, borderRadius: "2px", width: `${barW}%`, opacity: 0.7 }} />
                  </div>
                  <div style={{ fontSize: "8px", color: "#444", fontFamily: "monospace", marginTop: "1px" }}>
                    {r.antal_agda}/{r.antal_totala} zoner ägda
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {transaktioner.length > 0 && (
          <div>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>SENASTE KÖP</p>
            {transaktioner.slice(0, 8).map((t, i) => {
              const af = AGENT_VISUELL[t.kop_agent]?.ikonFarg || "#888";
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#0a0a0a", borderLeft: `2px solid ${rgba(af, 0.4)}`, marginBottom: "4px", borderRadius: "0 4px 4px 0" }}>
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

        {/* ── AUKTIONER ── */}
        <div>
          <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>
            AUKTIONER{auktioner.length > 0 ? ` · ${auktioner.length} AKTIVA` : ""}
          </p>
          {auktioner.length === 0 ? (
            <div style={{ fontSize: "11px", color: "#2a2a2a", fontFamily: "monospace", textAlign: "center", padding: "16px 0" }}>
              Inga aktiva auktioner
            </div>
          ) : (
            auktioner.map(a => {
              const zon      = a.mark_zoner || {};
              const typFarg  = TYP_FARG[zon.typ] || "#555";
              const saljFarg = AGENT_VISUELL[a.saljare]?.ikonFarg || "#888";
              const budFarg  = a.hogst_budgivare ? (AGENT_VISUELL[a.hogst_budgivare]?.ikonFarg || "#f59e0b") : null;
              return (
                <div key={a.id} style={{
                  background: "#0a0a0a",
                  borderLeft: `2px solid ${rgba(typFarg, 0.55)}`,
                  borderRadius: "0 4px 4px 0",
                  padding: "8px 10px",
                  marginBottom: "6px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <span style={{ fontSize: "11px", color: typFarg, fontFamily: "monospace", fontWeight: 700 }}>
                      {TYP_IKON[zon.typ]} {zon.namn}
                    </span>
                    <span style={{ fontSize: "8px", color: "#444", fontFamily: "monospace" }}>
                      {timeLeft(a.stanger_at)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: "8px", color: "#333", fontFamily: "monospace" }}>
                        SÄLJS AV
                      </div>
                      <div style={{ fontSize: "10px", color: saljFarg, fontFamily: "monospace" }}>
                        {a.saljare}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {a.nuv_bud ? (
                        <>
                          <div style={{ fontSize: "12px", color: budFarg || "#f59e0b", fontFamily: "monospace", lineHeight: 1 }}>
                            {a.nuv_bud} kr
                          </div>
                          <div style={{ fontSize: "8px", color: budFarg || "#888", fontFamily: "monospace" }}>
                            {a.hogst_budgivare}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", lineHeight: 1 }}>
                            {a.reservpris} kr
                          </div>
                          <div style={{ fontSize: "8px", color: "#333", fontFamily: "monospace" }}>
                            reservpris
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── VARUMARKNAD ── */}
        {(() => {
          // Beräkna aktuella priser: BASPRIS × resurspriser-multiplier
          const priser = Object.entries(TYP_VARA).map(([typ, vara]) => {
            const r = resursMap[typ];
            const mult = r ? parseFloat(r.pris_multiplier) || 1.0 : 1.0;
            return { vara, typ, pris: Math.round(BASPRIS_VARA[vara] * mult * 10) / 10, mult };
          });
          return (
            <div>
              <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>
                VARUMARKNAD
              </p>
              {priser.map(({ vara, typ, pris }) => {
                const farg = TYP_FARG[typ] || "#888";
                return (
                  <div key={vara} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <span style={{ fontSize: "10px", color: farg, fontFamily: "monospace" }}>
                      {VARA_IKON[vara]} {vara}
                    </span>
                    <span style={{ fontSize: "11px", color: "#c8c4bc", fontFamily: "monospace" }}>
                      {pris} kr
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── AGENTLAGER ── */}
        {lager.length > 0 && (() => {
          // Summera lagervärde per agent
          const varuMap = Object.fromEntries(
            Object.entries(TYP_VARA).map(([typ, vara]) => {
              const r = resursMap[typ];
              const mult = r ? parseFloat(r.pris_multiplier) || 1.0 : 1.0;
              return [vara, Math.round(BASPRIS_VARA[vara] * mult * 10) / 10];
            })
          );
          const agentVarden = {};
          for (const row of lager) {
            const varde = (row.antal || 0) * (varuMap[row.vara] || 0);
            agentVarden[row.agent] = (agentVarden[row.agent] || 0) + varde;
          }
          const topAgenter = Object.entries(agentVarden)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          if (topAgenter.length === 0) return null;
          const maxV = topAgenter[0][1] || 1;
          return (
            <div>
              <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>
                AGENTLAGER (värde)
              </p>
              {topAgenter.map(([agent, varde], i) => {
                const af = AGENT_VISUELL[agent]?.ikonFarg || "#888";
                return (
                  <div key={agent} style={{ marginBottom: "7px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", color: af, fontFamily: "monospace" }}>{i + 1}. {agent}</span>
                      <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>{Math.round(varde)} kr</span>
                    </div>
                    <div style={{ height: "2px", background: "#181818", borderRadius: "2px" }}>
                      <div style={{ height: "2px", background: af, borderRadius: "2px", width: `${(varde / maxV) * 100}%`, opacity: 0.6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── SENASTE HANDEL ── */}
        {handelLog.length > 0 && (
          <div>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>
              SENASTE HANDEL
            </p>
            {handelLog.slice(0, 8).map((h, i) => {
              const kFarg = AGENT_VISUELL[h.kop_agent]?.ikonFarg  || "#888";
              const sFarg = AGENT_VISUELL[h.salj_agent]?.ikonFarg || "#555";
              return (
                <div key={i} style={{
                  padding: "6px 8px", background: "#0a0a0a",
                  borderLeft: `2px solid ${rgba(kFarg, 0.4)}`,
                  borderRadius: "0 4px 4px 0", marginBottom: "4px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", fontFamily: "monospace" }}>
                      {VARA_IKON[h.vara] || "📦"}{" "}
                      <span style={{ color: kFarg }}>{h.kop_agent}</span>
                      <span style={{ color: "#333" }}> ← </span>
                      <span style={{ color: sFarg }}>{h.salj_agent}</span>
                    </span>
                    <span style={{ fontSize: "10px", color: "#f59e0b", fontFamily: "monospace" }}>{h.totalt} kr</span>
                  </div>
                  <div style={{ fontSize: "8px", color: "#333", fontFamily: "monospace", marginTop: "2px" }}>
                    {h.antal}× {h.vara} · {relativeTime(h.skapad)}
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
