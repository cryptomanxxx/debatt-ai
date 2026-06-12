"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";

// ── Världskonfiguration ──────────────────────────────────────────────────────
// 15 regioner i ett 5×3 rutnät. Världen täcker hela canvasen sömlöst.
const GRID_COLS = 5;
const GRID_ROWS = 3;

// Hex-konstanter — halverade mot original för tätare, mer storslagen civilisation
const R   = 22;
const S3  = Math.sqrt(3);
const GAP = 7;
const BW  = 3;

// Världens hex-dimensioner — dubbla mot original, världen behåller samma fysiska storlek
// men har 4× fler hexagoner (40×30 = 1200 st istället för 20×15 = 300 st)
const HEX_COLS = 40;
const HEX_ROWS = 30;

// ── Kontinenter — nivå 1 i 3-nivå-hierarkin ──────────────────────────────────
// Varje kontinent grupperar 5 regioner och har egen valuta.
// labelSeed: [hexCol, hexRow] = var kontinent-etiketten visas vid utzoom.
const CONTINENTS = [
  {
    id: "c01", namn: "Nordheim",  ikon: "❄️", valuta: "Iskrona",
    ring: "#93c5fd", labelSeed: [20, 4],
    regionIds: ["r01","r02","r03","r04","r05"],
  },
  {
    id: "c02", namn: "Midgard",   ikon: "⚔️", valuta: "Guldmark",
    ring: "#86efac", labelSeed: [20, 14],
    regionIds: ["r06","r07","r08","r09","r10"],
  },
  {
    id: "c03", namn: "Sydlandet", ikon: "🌴", valuta: "Solreal",
    ring: "#fcd34d", labelSeed: [20, 24],
    regionIds: ["r11","r12","r13","r14","r15"],
  },
];


// seed: [col, row] = Voronoi-frö — hexar tilldelas närmaste frö → oregelbundna gränser
// gridCol/gridRow används bara för bakgrundsbild-placering (5×3 layout)
const REGIONS = [
  // rad 0 — nord (seeds dubblade för det dubbla hex-rutnätet)
  { id: "r01", continentId: "c01", seed: [ 2,  2], gridCol: 0, gridRow: 0, namn: "Arktis",      fallback: "#c7e8f7", ring: "#fb2c3b", ikon: "❄️"  },
  { id: "r02", continentId: "c01", seed: [10,  6], gridCol: 1, gridRow: 0, namn: "Barrskog",    fallback: "#1a472a", ring: "#00d46a", ikon: "🌲"  },
  { id: "r03", continentId: "c01", seed: [20,  0], gridCol: 2, gridRow: 0, namn: "Klipphöjder", fallback: "#6b5c4e", ring: "#ff6b00", ikon: "🏔️" },
  { id: "r04", continentId: "c01", seed: [30,  4], gridCol: 3, gridRow: 0, namn: "Tundra",      fallback: "#b0c4b1", ring: "#b44dff", ikon: "🌾"  },
  { id: "r05", continentId: "c01", seed: [36,  2], gridCol: 4, gridRow: 0, namn: "Glaciärvik",  fallback: "#a8d8ea", ring: "#00d4f5", ikon: "🧊"  },
  // rad 1 — mitten
  { id: "r06", continentId: "c02", seed: [ 0, 16], gridCol: 0, gridRow: 1, namn: "Fjordkust",   fallback: "#2e5f6e", ring: "#4090ff", ikon: "🌊"  },
  { id: "r07", continentId: "c02", seed: [12, 14], gridCol: 1, gridRow: 1, namn: "Odlingsland", fallback: "#8bc34a", ring: "#ffcc00", ikon: "🌾"  },
  { id: "r08", continentId: "c02", seed: [20, 18], gridCol: 2, gridRow: 1, namn: "Storstad",    fallback: "#607d8b", ring: "#b44dff", ikon: "🏰"  },
  { id: "r09", continentId: "c02", seed: [30, 16], gridCol: 3, gridRow: 1, namn: "Stäpp",       fallback: "#c8a96e", ring: "#fb2c3b", ikon: "🌵"  },
  { id: "r10", continentId: "c02", seed: [38, 14], gridCol: 4, gridRow: 1, namn: "Vulkanrev",   fallback: "#7b2d00", ring: "#00d46a", ikon: "🌋"  },
  // rad 2 — syd
  { id: "r11", continentId: "c03", seed: [ 2, 26], gridCol: 0, gridRow: 2, namn: "Mangrovkust", fallback: "#1b5e20", ring: "#ff6b00", ikon: "🌿"  },
  { id: "r12", continentId: "c03", seed: [10, 24], gridCol: 1, gridRow: 2, namn: "Djungel",     fallback: "#2e7d32", ring: "#00d4f5", ikon: "🌴"  },
  { id: "r13", continentId: "c03", seed: [20, 28], gridCol: 2, gridRow: 2, namn: "Floddelta",   fallback: "#33691e", ring: "#00d46a", ikon: "💧"  },
  { id: "r14", continentId: "c03", seed: [30, 28], gridCol: 3, gridRow: 2, namn: "Rödöknen",    fallback: "#bf360c", ring: "#ffcc00", ikon: "🏜️" },
  { id: "r15", continentId: "c03", seed: [38, 26], gridCol: 4, gridRow: 2, namn: "Korallkust",  fallback: "#006064", ring: "#fb2c3b", ikon: "🐚"  },
];

