"use client";
import { useCallback, useState } from "react";
import ForskningsListaVy from "./ForskningsListaVy";
import VetenskapsFlodeVy from "./VetenskapsFlodeVy";
import AgentOverlay from "../nyhetskallor/AgentOverlay";

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
  // Professor Oraklet läser ett enskilt fynd/nyhet i taget — samma
  // AgentOverlay-mönster som "🎙️ Anna läser" m.fl. på /nyhetsanalyser, men
  // med bara EN läsare (ingen trevägsväljare) eftersom det bara finns en
  // föreläsande professor på universitetet. Lyfts hit till den gemensamma
  // föräldern istället för att dupliceras i både ForskningsListaVy och
  // VetenskapsFlodeVy, så bara en overlay-instans kan vara öppen åt gången
  // oavsett vilken flik besökaren står på.
  const [lasning, setLasning] = useState(null);

  // Loggar uppläsningen (fire-and-forget) så den syns i Senaste
  // aktivitet-feeden på startsidan (se app/api/aktivitet/route.js) — utan
  // detta lämnade en Oraklet-uppläsning inget spår alls i databasen. Ett
  // loggningsfel ska aldrig hindra själva uppläsningen, som redan startat
  // klientsidan (overlayen öppnas synkront via setLasning).
  const handleLasa = useCallback((payload) => {
    setLasning(payload);
    fetch("/api/oraklet-lasning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typ: payload.typ, ref_id: payload.id, titel: payload.titel }),
    }).catch(() => {});
  }, []);

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

      {typ === "forskning"
        ? <ForskningsListaVy fynd={fynd} onLasa={handleLasa} />
        : <VetenskapsFlodeVy nyheter={nyheter} onLasa={handleLasa} />}

      {lasning && (
        // Nyckeln inkluderar typ eftersom fynd (vetenskapliga_upptagter) och
        // nyheter (nyhetsflode) har separata id-sekvenser — utan typ-prefixet
        // kunde en fynd-id och en nyhet-id råka kollidera och overlayen då
        // inte remounta (och därmed inte byta uppläst text) vid klick.
        <AgentOverlay
          key={`oraklet-${lasning.typ}-${lasning.id}`}
          agent="Oraklet"
          namn="Professor Oraklet"
          text={lasning.text}
          onClose={() => setLasning(null)}
        />
      )}
    </div>
  );
}
