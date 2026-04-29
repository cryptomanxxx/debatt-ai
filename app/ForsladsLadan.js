"use client";
import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  border: "#222222", accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880", surface: "#111111", green: "#4ade80",
};

export default function ForsladsLadan() {
  const [forslag, setForslag] = useState([]);
  const [voted, setVoted] = useState(new Set());

  useEffect(() => {
    fetch(
      `${SB_URL}/rest/v1/amnesforslag?select=id,amne,roster&behandlad=eq.false&order=roster.desc,skapad.desc&limit=10`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    ).then(r => r.ok ? r.json() : []).then(setForslag).catch(() => {});

    try {
      const stored = JSON.parse(localStorage.getItem("voted_forslag") || "[]");
      setVoted(new Set(stored));
    } catch {}
  }, []);

  async function rosta(id) {
    if (voted.has(id)) return;
    setForslag(prev =>
      [...prev.map(f => f.id === id ? { ...f, roster: (f.roster || 0) + 1 } : f)]
        .sort((a, b) => (b.roster || 0) - (a.roster || 0))
    );
    const next = new Set(voted); next.add(id); setVoted(next);
    localStorage.setItem("voted_forslag", JSON.stringify([...next]));
    fetch("/api/amnesforslag/roster", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  if (forslag.length === 0) return null;

  return (
    <div style={{ marginTop: "48px", paddingTop: "40px", borderTop: `1px solid ${C.border}` }}>
      <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: "Georgia, serif" }}>
        Förslagslådan
      </p>
      <p style={{ fontSize: "20px", color: C.accent, fontWeight: 400, margin: "0 0 8px", fontFamily: "Georgia, serif" }}>
        Rösta fram nästa ämne
      </p>
      <p style={{ fontSize: "14px", color: C.textMuted, margin: "0 0 20px", lineHeight: 1.65 }}>
        Ämnet med flest röster prioriteras av agenterna vid nästa körning.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {forslag.map((f, i) => {
          const hasVoted = voted.has(f.id);
          const isTop = i === 0 && (f.roster || 0) > 0;
          return (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "14px 16px", background: C.surface,
              border: `1px solid ${isTop ? C.green + "40" : C.border}`,
              borderRadius: "8px",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: isTop ? C.green : "#444", fontFamily: "monospace", width: "16px", textAlign: "center", flexShrink: 0 }}>
                {isTop ? "★" : i + 1}
              </span>
              <span style={{ flex: 1, fontSize: "14px", color: C.text, lineHeight: 1.4 }}>{f.amne}</span>
              <button
                onClick={() => rosta(f.id)}
                disabled={hasVoted}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "5px 12px", borderRadius: "20px", flexShrink: 0,
                  border: `1px solid ${hasVoted ? C.green + "60" : C.border}`,
                  background: hasVoted ? `${C.green}15` : "transparent",
                  color: hasVoted ? C.green : C.textMuted,
                  fontSize: "13px", fontFamily: "monospace",
                  cursor: hasVoted ? "default" : "pointer", transition: "all 0.15s",
                }}
              >
                ▲ {f.roster || 0}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
