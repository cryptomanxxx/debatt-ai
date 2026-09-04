"use client";
import { useState } from "react";

// Rå RSS/arXiv-poster ur nyhetsflode — samma datakälla som /nyhetskallor,
// men filtrerad till enbart arXiv-preprints och renodlade vetenskapskällor
// (se VETENSKAP_KALLOR i page.js). Skiljer sig medvetet från ForskningsListaVy
// ovanför: det här är obehandlade externa rubriker, inte AI-genererade fynd.
function VetenskapsRad({ item }) {
  const [open, setOpen] = useState(false);
  const arXiv = (item.kalla || "").startsWith("arXiv");
  const farg = arXiv ? "#fb923c" : "#38bdf8";
  const datum = item.hamtad
    ? new Date(item.hamtad).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric", timeZone: "Europe/Stockholm" })
    : "";

  return (
    <div style={{ borderBottom: "1px solid #0d2040", padding: "12px 0" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}
      >
        <div style={{ fontSize: "10px", color: "#1e4a80", fontFamily: "monospace", flexShrink: 0, width: "76px", paddingTop: "3px" }}>
          {datum}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "5px" }}>
            <span style={{ fontSize: "8px", color: farg, fontFamily: "monospace", border: `1px solid ${farg}44`, borderRadius: "3px", padding: "2px 6px" }}>
              {arXiv ? "ARXIV" : "NYHET"}
            </span>
            <span style={{ fontSize: "9px", color: "#1e4a80aa", fontFamily: "monospace" }}>{item.kalla}</span>
          </div>
          <div style={{ fontSize: "13px", color: "#8fb8e8", fontFamily: "Georgia, serif", fontWeight: 600, lineHeight: 1.4 }}>
            {item.rubrik}
          </div>
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
          {item.beskrivning && (
            <p style={{ fontSize: "12px", color: "#2a5a8a", lineHeight: 1.7, margin: "0 0 10px" }}>
              {item.beskrivning}
            </p>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#5a9ad0", fontFamily: "monospace" }}>
              Läs originalkälla →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function VetenskapsFlodeVy({ nyheter }) {
  if (!nyheter || nyheter.length === 0) {
    return (
      <div style={{ fontSize: "11px", color: "#1e4a80", fontFamily: "monospace", padding: "16px 0" }}>
        Inga vetenskapliga nyheter hämtade ännu.
      </div>
    );
  }

  return (
    <div>
      {nyheter.map(n => <VetenskapsRad key={n.id} item={n} />)}
    </div>
  );
}
