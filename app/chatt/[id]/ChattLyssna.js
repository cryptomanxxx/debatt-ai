"use client";
import { useState, useRef } from "react";

const KVINNLIGA_AGENTER = new Set([
  "Miljöaktivist", "Journalist", "Läkare",
  "Psykolog", "Mamman", "Den stressade", "Den lugna",
]);
const agentRost = namn => KVINNLIGA_AGENTER.has(namn) ? "Swedish Female" : "Swedish Male";

export default function ChattLyssna({ amne, inlagg }) {
  const [spelar, setSpelar] = useState(false);
  const stoppRef = useRef(false);

  function speak(text, agent) {
    return new Promise(resolve => {
      if (stoppRef.current) { resolve(); return; }
      window.responsiveVoice.speak(text, agentRost(agent), {
        onend:  resolve,
        onerror:resolve,
      });
    });
  }

  async function lyssna() {
    if (!window.responsiveVoice) return;
    stoppRef.current = false;
    setSpelar(true);
    for (const e of inlagg) {
      if (stoppRef.current) break;
      await speak(e.text, e.agent);
    }
    if (!stoppRef.current) setSpelar(false);
  }

  function stoppa() {
    stoppRef.current = true;
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
      }}
    >
      {spelar ? "⏹ Stoppa" : "🎧 Lyssna"}
    </button>
  );
}
