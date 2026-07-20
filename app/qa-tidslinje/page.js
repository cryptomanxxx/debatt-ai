import TidslinjeVy from "./TidslinjeVy";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 3600;

export const metadata = {
  title: "Civilisationens tidslinje – DEBATT-AI",
  description: "Animerade veckobilder som visar hur AI-civilisationen förändras över tid.",
};

const SIDOR_ATT_VISA = [
  { path: "/dynamik",  namn: "Agentdynamik"    },
  { path: "/oligarki", namn: "Oligarkirisk"     },
  { path: "/kompass",  namn: "Ideologisk kompass" },
  { path: "/partier",  namn: "Politiska partier" },
  { path: "/trust",    namn: "Förtroendegraf"   },
  { path: "/bors",     namn: "Kryptobörsen"     },
];

// Max antal veckor per sida som embeddas i den prerendrade sidan. Utan tak
// växer varje base64-skärmdump (sparas varje måndag, aldrig rensad) sidans
// storlek obegränsat — orsakade en "Oversized Incremental Static
// Regeneration"-deployfel på Vercel (19,75 MB, över gränsen) 20 jul 2026.
// Satt lågt (6 veckor ≈ 1,5 månad) medvetet — okänt exakt hur många veckor
// som redan hunnit ackumuleras, så en försiktig gräns garanterar att
// nästa deploy faktiskt kommer under Vercels tak istället för att gissa
// ett värde som råkar vara större än vad som redan finns.
const MAX_VECKOR_PER_SIDA = 6;

// Hämtar en sidas snapshots med gränsen pålagd i själva Supabase-frågan
// (limit=N), inte efteråt i JS — annars hade hela historiken laddats ner
// och materialiserats (base64-payload och allt) innan den kastades bort,
// vilket gör att fetchen fortsätter växa obegränsat med veckor även om
// den slutgiltiga sidan är begränsad (Codex-fynd, PR #1263).
async function fetchSidaSnapshots(path, key) {
  const url =
    `${SB_URL}/rest/v1/qa_snapshots` +
    `?sida_path=eq.${encodeURIComponent(path)}` +
    `&screenshot_b64=not.is.null` +
    `&order=vecka.desc` +
    `&limit=${MAX_VECKOR_PER_SIDA}` +
    `&select=vecka,sida_path,sida_namn,status,screenshot_b64`;

  const r = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    next: { revalidate: 3600 },
  }).catch(() => null);

  if (!r?.ok) return [];
  const rows = await r.json();
  // Frågan gav nyast-först (vecka.desc) — vänd till kronologisk ordning
  // (äldst → nyast) för korrekt tidslinjeanimering.
  return rows.reverse().map(row => ({
    vecka:     row.vecka,
    status:    row.status,
    bild:      row.screenshot_b64,
    sida_namn: row.sida_namn,
  }));
}

async function fetchSnapshots() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return {};

  const resultat = await Promise.all(
    SIDOR_ATT_VISA.map(s => fetchSidaSnapshots(s.path, key))
  );

  const grouped = {};
  SIDOR_ATT_VISA.forEach((s, i) => {
    grouped[s.path] = resultat[i];
  });
  return grouped;
}

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#f0ede6", muted: "#888880",
  green: "#4ade80", yellow: "#facc15", red: "#f87171",
};

export default async function QaTidslinjePageWrapper() {
  const data = await fetchSnapshots();
  const harData = Object.values(data).some(v => v.length > 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "monospace" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>

        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: "0.02em" }}>
          Civilisationens tidslinje
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 40 }}>
          Veckovisa skärmdumpar av hur AI-civilisationen förändras — dynamik, maktkoncentration,
          ideologi och koalitioner. Tas av den automatiska QA-observatören varje måndag.
        </p>

        {!harData ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "60px 40px", textAlign: "center", color: C.muted,
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📷</div>
            <div style={{ fontSize: 15, marginBottom: 8 }}>Inga skärmdumpar sparade ännu</div>
            <div style={{ fontSize: 12 }}>
              QA-observatören körs varje måndag — kom tillbaka nästa vecka för första bilden.
            </div>
          </div>
        ) : (
          <TidslinjeVy data={data} sidor={SIDOR_ATT_VISA} />
        )}
      </div>
    </div>
  );
}
