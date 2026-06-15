"use client";
import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#666", mono: "monospace",
  green: "#4ade80", red: "#f87171", yellow: "#facc15",
  blue: "#60a5fa", cyan: "#22d3ee", purple: "#a855f7",
};

function Card({ children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px", ...style }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: "10px", color: "#888", fontFamily: C.mono, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
      {children}
    </div>
  );
}

function StatPill({ label, value, color = C.text }) {
  return (
    <div style={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: "6px", padding: "10px 16px", minWidth: "120px" }}>
      <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, letterSpacing: "0.1em", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "18px", fontFamily: C.mono, color, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export default function FormogenhetVy({
  planbocker = [], statskassa = 0, markAgare = [], feedback = [],
  etfInnehav = [], bets = [], lobbying = [], oligarki = [], visitors: initialVisitors = [],
  borsPortfoljer = [], borsTillgangar = [],
}) {
  const [range, setRange] = useState(30);
  const [liveVisitors, setLiveVisitors] = useState(initialVisitors);
  const [mittNamn, setMittNamn] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("mark_besokare_id");
    const cachedNamn = localStorage.getItem("mark_besokare_namn");
    if (cachedNamn) setMittNamn(cachedNamn);

    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    fetch(`${SB_URL}/rest/v1/visitor_wallets?order=saldo.desc&limit=20&select=display_name,saldo,skapad`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setLiveVisitors(data);
      })
      .catch(() => {});

    // Hämta eget aktuellt namn från DB om vi har ett id
    if (id) {
      fetch(`${SB_URL}/rest/v1/visitor_wallets?id=eq.${id}&select=display_name`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(rows => {
          if (rows.length && rows[0].display_name) {
            setMittNamn(rows[0].display_name);
            localStorage.setItem("mark_besokare_namn", rows[0].display_name);
          }
        })
        .catch(() => {});
    }
  }, []);

  // ── Beräkna mark-inkomst per agent ──
  const markInkomst = {};
  for (const row of markAgare) {
    const v = row.mark_zoner?.veckoinkomst || 0;
    const daglig = Math.round(v / 7);
    markInkomst[row.agent] = (markInkomst[row.agent] || 0) + daglig;
  }

  // ── Socialt kapital netto per agent ──
  const skickat = {};
  const fatt = {};
  for (const r of feedback) {
    skickat[r.fran_agent] = (skickat[r.fran_agent] || 0) + Number(r.belopp);
    fatt[r.till_agent] = (fatt[r.till_agent] || 0) + Number(r.belopp);
  }
  const socialNetto = {};
  const allSocialKeys = new Set([...Object.keys(skickat), ...Object.keys(fatt)]);
  for (const a of allSocialKeys) {
    socialNetto[a] = Math.round((fatt[a] || 0) - (skickat[a] || 0));
  }

  // ── Prediction market netto per agent ──
  const marketNetto = {};
  for (const b of bets) {
    if (b.vinst != null) marketNetto[b.agent] = (marketNetto[b.agent] || 0) + Number(b.vinst);
  }

  // ── Lobbying mottaget ──
  const lobbyingFatt = {};
  for (const l of lobbying) {
    if (l.resultat === "accepterat") {
      lobbyingFatt[l.mal_agent] = (lobbyingFatt[l.mal_agent] || 0) + Number(l.belopp);
    }
  }

  // ── Börsportföljvärde per agent ──
  const borsInstitutPris = {};
  for (const tg of borsTillgangar) {
    borsInstitutPris[tg.symbol] = parseFloat(tg.senaste_pris ?? 100);
  }
  const borsPortfoljVarde = {};
  for (const pf of borsPortfoljer) {
    const antal = parseFloat(pf.antal ?? 0);
    if (antal <= 0) continue;
    const pris = borsInstitutPris[pf.symbol] ?? 100;
    borsPortfoljVarde[pf.agent] = (borsPortfoljVarde[pf.agent] || 0) + antal * pris;
  }

  // ── Totalt förmögenhet (saldo + börsportfölj) ──
  const totalSaldo = planbocker.reduce((s, p) => s + (p.saldo || 0) + Math.round(borsPortfoljVarde[p.agent] || 0), 0);
  const maxTotal = planbocker.reduce((m, p) => {
    const tot = (p.saldo || 0) + Math.round(borsPortfoljVarde[p.agent] || 0);
    return tot > m ? tot : m;
  }, 1);

  // ── Sortera agenter efter total (saldo + börs) ──
  const sortadeAgenter = [...planbocker].sort((a, b) => {
    const totA = (a.saldo || 0) + Math.round(borsPortfoljVarde[a.agent] || 0);
    const totB = (b.saldo || 0) + Math.round(borsPortfoljVarde[b.agent] || 0);
    return totB - totA;
  });

  // ── Gini ──
  const latestGini = oligarki.length ? oligarki[oligarki.length - 1]?.gini?.toFixed(3) : "–";

  // ── Tidsseriedata ──
  const cutoff = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  const tidsData = oligarki
    .filter(r => new Date(r.skapad) >= cutoff)
    .map(r => ({
      datum: new Date(r.skapad).toLocaleDateString("sv-SE", { month: "short", day: "numeric" }),
      gini: r.gini != null ? parseFloat(r.gini.toFixed(3)) : null,
      mobilitet: r.social_mobilitet != null ? parseFloat(r.social_mobilitet.toFixed(1)) : null,
      risk: r.oligarkirisk != null ? parseFloat(r.oligarkirisk.toFixed(1)) : null,
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ── NYCKELTAL ── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <StatPill label="Total förmögenhet (inkl. börs)" value={`${totalSaldo.toLocaleString("sv-SE")} kr`} color={C.green} />
        <StatPill label="Gini (senaste)" value={latestGini} color={latestGini > 0.5 ? C.red : C.green} />
        <StatPill label="Statskassan" value={`${(statskassa || 0).toLocaleString("sv-SE")} kr`} color={C.yellow} />
        <StatPill label="Agenter" value={planbocker.length} />
        <StatPill label="Besökare" value={liveVisitors.length} />
      </div>

      {/* ── AGENT-RANKNING ── */}
      <section>
        <Label>Agenter · rankat efter saldo</Label>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: `1px solid ${C.border}` }}>
                {["#", "Agent", "Saldo", "Börs", "Total", "Spel-saldo", "Mark kr/dag", "Social netto", "Market netto", "Lobbying fått"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.dim, fontFamily: C.mono, fontSize: "9px", letterSpacing: "0.08em", fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortadeAgenter.map((p, i) => {
                const mark = markInkomst[p.agent] || 0;
                const social = socialNetto[p.agent];
                const market = marketNetto[p.agent];
                const lobby = lobbyingFatt[p.agent];
                const bors = Math.round(borsPortfoljVarde[p.agent] || 0);
                const total = (p.saldo || 0) + bors;
                const barW = Math.round((total / maxTotal) * 100);
                return (
                  <tr key={p.agent} style={{ borderBottom: `1px solid #111`, transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#131313"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "8px 12px", color: C.dim, fontFamily: C.mono, width: "32px" }}>{i + 1}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <a href={`/agent/${encodeURIComponent(p.agent)}`} style={{ color: "#f0ede6", textDecoration: "none", fontFamily: "Georgia, serif" }}>{p.agent}</a>
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: C.mono, color: C.text }}>{(p.saldo || 0).toLocaleString("sv-SE")}</td>
                    <td style={{ padding: "8px 12px", color: bors > 0 ? C.cyan : C.dim, fontFamily: C.mono }}>
                      {bors > 0 ? bors.toLocaleString("sv-SE") : "–"}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "80px", height: "4px", background: "#1a1a1a", borderRadius: "2px" }}>
                          <div style={{ width: `${barW}%`, height: "4px", background: C.blue, borderRadius: "2px" }} />
                        </div>
                        <span style={{ fontFamily: C.mono, color: C.text, fontWeight: 700 }}>{total.toLocaleString("sv-SE")}</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 12px", color: C.purple, fontFamily: C.mono }}>{p.saldo_spel != null ? p.saldo_spel : "–"}</td>
                    <td style={{ padding: "8px 12px", color: mark > 0 ? C.green : C.dim, fontFamily: C.mono }}>
                      {mark > 0 ? `+${mark}` : "–"}
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: C.mono, color: social == null ? C.dim : social >= 0 ? C.green : C.red }}>
                      {social == null ? "–" : social >= 0 ? `+${social}` : social}
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: C.mono, color: market == null ? C.dim : market >= 0 ? C.green : C.red }}>
                      {market == null ? "–" : market >= 0 ? `+${Math.round(market)}` : Math.round(market)}
                    </td>
                    <td style={{ padding: "8px 12px", color: lobby ? C.yellow : C.dim, fontFamily: C.mono }}>
                      {lobby ? `+${Math.round(lobby)}` : "–"}
                    </td>
                  </tr>
                );
              })}
              {/* Statskassa */}
              <tr style={{ borderTop: `1px solid ${C.border}`, background: "#0d0d08" }}>
                <td style={{ padding: "8px 12px", color: C.dim, fontFamily: C.mono }}>–</td>
                <td style={{ padding: "8px 12px", color: C.yellow, fontFamily: "Georgia, serif" }}>🏛 Statskassan</td>
                <td colSpan={6} style={{ padding: "8px 12px", color: C.yellow, fontFamily: C.mono }}>{(statskassa || 0).toLocaleString("sv-SE")} kr</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </section>

      {/* ── BESÖKARE ── */}
      {liveVisitors.length > 0 && (
        <section>
          <Label>Besökare · top {liveVisitors.length} efter saldo</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
            {liveVisitors.map((v, i) => {
              const erJag = mittNamn && v.display_name === mittNamn;
              return (
                <Card key={v.display_name} style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: erJag ? `1px solid rgba(34,211,238,0.5)` : undefined, background: erJag ? "#071215" : undefined }}>
                  <div>
                    <div style={{ fontSize: "10px", color: erJag ? C.cyan : "#aaa", fontFamily: C.mono }}>
                      #{i + 1} {v.display_name}{erJag ? " 👤" : ""}
                    </div>
                    <div style={{ fontSize: "8px", color: C.dim, fontFamily: C.mono, marginTop: "2px" }}>
                      Gick med {new Date(v.skapad).toLocaleDateString("sv-SE")}
                    </div>
                  </div>
                  <div style={{ fontSize: "16px", fontFamily: C.mono, fontWeight: 700, color: erJag ? C.cyan : "#e0e0e0" }}>
                    {(v.saldo || 0).toLocaleString("sv-SE")}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── TIDSSERIE ── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <Label>Ekonomisk tidsserie</Label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[30, 60, 90].map(d => (
              <button key={d} onClick={() => setRange(d)}
                style={{ fontSize: "9px", padding: "3px 10px", border: `1px solid ${range === d ? C.blue : C.border}`, borderRadius: "4px", background: range === d ? "rgba(96,165,250,0.1)" : "transparent", color: range === d ? C.blue : C.dim, cursor: "pointer", fontFamily: C.mono }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        {tidsData.length > 1 ? (
          <Card>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={tidsData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="datum" tick={{ fontSize: 9, fill: "#555", fontFamily: "monospace" }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#555", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace" }}
                  labelStyle={{ color: "#888" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", color: "#666" }} />
                <Line type="monotone" dataKey="gini" name="Gini" stroke={C.red} dot={false} strokeWidth={1.5} connectNulls />
                <Line type="monotone" dataKey="mobilitet" name="Mobilitet %" stroke={C.green} dot={false} strokeWidth={1.5} connectNulls />
                <Line type="monotone" dataKey="risk" name="Oligarkirisk %" stroke={C.yellow} dot={false} strokeWidth={1.5} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card><p style={{ color: C.dim, fontSize: "13px", margin: 0, fontFamily: C.mono }}>Ingen historisk data ännu — grafen fylls på dagligen.</p></Card>
        )}
      </section>

    </div>
  );
}
