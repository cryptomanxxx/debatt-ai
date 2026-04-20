"use client";
import { useState } from "react";

function splitToChunks(text, maxLen = 180) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const chunks = [];
  let current = "";
  for (const s of sentences) {
    if (current.length + s.length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export default function LyssnaKnapp({ text, style }) {
  const [spelar, setSpelar] = useState(false);

  function lyssna() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();

    const chunks = splitToChunks(text);
    let idx = 0;

    function spelaNext() {
      if (idx >= chunks.length) { setSpelar(false); return; }
      const utt = new SpeechSynthesisUtterance(chunks[idx]);
      utt.lang = "sv-SE";
      utt.rate = 0.95;
      utt.onend = () => { idx++; spelaNext(); };
      utt.onerror = () => setSpelar(false);
      synth.speak(utt);
    }

    setSpelar(true);

    const voices = synth.getVoices();
    if (voices.length > 0) {
      spelaNext();
    } else {
      synth.onvoiceschanged = () => { synth.onvoiceschanged = null; spelaNext(); };
      setTimeout(spelaNext, 500);
    }
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
