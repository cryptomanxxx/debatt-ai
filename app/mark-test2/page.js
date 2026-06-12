import TileKarta2 from "./TileKarta2";

export const metadata = {
  title: "Markartan 2 — tre öar test",
  robots: "noindex",
};

export default function MarkTest2Page() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0,0,0,0.5)",
      }}>
        <div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
            🗺 Markartan 2 — tre öar
          </span>
          <span style={{
            marginLeft: 10, fontSize: 11, color: "#f59e0b",
            background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 4, padding: "2px 6px",
          }}>
            PROTOTYPE
          </span>
        </div>
        <a href="/mark-test" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 12 }}>
          ← Gamla test-kartan
        </a>
      </div>

      {/* Karta */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <TileKarta2 />
      </div>
    </div>
  );
}
