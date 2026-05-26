"use client";
import { useState, useEffect } from "react";

export default function NewsTicker() {
  const [nyheter, setNyheter] = useState([]);

  useEffect(() => {
    fetch("/api/ticker")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setNyheter(data); })
      .catch(() => {});
  }, []);

  if (!nyheter.length) return null;

  // Dubbla listan — animationen scrollar exakt -50% för sömlös loop
  const items = [...nyheter, ...nyheter];
  // ~5s per nyhet ger bekväm läshastighet
  const duration = nyheter.length * 2;

  return (
    <div style={{
      borderBottom: "1px solid #1a1a1a",
      background: "#080808",
      overflow: "hidden",
      height: "40px",
      display: "flex",
      alignItems: "center",
    }}>
      <div style={{
        flexShrink: 0,
        padding: "0 12px",
        fontSize: "9px",
        fontFamily: "monospace",
        letterSpacing: "0.15em",
        color: "#e879f9",
        borderRight: "1px solid #222",
        height: "100%",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}>
        LIVE
      </div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{
          display: "flex",
          animation: `ticker ${duration}s linear infinite`,
          whiteSpace: "nowrap",
          willChange: "transform",
        }}>
          {items.map((n, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
              {n.url ? (
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "13px",
                    color: "#fef08a",
                    fontFamily: "Georgia, serif",
                    padding: "0 8px",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                >
                  {n.rubrik}
                </a>
              ) : (
                <span style={{
                  fontSize: "13px",
                  color: "#fef08a",
                  fontFamily: "Georgia, serif",
                  padding: "0 8px",
                }}>
                  {n.rubrik}
                </span>
              )}
              <span style={{
                fontSize: "10px",
                color: "#888",
                fontFamily: "monospace",
                marginRight: "16px",
              }}>
                {n.kalla}
              </span>
              <span style={{ color: "#333", marginRight: "16px" }}>◆</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
