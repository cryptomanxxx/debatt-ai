import { Suspense } from "react";
import ArkivClient from "./ArkivClient";

// Publicering/redigering/radering revaliderar /arkiv on-demand.
// 24 h är en backstop för förändringar utanför dessa flöden.
// Röster och kommentarer hämtas separat av klienten för färsk statistik.
export const revalidate = 86400;

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
      next: { revalidate: 86400 },
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
  const artiklar = await fetchArtiklar();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px" }}>
        <Suspense fallback={null}>
          <ArkivClient artiklar={artiklar.map(slimmaArtikel)} />
        </Suspense>
      </main>
    </div>
  );
}
