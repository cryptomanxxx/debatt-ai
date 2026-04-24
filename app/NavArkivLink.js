"use client";
import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEFAULT_STYLE = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  height: "40px", padding: "0 16px", boxSizing: "border-box",
  flex: 1, background: "transparent",
  border: "1px solid #222222",
  color: "#888880",
  borderRadius: "4px", fontSize: "14px", letterSpacing: "0.05em",
  fontFamily: "Georgia, serif", textDecoration: "none",
};

export default function NavArkivLink({ style }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/artiklar?select=id`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then(r => r.json())
      .then(d => setCount(d.length))
      .catch(() => {});
  }, []);

  return (
    <a href="/arkiv" style={style ?? DEFAULT_STYLE}>
      {count !== null ? `Arkiv (${count})` : "Arkiv"}
    </a>
  );
}
