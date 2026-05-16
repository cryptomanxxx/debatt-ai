"use client";
import { useState } from "react";

const MAX_TES = 280;

export default function AgentUtmaningForm({ agent, ikonFarg }) {
  const [tes, setTes] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null); // { tes, motargument }
  const [fel, setFel] = useState("");

  const farg = ikonFarg || "#aaaaaa";
  const kvar = MAX_TES - tes.length;

  async function utmana() {
    if (!tes.trim() || loading) return;
    setLoading(true);
    setFel("");
    setResultat(null);
    try {
      const res = await fetch("/api/agent-utmaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, tes: tes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFel(data.error || "Något gick fel."); return; }
      setResultat({ tes: tes.trim(), motargument: data.motargument });
      setTes("");
    } catch { setFel("Nätverksfel. Försök igen."); }
    finally { setLoading(false); }
  }

  const C = {
    bg: "#0a0a0a", surface: "#111111", border: "#222222",
    text: "#f0ede6", textMuted: "#888880",
  };

  return (
    <div style={{ marginBottom: "48px" }}>
      <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" }}>
        Utmana {agent}
      </p>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 12px", lineHeight: 1.5 }}>
          Presentera en tes — {agent} argumenterar direkt emot den.
        </p>

        <textarea
          value={tes}
          onChange={e => setTes(e.target.value.slice(0, MAX_TES))}
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) utmana(); }}
          placeholder={`Skriv din tes här — t.ex. "AI kommer att ta alla jobb inom tio år"`}
          rows={3}
          style={{
            width: "100%", background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: "6px", color: C.text, fontFamily: "Georgia, serif",
            fontSize: "15px", padding: "12px 14px", resize: "vertical",
            outline: "none", boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: kvar < 40 ? "#f87171" : C.textMuted, fontFamily: "monospace" }}>
            {kvar} tecken kvar
          </span>
          <button
            onClick={utmana}
            disabled={loading || tes.trim().length < 10}
            style={{
              padding: "8px 20px",
              background: loading || tes.trim().length < 10 ? C.surface : farg,
              color: loading || tes.trim().length < 10 ? C.textMuted : "#0a0a0a",
              border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700,
              cursor: loading || tes.trim().length < 10 ? "default" : "pointer",
              fontFamily: "Georgia, serif", opacity: tes.trim().length < 10 ? 0.5 : 1,
              transition: "background 0.15s",
            }}
          >
            {loading ? "Tänker…" : `Utmana ${agent} →`}
          </button>
        </div>
      </div>

      {fel && (
        <p style={{ color: "#f87171", fontSize: "13px", margin: "10px 0 0" }}>{fel}</p>
      )}

      {resultat && (
        <div style={{ marginTop: "16px", border: `1px solid ${farg}30`, borderRadius: "8px", overflow: "hidden" }}>
          {/* Reader's thesis */}
          <div style={{ padding: "16px 20px", background: `${farg}06`, borderBottom: `1px solid ${farg}20` }}>
            <p style={{ fontSize: "10px", color: farg, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", margin: "0 0 8px" }}>
              Din tes
            </p>
            <p style={{ color: "#aaaaaa", fontSize: "15px", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              "{resultat.tes}"
            </p>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 20px", background: C.bg }}>
            <div style={{ flex: 1, height: "1px", background: `${farg}25` }} />
            <span style={{ fontSize: "16px", color: farg, padding: "8px 0", lineHeight: 1 }}>⚔</span>
            <div style={{ flex: 1, height: "1px", background: `${farg}25` }} />
          </div>

          {/* Agent counter-argument */}
          <div style={{ padding: "16px 20px", background: C.surface }}>
            <p style={{ fontSize: "10px", color: farg, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", margin: "0 0 10px" }}>
              {agent} bemöter
            </p>
            <p style={{ color: "#f0ede6", fontSize: "15px", lineHeight: 1.75, margin: 0 }}>
              {resultat.motargument}
            </p>
          </div>

          <div style={{ padding: "10px 20px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={() => { setResultat(null); }}
              style={{ fontSize: "11px", color: C.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Utmana igen →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
