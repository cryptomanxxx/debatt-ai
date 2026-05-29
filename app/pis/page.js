const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 120;

export const metadata = {
  title: "Policy Impact Simulator – DEBATT-AI",
  description: "Oberoende ekonomisk och social analys av alla lagförslag i AI-Parlamentet. BNP, Gini, inflation, arbetslöshet, socialt kapital och koalitionsstabilitet.",
};

const C = {
  bg:      "#0a0a0a",
  card:    "#0f0f0f",
  border:  "#1a1a1a",
  text:    "#e0e0da",
  dim:     "#555",
  accent:  "#a78bfa",
  pos:     "#4ade80",
  neg:     "#f87171",
  neutral: "#64748b",
  warn:    "#facc15",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { analyser: [], forslagMap: {}, mcMap: {} };
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [aRes, fRes, mcRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/pis_analyser?order=skapad.desc&limit=200`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/lagforslag?select=id,titel,kategori,kalla,status,riksdagen_url&order=skapad.desc&limit=300`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/pis_monte_carlo?select=lagforslag_id,iterationer,lyckade_iterationer,bnp_mean,bnp_std,bnp_min,bnp_max,gini_mean,gini_std,inflation_mean,inflation_std,arbetsloshet_mean,arbetsloshet_std,socialt_kapital_dist,koalition_dist&limit=300`, {
      headers: h, next: { revalidate: 120 },
    }),
  ]);

  const analyser = aRes.ok ? await aRes.json() : [];
  const forslag  = fRes.ok ? await fRes.json() : [];
  const mc       = mcRes.ok ? await mcRes.json() : [];
  const forslagMap = {};
  for (const f of forslag) forslagMap[f.id] = f;
  const mcMap = {};
  for (const m of mc) mcMap[m.lagforslag_id] = m;
  return { analyser, forslagMap, mcMap };
}

// ── helpers ───────────────────────────────────────────────────────────────────

function numFarg(val, invertGood = false) {
  if (val === null || val === undefined) return C.dim;
  const good = invertGood ? val < 0 : val > 0;
  if (val === 0) return C.neutral;
  return good ? C.pos : C.neg;
}

function numLabel(val, suffix = "%", decimals = 1) {
  if (val === null || val === undefined) return "—";
  return (val > 0 ? "+" : "") + val.toFixed(decimals) + suffix;
}

function riktningFarg(v) {
  if (v === "positiv") return C.pos;
  if (v === "negativ") return C.neg;
  return C.neutral;
}

function riktningPil(v) {
  if (v === "positiv") return "↑";
  if (v === "negativ") return "↓";
  return "→";
}

// ── sub-components ────────────────────────────────────────────────────────────

function Bar({ val, max, farg }) {
  const pct = Math.min(Math.abs(val ?? 0) / (max || 1) * 100, 100);
  return (
    <div style={{ width: 72, height: 5, background: "#1e1e1e", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: farg, borderRadius: 3 }} />
    </div>
  );
}

function KonfidensBadge({ v }) {
  const col = v === "hög" ? C.pos : v === "medel" ? C.warn : C.dim;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: col, border: `1px solid ${col}44`,
      borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: ".05em" }}>
      {v}
    </span>
  );
}

function MetricRow({ label, val, suffix, decimals, max, invertGood, std, children }) {
  const farg = numFarg(val, invertGood);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: C.dim, width: 120, flexShrink: 0 }}>{label}</span>
      <Bar val={val} max={max} farg={farg} />
      <span style={{ fontSize: 12, fontWeight: 700, color: farg, minWidth: 54 }}>
        {children ?? numLabel(val, suffix, decimals)}
      </span>
      {std != null && (
        <span style={{ fontSize: 10, color: C.dim }}>±{std.toFixed(decimals ?? 1)}</span>
      )}
    </div>
  );
}

function MCBadge({ mc }) {
  if (!mc) return null;
  const pct = Math.round(mc.lyckade_iterationer / mc.iterationer * 100);
  return (
    <span title={`Monte Carlo: ${mc.lyckade_iterationer}/${mc.iterationer} iterationer lyckades`}
      style={{ fontSize: 10, color: C.accent, border: `1px solid ${C.accent}44`,
        borderRadius: 4, padding: "1px 6px", fontWeight: 600, flexShrink: 0 }}>
      🎲 MC {pct}%
    </span>
  );
}

function RiktningRow({ label, v }) {
  const farg = riktningFarg(v);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: C.dim, width: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: farg, lineHeight: 1, flexShrink: 0 }}>{riktningPil(v)}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: farg }}>{v ?? "—"}</span>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function PisPage() {
  const { analyser, forslagMap, mcMap } = await getData();

  const medBnp  = analyser.filter(a => a.bnp_effekt_pct   !== null);
  const medGini = analyser.filter(a => a.gini_effekt       !== null);
  const medInf  = analyser.filter(a => a.inflation_delta   !== null);
  const medArb  = analyser.filter(a => a.arbetsloshet_delta !== null);

  const avg = (arr, key) => arr.length ? arr.reduce((s, a) => s + a[key], 0) / arr.length : null;
  const avgBnp = avg(medBnp,  "bnp_effekt_pct");
  const avgGini = avg(medGini, "gini_effekt");

  const maxBnp  = Math.max(...medBnp.map(a => Math.abs(a.bnp_effekt_pct)), 2);
  const maxGini = Math.max(...medGini.map(a => Math.abs(a.gini_effekt)), 0.05);
  const maxInf  = Math.max(...medInf.map(a => Math.abs(a.inflation_delta)), 1);
  const maxArb  = Math.max(...medArb.map(a => Math.abs(a.arbetsloshet_delta)), 1);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui,sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
            POLICY IMPACT SIMULATOR
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>
            Ekonomisk & social analys av lagförslag
          </h1>
          <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
            Sex indikatorer beräknas av AI en gång per förslag och injiceras i agenternas röstningspromtar.
            Agenterna kan stödja eller ifrågasätta prognosen i sina motiveringar.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Analyserade",       val: analyser.length + " st",     farg: C.accent },
            { label: "Snitt BNP-effekt",  val: avgBnp  !== null ? numLabel(avgBnp, "%")   : "—", farg: numFarg(avgBnp) },
            { label: "Snitt Gini-effekt", val: avgGini !== null ? numLabel(avgGini, "", 3) : "—", farg: numFarg(avgGini, true) },
            { label: "Med MC-analys", val: Object.keys(mcMap).length + " st", farg: C.accent },
          ].map(({ label, val, farg }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: farg }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24, fontSize: 12, color: C.dim }}>
          {[
            ["BNP-effekt", "% av BNP, +bra"],
            ["Gini-effekt", "Δ Gini, −bra (jämnare)"],
            ["Inflation Δ", "procentenheter, −bra"],
            ["Arbetslöshet Δ", "procentenheter, −bra"],
            ["Socialt kapital", "↑/↓/→ förtroende"],
            ["Koalitionsstabilitet", "↑/↓/→ politisk konsensus"],
          ].map(([n, d]) => (
            <span key={n}><strong style={{ color: C.text }}>{n}</strong> — {d}</span>
          ))}
        </div>

        {/* OBS */}
        <div style={{
          background: "#0d1117", border: "1px solid #1e3a5f", borderRadius: 8,
          padding: "12px 16px", marginBottom: 28, fontSize: 12, color: "#7ca6cc", lineHeight: 1.6,
        }}>
          <strong style={{ color: "#93c5fd" }}>OBS:</strong>{" "}
          Prognoser genereras av LLM — inte en kalibrerad ekonometrisk modell.
          Tolka som <em>riktningsindikatorer</em>. Konfidensnivån reflekterar modellens egna osäkerheter.
        </div>

        {/* Cards */}
        {analyser.length === 0 ? (
          <div style={{ textAlign: "center", color: C.dim, padding: 60, fontSize: 15 }}>
            Inga PIS-analyser ännu — körs automatiskt vid nästa parlamentskörning (12:00).
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {analyser.map(a => {
              const f = forslagMap[a.lagforslag_id] || {};
              const mc = mcMap[a.lagforslag_id] || null;
              const accentCol = numFarg(a.bnp_effekt_pct);
              const kallaBadge = f.kalla === "riksdagen"
                ? { txt: "🏛 Riksdagen", col: C.warn }
                : { txt: "🤖 AI-motion", col: C.accent };

              return (
                <div key={a.id} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "20px 22px",
                  borderLeft: `3px solid ${accentCol}`,
                }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: kallaBadge.col, fontWeight: 600,
                          border: `1px solid ${kallaBadge.col}44`, borderRadius: 4, padding: "1px 7px" }}>
                          {kallaBadge.txt}
                        </span>
                        {f.kategori && (
                          <span style={{ fontSize: 11, color: C.dim, border: `1px solid ${C.border}`,
                            borderRadius: 4, padding: "1px 7px" }}>{f.kategori}</span>
                        )}
                        <KonfidensBadge v={a.konfidens} />
                        <MCBadge mc={mc} />
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
                        {f.riksdagen_url ? (
                          <a href={f.riksdagen_url} target="_blank" rel="noreferrer"
                            style={{ color: "#fff", textDecoration: "none" }}>
                            {f.titel || `Förslag #${a.lagforslag_id}`}
                          </a>
                        ) : f.titel || `Förslag #${a.lagforslag_id}`}
                      </div>
                    </div>
                  </div>

                  {/* Indicators — two columns */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      <MetricRow label="BNP-effekt" val={a.bnp_effekt_pct} suffix="%" decimals={1} max={maxBnp} std={mc?.bnp_std} />
                      <MetricRow label="Gini-effekt" val={a.gini_effekt} suffix="" decimals={2} max={maxGini} invertGood std={mc?.gini_std}>
                        {a.gini_effekt !== null
                          ? <>{numLabel(a.gini_effekt, "", 2)} <span style={{ fontSize: 10, color: numFarg(a.gini_effekt, true) }}>{a.gini_effekt < 0 ? "jämnare" : "ojämnare"}</span></>
                          : "—"}
                      </MetricRow>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      <MetricRow label="Inflation Δ" val={a.inflation_delta} suffix="pp" decimals={1} max={maxInf} invertGood std={mc?.inflation_std} />
                      <MetricRow label="Arbetslöshet Δ" val={a.arbetsloshet_delta} suffix="pp" decimals={1} max={maxArb} invertGood std={mc?.arbetsloshet_std} />
                    </div>
                    <RiktningRow label="Socialt kapital" v={a.socialt_kapital_effekt} />
                    <RiktningRow label="Koalitionsstabilitet" v={a.koalition_stabilitet} />
                  </div>

                  {/* Analysis */}
                  {a.analys && (
                    <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, margin: "0 0 10px" }}>
                      {a.analys}
                    </p>
                  )}

                  <div style={{ fontSize: 11, color: C.dim }}>
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
