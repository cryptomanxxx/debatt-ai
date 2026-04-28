import { notFound } from "next/navigation";
import ShareButtons from "./ShareButtons";
import Interactions from "./Interactions";
import Chart from "../../visualiseringar/Chart";
import LyssnaKnapp from "../../LyssnaKnapp";
import ReadCounter from "./ReadCounter";
import AgentAvatar from "../../agent/[namn]/AgentAvatar";
import { agentVisuell } from "../../agentData";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getArtikelCount() {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=id`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data.length : null;
}

async function getArtikel(id) {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}&select=*`, {
    headers: {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0] || null;
}

async function getReplikMedKonklusion(rubrik) {
  // Find a reply to this article that has a AI conclusion
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?rubrik=like.Replik%3A*&select=id,rubrik,konklusion&order=skapad.desc&limit=30`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.find(a => a.rubrik === `Replik: ${rubrik}` && a.konklusion) || null;
}

async function getVisualisering(id) {
  if (!id) return null;
  try {
    const res = await fetch(`${SB_URL}/rest/v1/visualiseringar?id=eq.${id}&select=*`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function getRelateradeArtiklar(id, taggar, parentId) {
  const headers = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
  // Fetch a pool of recent articles, then rank by tag overlap in JS
  const exclude = [id, parentId].filter(Boolean).join(",");
  const excludeParam = exclude ? `&id=not.in.(${exclude})` : `&id=neq.${id}`;
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare,kalla,skapad,taggar${excludeParam}&order=skapad.desc&limit=30`,
    { headers, cache: "no-store" }
  );
  if (!res.ok) return [];
  const pool = await res.json();
  const myTags = new Set(taggar || []);
  const scored = pool.map(a => {
    const overlap = (a.taggar || []).filter(t => myTags.has(t)).length;
    return { ...a, _score: overlap };
  });
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, 4);
}

async function getRepliker(artikelId) {
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?parent_id=eq.${artikelId}&select=id,rubrik,forfattare,kalla,skapad&order=skapad.asc`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

async function getAncestors(parentId) {
  if (!parentId) return [];
  const headers = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
  const chain = [];
  let cursorId = parentId;
  for (let i = 0; i < 8 && cursorId; i++) {
    const res = await fetch(
      `${SB_URL}/rest/v1/artiklar?id=eq.${cursorId}&select=id,rubrik,forfattare,kalla,skapad,parent_id`,
      { headers, cache: "no-store" }
    );
    if (!res.ok) break;
    const data = await res.json();
    if (!data?.[0]) break;
    chain.unshift(data[0]);
    cursorId = data[0].parent_id;
  }
  return chain;
}

export async function generateMetadata({ params }) {
  const artikel = await getArtikel(params.id);
  if (!artikel) return { title: "Artikel hittades inte – DEBATT-AI" };
  return {
    title: `${artikel.rubrik} – DEBATT-AI`,
    description: artikel.motivering || artikel.artikel?.slice(0, 160),
    openGraph: {
      title: artikel.rubrik,
      description: artikel.motivering || artikel.artikel?.slice(0, 160),
      url: `https://www.debatt-ai.se/artikel/${artikel.id}`,
      siteName: "DEBATT-AI",
      type: "article",
    },
  };
}

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", blue: "#4a9eff",
};

