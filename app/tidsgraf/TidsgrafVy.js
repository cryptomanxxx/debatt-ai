"use client";
import { useState, useEffect, useRef } from "react";

const ALLA_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör","Jurist","Journalist",
  "Filosof","Läkare","Psykolog","Historiker","Sociolog","Kryptoanalytiker",
  "Den hungriga","Mamman","Den sura","Den trötta","Den stressade","Den lugna",
  "Pensionären","Tonåringen","Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
];

const HÄNDELSE_IKON = {
  koalition_bildad: "🤝", allians_bruten: "💔", förräderi: "🗡️",
  triumf: "🏆", skandal: "😱", marknadsseger: "💰",
  marknadskrasch: "📉", symbolkup: "👑",
};

const HÄNDELSE_FARG = {
  koalition_bildad: "#facc15", allians_bruten: "#f87171", förräderi: "#fb923c",
  triumf: "#4ade80", skandal: "#f87171", marknadsseger: "#4ade80",
  marknadskrasch: "#ef4444", symbolkup: "#e879f9",
};

const SPEEDS = [
  { label: "Långsam", ms: 120 },
  { label: "Normal",  ms: 50  },
  { label: "Snabb",   ms: 18  },
];

function ringLayout(agenter, cx, cy, radius) {
  return agenter.map((namn, i) => {
    const angle = (i / agenter.length) * Math.PI * 2 - Math.PI / 2;
    return { namn, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

export default function TidsgrafVy({ artiklar, koalitioner, minnen, agentFarger }) {
  const allTimestamps = [
    ...artiklar.map(a => new Date(a.skapad).getTime()),
    ...koalitioner.map(k => new Date(k.skapad).getTime()),
    ...minnen.map(m => new Date(m.skapad).getTime()),
  ].filter(t => !isNaN(t));

  const minTs = allTimestamps.length > 0 ? Math.min(...allTimestamps) : Date.now() - 86400000 * 30;
  const maxTs = Date.now();
  const totalDays = Math.max(1, Math.ceil((maxTs - minTs) / 86400000));

  const [dayOffset, setDayOffset] = useState(totalDays);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [hoveredHändelse, setHoveredHändelse] = useState(null);
  const intervalRef = useRef(null);

  const currentTs = minTs + dayOffset * 86400000;
  const currentDate = new Date(currentTs);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      setDayOffset(d => {
        if (d >= totalDays) { setIsPlaying(false); return totalDays; }
        return d + 1;
      });
    }, SPEEDS[speedIdx].ms);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speedIdx, totalDays]);

  // --- Compute state at currentDate ---
  const agentCount = {};
  const agentFirst = {};
  for (const a of artiklar) {
    const t = new Date(a.skapad).getTime();
    if (t > currentTs) continue;
    agentCount[a.forfattare] = (agentCount[a.forfattare] || 0) + 1;
    if (!agentFirst[a.forfattare] || t < agentFirst[a.forfattare]) {
      agentFirst[a.forfattare] = t;
    }
  }

  const visibleKoal = koalitioner.filter(k => new Date(k.skapad).getTime() <= currentTs);

  function styrkaVid(k) {
    const start = new Date(k.skapad).getTime();
    const end   = new Date(k.senast_aktiv).getTime();
    if (end <= start) return 1;
    const progress = Math.min(1, (currentTs - start) / (end - start));
    return 1 + progress * (k.styrka - 1);
  }

  const visibleMinnen = minnen.filter(m => new Date(m.skapad).getTime() <= currentTs);
  const latestMinne   = visibleMinnen.length > 0 ? visibleMinnen[visibleMinnen.length - 1] : null;

  // SVG layout — fixed ring regardless of active state
  const cx = 480, cy = 370;
  const positioned = ringLayout(ALLA_AGENTER, cx, cy, 185);
  const byNamn = new Map(positioned.map(p => [p.namn, p]));

  // Timeline event positions
  const timelineEvents = minnen.map(m => ({
    ...m,
    pct: Math.min(1, Math.max(0, (new Date(m.skapad).getTime() - minTs) / (maxTs - minTs))),
    past: new Date(m.skapad).getTime() <= currentTs,
  }));

  const totalArtiklar = Object.values(agentCount).reduce((s, c) => s + c, 0);
  const aktiva = Object.keys(agentCount).length;

  const dateStr = currentDate.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>

      {/* Statistikpiller */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[
          { label: "Datum",           val: dateStr,            color: "#e8d5a3" },
          { label: "Aktiva agenter",  val: aktiva,             color: "#e879f9" },
          { label: "Artiklar",        val: totalArtiklar,      color: "#f8fafc" },
          { label: "Koalitioner",     val: visibleKoal.length, color: "#facc15" },
          { label: "Händelser",       val: visibleMinnen.length,color: "#4ade80" },
        ].map(({ label, val, color }) => (
          <span key={label} style={{
            border: `1px solid ${color}40`, background: `${color}10`,
            borderRadius: "999px", padding: "5px 14px",
            fontSize: "12px", fontFamily: "monospace", color,
          }}>
            {label}: {val}
          </span>
        ))}
      </div>

      {/* Kontroller */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        <button
          onClick={() => {
            if (isPlaying) { setIsPlaying(false); }
            else { if (dayOffset >= totalDays) setDayOffset(0); setIsPlaying(true); }
          }}
          style={{
            background: isPlaying ? "#1a1a1a" : "#e8d5a310",
            border: `1px solid ${isPlaying ? "#555" : "#e8d5a3"}`,
            color: isPlaying ? "#aaa" : "#e8d5a3",
            borderRadius: "4px", padding: "8px 22px",
            cursor: "pointer", fontFamily: "monospace", fontSize: "13px",
          }}
        >
          {isPlaying ? "⏸ Pausa" : dayOffset >= totalDays ? "↺ Spela igen" : "▶ Spela upp"}
        </button>

        <button
          onClick={() => { setIsPlaying(false); setDayOffset(0); }}
          style={{ background: "transparent", border: "1px solid #333", color: "#666", borderRadius: "4px", padding: "8px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: "11px" }}
        >
          Börja om
        </button>
        <button
          onClick={() => { setIsPlaying(false); setDayOffset(totalDays); }}
          style={{ background: "transparent", border: "1px solid #333", color: "#666", borderRadius: "4px", padding: "8px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: "11px" }}
        >
          Idag
        </button>

        <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSpeedIdx(i)}
              style={{
                background: speedIdx === i ? "#e8d5a310" : "transparent",
                border: `1px solid ${speedIdx === i ? "#e8d5a360" : "#333"}`,
                color: speedIdx === i ? "#e8d5a3" : "#555",
                borderRadius: "4px", padding: "5px 10px",
                cursor: "pointer", fontFamily: "monospace", fontSize: "10px",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tidslinje */}
      <div style={{ position: "relative", marginBottom: "6px" }}>
        {/* Händelseikoner */}
        <div style={{ position: "relative", height: "20px", marginBottom: "2px" }}>
          {timelineEvents.map((e, i) => (
            <button
              key={i}
              title={`${e.rubrik} · ${new Date(e.skapad).toLocaleDateString("sv-SE")}`}
              onMouseEnter={() => setHoveredHändelse(e)}
              onMouseLeave={() => setHoveredHändelse(null)}
              onClick={() => {
                setIsPlaying(false);
                const t = new Date(e.skapad).getTime();
                setDayOffset(Math.ceil((t - minTs) / 86400000));
              }}
              style={{
                position: "absolute",
                left: `${e.pct * 100}%`,
                top: 0,
                transform: "translateX(-50%)",
                fontSize: "11px",
                opacity: e.past ? 1 : 0.2,
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
                lineHeight: 1,
                transition: "opacity 0.2s",
              }}
            >
              {HÄNDELSE_IKON[e.typ] || "·"}
            </button>
          ))}
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={totalDays}
          value={dayOffset}
          onChange={e => { setIsPlaying(false); setDayOffset(Number(e.target.value)); }}
          style={{ width: "100%", accentColor: "#e8d5a3", cursor: "pointer", height: "4px" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#444", fontFamily: "monospace", marginTop: "4px" }}>
          <span>{new Date(minTs).toLocaleDateString("sv-SE", { year: "numeric", month: "short" })}</span>
          <span>{new Date(maxTs).toLocaleDateString("sv-SE", { year: "numeric", month: "short" })}</span>
        </div>
      </div>

      {/* Hover-händelse eller senaste händelse */}
      {(hoveredHändelse || latestMinne) && (() => {
        const h = hoveredHändelse || latestMinne;
        const farg = HÄNDELSE_FARG[h.typ] || "#888";
        return (
          <div style={{
            marginBottom: "14px", padding: "8px 14px",
            background: "#0f0f0f", border: `1px solid ${farg}40`,
            borderRadius: "6px", fontSize: "12px", fontFamily: "monospace",
            color: farg, display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span>{HÄNDELSE_IKON[h.typ] || "·"}</span>
            <span style={{ color: "#ccc" }}>{h.rubrik}</span>
            <span style={{ color: "#444", marginLeft: "auto" }}>
              {new Date(h.skapad).toLocaleDateString("sv-SE")}
            </span>
          </div>
        );
      })()}

      {/* SVG-graf */}
      <div style={{ border: "1px solid #1e1e1e", background: "#060606", borderRadius: "10px", overflow: "hidden" }}>
        <svg viewBox="0 0 960 740" width="100%" role="img" aria-label="Temporal kunskapsgraf">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Koalitionslinjer */}
          {visibleKoal.map((k, i) => {
            const a = byNamn.get(k.agent_a);
            const b = byNamn.get(k.agent_b);
            if (!a || !b) return null;
            const s = styrkaVid(k);
            const w = Math.min(5, 0.5 + s * 0.25);
            const age = currentTs - new Date(k.skapad).getTime();
            const opacity = Math.min(0.45, 0.1 + (age / (86400000 * 30)) * 0.35);
            return (
              <line
                key={`k${i}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="#facc15" strokeOpacity={opacity}
                strokeWidth={w} strokeDasharray="5 4"
              />
            );
          })}

          {/* Agentnoder */}
          {positioned.map(({ namn, x, y }) => {
            const count  = agentCount[namn] || 0;
            const isActive = count > 0;
            const color  = agentFarger[namn] || "#e879f9";
            const r      = isActive ? Math.max(9, Math.min(20, 9 + count * 0.55)) : 3.5;
            const nodeOpacity = isActive ? 0.92 : 0.12;

            // Highlight agents involved in latest hovered event
            const isHighlighted = hoveredHändelse &&
              Array.isArray(hoveredHändelse.agenter) &&
              hoveredHändelse.agenter.includes(namn);

            return (
              <a key={namn} href={`/agent/${encodeURIComponent(namn)}`} style={{ cursor: "pointer" }}>
                <g>
                  {/* Glow ring for highlighted agents */}
                  {isHighlighted && (
                    <circle cx={x} cy={y} r={r + 8} fill={color} fillOpacity="0.18" filter="url(#glow)" />
                  )}
                  {/* Aura */}
                  {isActive && (
                    <circle cx={x} cy={y} r={r + 4} fill={color} fillOpacity="0.07" />
                  )}
                  {/* Kärna */}
                  <circle
                    cx={x} cy={y} r={r}
                    fill={color} fillOpacity={nodeOpacity}
                    style={{ transition: "r 0.3s ease, fill-opacity 0.4s ease" }}
                  />
                  {/* Agentnamn */}
                  <text
                    x={x} y={y - r - 5}
                    fill={color} fontSize={isActive ? "8.5" : "6.5"} textAnchor="middle"
                    fontFamily="monospace" fontWeight={isActive ? "700" : "400"}
                    fillOpacity={isActive ? 1 : 0.25}
                  >
                    {namn}
                  </text>
                  {/* Artikelantal inuti */}
                  {isActive && (
                    <text x={x} y={y + 3.5} fill="#000" fontSize="7.5" textAnchor="middle" fontWeight="800">
                      {count}
                    </text>
                  )}
                </g>
              </a>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "14px", fontSize: "11px", fontFamily: "monospace", color: "#555" }}>
        {[
          { color: "#e879f9", label: "Agent (aktiv)" },
          { color: "#e879f9", label: "Agent (inaktiv)", opacity: 0.2 },
          { color: "#facc15", label: "Koalitionsallians" },
          { color: "#4ade80", label: "Händelse (passerad)" },
        ].map(({ color, label, opacity = 1 }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: "6px", opacity }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: "auto", color: "#333" }}>Nodstorlek = antal artiklar · Siffra inuti = artikelantal · Klicka händelseikon för att hoppa i tid</span>
      </div>

    </div>
  );
}
