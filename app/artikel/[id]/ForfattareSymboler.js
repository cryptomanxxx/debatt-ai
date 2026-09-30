"use client";

import { useEffect, useState } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function ForfattareSymboler({ forfattare }) {
  const [symboler, setSymboler] = useState([]);

  useEffect(() => {
    if (!forfattare || !SB_KEY) {
      setSymboler([]);
      return;
    }

    const controller = new AbortController();

    async function hamta() {
      try {
        const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
        const symbolRes = await fetch(
          `${SB_URL}/rest/v1/agent_symboler?agent=eq.${encodeURIComponent(forfattare)}&select=vara_id,pris_betalt&order=pris_betalt.desc&limit=5`,
          { headers, signal: controller.signal }
        );
        if (!symbolRes.ok) return;

        const innehav = await symbolRes.json();
        if (!Array.isArray(innehav) || innehav.length === 0) {
          setSymboler([]);
          return;
        }

        const varaIds = innehav.map(s => s.vara_id).join(",");
        const iconRes = await fetch(
          `${SB_URL}/rest/v1/butik_varor?id=in.(${varaIds})&select=id,ikon`,
          { headers, signal: controller.signal }
        );
        if (!iconRes.ok) return;

        const varor = await iconRes.json();
        const ikonMap = Object.fromEntries(varor.map(v => [v.id, v.ikon]));
        setSymboler(innehav.map(s => ikonMap[s.vara_id]).filter(Boolean).slice(0, 3));
      } catch (err) {
        if (err?.name !== "AbortError") setSymboler([]);
      }
    }

    hamta();
    return () => controller.abort();
  }, [forfattare]);

  if (symboler.length === 0) return null;

  return (
    <span
      style={{ fontSize: "16px", letterSpacing: "2px", opacity: 0.85 }}
      title={symboler.join(" ")}
    >
      {symboler.join("")}
    </span>
  );
}