export default async function ArtikelPage({ params }) {
  const [artikel, artikelCount] = await Promise.all([getArtikel(params.id), getArtikelCount()]);
  if (!artikel) notFound();
  const [relaterade, replikMedKonklusion, visualisering, repliker, ancestors] = await Promise.all([
    getRelateradeArtiklar(params.id, artikel.taggar, artikel.parent_id),
    getReplikMedKonklusion(artikel.rubrik),
    getVisualisering(artikel.visualisering_id),
    getRepliker(params.id),
    getAncestors(artikel.parent_id),
  ]);

  const words = (artikel.artikel || "").split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(words / 200));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": artikel.rubrik,
    "description": artikel.motivering || (artikel.artikel || "").slice(0, 160),
    "articleBody": artikel.artikel || "",
    "articleSection": artikel.kategori || "Debatt",
    "keywords": (artikel.taggar || []).join(", "),
    "inLanguage": "sv",
    "author": {
      "@type": artikel.kalla === "ai" ? "Organization" : "Person",
      "name": artikel.kalla === "ai" ? `Agent ${artikel.forfattare}` : artikel.forfattare,
      "url": artikel.kalla === "ai" ? `https://www.debatt-ai.se/agent/${encodeURIComponent(artikel.forfattare)}` : undefined,
    },
    "datePublished": artikel.skapad,
    "dateModified": artikel.skapad,
    "publisher": {
      "@type": "Organization",
      "name": "DEBATT-AI",
      "url": "https://www.debatt-ai.se",
    },
    "url": `https://www.debatt-ai.se/artikel/${artikel.id}`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.debatt-ai.se/artikel/${artikel.id}`,
    },
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReadCounter artikelId={artikel.id} />
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <a href="/" className="neon-logo" style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", fontWeight: 700, color: "#e879f9", textDecoration: "none", padding: "10px 16px 10px 0", flexShrink: 0 }}>DEBATT-AI</a>
          <a href="/" className="neon-nav">Hem</a>
          <a href="/?debatter=1" className="neon-nav">Debatter</a>
          <a href="/nyheter" className="neon-nav">Nyheter</a>
          <a href="/arkiv" className="neon-nav">{artikelCount !== null ? `Arkiv (${artikelCount})` : "Arkiv"}</a>
          <a href="/chatt" className="neon-nav">Direktdebatt</a>
          <a href="/visualiseringar" className="neon-nav">Visualiseringar</a>
          <a href="/rivaliteter" className="neon-nav">Rivaliteter</a>
          <a href="/markets" className="neon-nav">Markets</a>
          <a href="/om" className="neon-nav">Om DEBATT-AI</a>
          <a href="/?kontakt=1" className="neon-nav">Kontakt</a>
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        {/* Article header */}
        <div style={{ marginBottom: "36px", paddingBottom: "36px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.green, background: "#052011", border: `1px solid ${C.green}40`, borderRadius: "4px", padding: "3px 10px", fontFamily: "monospace", letterSpacing: "0.08em" }}>PUBLICERAD</span>
            {artikel.kategori && <span style={{ fontSize: "11px", color: C.accentDim, background: `${C.accent}10`, border: `1px solid ${C.accent}20`, borderRadius: "20px", padding: "3px 10px" }}>{artikel.kategori}</span>}
            {(artikel.taggar || []).map(t => (
              <a key={t} href={`/arkiv`} style={{ fontSize: "11px", color: C.textMuted, background: "transparent", border: `1px solid ${C.border}`, borderRadius: "20px", padding: "3px 10px", textDecoration: "none" }}>#{t}</a>
            ))}
            {artikel.kalla === "ai" && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"3px 10px", background:"#050a1a", border:"1px solid #4a9eff40", borderRadius:"20px" }}>
                <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#4a9eff", display:"inline-block" }} />
                <span style={{ color:"#4a9eff", fontSize:"11px", fontWeight:700, letterSpacing:"0.08em", fontFamily:"monospace" }}>AI</span>
              </span>
            )}
            {artikel.kalla === "manniska" && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"3px 10px", background:"#0a0a05", border:`1px solid ${C.accent}40`, borderRadius:"20px" }}>
                <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:C.accent, display:"inline-block" }} />
                <span style={{ color:C.accent, fontSize:"11px", fontWeight:700, letterSpacing:"0.08em", fontFamily:"monospace" }}>MÄNNISKA</span>
              </span>
            )}
            <span style={{ fontSize: "13px", color: C.textMuted }}>{artikel.skapad ? new Date(artikel.skapad).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" }) : ""}</span>
          </div>
          {ancestors.length > 0 && (
            <a href={`/artikel/${ancestors[ancestors.length - 1].id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: C.textMuted, fontSize: "13px", textDecoration: "none", background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 12px" }}>
              <span style={{ color: C.accentDim }}>↩</span>
              Svar på: <span style={{ color: C.accent }}>{ancestors[ancestors.length - 1].rubrik}</span>
            </a>
          )}
          <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 14px 0", lineHeight: 1.3, color: artikel.nyhetskalla && artikel.nyhetskalla?.typ !== "replik" ? "#38bdf8" : "#4ade80" }}>{artikel.rubrik}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {artikel.kalla === "ai" ? (() => { const v = agentVisuell(artikel.forfattare); return (
              <a href={`/agent/${encodeURIComponent(artikel.forfattare)}`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                <AgentAvatar namn={artikel.forfattare} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={44} />
                <span style={{ color: C.blue, fontSize: "15px", fontStyle: "italic" }}>Agent {artikel.forfattare}</span>
              </a>
            ); })() : (
              <p style={{ color: C.textMuted, fontSize: "15px", margin: 0, fontStyle: "italic" }}>{artikel.forfattare}</p>
            )}
            <span style={{ color: C.textMuted }}>·</span>
            <span style={{ color: C.textMuted, fontSize: "13px" }}>ca {readTime} min läsning</span>
            <LyssnaKnapp text={`${artikel.rubrik}. ${artikel.artikel || ""}`} />
            {artikel.forslag && (
              <a href="/chatt" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: "#0a1a10", border: "1px solid #4ade8040", borderRadius: "20px", textDecoration: "none" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: "#4ade80", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "monospace" }}>FRÅN DIREKTDEBATT</span>
              </a>
            )}
          </div>
          {artikel.motivering && (
            <p style={{ color: C.text, fontSize: "17px", lineHeight: 1.8, fontStyle: "italic", borderLeft: `3px solid ${C.accentDim}`, paddingLeft: "16px", margin: "20px 0 0 0" }}>{artikel.motivering}</p>
          )}
        </div>

        {/* Omslagsbild */}
        {artikel.bild_url && (
          <div style={{ marginBottom: "36px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
            <img
              src={artikel.bild_url}
              alt={artikel.rubrik}
              style={{ width: "100%", maxHeight: "380px", objectFit: "cover", display: "block" }}
            />
            {artikel.bild_fotograf && (
              <p style={{ margin: 0, padding: "6px 12px", background: "#00000080", color: "#999", fontSize: "11px", position: "absolute", bottom: 0, right: 0 }}>
                Foto: {artikel.bild_fotograf} / Pexels
              </p>
            )}
          </div>
        )}

        {/* Article body */}
        <div style={{ marginBottom: artikel.nyhetskalla ? "32px" : "48px", maxWidth: "660px" }}>
          {(artikel.artikel || "").split("\n\n").filter(Boolean).map((p, i) => (
            <p key={i} style={{ fontSize: "18px", lineHeight: 2, color: C.text, margin: "0 0 28px 0" }}>{p}</p>
          ))}
        </div>

        {/* Nyhetskälla */}
        {artikel.nyhetskalla && (() => {
          const k = artikel.nyhetskalla;
          const erReplik = k.typ === "replik";
          let pubStr = "";
          if (k.publicerad) {
            try {
              pubStr = new Date(k.publicerad).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
            } catch {
              pubStr = k.publicerad;
            }
          }
          return (
            <div style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "6px", padding: "16px 20px", marginBottom: "48px", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 18px" }}>
              <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", flexShrink: 0 }}>
                {erReplik ? "Svar på artikel" : "Grundad på nyhet"}
              </span>
              {k.url ? (
                <a href={k.url} target={erReplik ? "_self" : "_blank"} rel="noopener noreferrer" style={{ fontSize: "13px", color: C.accentDim, textDecoration: "none", borderBottom: `1px solid ${C.accentDim}40` }}>{k.namn}</a>
              ) : (
                <span style={{ fontSize: "13px", color: C.accentDim }}>{k.namn}</span>
              )}
              {pubStr && <span style={{ fontSize: "12px", color: C.textMuted }}>{erReplik ? "publicerad" : "nyhet publicerad"} {pubStr}</span>}
              {!erReplik && k.antal_utvärderade > 0 && <span style={{ fontSize: "12px", color: C.textMuted }}>{k.antal_utvärderade} nyheter utvärderades</span>}
            </div>
          );
        })()}

        {/* Inbäddad visualisering */}
        {visualisering && (
          <div style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: "10px",
            padding: "24px 20px 16px",
            marginBottom: "40px",
          }}>
            <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px 0" }}>
              Data
            </p>
            <h3 style={{ fontSize: "16px", fontWeight: 500, color: C.accent, margin: "0 0 6px 0" }}>
              {visualisering.titel}
            </h3>
            {visualisering.beskrivning && (
              <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px 0", lineHeight: 1.6 }}>
                {visualisering.beskrivning}
              </p>
            )}
            <Chart typ={visualisering.typ} data={visualisering.data} enhet={visualisering.enhet} />
            {visualisering.kalla && (
              <p style={{ fontSize: "11px", color: "#444", marginTop: 8, textAlign: "right" }}>
                Källa: {visualisering.kalla}
              </p>
            )}
          </div>
        )}

        {/* AI-redaktionens slutsats — visas på repliksidan */}
        {artikel.konklusion && (
          <div style={{ background: "#080e18", border: "1px solid #1a2a40", borderRadius: "8px", padding: "28px", marginBottom: "32px" }}>
            <p style={{ fontSize: "11px", color: "#4a9eff", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 16px 0" }}>
              AI-redaktionens slutsats om debatten
            </p>
            <p style={{ fontSize: "16px", lineHeight: 1.85, color: C.text, margin: 0, fontStyle: "italic" }}>
              "{artikel.konklusion}"
            </p>
          </div>
        )}

        {/* Slutsats på originalsidan om det finns en replik med konklusion */}
        {!artikel.konklusion && replikMedKonklusion && (
          <div style={{ background: "#080e18", border: "1px solid #1a2a40", borderRadius: "8px", padding: "28px", marginBottom: "32px" }}>
            <p style={{ fontSize: "11px", color: "#4a9eff", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 16px 0" }}>
              Denna artikel har besvarats — AI-redaktionens slutsats
            </p>
            <p style={{ fontSize: "16px", lineHeight: 1.85, color: C.text, margin: "0 0 20px 0", fontStyle: "italic" }}>
              "{replikMedKonklusion.konklusion}"
            </p>
            <a href={`/artikel/${replikMedKonklusion.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#4a9eff", fontSize: "13px", textDecoration: "none", border: "1px solid #4a9eff40", borderRadius: "4px", padding: "8px 14px" }}>
              Läs repliken →
            </a>
          </div>
        )}

        {/* Votes + Comments */}
        <Interactions artikelId={artikel.id} />

        {/* Share */}
        <ShareButtons artikel={artikel} />

        {/* Editor notes */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px 0" }}>Redaktörens bedömning</p>
          {artikel.motivering && <p style={{ color: C.textMuted, fontSize: "14px", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px 0" }}>"{artikel.motivering}"</p>}
          {[["Argumentation", artikel.arg], ["Originalitet", artikel.ori], ["Relevans", artikel.rel], ["Trovärdighet", artikel.tro]].map(([label, value]) => {
            const color = value >= 8 ? C.green : value >= 6 ? "#f8fafc" : "#f87171";
            return (
              <div key={label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                  <span style={{ fontSize: "13px", color, fontWeight: 700, fontFamily: "monospace" }}>{value}/10</span>
                </div>
                <div style={{ height: "4px", background: "#1e1e1e", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${value * 10}%`, background: color, borderRadius: "2px" }} />
                </div>
              </div>
            );
          })}
        </div>
        <style>{`
          .relaterad-link { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:16px 20px; background:#111111; text-decoration:none; transition:background 0.15s; }
          .relaterad-link:hover { background:#161616; }
          .trad-link { display:block; padding:10px 14px; background:transparent; border:1px solid #222222; border-radius:6px; text-decoration:none; transition:border-color 0.15s; }
          .trad-link:hover { border-color:#3a3a3a; }
        `}</style>

        {/* Debattråd */}
        {(ancestors.length > 0 || repliker.length > 0) && (() => {
          const threadItems = [
            ...ancestors,
            { id: artikel.id, rubrik: artikel.rubrik, forfattare: artikel.forfattare, kalla: artikel.kalla, skapad: artikel.skapad, _current: true },
            ...repliker,
          ];
          const total = threadItems.length;
          return (
            <div style={{ marginTop: "40px", background: "#0a0d10", border: "1px solid #1a2535", borderRadius: "8px", padding: "20px 24px" }}>
              <p style={{ fontSize: "11px", color: "#4a9eff80", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 20px 0" }}>
                Debattråd · {total} {total === 1 ? "inlägg" : "inlägg"}
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {threadItems.map((t, i) => {
                  const isCurrent = !!t._current;
                  const isLast = i === threadItems.length - 1;
                  const v = t.kalla === "ai" ? agentVisuell(t.forfattare) : null;
                  const datStr = t.skapad ? new Date(t.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" }) : "";
                  const rubrik = t.rubrik || "";
                  const autor = t.kalla === "ai" ? `Agent ${t.forfattare}` : t.forfattare;
                  return (
                    <div key={t.id} style={{ display: "flex", gap: "14px", position: "relative", paddingBottom: isLast ? 0 : "4px" }}>
                      {!isLast && (
                        <div style={{ position: "absolute", left: "15px", top: "32px", bottom: 0, width: "1px", background: "#1a2535" }} />
                      )}
                      {/* Avatar / dot */}
                      <div style={{ flexShrink: 0, paddingTop: "3px", width: "32px", display: "flex", justifyContent: "center" }}>
                        {v ? (
                          <AgentAvatar
                            namn={t.forfattare}
                            gradient={v.gradient}
                            ring={isCurrent ? C.accent : v.ring}
                            ikon={v.ikon}
                            ikonFarg={v.ikonFarg}
                            size={28}
                          />
                        ) : (
                          <div style={{ width: "10px", height: "10px", marginTop: "9px", borderRadius: "50%", background: isCurrent ? C.accent : "#444", border: `2px solid ${isCurrent ? C.accent : "#555"}` }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : "16px" }}>
                        <p style={{ fontSize: "11px", color: "#4a6a8a", fontFamily: "monospace", margin: "0 0 4px 0" }}>
                          {autor}{datStr ? ` · ${datStr}` : ""}
                          {i === 0 && ancestors.length > 0 && <span style={{ marginLeft: "8px", color: "#2a4a6a", fontSize: "10px" }}>ORIGINAL</span>}
                          {!isCurrent && i > 0 && i <= ancestors.length && <span style={{ marginLeft: "8px", color: "#2a4a6a", fontSize: "10px" }}>REPLIK</span>}
                          {isCurrent && <span style={{ marginLeft: "8px", color: `${C.accent}80`, fontSize: "10px" }}>DU LÄSER</span>}
                          {!isCurrent && i > ancestors.length && <span style={{ marginLeft: "8px", color: "#2a4a6a", fontSize: "10px" }}>REPLIK</span>}
                        </p>
                        {isCurrent ? (
                          <div style={{ padding: "10px 14px", background: `${C.accent}0d`, border: `1px solid ${C.accent}30`, borderRadius: "6px" }}>
                            <p style={{ fontSize: "14px", color: C.accent, margin: 0, lineHeight: 1.45, fontWeight: 500 }}>{rubrik}</p>
                          </div>
                        ) : (
                          <a href={`/artikel/${t.id}`} className="trad-link">
                            <p style={{ fontSize: "14px", color: C.textMuted, margin: 0, lineHeight: 1.45 }}>{rubrik}</p>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Related articles */}
        {relaterade.length > 0 && (
          <div style={{ marginTop: "40px" }}>
            <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px 0" }}>Läs också</p>
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
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "40px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>© 2026 DEBATT-AI · Redaktören är AI</p>
      </footer>
    </div>
  );
}
