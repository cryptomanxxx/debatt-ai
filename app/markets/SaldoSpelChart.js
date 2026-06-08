"use client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { AGENT_VISUELL } from "../agentData";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const visible = payload.filter(p => p.strokeWidth > 1).sort((a, b) => b.value - a.value);
  return (
    <div style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "10px 14px", fontSize: "11px", fontFamily: "monospace" }}>
      <p style={{ color: "#666", margin: "0 0 8px" }}>{label}</p>
      {visible.map(p => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "3px" }}>
          <span style={{ color: p.stroke }}>{p.name}</span>
          <span style={{ color: "#e8e8e8" }}>{p.value} kr</span>
        </div>
      ))}
    </div>
  );
}

export default function SaldoSpelChart({ series, highlighted, spelarKonton = [] }) {
  const saldonMap = Object.fromEntries(spelarKonton.map(k => [k.agent, k.saldo_spel]));
  if (!series || series.length < 2) {
    return (
      <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "32px", textAlign: "center" }}>
        <p style={{ color: "#444", fontSize: "13px", fontFamily: "monospace", margin: 0 }}>
          Väntar på att prediction markets ska avgöras —<br />
          grafen fylls automatiskt när bets regleras
        </p>
      </div>
    );
  }

  const allAgents = Object.keys(series[0]).filter(k => k !== "date");

  return (
    <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px 16px 12px" }}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#1e1e1e" }}
          />
          <YAxis
            tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v} kr`}
            domain={["auto", "auto"]}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          {allAgents.map(agent => {
            const isHighlighted = highlighted.includes(agent);
            const av = AGENT_VISUELL[agent];
            return (
              <Line
                key={agent}
                type="monotone"
                dataKey={agent}
                stroke={isHighlighted ? (av?.ikonFarg || "#888") : "#1e1e1e"}
                strokeWidth={isHighlighted ? 2 : 0.5}
                dot={false}
                activeDot={isHighlighted ? { r: 4, strokeWidth: 0 } : false}
                opacity={isHighlighted ? 1 : 0.4}
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #1a1a1a" }}>
        {highlighted.map(agent => {
          const av = AGENT_VISUELL[agent];
          const bal = saldonMap[agent] ?? 200;
          const farg = bal >= 1100 ? "#4ade80" : bal >= 800 ? "#facc15" : "#f87171";
          return (
            <div key={agent} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "20px", height: "2px", background: av?.ikonFarg || "#888", borderRadius: "1px" }} />
              <span style={{ fontSize: "10px", color: "#888", fontFamily: "monospace" }}>{agent}</span>
              <span style={{ fontSize: "10px", fontFamily: "monospace", color: farg, fontWeight: 700 }}>
                {bal} kr
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
