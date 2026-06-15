"use client";
import { useState, useRef } from "react";

const C = {
  surface:  "#111111",
  surface2: "#161616",
  border:   "#222222",
  text:     "#e8e8e6",
  textMuted:"#666660",
  accent:   "#e8d5a3",
};

const BID_FILL   = "rgba(74,222,128,0.12)";
const BID_STROKE = "#4ade80";
const ASK_FILL   = "rgba(248,113,113,0.12)";
const ASK_STROKE = "#f87171";

function buildDepth(ordrar, symbol) {
  const bids = {};
  const asks = {};

  for (const o of ordrar) {
    if (o.symbol !== symbol) continue;
    if (!["öppen", "delvis"].includes(o.status)) continue;
    const kvar = Math.max(0, parseFloat(o.antal ?? 0) - parseFloat(o.ifylld_antal ?? 0));
    if (kvar <= 0) continue;
    const pris  = parseFloat(o.pris ?? 0);
    const volym = kvar * pris; // SEK
    if (o.typ === "kop")  bids[pris] = (bids[pris] ?? 0) + volym;
    if (o.typ === "salj") asks[pris] = (asks[pris] ?? 0) + volym;
  }

  // Sorted bid levels high→low, ask levels low→high
  const bidLevels = Object.entries(bids)
    .map(([p, v]) => ({ pris: parseFloat(p), volym: v }))
    .sort((a, b) => b.pris - a.pris);

  const askLevels = Object.entries(asks)
    .map(([p, v]) => ({ pris: parseFloat(p), volym: v }))
    .sort((a, b) => a.pris - b.pris);

  let cumBid = 0;
  const bidCum = bidLevels.map(l => { cumBid += l.volym; return { pris: l.pris, cum: cumBid }; });

  let cumAsk = 0;
  const askCum = askLevels.map(l => { cumAsk += l.volym; return { pris: l.pris, cum: cumAsk }; });

  return { bidCum, askCum };
}

