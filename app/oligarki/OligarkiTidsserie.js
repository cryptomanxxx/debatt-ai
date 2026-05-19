"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

const RISK_COLORS = {
  oligarki_risk: "#f87171",
  gini:          "#facc15",
  mobilitet:     "#4ade80",
};

function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>
      <div style={{ color: "#888", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey === "gini" ? (p.value * 100).toFixed(1) + "%" : p.value + (p.dataKey === "mobilitet" ? "%" : "")}
        </div>
      ))}
    </div>
  );
}

export default function OligarkiTidsserie({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: "#444", fontFamily: "monospace", fontSize: 12, textAlign: "center", padding: "32px 0" }}>
        Ingen historik ännu — data samlas in dagligen.
      </div>
    );
  }

  const chartData = data.map(d => ({
    datum:        d.datum.slice(5),   // "MM-DD"
    oligarki_risk: d.oligarki_risk,
    gini:         d.gini,
    mobilitet:    d.mobilitet,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Risk & Mobilitet */}
      <div>
        <div style={{ color: "#666", fontFamily: "monospace", fontSize: 11, marginBottom: 8 }}>
          Oligarkirisk (0–100) och Social Mobilitet (%)
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="datum" tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }} />
            <Tooltip content={<TT />} />
            <ReferenceLine y={40} stroke="#facc1544" strokeDasharray="3 3" />
            <ReferenceLine y={60} stroke="#f8717144" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="oligarki_risk" stroke={RISK_COLORS.oligarki_risk} dot={false} strokeWidth={2} name="Oligarkirisk" />
            <Line type="monotone" dataKey="mobilitet"     stroke={RISK_COLORS.mobilitet}    dot={false} strokeWidth={1.5} name="Mobilitet" strokeDasharray="4 2" />
            <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#666", paddingTop: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gini */}
      <div>
        <div style={{ color: "#666", fontFamily: "monospace", fontSize: 11, marginBottom: 8 }}>
          Gini-koefficient (0 = perfekt jämlikhet, 1 = total koncentration)
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="datum" tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }} interval="preserveStartEnd" />
            <YAxis domain={[0, 1]} tickFormatter={v => (v * 100).toFixed(0) + "%"} tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }} />
            <Tooltip content={<TT />} />
            <Line type="monotone" dataKey="gini" stroke={RISK_COLORS.gini} dot={false} strokeWidth={2} name="Gini" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
