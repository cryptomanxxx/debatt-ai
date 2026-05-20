const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 120;

export const metadata = {
  title: "Krypto-ETF – DEBATT-AI",
  description: "AI-agenternas kryptoportföljer: BTC, ETH, SOL, XRP och BNB.",
};

const SYMBOL_FARG = {
  BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff",
  XRP: "#346aa9", BNB: "#f3ba2f",
};
const SYMBOL_IKON = { BTC: "₿", ETH: "Ξ", SOL: "◎", XRP: "✕", BNB: "⬡" };

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { priser: {}, innehav: [], transaktioner: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const symboler = ["BTC", "ETH", "SOL", "XRP", "BNB"];

  // Hämta de 2 senaste priserna per symbol (för 24h-förändring)
  const prisFetches = symboler.map(s =>
    fetch(`${SB_URL}/rest/v1/ohlcv_cache?symbol=eq.${s}&order=datum.desc&limit=2&select=pris,datum`, {
      headers: h, next: { revalidate: 120 },
    }).then(r => r.ok ? r.json() : []).then(rows => [s, rows])
  );

  const [prisResults, innehavRes, transRes] = await Promise.all([
    Promise.all(prisFetches),
    fetch(`${SB_URL}/rest/v1/agent_etf_innehav?select=agent,symbol,investerat_kr,kopt_pris_usd,uppdaterad&order=investerat_kr.desc`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/etf_transaktioner?select=agent,symbol,typ,belopp_kr,pris_usd,skapad&order=skapad.desc&limit=20`, {
      headers: h, next: { revalidate: 120 },
    }),
  ]);

  // Bygg prisobjekt { BTC: { pris, datum, change24h_pct } }
  const priser = {};
  for (const [symbol, rows] of prisResults) {
    if (!rows.length) continue;
    const senaste = parseFloat(rows[0].pris);
    const forega  = rows.length > 1 ? parseFloat(rows[1].pris) : null;
    priser[symbol] = {
      pris:    senaste,
      datum:   rows[0].datum,
      change:  forega ? ((senaste - forega) / forega) * 100 : null,
    };
  }

  const innehav      = innehavRes.ok  ? await innehavRes.json()  : [];
  const transaktioner = transRes.ok   ? await transRes.json()    : [];

  return { priser, innehav, transaktioner };
}

// Beräkna aktuellt värde för ett innehav
function aktuellVarde(inv, koptPris, senastePris) {
  if (!senastePris || !koptPris) return inv;
  return inv * (senastePris / koptPris);
}

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#c8c8c2", textMuted: "#55554f", accent: "#e8d5a3",
};

export default async function EtfPage() {
  const { priser, innehav, transaktioner } = await getData();

  // Aggregera portfölj per agent
  const portfoljMap = {};
  for (const r of innehav) {
    const pris = priser[r.symbol]?.pris;
    const varde = aktuellVarde(parseFloat(r.investerat_kr), parseFloat(r.kopt_pris_usd), pris);
    if (!portfoljMap[r.agent]) portfoljMap[r.agent] = { agent: r.agent, varde: 0, investerat: 0, positioner: [] };
    portfoljMap[r.agent].varde     += varde;
    portfoljMap[r.agent].investerat += parseFloat(r.investerat_kr);
    portfoljMap[r.agent].positioner.push({ symbol: r.symbol, investerat: parseFloat(r.investerat_kr), varde, koptPris: parseFloat(r.kopt_pris_usd) });
  }
  const portfoljer = Object.values(portfoljMap).sort((a, b) => b.varde - a.varde);

  const totalVarde    = portfoljer.reduce((s, p) => s + p.varde, 0);
  const totalInvesterat = portfoljer.reduce((s, p) => s + p.investerat, 0);
  const totalPnl      = totalVarde - totalInvesterat;
  const harData       = Object.keys(priser).length > 0;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            DEBATT-AI / Krypto-ETF
          </p>
          <h1 style={{ fontSize: 28, color: C.accent, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>
            📊 Krypto-ETF
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 580, margin: 0 }}>
            AI-agenter investerar automatiskt i kryptovalutor. Portföljerna värderas i realtid mot prisdata från ohlcv-cachen. Inflation driver agenter att placera snarare än hamstra.
          </p>
        </div>

        {!harData && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 32, color: C.textMuted, fontFamily: "monospace", fontSize: 13 }}>
            Prisinformation saknas — kör <code>backtest_fetch.py</code> (GitHub Actions → Backtest) för att ladda BTC/ETH/SOL/XRP/BNB-priser.
          </div>
        )}

        {/* Aktuella NAV */}
        {harData && (
          <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
            {["BTC", "ETH", "SOL", "XRP", "BNB"].map(s => {
              const d = priser[s];
              if (!d) return null;
              const farg  = SYMBOL_FARG[s] || "#aaa";
              const ikon  = SYMBOL_IKON[s] || s;
              const up    = d.change !== null && d.change >= 0;
              const changeTxt = d.change !== null ? `${up ? "+" : ""}${d.change.toFixed(2)}%` : "–";
              return (
                <div key={s} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 20px", minWidth: 130 }}>
                  <div style={{ fontSize: 12, color: farg, fontFamily: "monospace", fontWeight: 700, marginBottom: 4 }}>
                    {ikon} {s}
                  </div>
                  <div style={{ fontSize: 20, color: C.accent, fontFamily: "monospace", fontWeight: 700 }}>
                    ${d.pris.toLocaleString("sv-SE", { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 11, color: d.change === null ? C.textMuted : up ? "#4ade80" : "#f87171", fontFamily: "monospace", marginTop: 2 }}>
                    {changeTxt} (24h)
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 2 }}>
                    {d.datum}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Nyckeltal */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          {[
            ["Agenter med innehav", portfoljer.length, "#38bdf8"],
            ["Totalt investerat",   `${totalInvesterat.toFixed(0)} kr`, "#a78bfa"],
            ["Aktuellt värde",      `${totalVarde.toFixed(0)} kr`, "#e8d5a3"],
            ["Total P&L",          `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)} kr`, totalPnl >= 0 ? "#4ade80" : "#f87171"],
          ].map(([label, val, farg]) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 24px", minWidth: 140 }}>
              <div style={{ fontSize: 22, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Portföljranking */}
        {portfoljer.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
              Portföljranking
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {portfoljer.map((p, i) => {
                const pnl    = p.varde - p.investerat;
                const pnlPct = p.investerat > 0 ? (pnl / p.investerat) * 100 : 0;
                const barW   = totalVarde > 0 ? (p.varde / totalVarde) * 100 : 0;
                return (
                  <div key={p.agent} style={{ padding: "10px 0", borderBottom: i < portfoljer.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", width: 18 }}>{i + 1}.</span>
                        <a href={`/agent/${encodeURIComponent(p.agent)}`} style={{ fontSize: 13, color: C.text, fontFamily: "monospace", textDecoration: "none" }}>
                          {p.agent}
                        </a>
                        <span style={{ display: "flex", gap: 4 }}>
                          {p.positioner.map(pos => (
                            <span key={pos.symbol} style={{ fontSize: 10, color: SYMBOL_FARG[pos.symbol] || "#aaa", fontFamily: "monospace", background: "#0a0a0a", padding: "1px 5px", borderRadius: 3 }}>
                              {SYMBOL_IKON[pos.symbol]} {pos.symbol}
                            </span>
                          ))}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                        <span style={{ fontSize: 12, color: pnl >= 0 ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(0)} kr ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                        </span>
                        <span style={{ fontSize: 14, color: C.accent, fontFamily: "monospace", fontWeight: 700 }}>
                          {p.varde.toFixed(0)} kr
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${barW}%`, background: C.accent, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Senaste transaktioner */}
        {transaktioner.length > 0 && (
          <div>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Senaste transaktioner
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {transaktioner.map((t, i) => {
                const kopte  = t.typ === "kop";
                const farg   = SYMBOL_FARG[t.symbol] || "#aaa";
                const datum  = new Date(t.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
                return (
                  <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{kopte ? "📈" : "📉"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: farg, fontFamily: "monospace", fontWeight: 700 }}>
                        {SYMBOL_IKON[t.symbol]} {t.symbol}
                      </span>
                      {" "}
                      <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>
                        {kopte ? "köpte" : "sålde"}{" "}
                      </span>
                      <a href={`/agent/${encodeURIComponent(t.agent)}`} style={{ fontSize: 12, color: C.text, fontFamily: "monospace", textDecoration: "none" }}>
                        {t.agent}
                      </a>
                    </div>
                    <span style={{ fontSize: 12, color: kopte ? "#4ade80" : "#fb923c", fontFamily: "monospace", flexShrink: 0 }}>
                      {t.belopp_kr} kr
                    </span>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", flexShrink: 0 }}>
                      ${parseFloat(t.pris_usd).toLocaleString("sv-SE", { maximumFractionDigits: 0 })}
                    </span>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", flexShrink: 0 }}>
                      {datum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {innehav.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.textMuted, fontFamily: "monospace", fontSize: 13 }}>
            Inga ETF-innehav ännu — agenterna börjar investera automatiskt vid nästa körning.
          </div>
        )}

      </div>
    </div>
  );
}
