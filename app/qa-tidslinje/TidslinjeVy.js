"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#f0ede6", muted: "#888880", dim: "#555550",
  green: "#4ade80", yellow: "#facc15", red: "#f87171",
  blue: "#60a5fa", accent: "#e879f9",
};

function statusFarg(s) {
  if (s === "OK")     return C.green;
  if (s === "FEL")    return C.red;
  return C.yellow;
}

const HASTIGHETER = [
  { label: "Långsam", ms: 2500 },
  { label: "Normal",  ms: 1200 },
  { label: "Snabb",   ms: 500  },
];

function SlideshowPanel({ frames, sida }) {
  const [idx, setIdx]           = useState(0);
  const [spelar, setSpelar]     = useState(false);
  const [hastighetIdx, setHast] = useState(1);
  const timerRef                = useRef(null);

  const total = frames.length;
  const frame = frames[idx] ?? null;
  const ms    = HASTIGHETER[hastighetIdx].ms;

  const nästa = useCallback(() => setIdx(i => (i + 1) % total), [total]);
  const förra = useCallback(() => setIdx(i => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spelar && total > 1) {
      timerRef.current = setInterval(nästa, ms);
    }
    return () => clearInterval(timerRef.current);
  }, [spelar, ms, nästa, total]);

  if (!frame) return null;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{sida.namn}</span>
          <span style={{ color: C.dim, fontSize: 11, marginLeft: 8 }}>{sida.path}</span>
        </div>
        <span style={{
          fontSize: 10, padding: "2px 7px", borderRadius: 4,
          background: `${statusFarg(frame.status)}22`,
          color: statusFarg(frame.status),
          border: `1px solid ${statusFarg(frame.status)}44`,
        }}>
          {frame.status}
        </span>
      </div>

      {/* Bild */}
      <div style={{ position: "relative", background: "#000", aspectRatio: "16/10" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={frame.vecka}
          src={`data:image/png;base64,${frame.bild}`}
          alt={`${sida.namn} vecka ${frame.vecka}`}
          style={{
            width: "100%", height: "100%",
            objectFit: "contain", display: "block",
            transition: "opacity 0.25s",
          }}
        />

        {/* Vecka-badge */}
        <div style={{
          position: "absolute", bottom: 10, right: 12,
          background: "rgba(0,0,0,0.72)", borderRadius: 4,
          padding: "3px 8px", fontSize: 11, color: C.muted,
        }}>
          {frame.vecka} · {idx + 1}/{total}
        </div>

        {/* Pil-knappar */}
        {total > 1 && (
          <>
            <button onClick={förra} style={pilStyle("left")} aria-label="Föregående">‹</button>
            <button onClick={nästa} style={pilStyle("right")} aria-label="Nästa">›</button>
          </>
        )}
      </div>

      {/* Kontroller */}
      <div style={{
        padding: "10px 14px", borderTop: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        {/* Play/Pause */}
        {total > 1 && (
          <button
            onClick={() => setSpelar(s => !s)}
            style={{
              background: spelar ? "#27272a" : C.blue,
              color: spelar ? C.muted : "#000",
              border: "none", borderRadius: 5, padding: "4px 14px",
              fontSize: 12, cursor: "pointer", fontFamily: "monospace",
            }}
          >
            {spelar ? "⏸ Pausa" : "▶ Spela"}
          </button>
        )}

        {/* Hastighet */}
        {total > 1 && (
          <div style={{ display: "flex", gap: 4 }}>
            {HASTIGHETER.map((h, i) => (
              <button
                key={h.label}
                onClick={() => setHast(i)}
                style={{
                  background: hastighetIdx === i ? "#27272a" : "transparent",
                  color: hastighetIdx === i ? C.text : C.dim,
                  border: `1px solid ${hastighetIdx === i ? C.border : "transparent"}`,
                  borderRadius: 4, padding: "2px 8px", fontSize: 11,
                  cursor: "pointer", fontFamily: "monospace",
                }}
              >
                {h.label}
              </button>
            ))}
          </div>
        )}

        {/* Scrubber */}
        {total > 1 && (
          <input
            type="range" min={0} max={total - 1} value={idx}
            onChange={e => { setSpelar(false); setIdx(+e.target.value); }}
            style={{ flex: 1, minWidth: 60, accentColor: C.blue, cursor: "pointer" }}
          />
        )}

        {/* GIF-länk */}
        <a
          href={`/api/qa-tidslinje-gif?path=${encodeURIComponent(sida.path)}`}
          download={`${sida.path.replace("/", "")}-tidslinje.gif`}
          style={{
            fontSize: 11, color: C.accent, textDecoration: "none",
            padding: "2px 8px", border: `1px solid ${C.accent}44`,
            borderRadius: 4, whiteSpace: "nowrap",
          }}
        >
          ↓ Ladda ner GIF
        </a>
      </div>

      {/* Vecko-dots */}
      {total > 1 && total <= 20 && (
        <div style={{
          padding: "6px 14px 10px", display: "flex", gap: 4, flexWrap: "wrap",
        }}>
          {frames.map((f, i) => (
            <button
              key={f.vecka}
              onClick={() => { setSpelar(false); setIdx(i); }}
              title={f.vecka}
              style={{
                width: 8, height: 8, borderRadius: "50%", border: "none",
                cursor: "pointer", padding: 0,
                background: i === idx
                  ? statusFarg(f.status)
                  : `${statusFarg(f.status)}44`,
                transition: "background 0.15s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function pilStyle(dir) {
  return {
    position: "absolute",
    [dir]: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    width: 28,
    height: 40,
    fontSize: 20,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  };
}

export default function TidslinjeVy({ data, sidor }) {
  const aktiva = sidor.filter(s => (data[s.path]?.length ?? 0) > 0);
  const totalVeckor = Math.max(...aktiva.map(s => data[s.path].length), 0);

  return (
    <div>
      {/* Statsrad */}
      <div style={{
        display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap",
      }}>
        {[
          { label: "Sidor med historik", val: aktiva.length },
          { label: "Veckor sparade",     val: totalVeckor },
          { label: "Totalt bilder",      val: aktiva.reduce((a, s) => a + data[s.path].length, 0) },
        ].map(({ label, val }) => (
          <div key={label}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.blue }}>{val}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
        gap: 20,
      }}>
        {aktiva.map(sida => (
          <SlideshowPanel
            key={sida.path}
            frames={data[sida.path]}
            sida={sida}
          />
        ))}
      </div>

      {/* Sidor utan historik */}
      {aktiva.length < sidor.length && (
        <div style={{
          marginTop: 32, padding: "16px 20px",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, fontSize: 12, color: C.muted,
        }}>
          <strong style={{ color: C.text }}>Väntar på historik:</strong>{" "}
          {sidor.filter(s => !aktiva.includes(s)).map(s => s.namn).join(", ")}
          {" "}— dyker upp efter nästa QA-körning (måndag).
        </div>
      )}
    </div>
  );
}
