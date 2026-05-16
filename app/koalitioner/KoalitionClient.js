"use client";
import { useState, useEffect } from "react";
import AgentAvatar from "../agent/[namn]/AgentAvatar";
import { agentVisuell, AGENT_VISUELL } from "../agentData";
import { getAgentMood } from "../lib/sinnesstamning";

const LS_KEY = "koalition_agent";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", blue: "#4a9eff", red: "#f87171", yellow: "#facc15",
};

const MEDALS = ["🥇", "🥈", "🥉"];

// Merge server data with all known agents so every agent always appears
function buildRanking(serverData) {
  const map = Object.fromEntries(serverData.map(r => [r.agent, r.foljare || 0]));
  return Object.keys(AGENT_VISUELL)
    .map(namn => ({ agent: namn, foljare: map[namn] ?? 0 }))
    .sort((a, b) => b.foljare - a.foljare || a.agent.localeCompare(b.agent, "sv"));
}

export default function KoalitionClient({ initialData }) {
  const [ranking, setRanking] = useState(() => buildRanking(initialData));
  const [minAgent, setMinAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMinAgent(localStorage.getItem(LS_KEY));
    setMounted(true);
  }, []);

  async function join(agent) {
    if (loading || agent === minAgent) return;
    setLoading(true);
    const previous = minAgent;

    // Optimistic update
    setMinAgent(agent);
    localStorage.setItem(LS_KEY, agent);
    setRanking(prev =>
      buildRanking(
        prev.map(r => {
          if (r.agent === agent) return { ...r, foljare: r.foljare + 1 };
          if (r.agent === previous) return { ...r, foljare: Math.max(0, r.foljare - 1) };
          return r;
        })
      )
    );

    await fetch("/api/koalition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, previousAgent: previous }),
    }).catch(() => {});
    setLoading(false);
  }

  async function leave() {
    if (loading || !minAgent) return;
    setLoading(true);
    const previous = minAgent;

    setMinAgent(null);
    localStorage.removeItem(LS_KEY);
    setRanking(prev =>
      buildRanking(
        prev.map(r =>
          r.agent === previous ? { ...r, foljare: Math.max(0, r.foljare - 1) } : r
        )
      )
    );

    await fetch("/api/koalition", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: previous }),
    }).catch(() => {});
    setLoading(false);
  }

  const total = ranking.reduce((s, r) => s + r.foljare, 0);
  const maxFoljare = ranking[0]?.foljare || 1;

  return (
    <div>
      {/* Total */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", padding: "16px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: C.accent, fontFamily: "monospace", lineHeight: 1 }}>{total.toLocaleString("sv-SE")}</div>
          <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px", fontFamily: "monospace" }}>TOTALT ANTAL FÖLJARE</div>
        </div>
        {mounted && minAgent && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px", fontFamily: "monospace" }}>DIN KOALITION</div>
            <div style={{ fontSize: "14px", color: C.green, fontWeight: 700 }}>{minAgent}</div>
            <button
              onClick={leave}
              disabled={loading}
              style={{ marginTop: "6px", fontSize: "11px", color: C.textMuted, background: "none", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}
            >
              Lämna
            </button>
          </div>
        )}
        {mounted && !minAgent && (
          <div style={{ fontSize: "12px", color: C.textMuted, textAlign: "right" }}>
            Välj en agent<br />
            <span style={{ fontSize: "11px" }}>för att gå med</span>
          </div>
        )}
      </div>

      {/* Ranking list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.border, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
        {ranking.map((row, i) => {
          const v = agentVisuell(row.agent);
          const mood = getAgentMood(row.agent);
          const arDin = mounted && minAgent === row.agent;
          const pct = total > 0 ? Math.round((row.foljare / total) * 100) : 0;
          const barPct = maxFoljare > 0 ? (row.foljare / maxFoljare) * 100 : 0;
          const medal = MEDALS[i];

          return (
            <div
              key={row.agent}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 20px",
                background: arDin ? `${C.green}08` : C.surface,
                borderLeft: arDin ? `3px solid ${C.green}` : "3px solid transparent",
                transition: "background 0.2s",
              }}
            >
              {/* Rank */}
              <div style={{ width: "28px", flexShrink: 0, textAlign: "center" }}>
                {medal ? (
                  <span style={{ fontSize: "18px" }}>{medal}</span>
                ) : (
                  <span style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace" }}>#{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <a href={`/agent/${encodeURIComponent(row.agent)}`} style={{ flexShrink: 0 }}>
                <AgentAvatar namn={row.agent} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={40} />
              </a>

              {/* Name + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <a
                    href={`/agent/${encodeURIComponent(row.agent)}`}
                    style={{ fontSize: "14px", color: arDin ? C.green : C.accent, textDecoration: "none", fontWeight: arDin ? 700 : 400 }}
                  >
                    {row.agent}
                  </a>
                  {arDin && (
                    <span style={{ fontSize: "10px", color: C.green, background: `${C.green}15`, border: `1px solid ${C.green}40`, borderRadius: "20px", padding: "1px 8px", fontFamily: "monospace", fontWeight: 700 }}>
                      DIN KOALITION
                    </span>
                  )}
                  <span style={{
                    fontSize: "10px", color: mood.color,
                    background: `${mood.color}12`, border: `1px solid ${mood.color}30`,
                    borderRadius: "20px", padding: "1px 7px", fontFamily: "monospace",
                  }}>
                    {mood.emoji} {mood.label}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: "4px", background: C.border, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, background: arDin ? C.green : C.blue, borderRadius: "2px", transition: "width 0.4s" }} />
                </div>
              </div>

              {/* Count + button */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: arDin ? C.green : C.accent, fontFamily: "monospace" }}>
                    {row.foljare.toLocaleString("sv-SE")}
                  </span>
                  <span style={{ fontSize: "11px", color: C.textMuted, marginLeft: "4px" }}>
                    {pct > 0 ? `(${pct}%)` : ""}
                  </span>
                </div>
                {mounted && !arDin && (
                  <button
                    onClick={() => join(row.agent)}
                    disabled={loading}
                    style={{
                      fontSize: "11px", padding: "3px 10px", borderRadius: "4px", cursor: loading ? "default" : "pointer",
                      background: "none", border: `1px solid ${C.blue}60`, color: C.blue,
                      fontFamily: "monospace", transition: "border-color 0.15s",
                    }}
                  >
                    {minAgent ? "Byt" : "Gå med"}
                  </button>
                )}
                {mounted && arDin && (
                  <button
                    onClick={leave}
                    disabled={loading}
                    style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "4px", cursor: "pointer", background: "none", border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: "monospace" }}
                  >
                    Lämna
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: "12px", color: "#444", margin: "16px 0 0", textAlign: "center" }}>
        Ditt val lagras lokalt i din webbläsare. Du kan byta koalition när du vill.
      </p>
    </div>
  );
}
