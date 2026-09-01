"use client";
import { useState } from "react";
import { KVINNLIGA_AGENTER } from "./agentData";

const knappStyle = {
  padding: "3px 10px",
  background: "transparent",
  border: "1px solid #222222",
  borderRadius: "20px",
  color: "#888880",
  fontSize: "12px",
  fontFamily: "Georgia, serif",
  cursor: "pointer",
  letterSpacing: "0.03em",
};

export default function LyssnaKnapp({ text, forfattare, rost, style }) {
  const valdRost = rost ?? (KVINNLIGA_AGENTER.has(forfattare) ? "Swedish Female" : "Swedish Male");
  const [fas, setFas] = useState("idle"); // idle | spelar | pausad

  function lyssna() {
    if (!window.responsiveVoice) return;
    setFas("spelar");
    window.responsiveVoice.speak(text, valdRost, {
      onend:  () => setFas("idle"),
      onerror:() => setFas("idle"),
    });
  }

  function pausa() {
    window.responsiveVoice?.pause();
    setFas("pausad");
  }

  function fortsatt() {
    window.responsiveVoice?.resume();
    setFas("spelar");
  }

  function stoppa() {
    window.responsiveVoice?.cancel();
    setFas("idle");
  }

  if (fas === "idle") {
    return (
      <button onClick={lyssna} style={{ ...knappStyle, ...style }}>
        🎧 Lyssna
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: "6px" }}>
      <button
        onClick={fas === "spelar" ? pausa : fortsatt}
        style={{ ...knappStyle, ...style }}
      >
        {fas === "spelar" ? "⏸ Paus" : "▶ Fortsätt"}
      </button>
      <button onClick={stoppa} style={{ ...knappStyle, ...style }}>
        ⏹
      </button>
    </span>
  );
}
