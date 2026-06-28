"use client";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f0f0f", border: "1px solid #222", borderRadius: "6px", padding: "10px 14px", fontSize: "11px" }}>
      <div style={{ color: "#666", marginBottom: "6px" }}>Gini: {(+label).toFixed(2)}</div>
      {payload.map(p => p.value != null && (
        <div key={p.name} style={{ color: p.color, marginBottom: "2px" }}>
          {p.name}: {Math.round(p.value)}{p.unit}
        </div>
      ))}
    </div>
  );
};

export default function GiniSpelGraf({ chartData, aktuelltGini }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData} margin={{ top: 12, right: 20, bottom: 28, left: 0 }}>
        <CartesianGrid stroke="#151515" strokeDasharray="3 3" />
        <XAxis
          dataKey="gini"
          type="number"
          domain={[0.05, 0.70]}
          tickFormatter={v => (+v).toFixed(1)}
          tick={{ fill: "#555", fontSize: 10 }}
          label={{ value: "Gini-koefficient", position: "insideBottom", offset: -14, fill: "#444", fontSize: 10 }}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={v => `${v}%`}
          domain={[0, 45]}
          tick={{ fill: "#555", fontSize: 10 }}
          width={36}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={v => `${v} kr`}
          domain={[15, 35]}
          tick={{ fill: "#555", fontSize: 10 }}
          width={46}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          yAxisId="left"
          dataKey="ultimatum"
          type="monotone"
          stroke="#e879f9"
          strokeWidth={2.5}
          dot={false}
          name="Ultimatum: förväntad avvisning"
          unit="%"
        />
        <Line
          yAxisId="right"
          dataKey="diktatorn"
          type="monotone"
          stroke="#facc15"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          name="Diktatorn: förväntad gåva"
          unit=" kr"
        />
        {aktuelltGini > 0 && (
          <ReferenceLine
            yAxisId="left"
            x={aktuelltGini}
            stroke="#4ade80"
            strokeDasharray="4 3"
            strokeOpacity={0.8}
            label={{ value: `Nu: ${aktuelltGini.toFixed(2)}`, position: "insideTopRight", fill: "#4ade80", fontSize: 9 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
