"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Legend, ResponsiveContainer } from "recharts";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", red: "#f87171", yellow: "#f8fafc",
};

const inp = {
  background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px",
  color: C.text, fontFamily: "Georgia, serif", fontSize: "14px",
  padding: "10px 12px", width: "100%", boxSizing: "border-box", outline: "none",
};

function sbHeaders() {
  return {
    "apikey": SB_KEY,
    "Authorization": `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
  };
}

async function fetchInlamningar() {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?select=*&order=skapad.desc`, {
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function fetchArtiklar() {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=*&order=skapad.desc`, {
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function updateStatus(id, status) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function deleteInlamning(id) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function deleteArtikelById(id) {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function fetchKommentarer() {
  const res = await fetch(`${SB_URL}/rest/v1/kommentarer?select=*&order=skapad.desc`, {
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function deleteKommentar(id) {
  const res = await fetch(`${SB_URL}/rest/v1/kommentarer?id=eq.${id}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function updateArtikel(id, changes) {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function publishToArtiklar(row) {
  const check = await fetch(`${SB_URL}/rest/v1/artiklar?rubrik=eq.${encodeURIComponent(row.rubrik)}&select=id`, {
    headers: sbHeaders(),
  });
  const existing = await check.json();
  if (existing.length > 0) throw new Error("Artikeln finns redan publicerad i arkivet.");
  const res = await fetch(`${SB_URL}/rest/v1/artiklar`, {
    method: "POST",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({
      rubrik: row.rubrik, forfattare: row.forfattare, artikel: row.artikel,
      kategori: row.kategori, motivering: row.motivering,
      arg: row.arg, ori: row.ori, rel: row.rel, tro: row.tro,
      kalla: row.kalla || "manniska",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

function EquityKurva({ best, sym }) {
  const kurva = best?.equity_kurva;
  if (!kurva || kurva.length < 2) return (
    <div style={{ marginTop: "16px", background: "#0a0a0a", border: `1px solid ${C.border}`, borderRadius: "6px", padding: "20px", textAlign: "center" }}>
      <p style={{ margin: "0 0 6px", fontSize: "13px", color: C.textMuted }}>
        Ingen equity-kurva för {sym} ännu.
      </p>
      <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>
        Kör SQL-migrationen → GitHub Actions → Backtest → Run workflow
      </p>
    </div>
  );
  const chartData = kurva.map((k, i) => ({ trade: i, kapital: +(k * 100).toFixed(2) }));
  const slutKapital = kurva[kurva.length - 1];
  const bh = (best.buyhold_avkastning ?? 0) / 100 + 1;
  const vinnande = slutKapital >= 1;
  return (
    <div style={{ marginTop: "16px" }}>
      <p style={{ margin: "0 0 2px", fontSize: "11px", color: C.accentDim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "monospace" }}>
        {sym} equity-kurva — {best.strategi}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: "11px", color: C.textMuted }}>
        Start 100 kr
        {" · "}
        <span style={{ color: vinnande ? C.green : C.red, fontWeight: 600 }}>
          Slut {(slutKapital * 100).toFixed(0)} kr
        </span>
        {" · "}
        <span style={{ color: C.accentDim }}>B&H {(bh * 100).toFixed(0)} kr</span>
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
          <XAxis dataKey="trade" tick={{ fill: C.textMuted, fontSize: 10 }} label={{ value: "Trade #", position: "insideBottomRight", fill: C.textMuted, fontSize: 9, offset: -2 }} />
          <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => `${v}`} domain={["auto", "auto"]} width={40} />
          <Tooltip
            contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}
            labelFormatter={l => `Trade ${l}`}
            formatter={v => [`${v} kr`, "Kapital"]}
          />
          <ReferenceLine y={100} stroke={C.border} strokeDasharray="4 2" />
          <ReferenceLine y={+(bh * 100).toFixed(2)} stroke={C.accentDim} strokeDasharray="4 2"
            label={{ value: "B&H", fill: C.accentDim, fontSize: 9, position: "insideTopRight" }} />
          <Line type="monotone" dataKey="kapital" stroke={vinnande ? C.green : C.red} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ParamPills(r) {
  const pill = (label, color) => (
    <span key={label} style={{
      display: "inline-block", padding: "1px 7px", borderRadius: "4px",
      fontSize: "10px", fontFamily: "monospace", fontWeight: 600,
      background: color + "22", color: color, border: `1px solid ${color}44`,
      marginRight: "4px", marginBottom: "2px",
    }}>{label}</span>
  );
  const pills = [];
  if (r.lookback)           pills.push(pill(`L${r.lookback}`, C.accentDim));
  if (r.vol_multiplikator)  pills.push(pill(`V${r.vol_multiplikator}×`, C.accent));
  const ex = r.strategi?.match(/e(\d+)d/)?.[1];
  if (ex)                   pills.push(pill(`E${ex}d`, C.text));
  if (r.stoploss_pct)       pills.push(pill(`SL${r.stoploss_pct}%`, C.red));
  if (r.transaktionskostnad_pct > 0) pills.push(pill(`TC${r.transaktionskostnad_pct}%`, C.yellow));
  if (r.regim_filter)       pills.push(pill("BTC↑", C.green));
  return <span>{pills}</span>;
}

function BacktestTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [showAll, setShowAll]   = useState({});
  const [copied, setCopied]     = useState(false);
  const [kurvaSym, setKurvaSym] = useState(null);

  function exportCSV(grouped) {
    const cols = ["symbol","strategi","lookback","vol_multiplikator","stoploss_pct",
                  "transaktionskostnad_pct","regim_filter","antal_trades","vinstrate",
                  "avg_avkastning","total_avkastning","buyhold_avkastning","sharpe",
                  "max_drawdown","kelly_fraction","period_start","period_slut"];
    const rows = Object.values(grouped).flat();
    const csv  = [cols.join(","),
      ...rows.map(r => cols.map(c => r[c] ?? "").join(","))
    ].join("\n");
    navigator.clipboard.writeText(csv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${SB_URL}/rest/v1/backtest_resultat?select=*&order=symbol.asc`,
          { headers: sbHeaders() }
        );
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        const grouped = {};
        for (const r of rows) {
          if (!grouped[r.symbol]) grouped[r.symbol] = [];
          grouped[r.symbol].push(r);
        }
        // Sortera per symbol efter alpha (total - buyhold) desc
        for (const sym of Object.keys(grouped)) {
          grouped[sym].sort((a, b) => {
            const alphaA = (a.total_avkastning ?? -999) - (a.buyhold_avkastning ?? 0);
            const alphaB = (b.total_avkastning ?? -999) - (b.buyhold_avkastning ?? 0);
            return alphaB - alphaA;
          });
        }
        setData(grouped);
      } catch (e) { setError(e.message); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p style={{ color: C.textMuted }}>Laddar backtestdata…</p>;
  if (error)   return <p style={{ color: C.red }}>Fel: {error}</p>;
  if (!data || Object.keys(data).length === 0) return (
    <div>
      <p style={{ color: C.textMuted, fontSize: "14px", marginBottom: "16px" }}>
        Ingen backtest-data ännu. Kör SQL-schemat i Supabase och sedan GitHub Actions → <strong style={{ color: C.accent }}>Backtest → Run workflow</strong>.
      </p>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "monospace" }}>Strategi</p>
        <p style={{ color: C.textMuted, fontSize: "13px", lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: C.text }}>Signal:</strong> Köp när pris &gt; lookback-dagars avg OCH volym &gt; threshold × lookback-dagars avg.<br />
          <strong style={{ color: C.text }}>Exit:</strong> Sälj efter 1, 3 eller 7 dagar (eller vid stop-loss).<br />
          <strong style={{ color: C.text }}>Grid:</strong> 216 kombinationer per mynt (lookback, vol-threshold, exit, SL, TC, regimfilter).<br />
          <strong style={{ color: C.text }}>Data:</strong> Yahoo Finance — 2 år historik för BTC, ETH, SOL, XRP, BNB.
        </p>
      </div>
    </div>
  );

  // Summering: bästa strategi per mynt
  const summering = Object.entries(data).map(([sym, rader]) => {
    const best = rader[0];
    const alpha = best ? ((best.total_avkastning ?? 0) - (best.buyhold_avkastning ?? 0)) : 0;
    return { sym, best, alpha };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Strategibeskrivning */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px", fontFamily: "monospace" }}>
          Hur strategin fungerar
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", fontSize: "13px", color: C.textMuted, lineHeight: 1.7 }}>
          <div>
            <p style={{ margin: "0 0 6px", color: C.text, fontWeight: 600 }}>Signal (köp)</p>
            <p style={{ margin: 0 }}>
              Köp när <span style={{ color: C.accent }}>pris &gt; lookback-dagars medelpris</span> OCH{" "}
              <span style={{ color: C.accent }}>volym &gt; threshold × lookback-dagars medelvolym</span>.
              Signalen kräver alltså att både momentum och volym bekräftar rörelsen.
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", color: C.text, fontWeight: 600 }}>Exit (sälj)</p>
            <p style={{ margin: 0 }}>
              Sälj efter ett fast antal dagar (1d / 3d / 7d) — eller tidigare om stop-loss triggas.
              Positioner överlappar aldrig: ny signal ignoreras om en position redan är öppen.
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", color: C.text, fontWeight: 600 }}>Parametrar</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
              {[
                ["L (lookback)", "Antal dagar för glidande medelvärde: 5, 10 eller 20"],
                ["V (vol-threshold)", "Volym måste vara X× normalvolymen: 1×, 1.5× eller 2×"],
                ["E (exit)", "Håll position i 1, 3 eller 7 dagar"],
                ["SL (stop-loss)", "Sälj om priset faller 5% under köpkurs (aktivt eller av)"],
                ["TC (transakt.kostnad)", "0% eller 0.1% per handel (tur + retur = 2×)"],
                ["BTC↑ (regimfilter)", "Handla bara när BTC är i upptrend vs eget medelvärde"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "8px" }}>
                  <span style={{ color: C.accent, fontFamily: "monospace", minWidth: "140px" }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", color: C.text, fontWeight: 600 }}>Jämförelse &amp; alpha</p>
            <p style={{ margin: "0 0 8px" }}>
              Alpha = strategins totala avkastning minus buy &amp; hold för samma period.
              Positivt alpha betyder att aktiv handel slog passivt innehav.
            </p>
            <p style={{ margin: "0 0 6px", color: C.text, fontWeight: 600 }}>Tolkning av Sharpe</p>
            <p style={{ margin: "0 0 8px" }}>
              Sharpe &gt; 1 = utmärkt, 0.5–1 = bra, 0–0.5 = svagt, &lt; 0 = sämre än riskfri ränta.
              Beräknas per trade (inte annualiserat).
            </p>
            <p style={{ margin: "0 0 6px", color: C.text, fontWeight: 600 }}>Max drawdown (strategin)</p>
            <p style={{ margin: "0 0 12px" }}>
              Beräknas på egenkapitalkurvan trade för trade — hur mycket strategins kapital föll
              från sin högsta punkt. Mäter strategins faktiska risk, inte marknadens rörelse.
              Grön &lt; 10%, gul &lt; 25%, röd ≥ 25%.
            </p>
            <p style={{ margin: "0 0 6px", color: C.text, fontWeight: 600 }}>Kelly-kriteriet</p>
            <p style={{ margin: "0 0 6px" }}>
              Beräknar den optimala andelen av kapitalet att satsa per trade för att maximera
              långsiktig tillväxt utan att riskera utplåning.
            </p>
            <p style={{ margin: "0 0 6px", fontFamily: "monospace", fontSize: "12px", color: C.accent, background: "#0a0a0a", padding: "6px 10px", borderRadius: "4px", display: "inline-block" }}>
              f* = (b × p − q) / b
            </p>
            <p style={{ margin: "4px 0 6px" }}>
              p = win rate, q = 1 − p, b = genomsnittlig vinst / genomsnittlig förlust
            </p>
            <p style={{ margin: 0, color: C.yellow }}>
              I praktiken används <strong>Half Kelly</strong> (f* ÷ 2) för att minska volatilitet
              och risken för stora drawdowns. Full Kelly är matematiskt optimalt men aggressivt —
              en förlustsvit kan halvera kapitalet snabbt.
            </p>
          </div>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: "11px", color: "#444" }}>
          216 kombinationer per mynt (3 lookbacks × 3 vol-trösklar × 3 exit × 2 SL × 2 TC × 2 regimfilter) × 5 mynt = 1 080 rader.
          Uppdateras varje måndag via GitHub Actions → Backtest.
        </p>
      </div>

      {/* Summering */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0, fontFamily: "monospace" }}>
            Bästa strategi per mynt (alpha vs B&amp;H)
          </p>
          <button
            onClick={() => exportCSV(data)}
            style={{
              background: copied ? `${C.green}22` : "none",
              border: `1px solid ${copied ? C.green : C.border}`,
              color: copied ? C.green : C.textMuted,
              fontSize: "11px", fontFamily: "monospace",
              padding: "4px 14px", borderRadius: "4px", cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Kopierat" : "Kopiera CSV"}
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {summering.map(({ sym, best, alpha }) => (
            <button key={sym}
              onClick={() => setKurvaSym(s => s === sym ? null : sym)}
              style={{
                background: kurvaSym === sym ? `${C.accent}11` : "#0a0a0a",
                border: `1px solid ${kurvaSym === sym ? C.accent : alpha > 0 ? C.green : C.red}44`,
                borderRadius: "6px", padding: "12px 16px", minWidth: "160px",
                cursor: "pointer", textAlign: "left",
                fontFamily: "inherit", color: "inherit",
              }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", color: C.accent, fontFamily: "monospace", fontWeight: 700 }}>{sym}</p>
              {best && <ParamPills r={best} />}
              <p style={{ margin: "6px 0 0", fontSize: "13px", fontFamily: "monospace", color: alpha > 0 ? C.green : C.red, fontWeight: 700 }}>
                {alpha > 0 ? "+" : ""}{Math.round(alpha)}pp alpha
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "9px", color: C.textMuted, fontFamily: "monospace" }}>
                {kurvaSym === sym ? "▲ dölj kurva" : "▼ visa equity-kurva"}
              </p>
            </button>
          ))}
        </div>

        {/* Equity-kurva för valt mynt */}
        {kurvaSym && <EquityKurva best={data[kurvaSym]?.[0]} sym={kurvaSym} />}
      </div>

      {/* Per mynt */}
      {Object.entries(data).map(([symbol, rader]) => {
        const expanded = showAll[symbol];
        const visade   = expanded ? rader : rader.slice(0, 10);
        const senaste  = rader[0];
        return (
          <div key={symbol}>
            <p style={{ fontSize: "13px", color: C.accent, fontFamily: "monospace", fontWeight: 700, margin: "0 0 12px", letterSpacing: "0.08em" }}>
              {symbol} &nbsp;<span style={{ color: C.textMuted, fontWeight: 400, fontSize: "11px" }}>
                {senaste?.period_start} → {senaste?.period_slut} &nbsp;·&nbsp; {rader.length} kombinationer
              </span>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 60px 70px 80px 80px 55px 60px 65px", gap: "4px 12px", padding: "4px 8px", borderBottom: `1px solid ${C.border}` }}>
                {["Parametrar", "Trade", "Win%", "Avg/tr", "Total", "B&H", "Sharpe", "MaxDD", "Kelly"].map(h => (
                  <span key={h} style={{ fontSize: "9px", color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "monospace" }}>{h}</span>
                ))}
              </div>

              {visade.map(r => {
                const tot      = r.total_avkastning;
                const bh       = r.buyhold_avkastning;
                const alpha    = tot != null && bh != null ? tot - bh : null;
                const kelly    = r.kelly_fraction;
                const halfKelly = kelly != null ? Math.round(kelly / 2) : null;
                const kellyColor = kelly == null ? C.textMuted : kelly >= 20 ? C.green : kelly >= 8 ? C.yellow : C.red;
                return (
                  <div key={r.strategi} style={{
                    display: "grid", gridTemplateColumns: "1fr 50px 60px 70px 80px 80px 55px 60px 65px",
                    gap: "4px 12px", padding: "8px 8px",
                    borderBottom: `1px solid ${C.border}18`,
                    background: alpha > 0 ? `${C.green}08` : "transparent",
                  }}>
                    <span><ParamPills r={r} /></span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: C.textMuted }}>{r.antal_trades ?? "–"}</span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: (r.vinstrate ?? 0) >= 50 ? C.green : C.red }}>
                      {r.vinstrate != null ? `${r.vinstrate}%` : "–"}
                    </span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: (r.avg_avkastning ?? 0) >= 0 ? C.green : C.red }}>
                      {r.avg_avkastning != null ? `${r.avg_avkastning > 0 ? "+" : ""}${r.avg_avkastning}%` : "–"}
                    </span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: alpha > 0 ? C.green : alpha < 0 ? C.red : C.yellow, fontWeight: 700 }}>
                      {tot != null ? `${tot > 0 ? "+" : ""}${tot}%` : "–"}
                      {alpha != null && <span style={{ fontSize: "9px", display: "block", color: alpha > 0 ? C.green : C.red }}>({alpha > 0 ? "+" : ""}{Math.round(alpha)}pp)</span>}
                    </span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: (bh ?? 0) >= 0 ? C.green : C.red }}>
                      {bh != null ? `${bh > 0 ? "+" : ""}${bh}%` : "–"}
                    </span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: (r.sharpe ?? 0) >= 0.5 ? C.green : (r.sharpe ?? 0) >= 0 ? C.yellow : C.red }}>
                      {r.sharpe != null ? r.sharpe : "–"}
                    </span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: (r.max_drawdown ?? 100) < 10 ? C.green : (r.max_drawdown ?? 100) < 25 ? C.yellow : C.red }}>
                      {r.max_drawdown != null ? `-${r.max_drawdown}%` : "–"}
                    </span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: kellyColor }}>
                      {kelly != null ? `${Math.round(kelly)}%` : "–"}
                      {halfKelly != null && <span style={{ fontSize: "9px", display: "block", color: C.textMuted }}>½K {halfKelly}%</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {rader.length > 10 && (
              <button
                onClick={() => setShowAll(s => ({ ...s, [symbol]: !s[symbol] }))}
                style={{ marginTop: "10px", background: "none", border: `1px solid ${C.border}`, color: C.textMuted, fontSize: "11px", fontFamily: "monospace", padding: "4px 12px", borderRadius: "4px", cursor: "pointer" }}
              >
                {expanded ? `Visa färre ▲` : `Visa alla ${rader.length} ▼`}
              </button>
            )}
          </div>
        );
      })}

      <p style={{ fontSize: "11px", color: "#444", margin: 0 }}>
        Uppdateras automatiskt varje måndag via GitHub Actions → Backtest. 216 kombinationer × 5 mynt = 1 080 rader.
      </p>
    </div>
  );
}

function FeedsTab() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proxyResults, setProxyResults] = useState(null);
  const [proxyLoading, setProxyLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  async function testa() {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/admin/test-feeds");
      setResults(await res.json());
    } catch { setResults([]); }
    setLoading(false);
  }

  async function testaProxy() {
    setProxyLoading(true);
    setProxyResults(null);
    try {
      const res = await fetch("/api/admin/test-proxy");
      setProxyResults(await res.json());
    } catch { setProxyResults([]); }
    setProxyLoading(false);
  }

  const ok = results?.filter(r => r.ok).length ?? 0;
  const fel = results?.filter(r => !r.ok).length ?? 0;
  const pOk = proxyResults?.filter(r => r.ok).length ?? 0;
  const pFel = proxyResults?.filter(r => !r.ok).length ?? 0;

  return (
    <div>
      {/* Direkttest (admin-panels normala test) */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <button onClick={testa} disabled={loading} style={{
          padding: "10px 20px", background: C.surface, border: `1px solid ${C.border}`,
          color: C.accent, fontFamily: "Georgia, serif", fontSize: "13px",
          borderRadius: "4px", cursor: loading ? "wait" : "pointer",
        }}>
          {loading ? "Testar feeds…" : "Testa alla feeds nu"}
        </button>
        {results && (
          <span style={{ fontSize: "13px", fontFamily: "monospace" }}>
            <span style={{ color: C.green }}>{ok} OK</span>
            {" · "}
            <span style={{ color: C.red }}>{fel} FEL</span>
          </span>
        )}
      </div>

      {loading && <p style={{ color: C.textMuted, fontSize: "13px", fontFamily: "monospace" }}>Testar {35} feeds från Vercels servrar…</p>}

      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "32px" }}>
          {results.map(r => (
            <div key={r.url} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "8px 12px", background: C.surface,
              border: `1px solid ${r.ok ? "#4ade8022" : "#f8717122"}`,
              borderRadius: "4px", fontSize: "13px", fontFamily: "monospace",
            }}>
              <span style={{ color: r.ok ? C.green : C.red, minWidth: "28px" }}>{r.ok ? "✓" : "✗"}</span>
              <span style={{ color: C.text, minWidth: "180px" }}>{r.namn}</span>
              <span style={{ color: r.ok ? C.green : C.red, minWidth: "80px", fontSize: "11px" }}>
                {r.ok ? `${r.antal} artiklar` : `HTTP ${r.status || r.error}`}
              </span>
              <span style={{ color: C.textMuted, fontSize: "11px" }}>{r.ms}ms</span>
            </div>
          ))}
        </div>
      )}

      {/* Proxy-diagnostik — visar exakt vad agent.py ser */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "24px" }}>
        <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "12px", fontFamily: "monospace" }}>
          Proxy-diagnostik: anropar /api/rss-proxy exakt som agent.py gör. Avslöjar om proxyn returnerar HTML/fel istället för RSS.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <button onClick={testaProxy} disabled={proxyLoading} style={{
            padding: "10px 20px", background: C.surface, border: `1px solid ${C.border}`,
            color: "#a78bfa", fontFamily: "Georgia, serif", fontSize: "13px",
            borderRadius: "4px", cursor: proxyLoading ? "wait" : "pointer",
          }}>
            {proxyLoading ? "Testar proxy…" : "Testa via proxy (som agent.py)"}
          </button>
          {proxyResults && (
            <span style={{ fontSize: "13px", fontFamily: "monospace" }}>
              <span style={{ color: C.green }}>{pOk} OK</span>
              {" · "}
              <span style={{ color: C.red }}>{pFel} FEL</span>
            </span>
          )}
        </div>

        {proxyLoading && <p style={{ color: C.textMuted, fontSize: "13px", fontFamily: "monospace" }}>Testar via proxy…</p>}

        {proxyResults && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {proxyResults.map((r, i) => (
              <div key={r.url} style={{ border: `1px solid ${r.ok ? "#4ade8022" : "#f8717122"}`, borderRadius: "4px", overflow: "hidden" }}>
                <div
                  onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "8px 12px", background: C.surface,
                    fontSize: "13px", fontFamily: "monospace", cursor: "pointer",
                  }}
                >
                  <span style={{ color: r.ok ? C.green : C.red, minWidth: "28px" }}>{r.ok ? "✓" : "✗"}</span>
                  <span style={{ color: C.text, minWidth: "160px" }}>{r.namn}</span>
                  <span style={{ color: r.ok ? C.green : C.red, minWidth: "90px", fontSize: "11px" }}>
                    {r.ok ? `${r.antal} items` : r.error ? r.error : `HTTP ${r.status}`}
                  </span>
                  <span style={{ color: C.textMuted, fontSize: "10px", minWidth: "80px" }}>
                    proxy:{r.proxiedStatus} · {r.ms}ms
                  </span>
                  <span style={{ color: C.textMuted, fontSize: "10px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.contentType}
                  </span>
                  <span style={{ color: C.textMuted, fontSize: "10px" }}>{expanded[i] ? "▲" : "▼"}</span>
                </div>
                {expanded[i] && (
                  <div style={{ padding: "8px 12px", background: "#0a0a0a", fontSize: "11px", fontFamily: "monospace", color: "#888", wordBreak: "break-all" }}>
                    <div style={{ color: "#666", marginBottom: "4px" }}>Snippet (400 tecken):</div>
                    <div style={{ color: r.antal > 0 ? "#4ade80" : "#f87171" }}>{r.snippet || "(tom)"}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NyhetsloggTab() {
  const [logg, setLogg]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${SB_URL}/rest/v1/nyhetslog?order=skapad.desc&limit=200`,
          { headers: sbHeaders() }
        );
        setLogg(res.ok ? await res.json() : []);
      } catch { setLogg([]); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p style={{ color: C.textMuted }}>Laddar nyhetslogg…</p>;
  if (!logg?.length) return (
    <p style={{ color: C.textMuted, fontSize: "14px" }}>
      Ingen logg ännu. Loggas automatiskt nästa gång en agent väljer en nyhet.
    </p>
  );

  // Gruppera per dag
  const dagGrupper = {};
  for (const rad of logg) {
    const dag = rad.skapad?.slice(0, 10) || "okänt";
    if (!dagGrupper[dag]) dagGrupper[dag] = [];
    dagGrupper[dag].push(rad);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {Object.entries(dagGrupper).map(([dag, rader]) => (
        <div key={dag}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 12px" }}>
            {dag} &nbsp;·&nbsp; {rader.length} körningar
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {rader.map(rad => {
              const v = rad.vald || {};
              const tid = rad.skapad ? new Date(rad.skapad).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) : "";
              const open = expanded[rad.id];
              return (
                <div key={rad.id} style={{ background: "#0d0d0d", border: `1px solid ${rad.publicerad ? C.green + "33" : C.border}`, borderRadius: "6px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>{tid}</span>
                    <span style={{ fontSize: "12px", color: C.accent, fontFamily: "monospace" }}>{rad.agent}</span>
                    <span style={{ fontSize: "10px", color: rad.publicerad ? C.green : C.red, border: `1px solid currentColor`, borderRadius: "3px", padding: "1px 5px", fontFamily: "monospace" }}>
                      {rad.publicerad ? "PUBLICERAD" : "EJ PUBLICERAD"}
                    </span>
                  </div>

                  {/* Vald nyhet */}
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "10px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}>Vald nyhet: </span>
                    {v.url ? (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: C.accentDim, textDecoration: "none", borderBottom: `1px solid ${C.accentDim}40` }}>
                        {v.rubrik}
                      </a>
                    ) : (
                      <span style={{ fontSize: "13px", color: C.accentDim }}>{v.rubrik}</span>
                    )}
                    {v.kalla && <span style={{ fontSize: "11px", color: "#555", marginLeft: "8px" }}>{v.kalla}</span>}
                  </div>

                  {/* Länk till publicerad artikel */}
                  {rad.artikel_id && (
                    <div style={{ marginBottom: "8px" }}>
                      <a href={`/artikel/${rad.artikel_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: C.green, textDecoration: "none" }}>
                        → Se artikel #{rad.artikel_id}
                      </a>
                    </div>
                  )}

                  {/* RSS-källstatus */}
                  {Array.isArray(rad.rss_resultat) && rad.rss_resultat.length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                      <button
                        onClick={() => setExpanded(e => ({ ...e, [`rss_${rad.id}`]: !e[`rss_${rad.id}`] }))}
                        style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "11px", padding: "0", fontFamily: "monospace" }}
                      >
                        {expanded[`rss_${rad.id}`] ? "▲ dölj RSS-källor" : `▼ visa RSS-källor (${rad.rss_resultat.filter(r => r.ok).length}/${rad.rss_resultat.length} lyckades)`}
                      </button>
                      {expanded[`rss_${rad.id}`] && (
                        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "3px" }}>
                          {rad.rss_resultat.map((r, i) => (
                            <div key={i} style={{ fontSize: "11px", display: "flex", gap: "8px", alignItems: "baseline", fontFamily: "monospace" }}>
                              <span style={{ color: r.ok ? C.green : C.red, minWidth: "12px" }}>{r.ok ? "✓" : "✗"}</span>
                              <span style={{ color: r.ok ? C.textMuted : "#555", minWidth: "180px" }}>{r.kalla}</span>
                              {r.ok
                                ? <span style={{ color: "#555" }}>{r.antal} artiklar</span>
                                : <span style={{ color: "#553333" }}>{r.fel}</span>
                              }
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandera alla utvärderade */}
                  <button
                    onClick={() => setExpanded(e => ({ ...e, [rad.id]: !open }))}
                    style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "11px", padding: "0", fontFamily: "monospace" }}
                  >
                    {open ? "▲ dölj" : `▼ visa alla ${rad.antal || 0} utvärderade nyheter`}
                  </button>

                  {open && Array.isArray(rad.utvärderade) && (
                    <div style={{ marginTop: "10px", borderTop: `1px solid ${C.border}`, paddingTop: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                      {rad.utvärderade.map((n, i) => (
                        <div key={i} style={{ fontSize: "12px", display: "flex", gap: "8px", alignItems: "baseline" }}>
                          <span style={{ color: "#444", fontFamily: "monospace", minWidth: "18px" }}>{i + 1}.</span>
                          {n.url ? (
                            <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ color: C.textMuted, textDecoration: "none" }}>{n.rubrik}</a>
                          ) : (
                            <span style={{ color: C.textMuted }}>{n.rubrik}</span>
                          )}
                          <span style={{ color: "#444", fontSize: "11px", flexShrink: 0 }}>{n.kalla}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ApiStatusTab() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  async function fetchHealth() {
    try {
      const res = await fetch("/api/chatt");
      if (res.ok) { setHealth(await res.json()); setLastFetch(Date.now()); }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 10000);
    return () => clearInterval(id);
  }, []);

  function ProviderCard({ name, model, p }) {
    const colors = { ok: C.green, warn: C.yellow, limited: C.red, error: C.red, unknown: C.textMuted };
    const labels = { ok: "OK", warn: "LÅGT", limited: "STOPP", error: "FEL", unknown: "OKÄND" };
    const s = p?.status ?? "unknown";
    const col = colors[s];
    const pct = (p?.remaining != null && p?.limit) ? Math.round(p.remaining / p.limit * 100) : null;
    const resetIn = p?.resetAt ? Math.max(0, Math.ceil((new Date(p.resetAt).getTime() - Date.now()) / 1000)) : null;
    return (
      <div style={{ background: C.surface, border: `1px solid ${s === "limited" ? C.red + "60" : s === "warn" ? C.yellow + "40" : C.border}`, borderRadius: "8px", padding: "20px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: col, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "15px", color: C.text }}>{name}</span>
          <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>{model}</span>
          <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 700, color: col, fontFamily: "monospace", letterSpacing: "0.08em" }}>{labels[s]}</span>
        </div>
        {p?.keySet === false && (
          <p style={{ fontSize: "12px", color: C.red, margin: "0 0 8px", fontFamily: "monospace" }}>⚠ API-nyckel saknas i Vercel</p>
        )}
        {pct !== null && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ height: "4px", background: C.border, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct > 50 ? C.green : pct > 20 ? C.yellow : C.red, transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: "12px", color: C.textMuted, margin: "4px 0 0", fontFamily: "monospace" }}>
              {p.remaining} / {p.limit} req/min kvar
            </p>
          </div>
        )}
        {pct === null && p?.status !== "unknown" && (
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, fontFamily: "monospace" }}>Antal kvar: ingen data ännu (uppdateras efter nästa anrop)</p>
        )}
        {s === "limited" && resetIn !== null && (
          <p style={{ fontSize: "12px", color: C.red, margin: "4px 0 0", fontFamily: "monospace" }}>Rate-limit · reset om ~{resetIn}s</p>
        )}
        {p?.ts ? <p style={{ fontSize: "11px", color: C.textMuted, margin: "8px 0 0", fontFamily: "monospace" }}>Senast sedd: {new Date(p.ts).toLocaleTimeString("sv-SE")}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 400, color: C.accent, margin: 0 }}>AI-leverantörer</h2>
        <button onClick={fetchHealth} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "4px", color: C.textMuted, padding: "4px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "Georgia, serif" }}>↻ Uppdatera</button>
        {lastFetch && <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>Auto-refresh var 10s · {new Date(lastFetch).toLocaleTimeString("sv-SE")}</span>}
      </div>

      {loading ? <p style={{ color: C.textMuted }}>Hämtar status…</p> : (
        <>
          <ProviderCard name="Groq" model="llama-3.3-70b-versatile · primär" p={health?.groq} />
          <ProviderCard name="Gemini" model="2.0 Flash / 1.5 Flash · fallback 1" p={health?.gemini} />
          <ProviderCard name="Codestral" model="codestral-latest · fallback 2" p={health?.codestral} />
          <ProviderCard name="Cerebras" model="llama3.1-8b · fallback 3" p={health?.cerebras} />
          <ProviderCard name="OpenRouter" model="llama-3.3-70b (free) · nyhetskanal" p={health?.or} />

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px", marginTop: "8px" }}>
            <p style={{ fontSize: "11px", color: C.accentDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px", fontFamily: "monospace" }}>Tips</p>
            <ul style={{ margin: 0, paddingLeft: "20px", color: C.textMuted, fontSize: "13px", lineHeight: 1.8 }}>
              <li>Fallback-kedja: <b style={{ color: C.text }}>Groq → Gemini → Codestral → Cerebras</b>. Systemet byter automatiskt.</li>
              <li>Status uppdateras bara när en riktig debatt körs — inte vid polling.</li>
              <li>Skapa en <b style={{ color: C.text }}>separat Groq-nyckel</b> för agent.py (GitHub Actions) för att isolera trafiken.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    inkorg:     { label: "INKORG",     color: C.yellow, bg: "#1a1200" },
    publicerad: { label: "PUBLICERAD", color: C.green,  bg: "#052011" },
    avvisad:    { label: "AVVISAD",    color: C.red,    bg: "#200505" },
  }[status] || { label: status?.toUpperCase(), color: C.textMuted, bg: "#111" };
  return (
    <span style={{ fontSize:"11px", fontWeight:700, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}40`, borderRadius:"4px", padding:"3px 8px", fontFamily:"monospace", letterSpacing:"0.08em" }}>
      {cfg.label}
    </span>
  );
}

function ScoreBar({ label, value }) {
  if (!value) return null;
  const color = value >= 8 ? C.green : value >= 6 ? C.yellow : C.red;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"4px" }}>
      <span style={{ color:C.textMuted }}>{label}</span>
      <span style={{ color, fontFamily:"monospace", fontWeight:700 }}>{value}/10</span>
    </div>
  );
}

function pct(a, b) {
  if (!b) return "–";
  return (a / b * 100).toFixed(1) + "%";
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
      <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: "monospace" }}>{label}</p>
      <p style={{ fontSize: "36px", fontWeight: 400, color: color || C.accent, margin: "0 0 4px", fontFamily: "monospace" }}>{value}</p>
      {sub && <p style={{ color: C.textMuted, fontSize: "13px", margin: 0 }}>{sub}</p>}
    </div>
  );
}

function MarketsTab() {
  const [oppna, setOppna]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [msg, setMsg]               = useState("");
  const [editId, setEditId]               = useState(null);
  const [editTitel, setEditTitel]         = useState("");
  const [editBeskrivning, setEditBeskrivning] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [oRes, bRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/markets?status=eq.%C3%B6ppen&order=skapad.desc`, { headers: sbHeaders() }),
      fetch(`${SB_URL}/rest/v1/agent_bets?select=market_id`,                    { headers: sbHeaders() }),
    ]);
    const bets = bRes.ok ? await bRes.json() : [];
    const betCount = {};
    for (const b of bets) betCount[b.market_id] = (betCount[b.market_id] || 0) + 1;
    const withBets = arr => (arr || []).map(m => ({ ...m, betAntal: betCount[m.id] || 0 }));
    setOppna(oRes.ok ? withBets(await oRes.json()) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sparaMarket(id) {
    setMsg("");
    const res = await fetch(`${SB_URL}/rest/v1/markets?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...sbHeaders(), "Prefer": "return=minimal" },
      body: JSON.stringify({ titel: editTitel.trim(), beskrivning: editBeskrivning.trim() || null }),
    });
    setMsg(res.ok ? "✓ Market uppdaterat." : "✗ Fel vid uppdatering.");
    setEditId(null);
    load();
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <p style={{ color:C.textMuted, fontSize:"14px", margin:0 }}>
          Agenter publicerar prediction markets automatiskt. Redigera titel eller beskrivning vid behov.
        </p>
        <button onClick={load} style={{ background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"6px 14px", cursor:"pointer", fontFamily:"Georgia, serif", fontSize:"13px" }}>↻</button>
      </div>
      {msg && <p style={{ color: msg.startsWith("✓") ? C.green : C.red, fontSize:"14px", marginBottom:"16px" }}>{msg}</p>}
      {loading && <p style={{ color:C.textMuted }}>Laddar…</p>}
      {!loading && oppna.length === 0 && (
        <p style={{ color:C.textMuted, fontSize:"14px", fontStyle:"italic" }}>Inga öppna markets just nu.</p>
      )}

      {oppna.map(m => (
        <div key={m.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"16px 20px", marginBottom:"12px" }}>
          <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 8px 0" }}>
            {m.kategori} · Deadline {m.deadline}
          </p>
          {editId === m.id ? (
            <div style={{ marginBottom:"10px" }}>
              <input
                value={editTitel}
                onChange={e => setEditTitel(e.target.value)}
                placeholder="Titel"
                style={{ width:"100%", boxSizing:"border-box", background:"#111", border:`1px solid ${C.accent}60`, borderRadius:"4px", padding:"7px 10px", color:C.text, fontSize:"15px", fontFamily:"Georgia, serif", marginBottom:"8px" }}
              />
              <textarea
                value={editBeskrivning}
                onChange={e => setEditBeskrivning(e.target.value)}
                placeholder="Beskrivning (valfritt)"
                rows={2}
                style={{ width:"100%", boxSizing:"border-box", background:"#111", border:`1px solid ${C.border}`, borderRadius:"4px", padding:"7px 10px", color:C.textMuted, fontSize:"13px", fontFamily:"Georgia, serif", resize:"vertical", marginBottom:"8px" }}
              />
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={() => sparaMarket(m.id)} style={{ background:"#052011", border:`1px solid ${C.green}50`, color:C.green, borderRadius:"4px", padding:"7px 14px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                  Spara
                </button>
                <button onClick={() => setEditId(null)} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.textMuted, borderRadius:"4px", padding:"7px 12px", fontSize:"13px", cursor:"pointer" }}>
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"flex-start", gap:"10px", marginBottom:"8px" }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:"16px", color:C.accent, margin:"0 0 4px 0" }}>{m.titel}</p>
                {m.beskrivning && <p style={{ fontSize:"13px", color:C.textMuted, margin:0 }}>{m.beskrivning}</p>}
              </div>
              <button onClick={() => { setEditId(m.id); setEditTitel(m.titel); setEditBeskrivning(m.beskrivning || ""); }} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.textMuted, borderRadius:"4px", padding:"4px 10px", fontSize:"12px", cursor:"pointer", flexShrink:0 }}>
                Redigera
              </button>
            </div>
          )}
          <p style={{ color:C.textMuted, fontSize:"12px", fontFamily:"monospace", margin:0 }}>
            {m.betAntal} bets · Skapad {new Date(m.skapad).toLocaleDateString("sv-SE")}
          </p>
        </div>
      ))}
    </div>
  );
}
    </div>
  );
}

