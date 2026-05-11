"use client";
import { useState, useRef } from "react";
import { agentRost } from "../../agentData";

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

export default function ChattLyssna({ inlagg }) {
  const [fas, setFas] = useState("idle"); // idle | spelar | pausad
  const stoppRef = useRef(false);

  function speak(text, agent) {
    return new Promise(resolve => {
      if (stoppRef.current) { resolve(); return; }
      const { voice, rate, pitch } = agentRost(agent);
      window.responsiveVoice.speak(text, voice, {
        rate, pitch,
        onend:  resolve,
        onerror:resolve,
      });
    });
  }

  async function lyssna() {
    if (!window.responsiveVoice) return;
    stoppRef.current = false;
    setFas("spelar");
    for (const e of inlagg) {
      if (stoppRef.current) break;
      await speak(e.text, e.agent);
    }
    if (!stoppRef.current) setFas("idle");
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
    stoppRef.current = true;
    window.responsiveVoice?.cancel();
    setFas("idle");
  }

  if (fas === "idle") {
    return <button onClick={lyssna} style={knappStyle}>🎧 Lyssna</button>;
  }

  return (
    <span style={{ display: "inline-flex", gap: "6px" }}>
      <button onClick={fas === "spelar" ? pausa : fortsatt} style={knappStyle}>
        {fas === "spelar" ? "⏸ Paus" : "▶ Fortsätt"}
      </button>
      <button onClick={stoppa} style={knappStyle}>⏹</button>
    </span>
  );
}
