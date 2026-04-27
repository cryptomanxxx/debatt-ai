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

export default function NavHistorikLink({ active, style }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/chatt_debatter?select=id`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then(r => r.json())
      .then(d => setCount(d.length))
      .catch(() => {});
  }, []);

  const label = count !== null ? `Debatthistorik (${count})` : "Debatthistorik";

  return (
    <a href="/chatt/historik" style={style ?? {
      ...DEFAULT_STYLE,
      background: active ? "rgba(45,212,191,0.15)" : "transparent",
      border: `1px solid ${active ? "#2dd4bf" : "#222222"}`,
      color: active ? "#2dd4bf" : "#888880",
    }}>
      {label}
    </a>
  );
}
