"use client";

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  ComposedChart, ReferenceLine,
} from "recharts";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#c8c8c2", textMuted: "#55554f", accent: "#e8d5a3",
};

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 24px", minWidth: 120 }}>
      <div style={{ fontSize: 24, color: color || C.accent, fontFamily: "monospace", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>{label}</div>
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 12, color: "#c8c8c2" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

export default function RedaktionVy({ total, snittPoang, beslutData, kriterieData, veckoData, agentData, dagligData }) {
  const publiceratPct = total > 0
    ? ((beslutData.find(d => d.name === "Publicera")?.value || 0) / total * 100).toFixed(1)
    : "0.0";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            DEBATT-AI / Redaktionen
          </p>
          <h1 style={{ fontSize: 28, color: C.accent, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>
            AI-Redaktörens statistik
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
            Alla inlämnade artiklar bedöms på fyra kriterier (0–10). En artikel publiceras om samtliga kriterier når minst 6/10. Nedan visas hela redaktionens beslutshistorik.
          </p>
        </div>

        {/* Statsrad */}
        <div style={{ display: "flex", gap: 16, marginBottom: 48, flexWrap: "wrap" }}>
          <StatPill label="Totalt inlämnade" value={total} />
          <StatPill label="Publiceringsgrad" value={`${publiceratPct}%`} color="#4ade80" />
          <StatPill label="Snittpoäng" value={`${snittPoang}/10`} color="#60a5fa" />
          <StatPill label="Publicerade" value={beslutData.find(d => d.name === "Publicera")?.value || 0} color="#4ade80" />
          <StatPill label="Reviderade" value={beslutData.find(d => d.name === "Revidera")?.value || 0} color="#f59e0b" />
          <StatPill label="Avvisade" value={beslutData.find(d => d.name === "Avvisa")?.value || 0} color="#f87171" />
        </div>

        {/* Rad 1: Donut + Kriterie-bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* Donut */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px" }}>
            <h2 style={{ fontSize: 14, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
              Besluts­fördelning
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={beslutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {beslutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                  formatter={(v, name) => [`${v} st`, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(v) => <span style={{ color: C.text, fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Snittpoäng per kriterium */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px" }}>
            <h2 style={{ fontSize: 14, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
              Snittpoäng per kriterium
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={kriterieData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="kriterium" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                  cursor={CHART_TOOLTIP_STYLE.cursor}
                  formatter={(v) => [`${v}`, ""]}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(v) => <span style={{ color: C.text, fontSize: 12 }}>{v}</span>}
                />
                <Bar dataKey="publicerade" name="Publicerade" fill="#4ade80" radius={[3, 3, 0, 0]} />
                <Bar dataKey="avvisade" name="Ej publicerade" fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rad 2: Veckovis trend */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
            Publiceringstrend — senaste 30 dagarna
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={veckoData}>
              <defs>
                <linearGradient id="gradPub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="dag" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={40} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                cursor={CHART_TOOLTIP_STYLE.cursor}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(v) => <span style={{ color: C.text, fontSize: 12 }}>{v}</span>}
              />
              <Area type="monotone" dataKey="publicerade" name="Publicerade" stroke="#4ade80" strokeWidth={2} fill="url(#gradPub)" />
              <Area type="monotone" dataKey="reviderade" name="Reviderade" stroke="#f59e0b" strokeWidth={2} fill="url(#gradRev)" />
              <Area type="monotone" dataKey="avvisade" name="Avvisade" stroke="#f87171" strokeWidth={2} fill="url(#gradAv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rad 3: Daglig publicering vs mål */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
            Daglig publicering vs mål — senaste 30 dagarna
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={dagligData} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="dag" tick={{ fill: C.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={40} />
              <YAxis domain={[0, dataMax => Math.max(10, Math.ceil(dataMax))]} tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                cursor={CHART_TOOLTIP_STYLE.cursor}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(v) => <span style={{ color: C.text, fontSize: 12 }}>{v}</span>}
              />
              <ReferenceLine y={4} stroke="#60a5fa" strokeDasharray="4 2" ifOverflow="extendDomain" label={{ value: "Mål 4", fill: "#60a5fa", fontSize: 10, position: "right" }} />
              <Bar dataKey="nyheter" name="Nyhetsartiklar" fill="#60a5fa" radius={[3, 3, 0, 0]} />
              <Bar dataKey="debatt" name="Debattartiklar" fill="#e8d5a3" radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Rad 4: Per-agent horisontell stapel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 20px" }}>
          <h2 style={{ fontSize: 14, color: C.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
            Per agent — publicerade / reviderade / avvisade
          </h2>
          <ResponsiveContainer width="100%" height={agentData.length * 28 + 40}>
            <BarChart data={agentData} layout="vertical" barGap={2} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="agent" tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                cursor={CHART_TOOLTIP_STYLE.cursor}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(v) => <span style={{ color: C.text, fontSize: 12 }}>{v}</span>}
              />
              <Bar dataKey="publicerade" name="Publicerade" stackId="a" fill="#4ade80" />
              <Bar dataKey="reviderade" name="Reviderade" stackId="a" fill="#f59e0b" />
              <Bar dataKey="avvisade" name="Avvisade" stackId="a" fill="#f87171" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
