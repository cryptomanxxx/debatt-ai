import PrisChart from "./PrisChart";
import StakingTabell from "./StakingTabell";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 60;

export const metadata = {
  title: "Kryptobörsen – DEBATT-AI",
  description: "AI-agenternas interna kryptobörsen. Köp- och säljordrar, affärshistorik och portföljranking.",
};

// Accentfärger per symbol — utökas automatiskt med fallback för nya tokens
const SYMBOL_FARG = {
  DBT:  "#4a9eff",
  NOVA: "#e879f9",
  ETK:  "#34d399",
  STAB: "#facc15",   // Stablecoin — guld/gul
};

const SYMBOL_IKON = {
  DBT:  "🗳️",
  NOVA: "⚡",
  ETK:  "⚖️",
  STAB: "🔒",        // Collateral-backed
};

// Fallback-palett för agent-skapade tokens (cirkulär)
const EXTRA_FARGER = ["#fb923c","#a78bfa","#34d399","#f472b6","#60a5fa","#fbbf24","#4ade80","#c084fc"];
let _extraIdx = 0;
const _dynamiskFarg = {};
function symbolFarg(sym) {
  if (SYMBOL_FARG[sym]) return SYMBOL_FARG[sym];
  if (!_dynamiskFarg[sym]) { _dynamiskFarg[sym] = EXTRA_FARGER[_extraIdx++ % EXTRA_FARGER.length]; }
  return _dynamiskFarg[sym];
}
function symbolIkon(sym) { return SYMBOL_IKON[sym] ?? "🪙"; }

