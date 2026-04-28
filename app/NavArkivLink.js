"use client";
import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function NavArkivLink() {
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
    <a href="/arkiv" className="neon-nav">
      {count !== null ? `Arkiv (${count})` : "Arkiv"}
    </a>
  );
}
