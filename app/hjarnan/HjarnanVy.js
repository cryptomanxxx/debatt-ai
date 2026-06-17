"use client";
import { useState, useCallback, useMemo, useEffect } from "react";

const RING_R  = 205;
const KOAL_R  = 138;
const MID_R   = 70;
const CENTER  = 265;
const SVG_W   = 530;
const SVG_H   = 530;
const MAX_DEPTH = 60;

const REL = {
  allierad: { stroke: "#4ade80", label: "Allierad",  dim: "#1a3a20" },
  rival:    { stroke: "#f87171", label: "Rival",     dim: "#3a1a1a" },
  fiende:   { stroke: "#dc2626", label: "Fiende",    dim: "#4a0a0a" },
  neutral:  { stroke: "#475569", label: "Neutral",   dim: "#1e2a38" },
};

const HÄNDELSE_IKON = { röst: "🗳", koalition: "🤝", lobbying: "💰", artikel: "📝", ekonomi: "💸" };

const ZON_IKON   = { energi: "⚡", jordbruk: "🌾", industri: "🏭", gruva: "⛏", stad: "🏙", kust: "🌊", skog: "🌲" };
const SEKTOR_IKON = { media: "📰", handel: "🏪", konsult: "💼", investering: "📈", advokatbyra: "⚖️", lobbybolag: "🤝" };
const STATUS_BADGES = { öppen: { label: "ÖPPEN", c: "#4ade80" }, avgjort: { label: "AVGJORD", c: "#94a3b8" } };
const AIBUS_FARG = { vision: "#c084fc", strategy: "#38bdf8" };

const IMPAKT_FARG = { genombrottsfynd: "#f59e0b", hög: "#4ade80", medel: "#38bdf8", låg: "#475569" };

function maktFarg(mi) {
  if (mi >= 75) return "#f59e0b";
  if (mi >= 55) return "#facc15";
  if (mi >= 35) return "#22d3ee";
  if (mi >= 15) return "#475569";
  return "transparent";
}

function agentPos(idx, total) {
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
  return { x: CENTER + RING_R * Math.cos(angle), y: CENTER + RING_R * Math.sin(angle) };
}

function koalPos(idx, total) {
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
  return { x: CENTER + KOAL_R * Math.cos(angle), y: CENTER + KOAL_R * Math.sin(angle) };
}

function instPos(idx, total) {
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
  return { x: CENTER + MID_R * Math.cos(angle), y: CENTER + MID_R * Math.sin(angle) };
}

function nodeR(agent) {
  const depth = Math.min(agent.kiCount + agent.minneCount, MAX_DEPTH);
  return 7 + Math.sqrt(depth) * 1.5;
}

