import TileKarta from "./TileKarta";

const SB  = "https://fmwxftnistkoqazfwnuj.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchData() {
  const h = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  const [zonerRes, agareRes] = await Promise.allSettled([
    fetch(`${SB}/rest/v1/mark_zoner?select=id,namn,typ,hex_col,hex_row,koppris,veckoinkomst`, { headers: h, next: { revalidate: 120 } }),
    fetch(`${SB}/rest/v1/mark_agare?select=zon_id,agent`, { headers: h, next: { revalidate: 60 } }),
  ]);
  const zoner = zonerRes.status === "fulfilled" && zonerRes.value.ok ? await zonerRes.value.json() : [];
  const agare = agareRes.status === "fulfilled" && agareRes.value.ok ? await agareRes.value.json() : [];
  return { zoner, agare };
}

export const metadata = {
  title: "Markkartan — tile-rendering test",
  robots: "noindex",
};

export default async function MarkTestPage() {
  const { zoner, agare } = await fetchData();

  return (
    <div style={{ background: "#050510", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0,0,0,0.5)",
      }}>
        <div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
            🗺 Markartan — tile-rendering test
          </span>
          <span style={{
            marginLeft: 10, fontSize: 11, color: "#f59e0b",
            background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 4, padding: "2px 6px",
          }}>
            PROTOTYPE
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          <span>Canvas 2D · HiDPI · Momentum-scroll · Pinch-zoom</span>
          <a href="/mark" style={{ color: "#60a5fa", textDecoration: "none" }}>← Gå till riktiga kartan</a>
        </div>
      </div>

      {/* Jämförelsenotis */}
      <div style={{
        padding: "8px 20px", fontSize: 12,
        background: "rgba(96,165,250,0.05)",
        borderBottom: "1px solid rgba(96,165,250,0.1)",
        color: "rgba(255,255,255,0.5)",
        display: "flex", gap: 24, flexWrap: "wrap",
      }}>
        <span>✅ Samma data som /mark (Supabase)</span>
        <span>✅ Zon-info vid klick</span>
        <span>✅ Ägarbadges</span>
        <span>✅ Nivåbaserade etiketter (zooma in för mer detaljer)</span>
        <span>✅ Wilderness-bakgrundszoner</span>
        <span>⚡ Canvas HiDPI-rendering — skarpare vid hög DPI</span>
      </div>

      {/* Karta */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <TileKarta zoner={zoner} agare={agare} />
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 20px", fontSize: 11, color: "rgba(255,255,255,0.2)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", gap: 20,
      }}>
        <span>{zoner.length} namngivna zoner</span>
        <span>+ ~200 wilderness-tiles (genererade)</span>
        <span>Zoom: scroll/pinch · Pan: drag · Välj: klick</span>
      </div>
    </div>
  );
}
