"use client";
import { useState, useCallback } from "react";

const RING_R  = 205;
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

function agentPos(idx, total) {
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
  return { x: CENTER + RING_R * Math.cos(angle), y: CENTER + RING_R * Math.sin(angle) };
}

function nodeR(agent) {
  const depth = Math.min(agent.kiCount + agent.minneCount, MAX_DEPTH);
  return 7 + Math.sqrt(depth) * 1.5;
}

export default function HjarnanVy({ agenter, relationer }) {
  const [vald, setVald] = useState(null);   // { typ: "agent"|"kant", data: ... }

  const posMap = {};
  agenter.forEach((a, i) => { posMap[a.namn] = agentPos(i, agenter.length); });

  const klickaAgent = useCallback((agent) => {
    setVald(prev => prev?.typ === "agent" && prev.data.namn === agent.namn ? null : { typ: "agent", data: agent });
  }, []);

  const klickaKant = useCallback((rel) => {
    setVald(prev => prev?.typ === "kant" && prev.data === rel ? null : { typ: "kant", data: rel });
  }, []);

  const avmarkera = useCallback(() => setVald(null), []);

  const valdAgentNamn = vald?.typ === "agent" ? vald.data.namn : null;
  const valdKant = vald?.typ === "kant" ? vald.data : null;

  return (
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
          </defs>

          {/* Kanter */}
          {relationer.map((rel, i) => {
            const pa = posMap[rel.agent_a];
            const pb = posMap[rel.agent_b];
            if (!pa || !pb) return null;
            const c = REL[rel.typ] || REL.neutral;
            const isVald = valdKant === rel;
            const agentVald = valdAgentNamn && (rel.agent_a === valdAgentNamn || rel.agent_b === valdAgentNamn);
            const opacity = valdAgentNamn ? (agentVald ? 0.9 : 0.1) : (isVald ? 1 : 0.35);
            const sw = isVald ? 3 : 1 + (rel.styrka || 30) / 50;
            return (
              <line
                key={i}
                x1={pa.x} y1={pa.y}
                x2={pb.x} y2={pb.y}
                stroke={c.stroke}
                strokeWidth={sw}
                strokeOpacity={opacity}
                filter={isVald ? `url(#glow-${rel.typ})` : undefined}
                style={{ cursor: "pointer" }}
                onClick={e => { e.stopPropagation(); klickaKant(rel); }}
              />
            );
          })}

          {/* Noder */}
          {agenter.map((agent, i) => {
            const pos = posMap[agent.namn];
            const r = nodeR(agent);
            const isVald = valdAgentNamn === agent.namn;
            const hasKant = valdKant && (valdKant.agent_a === agent.namn || valdKant.agent_b === agent.namn);
            const opacity = valdAgentNamn ? (isVald ? 1 : 0.3) : (valdKant ? (hasKant ? 1 : 0.3) : 1);
            const angle = (i / agenter.length) * 360 - 90;
            const labelR = RING_R + r + 14;
            const lx = CENTER + labelR * Math.cos(((i / agenter.length) * 2 * Math.PI) - Math.PI / 2);
            const ly = CENTER + labelR * Math.sin(((i / agenter.length) * 2 * Math.PI) - Math.PI / 2);
            const anchor = lx < CENTER - 10 ? "end" : lx > CENTER + 10 ? "start" : "middle";
            const kortNamn = agent.namn.length > 12 ? agent.namn.slice(0, 11) + "…" : agent.namn;
            return (
              <g key={agent.namn} opacity={opacity} style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); klickaAgent(agent); }}>
                <circle
                  cx={pos.x} cy={pos.y} r={r + 3}
                  fill={isVald ? agent.farg + "33" : "none"}
                  stroke={isVald ? agent.farg : "transparent"}
                  strokeWidth={1.5}
                />
                <circle cx={pos.x} cy={pos.y} r={r} fill={agent.farg + "22"} stroke={agent.farg} strokeWidth={1.5} />
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize={r > 10 ? 9 : 7} fill={agent.farg} fontFamily="monospace">
                  {agent.ikon}
                </text>
                <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="central" fontSize={8.5} fill="#555" fontFamily="monospace">
                  {kortNamn}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
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
          <div style={{ fontSize: 10, color: "#333", fontFamily: "monospace", marginLeft: "auto" }}>
            Nodstorlek = KI-insikter + minnen · Klicka för detaljer
          </div>
        </div>
      </div>

      {/* Infopanel */}
      <div style={{ flex: "1 1 260px", minWidth: "240px", maxWidth: "380px" }}>
        {!vald && <TomPanel />}
        {vald?.typ === "agent" && <AgentPanel agent={vald.data} />}
        {vald?.typ === "kant" && <KantPanel rel={vald.data} agenter={agenter} />}
      </div>
    </div>
  );
}

function TomPanel() {
  return (
    <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "24px", color: "#333", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.8 }}>
      <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.4 }}>🧠</div>
      <div>Klicka en <span style={{ color: "#555" }}>agent</span> för att se dess KI-insikter, minnen och strategitext.</div>
      <div style={{ marginTop: "10px" }}>Klicka en <span style={{ color: "#555" }}>kant</span> för att se relationstyp och narrativet bakom den.</div>
    </div>
  );
}

function AgentPanel({ agent }) {
  const C = { bg: "#0f0f0f", border: "#1a1a1a", dim: "#555", dimmer: "#333", text: "#e8e8e8" };
  const strategi = agent.strategi;
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: agent.farg + "22", border: `2px solid ${agent.farg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: agent.farg, fontFamily: "monospace", flexShrink: 0 }}>
          {agent.ikon}
        </div>
        <div>
          <div style={{ fontSize: "14px", color: C.text, fontFamily: "Georgia, serif", fontWeight: 600 }}>{agent.namn}</div>
          <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
            {agent.kiCount} KI · {agent.minneCount} minnen · gen {agent.generation}
          </div>
        </div>
      </div>

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
      {strategi && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "6px" }}>STRATEGITEXT (gen {agent.generation})</div>
          <div style={{ fontSize: "11px", color: C.dim, lineHeight: 1.6, fontStyle: "italic" }}>"{strategi}{agent.strategi?.length >= 220 ? "…" : ""}"</div>
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
      {/* Agentpar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <AgentChip agent={agA} namn={rel.agent_a} />
        <div style={{ width: 28, height: 2, background: rInfo.stroke, borderRadius: 1 }} />
        <AgentChip agent={agB} namn={rel.agent_b} />
      </div>

      {/* Typ + styrka */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ padding: "3px 10px", borderRadius: "4px", background: rInfo.dim, color: rInfo.stroke, fontSize: "11px", fontFamily: "monospace", fontWeight: 700 }}>
          {rInfo.label.toUpperCase()}
        </div>
        <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>
          Styrka: <span style={{ color: rInfo.stroke }}>{rel.styrka || "?"}/100</span>
        </div>
      </div>

      {/* Narrativ */}
      <div>
        <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "6px" }}>RELATIONENS NARRATIV</div>
        {rel.beskrivning
          ? <div style={{ fontSize: "12px", color: C.dim, lineHeight: 1.7, background: "#080808", padding: "10px 12px", borderRadius: "6px", borderLeft: `2px solid ${rInfo.stroke}` }}>
              {rel.beskrivning}
            </div>
          : <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>Ingen historik registrerad ännu.</div>
        }
      </div>

      {/* Links to agents */}
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