function hexPts(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * Math.PI / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function triPts(cx, cy, r) {
  return Array.from({ length: 3 }, (_, i) => {
    const a = (i * 120 - 90) * Math.PI / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function diamPts(cx, cy, r) {
  const rx = r * 0.75;
  return `${cx.toFixed(1)},${(cy - r).toFixed(1)} ${(cx + rx).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + r).toFixed(1)} ${(cx - rx).toFixed(1)},${cy.toFixed(1)}`;
}

function Sparkline({ values, width = 80, height = 24, color = "#4ade80" }) {
  if (!values || values.length < 2) return <span style={{ fontSize: 9, color: "#333" }}>—</span>;
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const range = mx - mn || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - mn) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const trend = values[values.length - 1] >= values[0] ? "#4ade80" : "#f87171";
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color || trend} strokeWidth="1.2" />
    </svg>
  );
}

export default function HjarnanVy({
  agenter = [],
  relationer = [],
  historia = [],
  institutioner = [],
  hedgefonderNodes = [],
  aibusFiler = [],
  universitetUpptackter = [],
  partier = [],
}) {
  const [vald, setVald] = useState(null);

  const posMap = useMemo(() => {
    const m = {};
    agenter.forEach((a, i) => { m[a.namn] = agentPos(i, agenter.length); });
    return m;
  }, [agenter]);

  // All middle-ring nodes: institutions + hedgefonds + AI-Bus
  const alleInstitutioner = useMemo(() => [
    ...institutioner,
    ...hedgefonderNodes,
    { id: "ai-bus", namn: "AI-Bus", ikon: "🤖", farg: "#c084fc", typ: "aibus", filer: aibusFiler },
  ], [institutioner, hedgefonderNodes, aibusFiler]);

  // institution-id → Set of agents
  const instAktMap = useMemo(() => {
    const m = {};
    for (const inst of alleInstitutioner) m[inst.id] = new Set(inst.agenter || []);
    return m;
  }, [alleInstitutioner]);

  const klickaAgent = useCallback((agent) => {
    setVald(prev => prev?.typ === "agent" && prev.data.namn === agent.namn ? null : { typ: "agent", data: agent });
  }, []);

  const klickaKant = useCallback((rel) => {
    setVald(prev => prev?.typ === "kant" && prev.data === rel ? null : { typ: "kant", data: rel });
  }, []);

  const klickaInst = useCallback((inst) => {
    setVald(prev => prev?.data?.id === inst.id ? null : { typ: inst.typ, data: inst });
  }, []);

  const klickaKoalition = useCallback((parti) => {
    setVald(prev => prev?.typ === "koalition" && prev.data.id === parti.id ? null : { typ: "koalition", data: parti });
  }, []);

  const avmarkera = useCallback(() => setVald(null), []);

  // koalPos map: parti.id → position
  const koalPosMap = useMemo(() => {
    const m = {};
    partier.forEach((p, i) => { m[p.id] = koalPos(i, partier.length); });
    return m;
  }, [partier]);

  const valdAgentNamn = vald?.typ === "agent" ? vald.data.namn : null;
  const valdKant = vald?.typ === "kant" ? vald.data : null;
  const valdKoalitionId = vald?.typ === "koalition" ? vald.data.id : null;

  return (
    <div>
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* SVG-graf */}
        <div style={{ flex: "0 0 auto" }}>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width={SVG_W}
            height={SVG_H}
            style={{ display: "block", background: "#080808", borderRadius: "12px", border: "1px solid #1a1a1a", maxWidth: "100%", cursor: "default" }}
            onClick={avmarkera}
          >
            <defs>
              {Object.entries(REL).map(([typ, c]) => (
                <filter key={typ} id={`glow-${typ}`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              ))}
              <filter id="glow-makt" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-inst" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Guide circles — three rings */}
            <circle cx={CENTER} cy={CENTER} r={RING_R} fill="none" stroke="#111"    strokeWidth={0.5} strokeDasharray="4 6" />
            <circle cx={CENTER} cy={CENTER} r={KOAL_R} fill="none" stroke="#1a1505" strokeWidth={0.5} strokeDasharray="3 4" />
            <circle cx={CENTER} cy={CENTER} r={MID_R}  fill="none" stroke="#191919" strokeWidth={0.5} strokeDasharray="3 5" />

            {/* Coalition ring: member lines (agent → coalition node) */}
            {partier.map((parti) => {
              const pk = koalPosMap[parti.id];
              if (!pk) return null;
              return (parti.medlemmar || []).map((agent) => {
                const pa = posMap[agent];
                if (!pa) return null;
                const agentVald = valdAgentNamn === agent;
                const koalVald = valdKoalitionId === parti.id;
                const opacity = (valdAgentNamn || valdKoalitionId)
                  ? (agentVald || koalVald ? 0.65 : 0.03)
                  : 0.08;
                return (
                  <line key={`km-${parti.id}-${agent}`}
                    x1={pa.x} y1={pa.y} x2={pk.x} y2={pk.y}
                    stroke={parti.farg} strokeWidth={1} strokeOpacity={opacity} />
                );
              });
            })}

            {/* Agent-relation edges */}
            {relationer.map((rel, i) => {
              const pa = posMap[rel.agent_a];
              const pb = posMap[rel.agent_b];
              if (!pa || !pb) return null;
              const c = REL[rel.typ] || REL.neutral;
              const isVald = valdKant === rel;
              const agentVald = valdAgentNamn && (rel.agent_a === valdAgentNamn || rel.agent_b === valdAgentNamn);
              const opacity = valdAgentNamn ? (agentVald ? 0.9 : 0.06) : (isVald ? 1 : 0.3);
              const sw = isVald ? 3 : 1 + (rel.styrka || 30) / 50;
              return (
                <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={c.stroke} strokeWidth={sw} strokeOpacity={opacity}
                  filter={isVald ? `url(#glow-${rel.typ})` : undefined}
                  style={{ cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); klickaKant(rel); }}
                />
              );
            })}

            {/* Agent-institution edges (shown when agent is selected) */}
            {valdAgentNamn && alleInstitutioner.map((inst, j) => {
              if (!instAktMap[inst.id]?.has(valdAgentNamn)) return null;
              const pa = posMap[valdAgentNamn];
              const pi = instPos(j, alleInstitutioner.length);
              return (
                <line key={`ai-${j}`}
                  x1={pa.x} y1={pa.y} x2={pi.x} y2={pi.y}
                  stroke={inst.farg} strokeWidth={1} strokeOpacity={0.45} strokeDasharray="4 3" />
              );
            })}

            {/* Coalition ring: party nodes */}
            {partier.map((parti, j) => {
              const pk = koalPosMap[parti.id];
              if (!pk) return null;
              const isVald = valdKoalitionId === parti.id;
              const agentBelongs = valdAgentNamn && (parti.medlemmar || []).includes(valdAgentNamn);
              const opacity = (valdAgentNamn || valdKoalitionId)
                ? (isVald || agentBelongs ? 1 : 0.2)
                : 1;
              const kort = parti.namn.length > 11 ? parti.namn.slice(0, 10) + "…" : parti.namn;
              const angle = (j / partier.length) * 2 * Math.PI - Math.PI / 2;
              const labelR = KOAL_R + 18;
              const lx = CENTER + labelR * Math.cos(angle);
              const ly = CENTER + labelR * Math.sin(angle);
              const anchor = lx < CENTER - 8 ? "end" : lx > CENTER + 8 ? "start" : "middle";
              return (
                <g key={parti.id} opacity={opacity} style={{ cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); klickaKoalition(parti); }}>
                  {isVald && (
                    <circle cx={pk.x} cy={pk.y} r={20} fill="none"
                      stroke={parti.farg} strokeWidth={1} strokeOpacity={0.3} />
                  )}
                  <circle cx={pk.x} cy={pk.y} r={14}
                    fill={isVald ? parti.farg + "33" : parti.farg + "18"}
                    stroke={parti.farg} strokeWidth={isVald ? 2 : 1.2} />
                  <text x={pk.x} y={pk.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={10} fill={parti.farg}
                    style={{ pointerEvents: "none", userSelect: "none" }}>
                    {parti.ikon || "⚡"}
                  </text>
                  <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="central"
                    fontSize={7.5} fill="#4a3a00" fontFamily="monospace"
                    style={{ userSelect: "none" }}>
                    {kort}
                  </text>
                </g>
              );
            })}

            {/* Middle ring: institutions + hedgefonds + AI-Bus */}
            {alleInstitutioner.map((inst, j) => {
              const pi = instPos(j, alleInstitutioner.length);
              const isVald = vald?.data?.id === inst.id;
              const r = inst.typ === "aibus" ? 10 : inst.typ === "hedgefond" ? 8 : 9;
              const dimmed = valdAgentNamn && !instAktMap[inst.id]?.has(valdAgentNamn);
              const opacity = dimmed ? 0.25 : 1;
              return (
                <g key={inst.id} opacity={opacity} style={{ cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); klickaInst(inst); }}>
                  {isVald && (
                    <circle cx={pi.x} cy={pi.y} r={r + 6} fill="none"
                      stroke={inst.farg} strokeWidth={1} strokeOpacity={0.3}
                      filter="url(#glow-inst)" />
                  )}
                  {inst.typ === "hedgefond" && (
                    <polygon points={triPts(pi.x, pi.y, r)}
                      fill={isVald ? inst.farg + "44" : inst.farg + "1a"}
                      stroke={inst.farg} strokeWidth={isVald ? 2 : 1.2} />
                  )}
                  {inst.typ === "aibus" && (
                    <polygon points={diamPts(pi.x, pi.y, r)}
                      fill={isVald ? inst.farg + "44" : inst.farg + "1a"}
                      stroke={inst.farg} strokeWidth={isVald ? 2 : 1.2} />
                  )}
                  {inst.typ === "institution" && (
                    <polygon points={hexPts(pi.x, pi.y, r)}
                      fill={isVald ? inst.farg + "44" : inst.farg + "1a"}
                      stroke={inst.farg} strokeWidth={isVald ? 2 : 1.2} />
                  )}
                  <text x={pi.x} y={pi.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={inst.typ === "aibus" ? 7 : 6} fill={inst.farg}
                    style={{ pointerEvents: "none", userSelect: "none" }}>
                    {inst.ikon}
                  </text>
                </g>
              );
            })}

            {/* Outer ring: agent nodes */}
            {agenter.map((agent, i) => {
              const pos = posMap[agent.namn];
              const r = nodeR(agent);
              const isVald = valdAgentNamn === agent.namn;
              const hasKant = valdKant && (valdKant.agent_a === agent.namn || valdKant.agent_b === agent.namn);
              const opacity = valdAgentNamn ? (isVald ? 1 : 0.25) : (valdKant ? (hasKant ? 1 : 0.25) : 1);
              const labelR = RING_R + r + 14;
              const angle = ((i / agenter.length) * 2 * Math.PI) - Math.PI / 2;
              const lx = CENTER + labelR * Math.cos(angle);
              const ly = CENTER + labelR * Math.sin(angle);
              const anchor = lx < CENTER - 10 ? "end" : lx > CENTER + 10 ? "start" : "middle";
              const kortNamn = agent.namn.length > 12 ? agent.namn.slice(0, 11) + "…" : agent.namn;
              const mc = maktFarg(agent.maktindex || 0);
              const harHogMakt = (agent.maktindex || 0) >= 75;
              const maktRingR = r + 7;
              return (
                <g key={agent.namn} opacity={opacity} style={{ cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); klickaAgent(agent); }}>
                  {mc !== "transparent" && (
                    <circle cx={pos.x} cy={pos.y} r={maktRingR}
                      fill="none" stroke={mc}
                      strokeWidth={1 + (agent.maktindex || 0) / 40}
                      strokeOpacity={0.65}
                      strokeDasharray={harHogMakt ? undefined : "3 2.5"}
                      filter={harHogMakt ? "url(#glow-makt)" : undefined}
                    />
                  )}
                  <circle cx={pos.x} cy={pos.y} r={r + 3}
                    fill={isVald ? agent.farg + "33" : "none"}
                    stroke={isVald ? agent.farg : "transparent"} strokeWidth={1.5} />
                  <circle cx={pos.x} cy={pos.y} r={r}
                    fill={agent.farg + "22"} stroke={agent.farg} strokeWidth={1.5} />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={r > 10 ? 9 : 7} fill={agent.farg} fontFamily="monospace"
                    style={{ userSelect: "none" }}>
                    {agent.ikon}
                  </text>
                  <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="central"
                    fontSize={8.5} fill="#555" fontFamily="monospace"
                    style={{ userSelect: "none" }}>
                    {kortNamn}
                  </text>
                </g>
              );
            })}

            {/* Center brain label */}
            <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="central"
              fontSize={18} fill="#1a1a1a" style={{ userSelect: "none" }}>🧠</text>
          </svg>

          {/* Legends */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "10px", paddingLeft: "4px" }}>
            {Object.entries(REL).map(([typ, c]) => {
              const antal = relationer.filter(r => r.typ === typ).length;
              return (
                <div key={typ} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: 20, height: 2, background: c.stroke, borderRadius: 1 }} />
                  <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>{c.label} ({antal})</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px", paddingLeft: "4px" }}>
            {[
              { label: "Elite ≥75",       c: "#f59e0b" },
              { label: "Mäktig ≥55",      c: "#facc15" },
              { label: "Inflytelserik ≥35", c: "#22d3ee" },
              { label: "Begränsad ≥15",   c: "#475569" },
            ].map(({ label, c }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <svg width={14} height={14}>
                  <circle cx={7} cy={7} r={5} fill="none" stroke={c} strokeWidth={1.5} strokeDasharray="3 2" />
                </svg>
                <span style={{ fontSize: 9, color: "#444", fontFamily: "monospace" }}>{label}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width={14} height={14}><polygon points="7,1 13,13 1,13" fill="none" stroke="#888" strokeWidth={1} /></svg>
                <span style={{ fontSize: 9, color: "#333", fontFamily: "monospace" }}>Hedgefond</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width={14} height={14}><polygon points="3,1 11,1 14,7 11,13 3,13 0,7" fill="none" stroke="#888" strokeWidth={1} /></svg>
                <span style={{ fontSize: 9, color: "#333", fontFamily: "monospace" }}>Institution</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div style={{ flex: "1 1 260px", minWidth: "240px", maxWidth: "400px" }}>
          {!vald && <TomPanel />}
          {vald?.typ === "agent"      && <AgentPanel agent={vald.data} />}
          {vald?.typ === "kant"       && <KantPanel rel={vald.data} agenter={agenter} />}
          {vald?.typ === "koalition"  && <KoalitionPanel parti={vald.data} agenter={agenter} />}
          {vald?.typ === "institution" && <InstitutionPanel inst={vald.data} />}
          {vald?.typ === "hedgefond"   && <HedgefondPanel node={vald.data} />}
          {vald?.typ === "aibus"       && <AiBusPanel filer={vald.data.filer || []} />}
        </div>
      </div>
    </div>
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function TomPanel() {
  return (
    <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "24px", color: "#333", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.8 }}>
      <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.4 }}>🧠</div>
      <div>Klicka en <span style={{ color: "#555" }}>agent</span> (yttre ring) för KI-insikter, minnen, ekonomi och maktindex.</div>
      <div style={{ marginTop: "10px" }}>Klicka ett <span style={{ color: "#facc15" }}>koalitionsparti</span> (mellanring) för partinamn, ledare och medlemmar.</div>
      <div style={{ marginTop: "10px" }}>Klicka en <span style={{ color: "#555" }}>kant</span> för relationstyp och narrativ.</div>
      <div style={{ marginTop: "10px" }}>Klicka en <span style={{ color: "#555" }}>institution</span> (inre ring) för institutionens data.</div>
      <div style={{ marginTop: "14px", color: "#222", fontSize: "11px" }}>
        ⬡ = institution · △ = hedgefond · ◇ = AI-Bus · ○ = parti
      </div>
      <div style={{ marginTop: "4px", color: "#222", fontSize: "11px" }}>
        Nodstorlek = kunskapsdjup · Yttre ring = maktindex
      </div>
    </div>
  );
}

function KoalitionPanel({ parti, agenter }) {
  const C = { bg: "#0f0f0f", border: "#1a1a1a", dim: "#555", text: "#e8e8e8" };
  const memberList = (parti.medlemmar || []).slice(0, 12);
  const agentMap = {};
  for (const a of agenter) agentMap[a.namn] = a;
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: parti.farg + "22", border: `2px solid ${parti.farg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
          {parti.ikon || "⚡"}
        </div>
        <div>
          <div style={{ fontSize: "14px", color: C.text, fontFamily: "Georgia, serif", fontWeight: 600 }}>{parti.namn}</div>
          <div style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace" }}>
            Ledare: <span style={{ color: parti.farg }}>{parti.ledare}</span>
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: "9px", color: C.dim, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>MEDLEMMAR ({memberList.length})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {memberList.map(m => {
            const a = agentMap[m];
            return (
              <a key={m} href={`/agent/${encodeURIComponent(m)}`}
                style={{ display: "flex", alignItems: "center", gap: "4px", background: "#111", border: "1px solid #1e1e1e", borderRadius: "5px", padding: "3px 7px", textDecoration: "none" }}>
                {a && <span style={{ fontSize: "10px", color: a.farg }}>{a.ikon}</span>}
                <span style={{ fontSize: "10px", color: "#888", fontFamily: "monospace" }}>{m}</span>
              </a>
            );
          })}
        </div>
      </div>
      {parti.styrka > 0 && (
        <div>
          <div style={{ fontSize: "9px", color: C.dim, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "6px" }}>KOALITIONSSTYRKA</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: 4, background: "#111", borderRadius: 2 }}>
              <div style={{ width: `${Math.min(parti.styrka * 5, 100)}%`, height: "100%", background: parti.farg, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: parti.farg, fontFamily: "monospace" }}>{parti.styrka}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentPanel({ agent }) {
  const C = { bg: "#0f0f0f", border: "#1a1a1a", dim: "#555", dimmer: "#333", text: "#e8e8e8" };
  const wr = agent.marketWinRate;
  const wrFarg = wr == null ? "#555" : wr >= 60 ? "#4ade80" : wr >= 45 ? "#facc15" : "#f87171";
  const rank = agent.saldoRank;
  const total = agent.saldoTotal || 24;
  const rankFarg = rank == null ? "#555" : rank <= 6 ? "#4ade80" : rank >= total - 5 ? "#f87171" : "#facc15";
  const mi = agent.maktindex || 0;
  const miFarg = maktFarg(mi);
  const miLabel = mi >= 75 ? "ELITE" : mi >= 55 ? "MÄKTIG" : mi >= 35 ? "INFLYTELSERIK" : mi >= 15 ? "BEGRÄNSAD" : "MARGINELL";

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "80vh", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
          {miFarg !== "transparent" && (
            <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px ${mi >= 75 ? "solid" : "dashed"} ${miFarg}`, opacity: 0.7 }} />
          )}
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: agent.farg + "22", border: `2px solid ${agent.farg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: agent.farg, fontFamily: "monospace", position: "absolute", top: 3, left: 3 }}>
            {agent.ikon}
          </div>
        </div>
        <div>
          <a href={`/agent/${encodeURIComponent(agent.namn)}`} style={{ fontSize: "14px", color: C.text, fontFamily: "Georgia, serif", fontWeight: 600, textDecoration: "none" }}>{agent.namn}</a>
          <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
            {agent.kiCount} KI · {agent.minneCount} minnen · gen {agent.generation}
          </div>
          {mi > 0 && (
            <div style={{ fontSize: "9px", color: miFarg, fontFamily: "monospace", marginTop: "2px" }}>
              MAKTINDEX {Math.round(mi)} — {miLabel}
            </div>
          )}
        </div>
      </div>

      {/* Ekonomi */}
      {agent.saldo != null && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>EKONOMI</div>
          <div style={{ display: "flex", gap: "14px", alignItems: "baseline", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "20px", fontWeight: 700, color: rankFarg, fontFamily: "monospace" }}>{agent.saldo} kr</span>
              {rank && <span style={{ fontSize: "9px", color: rankFarg, fontFamily: "monospace", marginLeft: "6px", opacity: 0.8 }}>#{rank}/{total}</span>}
            </div>
            {agent.saldoSpel != null && (
              <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
                Spelkonto: <span style={{ color: "#fb923c" }}>{agent.saldoSpel} kr</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Market-prestation */}
      <div>
        <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>MARKET-PRESTATION</div>
        {agent.marketTotal === 0
          ? <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>Inga avgjorda bets ännu.</div>
          : (
            <div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "8px", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: wrFarg, fontFamily: "monospace" }}>{wr}%</span>
                  <span style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", marginLeft: "4px" }}>rätt</span>
                </div>
                <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
                  {agent.marketWon}/{agent.marketTotal} bets · snitt {agent.marketAvgConf}%
                </div>
              </div>
              {agent.marketPerKat.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {agent.marketPerKat.map((k, i) => {
                    const kFarg = k.winRate >= 60 ? "#4ade80" : k.winRate >= 45 ? "#facc15" : "#f87171";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: `${k.winRate}%`, height: 3, background: kFarg, borderRadius: 2, maxWidth: "80px" }} />
                        <span style={{ fontSize: "9px", color: "#555", fontFamily: "monospace" }}>{k.kat}: {k.won}/{k.total} ({k.winRate}%)</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        }
      </div>

      {/* Krypto-ETF */}
      {agent.etf && agent.etf.length > 0 && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>KRYPTO-ETF</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {agent.etf.map((e, i) => {
              const pFarg = e.pnlPct == null ? "#555" : e.pnlPct >= 0 ? "#4ade80" : "#f87171";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", color: "#fb923c", fontFamily: "monospace", minWidth: "28px" }}>{e.symbol}</span>
                  <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>{e.investerat} kr</span>
                  {e.pnlPct != null && (
                    <span style={{ fontSize: "10px", color: pFarg, fontFamily: "monospace" }}>
                      {e.pnlPct >= 0 ? "+" : ""}{e.pnlPct}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Territorium */}
      {agent.zoner && agent.zoner.length > 0 && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>TERRITORIUM ({agent.zoner.length} zoner)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {agent.zoner.map((z, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ fontSize: 11 }}>{ZON_IKON[z.typ] || "📍"}</span>
                <span style={{ fontSize: "10px", color: "#777", fontFamily: "monospace" }}>{z.namn}</span>
                <span style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", marginLeft: "auto" }}>{z.veckoinkomst}kr/v</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Företag */}
      {agent.foretag && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>FÖRETAG</div>
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
              <span style={{ fontSize: 13 }}>{SEKTOR_IKON[agent.foretag.sektor] || "🏢"}</span>
              <span style={{ fontSize: "12px", color: "#e8e8e8", fontFamily: "monospace" }}>{agent.foretag.namn}</span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <span style={{ fontSize: "9px", color: "#555", fontFamily: "monospace" }}>{agent.foretag.sektor?.toUpperCase()}</span>
              <span style={{ fontSize: "9px", color: "#4ade80", fontFamily: "monospace" }}>Kassa: {agent.foretag.kassa} kr</span>
            </div>
          </div>
        </div>
      )}

      {/* Rykte-DNA */}
      {agent.rykten && (agent.rykten.sant > 0 || agent.rykten.falskt > 0) && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>RYKTE-DNA</div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
            <div style={{ flex: 1, background: "#0a2a0a", border: "1px solid #1a3a1a", borderRadius: "6px", padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "16px", color: "#4ade80", fontFamily: "monospace", fontWeight: 700 }}>{agent.rykten.sant}</div>
              <div style={{ fontSize: "8px", color: "#2a5a2a", fontFamily: "monospace" }}>SANNA</div>
            </div>
            <div style={{ flex: 1, background: "#2a0a0a", border: "1px solid #3a1a1a", borderRadius: "6px", padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "16px", color: "#f87171", fontFamily: "monospace", fontWeight: 700 }}>{agent.rykten.falskt}</div>
              <div style={{ fontSize: "8px", color: "#5a2a2a", fontFamily: "monospace" }}>FALSKA</div>
            </div>
          </div>
          {agent.rykten.topRykte && (
            <div style={{ background: "#0a0a0a", borderLeft: `2px solid ${agent.rykten.topRykte.sanning ? "#4ade80" : "#f87171"}`, borderRadius: "4px", padding: "8px 10px" }}>
              <div style={{ fontSize: "8px", color: agent.rykten.topRykte.sanning ? "#2a5a2a" : "#5a2a2a", fontFamily: "monospace", marginBottom: "4px" }}>
                MEST SPRIDD · {agent.rykten.topRykte.spridningar} spridningar · {agent.rykten.topRykte.sanning ? "SANT" : "FALSKT"}
              </div>
              <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.5 }}>
                {agent.rykten.topRykte.innehall?.slice(0, 130)}{(agent.rykten.topRykte.innehall?.length || 0) > 130 ? "…" : ""}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Motioner */}
      {agent.motioner && agent.motioner.length > 0 && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>MOTIONER ({agent.motioner.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {agent.motioner.slice(0, 4).map((m, i) => {
              const tot = (m.ja || 0) + (m.nej || 0);
              const jaPct = tot > 0 ? Math.round((m.ja || 0) / tot * 100) : 0;
              const sb = STATUS_BADGES[m.status] || { label: m.status?.toUpperCase() || "?", c: "#555" };
              return (
                <div key={i} style={{ background: "#0a0a0a", border: "1px solid #18182a", borderLeft: "2px solid #818cf8", borderRadius: "5px", padding: "8px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px", marginBottom: "4px" }}>
                    <div style={{ fontSize: "10px", color: "#c7d2fe", lineHeight: 1.4 }}>{m.titel}</div>
                    <div style={{ fontSize: "7px", color: sb.c, fontFamily: "monospace", flexShrink: 0, border: `1px solid ${sb.c}44`, borderRadius: "2px", padding: "1px 3px" }}>{sb.label}</div>
                  </div>
                  {tot > 0 && (
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <div style={{ flex: 1, height: 2, background: "#111", borderRadius: 1, overflow: "hidden" }}>
                        <div style={{ width: `${jaPct}%`, height: "100%", background: "#4ade80" }} />
                      </div>
                      <span style={{ fontSize: "8px", color: "#444", fontFamily: "monospace" }}>{m.ja}✓ {m.nej}✗</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KI-insikter */}
      <div>
        <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>KI-INSIKTER</div>
        {agent.ki.length === 0
          ? <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>Inga insikter ännu.</div>
          : agent.ki.map((k, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "9px", color: "#38bdf8", fontFamily: "monospace", letterSpacing: "0.05em" }}>{k.amne?.toUpperCase()}</div>
              <div style={{ fontSize: "11px", color: C.dim, lineHeight: 1.5 }}>{k.insikt}</div>
            </div>
          ))
        }
      </div>

      {/* Minnen */}
      <div>
        <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>SENASTE MINNEN</div>
        {agent.minnen.length === 0
          ? <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>Inga minnen ännu.</div>
          : agent.minnen.map((m, i) => (
            <div key={i} style={{ marginBottom: "7px", display: "flex", gap: "6px" }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>{HÄNDELSE_IKON[m.typ] || "•"}</span>
              <div style={{ fontSize: "11px", color: C.dim, lineHeight: 1.5 }}>{m.narrativ}</div>
            </div>
          ))
        }
      </div>

      {/* Strategi */}
      {agent.strategi && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "6px" }}>STRATEGITEXT (gen {agent.generation})</div>
          <div style={{ fontSize: "11px", color: C.dim, lineHeight: 1.6, fontStyle: "italic" }}>"{agent.strategi}{agent.strategi?.length >= 220 ? "…" : ""}"</div>
        </div>
      )}
    </div>
  );
}

function KantPanel({ rel, agenter }) {
  const C = { bg: "#0f0f0f", border: "#1a1a1a", dim: "#555", dimmer: "#333", text: "#e8e8e8" };
  const rInfo = REL[rel.typ] || REL.neutral;
  const agA = agenter.find(a => a.namn === rel.agent_a);
  const agB = agenter.find(a => a.namn === rel.agent_b);
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <AgentChip agent={agA} namn={rel.agent_a} />
        <div style={{ width: 28, height: 2, background: rInfo.stroke, borderRadius: 1 }} />
        <AgentChip agent={agB} namn={rel.agent_b} />
      </div>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ padding: "3px 10px", borderRadius: "4px", background: rInfo.dim, color: rInfo.stroke, fontSize: "11px", fontFamily: "monospace", fontWeight: 700 }}>
          {rInfo.label.toUpperCase()}
        </div>
        <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>
          Styrka: <span style={{ color: rInfo.stroke }}>{rel.styrka || "?"}/100</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "6px" }}>RELATIONENS NARRATIV</div>
        {rel.beskrivning
          ? <div style={{ fontSize: "12px", color: C.dim, lineHeight: 1.7, background: "#080808", padding: "10px 12px", borderRadius: "6px", borderLeft: `2px solid ${rInfo.stroke}` }}>
              {rel.beskrivning}
            </div>
          : <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>Ingen historik registrerad ännu.</div>
        }
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[rel.agent_a, rel.agent_b].map(namn => (
          <a key={namn} href={`/agent/${encodeURIComponent(namn)}`}
            style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace", textDecoration: "none" }}
            onClick={e => e.stopPropagation()}>
            {namn} →
          </a>
        ))}
        <a href={`/versus?a=${encodeURIComponent(rel.agent_a)}&b=${encodeURIComponent(rel.agent_b)}`}
          style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace", textDecoration: "none", marginLeft: "auto" }}
          onClick={e => e.stopPropagation()}>
          Se 1v1 →
        </a>
      </div>
    </div>
  );
}

function InstitutionPanel({ inst }) {
  const C = { bg: "#0f0f0f", border: "#1a1a1a", dim: "#555", dimmer: "#333" };
  const statEntries = Object.entries(inst.stats || {});
  return (
    <div style={{ background: C.bg, border: `1px solid ${inst.farg}33`, borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "8px", background: inst.farg + "22", border: `1.5px solid ${inst.farg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          {inst.ikon}
        </div>
        <div>
          <div style={{ fontSize: "15px", color: inst.farg, fontFamily: "Georgia, serif", fontWeight: 600 }}>{inst.namn}</div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace" }}>
            {inst.agenter?.length || 0} aktiva agenter
          </div>
        </div>
      </div>

      {statEntries.length > 0 && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {statEntries.map(([k, v]) => (
            <div key={k} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "8px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: inst.farg, fontFamily: "monospace" }}>{v}</div>
              <div style={{ fontSize: "8px", color: C.dimmer, fontFamily: "monospace" }}>{k.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

      {inst.agenter && inst.agenter.length > 0 && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>AKTIVA AGENTER</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {inst.agenter.slice(0, 12).map(namn => (
              <a key={namn} href={`/agent/${encodeURIComponent(namn)}`}
                style={{ fontSize: "9px", color: inst.farg, fontFamily: "monospace", background: inst.farg + "15", border: `1px solid ${inst.farg}33`, borderRadius: "4px", padding: "2px 6px", textDecoration: "none" }}>
                {namn}
              </a>
            ))}
            {inst.agenter.length > 12 && (
              <span style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace" }}>+{inst.agenter.length - 12} till</span>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        {inst.id === "parlamentet" && <NavLink href="/parlament" label="Öppna Parlamentet" color={inst.farg} />}
        {inst.id === "domstolen"   && <NavLink href="/domstol"   label="Öppna Domstolen"   color={inst.farg} />}
        {inst.id === "butiken"     && <NavLink href="/butik"     label="Öppna Butiken"     color={inst.farg} />}
        {inst.id === "borsen"      && <NavLink href="/etf"       label="Öppna ETF-sidan"   color={inst.farg} />}
        {inst.id === "markartan"   && <NavLink href="/mark"      label="Öppna Markartan"   color={inst.farg} />}
        {inst.id === "staten"      && <NavLink href="/staten"    label="Öppna Staten"      color={inst.farg} />}
        {inst.id === "universitetet" && <NavLink href="/universitet" label="Öppna Universitetet" color={inst.farg} />}
      </div>
    </div>
  );
}

function HedgefondPanel({ node }) {
  const C = { bg: "#0f0f0f", border: "#1a1a1a", dim: "#555", dimmer: "#333" };
  const pnlFarg = node.pnlPct == null ? "#555" : node.pnlPct >= 0 ? "#4ade80" : "#f87171";
  return (
    <div style={{ background: C.bg, border: `1px solid ${node.farg}33`, borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "15px", color: node.farg, fontFamily: "monospace", fontWeight: 700 }}>{node.id}</div>
          <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>{node.namn}</div>
        </div>
        {node.pnlPct != null && (
          <div style={{ fontSize: "18px", fontWeight: 700, color: pnlFarg, fontFamily: "monospace" }}>
            {node.pnlPct >= 0 ? "+" : ""}{node.pnlPct}%
          </div>
        )}
      </div>

      {node.history && node.history.length > 1 && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", marginBottom: "6px" }}>NAV-HISTORIK</div>
          <Sparkline values={node.history} width={200} height={40} color={node.farg} />
          {node.latest && <div style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace", marginTop: "4px" }}>Senaste NAV: {node.latest}</div>}
        </div>
      )}

      {node.extra && (
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace" }}>
            APR: <span style={{ color: node.farg }}>{node.extra.apr?.toFixed(1)}%</span>
          </div>
          <div style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace" }}>
            FR: <span style={{ color: node.farg }}>{node.extra.fr?.toFixed(3)}%</span>
          </div>
        </div>
      )}

      {node.investerare && node.investerare.length > 0 && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>INVESTERARE ({node.investerare.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {node.investerare.slice(0, 8).map((inv, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "#888", fontFamily: "monospace" }}>{inv.agent}</span>
                <span style={{ fontSize: "9px", color: node.farg, fontFamily: "monospace" }}>{inv.investerat} kr</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <NavLink href="/hedgefonder" label="Öppna Hedgefond-sidan" color={node.farg} />
    </div>
  );
}

function AiBusPanel({ filer = [] }) {
  const C = { bg: "#0f0f0f", border: "#1a1a1a", dim: "#555", dimmer: "#333" };
  return (
    <div style={{ background: C.bg, border: "1px solid #2a1a3a", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 38, height: 38, background: "#c084fc22", border: "1.5px solid #c084fc", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          🤖
        </div>
        <div>
          <div style={{ fontSize: "15px", color: "#c084fc", fontFamily: "Georgia, serif", fontWeight: 600 }}>AI-Bus</div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace" }}>Senaste diskussioner · {filer.length} filer</div>
        </div>
      </div>

      {filer.length === 0
        ? <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>Inga AI-bus-filer hittades.</div>
        : filer.map((f, i) => {
          const farg = AIBUS_FARG[f.typ] || "#888";
          return (
            <div key={i} style={{ background: "#080808", border: `1px solid ${farg}22`, borderLeft: `2px solid ${farg}`, borderRadius: "6px", padding: "10px 12px" }}>
              <div style={{ fontSize: "9px", color: farg, fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: "5px" }}>
                {f.typ?.toUpperCase()} · {f.date}
              </div>
              <div style={{ fontSize: "11px", color: "#c8c8c8", lineHeight: 1.4, fontWeight: 600, marginBottom: "6px" }}>{f.title}</div>
              <div style={{ fontSize: "10px", color: "#555", lineHeight: 1.6 }}>{f.body}</div>
            </div>
          );
        })
      }
    </div>
  );
}

function NavLink({ href, label, color }) {
  return (
    <a href={href} style={{ fontSize: "10px", color: color, fontFamily: "monospace", textDecoration: "none", background: color + "15", border: `1px solid ${color}33`, borderRadius: "4px", padding: "4px 10px" }}
      onClick={e => e.stopPropagation()}>
      {label} →
    </a>
  );
}

function AgentChip({ agent, namn }) {
  const farg = agent?.farg || "#888";
  const ikon = agent?.ikon || "◈";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: farg + "22", border: `1.5px solid ${farg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: farg, fontFamily: "monospace" }}>
        {ikon}
      </div>
      <span style={{ fontSize: "11px", color: "#777", fontFamily: "monospace" }}>{namn}</span>
    </div>
  );
}
