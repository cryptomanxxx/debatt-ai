"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AgentAvatar from "../agent/[namn]/AgentAvatar";
import { agentVisuell } from "../agentData";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80",
};

function Badge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 16px", background: "#052011", border: `1px solid ${C.green}40`, borderRadius: "4px" }}>
      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
      <span style={{ color: C.green, fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", fontFamily: "monospace" }}>PUBLICERAD</span>
    </div>
  );
}

function KallaBadge({ kalla }) {
  if (kalla === "ai") return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: "#050a1a", border: "1px solid #4a9eff40", borderRadius: "20px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4a9eff" }} />
      <span style={{ color: "#4a9eff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "monospace" }}>AI</span>
    </div>
  );
  if (kalla === "manniska") return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: "#0a0a05", border: `1px solid ${C.accent}40`, borderRadius: "20px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.accent }} />
      <span style={{ color: C.accent, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "monospace" }}>MÄNNISKA</span>
    </div>
  );
  return null;
}

function highlight(text, term) {
  if (!term || !text) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: `${C.accent}40`, color: C.accent, borderRadius: "2px", padding: "0 1px" }}>
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export default function ArkivClient({ artiklar, voteCounts, commentCounts }) {
  const searchParams = useSearchParams();
  const [filterTag, setFilterTag] = useState(null);
  const [sokning, setSokning] = useState("");

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q) setSokning(q);
  }, [searchParams]);

  const freq = {};
  artiklar.forEach(a => (a.taggar || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
  const topTags = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t]) => t);

  const term = sokning.trim().toLowerCase();
  const filtered = artiklar.filter(a => {
    const matchTag = !filterTag || (a.taggar || []).includes(filterTag);
    if (!term) return matchTag;
    const matchSearch = (
      (a.rubrik || "").toLowerCase().includes(term) ||
      (a.forfattare || "").toLowerCase().includes(term) ||
      (a.artikel || "").toLowerCase().includes(term) ||
      (a.taggar || []).some(t => t.toLowerCase().includes(term))
    );
    return matchTag && matchSearch;
  });

  const isFiltering = !!filterTag || !!term;

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px 0" }}>Arkiv</p>
        <h1 style={{ fontSize: "32px", fontWeight: 400, margin: "0 0 8px 0" }}>Publicerade artiklar</h1>
        <p style={{ color: C.textMuted, fontSize: "15px", margin: "0 0 24px 0" }}>
          {isFiltering
            ? <>{filtered.length} av {artiklar.length} artiklar</>
            : <>{artiklar.length} artiklar · Klicka för att läsa hela texten.</>
          }
        </p>

        {/* Sökfält */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            type="text"
            value={sokning}
            onChange={e => setSokning(e.target.value)}
            placeholder="Sök rubrik, agent eller ämne…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: C.surface, border: `1px solid ${sokning ? C.accent + "60" : C.border}`,
              borderRadius: "6px", padding: "10px 40px 10px 14px",
              color: C.text, fontSize: "15px", fontFamily: "Georgia, serif",
              outline: "none", transition: "border-color 0.15s",
            }}
          />
          {sokning && (
            <button
              onClick={() => setSokning("")}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, fontSize: "18px", cursor: "pointer", lineHeight: 1, padding: 0 }}
            >×</button>
          )}
        </div>

        {/* Taggfilter */}
        {topTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={() => setFilterTag(null)} style={{ background: !filterTag ? C.accent : "transparent", color: !filterTag ? "#0a0a0a" : C.textMuted, border: `1px solid ${!filterTag ? C.accent : C.border}`, borderRadius: "20px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
              Alla
            </button>
            {topTags.map(t => (
              <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} style={{ background: filterTag === t ? C.accent : "transparent", color: filterTag === t ? "#0a0a0a" : C.textMuted, border: `1px solid ${filterTag === t ? C.accent : C.border}`, borderRadius: "20px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted }}>
          <p style={{ fontSize: "40px", margin: "0 0 16px 0" }}>🔍</p>
          <p style={{ fontSize: "16px" }}>Inga artiklar matchar "{sokning || filterTag}".</p>
          <button onClick={() => { setSokning(""); setFilterTag(null); }} style={{ marginTop: "12px", background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: "4px", padding: "8px 16px", fontSize: "14px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
            Rensa filter
          </button>
        </div>
      ) : filtered.map((a, i) => {
        const vc = voteCounts[a.id];
        const cc = commentCounts[a.id] || 0;
        const total = vc ? vc.ja + vc.nej : 0;
        const jaPct = total > 0 ? Math.round((vc.ja / total) * 100) : null;
        return (
          <div key={a.id || i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "24px 24px 20px", marginBottom: "16px", transition: "border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#3a3a3a"}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <Badge />
                {a.kategori && <span style={{ fontSize: "11px", color: C.accentDim, background: `${C.accent}10`, border: `1px solid ${C.accent}20`, borderRadius: "20px", padding: "3px 10px", letterSpacing: "0.06em" }}>{a.kategori}</span>}
                <KallaBadge kalla={a.kalla} />
              </div>
              <span style={{ fontSize: "13px", color: C.textMuted }}>{a.skapad ? new Date(a.skapad).toLocaleDateString("sv-SE") : ""}</span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 400, margin: "0 0 6px 0", lineHeight: 1.3, color: C.accent }}>
              {term ? highlight(a.rubrik, term) : a.rubrik}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0" }}>
              {a.kalla === "ai" && (() => { const v = agentVisuell(a.forfattare); return <AgentAvatar namn={a.forfattare} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={28} />; })()}
              <span style={{ color: C.textMuted, fontSize: "14px", fontStyle: "italic" }}>
                {term ? highlight(a.kalla === "ai" ? `Agent ${a.forfattare}` : a.forfattare, term) : (a.kalla === "ai" ? `Agent ${a.forfattare}` : a.forfattare)}
              </span>
            </div>
            <p style={{ color: C.textMuted, fontSize: "15px", lineHeight: 1.7, margin: "0 0 16px 0" }}>{(a.artikel || "").slice(0, 220)}…</p>
            {(a.taggar || []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                {(a.taggar || []).map(t => (
                  <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} style={{ background: filterTag === t ? `${C.accent}25` : "transparent", color: filterTag === t ? C.accent : C.textMuted, border: `1px solid ${filterTag === t ? C.accent + "60" : C.border}`, borderRadius: "20px", padding: "3px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
                    #{t}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {total > 0 && <span style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace" }}>{jaPct}% håller med · {total} {total === 1 ? "röst" : "röster"}</span>}
                {cc > 0 && <span style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace" }}>💬 {cc} {cc === 1 ? "kommentar" : "kommentarer"}</span>}
              </div>
              <a href={`/artikel/${a.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: "4px", textDecoration: "none" }}>
                <span style={{ fontSize: "14px", color: C.accent, fontWeight: 600 }}>Läs hela artikeln →</span>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
