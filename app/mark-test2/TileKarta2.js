"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";

// ── Konstanter ──────────────────────────────────────────────────────────────────
const R   = 44;
const S3  = Math.sqrt(3);
const GAP = 14;   // shrinkage: synlig ytterradie = R - GAP
const BW  = 7;    // ringbredd i världskoordinater

const REGION_FARG = {
  nv:    "#22d3ee",   // NV-ön  – cyan
  no:    "#4ade80",   // NO-ön  – grön
  soder: "#f59e0b",   // Sydön  – amber
};
const REGION_NAMN = { nv: "NV-ön", no: "NO-ön", soder: "Sydön" };
const REGION_IKON = { nv: "🏔️",   no: "🌿",    soder: "🏖️"   };

// ── Tile-definitioner (handplacerade per ö) ─────────────────────────────────────
// Varje rad anger vilka kolumner som är land på respektive ö.
// Justera cols-listor om hexar hamnar i vattnet eller saknas på land.
const TILE_DEFS = [
  // NV-ön (cyan) — vänster ö med snöklädda berg
  { region: "nv", row: 0,  cols: [1,2,3,4,5]       },
  { region: "nv", row: 1,  cols: [0,1,2,3,4,5]     },
  { region: "nv", row: 2,  cols: [0,1,2,3,4,5]     },
  { region: "nv", row: 3,  cols: [0,1,2,3,4]       },
  { region: "nv", row: 4,  cols: [0,1,2,3,4]       },
  { region: "nv", row: 5,  cols: [0,1,2,3]         },
  { region: "nv", row: 6,  cols: [0,1,2]           },

  // NO-ön (grön) — höger ö, trimmat till col 11 max (13-14 var i havet)
  // rad 0 borttagen (molnen/havet ovanför ön)
  { region: "no", row: 1,  cols: [8,9,10,11]          },
  { region: "no", row: 2,  cols: [7,8,9,10,11]        },
  { region: "no", row: 3,  cols: [6,7,8,9,10,11]      },
  { region: "no", row: 4,  cols: [7,8,9,10,11]        },
  { region: "no", row: 5,  cols: [7,8,9,10,11]        },
  { region: "no", row: 6,  cols: [7,8,9,10]           },

  // Sydön (amber) — stora södra ön, rad 7 utökad till col 13 för rätt bildbredd
  { region: "soder", row: 7,  cols: [2,3,4,5,6,7,8,9,10,11,12,13] },
  { region: "soder", row: 8,  cols: [2,3,4,5,6,7,8,9,10,11,12]    },
  { region: "soder", row: 9,  cols: [2,3,4,5,6,7,8,9,10,11]       },
  { region: "soder", row: 10, cols: [3,4,5,6,7,8,9,10]            },
  { region: "soder", row: 11, cols: [4,5,6,7,8,9]                 },
  { region: "soder", row: 12, cols: [5,6,7,8]                     },
];

const TILES = TILE_DEFS.flatMap(({ region, row, cols }) =>
  cols.map(col => ({ col, row, region, id: `${region}-${col}-${row}` }))
);

// ── Hexhjälpare ─────────────────────────────────────────────────────────────────
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
  if (scale < 0.55) return;
  const ikon = REGION_IKON[tile.region] || "•";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "rgba(0,0,0,0.85)";
  ctx.shadowBlur   = 3 / scale;
  ctx.fillStyle    = "#fff";
  ctx.font         = `${scale >= 1.1 ? 18 : 13}px sans-serif`;
  ctx.fillText(ikon, cx, cy);
  ctx.shadowBlur = 0;
}

