"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DARK = "#18181b";
const GRID = "#27272a";
const TEXT = "#a1a1aa";
const ACCENT = "#6366f1";

function CustomTooltip({ active, payload, label, enhet }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1c1c1f",
      border: "1px solid #3f3f46",
      borderRadius: 8,
      padding: "8px 14px",
      fontSize: 13,
    }}>
      <p style={{ color: TEXT, marginBottom: 2 }}>{label}</p>
      <p style={{ color: "#fff", fontWeight: 600 }}>
        {payload[0].value} {enhet}
      </p>
    </div>
  );
}

export default function Chart({ typ, data, enhet }) {
  const chartData = (data || []).map((d) => ({
    name: d.period,
    varde: d.varde,
  }));

  const commonProps = {
    data: chartData,
    margin: { top: 4, right: 8, left: -8, bottom: 0 },
  };

  const axisStyle = { fill: TEXT, fontSize: 11 };
  const tooltip = <Tooltip content={<CustomTooltip enhet={enhet} />} />;
  const grid = <CartesianGrid stroke={GRID} strokeDasharray="3 3" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      {typ === "bar" ? (
        <BarChart {...commonProps}>
          {grid}
          <XAxis dataKey="name" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          {tooltip}
          <Bar dataKey="varde" fill={ACCENT} radius={[3, 3, 0, 0]} maxBarSize={40} />
        </BarChart>
      ) : (
        <LineChart {...commonProps}>
          {grid}
          <XAxis dataKey="name" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          {tooltip}
          <Line
            type="monotone"
            dataKey="varde"
            stroke={ACCENT}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: ACCENT }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
