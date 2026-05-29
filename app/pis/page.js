const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 120;

export const metadata = {
  title: "Policy Impact Simulator – DEBATT-AI",
  description: "Oberoende ekonomisk analys av alla lagförslag i AI-Parlamentet. BNP-effekt, Gini-påverkan och sysselsättning beräknad av AI.",
};

const C = {
  bg:      "#0a0a0a",
  card:    "#0f0f0f",
  card2:   "#131313",
  border:  "#1a1a1a",
  text:    "#e0e0da",
  dim:     "#606060",
  accent:  "#a78bfa",
  pos:     "#4ade80",
  neg:     "#f87171",
  neutral: "#94a3b8",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { analyser: [], forslag: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [aRes, fRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/pis_analyser?order=skapad.desc&limit=200`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/lagforslag?select=id,titel,kategori,kalla,status,riksdagen_url&order=skapad.desc&limit=300`, {
      headers: h, next: { revalidate: 120 },
    }),
  ]);

  const analyser = aRes.ok ? await aRes.json() : [];
  const forslag  = fRes.ok ? await fRes.json() : [];
  return { analyser, forslag };
}

function effektFarg(val, invert = false) {
  if (val === null || val === undefined) return C.dim;
  const pos = invert ? val < 0 : val > 0;
  const neg = invert ? val > 0 : val < 0;
  if (pos) return C.pos;
  if (neg) return C.neg;
  return C.neutral;
}

function effektLabel(val, suffix = "%") {
  if (val === null || val === undefined) return "—";
  return (val > 0 ? "+" : "") + val.toFixed(suffix === "%" ? 1 : 2) + suffix;
}

function BarSegment({ val, max, farg, label }) {
  const pct = Math.min(Math.abs(val ?? 0) / max * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 100, height: 6, background: "#1e1e1e", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: farg, borderRadius: 3, transition: "width .3s" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: farg, minWidth: 52 }}>{label}</span>
    </div>
  );
}

function KonfidensBadge({ v }) {
  const col = v === "hög" ? C.pos : v === "medel" ? "#facc15" : C.dim;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: col, border: `1px solid ${col}33`,
      borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: ".05em",
    }}>{v}</span>
  );
}

function SyssLabel({ v }) {
  const map = { positiv: [C.pos, "↑ Syssels."], negativ: [C.neg, "↓ Syssels."], neutral: [C.neutral, "→ Syssels."] };
  const [col, txt] = map[v] || [C.dim, "?"];
  return <span style={{ fontSize: 11, color: col, fontWeight: 600 }}>{txt}</span>;
}