// ── Huvudkomponent ──────────────────────────────────────────────────────────────
export default function TileKarta2() {
  const canvasRef = useRef(null);
  const bgImgRef  = useRef(null);
  const stateRef  = useRef({
    tx: 0, ty: 0, scale: 1,
    dragging: false, lastX: 0, lastY: 0, vx: 0, vy: 0,
    selected: null, dragStartX: 0, dragStartY: 0,
  });
  const [info, setInfo] = useState(null);

  // Beräkna world bounds från tile-positionerna
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

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d");
    const dpr   = window.devicePixelRatio || 1;
    const W     = canvas.width  / dpr;
    const H     = canvas.height / dpr;
    const { tx, ty, scale } = stateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Bakgrundsbild ───────────────────────────────────────────────────────────
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(tx + W / 2, ty + H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-worldW / 2, -worldH / 2);

    const bg = bgImgRef.current;
    if (bg?.complete && bg.naturalWidth > 0) {
      ctx.drawImage(bg, -R * 2, -R * 2, worldW + R * 4, worldH + R * 4);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, worldH);
      grad.addColorStop(0, "#0c1445");
      grad.addColorStop(1, "#050510");
      ctx.fillStyle = grad;
      ctx.fillRect(-R * 2, -R * 2, worldW + R * 4, worldH + R * 4);
    }
    ctx.restore();

    // ── Hex-grid (evenodd fill) ─────────────────────────────────────────────────
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(tx + W / 2, ty + H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-worldW / 2, -worldH / 2);

    const selId = stateRef.current.selected;
    for (const t of TILES) {
      const [cx, cy] = hexCenter(t.col, t.row);
      const color = selId === t.id ? "#ffffff" : (REGION_FARG[t.region] || "#888");
      ctx.beginPath();
      hexSubPath(ctx, cx + ox, cy + oy, R - GAP);
      hexSubPath(ctx, cx + ox, cy + oy, R - BW - GAP);
      ctx.fillStyle = color;
      ctx.fill("evenodd");
    }
    ctx.restore();

    // ── Etiketter ───────────────────────────────────────────────────────────────
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(tx + W / 2, ty + H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-worldW / 2, -worldH / 2);

    for (const t of TILES) {
      const [cx, cy] = hexCenter(t.col, t.row);
      drawLabel(ctx, cx + ox, cy + oy, t, scale);
    }
    ctx.restore();
  }, [worldW, worldH, ox, oy]);

  // Ladda bakgrundsbild
  useEffect(() => {
    const img = new Image();
    img.src = "/mark-test2.png";
    img.onload = () => { bgImgRef.current = img; render(); };
    bgImgRef.current = img;
  }, [render]);

  // RAF-loop för momentumrullning
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

  // Canvas setup + händelselyssnare
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
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = `${W}px`;
      canvas.style.height = `${H}px`;
      if (!initialized && H > 200) {
        initialized = true;
        stateRef.current.scale = Math.min(W / worldW, H / worldH) * 0.97;
        stateRef.current.tx = 0;
        stateRef.current.ty = 0;
      }
      render();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    function onWheel(e) {
      e.preventDefault();
      const s = stateRef.current;
      const CW = canvas.clientWidth, CH = canvas.clientHeight;
      const r  = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left - CW / 2;
      const my = e.clientY - r.top  - CH / 2;
      const factor = e.deltaY < 0 ? 1.1 : 0.91;
      const ns = Math.min(4, Math.max(0.2, s.scale * factor));
      s.tx = mx - (mx - s.tx) * (ns / s.scale);
      s.ty = my - (my - s.ty) * (ns / s.scale);
      s.scale = ns;
      render();
    }

    function onMouseDown(e) {
      const s = stateRef.current;
      s.dragging = true;
      s.lastX = e.clientX; s.lastY = e.clientY;
      s.dragStartX = e.clientX; s.dragStartY = e.clientY;
      s.vx = 0; s.vy = 0;
    }
    function onMouseMove(e) {
      const s = stateRef.current;
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX, dy = e.clientY - s.lastY;
      s.tx += dx; s.ty += dy;
      s.vx = dx; s.vy = dy;
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

      const CW = canvas.clientWidth, CH = canvas.clientHeight;
      const r  = canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left - CW / 2 - s.tx) / s.scale + worldW / 2 - ox;
      const my = (e.clientY - r.top  - CH / 2 - s.ty) / s.scale + worldH / 2 - oy;

      let nearest = null, nearestDist = Infinity;
      for (const t of TILES) {
        const [cx, cy] = hexCenter(t.col, t.row);
        const d = Math.hypot(mx - cx, my - cy);
        if (d < nearestDist) { nearestDist = d; nearest = t; }
      }
      if (nearest && nearestDist < R - GAP) {
        stateRef.current.selected = nearest.id;
        setInfo(nearest);
      } else {
        stateRef.current.selected = null;
        setInfo(null);
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
        s.dragging = true;
        s.lastX = e.touches[0].clientX; s.lastY = e.touches[0].clientY;
        s.dragStartX = e.touches[0].clientX; s.dragStartY = e.touches[0].clientY;
      }
    }
    function onTouchMove(e) {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const s = stateRef.current;
        s.scale = Math.min(4, Math.max(0.2, s.scale * dist / lastDist));
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

    canvas.addEventListener("wheel",      onWheel,     { passive: false });
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
  }, [render, worldW, worldH, ox, oy]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block", cursor: "grab", userSelect: "none" }} />

      {/* Zoom-knappar */}
      <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {["+", "−", "⊡"].map((lbl, i) => (
          <button key={i}
            onClick={() => {
              const s = stateRef.current;
              if (i === 0) s.scale = Math.min(4, s.scale * 1.25);
              else if (i === 1) s.scale = Math.max(0.2, s.scale * 0.8);
              else { s.scale = Math.min(canvasRef.current?.clientWidth / worldW, canvasRef.current?.clientHeight / worldH) * 0.97; s.tx = 0; s.ty = 0; }
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

      {/* Region-legend */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(0,0,0,0.75)", borderRadius: 8,
        padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6,
        backdropFilter: "blur(6px)",
      }}>
        {Object.entries(REGION_NAMN).map(([key, namn]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fff" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: REGION_FARG[key], display: "inline-block" }} />
            <span>{REGION_IKON[key]} {namn}</span>
          </div>
        ))}
      </div>

      {/* Info-panel vid vald tile */}
      {info && (
        <div style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(0,0,0,0.85)", border: `1px solid ${REGION_FARG[info.region] || "#444"}`,
          borderRadius: 10, padding: "14px 18px", minWidth: 200,
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{REGION_IKON[info.region]}</span>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{REGION_NAMN[info.region]}</div>
              <div style={{ fontSize: 11, color: REGION_FARG[info.region], letterSpacing: "0.07em" }}>
                col {info.col}, rad {info.row}
              </div>
            </div>
          </div>
          <button onClick={() => { stateRef.current.selected = null; setInfo(null); render(); }}
            style={{ marginTop: 6, fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            × Stäng
          </button>
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        fontSize: 11, color: "rgba(255,255,255,0.25)", pointerEvents: "none",
      }}>
        Scrolla för att zooma · Dra för att panorera · Klicka på en hex för info
      </div>
    </div>
  );
}