function buildPolygon(levels, toX, toY, side) {
  // side: "bid" = high→low price, "ask" = low→high price
  if (levels.length === 0) return "";
  const pts = [];

  if (side === "bid") {
    // Start bottom-right
    pts.push([toX(levels[0].pris), toY(0)]);
    for (let i = 0; i < levels.length; i++) {
      pts.push([toX(levels[i].pris), toY(levels[i].cum)]);
      if (i + 1 < levels.length) {
        pts.push([toX(levels[i + 1].pris), toY(levels[i].cum)]);
      }
    }
    pts.push([toX(levels[levels.length - 1].pris), toY(0)]);
  } else {
    // Start bottom-left
    pts.push([toX(levels[0].pris), toY(0)]);
    for (let i = 0; i < levels.length; i++) {
      pts.push([toX(levels[i].pris), toY(levels[i].cum)]);
      if (i + 1 < levels.length) {
        pts.push([toX(levels[i + 1].pris), toY(levels[i].cum)]);
      }
    }
    pts.push([toX(levels[levels.length - 1].pris), toY(0)]);
  }

  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export default function DepthChart({ ordrar, symboler, externalSym }) {
  const [interntSym, setInterntSym] = useState(symboler[0] ?? "DBT");
  const aktivSym = externalSym ?? interntSym;
  const setAktivSym = externalSym ? () => {} : setInterntSym;
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const W = 700, H = 200;
  const PAD = { t: 12, r: 16, b: 32, l: 52 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const { bidCum, askCum } = buildDepth(ordrar, aktivSym);

  const bestBid = bidCum.length > 0 ? bidCum[0].pris : null;
  const bestAsk = askCum.length > 0 ? askCum[0].pris : null;
  const spread  = bestBid && bestAsk ? bestAsk - bestBid : null;
  const mid     = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;

  const allPrices = [...bidCum.map(b => b.pris), ...askCum.map(a => a.pris)];
  const xMin = allPrices.length > 0 ? Math.min(...allPrices) * 0.97 : 90;
  const xMax = allPrices.length > 0 ? Math.max(...allPrices) * 1.03 : 110;

  const maxCum = Math.max(
    bidCum.length > 0 ? bidCum[bidCum.length - 1].cum : 0,
    askCum.length > 0 ? askCum[askCum.length - 1].cum : 0,
    1,
  ) * 1.08;

  const toX = p => PAD.l + ((p - xMin) / (xMax - xMin)) * chartW;
  const toY = v => PAD.t + chartH - (v / maxCum) * chartH;
  const fromX = px => xMin + ((px - PAD.l) / chartW) * (xMax - xMin);

  const bidPath = buildPolygon(bidCum, toX, toY, "bid");
  const askPath = buildPolygon(askCum, toX, toY, "ask");

  // Y-axis ticks (4 levels)
  const yTicks = [0.25, 0.5, 0.75, 1.0].map(f => ({
    v: maxCum * f,
    y: toY(maxCum * f),
    label: maxCum * f >= 1000 ? `${(maxCum * f / 1000).toFixed(1)}k` : `${Math.round(maxCum * f)}`,
  }));

  // X-axis ticks (5 evenly spaced prices)
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    p: xMin + f * (xMax - xMin),
    x: toX(xMin + f * (xMax - xMin)),
  }));

  function onMouseMove(e) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX  = ((e.clientX - rect.left) / rect.width) * W;
    const price  = fromX(svgX);
    if (price < xMin || price > xMax) { setTooltip(null); return; }

    // Find which side and cumulative volume at this price
    let cumVol = null, side = null;
    if (bidCum.length > 0 && price <= bestBid) {
      // Find the bid level at or below this price
      const match = [...bidCum].reverse().find(b => b.pris >= price);
      if (match) { cumVol = match.cum; side = "bid"; }
    }
    if (askCum.length > 0 && price >= bestAsk) {
      // Last ask level at or below hover price = current staircase step height
      const match = [...askCum].reverse().find(a => a.pris <= price);
      if (match) { cumVol = match.cum; side = "ask"; }
    }

    setTooltip({ x: svgX, price, cumVol, side });
  }

  const isEmpty = bidCum.length === 0 && askCum.length === 0;

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{
          fontSize: 11, color: C.textMuted, fontFamily: "monospace",
          textTransform: "uppercase", letterSpacing: "0.1em", margin: 0,
        }}>
          Djupdiagram — orderbok
        </h2>
        {/* Symbol-tabs — döljs när PrisChart styr symbolen utifrån */}
        {!externalSym && (
          <div style={{ display: "flex", gap: 6 }}>
            {symboler.map(sym => (
              <button
                key={sym}
                onClick={() => setAktivSym(sym)}
                style={{
                  padding: "4px 12px",
                  fontSize: 11, fontFamily: "monospace",
                  borderRadius: 4, cursor: "pointer", border: "1px solid",
                  borderColor: aktivSym === sym ? C.accent : C.border,
                  background: aktivSym === sym ? "rgba(232,213,163,0.08)" : "transparent",
                  color: aktivSym === sym ? C.accent : C.textMuted,
                }}
              >
                {sym}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 20px 12px" }}>
        {/* Spread-statistik */}
        <div style={{ display: "flex", gap: 24, marginBottom: 16, fontFamily: "monospace", fontSize: 12 }}>
          <span>
            <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>BÄSTA KÖP</span>
            <span style={{ color: BID_STROKE, fontWeight: 700 }}>
              {bestBid ? `${bestBid.toFixed(2)} kr` : "–"}
            </span>
          </span>
          <span>
            <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>SPREAD</span>
            <span style={{ color: C.accent }}>
              {spread !== null ? `${spread.toFixed(2)} kr` : "–"}
            </span>
          </span>
          <span>
            <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>BÄSTA SÄLJ</span>
            <span style={{ color: ASK_STROKE, fontWeight: 700 }}>
              {bestAsk ? `${bestAsk.toFixed(2)} kr` : "–"}
            </span>
          </span>
          <span>
            <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>KÖP-ORDRAR</span>
            <span style={{ color: C.text }}>{bidCum.length}</span>
          </span>
          <span>
            <span style={{ color: C.textMuted, fontSize: 10, marginRight: 4 }}>SÄLJ-ORDRAR</span>
            <span style={{ color: C.text }}>{askCum.length}</span>
          </span>
        </div>

        {isEmpty ? (
          <div style={{
            height: H, display: "flex", alignItems: "center", justifyContent: "center",
            color: C.textMuted, fontFamily: "monospace", fontSize: 13,
          }}>
            Inga öppna ordrar för {aktivSym} just nu.
          </div>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: "block", cursor: "crosshair" }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Grid lines */}
            {yTicks.map(t => (
              <line
                key={t.v}
                x1={PAD.l} y1={t.y}
                x2={PAD.l + chartW} y2={t.y}
                stroke="#1e1e1e" strokeWidth={1}
              />
            ))}

            {/* Bid polygon */}
            {bidPath && (
              <polygon points={bidPath} fill={BID_FILL} stroke={BID_STROKE} strokeWidth={1.5} strokeLinejoin="round" />
            )}

            {/* Ask polygon */}
            {askPath && (
              <polygon points={askPath} fill={ASK_FILL} stroke={ASK_STROKE} strokeWidth={1.5} strokeLinejoin="round" />
            )}

            {/* Mid price vertical line */}
            {mid && (
              <>
                <line
                  x1={toX(mid)} y1={PAD.t}
                  x2={toX(mid)} y2={PAD.t + chartH}
                  stroke="#444" strokeWidth={1} strokeDasharray="4,3"
                />
                <text
                  x={toX(mid)} y={PAD.t - 2}
                  textAnchor="middle" fill="#555" fontSize={9} fontFamily="monospace"
                >
                  {mid.toFixed(1)}
                </text>
              </>
            )}

            {/* Tooltip */}
            {tooltip && tooltip.cumVol !== null && (
              <>
                <line
                  x1={tooltip.x} y1={PAD.t}
                  x2={tooltip.x} y2={PAD.t + chartH}
                  stroke="#888" strokeWidth={1} strokeDasharray="2,2"
                />
                <rect
                  x={Math.min(tooltip.x + 8, W - 120)} y={PAD.t + 4}
                  width={110} height={34}
                  fill="#1a1a1a" stroke={C.border} rx={4}
                />
                <text
                  x={Math.min(tooltip.x + 13, W - 115)} y={PAD.t + 17}
                  fill={tooltip.side === "bid" ? BID_STROKE : ASK_STROKE}
                  fontSize={10} fontFamily="monospace"
                >
                  {tooltip.price.toFixed(2)} kr
                </text>
                <text
                  x={Math.min(tooltip.x + 13, W - 115)} y={PAD.t + 30}
                  fill={C.textMuted} fontSize={9} fontFamily="monospace"
                >
                  {tooltip.cumVol >= 1000
                    ? `Vol: ${(tooltip.cumVol / 1000).toFixed(1)}k kr`
                    : `Vol: ${tooltip.cumVol.toFixed(0)} kr`}
                </text>
              </>
            )}

            {/* Y-axis labels */}
            {yTicks.map(t => (
              <text
                key={t.v}
                x={PAD.l - 4} y={t.y + 3}
                textAnchor="end" fill={C.textMuted}
                fontSize={9} fontFamily="monospace"
              >
                {t.label}
              </text>
            ))}

            {/* X-axis line */}
            <line
              x1={PAD.l} y1={PAD.t + chartH}
              x2={PAD.l + chartW} y2={PAD.t + chartH}
              stroke={C.border} strokeWidth={1}
            />

            {/* X-axis labels */}
            {xTicks.map(t => (
              <text
                key={t.p}
                x={t.x} y={H - 4}
                textAnchor="middle" fill={C.textMuted}
                fontSize={9} fontFamily="monospace"
              >
                {t.p.toFixed(1)}
              </text>
            ))}

            {/* Y-axis line */}
            <line
              x1={PAD.l} y1={PAD.t}
              x2={PAD.l} y2={PAD.t + chartH}
              stroke={C.border} strokeWidth={1}
            />

            {/* Legend */}
            <rect x={W - 100} y={PAD.t + 4} width={8} height={8} fill={BID_FILL} stroke={BID_STROKE} strokeWidth={1} />
            <text x={W - 88} y={PAD.t + 12} fill={C.textMuted} fontSize={9} fontFamily="monospace">Köpordrar</text>
            <rect x={W - 100} y={PAD.t + 18} width={8} height={8} fill={ASK_FILL} stroke={ASK_STROKE} strokeWidth={1} />
            <text x={W - 88} y={PAD.t + 26} fill={C.textMuted} fontSize={9} fontFamily="monospace">Säljordrar</text>
          </svg>
        )}
      </div>
    </div>
  );
}
