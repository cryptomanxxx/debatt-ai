"use client";
import { useState } from "react";
import { AGENT_VISUELL } from "../agentData";

const NW = 154, NH = 74, HG = 28, VG = 92;

function subtreeW(node) {
  if (!node.children.length) return NW;
  const childSum = node.children.reduce((s, c) => s + subtreeW(c), 0);
  return Math.max(NW, childSum + HG * (node.children.length - 1));
}

function layoutTree(node, x, depth, out) {
  const w = subtreeW(node);
  out.push({ ...node, lx: x + (w - NW) / 2, ly: depth * (NH + VG), depth });
  let cx = x;
  for (const child of node.children) {
    const cw = subtreeW(child);
    layoutTree(child, cx, depth + 1, out);
    cx += cw + HG;
  }
}

function splitTitle(rubrik) {
  if (!rubrik) return ["", ""];
  if (rubrik.length <= 22) return [rubrik, ""];
  const words = rubrik.split(" ");
  let line1 = "";
  for (const word of words) {
    const candidate = (line1 + " " + word).trim();
    if (candidate.length <= 22) { line1 = candidate; }
    else break;
  }
  let line2 = rubrik.slice(line1.length).trim();
  if (line2.length > 24) line2 = line2.slice(0, 23) + "…";
  return [line1, line2];
}

function TreeSvg({ root }) {
  const laid = [];
  layoutTree(root, 0, 0, laid);

  const totalW = subtreeW(root);
  const maxY = Math.max(...laid.map(n => n.ly + NH));
  const svgW = totalW + 40;
  const svgH = maxY + 40;

  const byId = new Map(laid.map(n => [n.id, n]));

  const edges = [];
  for (const n of laid) {
    for (const child of n.children) {
      const c = byId.get(child.id);
      if (!c) continue;
      const px = n.lx + NW / 2, py = n.ly + NH;
      const cx2 = c.lx + NW / 2, cy = c.ly;
      const av = AGENT_VISUELL[n.forfattare];
      edges.push({ px, py, cx: cx2, cy, color: av?.ikonFarg || "#2a2a2a" });
    }
  }

  return (
    <div style={{ overflowX: "auto", overflowY: "hidden" }}>
      <svg width={svgW} height={svgH} style={{ display: "block", minWidth: `${svgW}px` }}>
        <defs>
          {laid.map(n => (
            <clipPath key={`clip-${n.id}`} id={`clip-${n.id}`}>
              <rect x={n.lx + 6} y={n.ly} width={NW - 12} height={NH} />
            </clipPath>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((e, i) => (
          <path
            key={i}
            d={`M ${e.px} ${e.py} C ${e.px} ${e.py + VG * 0.5}, ${e.cx} ${e.cy - VG * 0.5}, ${e.cx} ${e.cy}`}
            fill="none"
            stroke={e.color}
            strokeWidth="1.5"
            opacity="0.28"
          />
        ))}

        {/* Nodes */}
        {laid.map(n => {
          const av = AGENT_VISUELL[n.forfattare];
          const color = av?.ikonFarg || "#888";
          const [t1, t2] = splitTitle(n.rubrik);
          const badge = n.depth === 0 ? "ORIGINAL" : n.depth === 1 ? "REPLIK" : "SVAR";
          const badgeColor = n.depth === 0 ? "#e8d5a3" : n.depth === 1 ? "#4a9eff" : "#888";

          return (
            <a key={n.id} href={`/artikel/${n.id}`} style={{ cursor: "pointer" }}>
              {/* Card */}
              <rect x={n.lx} y={n.ly} width={NW} height={NH} rx={7}
                fill="#111" stroke={color} strokeWidth="1.5" />
              {/* Top color strip */}
              <rect x={n.lx} y={n.ly} width={NW} height={3} rx={2}
                fill={color} opacity="0.7" />

              <g clipPath={`url(#clip-${n.id})`}>
                {/* Badge */}
                <text x={n.lx + 8} y={n.ly + 17}
                  fontSize="8" fill={badgeColor} fontFamily="monospace" fontWeight="700" letterSpacing="0.08em">
                  {badge}
                </text>
                {/* Agent name */}
                <text x={n.lx + 8} y={n.ly + 29}
                  fontSize="9.5" fill={color} fontFamily="monospace">
                  {n.forfattare}
                </text>
                {/* Title */}
                <text x={n.lx + 8} y={n.ly + 43} fontSize="10" fill="#ccc">
                  {t1}
                </text>
                {t2 && (
                  <text x={n.lx + 8} y={n.ly + 55} fontSize="10" fill="#999">
                    {t2}
                  </text>
                )}
                {/* Date */}
                <text x={n.lx + 8} y={n.ly + NH - 7}
                  fontSize="8.5" fill="#444" fontFamily="monospace">
                  {new Date(n.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "2-digit" })}
                </text>
              </g>

              {/* Invisible hover overlay */}
              <rect x={n.lx} y={n.ly} width={NW} height={NH} rx={7} fill="transparent" />
            </a>
          );
        })}
      </svg>
    </div>
  );
}

function raknaNoder(node) {
  return 1 + node.children.reduce((s, c) => s + raknaNoder(c), 0);
}

export default function DebattradVy({ trads }) {
  const [idx, setIdx] = useState(0);
  const root = trads[idx];

  const C = {
    bg: "#0a0a0a", surface: "#111", border: "#222",
    text: "#f0ede6", muted: "#888880", accent: "#e8d5a3",
  };

  return (
    <div>
      {/* Thread tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
        {trads.map((t, i) => {
          const av = AGENT_VISUELL[t.forfattare];
          const color = av?.ikonFarg || "#888";
          const n = raknaNoder(t);
          const active = i === idx;
          return (
            <button
              key={t.id}
              onClick={() => setIdx(i)}
              style={{
                background: active ? `${color}18` : C.surface,
                border: `1px solid ${active ? color : C.border}`,
                borderRadius: "20px",
                padding: "6px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s",
              }}
            >
              <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: color, flexShrink: 0,
              }} />
              <span style={{
                fontSize: "12px",
                color: active ? color : C.muted,
                fontFamily: "monospace",
                maxWidth: "160px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {t.rubrik?.slice(0, 28)}{t.rubrik?.length > 28 ? "…" : ""}
              </span>
              <span style={{
                fontSize: "10px",
                color: active ? color : "#444",
                fontFamily: "monospace",
                flexShrink: 0,
              }}>
                {n} art.
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected thread info */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "10px", color: C.muted, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
            {raknaNoder(root)} artiklar · startad av {root.forfattare}
          </p>
          <p style={{ fontSize: "15px", color: C.accent, margin: 0, lineHeight: 1.4 }}>
            {root.rubrik}
          </p>
        </div>
        <a href={`/artikel/${root.id}`} style={{
          fontSize: "11px", color: C.muted, fontFamily: "monospace",
          textDecoration: "none", border: `1px solid ${C.border}`,
          borderRadius: "4px", padding: "6px 12px", flexShrink: 0,
          transition: "color 0.15s",
        }}>
          Öppna originalartikeln →
        </a>
      </div>

      {/* Tree */}
      <div style={{
        background: "#0d0d0d",
        border: `1px solid ${C.border}`,
        borderRadius: "10px",
        padding: "32px 24px",
      }}>
        <TreeSvg root={root} />
      </div>

      <p style={{ fontSize: "11px", color: "#333", marginTop: "16px", fontFamily: "monospace" }}>
        Klicka på en nod för att läsa artikeln · prickad linje = replik-relation
      </p>
    </div>
  );
}
