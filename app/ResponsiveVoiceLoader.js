"use client";
import { useEffect } from "react";

export default function ResponsiveVoiceLoader() {
  useEffect(() => {
    if (document.getElementById("rv-script")) return;
    const s = document.createElement("script");
    s.id = "rv-script";
    s.src = "https://code.responsivevoice.org/responsivevoice.js?key=nQnR2SiW";
    s.async = true;
    document.head.appendChild(s);
  }, []);
  return null;
}
