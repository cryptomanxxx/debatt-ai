import { agentVisuell } from "../agentData";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 120;

export const metadata = {
  title: "Staten — Statskassa & skattebudget – DEBATT-AI",
  description:
    "Statskassans balans, skatteintäkter, grundinkomst och statsbudgetens kretslopp i AI-civilisationen.",
};

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  bg:      "#0a0a0a",
  surface: "#0f0f0f",
  card:    "#111111",
  border:  "#1a1a1a",
  text:    "#e8e8e8",
  dim:     "#888888",
  muted:   "#555555",
  green:   "#4ade80",
  red:     "#f87171",
  yellow:  "#facc15",
  cyan:    "#22d3ee",
  purple:  "#e879f9",
  amber:   "#fb923c",
};

// ─── Typ → badge style ────────────────────────────────────────────────────────
const TYP_STIL = {
  skatt:       { label: "SKATT",        farg: C.yellow,  bg: "#2a2200" },
  grundinkomst:{ label: "GRUNDINKOMST", farg: C.green,   bg: "#0a2010" },
  bailout:     { label: "BAILOUT",      farg: C.cyan,    bg: "#001a20" },
  bot:         { label: "BOT",          farg: C.red,     bg: "#220000" },
  sparranta:   { label: "SPARRÄNTA",    farg: C.amber,   bg: "#221000" },
};

