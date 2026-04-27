"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const GREEN = "#4ade80";
const TEXT = "#666660";

function CustomTooltip({ active, payload, label, enhet }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#111",
      border: "1px solid #222",
      borderRadius: 6,
      padding: "8px 14px",
      fontSize: 13,
    }}>
      <p style={{ color: TEXT, marginBottom: 2 }}>{label}</p>
      <p style={{ color: GREEN, fontWeight: 600 }}>
        {payload[0].value} {enhet}
      </p>
    </div>
  );
}

function RangeSlider({ min, max, start, end, onStartChange, onEndChange }) {
  return (
    <div style={{ padding: "14px 4px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: TEXT, marginBottom: 6 }}>
        <span style={{ color: "#aaa" }}>{start}</span>
        <span style={{ fontSize: 10 }}>Dra för att zooma</span>
        <span style={{ color: "#aaa" }}>{end}</span>
      </div>
      <div style={{ marginBottom: 6 }}>
        <input type="range" min={min} max={max} value={start}
          onChange={e => { const v = Number(e.target.value); if (v < end) onStartChange(v); }}
          style={{ display: "block", width: "100%", accentColor: GREEN }}
          aria-label="Startår" />
      </div>
      <div>
        <input type="range" min={min} max={max} value={end}
          onChange={e => { const v = Number(e.target.value); if (v > start) onEndChange(v); }}
          style={{ display: "block", width: "100%", accentColor: GREEN }}
          aria-label="Slutår" />
      </div>
      <style>{`
        input[type=range] { -webkit-appearance: none; width: 100%; height: 3px; border-radius: 2px; background: #222; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${GREEN}; border: 2px solid #0a0a0a; cursor: pointer; }
      `}</style>
    </div>
  );
}

export default function Chart({ typ, data, enhet }) {
  const allData = (data || []).map(d => ({ name: d.period, varde: d.varde }));
  const minIdx = 0;
  const maxIdx = Math.max(0, allData.length - 1);
  const [startIdx, setStartIdx] = useState(minIdx);
  const [endIdx, setEndIdx] = useState(maxIdx);
  const chartData = allData.slice(startIdx, endIdx + 1);

  const commonProps = {
    data: chartData,
    margin: { top: 8, right: 8, left: -12, bottom: 0 },
  };
  const axisStyle = { fill: TEXT, fontSize: 11 };
  const tooltip = <Tooltip content={<CustomTooltip enhet={enhet} />} cursor={{ stroke: "#333" }} />;

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        {typ === "bar" ? (
          <BarChart {...commonProps}>
            <XAxis dataKey="name" tick={axisStyle} axisLine={{ stroke: "#222" }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            {tooltip}
            <Bar dataKey="varde" fill={GREEN} radius={[3, 3, 0, 0]} maxBarSize={40} opacity={0.85} />
          </BarChart>
        ) : (
          <LineChart {...commonProps}>
            <XAxis dataKey="name" tick={axisStyle} axisLine={{ stroke: "#222" }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            {tooltip}
            <Line
              type="monotone"
              dataKey="varde"
              stroke={GREEN}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: GREEN, strokeWidth: 0 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      {allData.length > 3 && (
        <RangeSlider
          min={minIdx}
          max={maxIdx}
          start={startIdx}
          end={endIdx}
          onStartChange={setStartIdx}
          onEndChange={setEndIdx}
        />
      )}
    </div>
  );
}

