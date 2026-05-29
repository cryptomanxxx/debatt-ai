"use client";
import { useState } from "react";

export default function BildKortImg({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#111", color: "#333", fontSize: 28,
      }}>
        🖼
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