// ── Hex-tile definitioner ────────────────────────────────────────────────────
// Voronoi: varje hex tilldelas regionen vars frö är närmast (kvadratisk avstånd)
function hexRegion(col, row) {
  const [px, py] = hexCenter(col, row);
  let nearest = REGIONS[0], nearestD = Infinity;
  for (const reg of REGIONS) {
    const [sx, sy] = hexCenter(reg.seed[0], reg.seed[1]);
    const d = (px - sx) ** 2 + (py - sy) ** 2;
    if (d < nearestD) { nearest = reg; nearestD = d; }
  }
  return nearest;
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

function drawLabel(ctx, cx, cy, tile, scale, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha  = alpha;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "rgba(0,0,0,0.9)";
  ctx.shadowBlur   = 3 / scale;
  ctx.fillStyle    = "#fff";
  ctx.font         = `${scale >= 1.8 ? 11 : 8}px sans-serif`;
  ctx.fillText(tile.region.ikon, cx, cy);
  ctx.shadowBlur   = 0;
  ctx.globalAlpha  = 1;
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
    const { tx, ty, scale, minScale: ms } = stateRef.current;

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

    // ── Hex-grid (evenodd) — Level of Detail ────────────────────────────────
    // zoomRatio = scale / ms:  1 = hela civilisationen (minzoom), 4+ = fastighetsnivå
    // hexAlpha: 0 vid zoomRatio ≤ 1.2, 0.75 vid zoomRatio ≥ 3.5 (linjär emellan)
    const selId    = stateRef.current.selected;
    const hexAlpha = Math.max(0, Math.min(0.75, (scale / ms - 1.2) / 2.3 * 0.75));
    for (const t of TILES) {
      const isSelected = selId === t.id;
      if (!isSelected && hexAlpha <= 0) continue;   // hoppa över om helt osynliga
      const [cx, cy] = hexCenter(t.col, t.row);
      ctx.beginPath();
      hexSubPath(ctx, cx + ox, cy + oy, R - GAP);
      hexSubPath(ctx, cx + ox, cy + oy, R - BW - GAP);
      ctx.fillStyle   = isSelected ? "#ffffff" : t.region.ring;
      ctx.globalAlpha = isSelected ? 1.0 : hexAlpha;
      ctx.fill("evenodd");
      ctx.globalAlpha = 1.0;
    }

    // ── Ikoner/etiketter — tonas in med samma alpha som hexringarna ──────────
    if (hexAlpha > 0) {
      for (const t of TILES) {
        const [cx, cy] = hexCenter(t.col, t.row);
        drawLabel(ctx, cx + ox, cy + oy, t, scale, hexAlpha);
      }
    }

    // ── Regionnamn-overlay vid utzoom ─────────────────────────────────────────
    // Alla trösklar är relativa till ms (minScale) så de fungerar på alla skärmstorlekar.
    // Tonas in: ms×5.5 → ms×3.5. Tonas ut: ms×2.2 → ms×1.6 (ger plats åt kontinent).
    const regShow  = ms * 5.5;   // region pills börjar visas vid detta scale
    const regFadeS = ms * 2.2;   // region pills börjar tona ut (kontinent tar över)
    const regGone  = ms * 1.6;   // region pills helt borta
    if (scale < regShow) {
      const fadeIn  = Math.min(1, (regShow - scale) / (regShow * 0.36));
      const fadeOut = scale < regFadeS ? Math.max(0, (scale - regGone) / (regFadeS - regGone)) : 1;
      const alpha   = fadeIn * fadeOut;
      ctx.save();
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur   = 0;

      // Förberäkna pill-geometri för alla regioner
      const pills = REGIONS.map((reg) => {
        const [scx, scy] = hexCenter(reg.seed[0], reg.seed[1]);
        const cx = scx + ox;
        const cy = scy + oy;
        const fs = Math.round(Math.min(26, rw * 0.065) / scale);
        ctx.font = `bold ${fs}px sans-serif`;
        const text = `${reg.ikon} ${reg.namn}`;
        const tw   = ctx.measureText(text).width;
        const pad  = 7 / scale;
        const bw   = tw + pad * 2;
        const bh   = fs * 1.45;
        return { cx, cy, fs, text, bw, bh, bx: cx - bw / 2, by: cy - bh / 2, rad: bh / 2 };
      });

      // Pass 1: alla pill-bakgrunder (så ingen nästa pills vita yta täcker föregående text)
      ctx.globalAlpha = alpha * 0.82;
      ctx.fillStyle   = "#ffffff";
      pills.forEach(({ bx, by, bw, bh, rad }) => {
        ctx.beginPath();
        ctx.moveTo(bx + rad, by);
        ctx.lineTo(bx + bw - rad, by);
        ctx.arc(bx + bw - rad, by + rad, rad, -Math.PI / 2, 0);
        ctx.lineTo(bx + bw, by + bh - rad);
        ctx.arc(bx + bw - rad, by + bh - rad, rad, 0, Math.PI / 2);
        ctx.lineTo(bx + rad, by + bh);
        ctx.arc(bx + rad, by + bh - rad, rad, Math.PI / 2, Math.PI);
        ctx.lineTo(bx, by + rad);
        ctx.arc(bx + rad, by + rad, rad, Math.PI, -Math.PI / 2);
        ctx.closePath();
        ctx.fill();
      });

      // Pass 2: all text ovanpå (aldrig täckt av en efterföljande pill)
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = "#111111";
      pills.forEach(({ cx, cy, fs, text }) => {
        ctx.font = `bold ${fs}px sans-serif`;
        ctx.fillText(text, cx, cy);
      });

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // ── Kontinent-etiketter vid maximal utzoom ────────────────────────────────
    // Relativa trösklar: tonas in ms×2.2 → ms×1.3. Atlas-stil: stor kursiv text.
    const contShow = ms * 2.2;   // continent labels börjar visas
    const contFull = ms * 1.3;   // continent labels fullt synliga
    if (scale < contShow) {
      const alpha = Math.min(1, (contShow - scale) / (contShow - contFull));
      ctx.save();
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      CONTINENTS.forEach((c) => {
        const [scx, scy] = hexCenter(c.labelSeed[0], c.labelSeed[1]);
        const lx = scx + ox;
        const ly = scy + oy;
        const fs = Math.round(Math.min(44, worldH * 0.068) / scale);
        // Huvudrubrik: kontinent-namn versaler
        ctx.font        = `italic bold ${fs}px Georgia, serif`;
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur  = 7 / scale;
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = "#ffffff";
        ctx.fillText(c.namn.toUpperCase(), lx, ly - fs * 0.55);
        // Undertext: ikon + valuta
        const subFs = Math.round(fs * 0.46);
        ctx.font        = `${subFs}px sans-serif`;
        ctx.shadowBlur  = 4 / scale;
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle   = c.ring;
        ctx.fillText(`${c.ikon}  ${c.valuta}`, lx, ly + fs * 0.55);
      });
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
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
        s.scale = Math.max(s.minScale, Math.min(8, s.scale * ratio));
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
    s.scale = Math.max(s.minScale, Math.min(8, s.scale * delta));
    render();
  }, [render]);

  const zoom = (delta) => {
    const s = stateRef.current;
    s.scale = Math.max(s.minScale, Math.min(8, s.scale * delta));
    render();
  };

  // Zooma in och centrera en hel kontinent med animering
  const zoomToContinent = useCallback((cont) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const rh = worldH / GRID_ROWS;
    const firstReg = REGIONS.find(r => r.id === cont.regionIds[0]);
    const gridRow  = firstReg ? firstReg.gridRow : 0;
    const cx = worldW / 2;                          // alltid horisontellt centrerat
    const cy = gridRow * rh + rh / 2;
    const targetScale  = Math.min(W / worldW, H / rh) * 0.82;
    const clampedScale = Math.max(stateRef.current.minScale, Math.min(8, targetScale));
    const targetTx = 0;                             // (worldW/2 - cx) * scale = 0
    const targetTy = (worldH / 2 - cy) * clampedScale;
    const s = stateRef.current;
    if (s.rafId) cancelAnimationFrame(s.rafId);
    const startScale = s.scale, startTx = s.tx, startTy = s.ty;
    const dur = 400, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      s.scale = startScale + (clampedScale - startScale) * e;
      s.tx    = startTx    + (targetTx    - startTx)    * e;
      s.ty    = startTy    + (targetTy    - startTy)    * e;
      render();
      s.rafId = p < 1 ? requestAnimationFrame(step) : null;
    };
    s.rafId = requestAnimationFrame(step);
  }, [worldW, worldH, render]);

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
    const clampedScale = Math.max(stateRef.current.minScale, Math.min(8, targetScale));
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

        {CONTINENTS.map((c) => (
          <div key={c.id}>
            {/* Kontinent-rubrik — klickbar, zoomar till hela kontinenten */}
            <button
              onClick={() => zoomToContinent(c)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px 5px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                borderLeft: "none", borderRight: "none", borderBottom: "none",
                background: "none", cursor: "pointer",
                borderRadius: 6, width: "100%", textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${c.ring}18`}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span style={{
                display: "inline-block", width: 10, height: 10,
                borderRadius: 2, background: c.ring, flexShrink: 0,
                boxShadow: `0 0 5px ${c.ring}`,
              }} />
              <span style={{ fontSize: 11, color: c.ring, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {c.ikon} {c.namn}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginLeft: "auto", whiteSpace: "nowrap" }}>
                {c.valuta}
              </span>
            </button>
            {/* Regioner under denna kontinent */}
            {REGIONS.filter(r => r.continentId === c.id).map(r => (
              <button
                key={r.id}
                onClick={() => zoomToRegion(r)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px 8px 28px",
                  background: "none", border: "none", cursor: "pointer",
                  borderRadius: 8, textAlign: "left",
                  width: "100%", minHeight: 40,
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{
                  width: 11, height: 11, borderRadius: 3, flexShrink: 0,
                  background: r.ring, boxShadow: `0 0 5px ${r.ring}88`,
                }} />
                <span style={{ fontSize: 12, color: "#d1d5db", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
                  {r.ikon} {r.namn}
                </span>
              </button>
            ))}
          </div>
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
