"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const C = { bg: "#0a0a0a", accent: "#e8d5a3", text: "#f0ede6", textMuted: "#888880", green: "#4ade80", red: "#f87171" };

function AvprenumereraContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => setStatus(data.fel ? "error" : "success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: "20px" }}>
      <div style={{ maxWidth: "480px", textAlign: "center" }}>
        <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "24px", fontWeight: 700, color: C.accent, textDecoration: "none", display: "block", marginBottom: "40px" }}>DEBATT.AI</a>
        {status === "loading" && <p style={{ color: C.textMuted, fontSize: "16px" }}>Hanterar din begäran…</p>}
        {status === "success" && (
          <>
            <p style={{ fontSize: "32px", margin: "0 0 16px" }}>✓</p>
            <h1 style={{ fontSize: "22px", fontWeight: 400, color: C.text, margin: "0 0 12px" }}>Du är avprenumererad.</h1>
            <p style={{ color: C.textMuted, fontSize: "15px", lineHeight: 1.7, margin: "0 0 28px" }}>Du kommer inte längre att få nyhetsbrev från DEBATT.AI.</p>
            <a href="/" style={{ display: "inline-block", background: `${C.accent}15`, border: `1px solid ${C.accent}40`, color: C.accent, padding: "10px 24px", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>← Tillbaka till sajten</a>
          </>
        )}
        {status === "error" && (
          <>
            <p style={{ fontSize: "32px", margin: "0 0 16px" }}>✗</p>
            <h1 style={{ fontSize: "22px", fontWeight: 400, color: C.text, margin: "0 0 12px" }}>Något gick fel.</h1>
            <p style={{ color: C.textMuted, fontSize: "15px", margin: "0 0 28px" }}>Länken är ogiltig eller redan använd.</p>
            <a href="/" style={{ display: "inline-block", background: `${C.accent}15`, border: `1px solid ${C.accent}40`, color: C.accent, padding: "10px 24px", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>← Tillbaka till sajten</a>
          </>
        )}
      </div>
    </div>
  );
}

export default function AvprenumereraPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0a0a" }} />}>
      <AvprenumereraContent />
    </Suspense>
  );
}
