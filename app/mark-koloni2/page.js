import KoloniKarta2 from "./KoloniKarta2";

export const metadata = {
  title: "Koloni-2 — tre öar",
  robots: "noindex",
};

export default function KoloniKarta2Page() {
  return (
    <div style={{ background: "#050a14", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "12px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0,0,0,0.6)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
            🗺 Koloni-2 — Tre öar
          </span>
          <span style={{
            fontSize: 11, color: "#22d3ee",
            background: "rgba(34,211,238,0.10)", border: "1px solid rgba(34,211,238,0.30)",
            borderRadius: 4, padding: "2px 7px",
          }}>
            ARCHIPELAG
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <a href="/mark-test"  style={{ color: "rgba(255,255,255,0.38)", textDecoration: "none" }}>Koloni-1</a>
          <a href="/mark"       style={{ color: "#60a5fa",                textDecoration: "none" }}>← Civilisationen</a>
          <a href="/mark-test2" style={{ color: "rgba(255,255,255,0.38)", textDecoration: "none" }}>Koloni-3</a>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <KoloniKarta2 />
      </div>
    </div>
  );
}
