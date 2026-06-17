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

const HISTORIK_IKON = {
  koalition_bildad: "🤝", allians_bruten: "💔", förräderi: "🗡️",
  triumf: "🏆", skandal: "😱", marknadsseger: "💰", marknadskrasch: "📉", symbolkup: "👑",
};

const HISTORIK_FARG = {
  koalition_bildad: "#facc15", allians_bruten: "#f87171", förräderi: "#fb923c",
  triumf: "#4ade80", skandal: "#f87171", marknadsseger: "#4ade80",
  marknadskrasch: "#f87171", symbolkup: "#e879f9",
};

const ZON_IKON = { energi: "⚡", jordbruk: "🌾", industri: "🏭", gruva: "⛏", stad: "🏙", kust: "🌊", skog: "🌲" };
const SEKTOR_IKON = { media: "📰", handel: "🏪", konsult: "💼", investering: "📈", advokatbyra: "⚖️", lobbybolag: "🤝" };

const STATUS_BADGES = { öppen: { label: "ÖPPEN", c: "#4ade80" }, avgjort: { label: "AVGJORD", c: "#94a3b8" } };

function agentPos(idx, total) {
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
  return { x: CENTER + RING_R * Math.cos(angle), y: CENTER + RING_R * Math.sin(angle) };
}

function nodeR(agent) {
  const depth = Math.min(agent.kiCount + agent.minneCount, MAX_DEPTH);
  return 7 + Math.sqrt(depth) * 1.5;
}

// Minimal SVG sparkline from an array of numeric values
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

