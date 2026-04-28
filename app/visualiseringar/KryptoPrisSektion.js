"use client";

import { useState } from "react";
import Chart from "./Chart";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80",
};

const COINS = [
  { symbol: "BTC", namn: "Bitcoin" },
  { symbol: "ETH", namn: "Ethereum" },
  { symbol: "SOL", namn: "Solana" },
  { symbol: "XRP", namn: "XRP" },
  { symbol: "BNB", namn: "BNB" },
];

function formatPris(pris) {
  if (pris >= 1000) return pris.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " USD";
  return pris.toLocaleString("sv-SE", { maximumFractionDigits: 2 }) + " USD";
}

export default function KryptoPrisSektion({ data }) {
  const [vald, setVald] = useState("BTC");

  const coin = COINS.find(c => c.symbol === vald);
  const rader = data[vald] || [];

  const chartData = rader.map(r => ({
    period: r.datum,
    varde: parseFloat(r.pris),
  }));

  const senaste = rader[rader.length - 1];
  const forsta = rader[0];
  const forandring = senaste && forsta
    ? (((senaste.pris - forsta.pris) / forsta.pris) * 100).toFixed(1)
    : null;

  return (
    <div style={{ marginBottom: "56px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0, fontFamily: "monospace" }}>
          Kryptovalutor · Dagliga priser
        </p>
        {senaste && (
          <span style={{ fontSize: "12px", color: C.textMuted }}>
            Senast uppdaterad {senaste.datum}
          </span>
        )}
      </div>

      {/* Coin-väljare */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {COINS.map(c => (
          <button
            key={c.symbol}
            onClick={() => setVald(c.symbol)}
            style={{
              padding: "6px 16px",
              background: vald === c.symbol ? `${C.green}15` : "transparent",
              border: `1px solid ${vald === c.symbol ? C.green : C.border}`,
              color: vald === c.symbol ? C.green : C.textMuted,
              borderRadius: "4px",
              fontSize: "13px",
              fontFamily: "monospace",
              fontWeight: vald === c.symbol ? 700 : 400,
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            {c.symbol}
          </button>
        ))}
      </div>

      {/* Graf */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "4px", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 400, color: C.accent, margin: 0 }}>
            {coin?.namn} ({vald}/USD)
          </h2>
          {senaste && (
            <span style={{ fontSize: "20px", color: C.green, fontFamily: "monospace", fontWeight: 700 }}>
              {formatPris(parseFloat(senaste.pris))}
            </span>
          )}
          {forandring !== null && (
            <span style={{
              fontSize: "13px",
              fontFamily: "monospace",
              color: parseFloat(forandring) >= 0 ? C.green : "#f87171",
            }}>
              {parseFloat(forandring) >= 0 ? "+" : ""}{forandring}% (hela perioden)
            </span>
          )}
        </div>
        <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 16px", fontFamily: "monospace" }}>
          {rader.length} datapunkter · Källa: Yahoo Finance
        </p>
        {chartData.length > 0 ? (
          <Chart typ="linje" data={chartData} enhet="USD" />
        ) : (
          <p style={{ color: C.textMuted, fontSize: "14px" }}>Ingen data för {vald} ännu.</p>
        )}
      </div>
    </div>
  );
}