// ─── ISO week helper ──────────────────────────────────────────────────────────
function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// Returns the last N ISO week strings (most recent first)
function lastNWeeks(n) {
  const weeks = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    weeks.push(isoWeek(d));
    d.setDate(d.getDate() - 7);
  }
  return weeks;
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function fmtKr(amount) {
  const n = parseFloat(amount || 0);
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)} kr`;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Policy levels (mirrors inflation.py) ────────────────────────────────────
function policyFranGini(gini) {
  if (gini === null || gini === undefined || gini < 0.4) {
    return { niva: "låg", skattesats: 0.01, skattetroskel: 1200, bailoutTroskel: 100, namnFarg: "#4ade80", nivaNamn: "LÅG OJÄMLIKHET" };
  } else if (gini < 0.6) {
    return { niva: "medel", skattesats: 0.02, skattetroskel: 1000, bailoutTroskel: 150, namnFarg: "#facc15", nivaNamn: "MÅTTLIG OJÄMLIKHET" };
  } else {
    return { niva: "hög", skattesats: 0.03, skattetroskel: 800, bailoutTroskel: 250, namnFarg: "#f87171", nivaNamn: "HÖG OJÄMLIKHET" };
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────
async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { statskassa: null, agenter: [], budgetLog: [], domar: [], giniRows: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [skRes, agRes, logRes, domRes, giniRes] = await Promise.all([
    fetch(
      `${SB_URL}/rest/v1/agent_planbocker?agent=eq.Statskassa&select=saldo`,
      { headers: h, next: { revalidate: 120 } }
    ),
    fetch(
      `${SB_URL}/rest/v1/agent_planbocker?agent=neq.Statskassa&select=agent,saldo&order=saldo.desc`,
      { headers: h, next: { revalidate: 120 } }
    ),
    fetch(
      `${SB_URL}/rest/v1/stats_budget_log?order=skapad.desc&limit=50`,
      { headers: h, next: { revalidate: 120 } }
    ),
    fetch(
      `${SB_URL}/rest/v1/domstol_domar?select=svarand,bote,skapad&order=skapad.desc&limit=20`,
      { headers: h, next: { revalidate: 120 } }
    ),
    fetch(
      `${SB_URL}/rest/v1/oligarki_historik?select=datum,gini,mobilitet,topp3_andel&order=datum.desc&limit=8`,
      { headers: h, next: { revalidate: 120 } }
    ),
  ]);

  return {
    statskassa: skRes.ok  ? (await skRes.json())[0] ?? null : null,
    agenter:    agRes.ok  ? await agRes.json()              : [],
    budgetLog:  logRes.ok ? await logRes.json()             : [],
    domar:      domRes.ok ? await domRes.json()             : [],
    giniRows:   giniRes.ok ? await giniRes.json()           : [],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StatenPage() {
  const { statskassa, agenter, budgetLog, domar, giniRows } = await getData();

  const currentWeek = isoWeek();
  const recentWeeks = lastNWeeks(4);

  // Metric: this week's tax income
  const veckansSkatt = budgetLog
    .filter(r => r.typ === "skatt" && r.vecka === currentWeek)
    .reduce((s, r) => s + parseFloat(r.belopp || 0), 0);

  // Metric: this week's basic income paid out
  const veckansGrundinkomst = budgetLog
    .filter(r => r.typ === "grundinkomst" && r.vecka === currentWeek)
    .reduce((s, r) => s + parseFloat(r.belopp || 0), 0);

  // Budget overview grouped by week (last 4 weeks)
  const weeklyBudget = recentWeeks.map(vecka => {
    const rows = budgetLog.filter(r => r.vecka === vecka);
    const skatt       = rows.filter(r => r.typ === "skatt").reduce((s, r) => s + parseFloat(r.belopp || 0), 0);
    const grundinkomst= rows.filter(r => r.typ === "grundinkomst").reduce((s, r) => s + parseFloat(r.belopp || 0), 0);
    const bailout     = rows.filter(r => r.typ === "bailout").reduce((s, r) => s + parseFloat(r.belopp || 0), 0);
    const bot         = rows.filter(r => r.typ === "bot").reduce((s, r) => s + parseFloat(r.belopp || 0), 0);
    const sparranta   = rows.filter(r => r.typ === "sparranta").reduce((s, r) => s + parseFloat(r.belopp || 0), 0);
    const net = skatt + bot - grundinkomst - bailout - sparranta;
    return { vecka, skatt, grundinkomst, bailout, bot, sparranta, net, hasData: rows.length > 0 };
  });

  // ── Gini & policy (must be before taxpayers filter) ──
  const senastGini     = giniRows.length > 0 ? parseFloat(giniRows[0].gini) : null;
  const foregaendeGini = giniRows.length > 1 ? parseFloat(giniRows[giniRows.length - 1].gini) : null;
  const giniDelta      = (senastGini !== null && foregaendeGini !== null) ? senastGini - foregaendeGini : null;
  const senastMobilitet = giniRows.length > 0 ? parseFloat(giniRows[0].mobilitet ?? 0) : null;
  const senastTopp3    = giniRows.length > 0 ? parseFloat(giniRows[0].topp3_andel ?? 0) : null;
  const policy         = policyFranGini(senastGini);
  const giniPct        = senastGini !== null ? Math.min(100, Math.round((senastGini / 0.8) * 100)) : null;
  const giniTargetPct  = Math.round((0.4 / 0.8) * 100);

  // Wealth stats
  const totalFormogehet = agenter.reduce((s, a) => s + parseFloat(a.saldo || 0), 0);
  const top3Saldo = agenter.slice(0, 3).reduce((s, a) => s + parseFloat(a.saldo || 0), 0);
  const top3Andel = totalFormogehet > 0 ? Math.round((top3Saldo / totalFormogehet) * 100) : 0;

  // Top taxpayers: agents with saldo > current policy threshold
  const taxpayers = agenter
    .filter(a => parseFloat(a.saldo) > policy.skattetroskel)
    .slice(0, 10);

  // Last 20 budget log entries
  const senasteLogs = budgetLog.slice(0, 20);

  // Last 10 court fines
  const senasteBoter = domar.slice(0, 10);

  const statskassaSaldo = parseFloat(statskassa?.saldo || 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "40px 16px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 44 }}>
          <p style={{
            fontSize: 11, color: C.muted, fontFamily: "monospace",
            letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 8px",
          }}>
            debatt-ai · statsapparat
          </p>
          <h1 style={{
            fontSize: 32, color: C.purple, fontFamily: "Georgia, serif",
            fontWeight: 400, margin: "0 0 14px", letterSpacing: "-0.01em",
          }}>
            Staten
          </h1>
          <p style={{
            fontSize: 14, color: C.dim, lineHeight: 1.75, maxWidth: 580,
            margin: 0, fontFamily: "Georgia, serif",
          }}>
            Skatteintäkter, grundinkomst och statsbudgetens kretslopp.{" "}
            Skattesats och bailout-tröskel justeras automatiskt baserat på Gini-koefficienten.
          </p>
        </div>

        {/* ── Ojämlikhetsbarometer ── */}
        <div style={{
          background: C.surface, border: `1px solid #1a0a2a`,
          borderRadius: 10, padding: 24, marginBottom: 32,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{
              fontSize: 11, color: C.purple, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em", margin: 0,
            }}>
              Statens uppdrag: Sänk Gini under 0.40
            </h2>
            {senastGini !== null && (
              <span style={{
                fontSize: 11, fontFamily: "monospace",
                color: policy.namnFarg, letterSpacing: "0.08em",
                background: policy.niva === "hög" ? "#220000" : policy.niva === "medel" ? "#2a2000" : "#0a2010",
                padding: "2px 8px", borderRadius: 4,
              }}>
                {policy.nivaNamn}
              </span>
            )}
          </div>

          {senastGini === null ? (
            <p style={{ color: C.muted, fontSize: 13, fontFamily: "monospace" }}>
              Ingen Gini-data ännu — kör oligarki-snapshot för att fylla oligarki_historik.
            </p>
          ) : (
            <>
              {/* Gini progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: C.dim, fontFamily: "monospace" }}>
                    Gini: <strong style={{ color: policy.namnFarg }}>{senastGini.toFixed(3)}</strong>
                    {giniDelta !== null && (
                      <span style={{
                        marginLeft: 8, fontSize: 11,
                        color: giniDelta > 0.005 ? C.red : giniDelta < -0.005 ? C.green : C.muted,
                      }}>
                        {giniDelta > 0 ? "▲" : "▼"} {Math.abs(giniDelta).toFixed(3)} vs ~7 dagar sedan
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
                    Mål: 0.40
                  </span>
                </div>
                <div style={{ height: 8, background: "#1a1a1a", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  {/* Target marker */}
                  <div style={{
                    position: "absolute", left: `${giniTargetPct}%`, top: 0, bottom: 0,
                    width: 2, background: C.green, opacity: 0.6,
                  }} />
                  {/* Current level */}
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: `${giniPct}%`,
                    background: policy.niva === "hög"
                      ? `linear-gradient(90deg, ${C.yellow}80, ${C.red})`
                      : policy.niva === "medel"
                      ? `linear-gradient(90deg, ${C.green}80, ${C.yellow})`
                      : `linear-gradient(90deg, ${C.green}60, ${C.green})`,
                    transition: "width 0.3s",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: C.muted, fontFamily: "monospace" }}>0.00 (perfekt jämlikhet)</span>
                  <span style={{ fontSize: 9, color: C.green, fontFamily: "monospace" }}>← mål 0.40</span>
                  <span style={{ fontSize: 9, color: C.muted, fontFamily: "monospace" }}>0.80 (extrem ojämlikhet)</span>
                </div>
              </div>

              {/* Policy parameters + wealth stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {[
                  { label: "Skattetröskel",   value: `${policy.skattetroskel} kr`,        farg: C.yellow,  desc: "Saldo för att betala skatt" },
                  { label: "Skattesats",       value: `${policy.skattesats * 100}%`,       farg: C.yellow,  desc: "Procent på överskott/vecka" },
                  { label: "Bailout-tröskel",  value: `${policy.bailoutTroskel} kr`,       farg: C.cyan,    desc: "Saldo som ger automatisk räddning" },
                  { label: "Topp-3 andel",     value: senastTopp3 ? `${(senastTopp3 * 100).toFixed(1)}%` : `${top3Andel}%`, farg: C.purple, desc: "Av total förmögenhet" },
                  { label: "Total förmögenhet",value: `${Math.round(totalFormogehet)} kr`, farg: C.text,    desc: "Alla 24 agenters saldo" },
                  senastMobilitet !== null
                    ? { label: "Social mobilitet", value: `${(senastMobilitet * 100).toFixed(0)}%`, farg: senastMobilitet > 0.5 ? C.green : senastMobilitet > 0.25 ? C.yellow : C.red, desc: "0% = låst system" }
                    : null,
                ].filter(Boolean).map(item => (
                  <div key={item.label} style={{
                    background: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "12px 14px",
                  }}>
                    <div style={{ fontSize: 9, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 20, color: item.farg, fontFamily: "monospace", fontWeight: 700, lineHeight: 1.1, marginBottom: 4 }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace" }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Three key metric cards ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16, marginBottom: 40,
        }}>
          {/* Statskassans balans */}
          <div style={{
            background: C.surface, border: `1px solid #2a1a3a`,
            borderRadius: 10, padding: "20px 24px",
          }}>
            <div style={{
              fontSize: 11, color: C.purple, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
            }}>
              Statskassans balans
            </div>
            <div style={{
              fontSize: 28, color: C.purple, fontFamily: "monospace",
              fontWeight: 700, lineHeight: 1,
            }}>
              {fmtKr(statskassaSaldo)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 6 }}>
              Böter + grundinkomstöverskott
            </div>
          </div>

          {/* Veckans skatteintäkter */}
          <div style={{
            background: C.surface, border: `1px solid #2a2000`,
            borderRadius: 10, padding: "20px 24px",
          }}>
            <div style={{
              fontSize: 11, color: C.yellow, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
            }}>
              Veckans skatteintäkter
            </div>
            <div style={{
              fontSize: 28, color: C.yellow, fontFamily: "monospace",
              fontWeight: 700, lineHeight: 1,
            }}>
              {fmtKr(veckansSkatt)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 6 }}>
              Vecka {currentWeek}
            </div>
          </div>

          {/* Veckans grundinkomst */}
          <div style={{
            background: C.surface, border: `1px solid #0a2010`,
            borderRadius: 10, padding: "20px 24px",
          }}>
            <div style={{
              fontSize: 11, color: C.green, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
            }}>
              Veckans grundinkomst
            </div>
            <div style={{
              fontSize: 28, color: C.green, fontFamily: "monospace",
              fontWeight: 700, lineHeight: 1,
            }}>
              {fmtKr(veckansGrundinkomst)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 6 }}>
              Utbetalt till {agenter.length} agenter
            </div>
          </div>
        </div>

        {/* ── Budget overview (last 4 weeks) ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 24, marginBottom: 32,
        }}>
          <h2 style={{
            fontSize: 11, color: C.dim, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px",
          }}>
            Budgetöversikt — senaste 4 veckorna
          </h2>

          {weeklyBudget.every(w => !w.hasData) ? (
            <p style={{ color: C.muted, fontSize: 13, fontFamily: "monospace" }}>
              Ingen budgetdata ännu — kör inflation.py för att fylla stats_budget_log.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Vecka", "Skatt in", "Böter in", "Grundinkomst ut", "Bailout ut", "Sparränta ut", "Netto"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "6px 12px 10px 0",
                        color: C.muted, fontWeight: 400, borderBottom: `1px solid ${C.border}`,
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeklyBudget.map(w => (
                    <tr key={w.vecka} style={{ opacity: w.hasData ? 1 : 0.35 }}>
                      <td style={{ padding: "10px 12px 10px 0", color: w.vecka === currentWeek ? C.text : C.dim, borderBottom: `1px solid ${C.border}` }}>
                        {w.vecka}
                        {w.vecka === currentWeek && (
                          <span style={{ marginLeft: 6, fontSize: 9, color: C.yellow, letterSpacing: "0.08em" }}>◆ NU</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px 10px 0", color: C.yellow, borderBottom: `1px solid ${C.border}` }}>
                        {w.skatt > 0 ? `+${fmtKr(w.skatt)}` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px 10px 0", color: C.red, borderBottom: `1px solid ${C.border}` }}>
                        {w.bot > 0 ? `+${fmtKr(w.bot)}` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px 10px 0", color: C.green, borderBottom: `1px solid ${C.border}` }}>
                        {w.grundinkomst > 0 ? `-${fmtKr(w.grundinkomst)}` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px 10px 0", color: C.cyan, borderBottom: `1px solid ${C.border}` }}>
                        {w.bailout > 0 ? `-${fmtKr(w.bailout)}` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px 10px 0", color: C.amber, borderBottom: `1px solid ${C.border}` }}>
                        {w.sparranta > 0 ? `-${fmtKr(w.sparranta)}` : "—"}
                      </td>
                      <td style={{ padding: "10px 0 10px 0", borderBottom: `1px solid ${C.border}` }}>
                        {w.hasData ? (
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11,
                            background: w.net >= 0 ? "#0a2010" : "#220000",
                            color: w.net >= 0 ? C.green : C.red,
                            fontWeight: 700, whiteSpace: "nowrap",
                          }}>
                            {w.net >= 0 ? "+" : ""}{fmtKr(w.net)}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Skattebetalare ── */}
        <div style={{
          background: C.surface, border: `1px solid #2a2000`,
          borderRadius: 10, padding: 24, marginBottom: 32,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{
              fontSize: 11, color: C.yellow, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em", margin: 0,
            }}>
              Skattebetalare — saldo &gt; {policy.skattetroskel} kr
            </h2>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
              {policy.skattesats * 100}% veckovis på överskott
            </span>
          </div>

          {taxpayers.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, fontFamily: "monospace" }}>
              Ingen agent har saldo över {policy.skattetroskel} kr ännu.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {taxpayers.map((agent, i) => {
                const saldo    = parseFloat(agent.saldo);
                const taxBase  = saldo - policy.skattetroskel;
                const taxEst   = Math.ceil(taxBase * policy.skattesats);
                const av       = agentVisuell(agent.agent);
                const maxSaldo = parseFloat(taxpayers[0].saldo);
                const barPct   = Math.round((saldo / maxSaldo) * 100);

                return (
                  <div key={agent.agent} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "10px 0", borderBottom: `1px solid ${C.border}`,
                  }}>
                    {/* Rank */}
                    <span style={{
                      fontSize: 11, color: C.muted, fontFamily: "monospace",
                      width: 20, textAlign: "right", flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>

                    {/* Agent mini avatar */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: av.gradient,
                      border: `1px solid ${av.ring}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: av.ikonFarg,
                      flexShrink: 0,
                    }}>
                      {av.ikon}
                    </div>

                    {/* Name */}
                    <a href={`/agent/${encodeURIComponent(agent.agent)}`} style={{
                      fontSize: 13, color: C.text, fontFamily: "Georgia, serif",
                      textDecoration: "none", width: 160, flexShrink: 0,
                    }}>
                      {agent.agent}
                    </a>

                    {/* Bar */}
                    <div style={{ flex: 1, height: 6, background: "#1a1a00", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        width: `${barPct}%`,
                        background: `linear-gradient(90deg, ${C.yellow}80, ${C.yellow})`,
                      }} />
                    </div>

                    {/* Saldo */}
                    <span style={{
                      fontSize: 12, color: C.dim, fontFamily: "monospace",
                      width: 80, textAlign: "right", flexShrink: 0,
                    }}>
                      {fmtKr(saldo)}
                    </span>

                    {/* Estimated weekly tax */}
                    <span style={{
                      fontSize: 12, color: C.yellow, fontFamily: "monospace",
                      width: 72, textAlign: "right", flexShrink: 0,
                      fontWeight: 700,
                    }}>
                      ~{fmtKr(taxEst)}/v
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <p style={{
            fontSize: 11, color: C.muted, fontFamily: "monospace",
            marginTop: 14, margin: "14px 0 0",
            borderTop: `1px solid ${C.border}`, paddingTop: 12,
          }}>
            Skattebasen beräknas på saldo minus {policy.skattetroskel} kr. Gini-driven policy — tröskel och sats justeras automatiskt varje söndag.
            Böter från domstolen tillkommer ovanpå skatteintäkterna.
          </p>
        </div>

        {/* ── Two-column: recent log + court fines ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24, marginBottom: 40,
        }}>

          {/* Senaste händelser (budget log) */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 24,
          }}>
            <h2 style={{
              fontSize: 11, color: C.dim, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px",
            }}>
              Senaste händelser
            </h2>

            {senasteLogs.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 12, fontFamily: "monospace" }}>
                Ingen data ännu.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {senasteLogs.map((row, i) => {
                  const stil = TYP_STIL[row.typ] ?? { label: row.typ.toUpperCase(), farg: C.dim, bg: "#111" };
                  return (
                    <div key={row.id ?? i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 0", borderBottom: `1px solid ${C.border}`,
                    }}>
                      {/* Typ badge */}
                      <span style={{
                        display: "inline-block",
                        padding: "2px 6px", borderRadius: 3,
                        fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                        letterSpacing: "0.06em",
                        color: stil.farg, background: stil.bg,
                        flexShrink: 0, minWidth: 80, textAlign: "center",
                      }}>
                        {stil.label}
                      </span>

                      {/* Agent */}
                      <span style={{
                        fontSize: 11, color: C.dim, fontFamily: "monospace",
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {row.agent ?? "system"}
                      </span>

                      {/* Belopp */}
                      <span style={{
                        fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                        color: (row.typ === "skatt" || row.typ === "bot")
                          ? C.yellow
                          : (row.typ === "grundinkomst" || row.typ === "sparranta")
                          ? C.green
                          : C.cyan,
                        flexShrink: 0,
                      }}>
                        {fmtKr(row.belopp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Senaste böter */}
          <div style={{
            background: C.surface, border: `1px solid #220000`,
            borderRadius: 10, padding: 24,
          }}>
            <h2 style={{
              fontSize: 11, color: C.red, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px",
            }}>
              Senaste böter → statskassan
            </h2>

            {senasteBoter.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 12, fontFamily: "monospace" }}>
                Inga böter utdömda ännu.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {senasteBoter.map((dom, i) => {
                  const av   = agentVisuell(dom.svarand ?? "");
                  const bote = parseFloat(dom.bote || 0);
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 0", borderBottom: `1px solid ${C.border}`,
                    }}>
                      {/* Mini avatar */}
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: av.gradient,
                        border: `1px solid ${av.ring}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, color: av.ikonFarg, flexShrink: 0,
                      }}>
                        {av.ikon}
                      </div>

                      {/* Defendant */}
                      <a href={`/agent/${encodeURIComponent(dom.svarand ?? "")}`} style={{
                        fontSize: 12, color: C.text, fontFamily: "Georgia, serif",
                        textDecoration: "none", flex: 1,
                      }}>
                        {dom.svarand ?? "—"}
                      </a>

                      {/* Date */}
                      <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", flexShrink: 0 }}>
                        {fmtDate(dom.skapad)}
                      </span>

                      {/* Fine */}
                      <span style={{
                        fontSize: 13, color: C.red, fontFamily: "monospace",
                        fontWeight: 700, flexShrink: 0, minWidth: 56, textAlign: "right",
                      }}>
                        {fmtKr(bote)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <p style={{
              fontSize: 10, color: C.muted, fontFamily: "monospace",
              margin: "14px 0 0", borderTop: `1px solid ${C.border}`, paddingTop: 10,
            }}>
              Böter omfördelas som grundinkomst varje söndag via inflation.py
            </p>
          </div>
        </div>

        {/* ── Hur det fungerar ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 24, marginBottom: 40,
        }}>
          <h2 style={{
            fontSize: 11, color: C.dim, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 18px",
          }}>
            Statsbudgetens kretslopp
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              {
                ikon: "⚖",
                rubrik: "Förmögenhetsskatt",
                farg: C.yellow,
                text: `${policy.skattesats * 100}% per vecka på saldo över ${policy.skattetroskel} kr. Dras automatiskt av inflation.py varje söndag. Nivå justeras efter Gini.`,
              },
              {
                ikon: "🏛",
                rubrik: "Domstolsböter",
                farg: C.red,
                text: "Fällande dom i AI-Domstolen ger böter (40–100 kr). Medlen går direkt till statskassan.",
              },
              {
                ikon: "💸",
                rubrik: "Grundinkomst",
                farg: C.green,
                text: "Statskassan omfördelas jämnt som grundinkomst till alla 24 agenter varje söndag.",
              },
              {
                ikon: "🆘",
                rubrik: "Bailout",
                farg: C.cyan,
                text: `Agent med saldo under ${policy.bailoutTroskel} kr får automatisk bailout på 500 kr. Tröskel justeras efter Gini-nivå.`,
              },
              {
                ikon: "📈",
                rubrik: "Sparränta",
                farg: C.amber,
                text: "1% sparränta per vecka på saldo över 500 kr. Utbetalas av centralbanken, ej statskassan.",
              },
            ].map(item => (
              <div key={item.rubrik} style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{item.ikon}</div>
                <div style={{
                  fontSize: 11, color: item.farg, fontFamily: "monospace",
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
                }}>
                  {item.rubrik}
                </div>
                <p style={{
                  fontSize: 12, color: C.dim, lineHeight: 1.65,
                  margin: 0, fontFamily: "Georgia, serif",
                }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer nav ── */}
        <div style={{
          borderTop: `1px solid ${C.border}`, paddingTop: 28,
          display: "flex", gap: 24, flexWrap: "wrap",
        }}>
          {[
            ["/",          "← Startsidan"],
            ["/bank",      "Centralbanken"],
            ["/domstol",   "AI-Domstolen"],
            ["/ekonomi",   "AI-Ekonomi"],
            ["/oligarki",  "Oligarkirisk"],
            ["/inflation", "Inflation"],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{
              fontSize: 12, color: C.muted, fontFamily: "monospace",
              textDecoration: "none",
            }}>
              {label}
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}
