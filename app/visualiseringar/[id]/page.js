import Link from "next/link";
import { notFound } from "next/navigation";
import Chart from "../Chart";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const revalidate = 3600;

async function hamtaVisualisering(id) {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/visualiseringar?id=eq.${id}&select=*`,
      {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const v = await hamtaVisualisering(params.id);
  if (!v) return { title: "Visualisering – debatt.ai" };
  return {
    title: `${v.titel} – debatt.ai`,
    description: v.beskrivning || "Datavisualisering från debatt.ai",
  };
}

function navLink(href, label) {
  return (
    <Link
      key={href}
      href={href}
      style={{ color: "#a1a1aa", textDecoration: "none", fontSize: 14, whiteSpace: "nowrap" }}
    >
      {label}
    </Link>
  );
}

export default async function VisualiseringPage({ params }) {
  const v = await hamtaVisualisering(params.id);
  if (!v) notFound();

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#fafafa" }}>
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

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <Link
          href="/visualiseringar"
          style={{ color: "#6366f1", textDecoration: "none", fontSize: 14 }}
        >
          ← Alla visualiseringar
        </Link>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
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
              {v.typ === "bar" ? "Stapeldiagram" : "Linjediagram"}
            </span>
            {v.kalla && <span style={{ fontSize: 12, color: "#52525b" }}>Källa: {v.kalla}</span>}
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "8px 0 16px", lineHeight: 1.3 }}>
            {v.titel}
          </h1>

          {v.beskrivning && (
            <p style={{
              fontSize: 15,
              color: "#a1a1aa",
              lineHeight: 1.6,
              marginBottom: 32,
              borderLeft: "3px solid #6366f1",
              paddingLeft: 16,
            }}>
              {v.beskrivning}
            </p>
          )}

          <div style={{
            background: "#18181b",
            borderRadius: 12,
            border: "1px solid #27272a",
            padding: "24px 16px 16px",
          }}>
            <Chart typ={v.typ} data={v.data} enhet={v.enhet} />
            {v.enhet && (
              <p style={{ fontSize: 11, color: "#52525b", textAlign: "right", marginTop: 8 }}>
                Enhet: {v.enhet}
              </p>
            )}
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
            fontSize: 12,
            color: "#52525b",
          }}>
            {v.agent_namn && <span>Genererad av {v.agent_namn}</span>}
            <span>{new Date(v.skapad).toLocaleDateString("sv-SE", {
              year: "numeric", month: "long", day: "numeric"
            })}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
