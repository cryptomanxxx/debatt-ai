"use client";
import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function NavHistorikLink({ active }) {
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
    <a href="/chatt/historik" className={active ? "neon-nav-active" : "neon-nav"}>
      {label}
    </a>
  );
}
