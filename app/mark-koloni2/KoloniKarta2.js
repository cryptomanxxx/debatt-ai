"use client";
import { useRef, useEffect, useState, useCallback } from "react";

const R   = 40;          // hex world-radius
const S3  = Math.sqrt(3);
const GAP = 13;          // outer shrinkage (ring inner gap)
const BW  = 6;           // ring width

const TYP_FARG = {
  energi:   "#f59e0b", jordbruk: "#22c55e", industri: "#3b82f6",
  gruva:    "#ea580c", stad:     "#9333ea", kust:     "#0891b2",
  skog:     "#16a34a",
};
const TYP_IKON = {
  energi: "⚡", jordbruk: "🌾", industri: "🏭",
  gruva:  "⛏️", stad: "🏙️",  kust: "🌊",  skog: "🌲",
};

// 15 named zones across 3 islands.  'o' = island name.
const ZONER = [
  // ── NordÖn (NV, bergig) ─────────────────────────────────────────────────────
  { id:"n1", col:1, row:0, typ:"gruva",    namn:"Silvergruvan",        hamn:false, o:"NordÖn" },
  { id:"n2", col:2, row:1, typ:"stad",     namn:"Bergstaden",          hamn:false, o:"NordÖn" },
  { id:"n3", col:0, row:1, typ:"kust",     namn:"Nordhamnen",          hamn:true,  o:"NordÖn" },
  { id:"n4", col:2, row:2, typ:"energi",   namn:"Vindfarmen",          hamn:false, o:"NordÖn" },
  { id:"n5", col:1, row:3, typ:"skog",     namn:"Nordskogens hjärta",  hamn:false, o:"NordÖn" },
  // ── ÖstÖn (NÖ, grön) ───────────────────────────────────────────────────────
  { id:"o1", col:9, row:0, typ:"skog",     namn:"Östskogens lugn",     hamn:false, o:"ÖstÖn"  },
  { id:"o2", col:8, row:1, typ:"gruva",    namn:"Bergspasset",         hamn:false, o:"ÖstÖn"  },
  { id:"o3", col:10,row:1, typ:"kust",     namn:"Östhamnen",           hamn:true,  o:"ÖstÖn"  },
  { id:"o4", col:9, row:2, typ:"stad",     namn:"Teknikstaden",        hamn:false, o:"ÖstÖn"  },
  { id:"o5", col:8, row:3, typ:"industri", namn:"Vattenverket",        hamn:false, o:"ÖstÖn"  },
  // ── SydÖn (S, tropisk) ─────────────────────────────────────────────────────
  { id:"s1", col:2, row:8, typ:"jordbruk", namn:"Palmplantagerna",     hamn:false, o:"SydÖn"  },
  { id:"s2", col:4, row:7, typ:"gruva",    namn:"Djungelgruvan",       hamn:false, o:"SydÖn"  },
  { id:"s3", col:6, row:7, typ:"energi",   namn:"Solfarmen",           hamn:false, o:"SydÖn"  },
  { id:"s4", col:4, row:8, typ:"stad",     namn:"Tropikstaden",        hamn:false, o:"SydÖn"  },
  { id:"s5", col:4, row:9, typ:"kust",     namn:"Tropikhamnen",        hamn:true,  o:"SydÖn"  },
  { id:"s6", col:7, row:8, typ:"jordbruk", namn:"Spannmålsfälten",     hamn:false, o:"SydÖn"  },
];

// Railway lines drawn on canvas along the land bridges.
const RAILWAYS = [
  {
    label: "Västra järnvägen",
    color: "#f59e0b",
    // NordÖn (col 1, row 3) → SydÖn (col 2, row 8) via west land-bridge
    path: [[1,3],[1,4],[2,5],[2,6],[2,7],[2,8]],
  },
  {
    label: "Östra järnvägen",
    color: "#a78bfa",
    // ÖstÖn (col 8, row 3) → SydÖn (col 7, row 8) via east land-bridge
    path: [[8,3],[7,4],[7,5],[6,6],[6,7],[7,8]],
  },
];

// ── Hex helpers ───────────────────────────────────────────────────────────────
function hexCenter(col, row) {
  return [
    R * S3 * (col + (row % 2 === 1 ? 0.5 : 0)),
    R * 1.5 * row,
  ];
}

