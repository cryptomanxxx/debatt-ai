"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>
      <div style={{ color: "#888", marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value >= 0 ? "+" : ""}{p.value.toFixed(1)}%
        </div>
      ))}
    </div>
  );
}

export default function EquityCurve({ data, farg, label }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ color: "#444", fontFamily: "monospace", fontSize: 11, padding: "12px 0" }}>
        Otillräcklig historik för equity curve ännu.
      </div>
    );
  }

  const harBtc = data.some((d) => d.btc != null);
  const harSpy = data.some((d) => d.spy != null);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <XAxis dataKey="datum" tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }} interval="preserveStartEnd" />
        <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }} />
        <Tooltip content={<TT />} />
        <ReferenceLine y={0} stroke="#94a3b855" strokeDasharray="3 3" label={{ value: "Kontanter", position: "insideTopRight", fill: "#94a3b8", fontSize: 9 }} />
        <Line type="monotone" dataKey="fond" stroke={farg} dot={false} strokeWidth={2} name={label} />
        {harBtc && <Line type="monotone" dataKey="btc" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="BTC buy & hold" />}
        {harSpy && <Line type="monotone" dataKey="spy" stroke="#4ade80" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="SPY buy & hold" />}
        <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#666", paddingTop: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
