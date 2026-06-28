"use client";
import {
  ComposedChart, Bar, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

const TooltipAvvikelse = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "#0f0f0f", border: "1px solid #222", borderRadius: "6px", padding: "10px 14px", fontSize: "11px" }}>
      <div style={{ color: "#555", marginBottom: "6px" }}>Gini: {(+label).toFixed(2)}</div>
      <div style={{ color: "#e879f9", marginBottom: "2px" }}>Teori E[R(G)]: {d.teoretisk}%</div>
      {d.empirisk != null && (
        <div style={{ color: "#60a5fa", marginBottom: "2px" }}>
          Empirisk: {d.empirisk}%{" "}
          <span style={{ color: "#444" }}>({d.n} spel)</span>
        </div>
      )}
      {d.avvikelse != null && (
        <div style={{ color: d.avvikelse > 0 ? "#f87171" : "#4ade80" }}>
          Δ: {d.avvikelse > 0 ? "+" : ""}{d.avvikelse} pp
        </div>
      )}
    </div>
  );
};

export default function AvvikelseGraf({ data }) {
  const harData = data.some(d => d.empirisk != null);

  return (
    <div>
      {/* Övre panel: teorilinjen + empiriska punkter */}
      <ResponsiveContainer width="100%" height={190}>
        <ComposedChart data={data} margin={{ top: 12, right: 20, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#151515" strokeDasharray="3 3" />
          <XAxis
            dataKey="gini"
            type="number"
            domain={[0.05, 0.70]}
            tickFormatter={v => (+v).toFixed(1)}
            tick={{ fill: "#555", fontSize: 10 }}
          />
          <YAxis
            tickFormatter={v => `${v}%`}
            domain={[0, 50]}
            tick={{ fill: "#555", fontSize: 10 }}
            width={36}
          />
          <Tooltip content={<TooltipAvvikelse />} />
          <Line
            dataKey="teoretisk"
            type="monotone"
            stroke="#e879f9"
            strokeWidth={2}
            dot={false}
            name="Teori E[R(G)]"
          />
          <Line
            dataKey="empirisk"
            type="monotone"
            stroke="#60a5fa"
            strokeWidth={0}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.empirisk == null) return null;
              return (
                <circle
                  key={`edot-${payload.gini}`}
                  cx={cx} cy={cy} r={5}
                  fill="#60a5fa" stroke="#0a0a0a" strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 7, fill: "#60a5fa" }}
            connectNulls={false}
            name="Empirisk"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Nedre panel: delta-staplar */}
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart data={data} margin={{ top: 0, right: 20, bottom: 28, left: 0 }}>
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
            tickFormatter={v => `${v > 0 ? "+" : ""}${v}%`}
            tick={{ fill: "#555", fontSize: 10 }}
            width={42}
          />
          <Tooltip content={<TooltipAvvikelse />} />
          <ReferenceLine y={0} stroke="#2a2a2a" strokeWidth={1.5} />
          <Bar dataKey="avvikelse" name="Δ avvisning" barSize={16}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.avvikelse == null ? "transparent"
                  : entry.avvikelse > 0 ? "#f8717160"
                  : "#4ade8060"
                }
                stroke={
                  entry.avvikelse == null ? "none"
                  : entry.avvikelse > 0 ? "#f87171"
                  : "#4ade80"
                }
                strokeWidth={entry.avvikelse == null ? 0 : 1}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>

      {!harData && (
        <p style={{ textAlign: "center", color: "#333", fontSize: "12px", margin: "8px 0 0" }}>
          Inga matchade speldata ännu — diagrammet fylls i automatiskt när
          Ultimatumspel kopplas till Gini-historik.
        </p>
      )}
    </div>
  );
}
