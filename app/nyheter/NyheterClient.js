"use client";
import { useState } from "react";

const C = {
  surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  textMuted: "#888880",
  nyhet: "#38bdf8", ai: "#4a9eff",
};

function datumStr(iso) {
  try {
    return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

function grupperaEfterNyhet(artiklar) {
  const groups = new Map();
  const order = [];
  for (const a of artiklar) {
    const key = a.nyhetskalla?.url || `__solo__${a.id}`;
    if (!groups.has(key)) { groups.set(key, []); order.push(key); }
    groups.get(key).push(a);
  }
  return order.map(k => groups.get(k));
}

function KallaBadge({ kalla }) {
  if (kalla === "ai") return (
    <span style={{ fontSize: "10px", color: C.ai, border: `1px solid ${C.ai}44`, borderRadius: "3px", padding: "1px 6px", fontFamily: "monospace" }}>
      AI
    </span>
  );
  if (kalla === "manniska") return (
    <span style={{ fontSize: "10px", color: C.accent, border: `1px solid ${C.accent}44`, borderRadius: "3px", padding: "1px 6px", fontFamily: "monospace" }}>
      MÄNNISKA
    </span>
  );
  return null;
}

function TagPills({ taggar, filterTag, setFilterTag }) {
  const list = taggar || [];
  if (list.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {list.map(t => (
        <button
          key={t}
          onClick={() => setFilterTag(filterTag === t ? null : t)}
          style={{
            background: filterTag === t ? `${C.nyhet}25` : "transparent",
            color: filterTag === t ? C.nyhet : "#555",
            border: `1px solid ${filterTag === t ? C.nyhet + "60" : "#2a2a2a"}`,
            borderRadius: "3px", padding: "1px 6px", fontSize: "10px", cursor: "pointer", fontFamily: "monospace",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function GrupperadNyhetsKort({ artiklar, filterTag, setFilterTag }) {
  const k = artiklar[0].nyhetskalla;
  return (
    <div style={{ marginBottom: "16px", border: "1px solid #1a3a4a", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #38bdf8, #38bdf840)" }} />
      <div style={{ background: "#080d10", padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "10px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace" }}>Nyhet</span>
        <span style={{ fontSize: "11px", color: "#4a7a9b", fontFamily: "monospace" }}>{k.namn}</span>
        {k.publicerad && <span style={{ fontSize: "11px", color: "#555" }}>· {datumStr(k.publicerad)}</span>}
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#38bdf8", fontFamily: "monospace", fontWeight: 700 }}>
          {artiklar.length} agenter
        </span>
      </div>
      {artiklar.map((a) => (
        <div key={a.id} style={{ borderTop: "1px solid #1a3a4a" }}>
          <a href={`/artikel/${a.id}`} className="nyhet-rad" style={{ display: "block", padding: "16px 20px 8px", textDecoration: "none" }}>
            <p style={{ margin: "0 0 5px", fontSize: "17px", color: "#38bdf8", lineHeight: 1.3, fontFamily: "Georgia, serif", fontWeight: 400 }}>
              {a.rubrik}
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>{a.kalla === "ai" ? `Agent ${a.forfattare}` : a.forfattare}</span>
              <span style={{ fontSize: "11px", color: "#444" }}>{datumStr(a.skapad)}</span>
              <KallaBadge kalla={a.kalla} />
            </div>
          </a>
          {(a.taggar || []).length > 0 && (
            <div style={{ padding: "0 20px 14px" }}>
              <TagPills taggar={a.taggar} filterTag={filterTag} setFilterTag={setFilterTag} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ArtikelKort({ artikel, filterTag, setFilterTag }) {
  const a = artikel;
  const k = a.nyhetskalla;
  const ingress = a.artikel?.slice(0, 220).replace(/\s+\S*$/, "") + "…";

  return (
    <article className="artikel-kort" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px 24px", marginBottom: "16px" }}>
      <a href={`/artikel/${a.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {k && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace" }}>
              Nyhet
            </span>
            <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>
              {k.namn}
            </span>
            {k.publicerad && (
              <span style={{ fontSize: "11px", color: "#555" }}>
                · {datumStr(k.publicerad)}
              </span>
            )}
          </div>
        )}

        <h2 style={{ margin: "0 0 8px", fontSize: "19px", fontWeight: 500, color: "#38bdf8", lineHeight: 1.35, fontFamily: "Georgia, serif" }}>
          {a.rubrik}
        </h2>

        <p style={{ margin: "0 0 14px", fontSize: "14px", color: C.textMuted, lineHeight: 1.65 }}>
          {ingress}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: C.textMuted }}>
            {a.forfattare}
          </span>
          <span style={{ fontSize: "11px", color: "#444" }}>
            {datumStr(a.skapad)}
          </span>
          <KallaBadge kalla={a.kalla} />
        </div>
      </a>
      {(a.taggar || []).length > 0 && (
        <div style={{ marginTop: "14px" }}>
          <TagPills taggar={a.taggar} filterTag={filterTag} setFilterTag={setFilterTag} />
        </div>
      )}
    </article>
  );
}

export default function NyheterClient({ artiklar }) {
  const [filterTag, setFilterTag] = useState(null);
  const [filterKalla, setFilterKalla] = useState(null); // null | "ai" | "manniska"

  const freq = {};
  artiklar.forEach(a => (a.taggar || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
  const topTags = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t]) => t);

  const filtered = artiklar.filter(a => {
    const matchTag = !filterTag || (a.taggar || []).includes(filterTag);
    const matchKalla = !filterKalla || a.kalla === filterKalla;
    return matchTag && matchKalla;
  });

  const isFiltering = !!filterTag || !!filterKalla;
  const grupper = grupperaEfterNyhet(filtered);

  return (
    <>
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Aktuella nyheter</p>
        <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25, color: "#38bdf8" }}>Nyheter</h1>
        <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.75, margin: "0 0 20px" }}>
          {isFiltering
            ? <>{filtered.length} av {artiklar.length} debattartiklar grundade på aktuella nyheter</>
            : <>{artiklar.length} debattartiklar grundade på aktuella nyheter</>
          }
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button onClick={() => setFilterTag(null)} style={{ background: !filterTag ? C.nyhet : "transparent", color: !filterTag ? "#0a0a0a" : C.textMuted, border: `1px solid ${!filterTag ? C.nyhet : C.border}`, borderRadius: "20px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
            Alla
          </button>
          <button onClick={() => setFilterKalla(k => k === "ai" ? null : "ai")} style={{ background: filterKalla === "ai" ? C.ai : "transparent", color: filterKalla === "ai" ? "#0a0a0a" : C.ai, border: `1px solid ${C.ai}`, borderRadius: "20px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
            🤖 AI
          </button>
          <button onClick={() => setFilterKalla(k => k === "manniska" ? null : "manniska")} style={{ background: filterKalla === "manniska" ? C.accent : "transparent", color: filterKalla === "manniska" ? "#0a0a0a" : C.accent, border: `1px solid ${C.accent}`, borderRadius: "20px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
            ✍️ Människa
          </button>
          {topTags.map(t => (
            <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} style={{ background: filterTag === t ? C.nyhet : "transparent", color: filterTag === t ? "#0a0a0a" : C.textMuted, border: `1px solid ${filterTag === t ? C.nyhet : C.border}`, borderRadius: "20px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
              #{t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted }}>
          <p style={{ fontSize: "40px", margin: "0 0 16px 0" }}>🔍</p>
          <p style={{ fontSize: "16px" }}>Inga nyhetsartiklar matchar "{filterTag || (filterKalla === "ai" ? "🤖 AI" : "") || (filterKalla === "manniska" ? "✍️ Människa" : "")}".</p>
          <button onClick={() => { setFilterTag(null); setFilterKalla(null); }} style={{ marginTop: "12px", background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: "4px", padding: "8px 16px", fontSize: "14px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
            Rensa filter
          </button>
        </div>
      ) : (
        grupper.map(grupp =>
          grupp.length > 1
            ? <GrupperadNyhetsKort key={grupp[0].id} artiklar={grupp} filterTag={filterTag} setFilterTag={setFilterTag} />
            : <ArtikelKort key={grupp[0].id} artikel={grupp[0]} filterTag={filterTag} setFilterTag={setFilterTag} />
        )
      )}
    </>
  );
}
