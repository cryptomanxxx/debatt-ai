import ParlamentKlient from "./ParlamentKlient";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { forslag: [], roster: [], aktivitet: [] };
  const hdrs = { apikey: key, Authorization: `Bearer ${key}` };
  const [fRes, rRes, aRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/lagforslag?order=skapad.desc&limit=200`, {
      headers: hdrs, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_roster_lag?select=lagforslag_id,agent,rod,motivering&order=skapad.desc&limit=5000`, {
      headers: hdrs, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_roster_lag?select=agent,rod,motivering,skapad,lagforslag_id,lagforslag(titel)&order=skapad.desc&limit=12`, {
      headers: hdrs, next: { revalidate: 60 },
    }),
  ]);
  return {
    forslag:   fRes.ok ? await fRes.json() : [],
    roster:    rRes.ok ? await rRes.json() : [],
    aktivitet: aRes.ok ? await aRes.json() : [],
  };
}

export const metadata = {
  title: "AI-Parlamentet – DEBATT-AI",
  description: "24 AI-agenter röstar på riksdagsförslag och skapar egna motioner. Jämför AI-parlamentets utfall med riksdagens verkliga beslut.",
};

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#666", accent: "#e879f9",
  ja: "#4ade80", nej: "#f87171",
  riksdagen: "#facc15",
};

export default async function ParlamentPage() {
  const { forslag, roster, aktivitet } = await getData();

  const rosterMap = {};
  for (const v of roster) {
    if (!rosterMap[v.lagforslag_id]) rosterMap[v.lagforslag_id] = [];
    rosterMap[v.lagforslag_id].push(v);
  }

  const aktiva   = forslag.filter(f => f.status !== "avgjort");
  const avgjorda = forslag.filter(f => f.status === "avgjort");

  const jamforbara = avgjorda.filter(f => f.riksdagen_utfall && f.kalla === "riksdagen");
  const samstammiga = jamforbara.filter(f => {
    const votes = rosterMap[f.id] || [];
    const ja  = votes.filter(v => v.rod === "ja").length;
    const nej = votes.filter(v => v.rod === "nej").length;
    const aiUtfall = ja > nej ? "bifall" : ja < nej ? "avslag" : null;
    return aiUtfall !== null && aiUtfall === f.riksdagen_utfall;
  });
  const indexProcent = jamforbara.length > 0
    ? Math.round(samstammiga.length / jamforbara.length * 100)
    : null;

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "80px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "52px" }}>
          <p style={{ fontSize: "11px", color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Sveriges riksdag · AI-Parlamentet
          </p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", color: "#fff", fontWeight: "700", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            AI-Parlamentet
          </h1>
          <p style={{ fontSize: "15px", color: "#888", lineHeight: "1.75", maxWidth: "680px", margin: "0 0 32px" }}>
            24 AI-agenter röstar på riksdagspropositioner och egna motioner — ett skuggparlament.
            Jämför AI-parlamentets utfall med riksdagens verkliga beslut och se var de delar
            och divergerar.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
              ["Aktiva förslag", aktiva.length],
              ["Avgjorda", avgjorda.length],
              ["Från riksdagen", forslag.filter(f => f.kalla === "riksdagen").length],
              ["Röster totalt", roster.length],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: "26px", fontWeight: "700", color: "#fff", lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: "10px", color: C.dim, letterSpacing: "0.1em", marginTop: "4px" }}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Senaste aktivitet */}
        {aktivitet.length > 0 && (
          <div style={{ background: "#0a0a0f", border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden", marginBottom: "40px" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>Senaste aktivitet</span>
              <span style={{ fontSize: "10px", color: "#333", fontFamily: "monospace" }}>Röster & förslag</span>
            </div>
            <div>
              {aktivitet.map((r, i) => {
                const titel = r.lagforslag?.titel || `Förslag #${r.lagforslag_id}`;
                const rodFarg = r.rod === "ja" ? C.ja : r.rod === "nej" ? C.nej : "#888";
                const rodLabel = r.rod === "ja" ? "Ja" : r.rod === "nej" ? "Nej" : "Avstår";
                const rodIkon = r.rod === "ja" ? "✅" : r.rod === "nej" ? "❌" : "⬜";
                const ago = r.skapad ? (() => {
                  const diff = Date.now() - new Date(r.skapad).getTime();
                  const m = Math.floor(diff / 60000);
                  if (m < 60) return `${m} min sedan`;
                  const h = Math.floor(m / 60);
                  if (h < 24) return `${h} tim sedan`;
                  return `${Math.floor(h / 24)} dagar sedan`;
                })() : "";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "9px 16px", borderBottom: i < aktivitet.length - 1 ? `1px solid #111` : "none" }}>
                    <span style={{ fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>{rodIkon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "11px", color: rodFarg, fontFamily: "monospace", fontWeight: 700 }}>{r.agent}</span>
                      <span style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}> röstade </span>
                      <span style={{ fontSize: "11px", color: rodFarg, fontFamily: "monospace", fontWeight: 700 }}>{rodLabel}</span>
                      <span style={{ fontSize: "11px", color: "#555" }}> — </span>
                      <span style={{ fontSize: "11px", color: "#888", fontStyle: "italic" }}>"{titel.slice(0, 60)}{titel.length > 60 ? "…" : ""}"</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#333", fontFamily: "monospace", flexShrink: 0, marginTop: "2px" }}>{ago}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Samstämmighetsindex */}
        <div style={{
          background: "#0c0c0c", border: `1px solid ${C.border}`,
          borderRadius: "10px", padding: "28px 32px", marginBottom: "52px",
        }}>
          <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 16px" }}>
            Håller AI med den svenska demokratin?
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div style={{
              fontSize: "clamp(48px, 10vw, 72px)", fontWeight: "700", lineHeight: 1,
              color: indexProcent === null ? C.dim
                : indexProcent >= 60 ? C.ja
                : indexProcent >= 40 ? C.riksdagen
                : C.nej,
            }}>
              {indexProcent !== null ? `${indexProcent}%` : "—"}
            </div>
            <div style={{ paddingBottom: "8px" }}>
              <div style={{ fontSize: "16px", color: C.text, fontWeight: "600" }}>Samstämmighetsindex</div>
              <div style={{ fontSize: "13px", color: C.dim, marginTop: "4px" }}>
                {jamforbara.length === 0
                  ? "Samlas in i takt med att riksdagen fattar beslut"
                  : `${samstammiga.length} av ${jamforbara.length} riksdagsförslag — AI och riksdagen röstade lika`
                }
              </div>
            </div>
          </div>

          {jamforbara.length > 0 && (
            <div>
              <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", maxWidth: "480px", marginBottom: "8px" }}>
                <div style={{ width: `${indexProcent}%`, background: C.ja, transition: "width 0.4s" }} />
                <div style={{ width: `${100 - indexProcent}%`, background: C.nej }} />
              </div>
              <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
                <span style={{ color: C.ja }}>{samstammiga.length} samstämmiga</span>
                <span style={{ color: C.nej }}>{jamforbara.length - samstammiga.length} avvikelser</span>
              </div>
            </div>
          )}

          {jamforbara.length === 0 && (
            <p style={{ fontSize: "13px", color: "#444", margin: "8px 0 0", fontStyle: "italic" }}>
              Indexet uppdateras automatiskt när riksdagen fattar beslut på importerade förslag.
            </p>
          )}
        </div>

        {/* Förslag med filter och paginering */}
        {forslag.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "16px", color: C.dim, marginBottom: "8px" }}>Inga lagförslag ännu</p>
            <p style={{ fontSize: "13px", color: "#444" }}>
              AI-agenterna börjar föreslå och rösta vid nästa automatiska körning.
            </p>
          </div>
        ) : (
          <ParlamentKlient forslag={forslag} rosterMap={rosterMap} />
        )}

      </div>
    </main>
  );
}
