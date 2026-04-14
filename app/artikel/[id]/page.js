import { notFound } from "next/navigation";

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

export async function generateMetadata({ params }) {
  const artikel = await getArtikel(params.id);
  if (!artikel) return { title: "Artikel hittades inte – DEBATT.AI" };
  return {
    title: `${artikel.rubrik} – DEBATT.AI`,
    description: artikel.motivering || artikel.artikel?.slice(0, 160),
    openGraph: {
      title: artikel.rubrik,
      description: artikel.motivering || artikel.artikel?.slice(0, 160),
      url: `https://debatt-ai.vercel.app/artikel/${artikel.id}`,
      siteName: "DEBATT.AI",
      type: "article",
    },
  };
}

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80",
};

export default async function ArtikelPage({ params }) {
  const [artikel, artikelCount] = await Promise.all([getArtikel(params.id), getArtikelCount()]);
  if (!artikel) notFound();

  const words = (artikel.artikel || "").split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(words / 200));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", flexDirection: "column", gap: "10px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "22px", fontWeight: 700, color: C.accent, textDecoration: "none" }}>DEBATT.AI</a>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>Redaktionen är artificiell</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <a href="/" style={{ flex: 1, textAlign: "center", background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, padding: "6px 14px", borderRadius: "4px", fontSize: "13px", letterSpacing: "0.05em", fontFamily: "Georgia, serif", textDecoration: "none" }}>Skicka in</a>
          <a href="/?arkiv=1" style={{ flex: 1, textAlign: "center", background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, padding: "6px 14px", borderRadius: "4px", fontSize: "13px", letterSpacing: "0.05em", fontFamily: "Georgia, serif", textDecoration: "none" }}>{artikelCount !== null ? `Arkiv (${artikelCount})` : "Arkiv"}</a>
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        {/* Article header */}
        <div style={{ marginBottom: "36px", paddingBottom: "36px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.green, background: "#052011", border: `1px solid ${C.green}40`, borderRadius: "4px", padding: "3px 10px", fontFamily: "monospace", letterSpacing: "0.08em" }}>PUBLICERAD</span>
            {artikel.kategori && <span style={{ fontSize: "11px", color: C.accentDim, background: `${C.accent}10`, border: `1px solid ${C.accent}20`, borderRadius: "20px", padding: "3px 10px" }}>{artikel.kategori}</span>}
            <span style={{ fontSize: "13px", color: C.textMuted }}>{artikel.skapad ? new Date(artikel.skapad).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" }) : ""}</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 14px 0", lineHeight: 1.3, color: C.accent }}>{artikel.rubrik}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <p style={{ color: C.textMuted, fontSize: "15px", margin: 0, fontStyle: "italic" }}>{artikel.forfattare}</p>
            <span style={{ color: C.textMuted }}>·</span>
            <span style={{ color: C.textMuted, fontSize: "13px" }}>ca {readTime} min läsning</span>
          </div>
          {artikel.motivering && (
            <p style={{ color: C.text, fontSize: "17px", lineHeight: 1.8, fontStyle: "italic", borderLeft: `3px solid ${C.accentDim}`, paddingLeft: "16px", margin: "20px 0 0 0" }}>{artikel.motivering}</p>
          )}
        </div>

        {/* Article body */}
        <div style={{ marginBottom: "48px" }}>
          {(artikel.artikel || "").split("\n\n").filter(Boolean).map((p, i) => (
            <p key={i} style={{ fontSize: "18px", lineHeight: 2, color: C.text, margin: "0 0 28px 0" }}>{p}</p>
          ))}
        </div>

        {/* Share */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "20px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: "32px" }}>
          <span style={{ fontSize: "12px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Dela:</span>
          {[
            ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=https://debatt-ai.vercel.app/artikel/${artikel.id}`],
            ["Twitter / X", `https://twitter.com/intent/tweet?text=${encodeURIComponent(artikel.rubrik)}&url=https://debatt-ai.vercel.app/artikel/${artikel.id}`],
            ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=https://debatt-ai.vercel.app/artikel/${artikel.id}`],
          ].map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", background: `${C.accent}10`, border: `1px solid ${C.accent}30`, color: C.accent, borderRadius: "4px", padding: "8px 14px", fontSize: "13px", textDecoration: "none", fontFamily: "Georgia, serif" }}>
              {label}
            </a>
          ))}
        </div>

        {/* Editor notes */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px 0" }}>Redaktörens bedömning</p>
          {artikel.motivering && <p style={{ color: C.textMuted, fontSize: "14px", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px 0" }}>"{artikel.motivering}"</p>}
          {[["Argumentation", artikel.arg], ["Originalitet", artikel.ori], ["Relevans", artikel.rel], ["Trovärdighet", artikel.tro]].map(([label, value]) => {
            const color = value >= 8 ? C.green : value >= 6 ? "#fbbf24" : "#f87171";
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
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "40px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>DEBATT.AI · Ansvarig utgivare: Marcus Davidsson</p>
      </footer>
    </div>
  );
}
