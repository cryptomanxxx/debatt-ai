"use client";
import { useState } from "react";

export default function AgentAvatar({ namn, gradient, ring, ikon, ikonFarg, size = 100 }) {
  const [fel, setFel] = useState(false);
  const slug = namn.toLowerCase()
    .replace(/ /g, "-")
    .replace(/ö/g, "o")
    .replace(/ä/g, "a")
    .replace(/å/g, "a");

  const px = `${size}px`;
  const fontSize = `${Math.round(size * 0.3)}px`;

  if (fel) {
    return (
      <div style={{ width: px, height: px, borderRadius: "50%", background: gradient, border: `1px solid ${ring}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize, color: ikonFarg, flexShrink: 0, fontFamily: "Georgia, serif", userSelect: "none" }}>
        {ikon}
      </div>
    );
  }

  return (
    <img
      src={`/avatarer/${slug}.png`}
      alt={namn}
      width={size}
      height={size}
      onError={() => setFel(true)}
      style={{ width: px, height: px, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
    />
  );
}
