"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";

// ── Världskonfiguration ──────────────────────────────────────────────────────
// 15 regioner i ett 5×3 rutnät. Världen täcker hela canvasen sömlöst.
const GRID_COLS = 5;
const GRID_ROWS = 3;

// Hex-konstanter
const R   = 44;
const S3  = Math.sqrt(3);
const GAP = 14;
const BW  = 7;

// Världens hex-dimensioner (GRID_COLS * HEX_PER_REGION_COL × GRID_ROWS * HEX_PER_REGION_ROW)
const HEX_COLS = 20;   // 5 regioner × 4 hex/region
const HEX_ROWS = 15;   // 3 regioner × 5 hex/region

// ── Regioner ─────────────────────────────────────────────────────────────────
const REGIONS = [
  // 7 färger (A–G) placerade enligt 4-färgsteoremet: inga grannar delar färg
  // Grid: A D B G E / F C G A D / B E D C A
  // rad 0 — nord
  { id: "r01", gridCol: 0, gridRow: 0, namn: "Arktis",       fallback: "#c7e8f7", ring: "#fb2c3b", ikon: "❄️" }, // A röd
  { id: "r02", gridCol: 1, gridRow: 0, namn: "Barrskog",     fallback: "#1a472a", ring: "#00d46a", ikon: "🌲" }, // D grön
  { id: "r03", gridCol: 2, gridRow: 0, namn: "Klipphöjder",  fallback: "#6b5c4e", ring: "#ff6b00", ikon: "🏔️" }, // B orange
  { id: "r04", gridCol: 3, gridRow: 0, namn: "Tundra",       fallback: "#b0c4b1", ring: "#b44dff", ikon: "🌾" }, // G lila
  { id: "r05", gridCol: 4, gridRow: 0, namn: "Glaciärvik",   fallback: "#a8d8ea", ring: "#00d4f5", ikon: "🧊" }, // E cyan
  // rad 1 — mitten
  { id: "r06", gridCol: 0, gridRow: 1, namn: "Fjordkust",    fallback: "#2e5f6e", ring: "#4090ff", ikon: "🌊" }, // F blå
  { id: "r07", gridCol: 1, gridRow: 1, namn: "Odlingsland",  fallback: "#8bc34a", ring: "#ffcc00", ikon: "🌾" }, // C gul
  { id: "r08", gridCol: 2, gridRow: 1, namn: "Storstad",     fallback: "#607d8b", ring: "#b44dff", ikon: "🏰" }, // G lila
  { id: "r09", gridCol: 3, gridRow: 1, namn: "Stäpp",        fallback: "#c8a96e", ring: "#fb2c3b", ikon: "🌵" }, // A röd
  { id: "r10", gridCol: 4, gridRow: 1, namn: "Vulkanrev",    fallback: "#7b2d00", ring: "#00d46a", ikon: "🌋" }, // D grön
  // rad 2 — syd
  { id: "r11", gridCol: 0, gridRow: 2, namn: "Mangrovkust",  fallback: "#1b5e20", ring: "#ff6b00", ikon: "🌿" }, // B orange
  { id: "r12", gridCol: 1, gridRow: 2, namn: "Djungel",      fallback: "#2e7d32", ring: "#00d4f5", ikon: "🌴" }, // E cyan
  { id: "r13", gridCol: 2, gridRow: 2, namn: "Floddelta",    fallback: "#33691e", ring: "#00d46a", ikon: "💧" }, // D grön
  { id: "r14", gridCol: 3, gridRow: 2, namn: "Rödöknen",     fallback: "#bf360c", ring: "#ffcc00", ikon: "🏜️" }, // C gul
  { id: "r15", gridCol: 4, gridRow: 2, namn: "Korallkust",   fallback: "#006064", ring: "#fb2c3b", ikon: "🐚" }, // A röd
];

