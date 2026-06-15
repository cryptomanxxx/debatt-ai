"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DepthChart from "./DepthChart";

const SYMBOL_FARG = {
  DBT:  "#4a9eff",
  NOVA: "#e879f9",
  ETK:  "#34d399",
  STAB: "#facc15",
};
const EXTRA_FARGER = ["#fb923c","#a78bfa","#f472b6","#60a5fa","#fbbf24","#4ade80","#c084fc"];
const _df = {};
let _ei = 0;
function symbolFarg(sym) {
  if (SYMBOL_FARG[sym]) return SYMBOL_FARG[sym];
  if (!_df[sym]) _df[sym] = EXTRA_FARGER[_ei++ % EXTRA_FARGER.length];
  return _df[sym];
}

const C = {
  surface:   "#111111",
  surface2:  "#161616",
  border:    "#222222",
  text:      "#e8e8e6",
  textMuted: "#666660",
  accent:    "#e8d5a3",
};

function formatTid(iso) {
  const d = new Date(iso);
  return d.toLocaleString("sv-SE", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).replace(",", "");
}

function CustomTooltip({ active, payload, farg }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "#1a1a1a", border: "1px solid #222",
      borderRadius: 6, padding: "8px 12px", fontFamily: "monospace",
    }}>
      <div style={{ color: "#666660", fontSize: 10, marginBottom: 4 }}>{d.tid}</div>
      <div style={{ color: farg, fontSize: 13, fontWeight: 700 }}>{d.pris.toFixed(2)} kr</div>
      {d.volym > 0 && (
        <div style={{ color: "#666660", fontSize: 10, marginTop: 2 }}>
          Vol: {d.volym.toFixed(0)} kr
        </div>
      )}
    </div>
  );
}

export default function PrisChart({ ordrar, priser, symboler }) {
  const [aktivSym, setAktivSym] = useState(symboler[0] ?? "DBT");
  const [vy, setVy] = useState("pris");

  const farg = symbolFarg(aktivSym);

  // Kronologisk prishistorik för valt symbol (API returnerar desc)
  const symPriser = [...priser]
    .filter(p => p.symbol === aktivSym)
    .reverse()
    .map(p => ({
      tid:   formatTid(p.skapad),
      pris:  parseFloat(p.pris),
      volym: parseFloat(p.volym ?? 0),
    }));

  const senaste = symPriser.length > 0 ? symPriser[symPriser.length - 1].pris : null;
  const forsta  = symPriser.length > 0 ? symPriser[0].pris : null;
  const delta   = senaste && forsta ? ((senaste - forsta) / forsta) * 100 : null;

  const priserMin = symPriser.length > 0 ? Math.min(...symPriser.map(p => p.pris)) : 0;
  const priserMax = symPriser.length > 0 ? Math.max(...symPriser.map(p => p.pris)) : 100;
  const yPad = (priserMax - priserMin) * 0.12 || 5;

  // Glesad x-axel (max 7 labels)
  const step = Math.max(1, Math.floor(symPriser.length / 7));
  const xTicks = symPriser
    .map((_, i) => i)
    .filter(i => i % step === 0 || i === symPriser.length - 1)
    .map(i => symPriser[i].tid);

  return (
    <div style={{ marginBottom: 40 }}>
      {/* ── Header: symbol-tabs + vy-toggle ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {symboler.map(sym => (
            <button
              key={sym}
              onClick={() => setAktivSym(sym)}
              style={{
                padding: "4px 12px",
                fontSize: 11, fontFamily: "monospace",
                borderRadius: 4, cursor: "pointer", border: "1px solid",
                borderColor: aktivSym === sym ? symbolFarg(sym) : C.border,
                background: aktivSym === sym ? `${symbolFarg(sym)}18` : "transparent",
                color: aktivSym === sym ? symbolFarg(sym) : C.textMuted,
              }}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Vy-toggle */}
        <div style={{
          display: "flex", gap: 3,
          background: C.surface2, borderRadius: 6, padding: 3,
          border: `1px solid ${C.border}`,
        }}>
          {[["pris", "📈 Prishistorik"], ["djup", "📊 Djupdiagram"]].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setVy(k)}
              style={{
                padding: "4px 10px", fontSize: 11, fontFamily: "monospace",
                borderRadius: 4, cursor: "pointer", border: "none",
                background: vy === k ? C.surface : "transparent",
                color: vy === k ? C.accent : C.textMuted,
                boxShadow: vy === k ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
                transition: "background 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Djupdiagram-vy ── */}
      {vy === "djup" ? (
        <DepthChart ordrar={ordrar} symboler={symboler} externalSym={aktivSym} />
      ) : (
        /* ── Prishistorik-vy ── */
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 20px 12px" }}>
          {/* Stats-rad */}
          <div style={{ display: "flex", gap: 24, marginBottom: 16, fontFamily: "monospace", fontSize: 12 }}>
            <span>
              <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>SENASTE</span>
              <span style={{ color: farg, fontWeight: 700 }}>
                {senaste ? `${senaste.toFixed(2)} kr` : "–"}
              </span>
            </span>
            {delta !== null && (
              <span>
                <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>FÖRÄNDRING</span>
                <span style={{ color: delta >= 0 ? "#4ade80" : "#f87171", fontWeight: 700 }}>
                  {delta >= 0 ? "+" : ""}{delta.toFixed(2)}%
                </span>
              </span>
            )}
            <span>
              <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>DATAPUNKTER</span>
              <span style={{ color: C.text }}>{symPriser.length}</span>
            </span>
          </div>

          {symPriser.length < 2 ? (
            <div style={{
              height: 200, display: "flex", alignItems: "center", justifyContent: "center",
              color: C.textMuted, fontFamily: "monospace", fontSize: 13,
            }}>
              Ingen prishistorik för {aktivSym} ännu.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={symPriser} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-${aktivSym}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={farg} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={farg} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="tid"
                  ticks={xTicks}
                  tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "monospace" }}
                  axisLine={{ stroke: C.border }}
                  tickLine={false}
                />
                <YAxis
                  domain={[priserMin - yPad, priserMax + yPad]}
                  tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v.toFixed(0)}
                  width={36}
                />
                <Tooltip
                  content={<CustomTooltip farg={farg} />}
                  cursor={{ stroke: "#444", strokeWidth: 1, strokeDasharray: "4 3" }}
                />
                <Area
                  type="monotone"
                  dataKey="pris"
                  stroke={farg}
                  strokeWidth={2}
                  fill={`url(#grad-${aktivSym})`}
                  dot={false}
                  activeDot={{ r: 4, fill: farg, stroke: C.surface, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
