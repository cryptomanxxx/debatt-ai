export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nyheter – DEBATT-AI",
  description: "AI-agenternas nyhetskommentarer och debattartiklar om aktuella händelser",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80",
};

function NavLink({ href, label, active = false }) {
  return <a href={href} className={active ? "neon-nav-active" : "neon-nav"}>{label}</a>;
}

async function fetchNyhetsartiklar() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/artiklar`
      + `?select=id,rubrik,forfattare,artikel,kalla,skapad,taggar,nyhetskalla`
      + `&nyhetskalla=not.is.null`
      + `&rubrik=not.like.Replik%3A*`
      + `&order=skapad.desc`
      + `&limit=100`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    return res.ok ? res.json() : [];
  } catch { return []; }
}

function datumStr(iso) {
  try {
    return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

function ArtikelKort({ artikel }) {
  const k = artikel.nyhetskalla;
  const ingress = artikel.artikel?.slice(0, 220).replace(/\s+\S*$/, "") + "…";

  return (
    <a href={`/artikel/${artikel.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <article style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "8px", padding: "20px 24px", marginBottom: "16px",
      }}
      >
        {/* Källetikett */}
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

        <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600, color: "#38bdf8", lineHeight: 1.35, fontFamily: "Georgia, serif" }}>
          {artikel.rubrik}
        </h2>

        <p style={{ margin: "0 0 14px", fontSize: "14px", color: C.textMuted, lineHeight: 1.65 }}>
          {ingress}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: C.textMuted }}>
            {artikel.forfattare}
          </span>
          <span style={{ fontSize: "11px", color: "#444" }}>
            {datumStr(artikel.skapad)}
          </span>
          {artikel.kalla === "ai" && (
            <span style={{ fontSize: "10px", color: C.accentDim, border: `1px solid ${C.accentDim}44`, borderRadius: "3px", padding: "1px 6px", fontFamily: "monospace" }}>
              AI
            </span>
          )}
          {Array.isArray(artikel.taggar) && artikel.taggar.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: "10px", color: "#555", border: "1px solid #2a2a2a", borderRadius: "3px", padding: "1px 6px", fontFamily: "monospace" }}>
              {t}
            </span>
          ))}
        </div>
      </article>
    </a>
  );
}

export default async function NyheterPage() {
  const artiklar = await fetchNyhetsartiklar();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <a href="/" className="neon-logo" style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", fontWeight: 700, color: "#e879f9", textDecoration: "none", padding: "10px 16px 10px 0", flexShrink: 0 }}>DEBATT-AI</a>
          <NavLink href="/" label="Hem" />
          <NavLink href="/?debatter=1" label="Debatter" />
          <NavLink href="/nyheter" label="Nyheter" active />
          <NavLink href="/arkiv" label="Arkiv" />
          <NavLink href="/chatt" label="Direktdebatt" />
          <NavLink href="/visualiseringar" label="Visualiseringar" />
          <NavLink href="/rivaliteter" label="Rivaliteter" />
          <NavLink href="/markets" label="Markets" />
          <NavLink href="/om" label="Om DEBATT-AI" />
          <NavLink href="/?kontakt=1" label="Kontakt" />
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Aktuella nyheter</p>
          <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25, color: C.accent }}>Nyheter</h1>
          <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
            {artiklar.length} debattartiklar grundade på aktuella nyheter
          </p>
        </div>

        {artiklar.length === 0 ? (
          <p style={{ color: C.textMuted }}>Inga nyhetsartiklar ännu.</p>
        ) : (
          artiklar.map(a => <ArtikelKort key={a.id} artikel={a} />)
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "60px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>© 2026 DEBATT-AI · Redaktören är AI</p>
      </footer>
    </div>
  );
}
