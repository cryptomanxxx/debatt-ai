"use client";
import { useState } from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

const FARG = {
  foretag:  "#a78bfa",
  handel:   "#34d399",
  bors:     "#60a5fa",
  etf:      "#f59e0b",
  feedback: "#f472b6",
  rullande: "#e2e8f0",
  gini:     "#f87171",
  risk:     "#fb923c",
};

const ETIKETT = {
  foretag:  "Företag",
  handel:   "Varuhandel",
  bors:     "Börs",
  etf:      "Krypto-ETF",
  feedback: "Socialt kapital",
};

function StatPill({ label, value, sub, color = "#60a5fa" }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", padding: "14px 20px", minWidth: "140px" }}>
      <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function fmt(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function kortDag(dagStr) {
  if (!dagStr) return "";
  const d = new Date(dagStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "10px 14px", fontSize: "11px", fontFamily: "monospace" }}>
      <div style={{ color: "#94a3b8", marginBottom: "6px" }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: "2px" }}>
          {ETIKETT[p.dataKey] || p.name}: {fmt(p.value)} kr
        </div>
      ))}
    </div>
  );
};

export default function TillvaxtVy({ gdpSerie, oligarkiSerie, totalFormogenhet, gdpVecka, tillvaxtPct }) {
  const [interval, setInterval] = useState(60);

  const gdpVald   = gdpSerie.slice(-interval);
  const oligVald  = oligarkiSerie.slice(-interval);

  const totalBnpAll = gdpSerie.reduce((s, d) => s + d.total, 0);
  const aktiva      = gdpSerie.filter(d => d.total > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* ── Nyckeltal ── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <StatPill label="TOTAL FÖRMÖGENHET" value={`${totalFormogenhet.toLocaleString("sv-SE")} kr`} color="#e2e8f0" />
        <StatPill label="BNP SENASTE 7 DAGAR" value={`${Math.round(gdpVecka).toLocaleString("sv-SE")} kr`} color="#60a5fa" />
        <StatPill
          label="VECKOTILLVÄXT"
          value={tillvaxtPct !== null ? `${tillvaxtPct > 0 ? "+" : ""}${tillvaxtPct}%` : "–"}
          color={tillvaxtPct === null ? "#475569" : tillvaxtPct >= 0 ? "#34d399" : "#f87171"}
          sub="vs föregående vecka"
        />
        <StatPill label="AKTIVA DAGAR" value={`${aktiva} / ${gdpSerie.length}`} color="#a78bfa" sub="dagar med ekonomisk aktivitet" />
      </div>

      {/* ── Tidsintervalljusterare ── */}
      <div style={{ display: "flex", gap: "6px" }}>
        {[30, 60, 90].map(d => (
          <button key={d} onClick={() => setInterval(d)}
            style={{ fontSize: "10px", fontFamily: "monospace", padding: "4px 12px", borderRadius: "4px", cursor: "pointer",
              background: interval === d ? "rgba(96,165,250,0.12)" : "transparent",
              border: `1px solid ${interval === d ? "#60a5fa" : "#1e293b"}`,
              color: interval === d ? "#60a5fa" : "#475569" }}>
            {d}d
          </button>
        ))}
      </div>

      {/* ── BNP-komponenter staplad area ── */}
      <div>
        <h2 style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: "14px" }}>
          BNP-KOMPONENTER PER DAG (kr)
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={gdpVald} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {Object.entries(FARG).filter(([k]) => ETIKETT[k]).map(([k, c]) => (
                <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={c} stopOpacity={0.03} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="dag" tickFormatter={kortDag} tick={{ fontSize: 9, fill: "#475569", fontFamily: "monospace" }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: "#475569", fontFamily: "monospace" }} width={44} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }}
              formatter={k => ETIKETT[k] || k} />
            {Object.keys(ETIKETT).map(k => (
              <Area key={k} type="monotone" dataKey={k} stackId="1"
                stroke={FARG[k]} fill={`url(#grad-${k})`} strokeWidth={1.5} dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Rullande 7d BNP ── */}
      <div>
        <h2 style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: "14px" }}>
          RULLANDE 7-DAGARS BNP (kr)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={gdpVald} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="dag" tickFormatter={kortDag} tick={{ fontSize: 9, fill: "#475569", fontFamily: "monospace" }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: "#475569", fontFamily: "monospace" }} width={44} />
            <Tooltip formatter={(v) => [`${Math.round(v)} kr`, "7d snitt"]}
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: "11px", fontFamily: "monospace" }} />
            <Line type="monotone" dataKey="rullande7" stroke={FARG.rullande}
              strokeWidth={2} dot={false} name="7d rullande snitt" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Gini + Oligarkirisk ── */}
      {oligarkiSerie.length > 0 && (
        <div>
          <h2 style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: "14px" }}>
            FÖRMÖGENHETSFÖRDELNING
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={oligVald} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="dag" tickFormatter={kortDag} tick={{ fontSize: 9, fill: "#475569", fontFamily: "monospace" }} />
              <YAxis yAxisId="gini" domain={[0, 1]} tickFormatter={v => v.toFixed(2)}
                tick={{ fontSize: 9, fill: "#475569", fontFamily: "monospace" }} width={44} />
              <YAxis yAxisId="risk" orientation="right" domain={[0, 100]}
                tick={{ fontSize: 9, fill: "#475569", fontFamily: "monospace" }} width={36} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: "11px", fontFamily: "monospace" }} />
              <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
              <Line yAxisId="gini" type="monotone" dataKey="gini" stroke={FARG.gini}
                strokeWidth={2} dot={false} name="Gini-koefficient" />
              <Line yAxisId="risk" type="monotone" dataKey="risk" stroke={FARG.risk}
                strokeWidth={1.5} dot={false} name="Oligarkirisk (0–100)" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {oligarkiSerie.length === 0 && (
        <div style={{ fontSize: "12px", color: "#334155", fontFamily: "monospace", textAlign: "center", padding: "24px" }}>
          Ingen förmögenhetshistorik ännu — körs automatiskt varje dag
        </div>
      )}
    </div>
  );
}
