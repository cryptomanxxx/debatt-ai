"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { AGENT_VISUELL } from "../agentData";

// ── Konstanter ─────────────────────────────────────────────────────────────────
const R   = 44;          // hex-radie i världskoordinater
const S3  = Math.sqrt(3);
const SB  = "https://fmwxftnistkoqazfwnuj.supabase.co";

const TYP_FARG = {
  energi:   "#f59e0b", jordbruk: "#22c55e", industri: "#3b82f6",
  gruva:    "#ea580c", stad:     "#9333ea", kust:     "#0891b2",
  skog:     "#16a34a",
};
const TYP_IKON = {
  energi: "⚡", jordbruk: "🌾", industri: "🏭",
  gruva:  "⛏️", stad: "🏙️",  kust: "🌊",  skog: "🌲",
};
const TYP_GRADIENT = {
  energi:   ["#fef9c3", "#f59e0b", "#78350f"],
  jordbruk: ["#dcfce7", "#22c55e", "#14532d"],
  industri: ["#dbeafe", "#3b82f6", "#1e3a8a"],
  gruva:    ["#ffedd5", "#ea580c", "#7c2d12"],
  stad:     ["#ede9fe", "#9333ea", "#3b0764"],
  kust:     ["#ecfeff", "#0891b2", "#0c4a6e"],
  skog:     ["#f0fdf4", "#16a34a", "#14532d"],
};

// Bakgrundszoner som fyller ut kartan utanför de riktiga zonerna
const WILDERNESS = [
  { typ: "kust",     col: -1, row: 0 }, { typ: "kust",    col: -1, row: 1 },
  { typ: "kust",     col: -1, row: 2 }, { typ: "kust",    col: -1, row: 3 },
  { typ: "kust",     col: -1, row: 4 }, { typ: "kust",    col: -1, row: 5 },
  { typ: "skog",     col: 7,  row: 0 }, { typ: "skog",    col: 7,  row: 1 },
  { typ: "skog",     col: 7,  row: 2 }, { typ: "skog",    col: 7,  row: 3 },
  { typ: "jordbruk", col: 0,  row: -1},{ typ: "jordbruk", col: 1,  row: -1},
  { typ: "jordbruk", col: 2,  row: -1},{ typ: "jordbruk", col: 3,  row: -1},
  { typ: "jordbruk", col: 4,  row: -1},{ typ: "jordbruk", col: 5,  row: -1},
  { typ: "kust",     col: 0,  row: 6 },{ typ: "kust",     col: 1,  row: 6 },
  { typ: "kust",     col: 2,  row: 6 },{ typ: "kust",     col: 3,  row: 6 },
  { typ: "kust",     col: 4,  row: 6 },{ typ: "kust",     col: 5,  row: 6 },
  { typ: "skog",     col: 6,  row: -1},{ typ: "energi",   col: 7,  row: 4 },
  { typ: "jordbruk", col: -1, row: -1},{ typ: "skog",     col: 7,  row: 5 },
  { typ: "kust",     col: -2, row: 1 },{ typ: "kust",     col: -2, row: 2 },
  { typ: "kust",     col: -2, row: 3 },{ typ: "kust",     col: -2, row: 4 },
  { typ: "skog",     col: 8,  row: 0 },{ typ: "skog",     col: 8,  row: 1 },
  { typ: "skog",     col: 8,  row: 2 },{ typ: "jordbruk", col: 8,  row: 3 },
];

// ── Hexhjälpare ────────────────────────────────────────────────────────────────
function hexCenter(col, row) {
  return [
    R * S3 * (col + (row % 2 === 1 ? 0.5 : 0)),
    R * 1.5 * row,
  ];
}

function hexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function lerp(a, b, t) { return a + (b - a) * t; }

