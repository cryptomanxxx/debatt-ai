import PisKlient from "./PisKlient";

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
    fetch(`${SB_URL}/rest/v1/pis_analyser?order=skapad.desc&limit=500`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/lagforslag?select=id,titel,kategori,kalla,status,riksdagen_url&order=skapad.desc&limit=500`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/pis_monte_carlo?select=lagforslag_id,iterationer,lyckade_iterationer,bnp_mean,bnp_std,bnp_min,bnp_max,gini_mean,gini_std,inflation_mean,inflation_std,arbetsloshet_mean,arbetsloshet_std,socialt_kapital_dist,koalition_dist&limit=500`, {
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

function numFarg(val, invertGood = false) {
  if (val === null || val === undefined) return C.dim;
  if (val === 0) return C.neutral;
  const good = invertGood ? val < 0 : val > 0;
  return good ? C.pos : C.neg;
}

function numLabel(val, suffix = "%", decimals = 1) {
  if (val === null || val === undefined) return "—";
  return (val > 0 ? "+" : "") + val.toFixed(decimals) + suffix;
}

export default async function PisPage() {
  const { analyser, forslagMap, mcMap } = await getData();

  const medBnp  = analyser.filter(a => a.bnp_effekt_pct   !== null);
  const medGini = analyser.filter(a => a.gini_effekt       !== null);
  const medInf  = analyser.filter(a => a.inflation_delta   !== null);
  const medArb  = analyser.filter(a => a.arbetsloshet_delta !== null);

  const avg = (arr, key) => arr.length ? arr.reduce((s, a) => s + a[key], 0) / arr.length : null;
  const avgBnp  = avg(medBnp,  "bnp_effekt_pct");
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
            Ekonomisk &amp; social analys av lagförslag
          </h1>
          <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
            Sex indikatorer beräknas av AI en gång per förslag och injiceras i agenternas röstningspromtar.
            Agenterna kan stödja eller ifrågasätta prognosen i sina motiveringar.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Analyserade",       val: analyser.length + " st",                    farg: C.accent },
            { label: "Snitt BNP-effekt",  val: avgBnp  !== null ? numLabel(avgBnp, "%")   : "—", farg: numFarg(avgBnp) },
            { label: "Snitt Gini-effekt", val: avgGini !== null ? numLabel(avgGini, "", 3) : "—", farg: numFarg(avgGini, true) },
            { label: "Med MC-analys",     val: Object.keys(mcMap).length + " st",           farg: C.accent },
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

        {/* Kort — hanteras av klientkomponent med paginering */}
        {analyser.length === 0 ? (
          <div style={{ textAlign: "center", color: C.dim, padding: 60, fontSize: 15 }}>
            Inga PIS-analyser ännu — körs automatiskt vid nästa parlamentskörning (12:00).
          </div>
        ) : (
          <PisKlient
            analyser={analyser}
            forslagMap={forslagMap}
            mcMap={mcMap}
            maxBnp={maxBnp}
            maxGini={maxGini}
            maxInf={maxInf}
            maxArb={maxArb}
          />
        )}
      </div>
    </div>
  );
}
