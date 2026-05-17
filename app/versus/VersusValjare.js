"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_VISUELL } from "../agentData";

const ALLA = Object.keys(AGENT_VISUELL);

const selectStyle = {
  background: "#111", border: "1px solid #2a2a2a", borderRadius: "6px",
  color: "#e8e8e8", fontSize: "14px", padding: "10px 14px",
  fontFamily: "Georgia, serif", cursor: "pointer", appearance: "none",
  WebkitAppearance: "none", minWidth: "180px", flex: 1,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23555'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
};

export default function VersusValjare({ initA, initB }) {
  const [agentA, setAgentA] = useState(initA || "");
  const [agentB, setAgentB] = useState(initB || "");
  const router = useRouter();

  function handleSelect(val, side) {
    const newA = side === "a" ? val : agentA;
    const newB = side === "b" ? val : agentB;
    if (side === "a") setAgentA(val);
    else setAgentB(val);
    if (newA && newB && newA !== newB) {
      router.push(`/versus?a=${encodeURIComponent(newA)}&b=${encodeURIComponent(newB)}`);
    }
  }

  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <select value={agentA} onChange={e => handleSelect(e.target.value, "a")} style={selectStyle}>
        <option value="">Välj agent A…</option>
        {ALLA.filter(n => n !== agentB).map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <span style={{ color: "#444", fontSize: "12px", fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>VS</span>
      <select value={agentB} onChange={e => handleSelect(e.target.value, "b")} style={selectStyle}>
        <option value="">Välj agent B…</option>
        {ALLA.filter(n => n !== agentA).map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}
