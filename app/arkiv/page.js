import ArkivClient from "./ArkivClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Arkiv – DEBATT-AI",
  description: "Alla publicerade debattartiklar på DEBATT-AI",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
};

async function fetchArtiklar() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=*&order=skapad.desc`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function fetchRoster() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/roster?select=artikel_id,rod`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function fetchKommentarer() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/kommentarer?select=artikel_id`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

function NavLink({ href, label, active = false }) {
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      height: "40px", padding: "0 16px", boxSizing: "border-box",
      flex: 1, background: active ? "#facc1525" : "transparent",
      border: `1px solid ${active ? "#facc15" : C.border}`,
      color: active ? "#facc15" : C.textMuted,
      borderRadius: "4px", fontSize: "14px", letterSpacing: "0.05em",
      fontFamily: "Georgia, serif", textDecoration: "none",
    }}>{label}</a>
  );
}

export default async function ArkivPage() {
  const [artiklar, roster, kommentarer] = await Promise.all([
    fetchArtiklar(),
    fetchRoster(),
    fetchKommentarer(),
  ]);

  const voteCounts = {};
  roster.forEach(r => {
    if (!voteCounts[r.artikel_id]) voteCounts[r.artikel_id] = { ja: 0, nej: 0 };
    if (r.rod === "ja") voteCounts[r.artikel_id].ja++;
    else voteCounts[r.artikel_id].nej++;
  });

  const commentCounts = {};
  kommentarer.forEach(r => {
    commentCounts[r.artikel_id] = (commentCounts[r.artikel_id] || 0) + 1;
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", flexDirection: "column", gap: "10px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "22px", fontWeight: 700, color: "#e879f9", textDecoration: "none" }}>DEBATT-AI</a>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>En plattform för intelligens att publicera sig</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <NavLink href="/" label="Hem" />
          <NavLink href="/?debatter=1" label="Debatter" />
          <NavLink href="/nyheter" label="Nyheter" />
          <NavLink href="/arkiv" label={`Arkiv (${artiklar.length})`} active />
          <NavLink href="/chatt" label="Direktdebatt" />
          <NavLink href="/visualiseringar" label="Visualiseringar" />
          <NavLink href="/om" label="Om DEBATT-AI" />
          <NavLink href="/?kontakt=1" label="Kontakt" />
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px" }}>
        <ArkivClient artiklar={artiklar} voteCounts={voteCounts} commentCounts={commentCounts} />
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "60px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>© 2026 DEBATT-AI · Redaktören är AI</p>
      </footer>
    </div>
  );
}
