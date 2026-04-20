"use client";
import { useState } from "react";

export default function LyssnaKnapp({ text, style }) {
  const [spelar, setSpelar] = useState(false);

  function lyssna() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "sv-SE";
    utt.rate = 0.95;
    utt.onend = () => setSpelar(false);
    utt.onerror = () => setSpelar(false);
    setSpelar(true);
    window.speechSynthesis.speak(utt);
  }

  function stoppa() {
    window.speechSynthesis?.cancel();
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