export default function HjarnanVy({ agenter, relationer, historia = [], kryptoPriser = {}, hedgeNavMap = {}, arbiHistory = [], motioner = [] }) {
  const [vald, setVald] = useState(null);

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

  const harKryptoData = Object.keys(kryptoPriser).length > 0;
  const harHedgeData  = Object.keys(hedgeNavMap).length > 0;
  const harArbiData   = arbiHistory.length > 0;
  const harMotioner   = motioner.length > 0;

  return (
    <div>
      {/* Graf + infopanel */}
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
                <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={c.stroke} strokeWidth={sw} strokeOpacity={opacity}
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
              const labelR = RING_R + r + 14;
              const lx = CENTER + labelR * Math.cos(((i / agenter.length) * 2 * Math.PI) - Math.PI / 2);
              const ly = CENTER + labelR * Math.sin(((i / agenter.length) * 2 * Math.PI) - Math.PI / 2);
              const anchor = lx < CENTER - 10 ? "end" : lx > CENTER + 10 ? "start" : "middle";
              const kortNamn = agent.namn.length > 12 ? agent.namn.slice(0, 11) + "…" : agent.namn;
              return (
                <g key={agent.namn} opacity={opacity} style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); klickaAgent(agent); }}>
                  <circle cx={pos.x} cy={pos.y} r={r + 3}
                    fill={isVald ? agent.farg + "33" : "none"}
                    stroke={isVald ? agent.farg : "transparent"} strokeWidth={1.5} />
                  <circle cx={pos.x} cy={pos.y} r={r} fill={agent.farg + "22"} stroke={agent.farg} strokeWidth={1.5} />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={r > 10 ? 9 : 7} fill={agent.farg} fontFamily="monospace">
                    {agent.ikon}
                  </text>
                  <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="central"
                    fontSize={8.5} fill="#555" fontFamily="monospace">
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
              Nodstorlek = KI + minnen · Klicka för detaljer
            </div>
          </div>
        </div>

        {/* Infopanel */}
        <div style={{ flex: "1 1 260px", minWidth: "240px", maxWidth: "400px" }}>
          {!vald && <TomPanel />}
          {vald?.typ === "agent" && <AgentPanel agent={vald.data} />}
          {vald?.typ === "kant" && <KantPanel rel={vald.data} agenter={agenter} />}
        </div>
      </div>

      {/* === Full-width sektioner === */}

      {/* Kryptomarknaden */}
      {harKryptoData && (
        <FullWidthSektion titel="📈 Kryptomarknaden — aktuella priser" color="#fb923c">
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {Object.entries(kryptoPriser).map(([sym, { pris, datum }]) => (
              <div key={sym} style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "8px", padding: "12px 16px", minWidth: "100px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#fb923c", fontFamily: "monospace", fontWeight: 700 }}>{sym}</div>
                <div style={{ fontSize: "16px", color: "#e8e8e8", fontFamily: "monospace", marginTop: "4px" }}>
                  ${typeof pris === "number" ? pris.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) : pris}
                </div>
                <div style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", marginTop: "3px" }}>{datum}</div>
              </div>
            ))}
          </div>
        </FullWidthSektion>
      )}

      {/* Hedgefonder */}
      {(harHedgeData || harArbiData) && (
        <FullWidthSektion titel="🏦 Paper Trading — NAV-historik" color="#22d3ee">
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {Object.entries(hedgeNavMap).map(([sym, { namn, history }]) => {
              const latest = history[history.length - 1]?.nav;
              const first = history[0]?.nav || 100;
              const pnlPct = latest ? Math.round((latest / first - 1) * 100) : null;
              const pnlFarg = pnlPct == null ? "#555" : pnlPct >= 0 ? "#4ade80" : "#f87171";
              return (
                <div key={sym} style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "8px", padding: "12px 14px", minWidth: "160px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#22d3ee", fontFamily: "monospace", fontWeight: 700 }}>{sym}</div>
                      <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace" }}>{namn}</div>
                    </div>
                    {pnlPct != null && (
                      <div style={{ fontSize: "11px", color: pnlFarg, fontFamily: "monospace" }}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct}%
                      </div>
                    )}
                  </div>
                  <Sparkline values={history.map(h => h.nav)} color="#22d3ee" />
                  {latest && <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", marginTop: "4px" }}>NAV: {parseFloat(latest).toFixed(2)}</div>}
                </div>
              );
            })}
            {harArbiData && (() => {
              const latest = arbiHistory[arbiHistory.length - 1];
              const first = arbiHistory[0]?.portfölj_värde_usd || 10000;
              const latestVal = latest?.portfölj_värde_usd || 10000;
              const pnlPct = Math.round((latestVal / first - 1) * 100);
              const pnlFarg = pnlPct >= 0 ? "#4ade80" : "#f87171";
              return (
                <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "8px", padding: "12px 14px", minWidth: "160px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#22d3ee", fontFamily: "monospace", fontWeight: 700 }}>ARBI</div>
                      <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace" }}>Funding Rate Arbitrage</div>
                    </div>
                    <div style={{ fontSize: "11px", color: pnlFarg, fontFamily: "monospace" }}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct}%
                    </div>
                  </div>
                  <Sparkline values={arbiHistory.map(a => parseFloat(a.portfölj_värde_usd))} color="#22d3ee" />
                  <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", marginTop: "4px" }}>
                    APR: {latest?.apr_pct?.toFixed(1)}% · FR: {latest?.funding_rate_pct?.toFixed(3)}%
                  </div>
                </div>
              );
            })()}
          </div>
        </FullWidthSektion>
      )}

      {/* AI-Motioner */}
      {harMotioner && (
        <FullWidthSektion titel="⚖️ AI-Parlamentets motioner" color="#818cf8">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
            {motioner.map((m, i) => {
              const sb = STATUS_BADGES[m.status] || { label: m.status?.toUpperCase() || "?", c: "#555" };
              const tot = (m.ai_ja_roster || 0) + (m.ai_nej_roster || 0) + (m.ai_avstar_roster || 0);
              const jaPct = tot > 0 ? Math.round((m.ai_ja_roster || 0) / tot * 100) : 0;
              return (
                <div key={m.id} style={{ background: "#0a0a0a", border: "1px solid #18182a", borderLeft: "2px solid #818cf8", borderRadius: "6px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ fontSize: "11px", color: "#c7d2fe", lineHeight: 1.4 }}>{m.titel}</div>
                    <div style={{ fontSize: "8px", color: sb.c, fontFamily: "monospace", flexShrink: 0, border: `1px solid ${sb.c}44`, borderRadius: "3px", padding: "1px 4px" }}>{sb.label}</div>
                  </div>
                  {tot > 0 && (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <div style={{ flex: 1, height: 3, background: "#111", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${jaPct}%`, height: "100%", background: "#4ade80" }} />
                      </div>
                      <span style={{ fontSize: "9px", color: "#555", fontFamily: "monospace" }}>
                        {m.ai_ja_roster}✓ {m.ai_nej_roster}✗ {m.ai_avstar_roster}–
                      </span>
                    </div>
                  )}
                  {m.kategori && <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", marginTop: "5px" }}>{m.kategori?.toUpperCase()}</div>}
                </div>
              );
            })}
          </div>
        </FullWidthSektion>
      )}

      {/* Civilisationens Historik */}
      {historia.length > 0 && (
        <FullWidthSektion titel="🌍 Civilisationens Historik — senaste händelser" color="#facc15">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px" }}>
            {historia.map((h, i) => {
              const ikon = HISTORIK_IKON[h.typ] || "•";
              const farg = HISTORIK_FARG[h.typ] || "#555";
              const agenterStr = (h.agenter || []).slice(0, 3).join(", ");
              return (
                <div key={i} style={{ background: "#0a0a0a", border: `1px solid ${farg}22`, borderLeft: `2px solid ${farg}`, borderRadius: "6px", padding: "10px 12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>{ikon}</span>
                  <div>
                    <div style={{ fontSize: "10px", color: farg, fontFamily: "monospace", letterSpacing: "0.06em", marginBottom: "3px" }}>{h.typ?.toUpperCase().replace("_", " ")}</div>
                    <div style={{ fontSize: "11px", color: "#888", lineHeight: 1.5 }}>{h.rubrik}</div>
                    {agenterStr && <div style={{ fontSize: "9px", color: "#444", fontFamily: "monospace", marginTop: "4px" }}>{agenterStr}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </FullWidthSektion>
      )}
    </div>
  );
}

function FullWidthSektion({ titel, color, children }) {
  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ fontSize: "9px", color: color || "#555", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>
        {titel}
      </div>
      {children}
    </div>
  );
}

function TomPanel() {
  return (
    <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "24px", color: "#333", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.8 }}>
      <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.4 }}>🧠</div>
      <div>Klicka en <span style={{ color: "#555" }}>agent</span> för att se KI-insikter, minnen, ekonomi, territorium, market-prestation och strategitext.</div>
      <div style={{ marginTop: "10px" }}>Klicka en <span style={{ color: "#555" }}>kant</span> för att se relationstyp och narrativet bakom den.</div>
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

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "80vh", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: agent.farg + "22", border: `2px solid ${agent.farg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: agent.farg, fontFamily: "monospace", flexShrink: 0 }}>
          {agent.ikon}
        </div>
        <div>
          <a href={`/agent/${encodeURIComponent(agent.namn)}`} style={{ fontSize: "14px", color: C.text, fontFamily: "Georgia, serif", fontWeight: 600, textDecoration: "none" }}>{agent.namn}</a>
          <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
            {agent.kiCount} KI · {agent.minneCount} minnen · gen {agent.generation}
          </div>
        </div>
      </div>

      {/* Ekonomi */}
      {agent.saldo != null && (
        <div>
          <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>EKONOMI</div>
          <div style={{ display: "flex", gap: "14px", alignItems: "baseline", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "20px", fontWeight: 700, color: rankFarg, fontFamily: "monospace" }}>{agent.saldo} kr</span>
              {rank && (
                <span style={{ fontSize: "9px", color: rankFarg, fontFamily: "monospace", marginLeft: "6px", opacity: 0.8 }}>#{rank}/{total}</span>
              )}
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
        {agent.marketTotal === 0 ? (
          <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace" }}>Inga avgjorda bets ännu.</div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "8px", alignItems: "baseline" }}>
              <div>
                <span style={{ fontSize: "18px", fontWeight: 700, color: wrFarg, fontFamily: "monospace" }}>{wr}%</span>
                <span style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", marginLeft: "4px" }}>rätt</span>
              </div>
              <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
                {agent.marketWon}/{agent.marketTotal} bets · snittkonfidens {agent.marketAvgConf}%
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
        )}
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
