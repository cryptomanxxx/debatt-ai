"use client";
import { useState, useEffect, useRef } from "react";

export default function ArgumentRoster({ artikelId, artikelText }) {
  const paragraphs = (artikelText || "").split("\n\n").filter(Boolean);
  const [votes, setVotes] = useState({});
  const [voted, setVoted] = useState({});
  const [hovered, setHovered] = useState(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia("(hover: none)").matches) setIsTouch(true);

    const v = {};
    paragraphs.forEach((_, i) => {
      if (localStorage.getItem(`arg_${artikelId}_${i}`) === "1") v[i] = true;
    });
    setVoted(v);

    fetch(`/api/argument-roster?artikel_ids=${artikelId}`)
      .then(r => r.json())
      .then(data => {
        const m = {};
        for (const row of Array.isArray(data) ? data : []) {
          if (String(row.artikel_id) === String(artikelId)) m[row.stycke_index] = row.roster;
        }
        setVotes(m);
      })
      .catch(() => {});
  }, [artikelId]);

  async function vote(index) {
    if (voted[index]) return;
    setVoted(prev => ({ ...prev, [index]: true }));
    setVotes(prev => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
    localStorage.setItem(`arg_${artikelId}_${index}`, "1");
    try {
      const res = await fetch("/api/argument-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artikel_id: artikelId, stycke_index: index, stycke_text: paragraphs[index] }),
      });
      const d = await res.json();
      if (d.roster !== undefined) setVotes(prev => ({ ...prev, [index]: d.roster }));
    } catch {}
  }

  return (
    <div style={{ marginBottom: "48px", maxWidth: "660px" }}>
      {/* Förklaringstext */}
      <p style={{ fontSize: "11px", color: "#444", fontFamily: "monospace", letterSpacing: "0.06em", margin: "0 0 24px 0", textAlign: "right" }}>
        {isTouch ? "Tryck på ▲ bredvid ett stycke för att lyfta fram det bästa argumentet" : "Hovra över ett stycke och klicka ▲ för att lyfta fram det bästa argumentet"}
      </p>

      {paragraphs.map((p, i) => {
        const hasVotes = (votes[i] || 0) > 0;
        const isVoted = !!voted[i];
        // On touch: always show button (at low opacity unless voted/has votes)
        // On desktop: show on hover or if voted/has votes
        const showBtn = isTouch || hovered === i || hasVotes || isVoted;
        const btnOpacity = isTouch && !hovered && !hasVotes && !isVoted ? 0.25 : 1;

        return (
          <div
            key={i}
            style={{ position: "relative", margin: "0 0 28px 0" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <p style={{ fontSize: "18px", lineHeight: 2, color: "#f0ede6", margin: 0, paddingRight: "48px" }}>{p}</p>
            <button
              onClick={() => vote(i)}
              title={isVoted ? "Röstad" : "Lyft fram detta argument"}
              aria-label="Rösta på argument"
              style={{
                position: "absolute",
                right: 0,
                top: "4px",
                display: showBtn ? "flex" : "none",
                flexDirection: "column",
                alignItems: "center",
                gap: "1px",
                background: isVoted ? "#0a200a" : "transparent",
                border: isVoted ? "1px solid #4ade8040" : "1px solid transparent",
                borderRadius: "6px",
                cursor: isVoted ? "default" : "pointer",
                padding: "5px 8px",
                opacity: btnOpacity,
                transition: "opacity 0.15s, background 0.15s",
                minWidth: "32px",
              }}
            >
              <span style={{ fontSize: "12px", color: isVoted ? "#4ade80" : "#555555", lineHeight: 1 }}>▲</span>
              <span style={{ fontSize: "10px", color: isVoted ? "#4ade80" : "#666666", fontFamily: "monospace", lineHeight: 1, minHeight: "12px" }}>
                {hasVotes ? votes[i] : ""}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
