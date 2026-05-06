"use client";
import { useState } from "react";

export default function LyssnaKnapp({ text, rost = "Swedish Male", style }) {
  const [spelar, setSpelar] = useState(false);

  function lyssna() {
    if (!window.responsiveVoice) return;
    setSpelar(true);
    window.responsiveVoice.speak(text, rost, {
      onend:  () => setSpelar(false),
      onerror:() => setSpelar(false),
    });
  }

  function stoppa() {
    window.responsiveVoice?.cancel();
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
