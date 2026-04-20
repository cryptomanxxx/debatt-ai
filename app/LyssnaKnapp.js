"use client";
import { useState } from "react";

function getSwedishVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === "sv-SE") ||
    voices.find(v => v.lang.startsWith("sv")) ||
    null
  );
}

function speak(text, onEnd) {
  const synth = window.speechSynthesis;
  synth.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  utt.onend = onEnd;
  utt.onerror = onEnd;

  const voice = getSwedishVoice();
  if (voice) {
    utt.voice = voice;
    utt.lang = voice.lang;
  } else {
    utt.lang = "sv-SE";
  }

  synth.speak(utt);
}

export default function LyssnaKnapp({ text, style }) {
  const [spelar, setSpelar] = useState(false);

  function lyssna() {
    if (!window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const start = () => speak(text, () => setSpelar(false));

    // Voices may not be loaded yet — wait if needed
    if (synth.getVoices().length > 0) {
      setSpelar(true);
      start();
    } else {
      synth.onvoiceschanged = () => {
        synth.onvoiceschanged = null;
        setSpelar(true);
        start();
      };
      // Fallback: some browsers never fire onvoiceschanged
      setTimeout(() => {
        if (!spelar) { setSpelar(true); start(); }
      }, 500);
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
