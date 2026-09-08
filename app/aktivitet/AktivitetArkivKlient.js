"use client";

import { useState } from "react";

const C = {
  bg: "#0a0a0a", surface: "#0a0a0f", border: "#1a1a1a",
  text: "#c8c8c2", textMuted: "#666", accent: "#4a9eff",
};

function relativTid(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 2) return "just nu";
  if (min < 60) return `${min} min sedan`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  if (d === 1) return "igår";
  if (d < 30) return `${d} dagar sedan`;
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

function HandelseRad({ item }) {
  return (
    <a
      href={item.href}
      style={{
        display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 18px",
        borderBottom: `1px solid ${C.border}`, textDecoration: "none", transition: "background 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#111"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}>{item.ikon}</span>
      <span style={{ fontSize: "13px", color: "#999", lineHeight: 1.55, flex: 1, minWidth: 0 }}>
        <span style={{ color: item.farg, fontWeight: 600 }}>{item.text.split(":")[0]}</span>
        {item.text.includes(":") && <span>: {item.text.slice(item.text.indexOf(":") + 1)}</span>}
      </span>
      <span style={{ fontSize: "11px", color: "#444", fontFamily: "monospace", flexShrink: 0, marginTop: "2px", whiteSpace: "nowrap" }}>
        {relativTid(item.skapad)}
      </span>
    </a>
  );
}

export default function AktivitetArkivKlient({ initialHandelser, initialCursor, initialVid }) {
  const [handelser, setHandelser] = useState(initialHandelser || []);
  const [cursor, setCursor] = useState(initialCursor);
  // vid: identiteterna för rader med EXAKT cursorns tidsstämpel som redan
  // visats — krävs för att "Ladda fler" inte ska hoppa över hela kluster av
  // händelser som delar samma tidsstämpel. Identitetsbaserad snarare än ett
  // rent antal, eftersom servern kan lösa upp cursorn mot en helt annan
  // hämtning av samma data varje gång (Codex-fynd, PR #1431-granskning, se
  // paginateAktivitet() i app/lib/aktivitetFeed.js).
  const [vid, setVid] = useState(initialVid || []);
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState(null);
  const [sok, setSok] = useState("");

  async function laddaFler() {
    if (!cursor || laddar) return;
    setLaddar(true);
    setFel(null);
    try {
      const res = await fetch(`/api/aktivitet/arkiv?cursor=${encodeURIComponent(cursor)}&vid=${encodeURIComponent(JSON.stringify(vid))}`);
      if (!res.ok) throw new Error("fel");
      const data = await res.json();
      setHandelser(prev => [...prev, ...(data.handelser || [])]);
      setCursor(data.nastaCursor || null);
      setVid(data.nastaVid || []);
    } catch {
      setFel("Kunde inte hämta fler händelser just nu. Försök igen om en stund.");
    } finally {
      setLaddar(false);
    }
  }

  const sokTrimmad = sok.trim().toLowerCase();
  const filtrerade = sokTrimmad
    ? handelser.filter(h => h.text.toLowerCase().includes(sokTrimmad))
    : handelser;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ fontSize: "11px", color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "monospace" }}>
          Fullständigt arkiv
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25, color: "#f0ede6" }}>
          Senaste aktivitet
        </h1>
        <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.7, margin: "0 0 28px" }}>
          Alla händelser på plattformen i kronologisk ordning — artiklar, repliker, debatter, ekonomi,
          politik, marknader och mer. <a href="/" style={{ color: C.accent, textDecoration: "none" }}>Startsidans widget</a> visar
          bara de 10 senaste och uppdateras live; den här sidan visar hela historiken bakåt.
        </p>

        <input
          type="text"
          value={sok}
          onChange={e => setSok(e.target.value)}
          placeholder="Sök i redan laddade händelser..."
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 14px", marginBottom: "20px",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px",
            color: C.text, fontSize: "13px", fontFamily: "Georgia, serif",
          }}
        />

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
          {filtrerade.length === 0 ? (
            <p style={{ padding: "24px 18px", color: C.textMuted, fontSize: "13px", margin: 0 }}>
              {sokTrimmad ? "Inga laddade händelser matchar sökningen." : "Inga händelser ännu."}
            </p>
          ) : (
            filtrerade.map((item, i) => <HandelseRad key={`${item.href}-${item.skapad}-${i}`} item={item} />)
          )}
        </div>

        {!sokTrimmad && (
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            {fel && <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{fel}</p>}
            {cursor ? (
              <button
                onClick={laddaFler}
                disabled={laddar}
                style={{
                  padding: "10px 24px", background: "transparent", border: `1px solid ${C.accent}55`,
                  borderRadius: "6px", color: C.accent, fontSize: "13px", fontFamily: "monospace",
                  cursor: laddar ? "default" : "pointer", opacity: laddar ? 0.6 : 1,
                }}
              >
                {laddar ? "Laddar…" : "Ladda fler händelser ↓"}
              </button>
            ) : (
              <p style={{ color: "#444", fontSize: "12px", fontFamily: "monospace" }}>
                — inga fler händelser att ladda —
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
