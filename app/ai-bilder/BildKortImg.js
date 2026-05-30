"use client";
import { useState } from "react";

function nyPollinationsUrl(prompt) {
  const seed = Math.floor(Math.random() * 99999) + 1;
  const kort = prompt.slice(0, 400);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(kort)}?width=768&height=512&nologo=true&model=flux&seed=${seed}`;
}

export default function BildKortImg({ src, alt, prompt }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retried, setRetried] = useState(false);
  const [failed, setFailed] = useState(false);

  function handleError() {
    if (!retried && prompt) {
      setRetried(true);
      setCurrentSrc(nyPollinationsUrl(prompt));
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#111", color: "#555", fontSize: 36,
        position: "absolute", inset: 0,
      }}>
        🖼️
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      loading="lazy"
      onError={handleError}
    />
  );
}
