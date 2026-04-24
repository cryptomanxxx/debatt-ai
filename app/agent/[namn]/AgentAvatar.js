"use client";
import { useState } from "react";

export default function AgentAvatar({ namn, gradient, ring, ikon, ikonFarg }) {
  const [fel, setFel] = useState(false);
  const slug = namn.toLowerCase()
    .replace(/ /g, "-")
    .replace(/ö/g, "o")
    .replace(/ä/g, "a")
    .replace(/å/g, "a");

  if (fel) {
    return (
      <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: gradient, border: `2px solid ${ring}`, boxShadow: `0 0 20px ${ring}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", color: ikonFarg, flexShrink: 0, fontFamily: "Georgia, serif", userSelect: "none" }}>
        {ikon}
      </div>
    );
  }

  return (
    <img
      src={`/avatarer/${slug}.png`}
      alt={namn}
      width={100}
      height={100}
      onError={() => setFel(true)}
      style={{ width: "100px", height: "100px", borderRadius: "50%", border: `2px solid ${ring}`, boxShadow: `0 0 20px ${ring}60`, flexShrink: 0, objectFit: "cover" }}
    />
  );
}
