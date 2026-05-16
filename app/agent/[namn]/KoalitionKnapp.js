"use client";
import { useState, useEffect } from "react";

const LS_KEY = "koalition_agent";

export default function KoalitionKnapp({ agent, initialFoljare = 0 }) {
  const [minAgent, setMinAgent] = useState(null);
  const [foljare, setFoljare] = useState(initialFoljare);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMinAgent(localStorage.getItem(LS_KEY));
    setMounted(true);
  }, []);

  const arMedlem = mounted && minAgent === agent;

  async function join() {
    if (loading || arMedlem) return;
    setLoading(true);
    const previous = minAgent;
    localStorage.setItem(LS_KEY, agent);
    setMinAgent(agent);
    setFoljare(f => f + 1);

    await fetch("/api/koalition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, previousAgent: previous }),
    }).catch(() => {});
    setLoading(false);
  }

  async function leave() {
    if (loading || !arMedlem) return;
    setLoading(true);
    localStorage.removeItem(LS_KEY);
    setMinAgent(null);
    setFoljare(f => Math.max(0, f - 1));

    await fetch("/api/koalition", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent }),
    }).catch(() => {});
    setLoading(false);
  }

  const green = "#4ade80";
  const blue = "#4a9eff";
  const border = "#222222";
  const textMuted = "#888880";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "13px", color: textMuted, fontFamily: "monospace" }}>
        {foljare.toLocaleString("sv-SE")} {foljare === 1 ? "följare" : "följare"}
      </span>

      {mounted && !arMedlem && (
        <button
          onClick={join}
          disabled={loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "6px 16px", borderRadius: "6px", cursor: loading ? "default" : "pointer",
            background: `${blue}18`, border: `1px solid ${blue}60`, color: blue,
            fontSize: "13px", fontFamily: "monospace", fontWeight: 700,
            transition: "background 0.15s",
          }}
        >
          {minAgent ? "Byt till denna koalition" : "Gå med i koalitionen"}
        </button>
      )}

      {mounted && arMedlem && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "5px 14px", borderRadius: "6px",
            background: `${green}15`, border: `1px solid ${green}50`,
            fontSize: "13px", color: green, fontFamily: "monospace", fontWeight: 700,
          }}>
            ✓ Din koalition
          </span>
          <button
            onClick={leave}
            disabled={loading}
            style={{ fontSize: "11px", color: textMuted, background: "none", border: `1px solid ${border}`, borderRadius: "4px", padding: "4px 10px", cursor: "pointer" }}
          >
            Lämna
          </button>
        </div>
      )}

      <a
        href="/koalitioner"
        style={{ fontSize: "12px", color: textMuted, textDecoration: "none", marginLeft: "auto" }}
      >
        Se ranking →
      </a>
    </div>
  );
}