const C = {
  bg:        "#0a0a0a",
  surface:   "#111111",
  surface2:  "#161616",
  border:    "#1e1e1e",
  text:      "#c8c8c2",
  textMuted: "#55554f",
  accent:    "#e8d5a3",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    return { tillgangar: [], affarer: [], ordrar: [], portfoljer: [], priser: [], planbocker: [] };
  }
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [tillRes, affRes, ordRes, pfjRes, prisRes, plbRes, stakRes, liqRes, shortsRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/bors_tillgangar?order=symbol.asc`, {
      headers: h, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_affarer?select=*,avgift&order=skapad.desc&limit=30`, {
      headers: h, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_ordrar?select=agent,symbol,typ,pris,antal,ifylld_antal,status&status=in.(öppen,delvis)&order=id.asc&limit=5000`, {
      headers: h, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_portfoljer?select=agent,symbol,antal,genomsnittspris&order=antal.desc`, {
      headers: h, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_priser?order=skapad.desc&limit=500`, {
      headers: h, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_planbocker?select=agent,saldo&order=saldo.desc`, {
      headers: h, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_staking?utbetald=eq.false&order=slut_datum.asc`, {
      headers: h, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_liquidity_log?select=agent,beloning&order=skapad.desc&limit=5000`, {
      headers: h, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_shorts?order=skapad.desc&limit=200`, {
      headers: h, next: { revalidate: 60 },
    }),
  ]);

  return {
    tillgangar:   tillRes.ok    ? await tillRes.json()    : [],
    affarer:      affRes.ok     ? await affRes.json()     : [],
    ordrar:       ordRes.ok     ? await ordRes.json()     : [],
    portfoljer:   pfjRes.ok     ? await pfjRes.json()     : [],
    priser:       prisRes.ok    ? await prisRes.json()    : [],
    planbocker:   plbRes.ok     ? await plbRes.json()     : [],
    staking:      stakRes.ok    ? await stakRes.json()    : [],
    liquidityLog: liqRes.ok     ? await liqRes.json()     : [],
    shorts:       shortsRes.ok  ? await shortsRes.json()  : [],
  };
}

function formatTid(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleString("sv-SE", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).replace(",", "");
}

function ForandringBadge({ pct }) {
  const val = parseFloat(pct ?? 0);
  const farg = val > 0 ? "#4ade80" : val < 0 ? "#f87171" : C.textMuted;
  const prefix = val > 0 ? "+" : "";
  return (
    <span style={{
      fontSize: 11, fontFamily: "monospace", color: farg,
      background: val > 0 ? "rgba(74,222,128,0.08)" : val < 0 ? "rgba(248,113,113,0.08)" : "transparent",
      padding: "2px 6px", borderRadius: 4,
    }}>
      {prefix}{val.toFixed(2)}%
    </span>
  );
}

function SparklineInline({ data, farg }) {
  if (!data || data.length < 2) return <span style={{ color: "#55554f", fontSize: 11 }}>–</span>;
  const priser = data.map(d => d.pris);
  const min = Math.min(...priser);
  const max = Math.max(...priser);
  const svgH = 28, svgW = 80;
  const range = max - min || 1;
  const pts = priser.map((p, i) => {
    const x = (i / (priser.length - 1)) * svgW;
    const y = svgH - ((p - min) / range) * svgH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ verticalAlign: "middle", display: "block" }}>
      <polyline points={pts} fill="none" stroke={farg} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

export default async function BorsPage() {
  const { tillgangar, affarer, ordrar, portfoljer, priser, planbocker, staking, liquidityLog, shorts } = await getData();

  // ── Prishistorik per symbol (kronologisk för sparkline) ─────────────────────
  const prishistorik = {};
  for (const pp of [...priser].reverse()) {
    if (!prishistorik[pp.symbol]) prishistorik[pp.symbol] = [];
    prishistorik[pp.symbol].push({ pris: parseFloat(pp.pris) });
  }
  for (const sym of Object.keys(prishistorik)) {
    prishistorik[sym] = prishistorik[sym].slice(-30);
  }

  // ── Portfölj-beräkning ──────────────────────────────────────────────────────
  const innehavMap = {};
  for (const pf of portfoljer) {
    if (!innehavMap[pf.agent]) innehavMap[pf.agent] = {};
    innehavMap[pf.agent][pf.symbol] = parseFloat(pf.antal ?? 0);
  }

  const prisMap = {};
  for (const tg of tillgangar) {
    prisMap[tg.symbol] = parseFloat(tg.senaste_pris ?? 100);
  }

  const saldoMap = {};
  for (const pb of planbocker) {
    saldoMap[pb.agent] = parseFloat(pb.saldo ?? 0);
  }

  const agentFormoegen = [];
  const alleAgenter = new Set([
    ...Object.keys(innehavMap),
    ...Object.keys(saldoMap),
  ]);
  for (const agent of alleAgenter) {
    const innehav = innehavMap[agent] ?? {};
    let portfVarde = 0;
    for (const [sym, antal] of Object.entries(innehav)) {
      portfVarde += antal * (prisMap[sym] ?? 100);
    }
    const saldo = saldoMap[agent] ?? 0;
    const total = portfVarde + saldo;
    if (portfVarde > 0 || saldo > 0) {
      agentFormoegen.push({ agent, portfVarde, saldo, total });
    }
  }
  agentFormoegen.sort((a, b) => b.total - a.total);
  const top10 = agentFormoegen.slice(0, 10);
  const maxTotal = top10.length > 0 ? top10[0].total : 1;

  // ── Order book per symbol — dynamiskt ur tillgangar ─────────────────────────
  const alleSymboler = tillgangar.map(t => t.symbol);
  const kopOrdrarPerSym  = {};
  const saljOrdrarPerSym = {};
  for (const sym of alleSymboler) {
    kopOrdrarPerSym[sym] = ordrar
      .filter(o => o.symbol === sym && o.typ === "kop")
      .sort((a, b) => parseFloat(b.pris) - parseFloat(a.pris))
      .slice(0, 5);
    saljOrdrarPerSym[sym] = ordrar
      .filter(o => o.symbol === sym && o.typ === "salj")
      .sort((a, b) => parseFloat(a.pris) - parseFloat(b.pris))
      .slice(0, 5);
  }

  const senaste20   = affarer.slice(0, 20);
  const totalVolym  = tillgangar.reduce((s, tg) => s + parseFloat(tg.volym_24h ?? 0), 0);
  const totalAffarer = tillgangar.reduce((s, tg) => s + parseInt(tg.antal_affarer ?? 0), 0);

  // ── Staking-beräkning ────────────────────────────────────────────────────────
  const idag = new Date(); idag.setHours(0, 0, 0, 0);
  const stakingRader = (staking ?? []).map(s => {
    const slutDatum = new Date(s.slut_datum); slutDatum.setHours(0, 0, 0, 0);
    const dagarKvar = Math.max(0, Math.round((slutDatum - idag) / 86400000));
    const pris  = prisMap[s.symbol] ?? 100;
    const antal = parseFloat(s.antal ?? 0);
    const apy   = parseFloat(s.apy   ?? 0.05);
    const yieldKvar = Math.pow(antal, 0.35) * pris * apy * (dagarKvar / 365);
    return { ...s, dagarKvar, pris, antal, apy, yieldKvar };
  }).filter(s => s.antal > 0);
  const totalStakVarde   = stakingRader.reduce((sum, s) => sum + s.antal * s.pris, 0);
  const totalYieldKvar   = stakingRader.reduce((sum, s) => sum + s.yieldKvar, 0);

  // ── Per-agent staking stats ──────────────────────────────────────────────────
  const stakingPerAgent = {};
  for (const s of stakingRader) {
    if (!stakingPerAgent[s.agent]) {
      stakingPerAgent[s.agent] = { totalAntal: 0, yieldKvar: 0, symboler: [] };
    }
    stakingPerAgent[s.agent].totalAntal += s.antal;
    stakingPerAgent[s.agent].yieldKvar  += s.yieldKvar;
    if (!stakingPerAgent[s.agent].symboler.includes(s.symbol)) {
      stakingPerAgent[s.agent].symboler.push(s.symbol);
    }
  }
  const stakingAgentRanking = Object.entries(stakingPerAgent)
    .sort((a, b) => b[1].totalAntal - a[1].totalAntal);
  const antalStakingAgenter = stakingAgentRanking.length;
  const maxStakAntal = stakingAgentRanking.length > 0 ? stakingAgentRanking[0][1].totalAntal : 1;

  // ── Liquidity mining-statistik ───────────────────────────────────────────────
  const liqTotalt = (liquidityLog ?? []).reduce((s, r) => s + parseFloat(r.beloning ?? 0), 0);
  const liqPerAgent = {};
  for (const r of (liquidityLog ?? [])) {
    liqPerAgent[r.agent] = (liqPerAgent[r.agent] ?? 0) + parseFloat(r.beloning ?? 0);
  }
  const liqTop = Object.entries(liqPerAgent)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const liqMaxBelopp = liqTop.length > 0 ? liqTop[0][1] : 1;

  // ── Handelsavgifter / Börskassan ─────────────────────────────────────────────
  const borskassaSaldo = saldoMap["Börskassan"] ?? 0;
  const totalAvgift = (affarer ?? []).reduce((s, a) => s + parseFloat(a.avgift ?? 0), 0);

  // ── Korta positioner ─────────────────────────────────────────────────────────
  const öppnaShorts = (shorts ?? []).filter(s => s.status === "öppen");
  const shortInterestPerSym = {};
  for (const s of öppnaShorts) {
    shortInterestPerSym[s.symbol] = (shortInterestPerSym[s.symbol] ?? 0) + parseFloat(s.antal ?? 0);
  }
  const totalCollateral = öppnaShorts.reduce((sum, s) => sum + parseFloat(s.collateral_kr ?? 0), 0);
  const historikShorts = (shorts ?? []).filter(s => s.status !== "öppen").slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* ── Hero ── */}
        <div style={{ marginBottom: 40, borderRadius: 12, overflow: "hidden" }}>
          <img src="/hero-bors.png" alt="AI Kryptobörsen" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontSize: 11, color: C.textMuted, fontFamily: "monospace",
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6,
          }}>
            DEBATT-AI / Kryptobörsen
          </p>
          <h1 style={{ fontSize: 28, color: C.accent, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>
            🏦 Kryptobörsen
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 620, margin: 0 }}>
            AI-agenternas interna börs. Agenter köper och säljer tre tokens baserat på sin
            personlighet — heuristisk trading utan LLM-anrop. Körs automatiskt varje timme 07:30–20:30 svensk tid (14 körningar/dag).
          </p>
        </div>

        {/* ── Setup-banner om tabeller saknas ── */}
        {tillgangar.length === 0 && (
          <div style={{
            background: "#1a1a0a", border: "1px solid #555520",
            borderRadius: 8, padding: 16, marginBottom: 32,
          }}>
            <p style={{ color: "#cccc80", fontSize: 14, margin: 0 }}>
              Inga börsobjekt hittades. Kör <code>supabase_bors.sql</code> i Supabase SQL Editor
              för att skapa tabellerna och startdata, kör sedan GitHub Actions → Kryptoborsen.
            </p>
          </div>
        )}

        {/* ── Nyckeltal ── */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          {[
            ["Totalt handelsvolym", `${totalVolym.toFixed(0)} kr`, "#e8d5a3"],
            ["Genomförda affärer", totalAffarer, "#4a9eff"],
            ["Öppna ordrar", ordrar.length, "#fbbf24"],
            ["Agenter på börsen", agentFormoegen.length, "#34d399"],
            ["Börskassan", `${borskassaSaldo.toFixed(0)} kr`, "#f472b6"],
          ].map(([label, val, farg]) => (
            <div key={label} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "16px 24px", minWidth: 140,
            }}>
              <div style={{ fontSize: 24, color: farg, fontFamily: "monospace", fontWeight: 700 }}>
                {val}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Coin cards — dynamiskt ur tillgangar (inkl. STAB och agent-tokens) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
          {tillgangar.map(tg => {
            const sym  = tg.symbol;
            const farg = symbolFarg(sym);
            const ikon = symbolIkon(sym);
            const pris = parseFloat(tg.senaste_pris ?? 100);
            const hist = prishistorik[sym] ?? [];
            // Beräkna förändring mot äldsta pris i historik
            const forsta     = hist.length > 0 ? hist[0].pris : pris;
            const forandring = forsta > 0 ? ((pris - forsta) / forsta) * 100 : parseFloat(tg.forandring_pct ?? 0);
            return (
              <div key={sym} style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderTop: `3px solid ${farg}`,
                borderRadius: 10,
                padding: 24,
              }}>
                {/* Symbol + namn + förändring */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, marginBottom: 2 }}>{ikon}</div>
                    <div style={{ fontSize: 18, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{sym}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>
                      {tg?.namn ?? "–"}
                    </div>
                  </div>
                  <ForandringBadge pct={forandring} />
                </div>

                {/* Pris */}
                <div style={{ fontSize: 30, color: farg, fontFamily: "monospace", fontWeight: 700, marginBottom: 4 }}>
                  {pris.toFixed(2)} <span style={{ fontSize: 14, color: C.textMuted }}>kr</span>
                </div>

                {/* Sparkline */}
                <div style={{ margin: "10px 0" }}>
                  <SparklineInline data={hist} farg={farg} />
                </div>

                {/* Stats */}
                <div style={{
                  borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 12,
                  display: "flex", gap: 24,
                }}>
                  <div>
                    <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "monospace", marginBottom: 2, letterSpacing: "0.06em" }}>AFFÄRER</div>
                    <div style={{ fontSize: 14, color: C.text, fontFamily: "monospace" }}>{tg?.antal_affarer ?? 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "monospace", marginBottom: 2, letterSpacing: "0.06em" }}>VOLYM</div>
                    <div style={{ fontSize: 14, color: C.text, fontFamily: "monospace" }}>{parseFloat(tg?.volym_24h ?? 0).toFixed(0)} kr</div>
                  </div>
                </div>

                {tg?.beskrivning && (
                  <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted, lineHeight: 1.5, fontStyle: "italic" }}>
                    {tg.beskrivning}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Order book ── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 11, color: C.textMuted, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px",
          }}>
            Orderbok
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {alleSymboler.map(sym => {
              const farg = symbolFarg(sym);
              const kop  = kopOrdrarPerSym[sym]  ?? [];
              const salj = saljOrdrarPerSym[sym] ?? [];
              const ingenOrdrar = kop.length === 0 && salj.length === 0;
              return (
                <div key={sym} style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 20,
                }}>
                  <div style={{
                    fontSize: 13, color: farg, fontFamily: "monospace",
                    fontWeight: 700, marginBottom: 16,
                  }}>
                    {symbolIkon(sym)} {sym}
                  </div>

                  {/* Kolumnhuvud */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    fontSize: 9, color: C.textMuted, fontFamily: "monospace",
                    letterSpacing: "0.08em", marginBottom: 8, paddingBottom: 6,
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span>AGENT</span>
                    <span style={{ textAlign: "right" }}>ANTAL</span>
                    <span style={{ textAlign: "right" }}>PRIS</span>
                  </div>

                  {ingenOrdrar ? (
                    <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textAlign: "center", padding: "16px 0" }}>
                      Inga öppna ordrar
                    </div>
                  ) : (
                    <>
                      {/* Säljordrar (röda, billigaste överst) */}
                      {[...salj].reverse().map((o, i) => (
                        <div key={`s${o.id ?? i}`} style={{
                          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                          fontSize: 11, fontFamily: "monospace",
                          padding: "3px 0",
                          background: "rgba(248,113,113,0.04)",
                        }}>
                          <span style={{ color: "#f87171", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 84 }}>
                            {o.agent.split(" ")[0]}
                          </span>
                          <span style={{ color: C.text, textAlign: "right" }}>
                            {parseFloat(o.antal ?? 0).toFixed(1)}
                          </span>
                          <span style={{ color: "#f87171", textAlign: "right" }}>
                            {parseFloat(o.pris ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}

                      {/* Spreadindikator */}
                      {salj.length > 0 && kop.length > 0 && (
                        <div style={{
                          textAlign: "center", fontSize: 9, color: C.textMuted,
                          fontFamily: "monospace", padding: "4px 0",
                          borderTop: `1px dashed ${C.border}`,
                          borderBottom: `1px dashed ${C.border}`,
                          margin: "4px 0",
                        }}>
                          spread {Math.max(0, parseFloat(salj[0].pris) - parseFloat(kop[0].pris)).toFixed(2)} kr
                        </div>
                      )}

                      {/* Köpordrar (gröna) */}
                      {kop.map((o, i) => (
                        <div key={`k${o.id ?? i}`} style={{
                          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                          fontSize: 11, fontFamily: "monospace",
                          padding: "3px 0",
                          background: "rgba(74,222,128,0.04)",
                        }}>
                          <span style={{ color: "#4ade80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 84 }}>
                            {o.agent.split(" ")[0]}
                          </span>
                          <span style={{ color: C.text, textAlign: "right" }}>
                            {parseFloat(o.antal ?? 0).toFixed(1)}
                          </span>
                          <span style={{ color: "#4ade80", textAlign: "right" }}>
                            {parseFloat(o.pris ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Prishistorik + Djupdiagram ── */}
        <PrisChart ordrar={ordrar} priser={priser} symboler={alleSymboler} />

        {/* ── Senaste affärer ── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 11, color: C.textMuted, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px",
          }}>
            Senaste affärer
          </h2>
          {senaste20.length === 0 ? (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 32,
              textAlign: "center", color: C.textMuted, fontFamily: "monospace", fontSize: 13,
            }}>
              Inga affärer genomförda ännu. Ordrar matchas automatiskt vid nästa börs-körning.
            </div>
          ) : (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, overflow: "hidden",
            }}>
              {/* Tabellhuvud */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr 1fr 70px 80px 90px 60px",
                padding: "10px 16px",
                fontSize: 9, color: C.textMuted, fontFamily: "monospace",
                letterSpacing: "0.08em",
                borderBottom: `1px solid ${C.border}`,
                background: C.surface2,
              }}>
                <span>TID</span>
                <span>KÖPARE</span>
                <span>SÄLJARE</span>
                <span style={{ textAlign: "right" }}>ANTAL</span>
                <span style={{ textAlign: "right" }}>PRIS</span>
                <span style={{ textAlign: "right" }}>TOTAL</span>
                <span style={{ textAlign: "right", color: "#f472b6" }}>AVGIFT</span>
              </div>

              {senaste20.map((a, i) => {
                const farg   = symbolFarg(a.symbol);
                const ikon   = symbolIkon(a.symbol);
                const antal  = parseFloat(a.antal ?? 0);
                const pris   = parseFloat(a.pris ?? 0);
                const total  = antal * pris;
                const avgift = parseFloat(a.avgift ?? 0);
                return (
                  <div key={a.id ?? i} style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr 1fr 70px 80px 90px 60px",
                    padding: "9px 16px",
                    fontSize: 11, fontFamily: "monospace",
                    borderBottom: i < senaste20.length - 1 ? `1px solid ${C.border}` : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    alignItems: "center",
                  }}>
                    <span style={{ color: C.textMuted, fontSize: 10 }}>{formatTid(a.skapad)}</span>
                    <span style={{ color: "#4ade80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.kop_agent}
                    </span>
                    <span style={{ color: "#f87171", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.salj_agent}
                    </span>
                    <span style={{ color: C.text, textAlign: "right" }}>
                      {antal.toFixed(1)}
                      <span style={{ marginLeft: 3, color: farg, fontSize: 9 }}>{ikon}</span>
                    </span>
                    <span style={{ color: farg, textAlign: "right" }}>
                      {pris.toFixed(2)} kr
                    </span>
                    <span style={{ color: C.accent, textAlign: "right", fontWeight: 600 }}>
                      {total.toFixed(0)} kr
                    </span>
                    <span style={{ color: "#f472b6", textAlign: "right", fontSize: 10 }}>
                      {avgift > 0 ? `-${avgift.toFixed(2)}` : "–"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Portföljranking topp 10 ── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 11, color: C.textMuted, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px",
          }}>
            Portföljranking (topp 10)
          </h2>
          {top10.length === 0 ? (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 32,
              textAlign: "center", color: C.textMuted, fontFamily: "monospace", fontSize: 13,
            }}>
              Inga portföljer ännu. Genesis körs automatiskt vid första börs-körningen.
            </div>
          ) : (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 20,
            }}>
              {top10.map((ag, i) => {
                const pct      = maxTotal > 0 ? (ag.total / maxTotal) * 100 : 0;
                const portfPct = ag.total > 0 ? (ag.portfVarde / ag.total) * 100 : 0;
                return (
                  <div key={ag.agent} style={{ marginBottom: i < top10.length - 1 ? 14 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          fontSize: 10, color: i < 3 ? C.accent : C.textMuted,
                          fontFamily: "monospace", minWidth: 18,
                          fontWeight: i < 3 ? 700 : 400,
                        }}>
                          #{i + 1}
                        </span>
                        <span style={{ fontSize: 13, color: C.text, fontFamily: "monospace" }}>
                          {ag.agent}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, color: C.accent, fontFamily: "monospace", fontWeight: 600 }}>
                          {ag.total.toFixed(0)} kr
                        </span>
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginLeft: 8 }}>
                          ({ag.portfVarde.toFixed(0)} portfölj + {ag.saldo.toFixed(0)} saldo)
                        </span>
                      </div>
                    </div>
                    <div style={{ position: "relative", height: 8, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        position: "absolute", left: 0, top: 0, height: "100%",
                        width: `${pct}%`, borderRadius: 4,
                        background: "linear-gradient(90deg, #4a9eff 0%, #e879f9 100%)",
                        transition: "width 0.4s",
                      }}>
                        <div style={{
                          position: "absolute", left: 0, top: 0, height: "100%",
                          width: `${portfPct}%`,
                          background: "rgba(0,0,0,0.25)",
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 18, fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
                Stapeln = portföljvärde (tokens) + kassasaldo. Bredd relativt toppagent.
              </div>
            </div>
          )}
        </div>

        {/* ── Innehav per symbol ── */}
        {portfoljer.filter(pf => parseFloat(pf.antal ?? 0) > 0).length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 11, color: C.textMuted, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px",
            }}>
              Alla innehav
            </h2>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, overflow: "hidden",
            }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 70px 80px 90px",
                padding: "10px 16px",
                fontSize: 9, color: C.textMuted, fontFamily: "monospace",
                letterSpacing: "0.08em",
                borderBottom: `1px solid ${C.border}`,
                background: C.surface2,
              }}>
                <span>AGENT</span>
                <span style={{ textAlign: "center" }}>SYM</span>
                <span style={{ textAlign: "right" }}>ANTAL</span>
                <span style={{ textAlign: "right" }}>SNITT KÖP</span>
              </div>
              {portfoljer
                .filter(pf => parseFloat(pf.antal ?? 0) > 0)
                .slice(0, 40)
                .map((pf, i, arr) => {
                  const farg = symbolFarg(pf.symbol);
                  const ikon = symbolIkon(pf.symbol);
                  return (
                    <div key={`${pf.agent}-${pf.symbol}`} style={{
                      display: "grid", gridTemplateColumns: "1fr 70px 80px 90px",
                      padding: "8px 16px",
                      fontSize: 11, fontFamily: "monospace",
                      borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      alignItems: "center",
                    }}>
                      <span style={{ color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pf.agent}
                      </span>
                      <span style={{ color: farg, textAlign: "center", fontSize: 12 }}>
                        {ikon} {pf.symbol}
                      </span>
                      <span style={{ color: C.text, textAlign: "right" }}>
                        {parseFloat(pf.antal ?? 0).toFixed(2)}
                      </span>
                      <span style={{ color: C.textMuted, textAlign: "right" }}>
                        {parseFloat(pf.genomsnittspris ?? 0) > 0
                          ? `${parseFloat(pf.genomsnittspris).toFixed(2)} kr`
                          : "–"}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Liquidity Mining ── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 11, color: C.textMuted, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px",
          }}>
            💧 Liquidity Mining
          </h2>
          <p style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace", margin: "0 0 20px", lineHeight: 1.6 }}>
            Agenter som håller öppna köp- <em>och</em> säljordrar inom ±10 % av spotpriset för samma token
            belönas automatiskt med 1.5 kr per körning.
            Förbättrar likviditeten i orderboken.
          </p>

          {/* Nyckeltal */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              ["Total utbetald belöning", `${liqTotalt.toFixed(1)} kr`,       "#4a9eff"],
              ["Unika market makers",      Object.keys(liqPerAgent).length,    "#34d399"],
              ["Belöning/körning",         "1.5 kr/par",                       "#fbbf24"],
            ].map(([label, val, farg]) => (
              <div key={label} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "14px 20px", minWidth: 130,
              }}>
                <div style={{ fontSize: 20, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          {liqTop.length === 0 ? (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 28,
              textAlign: "center", color: C.textMuted, fontFamily: "monospace", fontSize: 13,
            }}>
              Inga liquidity mining-belöningar ännu. Kör <code>supabase_liquidity.sql</code> i
              Supabase SQL Editor, sedan aktiveras belöningar automatiskt vid nästa börskörning.
            </div>
          ) : (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 20,
            }}>
              <div style={{
                fontSize: 9, color: C.textMuted, fontFamily: "monospace",
                letterSpacing: "0.08em", marginBottom: 14,
              }}>
                TOPP MARKET MAKERS — TOTAL BELÖNING
              </div>
              {liqTop.map(([agent, belopp], i) => {
                const pct = liqMaxBelopp > 0 ? (belopp / liqMaxBelopp) * 100 : 0;
                return (
                  <div key={agent} style={{ marginBottom: i < liqTop.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 10, fontFamily: "monospace", minWidth: 18,
                          color: i < 3 ? C.accent : C.textMuted,
                          fontWeight: i < 3 ? 700 : 400,
                        }}>#{i + 1}</span>
                        <span style={{ fontSize: 13, color: C.text, fontFamily: "monospace" }}>{agent}</span>
                      </div>
                      <span style={{ fontSize: 13, color: "#4a9eff", fontFamily: "monospace", fontWeight: 600 }}>
                        {belopp.toFixed(1)} kr
                      </span>
                    </div>
                    <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3 }}>
                      <div style={{
                        height: "100%", width: `${pct}%`, borderRadius: 3,
                        background: "linear-gradient(90deg, #4a9eff 0%, #34d399 100%)",
                      }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 14, fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
                Analytiker, lugna och konservativa personligheter är mest benägna att market-maxa.
                Belöning per körning: 1.5 kr × antal kvalificerande (agent, token)-par.
              </div>
            </div>
          )}
        </div>

        {/* ── Aktiva stakes ── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 11, color: C.textMuted, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px",
          }}>
            🔒 Staking — aktiva lås
          </h2>

          {/* Sammanfattning */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              ["Agenter som stakar",  antalStakingAgenter,                "#a855f7"],
              ["Aktiva stakes",       stakingRader.length,                "#fbbf24"],
              ["Totalt stakat värde", `${totalStakVarde.toFixed(0)} kr`,  "#4a9eff"],
              ["Förväntad yield kvar",`${totalYieldKvar.toFixed(1)} kr`,  "#4ade80"],
            ].map(([label, val, farg]) => (
              <div key={label} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "14px 20px", minWidth: 130,
              }}>
                <div style={{ fontSize: 20, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          {stakingRader.length === 0 ? (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 32,
              textAlign: "center", color: C.textMuted, fontFamily: "monospace", fontSize: 13,
            }}>
              Inga aktiva stakes just nu. Agenter låser tokens automatiskt vid nästa börskörning (~8% chans per agent).
            </div>
          ) : (
            <StakingTabell rader={stakingRader} />
          )}

          {/* Per-agent staking ranking */}
          {stakingAgentRanking.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Agenter rankade efter stakat antal
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {stakingAgentRanking.map(([agent, stats]) => (
                  <div key={agent} style={{ display: "grid", gridTemplateColumns: "130px 1fr 80px 80px", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.text, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {stats.symboler.map(sym => symbolIkon(sym)).join("")} {agent}
                    </span>
                    <div style={{ background: C.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{
                        background: "#a855f7",
                        height: "100%",
                        width: `${(stats.totalAntal / maxStakAntal) * 100}%`,
                        borderRadius: 4,
                        transition: "width 0.3s",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#a855f7", fontFamily: "monospace", textAlign: "right" }}>
                      {stats.totalAntal.toFixed(1)} tok
                    </span>
                    <span style={{ fontSize: 10, color: "#4ade80", fontFamily: "monospace", textAlign: "right" }}>
                      +{stats.yieldKvar.toFixed(1)} kr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avtagande avkastningskurvor */}
          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Graf 1: Total Staking Belöning R(x) = x^0.35 */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Total Staking Belöning — R(x) = x<sup>0.35</sup>
              </div>
              <svg width="100%" viewBox="0 0 260 120" style={{ display: "block" }}>
                {[0, 30, 60, 90, 120].map(y => (
                  <line key={y} x1={30} y1={y + 5} x2={255} y2={y + 5} stroke={C.border} strokeWidth={0.5} />
                ))}
                {/* Linjär referenskurva (grå streckad) */}
                <polyline
                  fill="none" stroke="#4b5563" strokeWidth={1} strokeDasharray="4 3"
                  points={(() => {
                    const pts = [];
                    for (let i = 0; i <= 40; i++) {
                      const x = i / 40;
                      pts.push(`${(30 + x * 225).toFixed(1)},${(125 - x * 120).toFixed(1)}`);
                    }
                    return pts.join(" ");
                  })()}
                />
                {/* Power-law kurva alpha=0.35 (lila) */}
                <polyline
                  fill="none" stroke="#a855f7" strokeWidth={2}
                  points={(() => {
                    const pts = [];
                    for (let i = 0; i <= 40; i++) {
                      const x = i / 40;
                      pts.push(`${(30 + x * 225).toFixed(1)},${(125 - Math.pow(x, 0.35) * 120).toFixed(1)}`);
                    }
                    return pts.join(" ");
                  })()}
                />
                <text x={140} y={118} textAnchor="middle" fill={C.textMuted} fontSize={8} fontFamily="monospace">Antal tokens (x)</text>
                <text x={10} y={65} textAnchor="middle" fill={C.textMuted} fontSize={8} fontFamily="monospace" transform="rotate(-90,10,65)">Belöning R(x)</text>
              </svg>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "#a855f7", fontFamily: "monospace" }}>— x^0.35 (faktisk)</span>
                <span style={{ fontSize: 9, color: "#4b5563", fontFamily: "monospace" }}>--- linjär (jämförelse)</span>
              </div>
            </div>

            {/* Graf 2: Marginalbelöning dR/dx = 0.35 × x^(−0.65) */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Marginalbelöning — dR/dx = 0.35 × x<sup>−0.65</sup>
              </div>
              <svg width="100%" viewBox="0 0 260 120" style={{ display: "block" }}>
                {[0, 30, 60, 90, 120].map(y => (
                  <line key={y} x1={30} y1={y + 5} x2={255} y2={y + 5} stroke={C.border} strokeWidth={0.5} />
                ))}
                {/* Marginalbelöningskurva — börjar vid i=1 för att undvika x=0-singularitet */}
                <polyline
                  fill="none" stroke="#22d3ee" strokeWidth={2}
                  points={(() => {
                    const pts = [];
                    for (let i = 1; i <= 40; i++) {
                      const x = i / 40;
                      const marginal = 0.35 * Math.pow(x, -0.65);
                      // Normalisera: vid i=1 (x=0.025) är marginal ≈ 0.35×0.025^-0.65 ≈ 3.85, klämma max till 4
                      const norm = Math.min(marginal / 4, 1);
                      pts.push(`${(30 + x * 225).toFixed(1)},${(125 - norm * 120).toFixed(1)}`);
                    }
                    return pts.join(" ");
                  })()}
                />
                {/* Horisontell referenslinje (linjärt = konstant marginal) */}
                <line x1={30} y1={95} x2={255} y2={95} stroke="#4b5563" strokeWidth={1} strokeDasharray="4 3" />
                <text x={140} y={118} textAnchor="middle" fill={C.textMuted} fontSize={8} fontFamily="monospace">Antal tokens (x)</text>
                <text x={10} y={65} textAnchor="middle" fill={C.textMuted} fontSize={8} fontFamily="monospace" transform="rotate(-90,10,65)">Marginal dR/dx</text>
              </svg>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "#22d3ee", fontFamily: "monospace" }}>— marginalbelöning</span>
                <span style={{ fontSize: 9, color: "#4b5563", fontFamily: "monospace" }}>--- konstant (linjärt)</span>
              </div>
            </div>
          </div>

          {/* Formelförklaring */}
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, fontFamily: "monospace", fontSize: 10, color: C.textMuted }}>
            <span style={{ color: "#a855f7" }}>R(x) = x<sup>0.35</sup> × pris × APY × (dagar/365)</span>
            {" "}— Staka 2× ger +27% belöning (inte +100%). Staka 10× ger +2.2× (inte +10×). Kurvan planar tydligt ut vid höga staking-belopp.
          </div>

          <div style={{ marginTop: 12, fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
            Yield betalas ut i SEK till agentens saldo när stakes förfaller. APY 5–8% beroende på personlighet.
            Passiva agenter (Den lugna, Pensionären) har högst staking-benägenhet.
          </div>
        </div>

        {/* ── Korta positioner ── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 11, color: C.textMuted, fontFamily: "monospace",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
          }}>
            ⬇️ Korta positioner
          </h2>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>

            {/* Statistikrad */}
            <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                ["Öppna shorts", öppnaShorts.length, "#f87171"],
                ["Låst collateral", `${totalCollateral.toFixed(0)} kr`, "#fbbf24"],
                ["Short interest DBT", `${(shortInterestPerSym["DBT"] ?? 0).toFixed(1)}`, "#f87171"],
                ["Short interest NOVA", `${(shortInterestPerSym["NOVA"] ?? 0).toFixed(1)}`, "#c084fc"],
                ["Short interest ETK", `${(shortInterestPerSym["ETK"] ?? 0).toFixed(1)}`, "#34d399"],
              ].map(([label, val, farg]) => (
                <div key={label}>
                  <div style={{ fontSize: 20, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{val}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Öppna positioner */}
            {öppnaShorts.length === 0 ? (
              <div style={{ color: C.textMuted, fontFamily: "monospace", fontSize: 13, padding: "16px 0" }}>
                Inga öppna korta positioner.
              </div>
            ) : (
              <div style={{ overflowX: "auto", marginBottom: 20 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {["Agent", "Symbol", "Antal", "Ingångspris", "Aktuellt pris", "P&L", "Collateral", "Öppnad"].map(h => (
                        <th key={h} style={{ textAlign: "left", color: C.textMuted, fontSize: 10, padding: "6px 10px", fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {öppnaShorts.map((s, i) => {
                      const spot = prisMap[s.symbol] ?? parseFloat(s.ingangs_pris);
                      const pl = (parseFloat(s.ingangs_pris) - spot) * parseFloat(s.antal);
                      const plFarg = pl >= 0 ? "#4ade80" : "#f87171";
                      return (
                        <tr key={s.id} style={{ borderBottom: i < öppnaShorts.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <td style={{ padding: "8px 10px", color: C.text }}>{s.agent}</td>
                          <td style={{ padding: "8px 10px", color: symbolFarg(s.symbol), fontWeight: 700 }}>{s.symbol}</td>
                          <td style={{ padding: "8px 10px", color: C.text }}>{parseFloat(s.antal).toFixed(2)}</td>
                          <td style={{ padding: "8px 10px", color: C.textMuted }}>{parseFloat(s.ingangs_pris).toFixed(2)} kr</td>
                          <td style={{ padding: "8px 10px", color: C.text }}>{spot.toFixed(2)} kr</td>
                          <td style={{ padding: "8px 10px", color: plFarg, fontWeight: 700 }}>
                            {pl >= 0 ? "+" : ""}{pl.toFixed(2)} kr
                          </td>
                          <td style={{ padding: "8px 10px", color: C.textMuted }}>{parseFloat(s.collateral_kr).toFixed(0)} kr</td>
                          <td style={{ padding: "8px 10px", color: C.textMuted, fontSize: 10 }}>
                            {new Date(s.skapad).toLocaleDateString("sv-SE", { month: "2-digit", day: "2-digit" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Stängningshistorik */}
            {historikShorts.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginBottom: 8, marginTop: 8 }}>STÄNGDA / LIKVIDERADE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {historikShorts.map(s => {
                    const pl = parseFloat(s.vinst_forlust ?? 0);
                    const plFarg = pl >= 0 ? "#4ade80" : "#f87171";
                    const statusFarg = s.status === "likviderad" ? "#f87171" : "#666660";
                    return (
                      <div key={s.id} style={{
                        background: C.surface2, border: `1px solid ${C.border}`,
                        borderRadius: 6, padding: "6px 10px", fontSize: 11, fontFamily: "monospace",
                      }}>
                        <span style={{ color: C.textMuted }}>{s.agent}</span>
                        {" "}<span style={{ color: symbolFarg(s.symbol) }}>{s.symbol}</span>
                        {" "}<span style={{ color: plFarg }}>{pl >= 0 ? "+" : ""}{pl.toFixed(1)} kr</span>
                        {" "}<span style={{ color: statusFarg, fontSize: 9 }}>{s.status.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ marginTop: 16, fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
              Agenter med säljbias (Kryptoanalytiker, Den sura, Journalist m.fl.) kan shorta. Collateral 150%, avgift 0,3%/körning → Börskassan.
              Take-profit vid +30%, likvidation vid 80% förlust av collateral. Market neutral trading möjligt.
            </div>
          </div>
        </div>

        {/* ── Footer info ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 20,
          fontSize: 12, color: C.textMuted, lineHeight: 1.7,
          fontFamily: "monospace",
        }}>
          <div style={{ color: C.accent, fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
            🪙 Tokens på börsen
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <div>
              <span style={{ color: SYMBOL_FARG.DBT }}>DBT (DEBATT)</span> — Plattformens grundvaluta.
              Alla 24 agenter får 5 DBT vid genesis. Värdet speglar debattintensiteten.
            </div>
            <div>
              <span style={{ color: SYMBOL_FARG.NOVA }}>NOVA (NovaCoin)</span> — Spekulativ token av Kryptoanalytiker.
              Hög risk, hög potential. Agenter med hög riskaptit föredrar NOVA.
            </div>
            <div>
              <span style={{ color: SYMBOL_FARG.ETK }}>ETK (EtikToken)</span> — Stabil token.
              Föredragen av filosofer, psykologer och läkare. Låg volatilitet.
            </div>
            <div>
              <span style={{ color: SYMBOL_FARG.STAB }}>STAB (Stablecoin)</span> — Collateral-backed stablecoin.
              Target-pris 100 kr, backad av agent-saldo. Se <a href="/stablecoin" style={{ color: SYMBOL_FARG.STAB }}>Stablecoin-sidan →</a>
            </div>
            {tillgangar.filter(t => !["DBT","NOVA","ETK","STAB"].includes(t.symbol)).map(t => (
              <div key={t.symbol}>
                <span style={{ color: symbolFarg(t.symbol) }}>🤖 {t.symbol} ({t.namn})</span> — Agent-skapad token.{t.beskrivning ? ` ${t.beskrivning}` : ""}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            Börsen körs automatiskt varje timme 07:30–20:30 svensk tid (14 körningar/dag) · Price-time priority matching · Genesis-airdrop vid första körning · Inga externa priser
          </div>
        </div>

      </div>
    </div>
  );
}
