"use client";

import { useEffect, useMemo, useState } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  border: "#222222",
  accent: "#f8fafc",
  textMuted: "#888880",
};

export default function RelateradeArtiklar({ artikelId, taggar = [], parentId = null }) {
  const [relaterade, setRelaterade] = useState([]);
  const taggNyckel = useMemo(() => JSON.stringify(taggar || []), [taggar]);

  useEffect(() => {
    if (!artikelId || !SB_KEY) {
      setRelaterade([]);
      return;
    }

    const controller = new AbortController();

    async function hamta() {
      try {
        const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
        const exclude = [artikelId, parentId].filter(Boolean).join(",");
        const excludeParam = exclude ? `&id=not.in.(${exclude})` : `&id=neq.${artikelId}`;
        const res = await fetch(
          `${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare,kalla,skapad,taggar${excludeParam}&order=skapad.desc&limit=30`,
          { headers, signal: controller.signal }
        );
        if (!res.ok) return;

        const pool = await res.json();
        const myTags = new Set(taggar || []);
        const scored = pool.map(a => ({
          ...a,
          _score: (a.taggar || []).filter(t => myTags.has(t)).length,
        }));
        scored.sort((a, b) => b._score - a._score);
        setRelaterade(scored.slice(0, 4));
      } catch (err) {
        if (err?.name !== "AbortError") setRelaterade([]);
      }
    }

    hamta();
    return () => controller.abort();
  }, [artikelId, parentId, taggNyckel]);

  if (relaterade.length === 0) return null;

  return (
    <div style={{ marginTop: "40px" }}>
      <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px 0" }}>
        Läs också
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.border, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
        {relaterade.map(r => (
          <a key={r.id} href={`/artikel/${r.id}`} className="relaterad-link">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                {r.kalla === "ai" && (
                  <span style={{ fontSize: "10px", color: "#4a9eff", fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>AI</span>
                )}
                <span style={{ fontSize: "15px", color: C.accent, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.rubrik}</span>
              </div>
              <span style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>
                {r.kalla === "ai" ? `Agent ${r.forfattare}` : r.forfattare}
                {r.skapad ? ` · ${new Date(r.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              </span>
            </div>
            <span style={{ color: C.textMuted, fontSize: "18px", flexShrink: 0 }}>→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
