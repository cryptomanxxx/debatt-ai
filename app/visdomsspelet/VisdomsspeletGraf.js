"use client";
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

const C = {
  card: "#0f0f0f",
  border: "#1a1a1a",
  text: "#e8e8e8",
  dim: "#666",
  green: "#4ade80",
  red: "#f87171",
  orange: "#fb923c",
  purple: "#e879f9",
  accent: "#e8d5a3",
};

const xTickStyle = { fill: "#444", fontSize: 9, fontFamily: "monospace" };
const yTickStyle = { fill: "#444", fontSize: 9, fontFamily: "monospace" };

function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 11, maxWidth: 240 }}>
      <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}{p.dataKey === "crowdVinner" ? "" : "%"}
        </div>
      ))}
    </div>
  );
}

export default function VisdomsspeletGraf({ data }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ color: "#333", fontFamily: "monospace", fontSize: 11, textAlign: "center", padding: "32px 0" }}>
        Behöver minst 2 spel för en tidsseriegraf — samlas in löpande
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 20px 16px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#e0e0e0", fontWeight: 600, marginBottom: 2 }}>
          Felmarginal och diversitet över tid
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", marginBottom: 16 }}>
          Kollektivt fel, genomsnittligt individuellt fel och diversitet — per spel, kronologiskt
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <XAxis dataKey="label" tick={xTickStyle} interval="preserveStartEnd" />
            <YAxis tick={yTickStyle} />
            <Tooltip content={<TT />} />
            <Line type="monotone" dataKey="kollektivtFel"     stroke={C.accent} dot={{ r: 2 }} strokeWidth={2}   name="Kollektivt fel" />
            <Line type="monotone" dataKey="individuelltFel"   stroke={C.orange} dot={{ r: 2 }} strokeWidth={1.5} name="Snitt individuellt fel" />
            <Line type="monotone" dataKey="diversitet"        stroke={C.purple} dot={{ r: 2 }} strokeWidth={1.5} name="Diversitet" strokeDasharray="4 2" />
            <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#555", paddingTop: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 20px 16px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#e0e0e0", fontWeight: 600, marginBottom: 2 }}>
          Vinner crowd:en eller bästa individ?
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", marginBottom: 16 }}>
          100 = kollektivet slog bästa enskilda agent · 0 = bästa individ vann
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <XAxis dataKey="label" tick={xTickStyle} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} ticks={[0, 100]} tick={yTickStyle} />
            <ReferenceLine y={50} stroke="#222" />
            <Tooltip content={<TT />} />
            <Line type="stepAfter" dataKey="crowdVinner" stroke={C.green} dot={{ r: 3 }} strokeWidth={1.5} name="Crowd vinner" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
