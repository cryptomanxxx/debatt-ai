"use client";
import { useState, useEffect } from "react";

export default function BastaArgumentet({ artikelIds }) {
  const [basta, setBasta] = useState(null);

  useEffect(() => {
    if (!artikelIds || !artikelIds.length) return;
    fetch(`/api/argument-roster?artikel_ids=${artikelIds.join(",")}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || !data.length) return;
        const top = data.reduce((a, b) => b.roster > a.roster ? b : a, data[0]);
        if (top && top.roster >= 2) setBasta(top);
      })
      .catch(() => {});
  }, [artikelIds.join(",")]);

  if (!basta) return null;

  const text = basta.stycke_text.length > 320
    ? basta.stycke_text.slice(0, 320) + "…"
    : basta.stycke_text;

  return (
    <div style={{
      marginBottom: "20px",
      background: "#060e06",
      border: "1px solid #4ade8028",
      borderRadius: "8px",
      padding: "16px 20px",
    }}>
      <p style={{ fontSize: "10px", color: "#4ade80", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px 0" }}>
        Bästa argumentet i tråden · ▲ {basta.roster} {basta.roster === 1 ? "läsare" : "läsare"}
      </p>
      <p style={{ color: "#f0ede6", fontSize: "15px", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
        "{text}"
      </p>
    </div>
  );
}
