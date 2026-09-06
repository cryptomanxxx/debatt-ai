"use client";
import { useState } from "react";
import { AGENTER } from "../nyhetskallor/AgentOverlay";

const ORAKLET_FARG = AGENTER.Oraklet.farg;

function KallaPill({ label, count, active, onClick, farg }) {
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

// Rå RSS/arXiv-poster ur nyhetsflode — samma datakälla som /nyhetskallor,
// men filtrerad till enbart arXiv-preprints och renodlade vetenskapskällor
// (se VETENSKAP_KALLOR i page.js). Skiljer sig medvetet från ForskningsListaVy
// ovanför: det här är obehandlade externa rubriker, inte AI-genererade fynd.
function VetenskapsRad({ item, onLasa }) {
  const [open, setOpen] = useState(false);
  const [forbereder, setForbereder] = useState(false);
  const arXiv = (item.kalla || "").startsWith("arXiv");
  const farg = arXiv ? "#fb923c" : "#38bdf8";
  const datum = item.hamtad
    ? new Date(item.hamtad).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric", timeZone: "Europe/Stockholm" })
    : "";

  // Innan Oraklet läser upp: berika texten om den är för kort (importerar mer
  // via originalkällan) och översätt till svenska om den fortfarande är på
  // ett annat språk — allt server-side i /api/nyhetsflode/forbered-lasning.
  // Fail-open: misslyckas anropet läser Oraklet upp den obehandlade texten
  // istället för att inte läsa alls.
  async function handleLasa(e) {
    e.stopPropagation();
    setForbereder(true);
    let rubrik = item.rubrik;
    let beskrivning = item.beskrivning;
    try {
      const res = await fetch("/api/nyhetsflode/forbered-lasning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.ok) {
        const data = await res.json();
        rubrik = data.rubrik || rubrik;
        beskrivning = data.beskrivning || beskrivning;
      }
    } catch {
      // fail-open — läser upp originaltexten nedan
    }
    setForbereder(false);
    onLasa({ typ: "nyhet", id: item.id, titel: rubrik, url: item.url || null, text: [rubrik, beskrivning].filter(Boolean).join(". ") });
  }

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
          <button
            onClick={handleLasa}
            disabled={forbereder}
            style={{
              marginTop: "8px", padding: "5px 12px", background: "transparent",
              border: `1px solid ${ORAKLET_FARG}50`, color: ORAKLET_FARG, borderRadius: "6px",
              fontSize: "11px", fontFamily: "Georgia, serif",
              cursor: forbereder ? "default" : "pointer", opacity: forbereder ? 0.6 : 1,
            }}
          >
            {forbereder ? "🎓 Förbereder…" : "🎓 Professor Oraklet förklarar"}
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

export default function VetenskapsFlodeVy({ nyheter, onLasa }) {
  const [valdKalla, setValdKalla] = useState(null);

  if (!nyheter || nyheter.length === 0) {
    return (
      <div style={{ fontSize: "11px", color: "#1e4a80", fontFamily: "monospace", padding: "16px 0" }}>
        Inga vetenskapliga nyheter hämtade ännu.
      </div>
    );
  }

  const kallaCounts = {};
  for (const n of nyheter) {
    const k = n.kalla || "Okänd källa";
    kallaCounts[k] = (kallaCounts[k] || 0) + 1;
  }
  // Sorterat efter frekvens (flest nyheter syns först) — samma princip som
  // källfiltret på /nyhetskallor, eftersom listan med ett tiotal
  // vetenskapskällor annars blir svår att skanna alfabetiskt.
  const kallor = Object.keys(kallaCounts).sort((a, b) => kallaCounts[b] - kallaCounts[a]);

  // nyheter är redan sorterad kronologiskt (hamtad.desc) från SSR-queryn —
  // filter() bevarar ordningen, så listan förblir nyast-först oavsett vald källa.
  const filtrerade = valdKalla
    ? nyheter.filter(n => (n.kalla || "Okänd källa") === valdKalla)
    : nyheter;

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        <KallaPill label="Alla källor" count={nyheter.length} active={!valdKalla} onClick={() => setValdKalla(null)} farg="#fb923c" />
        {kallor.map(k => (
          <KallaPill
            key={k}
            label={k}
            count={kallaCounts[k]}
            active={valdKalla === k}
            onClick={() => setValdKalla(k)}
            farg={k.startsWith("arXiv") ? "#fb923c" : "#38bdf8"}
          />
        ))}
      </div>

      <div>
        {filtrerade.map(n => <VetenskapsRad key={n.id} item={n} onLasa={onLasa} />)}
      </div>
    </div>
  );
}
