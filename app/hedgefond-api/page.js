"use client";
import { useState, useEffect, useCallback } from "react";

const C = {
  bg:      "#0a0a0a",
  card:    "#0f0f0f",
  border:  "#1a1a1a",
  text:    "#e0e0da",
  dim:     "#555",
  accent:  "#e8d5a3",
  accentD: "#b8a57a",
  green:   "#4ade80",
  blue:    "#60a5fa",
  red:     "#f87171",
  amber:   "#fbbf24",
};

function Code({ children }) {
  return (
    <div style={{ background: "#050505", border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, fontFamily: "monospace", fontSize: 13, color: "#666", overflowX: "auto", whiteSpace: "pre" }}>
      {children}
    </div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", color: "#0a0a0a", background: color, borderRadius: 3, padding: "2px 6px" }}>
      {label}
    </span>
  );
}

function NavCard({ nav, fund }) {
  if (!nav) return <div style={{ color: C.dim, fontSize: 13 }}>Ingen data ännu</div>;
  const signal = nav.signal;
  const signalColor = signal === "BUY" ? C.green : signal === "SELL" ? C.red : C.dim;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
        <p style={{ fontSize: 11, color: C.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>NAV (USD)</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: C.accent, margin: 0 }}>
          ${Number(nav.nav_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
        <p style={{ fontSize: 11, color: C.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Likvider (USD)</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>
          ${Number(nav.kontant_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      {signal && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
          <p style={{ fontSize: 11, color: C.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Signal</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: signalColor, margin: 0 }}>{signal}</p>
        </div>
      )}
      {nav.aktiv_strategi && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
          <p style={{ fontSize: 11, color: C.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Strategi</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.blue, margin: 0 }}>{nav.aktiv_strategi}</p>
        </div>
      )}
      {nav.backtest_avkastning_pct != null && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
          <p style={{ fontSize: 11, color: C.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Backtest-avkastning</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.green, margin: 0 }}>+{Number(nav.backtest_avkastning_pct).toFixed(1)}%</p>
        </div>
      )}
      {nav.benchmark && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, gridColumn: "span 2" }}>
          <p style={{ fontSize: 11, color: C.dim, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Benchmark (USD)</p>
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, color: C.dim }}>BTC buy &amp; hold </span>
              <span style={{ fontSize: 14, color: C.amber, fontWeight: 700 }}>${Number(nav.benchmark.btc_buy_hold_usd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: C.dim }}>SPY buy &amp; hold </span>
              <span style={{ fontSize: 14, color: C.blue, fontWeight: 700 }}>${Number(nav.benchmark.spy_buy_hold_usd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HoldingsList({ items }) {
  if (!items || items.length === 0) return <p style={{ color: C.dim, fontSize: 13 }}>Inga öppna positioner</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((h, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px" }}>
          <span style={{ fontFamily: "monospace", fontSize: 14, color: C.accent, fontWeight: 700 }}>{h.symbol}</span>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 13, color: C.text }}>{Number(h.antal).toFixed(4)} st</span>
            {h.kopt_pris_usd && (
              <span style={{ fontSize: 11, color: C.dim, marginLeft: 12 }}>@ ${Number(h.kopt_pris_usd).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = ["signaler", "nav"];
const LIMIT_OPTIONS = [10, 30, 60, 90, 180, 365];

export default function HedgefondApiPage() {
  const [tab, setTab] = useState("signaler");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(60);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async (t, lim) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const url = t === "nav"
      ? `/api/hedgefonder/nav?limit=${lim}`
      : `/api/hedgefonder/signaler`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      setResult(json);
      setLastFetch(new Date().toLocaleTimeString("sv-SE"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(tab, limit); }, [tab, limit, fetchData]);

  const curlUrl = tab === "nav"
    ? `https://www.debatt-ai.se/api/hedgefonder/nav?limit=${limit}`
    : "https://www.debatt-ai.se/api/hedgefonder/signaler";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/om#hedgefond-api" style={{ fontSize: 11, color: C.dim, textDecoration: "none", fontFamily: "monospace", letterSpacing: ".06em" }}>← OM DEBATT-AI</a>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: C.accent, margin: "12px 0 8px" }}>Hedgefond Signal API</h1>
          <p style={{ fontSize: 15, color: C.dim, lineHeight: 1.7, margin: 0 }}>
            Öppet REST API för QUANT och STRAT paper trading-signaler. Ingen autentisering krävs.
            Fiktivt startkapital 10 000 USD — inte finansiell rådgivning.
          </p>
        </div>

        {/* Tab selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 20px", borderRadius: 4, border: `1px solid ${tab === t ? C.accentD : C.border}`,
                background: tab === t ? "#18150a" : "transparent",
                color: tab === t ? C.accent : C.dim,
                fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: ".04em",
              }}
            >
              {t === "signaler" ? "Signaler & innehav" : "NAV-historik"}
            </button>
          ))}
          {tab === "nav" && (
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ marginLeft: "auto", padding: "8px 12px", background: C.card, border: `1px solid ${C.border}`, color: C.dim, borderRadius: 4, fontSize: 13, fontFamily: "monospace" }}
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} datapunkter</option>
              ))}
            </select>
          )}
          <button
            onClick={() => fetchData(tab, limit)}
            disabled={loading}
            style={{ marginLeft: tab === "nav" ? 8 : "auto", padding: "8px 16px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: loading ? C.dim : C.green, fontSize: 12, cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace" }}
          >
            {loading ? "Hämtar…" : "↺ Uppdatera"}
          </button>
        </div>

        {/* cURL snippet */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: C.dim, margin: "0 0 6px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: ".06em" }}>cURL</p>
          <Code>{"curl " + curlUrl}</Code>
        </div>

        {/* Result */}
        {error && (
          <div style={{ background: "#1a0808", border: `1px solid #400`, borderRadius: 8, padding: 16, color: C.red, fontFamily: "monospace", fontSize: 13, marginBottom: 24 }}>
            Fel: {error}
          </div>
        )}

        {result && tab === "signaler" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {["STRAT", "QUANT", "ARBI"].map((fund) => {
              const f = result.funds?.[fund];
              if (!f) return null;
              const tagLabel = fund === "STRAT" ? "ALGORITMISK" : fund === "ARBI" ? "DELTA-NEUTRAL ARBITRAGE" : "SJÄLVLÄRANDE LLM";
              const tagColor = fund === "STRAT" ? C.blue : fund === "ARBI" ? "#a78bfa" : C.amber;
              return (
                <section key={fund}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{fund}</h2>
                    <Tag label={tagLabel} color={tagColor} />
                    <Tag label="PAPER TRADING" color="#555" />
                    {f.timestamp && (
                      <span style={{ fontSize: 11, color: C.dim, marginLeft: "auto" }}>
                        {new Date(f.timestamp).toLocaleString("sv-SE")}
                      </span>
                    )}
                  </div>
                  <NavCard nav={f} fund={fund} />
                  {/* ARBI-specifika fält */}
                  {fund === "ARBI" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
                        <p style={{ fontSize: 11, color: C.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Funding Rate / 8h</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: (f.funding_rate_pct ?? 0) >= 0 ? C.green : C.red, margin: 0 }}>
                          {f.funding_rate_pct != null ? `${Number(f.funding_rate_pct) >= 0 ? "+" : ""}${Number(f.funding_rate_pct).toFixed(4)}%` : "—"}
                        </p>
                      </div>
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
                        <p style={{ fontSize: 11, color: C.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>APR (annualiserad)</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: C.green, margin: 0 }}>
                          {f.apr_pct != null ? `${Number(f.apr_pct).toFixed(2)}%` : "—"}
                        </p>
                      </div>
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
                        <p style={{ fontSize: 11, color: C.dim, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Total funding-inkomst</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: C.accent, margin: 0 }}>
                          {f.inkomst_usd != null ? `$${Number(f.inkomst_usd).toFixed(2)}` : "—"}
                        </p>
                      </div>
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, gridColumn: "span 3" }}>
                        <p style={{ fontSize: 11, color: C.dim, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Aktiv position</p>
                        <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.6 }}>
                          {f.position_riktning === "long_spot_short_perp" && "📈 Long BTC spot + Short BTC perpetual — tjänar på positiv funding rate"}
                          {f.position_riktning === "long_perp_short_spot" && "📉 Long BTC perpetual + Short BTC spot — tjänar på negativ funding rate"}
                          {f.position_riktning === "neutral" && "⏸ Neutral — funding rate för liten för lönsam arbitrage"}
                          {!f.position_riktning && "—"}
                        </p>
                      </div>
                    </div>
                  )}
                  {f.llm_motivering && (
                    <div style={{ background: "#07100a", border: `1px solid #1a3020`, borderRadius: 8, padding: 16, marginTop: 12 }}>
                      <p style={{ fontSize: 11, color: C.green, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>LLM-motivering</p>
                      <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>{f.llm_motivering}</p>
                    </div>
                  )}
                  {f.innehav && (
                    <div style={{ marginTop: 16 }}>
                      <p style={{ fontSize: 11, color: C.dim, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Öppna positioner</p>
                      <HoldingsList items={f.innehav} />
                    </div>
                  )}
                </section>
              );
            })}
            <div style={{ fontSize: 11, color: C.dim, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              Genererad: {result.generated_at ? new Date(result.generated_at).toLocaleString("sv-SE") : "—"} · Hämtad lokalt: {lastFetch}
            </div>
          </div>
        )}

        {result && tab === "nav" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {["STRAT", "QUANT", "ARBI"].map((fund) => {
              const fd = result.funds?.[fund];
              if (!fd) return null;
              const hist = fd.history ?? [];
              const tagLabel = fund === "STRAT" ? "ALGORITMISK" : fund === "ARBI" ? "DELTA-NEUTRAL ARBITRAGE" : "SJÄLVLÄRANDE LLM";
              const tagColor = fund === "STRAT" ? C.blue : fund === "ARBI" ? "#a78bfa" : C.amber;
              return (
                <section key={fund}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{fund}</h2>
                    <Tag label={tagLabel} color={tagColor} />
                    <span style={{ fontSize: 12, color: C.dim, marginLeft: "auto" }}>{fd.data_points} datapunkter</span>
                  </div>
                  {fd.latest_nav && <NavCard nav={fd.latest_nav} fund={fund} />}
                  {hist.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <p style={{ fontSize: 11, color: C.dim, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace" }}>Historik (senaste {Math.min(hist.length, 8)} av {hist.length})</p>
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                        {fund === "ARBI" ? (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
                            <thead>
                              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                {["Datum", "NAV (USD)", "Total inkomst", "Funding Rate/8h", "APR", "Position"].map(h => (
                                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: C.dim, fontWeight: 400, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {hist.slice(-8).reverse().map((row, i) => {
                                const rc = (row.funding_rate_pct ?? 0) >= 0 ? C.green : C.red;
                                return (
                                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                                    <td style={{ padding: "8px 12px", color: C.dim }}>{row.timestamp ? new Date(row.timestamp).toLocaleDateString("sv-SE") : "—"}</td>
                                    <td style={{ padding: "8px 12px", color: C.accent, fontWeight: 700 }}>${Number(row.nav_usd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                                    <td style={{ padding: "8px 12px", color: C.green }}>+${Number(row.inkomst_usd ?? 0).toFixed(2)}</td>
                                    <td style={{ padding: "8px 12px", color: rc }}>{row.funding_rate_pct != null ? `${Number(row.funding_rate_pct) >= 0 ? "+" : ""}${Number(row.funding_rate_pct).toFixed(4)}%` : "—"}</td>
                                    <td style={{ padding: "8px 12px", color: C.green }}>{row.apr_pct != null ? `${Number(row.apr_pct).toFixed(1)}%` : "—"}</td>
                                    <td style={{ padding: "8px 12px", color: C.dim, fontSize: 11 }}>{row.position_riktning?.replace(/_/g, " ") ?? "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                              {["Datum", "NAV (USD)", "Likvider", "Signal/Strategi", "BTC B&H", "SPY B&H"].map(h => (
                                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: C.dim, fontWeight: 400, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {hist.slice(-8).reverse().map((row, i) => {
                              const sc = row.signal === "BUY" ? C.green : row.signal === "SELL" ? C.red : C.dim;
                              return (
                                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                                  <td style={{ padding: "8px 12px", color: C.dim }}>{row.timestamp ? new Date(row.timestamp).toLocaleDateString("sv-SE") : "—"}</td>
                                  <td style={{ padding: "8px 12px", color: C.accent, fontWeight: 700 }}>${Number(row.nav_usd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                                  <td style={{ padding: "8px 12px", color: C.text }}>${Number(row.kontant_usd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                                  <td style={{ padding: "8px 12px", color: sc }}>{row.signal ?? row.aktiv_strategi ?? "—"}</td>
                                  <td style={{ padding: "8px 12px", color: C.amber }}>{row.benchmark?.btc_buy_hold_usd ? "$" + Number(row.benchmark.btc_buy_hold_usd).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"}</td>
                                  <td style={{ padding: "8px 12px", color: C.blue }}>{row.benchmark?.spy_buy_hold_usd ? "$" + Number(row.benchmark.spy_buy_hold_usd).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
            <div style={{ fontSize: 11, color: C.dim, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              Genererad: {result.generated_at ? new Date(result.generated_at).toLocaleString("sv-SE") : "—"} · Hämtad lokalt: {lastFetch}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.dim, fontSize: 14 }}>Hämtar data…</div>
        )}

        {/* Endpoint reference */}
        <div style={{ marginTop: 56, borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
          <h3 style={{ fontSize: 14, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "monospace", margin: "0 0 20px", fontWeight: 400 }}>Endpoint-referens</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["GET /api/hedgefonder", "Dokumentation — fondbeskrivningar, endpoint-lista, exempelsignal"],
              ["GET /api/hedgefonder/signaler", "Senaste signal och innehav för QUANT och STRAT"],
              ["GET /api/hedgefonder/nav", "NAV-historik med BTC/SPY benchmark. Param: ?limit=N (default 60, max 365)"],
            ].map(([endpoint, desc]) => (
              <div key={endpoint} style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
                <code style={{ fontSize: 12, color: C.accent, fontFamily: "monospace", flexShrink: 0 }}>{endpoint}</code>
                <span style={{ fontSize: 13, color: C.dim }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
