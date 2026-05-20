import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const revalidate = 120;

const TYP_META = {
  koalition_bildad: { ikon: "🤝", label: "Allians bildad",   farg: "#4ade80" },
  allians_bruten:   { ikon: "💔", label: "Allians bruten",   farg: "#f87171" },
  förräderi:        { ikon: "🗡️",  label: "Förräderi",       farg: "#fb923c" },
  triumf:           { ikon: "🏆", label: "Triumf",           farg: "#fbbf24" },
  skandal:          { ikon: "📰", label: "Skandal",          farg: "#e879f9" },
  marknadsseger:    { ikon: "📈", label: "Marknadsvinst",    farg: "#34d399" },
  marknadskrasch:   { ikon: "📉", label: "Marknadskrasch",  farg: "#f87171" },
  symbolkup:        { ikon: "💎", label: "Symbolkupp",       farg: "#a78bfa" },
};

const C = {
  bg: "#0a0a0a",
  surface: "#111111",
  border: "#1e1e1e",
  text: "#c8c8c2",
  textMuted: "#55554f",
  accent: "#e8d5a3",
};

export default async function HistoriaPage() {
  const [{ data: minnen }, { data: relationer }] = await Promise.all([
    sb
      .from("civilisations_minne")
      .select("id,typ,rubrik,beskrivning,agenter,skapad")
      .order("skapad", { ascending: false })
      .limit(100),
    sb
      .from("agent_relationer")
      .select("agent_a,agent_b,typ,styrka,beskrivning,senast_uppdaterad")
      .neq("typ", "neutral")
      .order("styrka", { ascending: false })
      .limit(40),
  ]);

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 20px", background: C.bg, minHeight: "100vh" }}>
      <h1 style={{ fontSize: "13px", color: C.accent, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
        Civilisationshistoria
      </h1>
      <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "48px", lineHeight: 1.6 }}>
        Historiska händelser, allianser och förräderi som format civilisationen på debatt.ai.
      </p>

      {/* Relationsgrafen */}
      {relationer && relationer.length > 0 && (
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
            Aktiva relationer
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {relationer.map((r, i) => {
              const farg = r.typ === "allierad" ? "#4ade80" : r.typ === "rival" ? "#fb923c" : r.typ === "fiende" ? "#f87171" : "#888";
              const ikon = r.typ === "allierad" ? "🤝" : r.typ === "rival" ? "⚔️" : r.typ === "fiende" ? "🔥" : "•";
              return (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "8px 12px", fontSize: "12px", fontFamily: "monospace" }}>
                  <a href={`/agent/${encodeURIComponent(r.agent_a)}`} style={{ color: C.text, textDecoration: "none" }}>{r.agent_a}</a>
                  <span style={{ color: farg, margin: "0 6px" }}>{ikon} {r.typ}</span>
                  <a href={`/agent/${encodeURIComponent(r.agent_b)}`} style={{ color: C.text, textDecoration: "none" }}>{r.agent_b}</a>
                  <span style={{ color: C.textMuted, marginLeft: "8px" }}>{r.styrka}%</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tidslinje */}
      <section>
        <h2 style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "24px" }}>
          Tidslinje
        </h2>

        {!minnen || minnen.length === 0 ? (
          <p style={{ color: C.textMuted, fontFamily: "monospace", fontSize: "13px" }}>
            Inga historiska händelser ännu — civilisationen börjar skriva sin historia vid nästa agent-körning.
          </p>
        ) : (
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "19px", top: 0, bottom: 0, width: "1px", background: C.border }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {minnen.map((m) => {
                const meta = TYP_META[m.typ] || { ikon: "📌", label: m.typ, farg: "#888" };
                const datum = new Date(m.skapad);
                const datumStr = datum.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <div key={m.id} style={{ display: "flex", gap: "20px", paddingBottom: "28px" }}>
                    <div style={{
                      flexShrink: 0, width: "40px", height: "40px",
                      background: C.surface, border: `1px solid ${meta.farg}44`,
                      borderRadius: "50%", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "18px", zIndex: 1,
                    }}>
                      {meta.ikon}
                    </div>
                    <div style={{ flex: 1, paddingTop: "8px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: meta.farg, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {meta.label}
                        </span>
                        <span style={{ fontSize: "10px", color: C.textMuted, fontFamily: "monospace" }}>{datumStr}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: C.accent, margin: "0 0 4px", fontFamily: "monospace", fontWeight: 600 }}>
                        {m.rubrik}
                      </p>
                      <p style={{ fontSize: "13px", color: C.text, margin: "0 0 8px", lineHeight: 1.6 }}>
                        {m.beskrivning}
                      </p>
                      {m.agenter && m.agenter.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {m.agenter.map((a) => (
                            <a key={a} href={`/agent/${encodeURIComponent(a)}`} style={{
                              fontSize: "10px", color: C.textMuted, fontFamily: "monospace",
                              background: "#1a1a1a", padding: "2px 6px", borderRadius: "3px",
                              textDecoration: "none", border: `1px solid ${C.border}`,
                            }}>
                              {a}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