// ── Hex-tile definitioner ────────────────────────────────────────────────────
// Varje hex tilldelas automatiskt en region baserat på sin kolumn/rad-position
function hexRegion(col, row) {
  const regionCol = Math.floor(col / (HEX_COLS / GRID_COLS));
  const regionRow = Math.floor(row / (HEX_ROWS / GRID_ROWS));
  const idx = Math.min(regionRow, GRID_ROWS - 1) * GRID_COLS + Math.min(regionCol, GRID_COLS - 1);
  return REGIONS[idx] || REGIONS[0];
}

// Generera alla hex-tiles som täcker hela världen
const TILES = [];
for (let row = 0; row < HEX_ROWS; row++) {
  for (let col = 0; col < HEX_COLS; col++) {
    TILES.push({ col, row, id: `${col}-${row}`, region: hexRegion(col, row) });
  }
}

// ── Hex-hjälpare ──────────────────────────────────────────────────────────────
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

function drawLabel(ctx, cx, cy, tile, scale) {
  if (scale < 0.4) return;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "rgba(0,0,0,0.9)";
  ctx.shadowBlur   = 3 / scale;
  ctx.fillStyle    = "#fff";
  ctx.font         = `${scale >= 0.9 ? 16 : 11}px sans-serif`;
  ctx.fillText(tile.region.ikon, cx, cy);
  ctx.shadowBlur   = 0;
}

