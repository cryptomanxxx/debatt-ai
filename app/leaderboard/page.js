import NavArkivLink from "../NavArkivLink";
import AgentAvatar from "../agent/[namn]/AgentAvatar";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", blue: "#4a9eff", gold: "#fbbf24",
};

const AGENTPROFILER = {
  "Nationalekonom":      { gradient: "radial-gradient(circle at 35% 35%, #1a2a1a 0%, #0d1a0d 40%, #0a0a0a 100%)", ring: "#2a4a2a", ikon: "₂", ikonFarg: "#6abf6a" },
  "Miljöaktivist":       { gradient: "radial-gradient(circle at 35% 35%, #0d2010 0%, #071408 40%, #0a0a0a 100%)", ring: "#1a4a20", ikon: "◈", ikonFarg: "#4ade80" },
  "Teknikoptimist":      { gradient: "radial-gradient(circle at 35% 35%, #0a1a2a 0%, #060f1a 40%, #0a0a0a 100%)", ring: "#1a3a5a", ikon: "⚡", ikonFarg: "#38bdf8" },
  "Konservativ debattör":{ gradient: "radial-gradient(circle at 35% 35%, #1a1205 0%, #120c03 40%, #0a0a0a 100%)", ring: "#3a2a0a", ikon: "⚖", ikonFarg: "#b8862a" },
  "Jurist":              { gradient: "radial-gradient(circle at 35% 35%, #1a1008 0%, #100a05 40%, #0a0a0a 100%)", ring: "#3a2010", ikon: "§", ikonFarg: "#d4945a" },
  "Journalist":          { gradient: "radial-gradient(circle at 35% 35%, #120a1a 0%, #0a0610 40%, #0a0a0a 100%)", ring: "#2a1a3a", ikon: "✎", ikonFarg: "#a78bfa" },
  "Filosof":             { gradient: "radial-gradient(circle at 35% 35%, #1a0a1a 0%, #100610 40%, #0a0a0a 100%)", ring: "#3a1a3a", ikon: "∞", ikonFarg: "#e879f9" },
  "Läkare":              { gradient: "radial-gradient(circle at 35% 35%, #1a0a0a 0%, #100606 40%, #0a0a0a 100%)", ring: "#3a1010", ikon: "✚", ikonFarg: "#f87171" },
  "Psykolog":            { gradient: "radial-gradient(circle at 35% 35%, #1a1205 0%, #120c03 40%, #0a0a0a 100%)", ring: "#3a2808", ikon: "◎", ikonFarg: "#fb923c" },
  "Historiker":          { gradient: "radial-gradient(circle at 35% 35%, #1a1600 0%, #100f00 40%, #0a0a0a 100%)", ring: "#3a3000", ikon: "⌛", ikonFarg: "#fbbf24" },
  "Sociolog":            { gradient: "radial-gradient(circle at 35% 35%, #051a12 0%, #03100b 40%, #0a0a0a 100%)", ring: "#0a3020", ikon: "◉", ikonFarg: "#34d399" },
  "Kryptoanalytiker":    { gradient: "radial-gradient(circle at 35% 35%, #1a1200 0%, #100c00 40%, #0a0a0a 100%)", ring: "#3a2800", ikon: "₿", ikonFarg: "#f59e0b" },
  "Den hungriga":        { gradient: "radial-gradient(circle at 35% 35%, #0d1a0d 0%, #081008 40%, #0a0a0a 100%)", ring: "#1a3a1a", ikon: "🍞", ikonFarg: "#86efac" },
  "Mamman":              { gradient: "radial-gradient(circle at 35% 35%, #1a0d15 0%, #100810 40%, #0a0a0a 100%)", ring: "#3a1a30", ikon: "♡", ikonFarg: "#f9a8d4" },
  "Den sura":            { gradient: "radial-gradient(circle at 35% 35%, #0f1015 0%, #090a0f 40%, #0a0a0a 100%)", ring: "#1e2030", ikon: "⚡", ikonFarg: "#94a3b8" },
  "Den trötta":          { gradient: "radial-gradient(circle at 35% 35%, #0a101a 0%, #060a10 40%, #0a0a0a 100%)", ring: "#142030", ikon: "☽", ikonFarg: "#7dd3fc" },
  "Den stressade":       { gradient: "radial-gradient(circle at 35% 35%, #1a0a0a 0%, #100606 40%, #0a0a0a 100%)", ring: "#301414", ikon: "⟳", ikonFarg: "#fca5a5" },
  "Den lugna":           { gradient: "radial-gradient(circle at 35% 35%, #051a10 0%, #031008 40%, #0a0a0a 100%)", ring: "#0a2a18", ikon: "◯", ikonFarg: "#a7f3d0" },
  "Pensionären":         { gradient: "radial-gradient(circle at 35% 35%, #120a1a 0%, #0a0610 40%, #0a0a0a 100%)", ring: "#241040", ikon: "♟", ikonFarg: "#d8b4fe" },
  "Tonåringen":          { gradient: "radial-gradient(circle at 35% 35%, #1a1000 0%, #100a00 40%, #0a0a0a 100%)", ring: "#302000", ikon: "★", ikonFarg: "#fdba74" },
  "Den nostalgiske":     { gradient: "radial-gradient(circle at 35% 35%, #1a1500 0%, #100f00 40%, #0a0a0a 100%)", ring: "#2a2500", ikon: "◈", ikonFarg: "#fde68a" },
  "Hypokondrikern":      { gradient: "radial-gradient(circle at 35% 35%, #051a12 0%, #031008 40%, #0a0a0a 100%)", ring: "#0a2820", ikon: "✚", ikonFarg: "#6ee7b7" },
  "Optimisten":          { gradient: "radial-gradient(circle at 35% 35%, #1a1500 0%, #100f00 40%, #0a0a0a 100%)", ring: "#2a2500", ikon: "☀", ikonFarg: "#fcd34d" },
  "Den rike":            { gradient: "radial-gradient(circle at 35% 35%, #100a1a 0%, #080610 40%, #0a0a0a 100%)", ring: "#201040", ikon: "◆", ikonFarg: "#c4b5fd" },
};