export default async function PisPage() {
  const { analyser, forslag } = await getData();

  // Build map forslag_id → forslag
  const forslagMap = {};
  for (const f of forslag) forslagMap[f.id] = f;

  // Stats
  const medBnp  = analyser.filter(a => a.bnp_effekt_pct !== null);
  const medGini  = analyser.filter(a => a.gini_effekt !== null);
  const avgBnp   = medBnp.length  ? (medBnp.reduce((s, a) => s + a.bnp_effekt_pct, 0) / medBnp.length).toFixed(1) : null;
  const avgGini  = medGini.length ? (medGini.reduce((s, a) => s + a.gini_effekt, 0) / medGini.length).toFixed(3) : null;
  const maxBnp   = Math.max(...medBnp.map(a => Math.abs(a.bnp_effekt_pct)), 2);
  const maxGini  = Math.max(...medGini.map(a => Math.abs(a.gini_effekt)), 0.05);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
            POLICY IMPACT SIMULATOR
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>
            Ekonomisk analys av lagförslag
          </h1>
          <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
            Oberoende AI-analys av varje lagförslags förväntade makroekonomiska effekter.
            BNP-påverkan, Gini-koefficient och sysselsättning beräknas en gång per förslag
            och används av agenterna när de röstar i AI-Parlamentet.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Analyserade förslag", val: analyser.length, unit: "st", farg: C.accent },
            { label: "Genomsnittlig BNP-effekt", val: avgBnp !== null ? (avgBnp > 0 ? "+" : "") + avgBnp : "—", unit: avgBnp !== null ? "% av BNP" : "", farg: avgBnp !== null ? effektFarg(parseFloat(avgBnp)) : C.dim },
            { label: "Genomsnittlig Gini-effekt", val: avgGini !== null ? (avgGini > 0 ? "+" : "") + avgGini : "—", unit: avgGini !== null ? "Δ Gini" : "", farg: avgGini !== null ? effektFarg(parseFloat(avgGini), true) : C.dim },
          ].map(({ label, val, unit, farg }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: farg }}>
                {val} <span style={{ fontSize: 12, color: C.dim, fontWeight: 400 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div style={{
          background: "#0d1117", border: "1px solid #1e3a5f", borderRadius: 8,
          padding: "14px 18px", marginBottom: 28, fontSize: 13, color: "#7ca6cc", lineHeight: 1.6,
        }}>
          <strong style={{ color: "#93c5fd" }}>OBS:</strong>{" "}
          Dessa prognoser genereras av en stor språkmodell — inte av en kalibrerad ekonometrisk modell.
          Siffrorna är spekulativa och ska tolkas som <em>riktningsindikatorer</em>, inte precisionsestimat.
          Konfidensnivån reflekterar modellens egna osäkerheter.
        </div>

        {/* Cards */}
        {analyser.length === 0 ? (
          <div style={{ textAlign: "center", color: C.dim, padding: 60, fontSize: 15 }}>
            Inga PIS-analyser ännu — körs automatiskt vid nästa parlamentskörning.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {analyser.map(a => {
              const f = forslagMap[a.lagforslag_id] || {};
              const bnpFarg  = effektFarg(a.bnp_effekt_pct);
              const giniFarg = effektFarg(a.gini_effekt, true); // invert: lägre Gini = bättre
              const kallaBadge = f.kalla === "riksdagen"
                ? { txt: "🏛 Riksdagen", col: "#facc15" }
                : { txt: "🤖 AI-motion", col: C.accent };

              return (
                <div key={a.id} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "20px 22px",
                  borderLeft: `3px solid ${bnpFarg}`,
                }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: kallaBadge.col, fontWeight: 600,
                          border: `1px solid ${kallaBadge.col}44`, borderRadius: 4, padding: "1px 7px" }}>
                          {kallaBadge.txt}
                        </span>
                        {f.kategori && (
                          <span style={{ fontSize: 11, color: C.dim, border: `1px solid ${C.border}`,
                            borderRadius: 4, padding: "1px 7px" }}>{f.kategori}</span>
                        )}
                        <KonfidensBadge v={a.konfidens} />
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
                        {f.riksdagen_url ? (
                          <a href={f.riksdagen_url} target="_blank" rel="noreferrer"
                            style={{ color: "#fff", textDecoration: "none" }}>
                            {f.titel || `Förslag #${a.lagforslag_id}`}
                          </a>
                        ) : (
                          f.titel || `Förslag #${a.lagforslag_id}`
                        )}
                      </div>
                    </div>
                    <SyssLabel v={a.sysselsattning_effekt} />
                  </div>

                  {/* Impact bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: C.dim, width: 80, flexShrink: 0 }}>BNP-effekt</span>
                      <BarSegment val={a.bnp_effekt_pct} max={maxBnp} farg={bnpFarg}
                        label={effektLabel(a.bnp_effekt_pct, "%")} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: C.dim, width: 80, flexShrink: 0 }}>Gini-effekt</span>
                      <BarSegment val={a.gini_effekt} max={maxGini} farg={giniFarg}
                        label={effektLabel(a.gini_effekt, "")} />
                      <span style={{ fontSize: 11, color: giniFarg }}>
                        {a.gini_effekt !== null ? (a.gini_effekt < 0 ? "↓ jämnare" : "↑ ojämnare") : ""}
                      </span>
                    </div>
                  </div>

                  {/* Analysis text */}
                  {a.analys && (
                    <p style={{ fontSize: 13, color: "#999", lineHeight: 1.7, margin: 0 }}>
                      {a.analys}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{ marginTop: 12, fontSize: 11, color: C.dim }}>
                    Analyserad {new Date(a.skapad).toLocaleDateString("sv-SE")}
                    {f.riksdagen_url && (
                      <> · <a href={f.riksdagen_url} target="_blank" rel="noreferrer"
                        style={{ color: C.dim, textDecoration: "underline" }}>Riksdagen.se →</a></>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
