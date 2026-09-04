"use client";
import { useState } from "react";
import ForskningsListaVy from "./ForskningsListaVy";
import VetenskapsFlodeVy from "./VetenskapsFlodeVy";

function TypTab({ label, count, active, onClick, farg }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: "160px",
        textAlign: "left",
        background: active ? farg + "18" : "transparent",
        border: `1px solid ${active ? farg + "88" : "#0d2040"}`,
        borderRadius: "10px",
        padding: "14px 16px",
        cursor: "pointer",
        color: active ? farg : "#1e4a80",
      }}
    >
      <div style={{ fontSize: "13px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{ fontSize: "10px", fontFamily: "monospace", opacity: 0.75, marginTop: "3px" }}>
        {count} st
      </div>
    </button>
  );
}

// Innan denna komponent visades ForskningsListaVy och VetenskapsFlodeVy
// staplade under varandra — två långa kronologiska listor efter varandra,
// vilket tvingade besökaren att skrolla förbi hela forskningslistan (upp
// till 50 rader) bara för att nå vetenskapsnyheterna längst ner. En
// typväxlare löser det genom att bara visa EN lista åt gången — inget
// skrollberg att ta sig förbi för att nå den andra.
export default function UniversitetVy({ fynd, nyheter }) {
  const [typ, setTyp] = useState(fynd.length > 0 || nyheter.length === 0 ? "forskning" : "nyheter");

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
        <TypTab
          label="🔬 AI-forskning"
          count={fynd.length}
          active={typ === "forskning"}
          onClick={() => setTyp("forskning")}
          farg="#38bdf8"
        />
        <TypTab
          label="📡 Vetenskapliga Nyheter"
          count={nyheter.length}
          active={typ === "nyheter"}
          onClick={() => setTyp("nyheter")}
          farg="#fb923c"
        />
      </div>

      {typ === "forskning" ? <ForskningsListaVy fynd={fynd} /> : <VetenskapsFlodeVy nyheter={nyheter} />}
    </div>
  );
}
