"use client";
import { useEffect, useState } from "react";

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

// Scrollande ticker som blandar AI-agenternas egna forskningsfynd och de
// hämtade vetenskapskällorna (arXiv m.fl.) i EN kronologisk rad högst upp på
// sidan — samma tekniska mönster (dubblad lista, CSS -50%-loop) som
// app/nyhetskallor/NyhetsTicker.js. Fynd saknar en egen detaljsida (bara
// inline-expanderbara i listan nedanför) så de renderas som ren text; externa
// nyheter länkar ut till originalkällan precis som i NyhetsTicker.
export default function UniversitetTicker({ fynd, nyheter }) {
  // Sidan cachas med 5 minuters ISR (revalidate=300 i page.js) — till
  // skillnad från NyhetsTicker.js (force-dynamic, hydrerar inom
  // millisekunder av sin egen render) kan "X min sedan" här vara flera
  // minuter inaktuellt när en besökare hydrerar en cachad sida. Att köra
  // tidsSedan() direkt i render ger då olika text server- och klientsidan
  // (Codex-fynd, PR #1355) → hydration-mismatch. mounted-gaten säkerställer
  // att server-HTML och klientens FÖRSTA render matchar (båda tomma), sedan
  // fylls den riktiga texten i efter mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const a = fynd.map(f => ({
    id: `f-${f.id}`, text: f.titel, kalla: f.forskare || "AI-forskning",
    tid: f.skapad, url: null, ikon: "🔬", farg: "#38bdf8",
  }));
  const b = nyheter.map(n => ({
    id: `n-${n.id}`, text: n.rubrik, kalla: n.kalla,
    tid: n.hamtad, url: n.url, ikon: "📡", farg: "#fb923c",
  }));

  const senaste = [...a, ...b]
    .filter(x => x.tid && x.text)
    .sort((x, y) => new Date(y.tid) - new Date(x.tid))
    .slice(0, 20);

  if (!senaste.length) return null;

  const items = [...senaste, ...senaste];
  const duration = Math.max(senaste.length * 3, 20);

  return (
    <div style={{
      borderBottom: "1px solid #0d2040", background: "#020814", overflow: "hidden",
      height: "36px", display: "flex", alignItems: "center",
    }}>
      <div style={{
        flexShrink: 0, padding: "0 12px", fontSize: "9px", fontFamily: "monospace",
        letterSpacing: "0.15em", color: "#38bdf8", borderRight: "1px solid #0d2040",
        height: "100%", display: "flex", alignItems: "center", whiteSpace: "nowrap",
      }}>
        LIVE
      </div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{ display: "flex", width: "max-content", animation: `universitet-ticker ${duration}s linear infinite`, whiteSpace: "nowrap", willChange: "transform" }}>
          {items.map((n, i) => {
            const inner = (
              <>
                <span style={{ fontSize: "10px", marginRight: "6px" }}>{n.ikon}</span>
                <span style={{ fontSize: "12px", color: "#b8d8ff", fontFamily: "Georgia, serif", marginRight: "8px" }}>{n.text}</span>
                <span style={{ fontSize: "9px", color: n.farg + "aa", fontFamily: "monospace", marginRight: "6px" }}>{n.kalla}</span>
                <span style={{ fontSize: "9px", color: "#1e4a80", fontFamily: "monospace", marginRight: "16px" }}>· {mounted ? tidsSedan(n.tid) : ""}</span>
                <span style={{ color: "#0d2040", marginRight: "16px" }}>◆</span>
              </>
            );
            return (
              <span key={`${n.id}-${i}`} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, padding: "0 4px" }}>
                {n.url ? (
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                  >
                    {inner}
                  </a>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center" }}>{inner}</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes universitet-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