// ── Ritfunktioner ──────────────────────────────────────────────────────────────
function drawTile(ctx, cx, cy, typ, selected, scale) {
  const [c0, c1, c2] = TYP_GRADIENT[typ] || ["#222", "#444", "#666"];

  // Radialgradienten ger en 3D-kulform per tile
  const grd = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.1, cx, cy, R * 1.1);
  grd.addColorStop(0,   c0);
  grd.addColorStop(0.5, c1);
  grd.addColorStop(1,   c2);

  hexPath(ctx, cx, cy, R - 1);
  ctx.fillStyle = grd;
  ctx.fill();

  // Kant
  hexPath(ctx, cx, cy, R - 1);
  ctx.strokeStyle = selected ? "#ffffff" : "rgba(255,255,255,0.15)";
  ctx.lineWidth   = selected ? 2.5 / scale : 1 / scale;
  ctx.stroke();

  // Subtil inre glans (övre kant)
  hexPath(ctx, cx, cy, R - 2);
  const glans = ctx.createLinearGradient(cx, cy - R, cx, cy);
  glans.addColorStop(0, "rgba(255,255,255,0.22)");
  glans.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = glans;
  ctx.fill();
}

function drawLabel(ctx, cx, cy, zon, scale) {
  const ikon = TYP_IKON[zon.typ] || "?";

  if (scale >= 1.5) {
    // Hög zoom: ikon + namn + ägare
    ctx.font      = `bold ${14 / scale}px sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur  = 4 / scale;

    // Namn
    ctx.fillText(zon.namn || "", cx, cy - 6 / scale);
    // Ikon
    ctx.font = `${18 / scale}px sans-serif`;
    ctx.fillText(ikon, cx, cy + 10 / scale);
    ctx.shadowBlur = 0;

    // Ägare-badge
    if (zon.agare) {
      const agFarg = AGENT_VISUELL[zon.agare]?.ikonFarg || "#fff";
      ctx.font      = `${10 / scale}px sans-serif`;
      ctx.fillStyle = agFarg;
      ctx.fillText(zon.agare, cx, cy + 24 / scale);
    }
  } else if (scale >= 0.7) {
    // Medel-zoom: ikon + kortnamn
    ctx.font         = `${16 / scale}px sans-serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor  = "rgba(0,0,0,0.8)";
    ctx.shadowBlur   = 3 / scale;
    ctx.fillStyle    = "#fff";
    ctx.fillText(ikon, cx, cy);
    ctx.shadowBlur = 0;
  } else {
    // Låg zoom: bara ikon, liten
    ctx.font         = `${12 / scale}px sans-serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle    = "rgba(255,255,255,0.7)";
    ctx.fillText(ikon, cx, cy);
  }
}

function drawOwnerDot(ctx, cx, cy, agare, scale) {
  if (!agare) return;
  const color = AGENT_VISUELL[agare]?.ikonFarg || "#fff";
  const x = cx + R * 0.55, y = cy - R * 0.55;
  const r = Math.max(4, 9 / scale);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, color + "88");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.lineWidth   = 0.8 / scale;
  ctx.stroke();
}

// ── Huvudkomponent ─────────────────────────────────────────────────────────────
export default function TileKarta({ zoner = [], agare = [] }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ tx: 0, ty: 0, scale: 1, dragging: false, lastX: 0, lastY: 0, vx: 0, vy: 0, selected: null, raf: null });
  const [selected, setSelected] = useState(null);
  const [info, setInfo] = useState(null);

  // Bygg agare-map — memoized så allTiles inte byggs om vid varje setState
  const agareMap = useMemo(
    () => Object.fromEntries(agare.map(a => [a.zon_id, a.agent])),
    [agare]
  );

  // Bygg alla tiles (riktiga + wilderness) — memoized för att undvika
  // att canvas setup-effekten körs om (och nollställer zoom) vid klick
  const allTiles = useMemo(() => [
    ...zoner.map(z => ({
      col: z.hex_col, row: z.hex_row,
      typ: z.typ, namn: z.namn,
      koppris: z.koppris, veckoinkomst: z.veckoinkomst,
      id: z.id, agare: agareMap[z.id] || null,
      real: true,
    })),
    ...WILDERNESS.map((w, i) => ({
      col: w.col, row: w.row, typ: w.typ,
      namn: null, id: `w${i}`, agare: null, real: false,
    })),
  ], [zoner, agareMap]);

  // Beräkna world bounds för initial centrering — memoized av samma skäl
  const { worldW, worldH, ox, oy } = useMemo(() => {
    const centers = allTiles.map(t => hexCenter(t.col, t.row));
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
  }, [allTiles]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d");
    const dpr   = window.devicePixelRatio || 1;
    const W     = canvas.width  / dpr;
    const H     = canvas.height / dpr;
    const { tx, ty, scale } = stateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bakgrund
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#050510");
    bg.addColorStop(1, "#0a0a1a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(tx + W / 2, ty + H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-worldW / 2, -worldH / 2);

    // Rita wilderness-tiles först (botten)
    for (const t of allTiles) {
      if (t.real) continue;
      const [cx, cy] = hexCenter(t.col, t.row);
      drawTile(ctx, cx + ox, cy + oy, t.typ, false, scale);
    }

    // Rita riktiga tiles ovanpå
    for (const t of allTiles) {
      if (!t.real) continue;
      const [cx, cy] = hexCenter(t.col, t.row);
      const sel = stateRef.current.selected === t.id;
      drawTile(ctx, cx + ox, cy + oy, t.typ, sel, scale);
      drawOwnerDot(ctx, cx + ox, cy + oy, t.agare, scale);
      drawLabel(ctx, cx + ox, cy + oy, t, scale);
    }

    // Glödeffekt på selected tile
    const selTile = allTiles.find(t => t.id === stateRef.current.selected && t.real);
    if (selTile) {
      const [cx, cy] = hexCenter(selTile.col, selTile.row);
      hexPath(ctx, cx + ox, cy + oy, R + 4);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth   = 2 / scale;
      ctx.shadowColor = "#fff";
      ctx.shadowBlur  = 18 / scale;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, [allTiles, worldW, worldH, ox, oy]);

  // RAF-loop för momentumrullning
  useEffect(() => {
    let running = true;
    function loop() {
      if (!running) return;
      const s = stateRef.current;
      if (!s.dragging && (Math.abs(s.vx) > 0.1 || Math.abs(s.vy) > 0.1)) {
        s.tx += s.vx;
        s.ty += s.vy;
        s.vx *= 0.88;
        s.vy *= 0.88;
        render();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [render]);

  // Canvas setup + händelselyssnare
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const W = parent.clientWidth;
    const H = parent.clientHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    // Initial zoom så hela kartan syns
    const scaleX = W / worldW; const scaleY = H / worldH; stateRef.current.scale = Math.min(scaleX, scaleY) * 0.85; useState(() => { const s = stateRef.current; s.scale = Math.min(scaleX, scaleY) * 0.85; });
    const scaleY = H / worldH;
    stateRef.current.scale = Math.min(scaleX, scaleY) * 0.85;
    render();

    // Scroll → zoom
    function onWheel(e) {
      e.preventDefault();
      const s   = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const r   = canvas.getBoundingClientRect();
      const mx  = (e.clientX - r.left - W / 2);
      const my  = (e.clientY - r.top  - H / 2);
      const factor = e.deltaY < 0 ? 1.1 : 0.91;
      const ns = Math.min(4, Math.max(0.25, s.scale * factor));
      s.tx = mx - (mx - s.tx) * (ns / s.scale);
      s.ty = my - (my - s.ty) * (ns / s.scale);
      s.scale = ns;
      render();
    }

    // Drag
    function onMouseDown(e) {
      const s = stateRef.current;
      s.dragging = true;
      s.lastX = e.clientX; s.lastY = e.clientY;
      s.vx = 0; s.vy = 0;
    }
    function onMouseMove(e) {
      const s = stateRef.current;
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.tx += dx; s.ty += dy;
      s.vx = dx; s.vy = dy;
      s.lastX = e.clientX; s.lastY = e.clientY;
      render();
    }
    function onMouseUp() { stateRef.current.dragging = false; }

    // Click → välj zon
    function onClick(e) {
      const s   = stateRef.current;
      const r   = canvas.getBoundingClientRect();
      // Omvandla skärmpunkt → världspunkt
      const mx  = (e.clientX - r.left - W / 2 - s.tx) / s.scale + worldW / 2 - ox;
      const my  = (e.clientY - r.top  - H / 2 - s.ty) / s.scale + worldH / 2 - oy;

      let nearest = null, nearestDist = Infinity;
      for (const t of allTiles) {
        if (!t.real) continue;
        const [cx, cy] = hexCenter(t.col, t.row);
        const d = Math.hypot(mx - cx, my - cy);
        if (d < nearestDist) { nearestDist = d; nearest = t; }
      }
      if (nearest && nearestDist < R * 1.2) {
        stateRef.current.selected = nearest.id;
        setSelected(nearest.id);
        setInfo(nearest);
      } else {
        stateRef.current.selected = null;
        setSelected(null);
        setInfo(null);
      }
      render();
    }

    // Touch
    let lastDist = 0, lastTX = 0, lastTY = 0;
    function onTouchStart(e) {
      if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else {
        const s = stateRef.current;
        s.dragging = true;
        s.lastX = e.touches[0].clientX;
        s.lastY = e.touches[0].clientY;
      }
    }
    function onTouchMove(e) {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / lastDist;
        const s = stateRef.current;
        s.scale = Math.min(4, Math.max(0.25, s.scale * factor));
        lastDist = dist;
        render();
      } else {
        const s = stateRef.current;
        if (!s.dragging) return;
        s.tx += e.touches[0].clientX - s.lastX;
        s.ty += e.touches[0].clientY - s.lastY;
        s.lastX = e.touches[0].clientX;
        s.lastY = e.touches[0].clientY;
        render();
      }
    }
    function onTouchEnd() { stateRef.current.dragging = false; }

    canvas.addEventListener("wheel",       onWheel,     { passive: false });
    canvas.addEventListener("mousedown",   onMouseDown);
    canvas.addEventListener("mousemove",   onMouseMove);
    canvas.addEventListener("mouseup",     onMouseUp);
    canvas.addEventListener("mouseleave",  onMouseUp);
    canvas.addEventListener("click",       onClick);
    canvas.addEventListener("touchstart",  onTouchStart, { passive: true });
    canvas.addEventListener("touchmove",   onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",    onTouchEnd);

    return () => {
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
  }, [render, worldW, worldH, ox, oy, allTiles]);

  useEffect(() => { render(); }, [zoner, agare, render]);

  const C = "#111827";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block", cursor: "grab", userSelect: "none" }} />

      {/* Zoom-knappar */}
      <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {["+", "−", "⊡"].map((lbl, i) => (
          <button key={i}
            onClick={() => {
              const s = stateRef.current;
              if (i === 0) s.scale = Math.min(4, s.scale * 1.25);
              else if (i === 1) s.scale = Math.max(0.25, s.scale * 0.8);
              else { s.scale = 1; s.tx = 0; s.ty = 0; }
              render();
            }}
            style={{
              width: 36, height: 36, borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Info-panel vid vald zon */}
      {info && (
        <div style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(0,0,0,0.85)", border: `1px solid ${TYP_FARG[info.typ] || "#444"}`,
          borderRadius: 10, padding: "14px 18px", minWidth: 220, maxWidth: 280,
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{TYP_IKON[info.typ] || "?"}</span>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{info.namn}</div>
              <div style={{ fontSize: 11, color: TYP_FARG[info.typ], textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {info.typ}
              </div>
            </div>
          </div>
          {info.koppris && (
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>
              💰 Köppris: <span style={{ color: "#fbbf24" }}>{info.koppris} kr</span>
            </div>
          )}
          {info.veckoinkomst && (
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>
              📈 Veckoinkomst: <span style={{ color: "#34d399" }}>{info.veckoinkomst} kr</span>
            </div>
          )}
          {info.agare ? (
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
              👤 Ägare: <span style={{ color: AGENT_VISUELL[info.agare]?.ikonFarg || "#fff" }}>{info.agare}</span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Ingen ägare ännu</div>
          )}
          <button onClick={() => { stateRef.current.selected = null; setInfo(null); render(); }}
            style={{ marginTop: 10, fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            × Stäng
          </button>
        </div>
      )}

      {/* Zoom-hint */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        fontSize: 11, color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>
        Scrolla för att zooma · Dra för att panorera · Klicka på en zon för info
      </div>
    </div>
  );
}
