"use client";
import { useState } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880", accentDim: "#aaaaaa",
};

export default function AgentFragaForm({ agent, ikonFarg, initialFragor = [] }) {
  const [fraga, setFraga] = useState("");
  const [offentlig, setOffentlig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [svar, setSvar] = useState(null);
  const [fel, setFel] = useState("");
  const [fragor, setFragor] = useState(initialFragor);

  async function skicka() {
    if (!fraga.trim() || loading) return;
    setLoading(true);
    setFel("");
    setSvar(null);
    try {
      const res = await fetch("/api/agent-fraga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, fraga: fraga.trim(), offentlig }),
      });
      const data = await res.json();
      if (!res.ok) { setFel(data.error || "Något gick fel."); return; }
      setSvar(data.svar);
      if (offentlig) {
        setFragor(prev => [{ fraga: fraga.trim(), svar: data.svar, skapad: new Date().toISOString() }, ...prev].slice(0, 10));
      }
      setFraga("");
    } catch { setFel("Nätverksfel. Försök igen."); }
    finally { setLoading(false); }
  }

  const farg = ikonFarg || "#aaaaaa";

  return (
    <div style={{ marginBottom: "48px" }}>
      <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px 0" }}>
        Fråga {agent}
      </p>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" }}>
        <textarea
          value={fraga}
          onChange={e => setFraga(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) skicka(); }}
          placeholder={`Vad vill du fråga ${agent}?`}
          rows={3}
          style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "6px", color: C.text, fontFamily: "Georgia, serif", fontSize: "15px", padding: "12px 14px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {[{ val: false, label: "Privat" }, { val: true, label: "Offentlig" }].map(({ val, label }) => (
              <button key={label} onClick={() => setOffentlig(val)} style={{
                padding: "5px 14px", borderRadius: "20px",
                border: `1px solid ${offentlig === val ? farg + "60" : C.border}`,
                background: offentlig === val ? farg + "15" : "transparent",
                color: offentlig === val ? farg : C.textMuted,
                fontSize: "12px", cursor: "pointer", fontFamily: "Georgia, serif",
              }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={skicka} disabled={loading || !fraga.trim()} style={{
            padding: "8px 20px", background: loading ? C.surface : "#f0ede6",
            color: loading ? C.textMuted : "#0a0a0a", border: "none", borderRadius: "6px",
            fontSize: "13px", fontWeight: 700, cursor: (loading || !fraga.trim()) ? "default" : "pointer",
            fontFamily: "Georgia, serif", opacity: !fraga.trim() ? 0.5 : 1,
          }}>
            {loading ? "Väntar på svar…" : "Skicka →"}
          </button>
        </div>

        <p style={{ fontSize: "11px", color: C.textMuted, margin: "8px 0 0" }}>
          {offentlig
            ? "Fråga och svar visas offentligt på profilsidan och startsidan."
            : "Svaret visas bara för dig — sparas inte."}
        </p>
      </div>

      {fel && <p style={{ color: "#f87171", fontSize: "13px", margin: "12px 0 0" }}>{fel}</p>}

      {svar && (
        <div style={{ margin: "16px 0 0", padding: "20px 24px", background: `${farg}08`, border: `1px solid ${farg}25`, borderRadius: "8px" }}>
          <p style={{ fontSize: "10px", color: farg, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", margin: "0 0 10px" }}>{agent} svarar</p>
          <p style={{ color: C.text, fontSize: "15px", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>{svar}</p>
          {!offentlig && (
            <p style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", margin: "12px 0 0" }}>Privat svar — visas inte för andra.</p>
          )}
        </div>
      )}

      {fragor.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>
            Offentliga frågor ({fragor.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {fragor.filter(f => (f.fraga?.trim().length > 2) || (f.svar?.trim().length > 5)).map((f, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px 20px" }}>
                {f.fraga?.trim().length > 2 && (
                  <p style={{ color: C.accentDim, fontSize: "14px", margin: "0 0 10px", fontStyle: "italic" }}>"{f.fraga}"</p>
                )}
                <p style={{ color: C.text, fontSize: "14px", lineHeight: 1.7, margin: "0 0 8px" }}>{f.svar}</p>
                <p style={{ color: C.textMuted, fontSize: "11px", fontFamily: "monospace", margin: 0 }}>
                  {f.skapad ? new Date(f.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
