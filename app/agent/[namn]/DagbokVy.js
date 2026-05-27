"use client";

import { useState } from "react";

const C = {
  surface: "#1a1a18",
  border: "#2a2a28",
  textMuted: "#6b7280",
};

const VISA_INITIALT = 3;

export default function DagbokVy({ dagbok }) {
  const [visaAlla, setVisaAlla] = useState(false);

  if (!dagbok || dagbok.length === 0) return null;

  const synliga = visaAlla ? dagbok : dagbok.slice(0, VISA_INITIALT);
  const dolda = dagbok.length - VISA_INITIALT;

  return (
    <div style={{ marginBottom: "48px" }}>
      <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px 0" }}>
        Dagbok — interna reflektioner
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {synliga.map(d => (
          <div key={d.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px 20px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#555", letterSpacing: "0.08em" }}>
                {d.skapad ? new Date(d.skapad).toLocaleDateString("sv-SE") : ""}
              </span>
              {d.ar_replik && (
                <span style={{ fontSize: "10px", color: "#38bdf8", fontFamily: "monospace", border: "1px solid #38bdf830", borderRadius: "20px", padding: "1px 7px" }}>REPLIK</span>
              )}
              {d.rubrik && (
                <span style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.rubrik}
                </span>
              )}
            </div>
            <p style={{ fontSize: "14px", color: "#c8c4ba", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
              &ldquo;{d.reflektion}&rdquo;
            </p>
          </div>
        ))}
      </div>

      {dagbok.length > VISA_INITIALT && (
        <button
          onClick={() => setVisaAlla(v => !v)}
          style={{
            marginTop: "12px",
            background: "none",
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            color: C.textMuted,
            fontSize: "12px",
            padding: "6px 14px",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          {visaAlla
            ? "Visa färre ↑"
            : `Visa ${dolda} till ↓`}
        </button>
      )}
    </div>
  );
}
