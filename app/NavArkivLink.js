"use client";
import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEFAULT_STYLE = {
  flex: 1, textAlign: "center",
  background: "transparent",
  border: "1px solid #222222",
  color: "#888880",
  padding: "6px 14px", borderRadius: "4px",
  fontSize: "13px", letterSpacing: "0.05em",
  fontFamily: "Georgia, serif", textDecoration: "none",
  display: "block",
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
