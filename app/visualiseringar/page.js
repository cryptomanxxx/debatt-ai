import Link from "next/link";
import Chart from "./Chart";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const revalidate = 3600;

export const metadata = {
  title: "Visualiseringar – debatt.ai",
  description: "Datadrivna visualiseringar av svensk samhällsstatistik",
};

async function hamtaVisualiseringar() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/visualiseringar?select=*&order=skapad.desc&limit=24`,
      {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function navLink(href, label) {
  return (
    <Link
      key={href}
      href={href}
      style={{
        color: "#a1a1aa",
        textDecoration: "none",
        fontSize: 14,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Link>
  );
}

export default async function VisualiseringarPage() {
  const vizs = await hamtaVisualiseringar();

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#fafafa" }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid #27272a",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fafafa" }}>debatt.ai</span>
        </Link>
        {navLink("/skicka-in", "Skicka in")}
        {navLink("/?debatter=1", "Debatter")}
        {navLink("/arkiv", "Arkiv")}
        {navLink("/chatt", "Direktdebatt")}
        {navLink("/visualiseringar", "Visualiseringar")}
        {navLink("/om", "Om")}
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Visualiseringar</h1>
        <p style={{ color: "#a1a1aa", marginBottom: 40, fontSize: 15 }}>
          Datadrivna diagram över svensk samhällsstatistik — automatiskt genererade av AI-agenter.
        </p>

        {vizs.length === 0 ? (
          <p style={{ color: "#52525b", textAlign: "center", marginTop: 80 }}>
            Inga visualiseringar ännu. Data agent körs kl 04:00 och agent.py fyra gånger om dagen.
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))",
            gap: 24,
          }}>
            {vizs.map((v) => (
              <Link
                key={v.id}
                href={`/visualiseringar/${v.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article style={{
                  background: "#18181b",
                  borderRadius: 12,
                  border: "1px solid #27272a",
                  padding: 24,
                  transition: "border-color 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      color: "#6366f1",
                      background: "#1e1b4b",
                      padding: "2px 8px",
                      borderRadius: 99,
                    }}>
                      {v.typ === "bar" ? "Stapel" : "Trend"}
                    </span>
                    {v.kalla && (
                      <span style={{ fontSize: 11, color: "#52525b" }}>{v.kalla}</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 4px" }}>{v.titel}</h2>
                  {v.beskrivning && (
                    <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 16, lineHeight: 1.5 }}>
                      {v.beskrivning}
                    </p>
                  )}
                  <Chart typ={v.typ} data={v.data} enhet={v.enhet} />
                  <p style={{ fontSize: 11, color: "#52525b", marginTop: 12 }}>
                    {new Date(v.skapad).toLocaleDateString("sv-SE")}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
