"use client";
import { useState } from "react";

export default function LyssnaKnapp({ text, style }) {
  const [spelar, setSpelar] = useState(false);

  function lyssna() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    setSpelar(true);

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "sv-SE";
      utt.rate = 0.95;
      utt.onend = () => setSpelar(false);
      utt.onerror = () => setSpelar(false);
      synth.speak(utt);
    };

    // cancel() is async — give it 50ms before speaking
    // Also handles browsers where voices aren't ready yet
    let done = false;
    const once = () => { if (done) return; done = true; doSpeak(); };

    setTimeout(() => {
      if (synth.getVoices().length > 0) {
        once();
      } else {
        synth.onvoiceschanged = () => { synth.onvoiceschanged = null; once(); };
        setTimeout(once, 800);
      }
    }, 50);
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
