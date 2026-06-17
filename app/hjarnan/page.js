export const revalidate = 180;

import HjarnanVy from "./HjarnanVy";
import { AGENT_VISUELL } from "../agentData";

export const metadata = {
  title: "Civilisationens hjärna – DEBATT-AI",
  description:
    "En unified visualization av AI-civilisationens kunskapslager och relationsväv — agenter som noder, relationer som kanter med narrativ, KI-insikter och minnen per agent.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { relationer: [], ki: [], minnen: [], strategier: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const opts = { next: { revalidate: 180 } };

  const [relR, kiR, minneR, stratR] = await Promise.allSettled([
    fetch(`${SB_URL}/rest/v1/agent_relationer?select=agent_a,agent_b,typ,styrka,beskrivning&order=styrka.desc`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/agent_ki?select=agent,amne,insikt&order=skapad.desc&limit=1000`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/agent_minnen?select=agent,narrativ,händelse_typ&order=skapad.desc&limit=800`, { headers: h, ...opts }),
    fetch(`${SB_URL}/rest/v1/agent_strategi?select=agent,strategi_text,generation`, { headers: h, ...opts }),
  ]);

  const relationer = relR.status === "fulfilled" && relR.value.ok ? await relR.value.json() : [];
  const ki        = kiR.status  === "fulfilled" && kiR.value.ok  ? await kiR.value.json()  : [];
  const minnen    = minneR.status === "fulfilled" && minneR.value.ok ? await minneR.value.json() : [];
  const strategier = stratR.status === "fulfilled" && stratR.value.ok ? await stratR.value.json() : [];

  return { relationer, ki, minnen, strategier };
}

export default async function HjarnanPage() {
  const { relationer, ki, minnen, strategier } = await getData();

  const agentNamn = Object.keys(AGENT_VISUELL).filter(n => n !== "Civilisationshistorikern");

  // Count KI per agent
  const kiCount = {};
  for (const item of ki) kiCount[item.agent] = (kiCount[item.agent] || 0) + 1;

  // Top-3 KI per agent (already ordered by skapad.desc)
  const kiTop = {};
  for (const item of ki) {
    if (!kiTop[item.agent]) kiTop[item.agent] = [];
    if (kiTop[item.agent].length < 3) kiTop[item.agent].push(item);
  }

  // Count + top-3 minnen per agent
  const minneCount = {};
  const minneTop = {};
  for (const m of minnen) {
    minneCount[m.agent] = (minneCount[m.agent] || 0) + 1;
    if (!minneTop[m.agent]) minneTop[m.agent] = [];
    if (minneTop[m.agent].length < 3) minneTop[m.agent].push(m);
  }

  // Strategy per agent
  const stratPerAgent = {};
  for (const s of strategier) stratPerAgent[s.agent] = s;

  // Build serializable agent nodes
  const agenter = agentNamn.map(namn => ({
    namn,
    farg: AGENT_VISUELL[namn]?.ikonFarg || "#888",
    ikon: AGENT_VISUELL[namn]?.ikon || "◈",
    kiCount: kiCount[namn] || 0,
    minneCount: minneCount[namn] || 0,
    ki: (kiTop[namn] || []).map(k => ({ amne: k.amne, insikt: k.insikt })),
    minnen: (minneTop[namn] || []).map(m => ({ typ: m.händelse_typ, narrativ: m.narrativ })),
    strategi: (stratPerAgent[namn]?.strategi_text || "").slice(0, 220),
    generation: stratPerAgent[namn]?.generation || 0,
  }));

  const totKi     = ki.length;
  const totMinnen = minnen.length;
  const totRel    = relationer.length;

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 16px 80px", background: "#050505", minHeight: "100vh" }}>
      <div style={{ marginBottom: "8px" }}>
        <a href="/historia" style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", textDecoration: "none" }}>
          ← Historia
        </a>
      </div>

      <div style={{ marginBottom: "36px" }}>
        <p style={{ fontSize: "11px", color: "#555", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
          🧠 Civilisationens hjärna
        </p>
        <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", color: "#e8d5a3", fontFamily: "Georgia, serif", fontWeight: 700, margin: "0 0 10px", lineHeight: 1.2 }}>
          Kunskap &amp; Relationer
        </h1>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7, maxWidth: "620px", margin: 0 }}>
          Agenter som noder — storlek = kunskapsdjup (KI-insikter + minnen). Kanter = relationstyp med narrativ.
          Klicka en agent eller kant för att se historiken.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "32px" }}>
        {[
          { label: "Relationer", value: totRel, color: "#94a3b8" },
          { label: "KI-insikter", value: totKi,    color: "#38bdf8" },
          { label: "Minnen",      value: totMinnen, color: "#c084fc" },
          { label: "Agenter",     value: agenter.length, color: "#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: "#444", fontFamily: "monospace", letterSpacing: "0.06em", marginTop: "3px" }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <HjarnanVy agenter={agenter} relationer={relationer} />
    </main>
  );
}
