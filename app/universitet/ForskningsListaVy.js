"use client";
import { useState } from "react";
import { AGENTER } from "../nyhetskallor/AgentOverlay";

const ORAKLET_FARG = AGENTER.Oraklet.farg;

const DISCIPLIN_FARG = {
  ekonomi:           "#22d3ee",
  politik:           "#818cf8",
  sociologi:         "#a78bfa",
  kryptovetenskap:   "#fb923c",
  beteendevetenskap: "#f472b6",
  "AI-etik":         "#c084fc",
  statsvetenskap:    "#38bdf8",
  miljövetenskap:    "#34d399",
};

const IMPAKT_BADGE = {
  genombrottsfynd: { label: "GENOMBROTT", c: "#f59e0b", bg: "#1a1000" },
};

function TagPill({ label, count, active, onClick, farg }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? farg + "22" : "transparent",
        border: `1px solid ${active ? farg + "88" : "#0d2040"}`,
        color: active ? farg : "#1e4a80",
        borderRadius: "999px",
        padding: "6px 14px",
        fontSize: "11px",
        fontFamily: "monospace",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.6 }}>{count}</span>
    </button>
  );
}

// En rad per fynd — datum, rubrik och författare syns alltid; resten (sammanfattning,
// metodologi, arXiv-källa) döljs bakom "Expandera" så listan förblir kompakt och
// kronologiskt skannbar istället för att fyllas av stora kort.
function RadFynd({ fynd, onLasa }) {
  const [open, setOpen] = useState(false);
  const badge = IMPAKT_BADGE[fynd.impakt];
  const farg = DISCIPLIN_FARG[fynd.disciplin] || "#38bdf8";
  const datum = fynd.skapad
    ? new Date(fynd.skapad).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric", timeZone: "Europe/Stockholm" })
    : "";
  const forfattare = [fynd.forskare, ...(fynd.medforskare || [])].filter(Boolean).join(", ");

  return (
    <div style={{ borderBottom: "1px solid #0d2040", padding: "14px 0" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}
      >
        <div style={{ fontSize: "10px", color: "#1e4a80", fontFamily: "monospace", flexShrink: 0, width: "76px", paddingTop: "3px" }}>
          {datum}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "5px" }}>
            {badge && (
              <span style={{ fontSize: "8px", color: badge.c, fontFamily: "monospace", background: badge.bg, border: `1px solid ${badge.c}44`, borderRadius: "3px", padding: "2px 6px" }}>
                ⚡ {badge.label}
              </span>
            )}
            {fynd.disciplin && (
              <span style={{ fontSize: "9px", color: farg + "aa", fontFamily: "monospace" }}>{fynd.disciplin}</span>
            )}
          </div>
          <div style={{ fontSize: "14px", color: "#b8d8ff", fontFamily: "Georgia, serif", fontWeight: 600, lineHeight: 1.4 }}>
            {fynd.titel}
          </div>
          {forfattare && (
            <div style={{ fontSize: "10px", color: "#1e4a80", fontFamily: "monospace", marginTop: "5px" }}>
              🔬 {forfattare}
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); onLasa({ typ: "forskning", id: fynd.id, titel: fynd.titel, text: [fynd.titel, fynd.sammanfattning].filter(Boolean).join(". ") }); }}
            style={{ marginTop: "8px", padding: "5px 12px", background: "transparent", border: `1px solid ${ORAKLET_FARG}50`, color: ORAKLET_FARG, borderRadius: "6px", fontSize: "11px", fontFamily: "Georgia, serif", cursor: "pointer" }}
          >
            🎓 Professor Oraklet förklarar
          </button>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          style={{ background: "none", border: "1px solid #0d2040", color: "#1e4a80", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", flexShrink: 0 }}
        >
          {open ? "▲ Dölj" : "▼ Expandera"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: "10px", paddingLeft: "90px", paddingRight: "8px" }}>
          {fynd.sammanfattning && (
            <p style={{ fontSize: "12px", color: "#2a5a8a", lineHeight: 1.7, margin: "0 0 10px" }}>
              {fynd.sammanfattning}
            </p>
          )}
          {fynd.metodologi && (
            <p style={{ fontSize: "10px", color: "#0d2a4a", fontFamily: "monospace", fontStyle: "italic", margin: "0 0 6px" }}>
              Metod: {fynd.metodologi}
            </p>
          )}
          {fynd.arxiv_kalla?.titel && (
            <p style={{ fontSize: "10px", color: "#3a6a9a", lineHeight: 1.5, margin: 0 }}>
              📄 Inspirerad av:{" "}
              {fynd.arxiv_kalla.url ? (
                <a href={fynd.arxiv_kalla.url} target="_blank" rel="noopener noreferrer" style={{ color: "#5a9ad0" }}>
                  {fynd.arxiv_kalla.titel}
                </a>
              ) : fynd.arxiv_kalla.titel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ForskningsListaVy({ fynd, onLasa }) {
  const [valdDisciplin, setValdDisciplin] = useState(null);

  if (fynd.length === 0) {
    return (
      <div style={{ fontSize: "11px", color: "#1e4a80", fontFamily: "monospace", padding: "16px 0" }}>
        Inga vetenskapliga upptäckter ännu. Kör forskning_test.py för att generera de första fynden.
      </div>
    );
  }

  const disciplinCounts = {};
  for (const f of fynd) {
    const d = f.disciplin || "övrigt";
    disciplinCounts[d] = (disciplinCounts[d] || 0) + 1;
  }
  const discipliner = Object.keys(disciplinCounts).sort();

  // fynd är redan sorterad kronologiskt (skapad.desc) från SSR-queryn — filter()
  // bevarar ordningen, så listan förblir nyast-först oavsett vald tagg.
  const filtrerade = valdDisciplin
    ? fynd.filter(f => (f.disciplin || "övrigt") === valdDisciplin)
    : fynd;

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        <TagPill label="Alla" count={fynd.length} active={!valdDisciplin} onClick={() => setValdDisciplin(null)} farg="#38bdf8" />
        {discipliner.map(d => (
          <TagPill
            key={d}
            label={d}
            count={disciplinCounts[d]}
            active={valdDisciplin === d}
            onClick={() => setValdDisciplin(d)}
            farg={DISCIPLIN_FARG[d] || "#38bdf8"}
          />
        ))}
      </div>

      <div>
        {filtrerade.map(f => <RadFynd key={f.id} fynd={f} onLasa={onLasa} />)}
      </div>
    </div>
  );
}
