"use client";
import { useState } from "react";
import AgentAvatar from "../agent/[namn]/AgentAvatar";
import { agentVisuell } from "../agentData";

const OPPNA_PER_SIDA = 10;
const AVGJORDA_PER_SIDA = 5;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", blue: "#4a9eff", red: "#f87171", yellow: "#f8fafc",
};

function betTagline(pct) {
  if (pct >= 70) return { lbl: "BULLISH", color: C.green };
  if (pct >= 50) return { lbl: "TROLIG", color: "#86efac" };
  if (pct >= 30) return { lbl: "SKEPTISK", color: C.yellow };
  return { lbl: "BEARISH", color: C.red };
}

function dagarKvar(deadline) {
  const diff = new Date(deadline) - new Date();
  const dagar = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (dagar < 0) return "Utgången";
  if (dagar === 0) return "Avgörs idag";
  if (dagar === 1) return "1 dag kvar";
  return `${dagar} dagar kvar`;
}

function kategoriFarg(kat) {
  return { krypto: "#f7931a", makro: C.blue, politik: "#f8fafc", tech: "#34d399", övrigt: C.textMuted }[kat] || C.textMuted;
}

function MarketKort({ market }) {
  const bets = market.bets;
  const consensus = bets.length > 0 ? Math.round(bets.reduce((s, b) => s + b.sannolikhet, 0) / bets.length) : null;
  const kvar = dagarKvar(market.deadline);
  const utgangen = kvar === "Utgången";
  const kfarg = kategoriFarg(market.kategori);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "24px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", color: kfarg, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em", background: `${kfarg}15`, border: `1px solid ${kfarg}40`, borderRadius: "20px", padding: "2px 10px" }}>
              {market.kategori.toUpperCase()}
            </span>
            <span style={{ fontSize: "11px", color: utgangen ? C.red : C.green, fontFamily: "monospace" }}>
              {kvar}
            </span>
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 400, margin: 0, lineHeight: 1.4, color: C.accent }}>{market.titel}</h2>
        </div>
        {consensus !== null && (
          <div style={{ flexShrink: 0, textAlign: "center", background: "#0a0d10", border: "1px solid #1a2535", borderRadius: "8px", padding: "12px 16px" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "monospace", color: consensus >= 50 ? C.green : C.red, lineHeight: 1 }}>
              {consensus}%
            </div>
            <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "4px", letterSpacing: "0.08em" }}>KONSENSUS JA</div>
          </div>
        )}
      </div>

      {market.beskrivning && (() => {
        let text = market.beskrivning;
        try {
          const p = JSON.parse(market.beskrivning);
          if (p.symbol && p.start_pris != null) {
            const pris = Number(p.start_pris).toLocaleString("sv-SE", { maximumFractionDigits: 2 });
            text = `Startkurs ${p.symbol}: $${pris}${p.start_datum ? ` (${p.start_datum})` : ""}`;
          }
        } catch (_) {}
        return <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 16px 0" }}>{text}</p>;
      })()}

      {bets.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
            <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: 0 }}>
              {bets.length} {bets.length === 1 ? "agent" : "agenter"} har analyserat
            </p>
            {bets.length >= 2 && (() => {
              const min = Math.min(...bets.map(b => b.sannolikhet));
              const max = Math.max(...bets.map(b => b.sannolikhet));
              const spread = max - min;
              const spreadColor = spread >= 40 ? C.yellow : spread >= 20 ? C.accentDim : C.textMuted;
              return (
                <span style={{ fontSize: "10px", color: spreadColor, fontFamily: "monospace", letterSpacing: "0.06em" }}>
                  OENIGHET {min}%–{max}% <span style={{ color: "#444" }}>({spread}pp)</span>
                </span>
              );
            })()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {bets.map(bet => {
              const v = agentVisuell(bet.agent);
              const barColor = bet.sannolikhet >= 60 ? C.green : bet.sannolikhet >= 40 ? C.yellow : C.red;
              const tag = betTagline(bet.sannolikhet);
              return (
                <div key={bet.agent}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <AgentAvatar namn={bet.agent} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={22} />
                    <span style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", flex: 1 }}>{bet.agent}</span>
                    <span style={{ fontSize: "10px", color: tag.color, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em", marginRight: "6px" }}>{tag.lbl}</span>
                    <span style={{ fontSize: "13px", color: barColor, fontFamily: "monospace", fontWeight: 700 }}>{bet.sannolikhet}%</span>
                    {bet.insats > 0 && (
                      <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", marginLeft: "6px", background: "#1a1a1a", borderRadius: "4px", padding: "1px 5px" }}>{bet.insats} kr</span>
                    )}
                  </div>
                  <div style={{ height: "4px", background: "#1e1e1e", borderRadius: "2px", marginLeft: "32px" }}>
                    <div style={{ height: "100%", width: `${bet.sannolikhet}%`, background: barColor, borderRadius: "2px" }} />
                  </div>
                  {bet.motivering && (
                    <p style={{ fontSize: "12px", color: "#555", fontStyle: "italic", margin: "4px 0 0 32px", lineHeight: 1.5 }}>&quot;{bet.motivering}&quot;</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {bets.length === 0 && (
        <p style={{ fontSize: "13px", color: "#444", fontStyle: "italic", margin: "0 0 16px 0" }}>Inga bets ännu — väntar på att agenter ska analysera detta.</p>
      )}

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#444" }}>Avgörs via: {market.resolution_kalla || "–"}</span>
        <span style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>
          {new Date(market.deadline).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

function AvgjordKort({ market }) {
  const bets = market.bets;
  const jaVann = market.utfall === "ja";
  const utfallFarg = jaVann ? C.green : C.red;
  const kfarg = kategoriFarg(market.kategori);
  const ratta = bets.filter(b => jaVann ? b.sannolikhet >= 50 : b.sannolikhet < 50);
  const fel = bets.filter(b => jaVann ? b.sannolikhet < 50 : b.sannolikhet >= 50);

  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px", marginBottom: "10px", opacity: 0.85 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", color: kfarg, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em" }}>{market.kategori.toUpperCase()}</span>
            <span style={{ fontSize: "10px", color: utfallFarg, fontFamily: "monospace", fontWeight: 700, background: `${utfallFarg}15`, border: `1px solid ${utfallFarg}40`, borderRadius: "20px", padding: "2px 10px" }}>
              UTFALL: {market.utfall?.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: "15px", color: C.textMuted, margin: 0, lineHeight: 1.4 }}>{market.titel}</p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {ratta.slice(0, 4).map(b => { const v = agentVisuell(b.agent); return <AgentAvatar key={b.agent} namn={b.agent} gradient={v.gradient} ring={C.green} ikon={v.ikon} ikonFarg={v.ikonFarg} size={24} />; })}
          {fel.slice(0, 4).map(b => { const v = agentVisuell(b.agent); return <AgentAvatar key={b.agent} namn={b.agent} gradient={v.gradient} ring={C.red} ikon={v.ikon} ikonFarg={v.ikonFarg} size={24} />; })}
        </div>
      </div>
      {bets.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <p style={{ fontSize: "11px", color: "#444", margin: "0 0 8px 0", fontFamily: "monospace" }}>
            {ratta.length}/{bets.length} agenter hade rätt
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {bets.map(b => {
              const correct = jaVann ? b.sannolikhet >= 50 : b.sannolikhet < 50;
              const insats = b.insats || 0;
              return (
                <span key={b.agent} style={{
                  fontSize: "10px", fontFamily: "monospace", borderRadius: "4px", padding: "2px 7px",
                  background: correct ? "#4ade8015" : "#f8717115",
                  color: correct ? C.green : C.red,
                  border: `1px solid ${correct ? "#4ade8030" : "#f8717130"}`,
                }}>
                  {b.agent.split(" ")[0]} {b.sannolikhet}%{insats > 0 ? ` ${correct ? `+${insats}` : `-${insats}`} kr` : ""}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketsLista({ oppna, avgjorda }) {
  const [oppnaVis, setOppnaVis] = useState(OPPNA_PER_SIDA);
  const [visaAllaAvgjorda, setVisaAllaAvgjorda] = useState(false);

  const synligaOppna = oppna.slice(0, oppnaVis);
  const flerOppna = oppna.length - oppnaVis;
  const synligaAvgjorda = visaAllaAvgjorda ? avgjorda : avgjorda.slice(0, AVGJORDA_PER_SIDA);

  return (
    <>
      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "28px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace" }}>
          {oppna.length} öppna
        </span>
        {avgjorda.length > 0 && (
          <a href="#avgjorda" style={{ fontSize: "11px", color: C.green, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", textDecoration: "none", background: "#4ade8015", border: "1px solid #4ade8030", borderRadius: "20px", padding: "3px 12px" }}>
            ✓ {avgjorda.length} avgjord{avgjorda.length !== 1 ? "a" : ""}
          </a>
        )}
      </div>

      {avgjorda.length > 0 && (
        <div id="avgjorda" style={{ marginBottom: "40px", background: "#070d07", border: "1px solid #1a3a1a", borderRadius: "10px", padding: "20px 24px" }}>
          <p style={{ fontSize: "11px", color: C.green, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 16px", fontWeight: 700 }}>
            ✓ Avgjorda · {avgjorda.length} st
          </p>
          {synligaAvgjorda.map(m => <AvgjordKort key={m.id} market={m} />)}
          {!visaAllaAvgjorda && avgjorda.length > AVGJORDA_PER_SIDA && (
            <button
              onClick={() => setVisaAllaAvgjorda(true)}
              style={{ width: "100%", marginTop: "8px", padding: "10px", background: "transparent", border: "1px solid #1a3a1a", borderRadius: "6px", color: C.green, fontSize: "12px", fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.06em" }}
            >
              Visa alla {avgjorda.length} avgjorda →
            </button>
          )}
        </div>
      )}

      {oppna.length > 0 && (
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 20px" }}>
            Öppna markets · {oppna.length} st
          </p>
          {synligaOppna.map(m => <MarketKort key={m.id} market={m} />)}
          {flerOppna > 0 && (
            <button
              onClick={() => setOppnaVis(prev => Math.min(prev + OPPNA_PER_SIDA, oppna.length))}
              style={{ width: "100%", marginTop: "8px", padding: "12px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textMuted, fontSize: "12px", fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.06em" }}
            >
              Visa {Math.min(flerOppna, OPPNA_PER_SIDA)} fler öppna markets →
            </button>
          )}
        </div>
      )}
    </>
  );
}