function hexSubPath(ctx, cx, cy, r) {
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// ── Pre-compute world bounds from static ZONER ─────────────────────────────
const _cc  = ZONER.map(z => hexCenter(z.col, z.row));
const _minX = Math.min(..._cc.map(c => c[0]));
const _maxX = Math.max(..._cc.map(c => c[0]));
const _minY = Math.min(..._cc.map(c => c[1]));
const _maxY = Math.max(..._cc.map(c => c[1]));
const WORLD_W = _maxX - _minX + R * 8;
const WORLD_H = _maxY - _minY + R * 8;
const OX = -_minX + R * 4;
const OY = -_minY + R * 4;

// ── Island groups for the nav panel ──────────────────────────────────────────
const ISLANDS = [
  { name: "NordÖn",  emoji: "🏔", color: "#f59e0b" },
  { name: "ÖstÖn",   emoji: "🌿", color: "#22c55e" },
  { name: "SydÖn",   emoji: "🌴", color: "#0891b2" },
];

export default function KoloniKarta2() {
  const canvasRef = useRef(null);
  const bgImgRef  = useRef(null);
  const stateRef  = useRef({
    tx: 0, ty: 0, scale: 1, minScale: 1,
    dragging: false, lastX: 0, lastY: 0,
    vx: 0, vy: 0, selected: null,
    dragStartX: 0, dragStartY: 0,
  });
  const [selZone, setSelZone] = useState(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.width  / dpr;
    const H   = canvas.height / dpr;
    const { tx, ty, scale, minScale = 1, selected } = stateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Background (photo or gradient fallback) ──────────────────────────────
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(tx + W / 2, ty + H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-WORLD_W / 2, -WORLD_H / 2);

    const bg = bgImgRef.current;
    if (bg?.complete && bg.naturalWidth > 0) {
      ctx.drawImage(bg, 0, 0, WORLD_W, WORLD_H);
    } else {
      // Ocean gradient fallback
      const ocean = ctx.createLinearGradient(0, 0, 0, WORLD_H);
      ocean.addColorStop(0, "#0c2240");
      ocean.addColorStop(1, "#071525");
      ctx.fillStyle = ocean;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    ctx.restore();

    // LoD: hexes fade in as the user zooms in past minScale
    const hexAlpha = Math.max(0, Math.min(1.0, (scale / minScale - 1.2) / 2.0));

    // ── Railways (drawn below hexes so hexes appear on top) ─────────────────
    if (hexAlpha > 0.05) {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(tx + W / 2, ty + H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-WORLD_W / 2, -WORLD_H / 2);
      ctx.lineCap  = "round";
      ctx.lineJoin = "round";

      for (const rw of RAILWAYS) {
        if (rw.path.length < 2) continue;
        ctx.beginPath();
        const [c0, r0] = rw.path[0];
        const [sx, sy] = hexCenter(c0, r0);
        ctx.moveTo(sx + OX, sy + OY);
        for (let i = 1; i < rw.path.length; i++) {
          const [ci, ri] = rw.path[i];
          const [px, py] = hexCenter(ci, ri);
          ctx.lineTo(px + OX, py + OY);
        }
        // Shadow
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.lineWidth   = 11 / scale;
        ctx.globalAlpha = hexAlpha * 0.7;
        ctx.setLineDash([]);
        ctx.stroke();
        // Coloured rail
        ctx.strokeStyle = rw.color;
        ctx.lineWidth   = 5 / scale;
        ctx.globalAlpha = hexAlpha * 0.9;
        ctx.stroke();
        // White dashes (sleeper look)
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth   = 2 / scale;
        ctx.setLineDash([9 / scale, 7 / scale]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      }
      ctx.restore();
    }

    // ── Hex rings (evenodd ring technique) ───────────────────────────────────
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(tx + W / 2, ty + H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-WORLD_W / 2, -WORLD_H / 2);

    for (const z of ZONER) {
      const isSelected = selected === z.id;
      if (!isSelected && hexAlpha <= 0) continue;
      const [cx, cy] = hexCenter(z.col, z.row);
      const color = isSelected ? "#ffffff" : (TYP_FARG[z.typ] || "#888");
      ctx.beginPath();
      hexSubPath(ctx, cx + OX, cy + OY, R - GAP);
      hexSubPath(ctx, cx + OX, cy + OY, R - BW - GAP);
      ctx.fillStyle   = color;
      ctx.globalAlpha = isSelected ? 1.0 : hexAlpha;
      ctx.fill("evenodd");
      ctx.globalAlpha = 1.0;

      // Harbour glow ring
      if (z.hamn && hexAlpha > 0.15) {
        ctx.beginPath();
        ctx.arc(cx + OX, cy + OY, R - GAP - 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth   = 2.5 / scale;
        ctx.globalAlpha = hexAlpha * 0.65;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }
    ctx.restore();

    // ── Labels (skip at very low alpha) ─────────────────────────────────────
    if (hexAlpha > 0.1) {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(tx + W / 2, ty + H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-WORLD_W / 2, -WORLD_H / 2);

      for (const z of ZONER) {
        if (selected !== z.id && hexAlpha <= 0.15) continue;
        const [cx, cy] = hexCenter(z.col, z.row);
        const ikon = z.hamn ? "⚓" : (TYP_IKON[z.typ] || "?");
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";

        if (scale >= minScale * 3.2) {
          ctx.shadowColor = "rgba(0,0,0,0.9)";
          ctx.shadowBlur  = 4 / scale;
          ctx.fillStyle   = "#fff";
          ctx.font        = `bold ${13 / scale}px sans-serif`;
          ctx.fillText(z.namn, cx + OX, cy + OY - 7 / scale);
          ctx.font        = `${16 / scale}px sans-serif`;
          ctx.fillText(ikon, cx + OX, cy + OY + 9 / scale);
          ctx.shadowBlur  = 0;
        } else if (scale >= minScale * 1.7) {
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur  = 3 / scale;
          ctx.font        = `${17 / scale}px sans-serif`;
          ctx.fillStyle   = "#fff";
          ctx.fillText(ikon, cx + OX, cy + OY);
          ctx.shadowBlur  = 0;
        } else {
          ctx.font      = `${11 / scale}px sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.65)";
          ctx.fillText(ikon, cx + OX, cy + OY);
        }
      }
      ctx.restore();
    }
  }, []);

  // Load background image — the 3-islands aerial photo
  useEffect(() => {
    const img = new Image();
    img.src = "/koloni2-bakgrund.png";
    img.onload = () => { bgImgRef.current = img; render(); };
    img.onerror = () => { bgImgRef.current = null; };
    bgImgRef.current = img;
  }, [render]);

  // Momentum scroll loop
  useEffect(() => {
    let running = true;
    function loop() {
      if (!running) return;
      const s = stateRef.current;
      if (!s.dragging && (Math.abs(s.vx) > 0.1 || Math.abs(s.vy) > 0.1)) {
        s.tx += s.vx; s.ty += s.vy;
        s.vx *= 0.88; s.vy *= 0.88;
        render();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [render]);

  // Canvas setup + event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    let initialized = false;

    function resize() {
      const parent = canvas.parentElement;
      const W = parent.clientWidth;
      const H = parent.clientHeight;
      if (!W || !H) return;
      canvas.width        = W * dpr;
      canvas.height       = H * dpr;
      canvas.style.width  = `${W}px`;
      canvas.style.height = `${H}px`;
      if (!initialized && H > 200) {
        initialized = true;
        const s = Math.min(W / WORLD_W, H / WORLD_H) * 0.96;
        stateRef.current.scale    = s;
        stateRef.current.minScale = s;
        stateRef.current.tx       = 0;
        stateRef.current.ty       = 0;
      }
      render();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    function onWheel(e) {
      e.preventDefault();
      const s      = stateRef.current;
      const CW     = canvas.clientWidth;
      const CH     = canvas.clientHeight;
      const rect   = canvas.getBoundingClientRect();
      const mx     = e.clientX - rect.left - CW / 2;
      const my     = e.clientY - rect.top  - CH / 2;
      const factor = e.deltaY < 0 ? 1.1 : 0.91;
      const ns     = Math.min(8, Math.max(0.18, s.scale * factor));
      s.tx    = mx - (mx - s.tx) * (ns / s.scale);
      s.ty    = my - (my - s.ty) * (ns / s.scale);
      s.scale = ns;
      render();
    }

    function onMouseDown(e) {
      const s = stateRef.current;
      s.dragging   = true;
      s.lastX      = e.clientX; s.lastY      = e.clientY;
      s.dragStartX = e.clientX; s.dragStartY = e.clientY;
      s.vx = 0; s.vy = 0;
    }
    function onMouseMove(e) {
      const s = stateRef.current;
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.tx += dx; s.ty += dy;
      s.vx = dx;  s.vy = dy;
      s.lastX = e.clientX; s.lastY = e.clientY;
      render();
    }
    function onMouseUp() { stateRef.current.dragging = false; }

    function onClick(e) {
      const s = stateRef.current;
      const dragDist = Math.hypot(
        e.clientX - (s.dragStartX ?? e.clientX),
        e.clientY - (s.dragStartY ?? e.clientY)
      );
      if (dragDist > 6) return;

      const CW   = canvas.clientWidth;
      const CH   = canvas.clientHeight;
      const rect = canvas.getBoundingClientRect();
      const mx   = (e.clientX - rect.left - CW / 2 - s.tx) / s.scale + WORLD_W / 2 - OX;
      const my   = (e.clientY - rect.top  - CH / 2 - s.ty) / s.scale + WORLD_H / 2 - OY;

      let nearest = null, nearestDist = Infinity;
      for (const z of ZONER) {
        const [cx, cy] = hexCenter(z.col, z.row);
        const d = Math.hypot(mx - cx, my - cy);
        if (d < nearestDist) { nearestDist = d; nearest = z; }
      }
      if (nearest && nearestDist < R * 0.9) {
        stateRef.current.selected = nearest.id;
        setSelZone(nearest);
      } else {
        stateRef.current.selected = null;
        setSelZone(null);
      }
      render();
    }

    let lastDist = 0;
    function onTouchStart(e) {
      if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else {
        const s = stateRef.current;
        s.dragging   = true;
        s.lastX      = e.touches[0].clientX; s.lastY      = e.touches[0].clientY;
        s.dragStartX = e.touches[0].clientX; s.dragStartY = e.touches[0].clientY;
      }
    }
    function onTouchMove(e) {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dist  = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const s = stateRef.current;
        s.scale = Math.min(8, Math.max(0.18, s.scale * (dist / lastDist)));
        lastDist = dist;
        render();
      } else {
        const s = stateRef.current;
        if (!s.dragging) return;
        s.tx += e.touches[0].clientX - s.lastX;
        s.ty += e.touches[0].clientY - s.lastY;
        s.lastX = e.touches[0].clientX; s.lastY = e.touches[0].clientY;
        render();
      }
    }
    function onTouchEnd() { stateRef.current.dragging = false; }

    canvas.addEventListener("wheel",      onWheel,      { passive: false });
    canvas.addEventListener("mousedown",  onMouseDown);
    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseup",    onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("click",      onClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("wheel",      onWheel);
      canvas.removeEventListener("mousedown",  onMouseDown);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseup",    onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("click",      onClick);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
    };
  }, [render]);

  // Fly to a zone from the nav panel
  function flyToZone(z) {
    const [cx, cy] = hexCenter(z.col, z.row);
    const s        = stateRef.current;
    const canvas   = canvasRef.current;
    if (!canvas) return;
    const ns = Math.min(8, s.minScale * 4.5);
    s.scale  = ns;
    s.tx     = -(cx + OX - WORLD_W / 2) * ns;
    s.ty     = -(cy + OY - WORLD_H / 2) * ns;
    stateRef.current.selected = z.id;
    setSelZone(z);
    render();
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>

      {/* ── Left nav panel ───────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: 170, zIndex: 10,
        background: "rgba(0,0,0,0.76)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex", flexDirection: "column",
        backdropFilter: "blur(8px)",
        overflowY: "auto",
      }}>
        {/* Title */}
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 11, color: "#22d3ee", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            🗺 Koloni-2
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", marginTop: 2 }}>
            Tre öar · {ZONER.length} zoner
          </div>
        </div>

        {/* Zoom reset */}
        <button
          onClick={() => { const s = stateRef.current; s.scale = s.minScale; s.tx = 0; s.ty = 0; render(); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
            background: "rgba(255,255,255,0.05)", border: "none",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer", textAlign: "left", width: "100%" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
          <span style={{ fontSize: 13 }}>🌍</span>
          <span style={{ fontSize: 10, color: "#fff", fontWeight: 600, fontFamily: "monospace" }}>Hela kartan</span>
        </button>

        {/* Island sections */}
        {ISLANDS.map(island => {
          const zones = ZONER.filter(z => z.o === island.name);
          return (
            <div key={island.name}>
              <div style={{ padding: "8px 14px 4px", fontSize: 9, color: island.color,
                fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                {island.emoji} {island.name}
              </div>
              {zones.map(z => (
                <button
                  key={z.id}
                  onClick={() => flyToZone(z)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px",
                    background: selZone?.id === z.id ? "rgba(255,255,255,0.13)" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}
                  onMouseEnter={e => { if (selZone?.id !== z.id) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { if (selZone?.id !== z.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 11 }}>{z.hamn ? "⚓" : TYP_IKON[z.typ]}</span>
                  <span style={{
                    fontSize: 9, fontFamily: "monospace",
                    color: z.hamn ? "#22d3ee" : "rgba(255,255,255,0.7)",
                    flex: 1, textAlign: "left", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                  }}>{z.namn}</span>
                </button>
              ))}
            </div>
          );
        })}

        {/* Railways legend */}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 14px 4px" }}>
          <div style={{ fontSize: 9, color: "#a78bfa", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
            🚂 Järnvägar
          </div>
          {RAILWAYS.map((rw, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 3, background: rw.color, borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>{rw.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────────── */}
      <canvas ref={canvasRef} style={{ display: "block", cursor: "grab", userSelect: "none" }} />

      {/* ── Zoom buttons ─────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {["+", "−", "⊡"].map((lbl, i) => (
          <button key={i}
            onClick={() => {
              const s = stateRef.current;
              if      (i === 0) s.scale = Math.min(8, s.scale * 1.25);
              else if (i === 1) s.scale = Math.max(0.18, s.scale * 0.8);
              else { s.scale = s.minScale; s.tx = 0; s.ty = 0; }
              render();
            }}
            style={{ width: 36, height: 36, borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── Info panel for selected zone ─────────────────────────────────── */}
      {selZone && (
        <div style={{
          position: "absolute", top: 16, left: 186,
          background: "rgba(0,0,0,0.90)", borderRadius: 10,
          border: `1px solid ${TYP_FARG[selZone.typ] || "#444"}`,
          padding: "14px 18px", minWidth: 210, maxWidth: 290,
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 26 }}>{selZone.hamn ? "⚓" : (TYP_IKON[selZone.typ] || "?")}</span>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{selZone.namn}</div>
              <div style={{ fontSize: 10, color: TYP_FARG[selZone.typ], textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {selZone.o} · {selZone.typ}
              </div>
            </div>
          </div>
          {selZone.hamn && (
            <div style={{ fontSize: 12, color: "#22d3ee", marginBottom: 8, display: "flex", gap: 6, alignItems: "center" }}>
              <span>⚓</span>
              <span>Aktiv hamn — handelsrutter tillgängliga</span>
            </div>
          )}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            {selZone.o === "NordÖn"  && "Nordlig bergig ö med silverfyndigheter och starka vindar."}
            {selZone.o === "ÖstÖn"   && "Lummig östlig ö med frodig skog och teknisk infrastruktur."}
            {selZone.o === "SydÖn"   && "Tropisk sydlig ö med bördiga marker och djungel."}
          </div>
          <button onClick={() => { stateRef.current.selected = null; setSelZone(null); render(); }}
            style={{ marginTop: 10, fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            × Stäng
          </button>
        </div>
      )}

      {/* ── Bottom hint ──────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
        fontSize: 11, color: "rgba(255,255,255,0.22)", pointerEvents: "none",
      }}>
        Scrolla/pinch för att zooma · Dra för att panorera · Klicka en zon för info
      </div>
    </div>
  );
}
