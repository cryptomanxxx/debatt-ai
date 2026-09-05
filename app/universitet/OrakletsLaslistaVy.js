"use client";
import { useState } from "react";
import { AGENTER } from "../nyhetskallor/AgentOverlay";

const ORAKLET_FARG = AGENTER.Oraklet.farg;

// Ett kurerat urval ur nyhetsflode som Professor Oraklet själv (LLM,
// agents/oraklet-curator.js) valt ut och kommenterat — skiljer sig
// medvetet från VetenskapsFlodeVy ovanför: det här är INTE en lista över
// allt som hämtats, bara det Oraklet själv tyckte var läsvärt, med hans
// egen motivering synlig direkt (inte gömd bakom en expanderknapp — den
// personliga kommentaren är själva poängen med fliken).
function UrvalRad({ item, onLasa }) {
  const [open, setOpen] = useState(false);
  const nyhet = item.nyhetsflode || {};
  const datum = item.skapad
    ? new Date(item.skapad).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric", timeZone: "Europe/Stockholm" })
    : "";
  const harKalla = !!(nyhet.beskrivning || nyhet.url);

  return (
    <div style={{ borderBottom: "1px solid #0d2040", padding: "16px 0" }}>
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        <div style={{ fontSize: "10px", color: "#1e4a80", fontFamily: "monospace", flexShrink: 0, width: "76px", paddingTop: "3px" }}>
          {datum}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {nyhet.kalla && (
            <div style={{ fontSize: "9px", color: "#1e4a80aa", fontFamily: "monospace", marginBottom: "5px" }}>
              {nyhet.kalla}
            </div>
          )}
          <div style={{ fontSize: "14px", color: "#b8d8ff", fontFamily: "Georgia, serif", fontWeight: 600, lineHeight: 1.4 }}>
            {nyhet.rubrik}
          </div>

          {item.motivering && (
            <div style={{ marginTop: "8px", padding: "10px 12px", background: ORAKLET_FARG + "12", borderLeft: `2px solid ${ORAKLET_FARG}70`, borderRadius: "0 6px 6px 0" }}>
              <p style={{ fontSize: "12px", color: ORAKLET_FARG, fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
                🎓 "{item.motivering}"
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => onLasa({
                typ: "urval",
                id: item.id,
                titel: nyhet.rubrik,
                text: [nyhet.rubrik, item.motivering].filter(Boolean).join(". "),
              })}
              style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${ORAKLET_FARG}50`, color: ORAKLET_FARG, borderRadius: "6px", fontSize: "11px", fontFamily: "Georgia, serif", cursor: "pointer" }}
            >
              🎓 Professor Oraklet läser
            </button>
            {harKalla && (
              <button
                onClick={() => setOpen(o => !o)}
                style={{ background: "none", border: "1px solid #0d2040", color: "#1e4a80", borderRadius: "6px", padding: "5px 10px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer" }}
              >
                {open ? "▲ Dölj källa" : "▼ Visa källa"}
              </button>
            )}
          </div>

          {open && (
            <div style={{ marginTop: "10px" }}>
              {nyhet.beskrivning && (
                <p style={{ fontSize: "12px", color: "#2a5a8a", lineHeight: 1.7, margin: "0 0 8px" }}>
                  {nyhet.beskrivning}
                </p>
              )}
              {nyhet.url && (
                <a href={nyhet.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#5a9ad0", fontFamily: "monospace" }}>
                  Läs originalkälla →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrakletsLaslistaVy({ urval, onLasa }) {
  if (!urval || urval.length === 0) {
    return (
      <div style={{ fontSize: "11px", color: "#1e4a80", fontFamily: "monospace", padding: "16px 0" }}>
        Professor Oraklet har inte hunnit välja ut några nyheter än. Kör agents/oraklet-curator.js för att generera de första valen.
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "11px", color: "#1e4a80", fontFamily: "monospace", marginBottom: "16px", lineHeight: 1.6 }}>
        Varje dag läser Professor Oraklet igenom nyhetsflödet och väljer själv ut det han tycker är mest läsvärt — inte det mest sensationella, utan det han finner genuint intressant.
      </div>
      {urval.map(u => <UrvalRad key={u.id} item={u} onLasa={onLasa} />)}
    </div>
  );
}
