"use client";

const LANK = "#38bdf8";

function tidsSedan(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just nu";
  if (min < 60) return `${min} min sedan`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  return `${d} dygn sedan`;
}

// Scrollande ticker med de senaste hämtade nyheterna, längst upp på sidan —
// samma tekniska mönster (dubblad lista, CSS-animerad -50%-loop) som
// app/NewsTicker.js på /kanal, men egen kopia sourcad direkt ur `nyheter`-
// propen (redan hämtad server-side från HELA nyhetsflode) istället för
// /api/ticker, som bara täcker 4 svenska källor — för snävt för en sida
// vars poäng är att visa alla ~44 källor.
export default function NyhetsTicker({ nyheter }) {
  const senaste = nyheter.slice(0, 20);
  if (!senaste.length) return null;

  const items = [...senaste, ...senaste];
  const duration = Math.max(senaste.length * 3, 20);

  return (
    <div style={{
      borderBottom: "1px solid #1a1a1a",
      background: "#080808",
      overflow: "hidden",
      height: "38px",
      display: "flex",
      alignItems: "center",
    }}>
      <div style={{
        flexShrink: 0, padding: "0 12px", fontSize: "9px", fontFamily: "monospace",
        letterSpacing: "0.15em", color: LANK, borderRight: "1px solid #222",
        height: "100%", display: "flex", alignItems: "center", whiteSpace: "nowrap",
      }}>
        LIVE
      </div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{ display: "flex", animation: `nyhets-ticker ${duration}s linear infinite`, whiteSpace: "nowrap", willChange: "transform" }}>
          {items.map((n, i) => (
            <span key={`${n.id}-${i}`} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "13px", color: "#f0ede6", fontFamily: "Georgia, serif", padding: "0 8px", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
              >
                {n.rubrik}
              </a>
              <span style={{ fontSize: "10px", color: "#4a7a9b", fontFamily: "monospace", marginRight: "6px" }}>
                {n.kalla}
              </span>
              <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace", marginRight: "16px" }}>
                · {tidsSedan(n.hamtad)}
              </span>
              <span style={{ color: "#333", marginRight: "16px" }}>◆</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes nyhets-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
