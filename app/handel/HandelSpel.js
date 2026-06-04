"use client";
import { useState, useEffect, useCallback } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

function resekostnad(a, b) {
  if (!a || !b) return 0;
  const dx = a.svg_x - b.svg_x, dy = a.svg_y - b.svg_y;
  return Math.max(15, Math.floor(Math.sqrt(dx * dx + dy * dy) / 4));
}

const MAP_W = 320, MAP_H = 510;

export default function HandelSpel({ initialData }) {
  const { städer, varor } = initialData;
  const [priser, setPriser] = useState(initialData.priser);
  const [leaderboard, setLeaderboard] = useState(initialData.leaderboard);
  const [spelare, setSpelare] = useState(null);
  const [snInput, setSnInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [kopMangd, setKopMangd] = useState(10);
  const [tab, setTab] = useState("handel");

  const currentStad = städer.find(s => s.id === spelare?.stad_id) ?? null;
  const currentPriser = priser.filter(p => p.stad_id === spelare?.stad_id);
  const lastVara = varor.find(v => v.id === spelare?.last_vara_id) ?? null;

  async function loadSpelare(sn) {
    const r = await fetch(
      `${SB_URL}/rest/v1/handel_spelare?smeknamn=eq.${encodeURIComponent(sn)}&select=*`,
      { headers: H }
    ).catch(() => null);
    const rows = r?.ok ? await r.json() : [];
    if (rows.length) setSpelare(rows[0]);
  }

  useEffect(() => {
    const sn = localStorage.getItem("handel_smeknamn");
    if (sn) loadSpelare(sn);
  }, []);

  const refresh = useCallback(async (sn) => {
    const target = sn ?? spelare?.smeknamn;
    if (!target) return;
    const [prRes, ldRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/handel_priser?select=*`, { headers: H }).catch(() => null),
      fetch(`${SB_URL}/rest/v1/handel_spelare?order=mynt.desc&limit=15&select=id,smeknamn,mynt,stad_id,spelare_typ`, { headers: H }).catch(() => null),
    ]);
    if (prRes?.ok) setPriser(await prRes.json());
    if (ldRes?.ok) setLeaderboard(await ldRes.json());
    await loadSpelare(target);
  }, [spelare?.smeknamn]);

  async function callApi(path, body) {
    setLoading(true);
    setMsg(null);
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = r ? await r.json() : { error: "Nätverksfel" };
    setMsg({ typ: r?.ok ? "ok" : "fel", text: data.meddelande ?? data.error ?? "Okänt fel" });
    if (r?.ok) await refresh();
    setLoading(false);
    return r?.ok ?? false;
  }

  async function registrera(e) {
    e.preventDefault();
    const sn = snInput.trim();
    if (sn.length < 2 || sn.length > 20) {
      setMsg({ typ: "fel", text: "Smeknamnet måste vara 2–20 tecken" });
      return;
    }
    const ok = await callApi("/api/handel/registrera", { smeknamn: sn });
    if (ok) {
      localStorage.setItem("handel_smeknamn", sn);
      await loadSpelare(sn);
    }
  }

  // Best trade hints: buy good X here, travel to city Y, sell for net profit
  // Travel cost is a one-time trip cost — amortize across the full cargo
  const handelTips = varor.flatMap(v => {
    const buyP = currentPriser.find(p => p.vara_id === v.id)?.kop_pris;
    if (!buyP) return [];
    return städer
      .filter(s => s.id !== spelare?.stad_id)
      .map(s => {
        const sp = priser.find(p => p.stad_id === s.id && p.vara_id === v.id);
        const tc = resekostnad(currentStad, s);
        if (!sp) return null;
        const mynt = spelare?.mynt ?? 1000;
        const maxRad = mynt - tc;
        if (maxRad <= 0) return null;
        const maxMangd = Math.min(100, Math.floor(maxRad / buyP));
        if (maxMangd < 1) return null;
        const netTotal = (sp.salj_pris - buyP) * maxMangd - tc;
        return netTotal > 0 ? { vara: v, stad: s, net: netTotal, mangd: maxMangd, tc } : null;
      })
      .filter(Boolean);
  }).sort((a, b) => b.net - a.net).slice(0, 5);

  // ── Registration screen ──────────────────────────────────────────────
  if (!spelare) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 20px", fontFamily: "Georgia, serif" }}>
        <h1 style={{ color: "#e879f9", fontSize: 28, marginBottom: 6 }}>🚢 Handelsimperium</h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>
          Börja med 1 000 mynt och ett fartyg. Köp varor billigt, resa till en annan stad, sälj med vinst.
        </p>
        <form onSubmit={registrera}>
          <input value={snInput} onChange={e => setSnInput(e.target.value)}
            placeholder="Välj ett smeknamn (2–20 tecken)"
            style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6,
              color: "#f0ede6", fontSize: 16, padding: "12px 16px", outline: "none", boxSizing: "border-box" }} />
          <button type="submit" disabled={loading}
            style={{ marginTop: 12, width: "100%", background: "#e879f9", border: "none", borderRadius: 6,
              color: "#000", fontSize: 16, fontWeight: 700, padding: 12, cursor: "pointer" }}>
            {loading ? "Registrerar…" : "Starta handel →"}
          </button>
        </form>
        {msg && <p style={{ marginTop: 16, color: msg.typ === "ok" ? "#4ade80" : "#f87171", fontSize: 14 }}>{msg.text}</p>}

        <h3 style={{ color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 40, marginBottom: 12 }}>
          Leaderboard
        </h3>
        {leaderboard.map((sp, i) => {
          const stad = städer.find(s => s.id === sp.stad_id);
          return (
            <div key={sp.id} style={{ display: "flex", justifyContent: "space-between",
              borderBottom: "1px solid #1a1a1a", padding: "7px 0" }}>
              <span style={{ color: i < 3 ? "#fbbf24" : "#888", fontSize: 13 }}>
                {["🥇","🥈","🥉"][i] ?? `${i+1}.`} {sp.smeknamn} {sp.spelare_typ === "agent" ? "🤖" : ""}
                {stad && <span style={{ color: "#555", fontSize: 11 }}> · {stad.namn}</span>}
              </span>
              <span style={{ color: "#e879f9", fontSize: 13, fontFamily: "monospace" }}>{sp.mynt} 🪙</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Main game screen ─────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "20px 16px", fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #1a1a1a", paddingBottom: 14, marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <span style={{ color: "#e879f9", fontSize: 22 }}>🚢 Handelsimperium</span>
          <span style={{ color: "#888", fontSize: 13, marginLeft: 14 }}>
            {spelare.smeknamn} · {currentStad?.namn} · <b style={{ color: "#fbbf24" }}>{spelare.mynt} 🪙</b>
            {spelare.last_mangd > 0 && (
              <span style={{ color: "#4ade80", marginLeft: 10 }}>
                Last: {spelare.last_mangd}× {lastVara?.ikon} {lastVara?.namn}
              </span>
            )}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["handel","karta","ledare"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: tab === t ? "#1a1a1a" : "none", border: "1px solid #333",
                borderRadius: 6, color: tab === t ? "#f0ede6" : "#666",
                fontSize: 13, padding: "5px 14px", cursor: "pointer" }}>
              {t === "handel" ? "Handel" : t === "karta" ? "Karta" : "Ledare"}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 6,
          background: msg.typ === "ok" ? "#052e16" : "#2d0808",
          border: `1px solid ${msg.typ === "ok" ? "#16a34a" : "#dc2626"}`,
          color: msg.typ === "ok" ? "#4ade80" : "#f87171", fontSize: 14 }}>
          {msg.text}
        </div>
      )}

      {/* ── HANDEL tab ── */}
      {tab === "handel" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20 }}>
          <div>
            <h2 style={{ color: "#f0ede6", fontSize: 15, marginBottom: 12 }}>
              📍 Marknad i {currentStad?.namn}
            </h2>

            {/* Sell banner */}
            {spelare.last_mangd > 0 && (() => {
              const sellPris = currentPriser.find(p => p.vara_id === spelare.last_vara_id)?.salj_pris ?? 0;
              return (
                <div style={{ background: "#0d2d1a", border: "1px solid #16a34a", borderRadius: 8,
                  padding: "11px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between",
                  alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ color: "#4ade80", fontSize: 14 }}>
                    {lastVara?.ikon} {spelare.last_mangd}× {lastVara?.namn} i lasten
                  </span>
                  <button onClick={() => callApi("/api/handel/salj", { smeknamn: spelare.smeknamn })}
                    disabled={loading}
                    style={{ background: "#16a34a", border: "none", borderRadius: 6,
                      color: "#fff", fontSize: 13, padding: "6px 14px", cursor: "pointer" }}>
                    Sälj för {sellPris * spelare.last_mangd} 🪙
                  </button>
                </div>
              );
            })()}

            {/* Market table */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Vara","Köpkurs","Säljkurs","Köp"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 11, color: "#555",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      padding: "0 10px 8px 0", borderBottom: "1px solid #1a1a1a" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {varor.map(v => {
                  const p = currentPriser.find(pr => pr.vara_id === v.id);
                  if (!p) return null;
                  const canBuy = spelare.last_mangd === 0 || spelare.last_vara_id === v.id;
                  const remaining = 100 - (spelare.last_vara_id === v.id ? spelare.last_mangd : 0);
                  return (
                    <tr key={v.id} style={{ borderBottom: "1px solid #111" }}>
                      <td style={{ padding: "9px 10px 9px 0", color: "#f0ede6", fontSize: 14 }}>
                        {v.ikon} {v.namn}
                      </td>
                      <td style={{ padding: "9px 10px", color: "#60a5fa", fontSize: 14, fontFamily: "monospace" }}>
                        {p.kop_pris} 🪙
                      </td>
                      <td style={{ padding: "9px 10px", color: "#4ade80", fontSize: 14, fontFamily: "monospace" }}>
                        {p.salj_pris} 🪙
                      </td>
                      <td style={{ padding: "9px 0" }}>
                        {canBuy && remaining > 0 && (
                          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <input type="number" min={1} max={Math.min(remaining, Math.floor(spelare.mynt / p.kop_pris))}
                              defaultValue={Math.min(10, remaining)}
                              id={`qty-${v.id}`}
                              style={{ width: 50, background: "#111", border: "1px solid #333",
                                borderRadius: 4, color: "#f0ede6", fontFamily: "monospace",
                                fontSize: 13, padding: "4px 6px", outline: "none" }} />
                            <button
                              onClick={() => {
                                const qty = parseInt(document.getElementById(`qty-${v.id}`)?.value) || 1;
                                callApi("/api/handel/kop", { smeknamn: spelare.smeknamn, vara_id: v.id, mangd: qty });
                              }}
                              disabled={loading || spelare.mynt < p.kop_pris}
                              style={{ background: "#1e3a5a", border: "1px solid #3b82f6", borderRadius: 4,
                                color: "#93c5fd", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>
                              Köp
                            </button>
                          </div>
                        )}
                        {!canBuy && <span style={{ color: "#444", fontSize: 12 }}>Sälj först</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Travel */}
            <h2 style={{ color: "#f0ede6", fontSize: 15, marginTop: 24, marginBottom: 12 }}>⛵ Resa till</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
              {städer.filter(s => s.id !== spelare.stad_id).map(s => {
                const cost = resekostnad(currentStad, s);
                const ok = spelare.mynt >= cost;
                return (
                  <button key={s.id}
                    onClick={() => ok && !loading && callApi("/api/handel/resa", { smeknamn: spelare.smeknamn, till_stad_id: s.id })}
                    disabled={!ok || loading}
                    style={{ background: "#0d1520", border: `1px solid ${ok ? "#1e3a5a" : "#111"}`,
                      borderRadius: 8, padding: "10px 12px", cursor: ok ? "pointer" : "not-allowed",
                      textAlign: "left", opacity: ok ? 1 : 0.45 }}>
                    <div style={{ color: "#f0ede6", fontSize: 13 }}>{s.namn}</div>
                    <div style={{ color: "#60a5fa", fontSize: 12, fontFamily: "monospace", marginTop: 2 }}>
                      −{cost} 🪙
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background: "#0d1520", border: "1px solid #1e3a5a",
              borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <h3 style={{ color: "#e879f9", fontSize: 13, margin: "0 0 12px" }}>Din status</h3>
              {[["Kapital", `${spelare.mynt} 🪙`],
                ["Plats", currentStad?.namn ?? "—"],
                ["Last", spelare.last_mangd > 0 ? `${spelare.last_mangd}× ${lastVara?.ikon} ${lastVara?.namn}` : "Tom"]
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#666", fontSize: 13 }}>{k}</span>
                  <span style={{ color: "#f0ede6", fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Trade hints */}
            {handelTips.length > 0 && (
              <div style={{ background: "#0d1520", border: "1px solid #1e3a5a", borderRadius: 8, padding: 16 }}>
                <h3 style={{ color: "#fbbf24", fontSize: 13, margin: "0 0 10px" }}>💡 Bästa affärer härifrån</h3>
                {handelTips.map((t, i) => (
                  <div key={i} style={{ borderBottom: "1px solid #111", padding: "5px 0",
                    fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#f0ede6" }}>{t.vara.ikon} {t.vara.namn} → {t.stad.namn}</span>
                    <span style={{ color: "#4ade80", fontFamily: "monospace" }}>+{t.net} 🪙 ({t.mangd}st)</span>
                  </div>
                ))}
                <p style={{ color: "#444", fontSize: 11, margin: "8px 0 0" }}>
                  (total nettovinst med maxlast, resekostnad inräknad)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KARTA tab ── */}
      {tab === "karta" && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width={MAP_W} height={MAP_H} style={{ background: "#0d1a2d", borderRadius: 10 }}>
            {/* Sweden mainland silhouette — realistic shape, clockwise from NW corner */}
            <path d={[
              // NW corner (Treriksröset / Norwegian border)
              "M 117 30",
              // Northern border going east toward Finnish corner
              "C 138 22, 162 17, 190 14",
              "C 210 14, 230 18, 250 24",
              // East coast – Gulf of Bothnia going south
              "C 255 38, 256 58, 253 80",
              "C 251 102, 248 122, 244 143",
              "L 238 158",    // Umeå
              "C 237 173, 235 188, 233 204",
              "L 232 222",    // Sundsvall
              // Coast bends east-southeast toward Stockholm
              "C 234 238, 239 254, 246 270",
              "C 252 286, 259 299, 264 312",   // Stockholm
              // South of Stockholm – coast turns southwest
              "C 266 325, 264 338, 258 350",
              "C 253 362, 252 375, 253 388",
              // Kalmar / Blekinge coast
              "C 253 400, 251 413, 247 425",
              // Southeast corner swings west
              "C 242 437, 234 449, 224 461",
              "C 214 473, 203 484, 194 496",
              "L 192 500",    // Malmö
              // West along Skåne coast
              "C 183 506, 171 506, 161 500",
              "C 154 494, 151 483, 151 472",
              // Halland – west coast heading north
              "C 150 460, 151 448, 153 436",
              "L 164 422",    // Göteborg (sticks out east vs Bohuslän)
              // Bohuslän – fjord coast goes back west/north
              "C 150 412, 137 397, 127 382",
              "C 119 366, 112 350, 110 335",
              // Norwegian border – runs north-northwest along fjällen
              "C 109 320, 110 307, 112 293",
              "C 113 278, 115 264, 115 250",
              "C 115 236, 114 222, 113 208",
              "C 112 194, 112 180, 113 166",
              "C 114 152, 115 138, 115 124",
              "C 115 110, 114 96, 114 82",
              "C 114 68, 114 54, 116 42",
              "C 116 37, 117 33, 117 30 Z",
            ].join(" ")}
              fill="#132240" stroke="#2a4a6e" strokeWidth="1.5" />
            {/* Gotland island */}
            <ellipse cx="287" cy="350" rx="9" ry="22" fill="#132240" stroke="#2a4a6e" strokeWidth="1.2" />
            {/* Öland island */}
            <ellipse cx="257" cy="416" rx="4" ry="18" fill="#132240" stroke="#2a4a6e" strokeWidth="1" />

            {/* Dashed lines between all cities */}
            {städer.map(a => städer.filter(b => b.id > a.id).map(b => (
              <line key={`${a.id}-${b.id}`} x1={a.svg_x} y1={a.svg_y} x2={b.svg_x} y2={b.svg_y}
                stroke="#1a2e44" strokeWidth="0.7" strokeDasharray="3,5" />
            )))}

            {/* Cities */}
            {städer.map(s => {
              const isCur = s.id === spelare.stad_id;
              const cost = currentStad ? resekostnad(currentStad, s) : 0;
              return (
                <g key={s.id}
                  style={{ cursor: !isCur && spelare.mynt >= cost ? "pointer" : "default" }}
                  onClick={() => !isCur && !loading && spelare.mynt >= cost &&
                    callApi("/api/handel/resa", { smeknamn: spelare.smeknamn, till_stad_id: s.id })}>
                  <circle cx={s.svg_x} cy={s.svg_y} r={isCur ? 9 : 6}
                    fill={isCur ? "#e879f9" : "#3b82f6"}
                    stroke={isCur ? "#f5a6ff" : "#93c5fd"} strokeWidth={isCur ? 2 : 1} />
                  <text x={s.svg_x + 12} y={s.svg_y + 4} fill={isCur ? "#f0ede6" : "#94a3b8"}
                    fontSize="11" fontFamily="Georgia, serif">{s.namn}</text>
                  {currentStad && !isCur && (
                    <text x={s.svg_x + 12} y={s.svg_y + 15} fill="#60a5fa"
                      fontSize="10" fontFamily="monospace">−{cost}🪙</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* ── LEDARE tab ── */}
      {tab === "ledare" && (
        <div style={{ maxWidth: 480 }}>
          <h2 style={{ color: "#f0ede6", fontSize: 15, marginBottom: 14 }}>🏆 Leaderboard</h2>
          {leaderboard.map((sp, i) => {
            const stad = städer.find(s => s.id === sp.stad_id);
            return (
              <div key={sp.id} style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", borderBottom: "1px solid #1a1a1a", padding: "9px 0" }}>
                <div>
                  <span style={{ color: i < 3 ? "#fbbf24" : "#888", fontSize: 14 }}>
                    {["🥇","🥈","🥉"][i] ?? `${i+1}.`} {sp.smeknamn} {sp.spelare_typ === "agent" ? "🤖" : ""}
                  </span>
                  {stad && <span style={{ color: "#555", fontSize: 12, marginLeft: 8 }}>{stad.namn}</span>}
                </div>
                <span style={{ color: "#e879f9", fontSize: 14, fontFamily: "monospace" }}>{sp.mynt} 🪙</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