function BeslutApiTab() {
  const [stats, setStats]     = useState(null);
  const [log, setLog]         = useState([]);
  const [keys, setKeys]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newLimit, setNewLimit] = useState(100);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);

  const pw = typeof window !== "undefined" ? localStorage.getItem("admin_pw") || "" : "";

  async function load() {
    setLoading(true);
    try {
      const [statsRes, logRes, keysRes] = await Promise.all([
        fetch(`/api/admin/beslut?action=stats&pw=${encodeURIComponent(pw)}`),
        fetch(`/api/admin/beslut?action=log&pw=${encodeURIComponent(pw)}`),
        fetch(`/api/admin/beslut?action=keys&pw=${encodeURIComponent(pw)}`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (logRes.ok)   setLog(await logRes.json());
      if (keysRes.ok)  setKeys(await keysRes.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createKey() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    setCreatedKey(null);
    try {
      const res = await fetch(`/api/admin/beslut?pw=${encodeURIComponent(pw)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ action: "create", name: newName.trim(), rate_limit: newLimit }),
      });
      const data = await res.json();
      const key = Array.isArray(data) ? data[0]?.key : data?.key;
      if (key) { setCreatedKey(key); setNewName(""); load(); }
    } finally { setCreating(false); }
  }

  async function toggleKey(id, aktiv) {
    await fetch(`/api/admin/beslut?pw=${encodeURIComponent(pw)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ action: "toggle", id, aktiv }),
    });
    load();
  }

  const recColor = r => r === "positiv" ? C.green : r === "negativ" ? C.red : r === "delad" ? "#60a5fa" : C.textMuted;

  if (loading) return <p style={{ color: C.textMuted }}>Laddar Decision API-data…</p>;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "32px" }}>
        {[
          ["Totalt", stats?.total ?? "—"],
          ["Idag", stats?.today ?? "—"],
          ["Senaste 7 dagarna", stats?.week ?? "—"],
          ["Snittlatens", stats?.avg_latency_ms ? `${stats.avg_latency_ms}ms` : "—"],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px 20px" }}>
            <p style={{ fontSize: "11px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 6px" }}>{lbl}</p>
            <p style={{ fontSize: "28px", color: C.accent, margin: 0, fontFamily: "monospace" }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Skapa API-nyckel */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px", marginBottom: "32px" }}>
        <p style={{ fontSize: "13px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 16px" }}>Skapa ny API-nyckel</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: "180px" }}>
            <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 6px" }}>Företag / Namn</p>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Acme AB" style={{ ...inp }} />
          </div>
          <div style={{ flex: 1, minWidth: "100px" }}>
            <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 6px" }}>Req/timme</p>
            <input type="number" value={newLimit} onChange={e => setNewLimit(Number(e.target.value))} style={{ ...inp }} />
          </div>
          <button onClick={createKey} disabled={creating || !newName.trim()} style={{ padding: "10px 24px", background: C.accent, color: "#0a0a0a", border: "none", borderRadius: "4px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "14px", fontWeight: 700, opacity: !newName.trim() ? 0.5 : 1 }}>
            {creating ? "Skapar…" : "Skapa →"}
          </button>
        </div>
        {createdKey && (
          <div style={{ marginTop: "16px", background: "#0a1a0a", border: "1px solid #1a4a1a", borderRadius: "6px", padding: "14px 16px" }}>
            <p style={{ fontSize: "11px", color: C.green, fontFamily: "monospace", margin: "0 0 6px", textTransform: "uppercase" }}>Nyckel skapad — kopiera nu, visas bara en gång</p>
            <code style={{ fontSize: "14px", color: C.green, wordBreak: "break-all" }}>{createdKey}</code>
          </div>
        )}
      </div>

      {/* Befintliga nycklar */}
      {keys.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "13px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 12px" }}>API-nycklar ({keys.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.border, borderRadius: "8px", overflow: "hidden" }}>
            {keys.map(k => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 20px", background: C.surface, flexWrap: "wrap" }}>
                <code style={{ fontSize: "12px", color: k.aktiv ? C.green : C.textMuted, flex: 1, minWidth: "180px", wordBreak: "break-all" }}>{k.key}</code>
                <span style={{ fontSize: "13px", color: C.text, flex: 1, minWidth: "120px" }}>{k.name}</span>
                <span style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", flexShrink: 0 }}>{k.rate_limit} req/h</span>
                <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", flexShrink: 0 }}>{new Date(k.skapad).toLocaleDateString("sv-SE")}</span>
                <button onClick={() => toggleKey(k.id, !k.aktiv)} style={{ fontSize: "12px", color: k.aktiv ? C.red : C.green, background: "transparent", border: `1px solid ${k.aktiv ? C.red + "40" : C.green + "40"}`, borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontFamily: "Georgia, serif", flexShrink: 0 }}>
                  {k.aktiv ? "Inaktivera" : "Aktivera"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request-logg */}
      <div>
        <p style={{ fontSize: "13px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", margin: "0 0 12px" }}>Senaste anrop ({log.length})</p>
        {log.length === 0 ? (
          <p style={{ color: C.textMuted, fontSize: "14px" }}>Inga anrop loggade ännu.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.border, borderRadius: "8px", overflow: "hidden" }}>
            {log.map(r => (
              <div key={r.id} style={{ padding: "12px 18px", background: C.surface, display: "flex", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", flexShrink: 0, width: "90px" }}>
                  {new Date(r.skapad).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span style={{ fontSize: "11px", color: r.api_key ? "#f59e0b" : C.textMuted, fontFamily: "monospace", flexShrink: 0, width: "60px" }}>
                  {r.api_key ? "nyckel" : "fri"}
                </span>
                <p style={{ flex: 1, margin: 0, fontSize: "13px", color: C.text, minWidth: "160px" }}>
                  {r.question?.length > 80 ? r.question.slice(0, 80) + "…" : r.question}
                </p>
                <span style={{ fontSize: "12px", color: recColor(r.recommendation), fontFamily: "monospace", flexShrink: 0 }}>
                  {r.recommendation} {r.probability != null ? `· ${Math.round(r.probability * 100)}%` : ""}
                </span>
                <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", flexShrink: 0 }}>{r.latency_ms}ms</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatningTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
      const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const [evAll, ev7, forslag, artiklar, visits7, visits14] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/debatt_events?select=event_type,amne,skapad&order=skapad.desc&limit=2000`, { headers: h }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/debatt_events?select=event_type,amne&skapad=gte.${since7}`, { headers: h }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/amnesforslag?select=skapad`, { headers: h }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/artiklar?select=lasningar,rubrik,taggar,kalla&order=lasningar.desc.nullslast&limit=10`, { headers: h }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/visitor_sessions?select=visitor_id&skapad=gte.${since7}`, { headers: h }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/visitor_sessions?select=visitor_id,skapad&skapad=gte.${since14}`, { headers: h }).then(r => r.json()),
      ]);
      const countType = (arr, type) => arr.filter(e => e.event_type === type).length;
      const topAmnen = Object.entries(
        evAll.filter(e => e.event_type === "start" && e.amne)
          .reduce((acc, e) => { acc[e.amne] = (acc[e.amne] || 0) + 1; return acc; }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 5);
      // Retention: besökare från dag -14 till -7 som också besökt senaste 7 dagarna
      const recent = new Set((Array.isArray(visits7) ? visits7 : []).map(v => v.visitor_id));
      const cohort = new Set((Array.isArray(visits14) ? visits14 : [])
        .filter(v => new Date(v.skapad) < new Date(since7))
        .map(v => v.visitor_id));
      const returning = [...cohort].filter(id => recent.has(id)).length;

      setData({
        allStart: countType(evAll, "start"), allKlar: countType(evAll, "klar"),
        weekStart: countType(ev7, "start"), weekKlar: countType(ev7, "klar"),
        forslagTotal: Array.isArray(forslag) ? forslag.length : 0,
        topAmnen, artiklar: Array.isArray(artiklar) ? artiklar : [],
        cohortSize: cohort.size, returning,
        uniqueVisitors7: recent.size,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p style={{ color: C.textMuted }}>Laddar…</p>;
  if (!data) return <p style={{ color: C.red }}>Kunde inte ladda data.</p>;

  const { allStart, allKlar, weekStart, weekKlar, forslagTotal, topAmnen, artiklar, cohortSize, returning, uniqueVisitors7 } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <p style={{ color: C.textMuted, fontSize: "13px", margin: 0 }}>Senaste 7 dagarna visas i parentes.</p>

      {/* De 3 nyckeltalen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <MetricCard
          label="7-dagars retention"
          value={pct(returning, cohortSize)}
          sub={`${returning} av ${cohortSize} återvände · ${uniqueVisitors7} unika besökare denna vecka`}
          color={cohortSize && returning / cohortSize > 0.15 ? C.green : C.yellow}
        />
        <MetricCard
          label="Completion rate"
          value={pct(allKlar, allStart)}
          sub={`${allKlar} av ${allStart} fullföljda · ${pct(weekKlar, weekStart)} denna vecka`}
          color={allStart && allKlar / allStart > 0.5 ? C.green : C.yellow}
        />
        <MetricCard
          label="Send-to-agents rate"
          value={pct(forslagTotal, allKlar)}
          sub={`${forslagTotal} förslag av ${allKlar} avslutade debatter`}
          color={allKlar && forslagTotal / allKlar > 0.15 ? C.green : C.yellow}
        />
      </div>

      {/* Populäraste ämnen */}
      {topAmnen.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>Populäraste debattämnen (totalt)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topAmnen.map(([amne, count], i) => (
              <div key={amne} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: C.textMuted, fontSize: "11px", fontFamily: "monospace", width: "16px" }}>{i + 1}</span>
                <div style={{ flex: 1, background: C.border, borderRadius: "4px", height: "6px" }}>
                  <div style={{ width: `${(count / topAmnen[0][1]) * 100}%`, background: C.accent, height: "6px", borderRadius: "4px" }} />
                </div>
                <span style={{ color: C.text, fontSize: "13px", flex: 3 }}>{amne}</span>
                <span style={{ color: C.textMuted, fontSize: "12px", fontFamily: "monospace" }}>{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mest lästa artiklar */}
      {artiklar.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>Mest lästa artiklar</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {artiklar.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: C.textMuted, fontSize: "11px", fontFamily: "monospace", width: "16px" }}>{i + 1}</span>
                <span style={{ color: a.kalla === "ai" ? "#4a9eff" : C.accent, fontSize: "10px", fontFamily: "monospace", width: "60px" }}>{a.kalla === "ai" ? "AI" : "MÄNNISKA"}</span>
                <span style={{ color: C.text, fontSize: "13px", flex: 1 }}>{a.rubrik}</span>
                <span style={{ color: C.textMuted, fontSize: "12px", fontFamily: "monospace" }}>{a.lasningar ?? 0} läsn.</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const AI_COLORS = { groq: "#4a9eff", gemini: "#4ade80", openrouter: "#f8954d", cerebras: "#a78bfa", sambanova: "#fb923c", none: "#f87171" };
const GROQ_DAILY_LIMIT = 100_000;

// ── VeckorapporterTab ─────────────────────────────────────────────────────────

function delta(n) {
  if (n == null || n === 0) return <span style={{ color: C.textMuted }}>–</span>;
  return n > 0
    ? <span style={{ color: C.green }}>+{n} ↑</span>
    : <span style={{ color: C.red }}>{n} ↓</span>;
}

function VeckorapporterTab() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => { setReports(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: C.textMuted }}>Laddar rapporter…</p>;
  if (!reports?.length) return <p style={{ color: C.textMuted }}>Inga rapporter ännu. Kör Codestral via GitHub Actions för att generera den första.</p>;

  const rowStyle = { borderBottom: `1px solid ${C.border}`, padding: "12px 8px", fontSize: 13 };
  const hdStyle  = { ...rowStyle, color: C.accentDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 400, color: C.accent, marginBottom: 24 }}>Veckorapporter — AI-bus</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Vecka","Artiklar","Δ","Repliker%","Snittpoäng","Debatter","Nyhetskanal","Prenumeranter","API-anrop","Kritiska fel","Impl.","Rej."].map(h => (
                <th key={h} style={hdStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map(r => {
              const p   = r.plattform || {};
              const vs  = r.vs_prev_week;
              const bus = r.ai_bus || {};
              return (
                <tr key={r.week} style={{ background: "transparent" }}>
                  <td style={{ ...rowStyle, color: C.accent, fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.week}</td>
                  <td style={rowStyle}>{p.artiklar_publicerade ?? "–"}</td>
                  <td style={rowStyle}>{delta(vs?.artiklar_delta)}</td>
                  <td style={rowStyle}>{p.replik_ratio_pct != null ? `${p.replik_ratio_pct}%` : "–"}</td>
                  <td style={rowStyle}>{p.genomsnittlig_score ?? "–"}</td>
                  <td style={rowStyle}>{p.direktdebatter ?? "–"}</td>
                  <td style={rowStyle}>{p.nyhetskanal_korningar ?? "–"}</td>
                  <td style={rowStyle}>{p.nya_prenumeranter ?? "–"}</td>
                  <td style={rowStyle}>{p.api_anrop ?? "–"}</td>
                  <td style={{ ...rowStyle, color: r.kritiska_fel > 0 ? C.red : C.green }}>{r.kritiska_fel ?? "–"}</td>
                  <td style={{ ...rowStyle, color: C.green }}>{bus.implemented ?? "–"}</td>
                  <td style={{ ...rowStyle, color: C.textMuted }}>{bus.rejected ?? "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 14, color: C.accentDim, marginBottom: 16, fontFamily: "monospace", textTransform: "uppercase" }}>AI-providers senaste veckan</h3>
        {reports[0] && Object.entries(reports[0].ai_providers || {}).map(([name, p]) => (
          <div key={name} style={{ display: "flex", gap: 16, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ width: 100, color: C.text, fontFamily: "monospace", fontSize: 13 }}>{name}</span>
            <span style={{ color: C.green, fontSize: 13 }}>✓ {p.ok} ok</span>
            {p.rate_limited > 0 && <span style={{ color: C.yellow, fontSize: 13 }}>⚡ {p.rate_limited} rate-limited</span>}
            {p.error > 0       && <span style={{ color: C.red,    fontSize: 13 }}>✗ {p.error} fel</span>}
            {p.avg_latency_ms  && <span style={{ color: C.textMuted, fontSize: 12 }}>{p.avg_latency_ms}ms snitt</span>}
          </div>
        ))}
        {!Object.keys(reports[0]?.ai_providers || {}).length && (
          <p style={{ color: C.textMuted, fontSize: 13 }}>AI-providerdata saknas (ai_log byggs upp gradvis).</p>
        )}
      </div>
    </div>
  );
}

// ── FellogTab ─────────────────────────────────────────────────────────────────
const FEL_FARG = {
  rate_limit:    "#f59e0b",
  ai_fail:       "#f97316",
  rss_fail:      "#60a0d8",
  supabase_fail: "#a78bfa",
  server_error:  "#f87171",
};
const FEL_ETIKETT = {
  rate_limit:    "RATE LIMIT",
  ai_fail:       "AI-FEL",
  rss_fail:      "RSS-FEL",
  supabase_fail: "DB-FEL",
  server_error:  "SERVER-FEL",
};

function FellogTab() {
  const [rows, setRows]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState("alla");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const r = await fetch(
        `${SB_URL}/rest/v1/fel_log?select=*&skapad=gte.${since}&order=skapad.desc&limit=500`,
        { headers: sbHeaders() }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setRows(await r.json());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p style={{ color: C.textMuted }}>Laddar…</p>;
  if (error)   return (
    <div>
      <p style={{ color: C.red }}>Fel: {error}</p>
      <p style={{ color: C.textMuted, fontSize: "13px" }}>
        Om tabellen inte finns ännu: kör <code style={{ color: C.accent }}>supabase_fel_log.sql</code> i Supabase SQL Editor.
      </p>
    </div>
  );
  if (!rows) return null;

  const feltyper = ["alla", "rate_limit", "ai_fail", "rss_fail", "supabase_fail", "server_error"];
  const filtered = filter === "alla" ? rows : rows.filter(r => r.feltyp === filter);

  // Summary counts per type
  const counts = {};
  for (const r of rows) counts[r.feltyp] = (counts[r.feltyp] ?? 0) + 1;

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        {Object.entries(counts).length === 0
          ? <p style={{ color: C.textMuted, fontSize: "14px" }}>Inga fel loggade senaste 7 dagarna.</p>
          : Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([typ, n]) => (
            <div key={typ} style={{ background: C.surface, border: `1px solid ${FEL_FARG[typ] ?? C.border}30`, borderRadius: "8px", padding: "12px 20px", minWidth: "120px" }}>
              <p style={{ fontSize: "22px", fontWeight: 400, color: FEL_FARG[typ] ?? C.text, margin: "0 0 2px", fontFamily: "monospace" }}>{n}</p>
              <p style={{ fontSize: "11px", color: C.textMuted, margin: 0, letterSpacing: "0.08em" }}>{FEL_ETIKETT[typ] ?? typ}</p>
            </div>
          ))
        }
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {feltyper.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            background: filter === t ? `${C.accent}15` : "transparent",
            border: `1px solid ${filter === t ? C.accentDim : C.border}`,
            color: filter === t ? C.accent : C.textMuted,
            padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontFamily: "monospace",
          }}>
            {t === "alla" ? `Alla (${rows.length})` : `${FEL_ETIKETT[t] ?? t} (${counts[t] ?? 0})`}
          </button>
        ))}
        <button onClick={load} style={{ marginLeft: "auto", background: "transparent", color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 14px", cursor: "pointer", fontSize: "12px", fontFamily: "monospace" }}>↻ Uppdatera</button>
      </div>

      {filtered.length === 0
        ? <p style={{ color: C.textMuted, fontSize: "14px" }}>Inga träffar.</p>
        : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "monospace" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Tidpunkt", "Typ", "Källa", "Meddelande", "IP", "Extra"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: C.textMuted, fontWeight: 400, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}20` }}>
                    <td style={{ padding: "7px 10px", color: C.textMuted, whiteSpace: "nowrap" }}>
                      {new Date(r.skapad).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                      <span style={{ color: FEL_FARG[r.feltyp] ?? C.text, fontWeight: 500 }}>
                        {FEL_ETIKETT[r.feltyp] ?? r.feltyp}
                      </span>
                    </td>
                    <td style={{ padding: "7px 10px", color: C.text }}>{r.kalla}</td>
                    <td style={{ padding: "7px 10px", color: C.textMuted, maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={r.meddelande ?? ""}>{r.meddelande ?? "—"}</td>
                    <td style={{ padding: "7px 10px", color: C.textMuted }}>{r.ip ?? "—"}</td>
                    <td style={{ padding: "7px 10px", color: C.textMuted, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={r.extra ? JSON.stringify(r.extra) : ""}>{r.extra ? JSON.stringify(r.extra) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

function AiStatistikTab() {
  const [rows, setRows]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [liveRows, setLiveRows] = useState([]);
  const [liveOk, setLiveOk]     = useState(false);
  const [newIds, setNewIds]     = useState(new Set());
  const latestTsRef             = useRef(null);
  const pollingRef              = useRef(false);
  const scrollRef               = useRef(null);

  // Initial 7-day data load
  useEffect(() => {
    async function load() {
      try {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const res = await fetch(
          `${SB_URL}/rest/v1/ai_log?select=*&ts=gte.${since}&order=ts.desc&limit=2000`,
          { headers: sbHeaders() }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRows(data);
        setLiveRows(data.slice(0, 200));
        if (data.length > 0) latestTsRef.current = data[0].ts;
      } catch (e) { setError(e.message); }
      setLoading(false);
    }
    load();
  }, []);

  // Live polling — starts after initial load, every 3 s
  useEffect(() => {
    if (loading) return;
    pollingRef.current = true;

    async function poll() {
      if (!pollingRef.current) return;
      try {
        const since = new Date(latestTsRef.current ?? Date.now() - 60000).toISOString();
        const res = await fetch(
          `${SB_URL}/rest/v1/ai_log?select=*&ts=gt.${since}&order=ts.desc&limit=100`,
          { headers: sbHeaders() }
        );
        if (res.ok) {
          const fresh = await res.json();
          if (fresh.length > 0) {
            setLiveRows(prev => [...fresh, ...prev].slice(0, 300));
            latestTsRef.current = fresh[0].ts;
            const ids = new Set(fresh.map(r => r.id));
            setNewIds(ids);
            setTimeout(() => setNewIds(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; }), 5000);
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
          }
          setLiveOk(true);
        }
      } catch {}
      if (pollingRef.current) setTimeout(poll, 3000);
    }

    const t = setTimeout(poll, 3000);
    return () => { pollingRef.current = false; clearTimeout(t); setLiveOk(false); };
  }, [loading]);

  if (loading) return <p style={{ color: C.textMuted }}>Laddar AI-statistik…</p>;
  if (error)   return <p style={{ color: C.red }}>Fel: {error}</p>;
  if (!rows || rows.length === 0) return (
    <div>
      <p style={{ color: C.textMuted, fontSize: "14px", marginBottom: "16px" }}>
        Ingen loggdata ännu. Kör SQL-schemat <code style={{ color: C.accent }}>supabase_ai_log.sql</code> i Supabase SQL Editor för att skapa tabellen.
      </p>
    </div>
  );

  // ── Aggregate by date × provider ────────────────────────────────────────
  const byDay = {};
  for (const r of rows) {
    const day = r.ts.slice(0, 10);
    if (!byDay[day]) byDay[day] = { day, groq: 0, gemini: 0, cerebras: 0, sambanova: 0, openrouter: 0, none: 0, errors: 0 };
    byDay[day][r.provider] = (byDay[day][r.provider] || 0) + 1;
    if (r.status !== "ok") byDay[day].errors++;
  }
  const chartData = Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));

  // ── Today's token usage (kanal source, which has token counts) ──────────
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRows = rows.filter(r => r.ts.slice(0, 10) === todayStr);

  const groqKanalTokens = todayRows
    .filter(r => r.provider === "groq" && r.source === "kanal" && r.status === "ok")
    .reduce((s, r) => s + (r.input_tokens || 0) + (r.output_tokens || 0), 0);

  const groqChattCalls = todayRows.filter(r => r.provider === "groq" && r.source === "chatt" && r.status === "ok").length;
  const geminiCallsToday = todayRows.filter(r => r.provider === "gemini" && r.status === "ok").length;
  const orCallsToday = todayRows.filter(r => r.provider === "openrouter" && r.status === "ok").length;
  const cerebrasCallsToday = todayRows.filter(r => r.provider === "cerebras" && r.status === "ok").length;
  const sambanovaCallsToday = todayRows.filter(r => r.provider === "sambanova" && r.status === "ok").length;
  const errorsToday = todayRows.filter(r => r.status !== "ok").length;

  // ── Summary totals (7 days) ──────────────────────────────────────────────
  const totals = rows.reduce((acc, r) => {
    acc[r.provider] = (acc[r.provider] || 0) + 1;
    return acc;
  }, {});

  const totalOk    = rows.filter(r => r.status === "ok").length;
  const totalError = rows.filter(r => r.status !== "ok").length;

  // ── Per-source breakdown ─────────────────────────────────────────────────
  const SOURCE_LABELS = { "kanal": "Kanal (expand)", "kanal-batch": "Kanal (batch sv)", "kanal-batch-en": "Kanal (batch en)", "chatt": "Direktdebatt", "chatt-summering": "Debatt summering", "agent-fraga": "Fråga agenten", "beslut": "Decision API" };
  const SOURCE_COLORS_MAP = { "kanal": "#60a5fa", "kanal-batch": "#38bdf8", "kanal-batch-en": "#93c5fd", "chatt": "#a78bfa", "chatt-summering": "#c4b5fd", "agent-fraga": "#fb923c", "beslut": "#f59e0b" };
  const ALL_PROVIDER_COLORS = { ...AI_COLORS };
  const bySource = {};
  for (const r of rows) {
    const key = r.source || "okänd";
    if (!bySource[key]) bySource[key] = { source: SOURCE_LABELS[key] || key, ok: 0, error: 0, total: 0 };
    bySource[key].total++;
    if (r.status === "ok") bySource[key].ok++;
    else bySource[key].error++;
  }
  const sourceChartData = Object.entries(bySource)
    .map(([k, v]) => ({ ...v, _key: k, color: SOURCE_COLORS_MAP[k] || "#888" }))
    .sort((a, b) => b.total - a.total);

  // ── Per-hour call distribution (7 days) ─────────────────────────────────
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, ok: 0, error: 0 }));
  for (const r of rows) {
    const h = new Date(r.ts).getHours();
    if (r.status === "ok") byHour[h].ok++;
    else byHour[h].error++;
  }

  const statCard = (label, value, sub, color = C.accent) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px 24px", minWidth: "140px" }}>
      <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "monospace" }}>{label}</p>
      <p style={{ fontSize: "28px", fontWeight: 400, color, margin: "0 0 2px", fontFamily: "monospace" }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: C.textMuted, margin: 0 }}>{sub}</p>}
    </div>
  );

  const tokenPct = Math.min(100, Math.round((groqKanalTokens / GROQ_DAILY_LIMIT) * 100));
  const tokenColor = tokenPct >= 80 ? C.red : tokenPct >= 50 ? C.yellow : C.green;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* ── Live call log ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0, fontFamily: "monospace" }}>Live AI-logg</p>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: liveOk ? C.green : C.red,
              boxShadow: liveOk ? `0 0 6px ${C.green}` : "none",
            }} />
            <span style={{ fontSize: "10px", color: liveOk ? C.green : C.textMuted, fontFamily: "monospace", letterSpacing: "0.05em" }}>
              {liveOk ? "LIVE · uppdateras var 3s" : "väntar…"}
            </span>
          </div>
        </div>
        <div ref={scrollRef} style={{
          height: "340px", overflowY: "auto", fontFamily: "monospace", fontSize: "11px",
          background: "#050505", borderRadius: "4px", padding: "10px 14px",
        }}>
          {liveRows.length === 0
            ? <span style={{ color: C.textMuted }}>Inga anrop ännu…</span>
            : liveRows.map((r, i) => {
                const d = new Date(r.ts);
                const ts = d.toLocaleTimeString("sv-SE");
                const provColor = ALL_PROVIDER_COLORS[r.provider] ?? C.text;
                const srcColor  = SOURCE_COLORS_MAP[r.source] ?? "#888";
                const isNew = newIds.has(r.id);
                const num = liveRows.length - i;
                return (
                  <div key={r.id ?? i} style={{ display: "flex", gap: "8px", padding: "4px 0", borderBottom: "1px solid #111", borderLeft: isNew ? `3px solid ${C.green}` : "3px solid transparent", paddingLeft: "6px", background: isNew ? "#061a06" : "transparent", transition: "background 2s, border-left-color 2s" }}>
                    <span style={{ color: "#333", flexShrink: 0, width: "32px", textAlign: "right" }}>#{num}</span>
                    <span style={{ color: isNew ? C.green : "#555", flexShrink: 0, width: "80px" }}>{ts}</span>
                    <span style={{ color: srcColor, flexShrink: 0, width: "104px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.source ?? "?"}</span>
                    <span style={{ color: provColor, flexShrink: 0, width: "76px" }}>{r.provider}</span>
                    <span style={{ color: "#444", flexShrink: 0, maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.model ?? "–"}</span>
                    <span style={{ color: r.status === "ok" ? C.green : C.red, flexShrink: 0, width: "60px" }}>{r.status}</span>
                    <span style={{ color: "#555" }}>{r.latency_ms != null ? `${r.latency_ms}ms` : ""}</span>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* ── Today summary ── */}
      <div>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px", fontFamily: "monospace" }}>Idag</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {statCard("Gemini", geminiCallsToday, "anrop OK", AI_COLORS.gemini)}
          {statCard("Groq Chatt", groqChattCalls, "anrop OK", AI_COLORS.groq)}
          {cerebrasCallsToday > 0 && statCard("Cerebras", cerebrasCallsToday, "anrop OK", AI_COLORS.cerebras)}
          {sambanovaCallsToday > 0 && statCard("Sambanova", sambanovaCallsToday, "anrop OK", AI_COLORS.sambanova)}
          {orCallsToday > 0 && statCard("OpenRouter", orCallsToday, "anrop OK", AI_COLORS.openrouter)}
          {errorsToday > 0 && statCard("Fel/timeout", errorsToday, "misslyckade", C.red)}
        </div>
      </div>

      {/* ── Groq Kanal token progress bar ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: "monospace" }}>
          Groq Kanal — daglig tokenkvot
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
          <p style={{ fontSize: "22px", fontWeight: 400, color: tokenColor, margin: 0, fontFamily: "monospace" }}>
            {groqKanalTokens.toLocaleString("sv-SE")} <span style={{ fontSize: "14px", color: C.textMuted }}>/ {GROQ_DAILY_LIMIT.toLocaleString("sv-SE")} tokens</span>
          </p>
          <span style={{ fontSize: "14px", color: tokenColor, fontFamily: "monospace" }}>{tokenPct}%</span>
        </div>
        <div style={{ background: C.border, borderRadius: "4px", height: "8px", overflow: "hidden" }}>
          <div style={{ background: tokenColor, width: `${tokenPct}%`, height: "100%", borderRadius: "4px", transition: "width 0.3s" }} />
        </div>
        <p style={{ fontSize: "11px", color: C.textMuted, margin: "8px 0 0" }}>
          Baserat på loggade kanal-anrop idag. Groq Chatt-anrop loggas utan tokenantal (streaming).
        </p>
      </div>

      {/* ── 7-day call volume chart ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>Anrop per dag (7 dagar)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="day" tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} width={30} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}
              labelFormatter={l => l}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            <Bar dataKey="gemini"     name="Gemini"     stackId="a" fill={AI_COLORS.gemini}     radius={[0,0,0,0]} />
            <Bar dataKey="groq"       name="Groq"       stackId="a" fill={AI_COLORS.groq}       radius={[0,0,0,0]} />
            <Bar dataKey="cerebras"   name="Cerebras"   stackId="a" fill={AI_COLORS.cerebras}   radius={[0,0,0,0]} />
            <Bar dataKey="sambanova"  name="Sambanova"  stackId="a" fill={AI_COLORS.sambanova}  radius={[0,0,0,0]} />
            <Bar dataKey="openrouter" name="OpenRouter" stackId="a" fill={AI_COLORS.openrouter} radius={[0,0,0,0]} />
            <Bar dataKey="none"       name="Fallback"   stackId="a" fill={AI_COLORS.none}       radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Per-source breakdown ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>Anrop per funktion (7 dagar)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sourceChartData.map(s => {
            const errPct = s.total > 0 ? Math.round((s.error / s.total) * 100) : 0;
            const okPct = 100 - errPct;
            return (
              <div key={s._key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: s.color, fontFamily: "monospace" }}>{s.source}</span>
                  <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>
                    {s.ok} OK{s.error > 0 ? ` · ${s.error} fel (${errPct}%)` : ""}
                  </span>
                </div>
                <div style={{ background: C.border, borderRadius: "3px", height: "6px", overflow: "hidden", display: "flex" }}>
                  <div style={{ background: s.color, width: `${okPct}%`, height: "100%" }} />
                  {s.error > 0 && <div style={{ background: C.red, width: `${errPct}%`, height: "100%" }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Per-hour heatmap ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>Anrop per timme – dygnsfördelning (7 dagar)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byHour} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="hour" tick={{ fill: C.textMuted, fontSize: 9 }} interval={2} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} width={28} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}
              labelFormatter={l => l}
            />
            <Bar dataKey="ok"    name="OK"  stackId="h" fill={AI_COLORS.groq} radius={[0,0,0,0]} />
            <Bar dataKey="error" name="Fel" stackId="h" fill={C.red}          radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: "11px", color: C.textMuted, margin: "8px 0 0" }}>Lokal tid. Röda staplar = misslyckade anrop (rate limit, timeout). Identifiera tider med hög belastning.</p>
      </div>

      {/* ── 7-day totals ── */}
      <div>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px", fontFamily: "monospace" }}>Totalt senaste 7 dagarna</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {statCard("Gemini",     totals.gemini     ?? 0, "anrop", AI_COLORS.gemini)}
          {statCard("Groq",       totals.groq       ?? 0, "anrop", AI_COLORS.groq)}
          {(totals.cerebras  ?? 0) > 0 && statCard("Cerebras",  totals.cerebras  ?? 0, "anrop", AI_COLORS.cerebras)}
          {(totals.sambanova ?? 0) > 0 && statCard("Sambanova", totals.sambanova ?? 0, "anrop", AI_COLORS.sambanova)}
          {(totals.openrouter ?? 0) > 0 && statCard("OpenRouter", totals.openrouter ?? 0, "anrop", AI_COLORS.openrouter)}
          {statCard("OK / Fel",   `${totalOk} / ${totalError}`, "anrop", totalError > 0 ? C.red : C.green)}
        </div>
      </div>

      {/* ── Recent calls table ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>Senaste 30 anrop</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "monospace" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Tid","Källa","Provider","Modell","Status","ms","Input tok","Output tok"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 12px", color: C.textMuted, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={{ padding: "6px 12px", color: C.textMuted }}>
                    {new Date(r.ts).toLocaleString("sv-SE", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "6px 12px", color: C.accentDim }}>{r.source}</td>
                  <td style={{ padding: "6px 12px", color: AI_COLORS[r.provider] ?? C.text }}>{r.provider}</td>
                  <td style={{ padding: "6px 12px", color: C.textMuted, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.model ?? "–"}
                  </td>
                  <td style={{ padding: "6px 12px", color: r.status === "ok" ? C.green : C.red }}>{r.status}</td>
                  <td style={{ padding: "6px 12px", color: C.textMuted }}>{r.latency_ms ?? "–"}</td>
                  <td style={{ padding: "6px 12px", color: C.textMuted }}>{r.input_tokens ?? "–"}</td>
                  <td style={{ padding: "6px 12px", color: C.textMuted }}>{r.output_tokens ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminClient() {
  const [authed, setAuthed]       = useState(false);
  const [pw, setPw]               = useState("");
  const [pwError, setPwError]     = useState("");
  const [mainTab, setMainTab]     = useState("inlamningar");
  const [subCount, setSubCount]   = useState(null);
  const [digestMsg, setDigestMsg] = useState("");
  const [digestLoading, setDigestLoading] = useState(false);

  // Inlamningar state
  const [inlamningar, setInlamningar] = useState([]);
  const [loadingInl, setLoadingInl]   = useState(false);
  const [filter, setFilter]           = useState("alla");
  const [expanded, setExpanded]       = useState(null);

  // Artiklar state
  const [artiklar, setArtiklar]       = useState([]);
  const [loadingArt, setLoadingArt]   = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [editData, setEditData]       = useState({});

  // Kommentarer state
  const [kommentarer, setKommentarer] = useState([]);
  const [loadingKomm, setLoadingKomm] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError]               = useState("");

  function login() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      loadInlamningar();
      loadSubCount();
    } else {
      setPwError("Fel lösenord.");
    }
  }

  const loadInlamningar = useCallback(async (silent = false) => {
    if (!silent) setLoadingInl(true);
    setError("");
    try {
      const data = await fetchInlamningar();
      setInlamningar(prev => {
        const prevKey = prev.map(a => `${a.id}:${a.status}`).join(",");
        const newKey  = data.map(a => `${a.id}:${a.status}`).join(",");
        return prevKey === newKey ? prev : data;
      });
    } catch (e) {
      if (!silent) setError("Kunde inte hämta inlämningar: " + e.message);
    }
    if (!silent) setLoadingInl(false);
  }, []);

  const loadArtiklar = useCallback(async (silent = false) => {
    if (!silent) setLoadingArt(true);
    setError("");
    try {
      const data = await fetchArtiklar();
      setArtiklar(prev => {
        const prevKey = prev.map(a => `${a.id}`).join(",");
        const newKey  = data.map(a => `${a.id}`).join(",");
        return prevKey === newKey ? prev : data;
      });
    } catch (e) {
      if (!silent) setError("Kunde inte hämta artiklar: " + e.message);
    }
    if (!silent) setLoadingArt(false);
  }, []);

  const loadKommentarer = useCallback(async (silent = false) => {
    if (!silent) setLoadingKomm(true);
    try {
      const data = await fetchKommentarer();
      setKommentarer(prev => {
        const prevKey = prev.map(c => c.id).join(",");
        const newKey  = data.map(c => c.id).join(",");
        return prevKey === newKey ? prev : data;
      });
    } catch (e) {
      if (!silent) setError("Kunde inte hämta kommentarer: " + e.message);
    }
    if (!silent) setLoadingKomm(false);
  }, []);

  async function handleDeleteKommentar(id, namn) {
    if (!confirm(`Ta bort kommentar av ${namn}?`)) return;
    setActionLoading(id);
    try {
      await deleteKommentar(id);
      setKommentarer(prev => prev.filter(c => c.id !== id));
    } catch (e) { setError("Fel vid borttagning: " + e.message); }
    setActionLoading(null);
  }

  async function loadSubCount() {
    try {
      const res = await fetch("/api/admin/prenumeranter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: ADMIN_PASSWORD }),
      });
      const data = await res.json();
      setSubCount(Array.isArray(data.prenumeranter) ? data.prenumeranter.length : 0);
    } catch {}
  }

  async function sendDigest() {
    setDigestLoading(true); setDigestMsg("");
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_ADMIN_PASSWORD }),
      });
      const data = await res.json();
      setDigestMsg(data.meddelande || data.fel || "Klart.");
    } catch { setDigestMsg("Något gick fel."); }
    setDigestLoading(false);
  }

  // Poll silently — only re-renders if data actually changed (no blink)
  useEffect(() => {
    if (!authed) return;
    const iv = setInterval(() => {
      if (mainTab === "inlamningar") loadInlamningar(true);
      else if (mainTab === "artiklar") loadArtiklar(true);
      else if (mainTab === "kommentarer") loadKommentarer(true);
    }, 30000);
    return () => clearInterval(iv);
  }, [authed, mainTab, loadInlamningar, loadArtiklar, loadKommentarer]);

  useEffect(() => {
    if (!authed) return;
    if (mainTab === "artiklar"    && artiklar.length    === 0) loadArtiklar();
    if (mainTab === "kommentarer" && kommentarer.length === 0) loadKommentarer();
  }, [mainTab, authed]);

  async function handlePublish(row) {
    setActionLoading(row.id);
    try {
      await publishToArtiklar(row);
      await updateStatus(row.id, "publicerad");
      setInlamningar(prev => prev.map(a => a.id === row.id ? {...a, status:"publicerad"} : a));
    } catch (e) { setError("Fel vid publicering: " + e.message); }
    setActionLoading(null);
  }

  async function handleAvvisa(id) {
    setActionLoading(id);
    try {
      await updateStatus(id, "avvisad");
      setInlamningar(prev => prev.map(a => a.id === id ? {...a, status:"avvisad"} : a));
    } catch (e) { setError("Fel: " + e.message); }
    setActionLoading(null);
  }

  async function handleDeleteInlamning(id) {
    if (!confirm("Ta bort inlämningen?")) return;
    setActionLoading(id);
    try {
      await deleteInlamning(id);
      setInlamningar(prev => prev.filter(a => a.id !== id));
    } catch (e) { setError("Fel vid borttagning: " + e.message); }
    setActionLoading(null);
  }

  async function handleDeleteArtikel(id, rubrik) {
    if (!confirm(`Ta bort "${rubrik}" från sajten?`)) return;
    setActionLoading(id);
    try {
      await deleteArtikelById(id);
      setArtiklar(prev => prev.filter(a => a.id !== id));
    } catch (e) { setError("Fel vid borttagning: " + e.message); }
    setActionLoading(null);
  }

  function startEdit(a) {
    setEditingId(a.id);
    setEditData({ rubrik: a.rubrik, forfattare: a.forfattare, artikel: a.artikel });
  }

  async function saveEdit(id) {
    setActionLoading(id);
    try {
      await updateArtikel(id, editData);
      setArtiklar(prev => prev.map(a => a.id === id ? {...a, ...editData} : a));
      setEditingId(null);
    } catch (e) { setError("Fel vid sparning: " + e.message); }
    setActionLoading(null);
  }

  const filteredInl = inlamningar.filter(a =>
    filter === "alla" ? true : a.status === filter
  );
  const counts = {
    alla: inlamningar.length,
    inkorg: inlamningar.filter(a => a.status === "inkorg").length,
    publicerad: inlamningar.filter(a => a.status === "publicerad").length,
    avvisad: inlamningar.filter(a => a.status === "avvisad").length,
  };

  if (!authed) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia, serif" }}>
        <div style={{ width:"320px", padding:"40px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px" }}>
          <h1 style={{ fontSize:"22px", fontWeight:400, color:C.accent, margin:"0 0 6px 0", fontFamily:"Times New Roman, serif" }}>DEBATT-AI</h1>
          <p style={{ color:C.textMuted, fontSize:"13px", margin:"0 0 28px 0", letterSpacing:"0.1em", textTransform:"uppercase" }}>Admin</p>
          <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Lösenord</label>
          <input
            type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ ...inp, marginBottom:"12px" }}
            autoFocus
          />
          {pwError && <p style={{ color:C.red, fontSize:"13px", margin:"0 0 12px 0" }}>{pwError}</p>}
          <button onClick={login} style={{ background:C.accent, color:"#0a0a0a", border:"none", borderRadius:"4px", padding:"13px", width:"100%", fontSize:"14px", fontWeight:700, cursor:"pointer", fontFamily:"Georgia, serif" }}>
            Logga in →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"Georgia, serif" }}>
      <header style={{ borderBottom:`1px solid ${C.border}`, padding:"0 24px", height:"64px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:`${C.bg}f0`, backdropFilter:"blur(12px)", zIndex:100 }}>
        <div>
          <span style={{ fontFamily:"Times New Roman, serif", fontSize:"20px", fontWeight:700, color:C.accent }}>DEBATT-AI</span>
          <span style={{ fontSize:"11px", color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", marginLeft:"12px" }}>Admin</span>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <a href="/" style={{ fontSize:"13px", color:C.textMuted, textDecoration:"none", padding:"6px 14px", border:`1px solid ${C.border}`, borderRadius:"4px" }}>← Sajten</a>
          <button onClick={() => mainTab === "inlamningar" ? loadInlamningar() : loadArtiklar()} style={{ fontSize:"13px", color:C.accent, background:"transparent", border:`1px solid ${C.accentDim}`, borderRadius:"4px", padding:"6px 14px", cursor:"pointer", fontFamily:"Georgia, serif" }}>↻ Uppdatera</button>
        </div>
      </header>

      <main style={{ maxWidth:"900px", margin:"0 auto", padding:"32px 20px" }}>
        {error && <p style={{ color:C.red, fontSize:"14px", marginBottom:"16px" }}>{error}</p>}

        {/* Main tabs */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"32px", flexWrap:"wrap" }}>
          {[
            ["inlamningar","Inlämningar"],
            ["artiklar","Publicerade artiklar"],
            ["kommentarer", `Kommentarer${kommentarer.length > 0 ? ` (${kommentarer.length})` : ""}`],
            ["nyhetsbrev","Nyhetsbrev" + (subCount !== null ? ` (${subCount})` : "")],
            ["matning","Mätning"],
            ["backtest","Backtest"],
            ["nyhetslogg","Nyhetslogg"],
            ["feeds","RSS-feeds"],
            ["markets","Markets"],
            ["api-status","API-status"],
            ["beslut-api","Decision API"],
            ["ai-statistik","AI-statistik"],
            ["fellog","Fellog"],
            ["rapporter","Veckorapporter"],
          ].map(([val,lbl]) => (
            <button key={val} onClick={() => setMainTab(val)} style={{ background:mainTab===val?`${C.accent}15`:"transparent", border:`1px solid ${mainTab===val?C.accentDim:C.border}`, color:mainTab===val?C.accent:C.textMuted, padding:"8px 20px", borderRadius:"4px", cursor:"pointer", fontSize:"14px", fontFamily:"Georgia, serif" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── INLÄMNINGAR ── */}
        {mainTab === "inlamningar" && (
          <>
            <div style={{ display:"flex", gap:"8px", marginBottom:"28px", flexWrap:"wrap" }}>
              {[["alla","Alla"],["inkorg","Inkorg"],["publicerad","Publicerade"],["avvisad","Avvisade"]].map(([val,lbl]) => (
                <button key={val} onClick={() => setFilter(val)} style={{ background:filter===val?`${C.accent}15`:"transparent", border:`1px solid ${filter===val?C.accentDim:C.border}`, color:filter===val?C.accent:C.textMuted, padding:"6px 14px", borderRadius:"4px", cursor:"pointer", fontSize:"13px", fontFamily:"Georgia, serif" }}>
                  {lbl} ({counts[val]})
                </button>
              ))}
            </div>

            {loadingInl ? <p style={{ color:C.textMuted }}>Laddar…</p>
              : filteredInl.length === 0 ? <p style={{ color:C.textMuted }}>Inga inlämningar.</p>
              : filteredInl.map(a => (
              <div key={a.id} style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px", marginBottom:"24px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px", gap:"12px", flexWrap:"wrap" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px", flexWrap:"wrap" }}>
                      <StatusBadge status={a.status} />
                      {a.kategori && <span style={{ fontSize:"11px", color:C.accentDim, background:`${C.accent}10`, border:`1px solid ${C.accent}20`, borderRadius:"20px", padding:"2px 10px" }}>{a.kategori}</span>}
                      <span style={{ fontSize:"12px", color:C.textMuted }}>{a.skapad ? new Date(a.skapad).toLocaleDateString("sv-SE", {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}</span>
                    </div>
                    <h2 style={{ fontSize:"18px", fontWeight:400, margin:"0 0 4px 0", color:C.accent, lineHeight:1.3 }}>{a.rubrik}</h2>
                    <p style={{ color:C.textMuted, fontSize:"13px", margin:0, fontStyle:"italic" }}>{a.forfattare}</p>
                  </div>
                  <div style={{ minWidth:"150px" }}>
                    <ScoreBar label="Argumentation" value={a.arg} />
                    <ScoreBar label="Originalitet"  value={a.ori} />
                    <ScoreBar label="Relevans"       value={a.rel} />
                    <ScoreBar label="Trovärdighet"   value={a.tro} />
                  </div>
                </div>

                {a.motivering && (
                  <p style={{ color:C.textMuted, fontSize:"13px", fontStyle:"italic", margin:"0 0 12px 0", borderLeft:`3px solid ${C.accentDim}`, paddingLeft:"12px" }}>"{a.motivering}"</p>
                )}

                <button onClick={() => setExpanded(expanded===a.id?null:a.id)} style={{ background:"none", border:"none", color:C.accentDim, cursor:"pointer", fontSize:"13px", padding:0, fontFamily:"Georgia, serif", marginBottom:"12px" }}>
                  {expanded===a.id ? "▲ Dölj text" : "▼ Visa artikeltext"}
                </button>

                {expanded===a.id && (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"6px", padding:"16px", marginBottom:"12px", maxHeight:"280px", overflowY:"auto" }}>
                    {(a.artikel||"").split("\n\n").filter(Boolean).map((p,i) => (
                      <p key={i} style={{ fontSize:"14px", lineHeight:1.8, color:C.text, margin:"0 0 14px 0" }}>{p}</p>
                    ))}
                  </div>
                )}

                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {a.status === "inkorg" && (
                    <>
                      <button onClick={() => handlePublish(a)} disabled={actionLoading===a.id} style={{ background:C.green, color:"#050f08", border:"none", borderRadius:"4px", padding:"8px 16px", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Georgia, serif" }}>
                        {actionLoading===a.id ? "…" : "✓ Publicera"}
                      </button>
                      <button onClick={() => handleAvvisa(a.id)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.red, border:`1px solid ${C.red}40`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                        {actionLoading===a.id ? "…" : "✗ Avvisa"}
                      </button>
                    </>
                  )}
                  {a.status === "avvisad" && (
                    <button onClick={() => handlePublish(a)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.green, border:`1px solid ${C.green}40`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                      {actionLoading===a.id ? "…" : "↑ Publicera ändå"}
                    </button>
                  )}
                  <button onClick={() => handleDeleteInlamning(a.id)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif", marginLeft:"auto" }}>
                    {actionLoading===a.id ? "…" : "🗑 Ta bort"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── PUBLICERADE ARTIKLAR ── */}
        {mainTab === "artiklar" && (
          <>
            <p style={{ color:C.textMuted, fontSize:"14px", margin:"0 0 24px 0" }}>{artiklar.length} publicerade artiklar. Redigering och borttagning sker direkt i databasen.</p>

            {loadingArt ? <p style={{ color:C.textMuted }}>Laddar…</p>
              : artiklar.length === 0 ? <p style={{ color:C.textMuted }}>Inga publicerade artiklar.</p>
              : artiklar.map(a => (
              <div key={a.id} style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px", marginBottom:"24px" }}>
                {editingId === a.id ? (
                  /* ── Edit form ── */
                  <div>
                    <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 16px 0" }}>Redigerar artikel #{a.id}</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                      <div>
                        <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Rubrik</label>
                        <input value={editData.rubrik} onChange={e => setEditData(d => ({...d, rubrik:e.target.value}))} style={inp} />
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Författare</label>
                        <input value={editData.forfattare} onChange={e => setEditData(d => ({...d, forfattare:e.target.value}))} style={inp} />
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Artikeltext</label>
                        <textarea value={editData.artikel} onChange={e => setEditData(d => ({...d, artikel:e.target.value}))} rows={12} style={{...inp, resize:"vertical", lineHeight:1.8}} />
                      </div>
                      <div style={{ display:"flex", gap:"8px" }}>
                        <button onClick={() => saveEdit(a.id)} disabled={actionLoading===a.id} style={{ background:C.green, color:"#050f08", border:"none", borderRadius:"4px", padding:"10px 20px", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Georgia, serif" }}>
                          {actionLoading===a.id ? "Sparar…" : "✓ Spara"}
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"10px 20px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                          Avbryt
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Article view ── */
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px", gap:"12px", flexWrap:"wrap" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px", flexWrap:"wrap" }}>
                          {a.kalla === "ai" && <span style={{ fontSize:"11px", color:"#4a9eff", background:"#050a1a", border:"1px solid #4a9eff40", borderRadius:"20px", padding:"2px 10px", fontFamily:"monospace", fontWeight:700 }}>AI</span>}
                          {a.kalla === "manniska" && <span style={{ fontSize:"11px", color:C.accent, background:"#0a0a05", border:`1px solid ${C.accent}40`, borderRadius:"20px", padding:"2px 10px", fontFamily:"monospace", fontWeight:700 }}>MÄNNISKA</span>}
                          {a.kategori && <span style={{ fontSize:"11px", color:C.accentDim, background:`${C.accent}10`, border:`1px solid ${C.accent}20`, borderRadius:"20px", padding:"2px 10px" }}>{a.kategori}</span>}
                          <span style={{ fontSize:"12px", color:C.textMuted }}>{a.skapad ? new Date(a.skapad).toLocaleDateString("sv-SE", {year:"numeric",month:"short",day:"numeric"}) : ""}</span>
                        </div>
                        <h2 style={{ fontSize:"18px", fontWeight:400, margin:"0 0 4px 0", color:C.accent, lineHeight:1.3 }}>{a.rubrik}</h2>
                        <p style={{ color:C.textMuted, fontSize:"13px", margin:"0 0 4px 0", fontStyle:"italic" }}>{a.forfattare}</p>
                        {(a.taggar||[]).length > 0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", marginTop:"6px" }}>
                            {(a.taggar||[]).map(t => <span key={t} style={{ fontSize:"11px", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"20px", padding:"1px 8px" }}>#{t}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth:"150px" }}>
                        <ScoreBar label="Arg" value={a.arg} />
                        <ScoreBar label="Ori" value={a.ori} />
                        <ScoreBar label="Rel" value={a.rel} />
                        <ScoreBar label="Tro" value={a.tro} />
                      </div>
                    </div>

                    <p style={{ color:C.textMuted, fontSize:"14px", lineHeight:1.7, margin:"0 0 14px 0" }}>{(a.artikel||"").slice(0,200)}…</p>

                    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                      <a href={`/artikel/${a.id}`} target="_blank" rel="noreferrer" style={{ fontSize:"13px", color:C.accentDim, textDecoration:"none", padding:"8px 16px", border:`1px solid ${C.border}`, borderRadius:"4px" }}>
                        ↗ Visa
                      </a>
                      <button onClick={() => startEdit(a)} style={{ background:`${C.accent}15`, color:C.accent, border:`1px solid ${C.accentDim}`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                        ✎ Redigera
                      </button>
                      <button onClick={() => handleDeleteArtikel(a.id, a.rubrik)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.red, border:`1px solid ${C.red}30`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif", marginLeft:"auto" }}>
                        {actionLoading===a.id ? "…" : "🗑 Ta bort"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── KOMMENTARER ── */}
        {mainTab === "kommentarer" && (
          <>
            <p style={{ color:C.textMuted, fontSize:"14px", margin:"0 0 24px 0" }}>{kommentarer.length} kommentarer.</p>
            {loadingKomm ? <p style={{ color:C.textMuted }}>Laddar…</p>
              : kommentarer.length === 0 ? <p style={{ color:C.textMuted }}>Inga kommentarer ännu.</p>
              : kommentarer.map(c => (
              <div key={c.id} style={{ borderTop:`1px solid ${C.border}`, paddingTop:"20px", marginBottom:"20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px", flexWrap:"wrap", marginBottom:"10px" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"14px", color:C.accent, fontWeight:600 }}>{c.namn}</span>
                      <span style={{ fontSize:"12px", color:C.textMuted }}>
                        {c.skapad ? new Date(c.skapad).toLocaleDateString("sv-SE", {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}
                      </span>
                      <a href={`/artikel/${c.artikel_id}`} target="_blank" rel="noreferrer" style={{ fontSize:"12px", color:C.accentDim, textDecoration:"none", border:`1px solid ${C.border}`, borderRadius:"4px", padding:"2px 8px" }}>
                        Artikel #{c.artikel_id} ↗
                      </a>
                    </div>
                    <p style={{ fontSize:"14px", color:C.text, lineHeight:1.7, margin:0 }}>{c.text}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteKommentar(c.id, c.namn)}
                    disabled={actionLoading === c.id}
                    style={{ background:"transparent", color:C.red, border:`1px solid ${C.red}30`, borderRadius:"4px", padding:"8px 14px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif", flexShrink:0 }}
                  >
                    {actionLoading === c.id ? "…" : "🗑 Ta bort"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── MÄTNING ── */}
        {mainTab === "matning" && <MatningTab />}

        {/* ── BACKTEST ── */}
        {mainTab === "backtest" && <BacktestTab />}
        {mainTab === "nyhetslogg" && <NyhetsloggTab />}
        {mainTab === "feeds" && <FeedsTab />}
        {mainTab === "markets" && <MarketsTab />}

        {/* ── API-STATUS ── */}
        {mainTab === "api-status" && <ApiStatusTab />}

        {/* ── DECISION API ── */}
        {mainTab === "beslut-api" && <BeslutApiTab />}

        {/* ── AI-STATISTIK ── */}
        {mainTab === "ai-statistik" && <AiStatistikTab />}

        {/* ── FELLOG ── */}
        {mainTab === "fellog" && <FellogTab />}

        {/* ── VECKORAPPORTER ── */}
        {mainTab === "rapporter" && <VeckorapporterTab />}

        {/* ── NYHETSBREV ── */}
        {mainTab === "nyhetsbrev" && (
          <div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"28px", marginBottom:"24px" }}>
              <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 8px" }}>Prenumeranter</p>
              <p style={{ fontSize:"36px", fontWeight:400, color:C.accent, margin:"0 0 4px", fontFamily:"monospace" }}>{subCount ?? "–"}</p>
              <p style={{ color:C.textMuted, fontSize:"14px", margin:"0 0 20px" }}>aktiva prenumeranter</p>
              <button onClick={loadSubCount} style={{ background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>↻ Uppdatera</button>
            </div>

            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"28px" }}>
              <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 8px" }}>Skicka digest</p>
              <p style={{ color:C.textMuted, fontSize:"14px", lineHeight:1.7, margin:"0 0 20px" }}>
                Skickar ett nyhetsbrev med artiklar från de senaste 7 dagarna till alla aktiva prenumeranter.
                GitHub Actions skickar också automatiskt varje måndag kl 10:00.
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                <button onClick={sendDigest} disabled={digestLoading} style={{ background:C.accent, color:"#0a0a0a", border:"none", borderRadius:"4px", padding:"12px 24px", fontSize:"14px", fontWeight:700, cursor:digestLoading?"default":"pointer", fontFamily:"Georgia, serif" }}>
                  {digestLoading ? "Skickar…" : "✉ Skicka digest nu"}
                </button>
                {digestMsg && <p style={{ color:digestMsg.includes("Fel") || digestMsg.includes("fel") ? C.red : C.green, fontSize:"14px", margin:0 }}>{digestMsg}</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
