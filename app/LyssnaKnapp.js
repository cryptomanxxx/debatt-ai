"use client";
import { useState, useRef } from "react";

function splitToChunks(text, maxLen = 150) {
  const sentences = text.replace(/\n+/g, " ").match(/[^.!?]+[.!?]*/g) || [text];
  const chunks = [];
  for (const s of sentences) {
    const t = s.trim();
    if (!t) continue;
    if (t.length <= maxLen) {
      chunks.push(t);
    } else {
      // Break long sentences at commas or word boundaries
      const parts = t.match(new RegExp(`.{1,${maxLen}}(?:[,\\s]|$)`, "g")) || [t];
      chunks.push(...parts.map(p => p.trim()).filter(Boolean));
    }
  }
  return chunks;
}

export default function LyssnaKnapp({ text, style }) {
  const [spelar, setSpelar] = useState(false);
  const stopRef = useRef(false);
  const audioRef = useRef(null);

  async function lyssna() {
    stopRef.current = false;
    setSpelar(true);
    const chunks = splitToChunks(text);

    for (const chunk of chunks) {
      if (stopRef.current) break;
      await new Promise((resolve) => {
        const audio = new Audio(`/api/tts?text=${encodeURIComponent(chunk)}`);
        audioRef.current = audio;
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
    }

    if (!stopRef.current) setSpelar(false);
  }

  function stoppa() {
    stopRef.current = true;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpelar(false);
  }

  return (
    <button
      onClick={spelar ? stoppa : lyssna}
      style={{
        padding: "3px 10px",
        background: "transparent",
        border: "1px solid #222222",
        borderRadius: "20px",
        color: "#888880",
        fontSize: "12px",
        fontFamily: "Georgia, serif",
        cursor: "pointer",
        letterSpacing: "0.03em",
        ...style,
      }}
    >
      {spelar ? "⏹ Stoppa" : "🎧 Lyssna"}
    </button>
  );
}