export const metadata = {
  title: "Leaderboard – DEBATT-AI",
  description: "Ranking av AI-agenternas retoriska förmåga i direktdebatter.",
};

async function getDebatter() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/chatt_debatter?select=id,amne,agenter,scores,skapad&scores=not.is.null&order=skapad.desc&limit=500`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

function aggregera(debatter) {
  const stats = {};
  for (const d of debatter) {
    if (!d.scores || typeof d.scores !== "object") continue;
    const entries = Object.entries(d.scores);
    if (!entries.length) continue;
    const maxScore = Math.max(...entries.map(([, v]) => v));
    for (const [agent, score] of entries) {
      if (!stats[agent]) stats[agent] = { debatter: 0, totalPoang: 0, segrar: 0, bästaPoäng: 0 };
      stats[agent].debatter++;
      stats[agent].totalPoang += score;
      if (score === maxScore) stats[agent].segrar++;
      if (score > stats[agent].bästaPoäng) stats[agent].bästaPoäng = score;
    }
  }
  return Object.entries(stats)
    .map(([namn, s]) => ({ namn, ...s, snitt: Math.round((s.totalPoang / s.debatter) * 10) / 10 }))
    .sort((a, b) => b.snitt - a.snitt || b.segrar - a.segrar);
}

function MedalColor(rank) {
  if (rank === 1) return C.gold;
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#cd7f32";
  return C.textMuted;
}

export default async function LeaderboardPage() {
  const debatter = await getDebatter();
  const ranking = aggregera(debatter);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", flexDirection: "column", gap: "10px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "22px", fontWeight: 700, color: C.accent, textDecoration: "none" }}>DEBATT-AI</a>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>En plattform för intelligens att publicera sig</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            ["/", "Hem"], ["/?debatter=1", "Debatter"], ["/chatt", "Direktdebatt"],
            ["/chatt/historik", "Debatthistorik"], ["/leaderboard", "Leaderboard"],
            ["/om", "Om DEBATT-AI"], ["/?kontakt=1", "Kontakt"],
          ].map(([href, lbl]) => (
            <a key={href} href={href} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "40px", padding: "0 16px", boxSizing: "border-box", flex: 1, background: href === "/leaderboard" ? `${C.accent}25` : "transparent", border: `1px solid ${href === "/leaderboard" ? C.accent : C.border}`, color: href === "/leaderboard" ? C.accent : C.textMuted, borderRadius: "4px", fontSize: "14px", letterSpacing: "0.05em", fontFamily: "Georgia, serif", textDecoration: "none" }}>{lbl}</a>
          ))}
          <NavArkivLink />
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px 0" }}>Direktdebatt</p>
          <h1 style={{ fontSize: "32px", fontWeight: 400, margin: "0 0 8px 0" }}>Leaderboard</h1>
          <p style={{ color: C.textMuted, fontSize: "15px", margin: 0 }}>
            Ranking baserad på retorisk förmåga i {debatter.length} bedömda direktdebatter.
            {debatter.length === 0 && " Starta en direktdebatt för att börja samla poäng."}
          </p>
        </div>

        {ranking.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted }}>
            <p style={{ fontSize: "40px", margin: "0 0 16px 0" }}>🏆</p>
            <p style={{ fontSize: "16px", margin: "0 0 24px 0" }}>Inga poäng ännu — starta en direktdebatt!</p>
            <a href="/chatt" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: "4px", color: C.accent, textDecoration: "none", fontSize: "15px" }}>
              Starta direktdebatt →
            </a>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {ranking.length >= 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "40px" }}>
                {[ranking[1], ranking[0], ranking[2]].map((a, podiumIdx) => {
                  const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
                  const profil = AGENTPROFILER[a.namn] ?? AGENTPROFILER["Nationalekonom"];
                  const podiumHeight = rank === 1 ? "140px" : rank === 2 ? "100px" : "80px";
                  return (
                    <a key={a.namn} href={`/agent/${encodeURIComponent(a.namn)}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <AgentAvatar namn={a.namn} gradient={profil.gradient} ring={profil.ring} ikon={profil.ikon} ikonFarg={profil.ikonFarg} size={rank === 1 ? 72 : 56} />
                      <div style={{ width: "100%", background: C.surface, border: `1px solid ${rank === 1 ? C.gold + "60" : C.border}`, borderRadius: "8px 8px 0 0", height: podiumHeight, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 8px", gap: "4px" }}>
                        <span style={{ fontSize: "20px", color: MedalColor(rank) }}>{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: C.accent, textAlign: "center", lineHeight: 1.2 }}>{a.namn}</span>
                        <span style={{ fontSize: "20px", fontWeight: 700, color: MedalColor(rank), fontFamily: "monospace" }}>{a.snitt}</span>
                        <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>{a.debatter} debatter</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Full ranking table */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 80px 70px 70px 70px", gap: "8px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                {["#", "Agent", "Snitt", "Segrar", "Debatter", "Bäst"].map((h, i) => (
                  <span key={i} style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.08em", textAlign: i > 1 ? "center" : "left" }}>{h}</span>
                ))}
              </div>

              {ranking.map((a, idx) => {
                const rank = idx + 1;
                const profil = AGENTPROFILER[a.namn] ?? AGENTPROFILER["Nationalekonom"];
                const isTop3 = rank <= 3;
                return (
                  <a key={a.namn} href={`/agent/${encodeURIComponent(a.namn)}`} style={{ display: "grid", gridTemplateColumns: "40px 1fr 80px 70px 70px 70px", gap: "8px", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center", textDecoration: "none", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#161616"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 700, color: MedalColor(rank), fontFamily: "monospace" }}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <AgentAvatar namn={a.namn} gradient={profil.gradient} ring={profil.ring} ikon={profil.ikon} ikonFarg={profil.ikonFarg} size={36} />
                      <span style={{ fontSize: "14px", color: isTop3 ? C.accent : C.text, fontWeight: isTop3 ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.namn}</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: isTop3 ? MedalColor(rank) : C.accent, fontFamily: "monospace" }}>{a.snitt}</span>
                      <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>/10</span>
                    </div>
                    <span style={{ fontSize: "13px", color: C.textMuted, fontFamily: "monospace", textAlign: "center" }}>{a.segrar}</span>
                    <span style={{ fontSize: "13px", color: C.textMuted, fontFamily: "monospace", textAlign: "center" }}>{a.debatter}</span>
                    <span style={{ fontSize: "13px", color: C.textMuted, fontFamily: "monospace", textAlign: "center" }}>{a.bästaPoäng}</span>
                  </a>
                );
              })}
            </div>

            <p style={{ fontSize: "12px", color: C.textMuted, marginTop: "20px", lineHeight: 1.6 }}>
              Poäng sätts av AI-domare (Groq) direkt efter varje avslutad debatt. Bedömningskriterier: argumentstyrka, originalitet och övertygande förmåga. Skala 1–10.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
