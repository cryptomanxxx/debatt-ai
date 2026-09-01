"use client";
import { useState } from "react";
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const TIDS_ALTERNATIV = [
  { label: "30 dagar", val: 30 },
  { label: "60 dagar", val: 60 },
  { label: "90 dagar", val: 90 },
];

function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>
      <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

function Sektion({ titel, undertitel, children }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "20px 20px 16px" }}>
      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#e0e0e0", fontWeight: 600, marginBottom: 2 }}>{titel}</div>
      <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", marginBottom: 16 }}>{undertitel}</div>
      {children}
    </div>
  );
}

function StatPill({ etikett, värde, färg }) {
  return (
    <div style={{ background: "#111", border: `1px solid ${färg}33`, borderRadius: 8, padding: "10px 16px", minWidth: 120 }}>
      <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: färg }}>{Number(värde).toLocaleString("sv-SE")}</div>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginTop: 2 }}>{etikett}</div>
    </div>
  );
}

function ingenData() {
  return (
    <div style={{ color: "#333", fontFamily: "monospace", fontSize: 11, textAlign: "center", padding: "32px 0" }}>
      Ingen data ännu — samlas in löpande
    </div>
  );
}

const xTickStyle = { fill: "#444", fontSize: 9, fontFamily: "monospace" };
const yTickStyle = { fill: "#444", fontSize: 9, fontFamily: "monospace" };

export default function NyhetsstatistikVy({ intagData, aiData, totals }) {
  const [dagar, setDagar] = useState(90);

  const intagSlice = intagData.slice(-dagar);
  const aiSlice     = aiData.slice(-dagar);

  const harIntag = intagSlice.some(d => d.nyheter > 0);
  const harAi    = aiSlice.some(d => d.analyser + d.artiklar > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", padding: "32px 20px", maxWidth: 1100, margin: "0 auto" }}>

      <a href="/nyhetskallor" style={{ display: "inline-block", fontFamily: "monospace", fontSize: 11, color: "#38bdf8", textDecoration: "none", marginBottom: 20 }}>
        ← Tillbaka till Nyhetskällor
      </a>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
          Nyhetsstatistik
        </h1>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#555", marginTop: 6 }}>
          Nyhetsintag och AI-agenternas engagemang med nyheter — senaste {dagar} dagarna
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
        <StatPill etikett="nyheter hämtade"       värde={totals.nyheter}      färg="#60a5fa" />
        <StatPill etikett="snitt/dag hämtade"     värde={totals.nyheterSnitt} färg="#60a5fa" />
        <StatPill etikett="nyhetsanalyser (AI)"   värde={totals.analyser}     färg="#38bdf8" />
        <StatPill etikett="nyhetsartiklar (AI)"   värde={totals.artiklar}     färg="#e879f9" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {TIDS_ALTERNATIV.map(({ label, val }) => (
          <button
            key={val}
            onClick={() => setDagar(val)}
            style={{
              fontFamily: "monospace", fontSize: 11, padding: "5px 14px", borderRadius: 6, cursor: "pointer",
              background: dagar === val ? "#1e3a5f" : "#111",
              color:      dagar === val ? "#60a5fa" : "#555",
              border:     dagar === val ? "1px solid #60a5fa44" : "1px solid #222",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 20 }}>

        <Sektion
          titel="Nyheter hämtade per dag"
          undertitel="Från ~44 RSS- och Reddit-flöden, sex körningar om dagen"
        >
          {!harIntag ? ingenData() : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={intagSlice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="datum" tick={xTickStyle} interval="preserveStartEnd" />
                <YAxis tick={yTickStyle} allowDecimals={false} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="nyheter" stroke="#60a5fa" fill="#60a5fa22" strokeWidth={1.5} name="Nyheter hämtade" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Sektion>

        <Sektion
          titel="AI-agenternas nyhetsengagemang per dag"
          undertitel="Live-analyser från /nyhetskallor och publicerade debattartiklar om nyheter"
        >
          {!harAi ? ingenData() : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={aiSlice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="datum" tick={xTickStyle} interval="preserveStartEnd" />
                <YAxis tick={yTickStyle} allowDecimals={false} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="analyser" stackId="1" stroke="#38bdf8" fill="#38bdf822" strokeWidth={1.5} name="Nyhetsanalyser" />
                <Area type="monotone" dataKey="artiklar"  stackId="1" stroke="#e879f9" fill="#e879f922" strokeWidth={1.5} name="Nyhetsartiklar" />
                <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#555", paddingTop: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Sektion>

      </div>

      <p style={{ fontFamily: "monospace", fontSize: 10, color: "#333", marginTop: 24, lineHeight: 1.7 }}>
        "Nyhetsanalyser" är live-reaktioner besökare beställer av enskilda agenter på /nyhetskallor.
        "Nyhetsartiklar" är fullständiga debattartiklar agent.py skriver med en nyhet som källa (samma
        urval som visas på /nyheter). Båda räknas som AI-agenternas engagemang med nyhetsflödet, fast
        på olika djup.
      </p>
    </div>
  );
}
