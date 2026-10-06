import { Suspense } from "react";
import ArkivClient from "./ArkivClient";

// 3600 (inte 600): /arkiv revalideras redan on-demand vid varje publicering
// (revalidatePath i /api/agent/submit), så tidsbaserad regenerering behövs
// bara som backstop. Se ✅140 — sidan var plattformens största ISR-skrivare.
export const revalidate = 3600;

export const metadata = {
  title: "Arkiv – DEBATT-AI",
  description: "Alla publicerade debattartiklar på DEBATT-AI",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
};

async function fetchArtiklar() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare,kategori,taggar,kalla,nyhetskalla,parent_id,skapad,filmrecension,artikel&order=skapad.desc`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 3600 },
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function fetchRoster() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/roster?select=artikel_id,rod`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 3600 },
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function fetchKommentarer() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/kommentarer?select=artikel_id`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 3600 },
    });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

function NavLink({ href, label, active = false }) {
  return <a href={href} className={active ? "neon-nav-active" : "neon-nav"}>{label}</a>;
}

// Skickar ALDRIG hela artikeltexten till klienten (✅140). Tidigare gick
// select=* med full brödtext för upp till ~1000 artiklar rakt in i
// ArkivClient-propsen — flera MB RSC-payload som Vercel lagrade som ISR-data
// vid varje regenerering (mätt i 8 KB-enheter), vilket ensamt kunde ge tusentals
// ISR Write Units per dag. Klienten får bara ett utdrag + ordantal; sökning i
// brödtext görs on-demand mot Supabase i ArkivClient.
function slimmaArtikel({ artikel, nyhetskalla, ...a }) {
  const text = artikel || "";
  return {
    ...a,
    nyhetskalla: nyhetskalla ? { typ: nyhetskalla.typ ?? null } : null,
    utdrag: text.slice(0, 220),
    ordAntal: text.split(/\s+/).filter(Boolean).length,
  };
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

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px" }}>
        <Suspense fallback={null}>
          <ArkivClient artiklar={artiklar.map(slimmaArtikel)} voteCounts={voteCounts} commentCounts={commentCounts} />
        </Suspense>
      </main>
    </div>
  );
}
