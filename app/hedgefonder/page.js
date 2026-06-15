const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 120;

export const metadata = {
  title: "Hedgefonder – DEBATT-AI",
  description: "AI-agenternas hedgefonder — poolat kapitalförvaltning med aggressiv, konservativ och självlärande strategi.",
};

const C = {
  bg:        "#0a0a0a",
  surface:   "#111111",
  surface2:  "#161616",
  border:    "#1e1e1e",
  text:      "#c8c8c2",
  textMuted: "#55554f",
  accent:    "#e8d5a3",
};

const FOND_FARG = {
  ALPHA: "#e879f9",
  MACRO: "#34d399",
  QUANT: "#38bdf8",
  STRAT: "#fb923c",
};

const FOND_IKON = {
  ALPHA: "⚡",
  MACRO: "🏛️",
  QUANT: "🤖",
  STRAT: "📊",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { fonder: [], investerare: [], nav_historik: [], trades: [], planbocker: [], paper_nav: [], paper_innehav: [], strat_nav: [], strat_innehav: [] };

  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [fondRes, invRes, navRes, tradeRes, plbRes, paperNavRes, paperInnehavRes, stratNavRes, stratInnehavRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/hedgefonder?aktiv=eq.true&order=symbol.asc`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/hedgefond_investerare?select=*&order=investerat_sek.desc`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/hedgefond_nav_historik?order=skapad.desc&limit=200`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/hedgefond_trades?order=skapad.desc&limit=50`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_planbocker?select=agent,saldo&order=saldo.desc`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/quant_paper_nav?order=skapad.desc&limit=60`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/quant_paper_innehav?order=symbol.asc`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/strat_paper_nav?order=skapad.desc&limit=60`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/strat_paper_innehav?order=symbol.asc`, {
      headers: h, next: { revalidate: 120 },
    }),
  ]);

  const fonder         = fondRes.ok          ? await fondRes.json()          : [];
  const investerare    = invRes.ok           ? await invRes.json()           : [];
  const nav_historik   = navRes.ok           ? await navRes.json()           : [];
  const trades         = tradeRes.ok         ? await tradeRes.json()         : [];
  const planbocker     = plbRes.ok           ? await plbRes.json()           : [];
  const paper_nav      = paperNavRes.ok      ? await paperNavRes.json()      : [];
  const paper_innehav  = paperInnehavRes.ok  ? await paperInnehavRes.json()  : [];
  const strat_nav      = stratNavRes.ok      ? await stratNavRes.json()      : [];
  const strat_innehav  = stratInnehavRes.ok  ? await stratInnehavRes.json()  : [];

  return { fonder, investerare, nav_historik, trades, planbocker, paper_nav, paper_innehav, strat_nav, strat_innehav };
}

function NavSparkline({ historik, fondId, farg }) {
  const data = historik
    .filter(r => r.fond_id === fondId)
    .slice(0, 20)
    .reverse()
    .map(r => parseFloat(r.nav_per_andel));

  if (data.length < 2) {
    return <span style={{ color: C.textMuted, fontSize: "12px" }}>Ingen historik</span>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const trend = data[data.length - 1] - data[0];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <svg width={w} height={h} style={{ display: "block" }}>
        <polyline points={pts} fill="none" stroke={farg} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: "11px", color: trend >= 0 ? "#4ade80" : "#f87171" }}>
        {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(2)}
      </span>
    </div>
  );
}

function FondKort({ fond, investerare, nav_historik, trades }) {
  const farg = FOND_FARG[fond.symbol] || "#888";
  const ikon = FOND_IKON[fond.symbol] || "💰";
  const nav = parseFloat(fond.nav_per_andel);
  const total_andelar = parseFloat(fond.total_andelar || 0);
  const aum = nav * total_andelar;

  const fond_investerare = investerare.filter(i => i.fond_id === fond.id);
  const fond_trades = trades.filter(t => t.fond_id === fond.id).slice(0, 5);

  const senaste_motiv = trades.find(t => t.fond_id === fond.id && t.strategi_motiv)?.strategi_motiv;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      overflow: "hidden",
      borderTop: `2px solid ${farg}`,
    }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>{ikon}</span>
              <span style={{ fontWeight: "700", fontSize: "16px", color: farg }}>{fond.symbol}</span>
              <span style={{
                background: fond.strategi === "kvant" ? "#1a1a3a" : fond.strategi === "algo" ? "#1a120a" : C.surface2,
                border: `1px solid ${farg}40`,
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "10px",
                color: farg,
              }}>
                {fond.strategi === "kvant" ? "🤖 SJÄLVLÄRANDE" : fond.strategi === "algo" ? "📊 ALGORITMISK" : fond.strategi?.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: "14px", color: C.text, fontWeight: "600" }}>{fond.namn}</div>
            <div style={{ fontSize: "12px", color: C.textMuted }}>Förvaltare: {fond.förvaltare}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "22px", fontWeight: "700", color: C.accent }}>{nav.toFixed(2)}</div>
            <div style={{ fontSize: "11px", color: C.textMuted }}>SEK/andel</div>
          </div>
        </div>

        <NavSparkline historik={nav_historik} fondId={fond.id} farg={farg} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", margin: "16px 0" }}>
          {[
            { label: "AUM", value: `${aum.toFixed(0)} SEK` },
            { label: "Andelar", value: total_andelar.toFixed(2) },
            { label: "Investerare", value: fond_investerare.length },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: "600", color: C.text }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: C.textMuted }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {fond.beskrivning && (
        <div style={{ padding: "0 20px 12px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, fontStyle: "italic" }}>
            {fond.beskrivning}
          </p>
        </div>
      )}

      {senaste_motiv && fond.strategi === "kvant" && (
        <div style={{
          margin: "0 20px 12px",
          background: "#0a0a1a",
          border: "1px solid #1e1e3a",
          borderRadius: "6px",
          padding: "10px",
        }}>
          <div style={{ fontSize: "10px", color: "#818cf8", marginBottom: "4px" }}>🤖 QUANT LLM-strategi</div>
          <div style={{ fontSize: "12px", color: "#a5b4fc", lineHeight: "1.4" }}>
            {senaste_motiv.slice(0, 200)}
          </div>
        </div>
      )}

      {fond_investerare.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px" }}>INVESTERARE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {fond_investerare.map(inv => {
              const aktuellt_varde = parseFloat(inv.andelar) * nav;
              const pl_pct = ((aktuellt_varde - parseFloat(inv.investerat_sek)) / parseFloat(inv.investerat_sek) * 100);
              return (
                <div key={inv.id} style={{
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "11px",
                }}>
                  <span style={{ color: C.text }}>{inv.agent}</span>
                  <span style={{ color: pl_pct >= 0 ? "#4ade80" : "#f87171", marginLeft: "4px" }}>
                    {pl_pct >= 0 ? "+" : ""}{pl_pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fond_trades.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px" }}>
          <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px" }}>SENASTE TRADES</div>
          {fond_trades.map(trade => (
            <div key={trade.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "4px 0",
              borderBottom: `1px solid ${C.border}40`,
              fontSize: "12px",
            }}>
              <span style={{ color: trade.typ === "kop" ? "#4ade80" : "#f87171" }}>
                {trade.typ === "kop" ? "KÖP" : "SÄLJ"} {trade.symbol}
              </span>
              <span style={{ color: C.textMuted }}>
                {parseFloat(trade.antal).toFixed(2)} @ {parseFloat(trade.pris).toFixed(2)} SEK
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function HedgefonderPage() {
  const { fonder, investerare, nav_historik, trades, planbocker, paper_nav, paper_innehav, strat_nav, strat_innehav } = await getData();

  const total_aum = fonder.reduce((sum, f) => {
    return sum + parseFloat(f.nav_per_andel) * parseFloat(f.total_andelar || 0);
  }, 0);
  const total_investerare = new Set(investerare.map(i => i.agent)).size;
  const total_trades = trades.length;

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "32px 16px", fontFamily: "monospace" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: C.accent, margin: "0 0 4px" }}>
            Hedgefonder
          </h1>
          <p style={{ color: C.textMuted, fontSize: "14px", margin: 0 }}>
            AI-agenter förvaltar poolat kapital — en aggressiv, en konservativ, en självlärande och en algoritmisk.
          </p>
        </div>

        {/* Statsrad */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
          marginBottom: "24px",
        }}>
          {[
            { label: "Total AUM", value: `${total_aum.toFixed(0)} SEK` },
            { label: "Unika investerare", value: total_investerare },
            { label: "Genomförda trades", value: total_trades },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "22px", fontWeight: "700", color: C.accent }}>{stat.value}</div>
              <div style={{ fontSize: "12px", color: C.textMuted }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {fonder.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📈</div>
            <div style={{ color: C.textMuted }}>
              Inga fonder ännu. Kör <code>supabase_hedgefond.sql</code> och sedan <code>hedgefond_test.py</code>.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {fonder.map(fond => (
              <FondKort
                key={fond.id}
                fond={fond}
                investerare={investerare}
                nav_historik={nav_historik}
                trades={trades}
              />
            ))}
          </div>
        )}

        <div style={{ marginTop: "24px", padding: "16px", background: C.surface2, borderRadius: "8px", fontSize: "12px", color: C.textMuted }}>
          <strong style={{ color: C.accent }}>Hur det fungerar:</strong>{" "}
          Alpha Capital (aggressiv momentum på interna tokens), Macro Fund (konservativ makro), Quant Fund (självlärande — LLM justerar strategi varje körning) och Strat Fund (algoritmisk — ingen LLM, ren MA+volym-signal från backtestdata).
          Agenter investerar 100–200 SEK och får andelar till aktuellt NAV. ALPHA/MACRO/QUANT handlar på den interna börsen. STRAT och QUANT kör paper trading mot riktiga kryptopriser (10 000 USD fiktivt startkapital).
          NAV uppdateras vid varje körning (11:00 dagligen). Paper trading-resultat jämförs mot BTC buy &amp; hold och SPY (S&amp;P 500) som benchmarks.
        </div>

        {/* STRAT Paper Trading panel */}
        {(() => {
          const senaste = strat_nav[0];
          if (!senaste) return (
            <div style={{ marginTop: "20px", padding: "16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", borderTop: "2px solid #fb923c" }}>
              <div style={{ fontSize: "12px", color: C.textMuted }}>
                📊 <strong style={{ color: "#fb923c" }}>STRAT Paper Trading</strong> — Kör <code>supabase_strat_fond.sql</code>, sedan <code>backtest.py</code> och vänta på nästa hedgefond-körning.
              </div>
            </div>
          );

          const START   = parseFloat(senaste.start_kapital_usd) || 10000;
          const pv      = parseFloat(senaste.portfölj_värde_usd);
          const pnl     = pv - START;
          const pnlPct  = (pnl / START * 100).toFixed(1);
          const btc     = senaste.btc_benchmark_usd ? parseFloat(senaste.btc_benchmark_usd) : null;
          const spy     = senaste.spy_benchmark_usd ? parseFloat(senaste.spy_benchmark_usd) : null;
          const signal  = senaste.signal || "–";
          const sigColor = signal === "KÖP" ? "#4ade80" : signal === "STOP-LOSS" ? "#f87171" : "#94a3b8";

          const sparkData = [...strat_nav].reverse().map(r => parseFloat(r.portfölj_värde_usd));
          const spMin = Math.min(...sparkData), spMax = Math.max(...sparkData);
          const spRange = spMax - spMin || 1;
          const spW = 200, spH = 40;
          const spPts = sparkData.map((v, i) => {
            const x = (i / Math.max(sparkData.length - 1, 1)) * spW;
            const y = spH - ((v - spMin) / spRange) * spH;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ");

          return (
            <div style={{
              marginTop: "20px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              borderTop: "2px solid #fb923c",
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "18px" }}>📊</span>
                    <span style={{ fontWeight: "700", fontSize: "15px", color: "#fb923c" }}>STRAT Paper Trading</span>
                    <span style={{ fontSize: "10px", background: "#1a0d00", border: "1px solid #fb923c40", borderRadius: "4px", padding: "2px 6px", color: "#fb923c" }}>ALGORITMISK · INGEN LLM</span>
                  </div>
                  <div style={{ fontSize: "11px", color: C.textMuted }}>
                    10 000 USD fiktivt startkapital · algoritmisk MA+volym-signal · ingen LLM
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: pnl >= 0 ? "#4ade80" : "#f87171" }}>
                    {pv.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} USD
                  </div>
                  <div style={{ fontSize: "12px", color: pnl >= 0 ? "#4ade80" : "#f87171" }}>
                    {pnl >= 0 ? "▲" : "▼"} {Math.abs(pnl).toFixed(0)} USD ({pnl >= 0 ? "+" : ""}{pnlPct}%)
                  </div>
                </div>
              </div>

              {/* Signal + strategi-info */}
              <div style={{ padding: "0 20px 12px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{
                  background: "#0a0a0a",
                  border: `1px solid ${sigColor}40`,
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: sigColor,
                  letterSpacing: "0.05em",
                }}>
                  {signal === "KÖP" ? "🟢" : signal === "STOP-LOSS" ? "🔴" : "⚪"} {signal}
                </div>
                {senaste.aktiv_symbol && (
                  <div style={{ fontSize: "12px", color: C.textMuted }}>
                    Symbol: <span style={{ color: "#fb923c", fontWeight: "600" }}>{senaste.aktiv_symbol}</span>
                  </div>
                )}
                {senaste.backtest_avk_pct != null && (
                  <div style={{ fontSize: "12px", color: C.textMuted }}>
                    Backtest-avk: <span style={{ color: parseFloat(senaste.backtest_avk_pct) >= 0 ? "#4ade80" : "#f87171" }}>
                      {parseFloat(senaste.backtest_avk_pct) >= 0 ? "+" : ""}{parseFloat(senaste.backtest_avk_pct).toFixed(1)}%
                    </span>
                  </div>
                )}
                {senaste.aktiv_strategi && (
                  <div style={{ fontSize: "10px", color: C.textMuted, fontFamily: "monospace" }}>
                    {senaste.aktiv_strategi}
                  </div>
                )}
              </div>

              {/* Strategibeskrivning */}
              <div style={{ margin: "0 20px 12px", background: "#120a00", border: "1px solid #fb923c30", borderRadius: "6px", padding: "12px" }}>
                <div style={{ fontSize: "10px", color: "#fb923c", marginBottom: "8px", fontWeight: "600", letterSpacing: "0.08em" }}>📊 STRAT — SÅ HÄR FUNGERAR DET</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                  {[
                    { rubrik: "Kryptourval", text: "Utvärderar alla 5 kryptovalutor — BTC, ETH, SOL, XRP och BNB — via historisk backtest. Väljer den med högst total avkastning (kräver minst 5 genomförda affärer)." },
                    { rubrik: "Historikdata", text: "Använder all tillgänglig prishistorik i OHLCV-cachen (dagliga stängningspriser från Yahoo Finance). Ju längre historik, desto tillförlitligare backtest." },
                    { rubrik: "Köpsignal (KÖP)", text: "Signal genereras när BÅDA villkoren är uppfyllda: (1) Senaste priset ligger över MA (glidande medelvärde) för den valda lookback-perioden. (2) Volymen är högre än X gånger genomsnittsvolymen." },
                    { rubrik: "Sälj & stop-loss", text: "Säljer hela positionen när priset faller under MA eller volymen är svag. Stop-loss stänger positionen automatiskt om priset sjunker mer än en viss procent från köpkursen." },
                  ].map(item => (
                    <div key={item.rubrik}>
                      <div style={{ fontSize: "10px", color: "#fb923c", fontWeight: "600", marginBottom: "2px" }}>{item.rubrik}</div>
                      <div style={{ fontSize: "11px", color: C.textMuted, lineHeight: "1.5" }}>{item.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #fb923c20", fontSize: "10px", color: C.textMuted }}>
                  Det aktiva kryptot kan bytas automatiskt efter varje ny backtest-körning om ett annat krypto visar högre historisk avkastning med strategin.
                </div>
              </div>

              {/* Sparkline + Benchmarks */}
              <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "flex-end", gap: "24px", flexWrap: "wrap" }}>
                {sparkData.length >= 2 && (
                  <svg width={spW} height={spH} style={{ display: "block", flexShrink: 0 }}>
                    <polyline points={spPts} fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                )}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {[
                    { label: "STRAT paper", value: pv, color: "#fb923c" },
                    btc ? { label: "BTC buy & hold", value: btc, color: "#f59e0b" } : null,
                    spy ? { label: "SPY buy & hold", value: spy, color: "#4ade80" } : null,
                  ].filter(Boolean).map(b => (
                    <div key={b.label} style={{ fontSize: "11px" }}>
                      <div style={{ color: b.color, fontWeight: "600" }}>{b.label}</div>
                      <div style={{ color: C.text }}>{b.value.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} USD</div>
                      <div style={{ color: b.value >= START ? "#4ade80" : "#f87171", fontSize: "10px" }}>
                        {b.value >= START ? "+" : ""}{((b.value / START - 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Positioner */}
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px" }}>
                <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "6px" }}>NUVARANDE POSITIONER</div>
                {strat_innehav.filter(p => parseFloat(p.antal) > 0).length === 0 ? (
                  <div style={{ fontSize: "12px", color: C.textMuted }}>Inga positioner (kontant)</div>
                ) : strat_innehav.filter(p => parseFloat(p.antal) > 0).map(p => (
                  <div key={p.symbol} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "2px 0" }}>
                    <span style={{ color: "#fb923c", fontWeight: "600" }}>{p.symbol}</span>
                    <span style={{ color: C.textMuted }}>
                      {parseFloat(p.antal).toFixed(6)} @ {parseFloat(p.kopt_pris_usd).toFixed(2)} USD
                      {p.entry_datum && <span style={{ marginLeft: "8px", fontSize: "10px" }}>(entry {p.entry_datum})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* QUANT Paper Trading panel */}
        {(() => {
          const senaste = paper_nav[0];
          if (!senaste) return (
            <div style={{ marginTop: "20px", padding: "16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", borderTop: `2px solid #38bdf8` }}>
              <div style={{ fontSize: "12px", color: C.textMuted }}>
                🤖 <strong style={{ color: "#38bdf8" }}>QUANT Paper Trading</strong> — Kör <code>supabase_quant_paper.sql</code> och vänta på nästa hedgefond-körning.
              </div>
            </div>
          );

          const START = parseFloat(senaste.start_kapital_usd) || 10000;
          const pv    = parseFloat(senaste.portfölj_värde_usd);
          const pnl   = pv - START;
          const pnlPct = (pnl / START * 100).toFixed(1);
          const btc   = senaste.btc_benchmark_usd ? parseFloat(senaste.btc_benchmark_usd) : null;
          const spy   = senaste.spy_benchmark_usd ? parseFloat(senaste.spy_benchmark_usd) : null;

          // Sparkline data (portföljvärde över tid)
          const sparkData = [...paper_nav].reverse().map(r => parseFloat(r.portfölj_värde_usd));
          const spMin = Math.min(...sparkData), spMax = Math.max(...sparkData);
          const spRange = spMax - spMin || 1;
          const spW = 200, spH = 40;
          const spPts = sparkData.map((v, i) => {
            const x = (i / Math.max(sparkData.length - 1, 1)) * spW;
            const y = spH - ((v - spMin) / spRange) * spH;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ");

          return (
            <div style={{
              marginTop: "20px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              borderTop: "2px solid #38bdf8",
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "18px" }}>🤖</span>
                    <span style={{ fontWeight: "700", fontSize: "15px", color: "#38bdf8" }}>QUANT Paper Trading</span>
                    <span style={{ fontSize: "10px", background: "#0e2a3a", border: "1px solid #38bdf840", borderRadius: "4px", padding: "2px 6px", color: "#38bdf8" }}>RIKTIGA MARKNADSDATA</span>
                  </div>
                  <div style={{ fontSize: "11px", color: C.textMuted }}>10 000 USD fiktivt startkapital · BTC, ETH, SOL, XRP, BNB, SPY</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: pnl >= 0 ? "#4ade80" : "#f87171" }}>
                    {pv.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} USD
                  </div>
                  <div style={{ fontSize: "12px", color: pnl >= 0 ? "#4ade80" : "#f87171" }}>
                    {pnl >= 0 ? "▲" : "▼"} {Math.abs(pnl).toFixed(0)} USD ({pnl >= 0 ? "+" : ""}{pnlPct}%)
                  </div>
                </div>
              </div>

              {/* Sparkline + Benchmarks */}
              <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "flex-end", gap: "24px", flexWrap: "wrap" }}>
                {sparkData.length >= 2 && (
                  <svg width={spW} height={spH} style={{ display: "block", flexShrink: 0 }}>
                    <polyline points={spPts} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                )}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {[
                    { label: "QUANT paper", value: pv, color: "#38bdf8" },
                    btc ? { label: "BTC buy & hold", value: btc, color: "#f59e0b" } : null,
                    spy ? { label: "SPY buy & hold", value: spy, color: "#4ade80" } : null,
                  ].filter(Boolean).map(b => (
                    <div key={b.label} style={{ fontSize: "11px" }}>
                      <div style={{ color: b.color, fontWeight: "600" }}>{b.label}</div>
                      <div style={{ color: C.text }}>{b.value.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} USD</div>
                      <div style={{ color: b.value >= START ? "#4ade80" : "#f87171", fontSize: "10px" }}>
                        {b.value >= START ? "+" : ""}{((b.value / START - 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Positioner + senaste motivering */}
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "6px" }}>NUVARANDE POSITIONER</div>
                  {paper_innehav.filter(p => parseFloat(p.antal) > 0).length === 0 ? (
                    <div style={{ fontSize: "12px", color: C.textMuted }}>Inga positioner ännu</div>
                  ) : paper_innehav.filter(p => parseFloat(p.antal) > 0).map(p => (
                    <div key={p.symbol} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "2px 0" }}>
                      <span style={{ color: "#38bdf8", fontWeight: "600" }}>{p.symbol}</span>
                      <span style={{ color: C.textMuted }}>{parseFloat(p.antal).toFixed(5)} @ {parseFloat(p.kopt_pris_usd).toFixed(2)} USD</span>
                    </div>
                  ))}
                </div>
                {senaste.quant_motivering && (
                  <div style={{ flex: 2, minWidth: "200px" }}>
                    <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "6px" }}>SENASTE LLM-ANALYS</div>
                    <div style={{ fontSize: "12px", color: C.text, lineHeight: "1.5", fontStyle: "italic" }}>
                      "{senaste.quant_motivering}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
