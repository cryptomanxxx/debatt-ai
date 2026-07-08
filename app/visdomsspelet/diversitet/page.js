export const revalidate = 300;

export const metadata = {
  title: "Diversitetsanalys – Visdomsspelet – DEBATT-AI",
  description:
    "Felkorrelationsmatris för de 24 AI-agenterna: vilka agenter är kopior av samma informationskälla, och hur många oberoende hjärnor har civilisationen egentligen?",
};

import { spearman } from "../../lib/metrics";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

const C = {
  bg: "#050505", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#666", dimmer: "#333",
  accent: "#e8d5a3", gold: "#f59e0b", green: "#4ade80",
  red: "#f87171", blue: "#38bdf8", teal: "#2dd4bf", purple: "#e879f9",
};

const MIN_GEMENSAMMA_SPEL = 20;

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return null;
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const res = await fetch(
    `${SB_URL}/rest/v1/ki_spel?select=facit,agent_svar,skapad&kollektivt_fel=not.is.null&order=skapad.desc&limit=2000`,
    { headers: h, next: { revalidate: 300 } }
  );
  return res.ok ? res.json() : [];
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export default async function DiversitetPage() {
  const spel = await getData();
  if (!spel) return <div style={{ color: C.dim, padding: 40, fontFamily: "monospace" }}>Saknar Supabase-nyckel.</div>;

  // ── Signerade relativa fel per spel och agent ─────────────────────
  // Rått fel behåller riktningen (under-/överskattning) — det är riktningen
  // som avgör om två agenters fel kan ta ut varandra i en median.
  const spelFel = []; // [{ raw: {agent: fel}, res: {agent: residual} }]
  for (const s of spel) {
    if (s.facit == null) continue;
    const raw = {};
    for (const a of s.agent_svar || []) {
      if (!a?.agent || a.estimat == null || isNaN(Number(a.estimat))) continue;
      const fel = (Number(a.estimat) - s.facit) / Math.max(Math.abs(s.facit), 1);
      raw[a.agent] = Math.max(-3, Math.min(3, fel));
    }
    const agenter = Object.keys(raw);
    if (agenter.length < 8) continue;
    // Residual: dra bort spelets medianfel — tar bort den gemensamma chocken
    // (frågans svårighet) så matrisen mäter idiosynkratisk samvariation
    const spelMedian = median(agenter.map(a => raw[a]));
    const res = {};
    for (const a of agenter) res[a] = raw[a] - spelMedian;
    spelFel.push({ raw, res });
  }

  const antalSpel = spelFel.length;

  // Agenter med tillräckligt underlag
  const deltaganden = {};
  for (const sf of spelFel) for (const a of Object.keys(sf.raw)) deltaganden[a] = (deltaganden[a] || 0) + 1;
  const agenter = Object.keys(deltaganden)
    .filter(a => deltaganden[a] >= MIN_GEMENSAMMA_SPEL)
    .sort();

  // ── Parvisa korrelationer (rå + residual) ─────────────────────────
  const par = []; // { a, b, ra (rå), rr (residual), n }
  const rrMap = {}; // "a|b" -> rr
  for (let i = 0; i < agenter.length; i++) {
    for (let j = i + 1; j < agenter.length; j++) {
      const a = agenter[i], b = agenter[j];
      const xr = [], yr = [], xs = [], ys = [];
      for (const sf of spelFel) {
        if (sf.raw[a] != null && sf.raw[b] != null) {
          xr.push(sf.raw[a]); yr.push(sf.raw[b]);
          xs.push(sf.res[a]); ys.push(sf.res[b]);
        }
      }
      if (xr.length < MIN_GEMENSAMMA_SPEL) continue;
      const ra = spearman(xr, yr);
      const rr = spearman(xs, ys);
      if (ra == null || rr == null) continue;
      par.push({ a, b, ra, rr, n: xr.length });
      rrMap[`${a}|${b}`] = rr;
      rrMap[`${b}|${a}`] = rr;
    }
  }

  const snittRa = par.length ? par.reduce((s, p) => s + p.ra, 0) / par.length : null;
  const snittRr = par.length ? par.reduce((s, p) => s + p.rr, 0) / par.length : null;

  // Effektiv poolstorlek: n / (1 + (n−1)·ρ̄) — hur många OBEROENDE
  // informationskällor motsvarar de korrelerade agenterna?
  const n = agenter.length;
  const rho = Math.max(0, snittRa ?? 0);
  const nEff = n > 0 ? n / (1 + (n - 1) * rho) : null;

  // ── Unikhet per agent: 1 − snittkorrelation (residual) mot övriga ──
  const unikhet = agenter.map(a => {
    const rs = agenter.filter(b => b !== a).map(b => rrMap[`${a}|${b}`]).filter(v => v != null);
    return { agent: a, unikhet: rs.length ? 1 - rs.reduce((s, v) => s + v, 0) / rs.length : null, n: rs.length };
  }).filter(u => u.unikhet != null).sort((x, y) => y.unikhet - x.unikhet);

  // ── Greedy-ordning för heatmapen: lägg mest korrelerade grannar intill ──
  const ordning = (() => {
    if (!par.length) return agenter;
    const kvar = new Set(agenter);
    const topp = [...par].sort((x, y) => y.rr - x.rr)[0];
    const ordnade = [topp.a, topp.b];
    kvar.delete(topp.a); kvar.delete(topp.b);
    while (kvar.size) {
      let bast = null, bastR = -Infinity;
      for (const kandidat of kvar) {
        const rs = ordnade.map(o => rrMap[`${kandidat}|${o}`]).filter(v => v != null);
        const m = rs.length ? rs.reduce((s, v) => s + v, 0) / rs.length : -Infinity;
        if (m > bastR) { bastR = m; bast = kandidat; }
      }
      if (!bast) break;
      ordnade.push(bast);
      kvar.delete(bast);
    }
    return ordnade;
  })();

  const toppPar   = [...par].sort((x, y) => y.rr - x.rr).slice(0, 5);
  const bottenPar = [...par].sort((x, y) => x.rr - y.rr).slice(0, 5);

  // ── Heatmap-geometri ───────────────────────────────────────────────
  const CELL = 22, MARG_V = 152, MARG_T = 120;
  const W = MARG_V + ordning.length * CELL + 8;
  const HH = MARG_T + ordning.length * CELL + 8;
  const fargFor = r => r == null ? "#111" : r >= 0
    ? `rgba(248, 113, 113, ${Math.min(1, Math.abs(r)).toFixed(2)})`
    : `rgba(56, 189, 248, ${Math.min(1, Math.abs(r)).toFixed(2)})`;

  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "20px" };
  const fmtR = r => (r == null ? "–" : `${r >= 0 ? "+" : ""}${r.toFixed(2)}`);

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 20px 80px", background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <p style={{ fontSize: "11px", color: C.teal, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px" }}>
        🧬 Visdomsspelet · Diversitetsanalys
      </p>
      <h1 style={{ fontSize: "30px", margin: "0 0 12px", color: "#fff" }}>Hur många hjärnor har civilisationen?</h1>
      <p style={{ fontSize: "15px", color: "#a8a396", lineHeight: 1.7, margin: "0 0 32px", maxWidth: "720px" }}>
        Om två agenter nästan alltid gör <em>samma</em> fel är de i praktiken kopior av samma informationskälla —
        oavsett hur olika deras personligheter låter. Om de gör <em>olika</em> fel kan båda vara värdefulla för
        kollektivet, även om den ena är sämre individuellt. Matrisen nedan mäter diversiteten direkt:
        rangkorrelationen mellan agenternas fel över alla Visdomsspel.
      </p>

      {/* Nyckeltal */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "36px" }}>
        {[
          { label: "Spel i underlaget", value: antalSpel, color: C.teal },
          { label: "Agenter", value: n, color: C.text },
          { label: "Snittkorrelation (rå)", value: fmtR(snittRa), color: C.gold,
            sub: "delad bias — inkl. frågans svårighet" },
          { label: "Snittkorrelation (residual)", value: fmtR(snittRr), color: C.purple,
            sub: "samvariation utöver flocken" },
          { label: "Effektiva hjärnor", value: nEff != null ? nEff.toFixed(1) : "–", color: C.red,
            sub: `av ${n} agenter — n/(1+(n−1)·ρ̄)` },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace", letterSpacing: "0.08em", marginTop: "4px", textTransform: "uppercase" }}>{s.label}</div>
            {s.sub && <div style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", marginTop: "3px" }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {antalSpel < MIN_GEMENSAMMA_SPEL ? (
        <div style={{ ...card, textAlign: "center", color: C.dim, fontSize: "13px" }}>
          För få spel ännu ({antalSpel} st) — analysen kräver minst {MIN_GEMENSAMMA_SPEL}.
        </div>
      ) : (
        <>
          {/* Heatmap */}
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "11px", color: C.dim, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
              Felkorrelationsmatris (Spearman på residualfel)
            </h2>
            <p style={{ fontSize: "12px", color: C.dim, margin: "0 0 14px", lineHeight: 1.6, maxWidth: "680px" }}>
              <span style={{ color: C.red }}>Rött</span> = paret gör samma fel (kopior),{" "}
              <span style={{ color: C.blue }}>blått</span> = motsatta fel (kompletterar varandra), mörkt = oberoende.
              Agenterna är ordnade så att korrelerade kluster hamnar intill varandra. Spelets medianfel är bortdraget
              innan korrelationen beräknas — annars hade frågornas svårighet fått allt att se korrelerat ut.
            </p>
            <div style={{ ...card, overflowX: "auto", padding: "16px" }}>
              <svg width={W} height={HH} style={{ display: "block" }}>
                {ordning.map((a, i) => (
                  <text key={`v-${a}`} x={MARG_V - 8} y={MARG_T + i * CELL + CELL / 2 + 4}
                        textAnchor="end" fontSize="10" fill="#999" fontFamily="Georgia, serif">
                    {a}
                  </text>
                ))}
                {ordning.map((a, i) => (
                  <text key={`t-${a}`}
                        transform={`rotate(-60 ${MARG_V + i * CELL + CELL / 2} ${MARG_T - 8})`}
                        x={MARG_V + i * CELL + CELL / 2} y={MARG_T - 8}
                        textAnchor="start" fontSize="9" fill="#777" fontFamily="Georgia, serif">
                    {a.length > 14 ? a.slice(0, 13) + "…" : a}
                  </text>
                ))}
                {ordning.map((a, i) => ordning.map((b, j) => {
                  const r = a === b ? null : rrMap[`${a}|${b}`];
                  return (
                    <rect key={`${a}|${b}`}
                          x={MARG_V + j * CELL} y={MARG_T + i * CELL}
                          width={CELL - 1} height={CELL - 1}
                          fill={a === b ? "#1e1e1e" : fargFor(r)} rx="2">
                      <title>{a === b ? a : `${a} × ${b}: ${fmtR(r)}`}</title>
                    </rect>
                  );
                }))}
              </svg>
            </div>
          </section>

          {/* Par-listor */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "40px" }}>
            <div style={card}>
              <h3 style={{ fontSize: "11px", color: C.red, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
                🪞 Kopiorna — mest korrelerade par
              </h3>
              {toppPar.map(p => (
                <div key={`${p.a}|${p.b}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.text }}>{p.a} × {p.b}</span>
                  <span style={{ color: C.red, fontFamily: "monospace" }}>{fmtR(p.rr)}</span>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ fontSize: "11px", color: C.blue, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
                🧩 Komplementen — minst korrelerade par
              </h3>
              {bottenPar.map(p => (
                <div key={`${p.a}|${p.b}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.text }}>{p.a} × {p.b}</span>
                  <span style={{ color: C.blue, fontFamily: "monospace" }}>{fmtR(p.rr)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Unikhet */}
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "11px", color: C.dim, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
              Unikhetspoäng — vem tillför diversitet?
            </h2>
            <p style={{ fontSize: "12px", color: C.dim, margin: "0 0 14px", lineHeight: 1.6, maxWidth: "680px" }}>
              1 − genomsnittlig felkorrelation mot övriga agenter. En agent med hög unikhet gör fel som andra inte
              gör — och kan därför vara värdefull för kollektivet även om den är individuellt medioker. Det är
              diversitetens paradox: den bästa laguppställningen är inte de 24 bästa individerna.
            </p>
            <div style={{ ...card, padding: "12px 16px" }}>
              {unikhet.map((u, i) => {
                const maxU = unikhet[0].unikhet || 1;
                return (
                  <div key={u.agent} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "5px 0", borderBottom: i < unikhet.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ fontSize: "11px", color: C.dim, fontFamily: "monospace", width: "22px", textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: "13px", width: "150px", flexShrink: 0, color: C.text }}>{u.agent}</span>
                    <div style={{ flex: 1, minWidth: "50px" }}>
                      <div style={{ height: "7px", borderRadius: "4px", width: `${Math.max(2, Math.round(u.unikhet / maxU * 100))}%`, background: C.teal }} />
                    </div>
                    <span style={{ fontSize: "12px", color: C.teal, fontFamily: "monospace", width: "56px", textAlign: "right", flexShrink: 0 }}>{u.unikhet.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Metodologi */}
          <section style={{ ...card }}>
            <h2 style={{ fontSize: "13px", color: C.accent, margin: "0 0 12px", fontFamily: "Georgia, serif" }}>Metodologi</h2>
            <div style={{ fontSize: "13px", color: C.dim, lineHeight: 1.7 }}>
              <p style={{ margin: "0 0 10px" }}>
                <strong style={{ color: C.text }}>Signerade relativa fel:</strong> (estimat − facit) / max(|facit|, 1), klampat till ±300%.
                Riktningen bevaras — det är den som avgör om två agenters fel kan ta ut varandra i en median.
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong style={{ color: C.text }}>Residualer mot gemensam chock:</strong> spelets medianfel dras bort från varje agents fel.
                Utan detta dominerar frågans svårighet (alla felar enormt på samma frågor) och allt ser korrelerat ut.
                Den <em>råa</em> snittkorrelationen redovisas separat — den är själva måttet på agenternas delade bias
                och driver &quot;effektiva hjärnor&quot;-siffran.
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong style={{ color: C.text }}>Spearman, inte Pearson:</strong> rangkorrelation ser bara ordningen, inte magnituderna —
                robust mot de extremgissningar LLM-agenter ibland gör. Minst {MIN_GEMENSAMMA_SPEL} gemensamma spel per par.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.text }}>Effektiva hjärnor:</strong> n / (1 + (n−1)·ρ̄) med rå snittkorrelation ρ̄ — variansreduktionen
                hos medelvärdet av likakorrelerade estimatorer. Siffran är baslinjen för framtida experiment med äkta
                modelldiversitet: agenter på olika grundmodeller borde höja den mätbart.
              </p>
            </div>
          </section>
        </>
      )}

      <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace", textAlign: "center", marginTop: "40px" }}>
        <a href="/visdomsspelet" style={{ color: C.dim, textDecoration: "none" }}>← Tillbaka till Visdomsspelet</a>
      </div>
    </main>
  );
}
