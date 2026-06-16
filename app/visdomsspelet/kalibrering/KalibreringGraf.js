"use client";
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const xTickStyle = { fill: "#444", fontSize: 9, fontFamily: "monospace" };
const yTickStyle = { fill: "#444", fontSize: 9, fontFamily: "monospace" };

function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>
      <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}% fel</div>
      ))}
    </div>
  );
}

export default function KalibreringGraf({ data }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ color: "#333", fontFamily: "monospace", fontSize: 11, textAlign: "center", padding: "20px 0" }}>
        Samlar data ännu — behöver minst 2 spel med kohortdata
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <XAxis dataKey="label" tick={xTickStyle} interval="preserveStartEnd" />
        <YAxis tick={yTickStyle} />
        <Tooltip content={<TT />} />
        <Line type="monotone" dataKey="kalibreringFel" stroke="#38bdf8" dot={{ r: 2 }} strokeWidth={2} name="Kalibreringskohort" />
        <Line type="monotone" dataKey="kontrollFel" stroke="#fb923c" dot={{ r: 2 }} strokeWidth={1.5} strokeDasharray="4 2" name="Kontrollkohort" />
        <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 9, fontFamily: "monospace", color: "#555", paddingTop: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
