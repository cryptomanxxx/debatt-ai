"use client";
import { ALLA_AGENTER, af } from "./agentAnalys";

// Delad UI för agentvalspanelen som driver "Analysera i Nyhetsanalysen" —
// utbruten ur NyhetskallorClient.js (som ursprungligen hade den inline) så
// samma komponent kan återanvändas på sidor med olika färgtema (denna sidans
// mörkgrå C-palett, /universitet:s mörkblå tema, /fraga-anna-och-peter:s
// identiska mörkgrå C-palett) utan att JSX:en dupliceras tre gånger. Ren
// presentation — själva streaming-/dedupe-logiken ligger i agentAnalys.js.
export default function AgentAnalysPanel({
  expanderad, valda, onToggleAgent, analys, onKor,
  theme = { bg: "#0a0d10", surface: "#111111", border: "#222222", text: "#f0ede6", textMuted: "#888880" },
  accent = "#38bdf8",
  footerNote = null,
}) {
  if (!expanderad) return null;
  const korAntal = Object.values(analys || {}).filter(a => a.status === "laddar").length;
  return (
    <div style={{ marginTop: "10px", padding: "12px", background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: "6px" }}>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        {ALLA_AGENTER.map(agent => {
          const vald = valda.has(agent);
          const farg = af(agent, accent);
          return (
            <button key={agent} onClick={() => onToggleAgent(agent)} style={{ padding: "4px 10px", borderRadius: "20px", border: `1px solid ${vald ? farg + "90" : theme.border}`, background: vald ? `${farg}18` : "transparent", color: vald ? farg : theme.textMuted, fontSize: "11px", fontFamily: "Georgia, serif", cursor: "pointer" }}>
              {agent}
            </button>
          );
        })}
      </div>
      <button
        onClick={onKor}
        disabled={valda.size === 0 || korAntal > 0}
        style={{ padding: "6px 14px", background: valda.size === 0 || korAntal > 0 ? "transparent" : `${accent}18`, border: `1px solid ${accent}60`, color: valda.size === 0 || korAntal > 0 ? theme.textMuted : accent, borderRadius: "6px", fontSize: "12px", fontFamily: "Georgia, serif", cursor: valda.size === 0 || korAntal > 0 ? "default" : "pointer" }}
      >
        {korAntal > 0 ? "Analyserar…" : "Analysera →"}
      </button>

      {analys && Object.keys(analys).length > 0 && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(analys).map(([agent, a]) => (
            <div key={agent} style={{ padding: "10px 14px", background: theme.surface, borderLeft: `3px solid ${af(agent, accent)}${a.status === "laddar" ? "60" : ""}`, borderRadius: "4px" }}>
              <div style={{ fontSize: "10px", color: af(agent, accent), fontFamily: "monospace", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "4px" }}>{agent.toUpperCase()}</div>
              <p style={{ margin: 0, fontSize: "13px", color: a.status === "fel" ? "#f87171" : theme.text, lineHeight: 1.65 }}>
                {a.text}
                {a.status === "laddar" && <span style={{ display: "inline-block", width: "2px", height: "12px", background: af(agent, accent), marginLeft: "2px", verticalAlign: "text-bottom", animation: "blink 0.8s step-end infinite" }} />}
              </p>
            </div>
          ))}
        </div>
      )}

      {footerNote && analys && Object.values(analys).some(a => a.status === "klar") && (
        <p style={{ margin: "10px 0 0", fontSize: "11px", color: theme.textMuted, fontFamily: "monospace" }}>
          {footerNote}
        </p>
      )}
    </div>
  );
}
