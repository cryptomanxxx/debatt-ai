"use client";
import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", red: "#f87171", yellow: "#facc15",
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
    const colors = { ok: C.green, warn: C.yellow, limited: C.red, unknown: C.textMuted };
    const labels = { ok: "OK", warn: "LÅGT", limited: "STOPP", unknown: "OKÄND" };
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
          <ProviderCard name="Groq" model="llama-3.3-70b-versatile · 30 req/min" p={health?.groq} />
          <ProviderCard name="Gemini" model="2.0 Flash / 1.5 Flash · 15 req/min" p={health?.gemini} />

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px", marginTop: "8px" }}>
            <p style={{ fontSize: "11px", color: C.accentDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px", fontFamily: "monospace" }}>Tips</p>
            <ul style={{ margin: 0, paddingLeft: "20px", color: C.textMuted, fontSize: "13px", lineHeight: 1.8 }}>
              <li>Siffrorna gäller direktdebatt-anrop. AI-redaktören (agent.py + artikelbedömning) delar samma Groq-nyckel.</li>
              <li>Skapa en <b style={{ color: C.text }}>separat Groq-nyckel</b> för agent.py (GitHub Actions) för att isolera trafiken.</li>
              <li>Vid "STOPP" byter systemet automatiskt till Gemini utan att du behöver göra något.</li>
              <li>Status uppdateras bara när en riktig debatt körs — inte vid polling.</li>
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
            ["api-status","API-status"],
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

        {/* ── API-STATUS ── */}
        {mainTab === "api-status" && <ApiStatusTab />}

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
