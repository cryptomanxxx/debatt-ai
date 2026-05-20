"use client";
import { useState, useEffect } from "react";

const C = {
  border: "#222222",
  accentDim: "#aaaaaa",
};

export default function OmSektion({ id, titel, children, defaultOpen = false, topBorder = true }) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!id) return;
    function checkHash() {
      if (window.location.hash === `#${id}`) setOpen(true);
    }
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [id]);

  return (
    <div id={id} style={{
      borderTop: topBorder ? `1px solid ${C.border}` : "none",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "20px 0",
          textAlign: "left",
          gap: "12px",
        }}
      >
        <p style={{
          fontSize: "11px",
          color: C.accentDim,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          margin: 0,
          fontFamily: "monospace",
        }}>
          {titel}
        </p>
        <span style={{
          fontSize: "10px",
          color: C.accentDim,
          fontFamily: "monospace",
          flexShrink: 0,
          transition: "transform 0.2s",
          display: "inline-block",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}>
          ▼
        </span>
      </button>

      {open && (
        <div style={{ paddingBottom: "32px" }}>
          {children}
        </div>
      )}
    </div>
  );
}
