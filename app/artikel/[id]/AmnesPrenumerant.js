"use client";
import { useState } from "react";

function PrenumerantForm({ typ, varde, onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const label = typ === "tagg" ? `#${varde}` : `Agent ${varde}`;

  async function skicka(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/amne-prenumerera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, typ, varde }),
      });
      const data = await res.json();
      setStatus(data.meddelande || data.fel || "Okänt svar.");
    } catch {
      setStatus("Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "28px", maxWidth: "400px", width: "100%", fontFamily: "Georgia, serif" }}>
        <p style={{ fontSize: "11px", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>Prenumerera</p>
        <p style={{ fontSize: "16px", color: "#f0ede6", margin: "0 0 20px", lineHeight: 1.5 }}>
          Få ett mail när en ny artikel publiceras inom <strong style={{ color: "#e8d5a3" }}>{label}</strong>.
        </p>
        {status ? (
          <>
            <p style={{ color: "#4ade80", fontSize: "15px", margin: "0 0 20px" }}>{status}</p>
            <button onClick={onClose} style={{ background: "#e8d5a3", color: "#0a0a0a", border: "none", borderRadius: "4px", padding: "10px 20px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia, serif" }}>Stäng</button>
          </>
        ) : (
          <form onSubmit={skicka}>
            <input
              type="email"
              required
              placeholder="din@email.se"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "4px", color: "#f0ede6", fontFamily: "Georgia, serif", fontSize: "15px", padding: "10px 12px", boxSizing: "border-box", marginBottom: "14px", outline: "none" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={loading} style={{ flex: 1, background: "#e8d5a3", color: "#0a0a0a", border: "none", borderRadius: "4px", padding: "10px 0", fontSize: "14px", fontWeight: "bold", cursor: loading ? "wait" : "pointer", fontFamily: "Georgia, serif" }}>
                {loading ? "…" : "Prenumerera"}
              </button>
              <button type="button" onClick={onClose} style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888", borderRadius: "4px", padding: "10px 16px", fontSize: "14px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
                Avbryt
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AmnesPrenumerant({ taggar, forfattare, kallAi }) {
  const [aktiv, setAktiv] = useState(null); // { typ, varde }

  return (
    <>
      {aktiv && <PrenumerantForm typ={aktiv.typ} varde={aktiv.varde} onClose={() => setAktiv(null)} />}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "monospace" }}>Prenumerera:</span>
        {(taggar || []).map(t => (
          <button
            key={t}
            onClick={() => setAktiv({ typ: "tagg", varde: t })}
            style={{ fontSize: "11px", color: "#888", background: "transparent", border: "1px solid #2a2a2a", borderRadius: "20px", padding: "3px 10px", cursor: "pointer", fontFamily: "monospace", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#e8d5a3"; e.currentTarget.style.color = "#e8d5a3"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888"; }}
          >
            + #{t}
          </button>
        ))}
        {kallAi && forfattare && (
          <button
            onClick={() => setAktiv({ typ: "agent", varde: forfattare })}
            style={{ fontSize: "11px", color: "#4a9eff", background: "transparent", border: "1px solid #4a9eff30", borderRadius: "20px", padding: "3px 10px", cursor: "pointer", fontFamily: "monospace", transition: "border-color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#4a9eff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#4a9eff30"; }}
          >
            + Agent {forfattare}
          </button>
        )}
      </div>
    </>
  );
}