// ── Huvudkomponent ────────────────────────────────────────────────────────────
export default function TileKarta2() {
  const canvasRef  = useRef(null);
  const regionImgs = useRef({});   // laddade region-bilder
  const stateRef   = useRef({
    tx: 0, ty: 0, scale: 0.3,
    dragging: false, lastX: 0, lastY: 0, vx: 0, vy: 0,
    selected: null, dragStartX: 0, dragStartY: 0,
    rafId: null,
    pinchDist: null,
    minScale: 0.1,   // uppdateras av ResizeObserver till "hela världen på skärmen"
  });
  const [info, setInfo]     = useState(null);
  const [loaded, setLoaded] = useState(0);   // räknar laddade bilder

  // Beräkna world-bounds
  const { worldW, worldH, ox, oy } = useMemo(() => {
    const centers = TILES.map(t => hexCenter(t.col, t.row));
    const minX = Math.min(...centers.map(c => c[0]));
    const maxX = Math.max(...centers.map(c => c[0]));
    const minY = Math.min(...centers.map(c => c[1]));
    const maxY = Math.max(...centers.map(c => c[1]));
    return {
      worldW: maxX - minX + R * 2,
      worldH: maxY - minY + R * 2,
      ox: -minX + R,
      oy: -minY + R,
    };
  }, []);

  // Ladda region-bilder
  useEffect(() => {
    let n = 0;
    REGIONS.forEach((reg, i) => {
      const img = new Image();
      img.onload  = () => { regionImgs.current[reg.id] = img; setLoaded(++n); };
      img.onerror = () => { regionImgs.current[reg.id] = null; setLoaded(++n); };
      img.src     = `/regions/region-${String(i + 1).padStart(2, "0")}.png`;
    });
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.width  / dpr;
    const H   = canvas.height / dpr;
    const { tx, ty, scale } = stateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Hav utanför världen ──────────────────────────────────────────────────
    const ocean = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
    );
    ocean.addColorStop(0, "#17405e");
    ocean.addColorStop(1, "#061525");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(tx + W / 2, ty + H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-worldW / 2, -worldH / 2);

    // ── Region-bakgrunder ────────────────────────────────────────────────────
    const rw = worldW / GRID_COLS;
    const rh = worldH / GRID_ROWS;

    REGIONS.forEach((reg) => {
      const rx = reg.gridCol * rw;
      const ry = reg.gridRow * rh;
      const img = regionImgs.current[reg.id];
      if (img) {
        ctx.drawImage(img, rx, ry, rw, rh);
      } else {
        ctx.fillStyle = reg.fallback;
        ctx.fillRect(rx, ry, rw, rh);
      }
    });

    // ── Hex-grid (evenodd) ───────────────────────────────────────────────────
    const selId = stateRef.current.selected;
    for (const t of TILES) {
      const [cx, cy] = hexCenter(t.col, t.row);
      const isSelected = selId === t.id;
      ctx.beginPath();
      hexSubPath(ctx, cx + ox, cy + oy, R - GAP);
      hexSubPath(ctx, cx + ox, cy + oy, R - BW - GAP);
      ctx.fillStyle   = isSelected ? "#ffffff" : t.region.ring;
      ctx.globalAlpha = isSelected ? 1.0 : 0.75;
      ctx.fill("evenodd");
      ctx.globalAlpha = 1.0;
    }

    // ── Ikoner/etiketter ─────────────────────────────────────────────────────
    for (const t of TILES) {
      const [cx, cy] = hexCenter(t.col, t.row);
      drawLabel(ctx, cx + ox, cy + oy, t, scale);
    }

    // ── Regionnamn-overlay vid utzoom ─────────────────────────────────────────
    // Tonas in mellan scale 0.8 → 0.4, fullt synlig under 0.4
    if (scale < 0.8) {
      const alpha = Math.min(1, (0.8 - scale) / 0.35);
      ctx.save();
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      REGIONS.forEach((reg) => {
        const cx = reg.gridCol * rw + rw / 2;
        const cy = reg.gridRow * rh + rh / 2;
        const fs = Math.round(Math.min(28, rw * 0.07) / scale);
        ctx.font        = `bold ${fs}px sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.95)";
        ctx.shadowBlur  = 8 / scale;
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = "#ffffff";
        ctx.fillText(`${reg.ikon} ${reg.namn}`, cx, cy);
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
      ctx.restore();
    }

    ctx.restore();
  }, [worldW, worldH, ox, oy]);

  // Omrita när bilder laddas
  useEffect(() => { render(); }, [loaded, render]);

  // ── Canvas setup + ResizeObserver ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      // Minsta zoom = hela världen synlig med liten marginal
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const fit = Math.min(W / worldW, H / worldH) * 0.97;
      const s = stateRef.current;
      s.minScale = fit;
      if (s.scale < fit) { s.scale = fit; s.tx = 0; s.ty = 0; }
      render();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [render, worldW, worldH]);

  // ── Momentum RAF ──────────────────────────────────────────────────────────
  const startMomentum = useCallback(() => {
    const s = stateRef.current;
    if (s.rafId) cancelAnimationFrame(s.rafId);
    const step = () => {
      s.vx *= 0.88; s.vy *= 0.88;
      if (Math.abs(s.vx) < 0.3 && Math.abs(s.vy) < 0.3) { s.rafId = null; return; }
      s.tx += s.vx; s.ty += s.vy;
      render();
      s.rafId = requestAnimationFrame(step);
    };
    s.rafId = requestAnimationFrame(step);
  }, [render]);

  // ── Mus-händelser ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    const s = stateRef.current;
    if (s.rafId) { cancelAnimationFrame(s.rafId); s.rafId = null; }
    s.dragging = true; s.lastX = e.clientX; s.lastY = e.clientY;
    s.dragStartX = e.clientX; s.dragStartY = e.clientY;
    s.vx = 0; s.vy = 0;
  }, []);

  const onMouseMove = useCallback((e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.vx = e.clientX - s.lastX; s.vy = e.clientY - s.lastY;
    s.tx += s.vx; s.ty += s.vy;
    s.lastX = e.clientX; s.lastY = e.clientY;
    render();
  }, [render]);

  const onMouseUp = useCallback((e) => {
    const s = stateRef.current;
    s.dragging = false;
    const dx = e.clientX - s.dragStartX, dy = e.clientY - s.dragStartY;
    if (Math.sqrt(dx * dx + dy * dy) < 6) handleClick(e.clientX, e.clientY);
    else startMomentum();
  }, [startMomentum]); // eslint-disable-line

  // ── Touch-händelser (drag + pinch-zoom) ───────────────────────────────────
  const onTouchStart = useCallback((e) => {
    const s = stateRef.current;
    if (s.rafId) { cancelAnimationFrame(s.rafId); s.rafId = null; }
    if (e.touches.length === 2) {
      // Starta pinch-zoom
      s.dragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      s.pinchDist = Math.sqrt(dx * dx + dy * dy);
      return;
    }
    const t = e.touches[0];
    s.dragging = true; s.lastX = t.clientX; s.lastY = t.clientY;
    s.dragStartX = t.clientX; s.dragStartY = t.clientY;
    s.vx = 0; s.vy = 0;
  }, []);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const s = stateRef.current;
    if (e.touches.length === 2) {
      // Pinch-zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (s.pinchDist) {
        const ratio = dist / s.pinchDist;
        s.scale = Math.max(s.minScale, Math.min(4, s.scale * ratio));
        render();
      }
      s.pinchDist = dist;
      return;
    }
    if (!s.dragging) return;
    const t = e.touches[0];
    s.vx = t.clientX - s.lastX; s.vy = t.clientY - s.lastY;
    s.tx += s.vx; s.ty += s.vy;
    s.lastX = t.clientX; s.lastY = t.clientY;
    render();
  }, [render]);

  const onTouchEnd = useCallback((e) => {
    const s = stateRef.current;
    if (e.touches.length < 2) s.pinchDist = null;
    if (e.touches.length > 0) return;   // kvar med ett finger — vänta
    s.dragging = false;
    if (e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const dx = t.clientX - s.dragStartX, dy = t.clientY - s.dragStartY;
      if (Math.sqrt(dx * dx + dy * dy) < 6) handleClick(t.clientX, t.clientY);
      else startMomentum();
    }
  }, [startMomentum]); // eslint-disable-line

  // ── Klick → välj hex ──────────────────────────────────────────────────────
  function handleClick(clientX, clientY) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr   = window.devicePixelRatio || 1;
    const rect  = canvas.getBoundingClientRect();
    const { tx, ty, scale } = stateRef.current;
    const W = canvas.width / dpr, H = canvas.height / dpr;
    const wx = ((clientX - rect.left - tx - W / 2) / scale) + worldW / 2 - ox;
    const wy = ((clientY - rect.top  - ty - H / 2) / scale) + worldH / 2 - oy;

    let nearest = null, nearestDist = Infinity;
    for (const t of TILES) {
      const [cx, cy] = hexCenter(t.col, t.row);
      const d = Math.sqrt((wx - cx) ** 2 + (wy - cy) ** 2);
      if (d < nearestDist) { nearest = t; nearestDist = d; }
    }
    if (nearest && nearestDist < R - GAP) {
      stateRef.current.selected = stateRef.current.selected === nearest.id ? null : nearest.id;
      setInfo(stateRef.current.selected ? { tile: nearest } : null);
    } else {
      stateRef.current.selected = null;
      setInfo(null);
    }
    render();
  }

  // ── Scroll-zoom ────────────────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const s = stateRef.current;
    const delta = e.deltaY < 0 ? 1.1 : 0.91;
    s.scale = Math.max(s.minScale, Math.min(4, s.scale * delta));
    render();
  }, [render]);

  const zoom = (delta) => {
    const s = stateRef.current;
    s.scale = Math.max(s.minScale, Math.min(4, s.scale * delta));
    render();
  };

  // Zooma in och centrera en region med animering
  const zoomToRegion = useCallback((reg) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const rw = worldW / GRID_COLS;
    const rh = worldH / GRID_ROWS;
    const cx = reg.gridCol * rw + rw / 2;
    const cy = reg.gridRow * rh + rh / 2;
    const targetScale = Math.min(W / rw, H / rh) * 0.78;
    const clampedScale = Math.max(stateRef.current.minScale, Math.min(4, targetScale));
    const targetTx = (worldW / 2 - cx) * clampedScale;
    const targetTy = (worldH / 2 - cy) * clampedScale;
    const s = stateRef.current;
    if (s.rafId) cancelAnimationFrame(s.rafId);
    const startScale = s.scale, startTx = s.tx, startTy = s.ty;
    const dur = 380, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      s.scale = startScale + (clampedScale - startScale) * e;
      s.tx    = startTx    + (targetTx    - startTx)    * e;
      s.ty    = startTy    + (targetTy    - startTy)    * e;
      render();
      s.rafId = p < 1 ? requestAnimationFrame(step) : null;
    };
    s.rafId = requestAnimationFrame(step);
  }, [worldW, worldH, render]);

  // Zooma ut och visa hela civilisationen
  const zoomToWorld = useCallback(() => {
    const s = stateRef.current;
    if (s.rafId) cancelAnimationFrame(s.rafId);
    const startScale = s.scale, startTx = s.tx, startTy = s.ty;
    const targetScale = s.minScale, targetTx = 0, targetTy = 0;
    const dur = 420, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      s.scale = startScale + (targetScale - startScale) * e;
      s.tx    = startTx    + (targetTx    - startTx)    * e;
      s.ty    = startTy    + (targetTy    - startTy)    * e;
      render();
      s.rafId = p < 1 ? requestAnimationFrame(step) : null;
    };
    s.rafId = requestAnimationFrame(step);
  }, [render]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      />

      {/* Zoom-knappar */}
      <div style={{ position: "absolute", bottom: 20, right: 20, display: "flex", flexDirection: "column", gap: 6 }}>
        {[["＋", 1.25], ["－", 0.8]].map(([lbl, d]) => (
          <button key={lbl} onClick={() => zoom(d)} style={{
            width: 36, height: 36, borderRadius: 6,
            background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1,
          }}>{lbl}</button>
        ))}
      </div>

      {/* Region-legend — klickbar, finger-vänlig */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        background: "rgba(0,0,0,0.78)", borderRadius: 12,
        padding: "4px",
        display: "flex", flexDirection: "column", gap: 0,
        maxHeight: "calc(100% - 80px)", overflowY: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}>
        {/* Civilisations-knapp — zoomar ut till hela världen */}
        <button
          onClick={zoomToWorld}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
            borderRadius: 8, textAlign: "left",
            minHeight: 46, minWidth: 150,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 2,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.16)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        >
          <span style={{ fontSize: 15 }}>🌍</span>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
            Hela civilisationen
          </span>
        </button>

        {REGIONS.map(r => (
          <button
            key={r.id}
            onClick={() => zoomToRegion(r)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px",
              background: "none", border: "none", cursor: "pointer",
              borderRadius: 8, textAlign: "left",
              minHeight: 46, minWidth: 150,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <span style={{
              width: 13, height: 13, borderRadius: 3, flexShrink: 0,
              background: r.ring, boxShadow: `0 0 6px ${r.ring}88`,
            }} />
            <span style={{ fontSize: 13, color: "#e5e7eb", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
              {r.ikon} {r.namn}
            </span>
          </button>
        ))}
      </div>

      {/* Info-panel för vald hex */}
      {info && (
        <div style={{
          position: "absolute", bottom: 20, left: 20,
          background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 10, padding: "10px 14px", minWidth: 160,
        }}>
          <div style={{ color: "#f3f4f6", fontWeight: 700, marginBottom: 4 }}>
            {info.tile.region.ikon} {info.tile.region.namn}
          </div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>
            Hex {info.tile.col}, {info.tile.row}
          </div>
          <button onClick={() => { stateRef.current.selected = null; setInfo(null); render(); }}
            style={{
              marginTop: 8, fontSize: 11, color: "#9ca3af",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
            × Stäng
          </button>
        </div>
      )}
    </div>
  );
}
