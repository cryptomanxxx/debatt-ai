"use client";

import { useState, useId } from "react";
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

function RangeSlider({ min, max, start, end, onStartChange, onEndChange, id }) {
  return (
    <div style={{ padding: "16px 4px 4px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        color: TEXT,
        marginBottom: 6,
      }}>
        <span style={{ color: "#fff", fontWeight: 600 }}>{start}</span>
        <span style={{ color: "#52525b", fontSize: 10 }}>Dra för att zooma</span>
        <span style={{ color: "#fff", fontWeight: 600 }}>{end}</span>
      </div>

      {/* Start slider */}
      <div style={{ position: "relative", marginBottom: 6 }}>
        <input
          type="range"
          min={min}
          max={max}
          value={start}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v < end) onStartChange(v);
          }}
          style={sliderStyle(ACCENT)}
          aria-label="Startår"
        />
      </div>

      {/* End slider */}
      <div style={{ position: "relative" }}>
        <input
          type="range"
          min={min}
          max={max}
          value={end}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > start) onEndChange(v);
          }}
          style={sliderStyle("#a78bfa")}
          aria-label="Slutår"
        />
      </div>

      <style>{`
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: #3f3f46;
          outline: none;
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #09090b;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function sliderStyle(color) {
  return {
    display: "block",
    width: "100%",
    accentColor: color,
  };
}

export default function Chart({ typ, data, enhet }) {
  const allData = (data || []).map((d) => ({
    name: d.period,
    varde: d.varde,
  }));

  // Extract numeric year/period values for the slider
  const allPeriods = allData.map((d) => d.name);
  const minIdx = 0;
  const maxIdx = Math.max(0, allPeriods.length - 1);

  const [startIdx, setStartIdx] = useState(minIdx);
  const [endIdx, setEndIdx] = useState(maxIdx);

  const chartData = allData.slice(startIdx, endIdx + 1);

  const commonProps = {
    data: chartData,
    margin: { top: 4, right: 8, left: -8, bottom: 0 },
  };

  const axisStyle = { fill: TEXT, fontSize: 11 };
  const tooltip = <Tooltip content={<CustomTooltip enhet={enhet} />} />;
  const grid = <CartesianGrid stroke={GRID} strokeDasharray="3 3" />;

  const showSlider = allData.length > 3;

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
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
              dot={chartData.length <= 15}
              activeDot={{ r: 5, fill: ACCENT }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      {showSlider && (
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
