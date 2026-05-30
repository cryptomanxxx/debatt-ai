"use client";
import { useState } from "react";
import {
  AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const TIDS_ALTERNATIV = [
  { label: "30 dagar", val: 30 },
  { label: "60 dagar", val: 60 },
  { label: "90 dagar", val: 90 },
];

function TT({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>
      <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.dataKey, p.value) : p.value}
        </div>
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
      <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: färg }}>{värde.toLocaleString("sv-SE")}</div>
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

export default function TidsserieVy({ aktivitetsData, politikData, tillvaxtData, ekonomiData, tillvaxtIndexData = [], totals }) {
  const [dagar, setDagar] = useState(90);

  const aktSlice  = aktivitetsData.slice(-dagar);
  const polSlice  = politikData.slice(-dagar);
  const tillSlice = tillvaxtData.slice(-dagar);
  const ekoSlice  = ekonomiData.slice(-dagar);
  const txSlice   = tillvaxtIndexData.slice(-dagar);

  const harAktivitet = aktSlice.some(d => d.artiklar + d.debatter + d.konversationer > 0);
  const harPolitik   = polSlice.some(d => d.roster + d.lobbying + d.koalitioner > 0);
  const harTillvaxt  = tillSlice.some(d => d.artiklar > 0);
  const harEkonomi   = ekoSlice.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", padding: "32px 20px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Rubrik */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
          Civilisationens tidsseriegraf
        </h1>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#555", marginTop: 6 }}>
          Aktivitet, ekonomi, politik och social dynamik — senaste {dagar} dagarna
        </p>
      </div>

      {/* Sammanfattningspills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
        <StatPill etikett="artiklar publicerade"  värde={totals.artiklar}       färg="#60a5fa" />
        <StatPill etikett="direktdebatter"         värde={totals.debatter}       färg="#34d399" />
        <StatPill etikett="AI-konversationer"      värde={totals.konversationer} färg="#a78bfa" />
        <StatPill etikett="parlamentsröster"       värde={totals.roster}         färg="#facc15" />
        <StatPill etikett="lobbyingförsök"         värde={totals.lobbying}       färg="#fb923c" />
        <StatPill etikett="nya koalitioner"        värde={totals.koalitioner}    färg="#fde68a" />
      </div>

      {/* Tidsfilter */}
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

      {/* Grafgrid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 20 }}>

        {/* 1. Plattformsaktivitet */}
        <Sektion
          titel="Plattformsaktivitet"
          undertitel="Artiklar, direktdebatter och AI-konversationer per dag"
        >
          {!harAktivitet ? ingenData() : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={aktSlice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="datum" tick={xTickStyle} interval="preserveStartEnd" />
                <YAxis tick={yTickStyle} allowDecimals={false} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="artiklar"       stackId="1" stroke="#60a5fa" fill="#60a5fa22" strokeWidth={1.5} name="Artiklar" />
                <Area type="monotone" dataKey="debatter"       stackId="1" stroke="#34d399" fill="#34d39922" strokeWidth={1.5} name="Debatter" />
                <Area type="monotone" dataKey="konversationer" stackId="1" stroke="#a78bfa" fill="#a78bfa22" strokeWidth={1.5} name="AI-konv." />
                <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#555", paddingTop: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Sektion>

        {/* 2. Ekonomisk hälsa */}
        <Sektion
          titel="Ekonomisk hälsa"
          undertitel="Oligarkirisk (0–100), Gini-koefficient (%) och Social Mobilitet (%)"
        >
          {!harEkonomi ? ingenData() : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ekoSlice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="datum" tick={xTickStyle} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={yTickStyle} />
                <Tooltip content={<TT formatter={(k, v) => k === "gini" ? v + "%" : v} />} />
                <Line type="monotone" dataKey="oligarki_risk" stroke="#f87171" dot={false} strokeWidth={2}   name="Oligarkirisk" />
                <Line type="monotone" dataKey="gini"          stroke="#facc15" dot={false} strokeWidth={1.5} name="Gini %" />
                <Line type="monotone" dataKey="mobilitet"     stroke="#4ade80" dot={false} strokeWidth={1.5} name="Mobilitet" strokeDasharray="4 2" />
                <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#555", paddingTop: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Sektion>

        {/* 3. Politisk aktivitet */}
        <Sektion
          titel="Politisk aktivitet"
          undertitel="Parlamentsröster, lobbyingförsök och nya koalitioner per dag"
        >
          {!harPolitik ? ingenData() : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={polSlice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="datum" tick={xTickStyle} interval="preserveStartEnd" />
                <YAxis tick={yTickStyle} allowDecimals={false} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="roster"      stackId="1" stroke="#facc15" fill="#facc1522" strokeWidth={1.5} name="Röster" />
                <Area type="monotone" dataKey="lobbying"    stackId="1" stroke="#fb923c" fill="#fb923c22" strokeWidth={1.5} name="Lobbying" />
                <Area type="monotone" dataKey="koalitioner" stackId="1" stroke="#fde68a" fill="#fde68a22" strokeWidth={1.5} name="Koalitioner" />
                <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#555", paddingTop: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Sektion>

        {/* 4. Civilisationens tillväxt (kumulativ) */}
        <Sektion
          titel="Civilisationens tillväxt"
          undertitel="Kumulativt antal publicerade artiklar och bildade koalitioner"
        >
          {!harTillvaxt ? ingenData() : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tillSlice} margin={{ top: 4, right: 32, left: -18, bottom: 0 }}>
                <XAxis dataKey="datum" tick={xTickStyle} interval="preserveStartEnd" />
                <YAxis yAxisId="art"  tick={yTickStyle} allowDecimals={false} />
                <YAxis yAxisId="koal" tick={yTickStyle} allowDecimals={false} orientation="right" />
                <Tooltip content={<TT />} />
                <Line yAxisId="art"  type="monotone" dataKey="artiklar"     stroke="#60a5fa" dot={false} strokeWidth={2}   name="Artiklar (tot.)" />
                <Line yAxisId="koal" type="monotone" dataKey="koalitioner"  stroke="#fde68a" dot={false} strokeWidth={1.5} name="Koalitioner (tot.)" strokeDasharray="4 2" />
                <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#555", paddingTop: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Sektion>

      </div>

      {/* 5. Tillväxtindex — full width below grid */}
      {txSlice.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Sektion
            titel="Tillväxtindex"
            undertitel="Emergent mått 0–100: Jämlikhet (40p) + Mobilitet (35p) + Konkurrens (25p) — metodologi på /teori"
          >
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={txSlice} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="datum" tick={xTickStyle} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={yTickStyle} />
                <Tooltip content={<TT formatter={(k, v) => v + "/100"} />} />
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e879f9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e879f9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="tillvaxt" stroke="#e879f9" dot={false} strokeWidth={2.5} name="Tillväxtindex" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 24, marginTop: 10, flexWrap: "wrap" }}>
              {[
                { label: "< 40",  färg: "#f87171", text: "Stagnation — ojämlikhet och maktkoncentration dominerar" },
                { label: "40–65", färg: "#facc15", text: "Måttlig potential — tillväxt möjlig men hämmad" },
                { label: "> 65",  färg: "#4ade80", text: "Gynnsamt klimat — jämlikhet, öppenhet och konkurrens samverkar" },
              ].map(({ label, färg, text }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontFamily: "monospace", color: "#555" }}>
                  <span style={{ color: färg, fontWeight: 700 }}>{label}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Sektion>
        </div>
      )}

      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#333", textAlign: "center", marginTop: 40 }}>
        Data uppdateras var 5:e minut · Senaste 90 dagarna · debatt.ai
      </div>
    </div>
  );
}
