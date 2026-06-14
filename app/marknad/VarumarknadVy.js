"use client";

import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const BESOKARE_FARG = "#22d3ee";

const BASPRIS = { el: 15, spannmål: 10, maskiner: 25, malm: 20, tjänster: 18, fisk: 12, virke: 14, mjöl: 15, stål: 36 };
const VARA_IKON = { el: "⚡", spannmål: "🌾", maskiner: "🏭", malm: "⛏️", tjänster: "🏙️", fisk: "🌊", virke: "🌲", mjöl: "🍞", stål: "🔩" };
const TYP_TILL_VARA = { energi: "el", jordbruk: "spannmål", industri: "maskiner", gruva: "malm", stad: "tjänster", kust: "fisk", skog: "virke" };
const VAROR = ["el", "spannmål", "maskiner", "malm", "tjänster", "fisk", "virke"];
const FORADLADE = ["mjöl", "stål"];
const FORADLINGS_KEDJOR = [
  { ravara: "spannmål", produkt: "mjöl", krav_zon: "stad",     ratio: 2, bonus_pct: 50 },
  { ravara: "malm",     produkt: "stål", krav_zon: "industri", ratio: 2, bonus_pct: 80 },
];

const C = { bg: "#0a0a0a", card: "#0d0d0d", border: "#1e1e1e", muted: "#888880", dim: "#444", mono: "monospace" };

function Label({ children }) {
  return <p style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>{children}</p>;
}

function Card({ children, style }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px", ...style }}>{children}</div>;
}

function TrendPil({ mult }) {
  if (mult > 1.05) return <span style={{ color: "#4ade80", fontSize: "12px" }}>▲</span>;
  if (mult < 0.95) return <span style={{ color: "#f87171", fontSize: "12px" }}>▼</span>;
  return <span style={{ color: C.dim, fontSize: "12px" }}>—</span>;
}

function Nedrakning({ stangerAt }) {
  const [kvar, setKvar] = useState("");

  useEffect(() => {
    function upd() {
      const diff = new Date(stangerAt) - Date.now();
      if (diff <= 0) { setKvar("stängd"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setKvar(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    upd();
    const id = setInterval(upd, 30000);
    return () => clearInterval(id);
  }, [stangerAt]);

  if (kvar === "stängd") return <span style={{ fontSize: "10px", color: "#555", fontFamily: C.mono }}>Stängd</span>;
  return <span style={{ fontSize: "10px", color: "#f59e0b", fontFamily: C.mono }}>{kvar}</span>;
}

const EVENT_IKON = { torka: "☀️", gruvras: "💥", cyberattack: "🔒" };
const EVENT_FARG = { torka: "#f59e0b", gruvras: "#ef4444", cyberattack: "#a78bfa" };

export default function VarumarknadVy({ resurspriser, auktioner, handelLog, lager, foradlingLog = [], zonEvents = [], kopOrdrar = [] }) {
  const [besokareId,   setBesokareId]   = useState(null);
  const [besokareNamn, setBesokareNamn] = useState(null);
  const [besokSaldo,   setBesokSaldo]   = useState(null);
  const [aktivaAukt,   setAktivaAukt]   = useState(auktioner); // lokal kopia för optimistisk uppdatering
  const [activeBid,    setActiveBid]    = useState(null); // auktion-id
  const [bidBelopp,    setBidBelopp]    = useState("");
  const [bidMsg,       setBidMsg]       = useState(null); // inline feedback i budinput
  const [pending,      setPending]      = useState(false);
  const [now,          setNow]          = useState(null); // null tills efter mount — förhindrar SSR/hydration-mismatch
  const [markMsg,      setMarkMsg]      = useState(null);
  const [renameMode,   setRenameMode]   = useState(false);
  const [renameInput,  setRenameInput]  = useState("");
  const [saljVara,     setSaljVara]     = useState(null);   // vara som listas
  const [saljVaraAntal, setSaljVaraAntal] = useState("1");
  const [saljVaraPris,  setSaljVaraPris]  = useState("");
  const [widgetTyp,    setWidgetTyp]    = useState("kop"); // "kop" | "salj"
  const [kopVara,      setKopVara]      = useState("el");
  const [kopAntal,     setKopAntal]     = useState(1);
  const [kopMaxPris,   setKopMaxPris]   = useState(20);
  const [serverKopOrdrar, setServerKopOrdrar] = useState(kopOrdrar); // inkl. nyss skapade med order_id

  useEffect(() => {
    setNow(Date.now()); // sätt direkt efter mount
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let id = localStorage.getItem("mark_besokare_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("mark_besokare_id", id);
    }
    const hex = id.replace(/-/g, "").slice(0, 6).toUpperCase();
    const fallback = `Besökare-${hex}`;
    const namn = localStorage.getItem("mark_besokare_namn") || fallback;
    setBesokareId(id);
    setBesokareNamn(namn);

    const cachedSaldo = localStorage.getItem("mark_besokare_saldo");
    // Visa 2000 kr direkt för ny besökare utan cache — det är startsaldot
    setBesokSaldo(cachedSaldo !== null ? Number(cachedSaldo) : 2000);

    fetch(`${SB_URL}/rest/v1/visitor_wallets?id=eq.${id}&select=saldo,display_name`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (data.length) {
          setBesokSaldo(data[0].saldo);
          localStorage.setItem("mark_besokare_saldo", data[0].saldo);
          if (data[0].display_name) {
            setBesokareNamn(data[0].display_name);
            localStorage.setItem("mark_besokare_namn", data[0].display_name);
          }
        }
      })
      .catch(() => {});
  }, []);

  async function laggBudVara(auktion) {
    if (!besokareId || pending) return;
    const belopp = parseInt(bidBelopp, 10);
    if (!belopp || belopp < 10) { setBidMsg({ text: "Ange ett giltigt belopp", ok: false }); return; }
    setPending(true); setBidMsg(null);
    try {
      const r = await fetch("/api/mark/bud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auktion_id: auktion.id, belopp, besokare_id: besokareId, display_name: besokareNamn, type: "vara" }),
      });
      const d = await r.json();
      if (!r.ok) { setBidMsg({ text: d.error || "Bud misslyckades", ok: false }); return; }
      setBesokSaldo(d.saldo);
      localStorage.setItem("mark_besokare_saldo", d.saldo);
      // Uppdatera lokal auktionsstate optimistiskt så kortet reflekterar ny budgivare direkt
      setAktivaAukt(prev => prev.map(a =>
        a.id === auktion.id ? { ...a, nuv_bud: belopp, hogst_budgivare: besokareNamn } : a
      ));
      setMarkMsg({ text: `✅ Bud på ${belopp} kr lagt!`, ok: true });
      setActiveBid(null);
      setTimeout(() => setMarkMsg(null), 5000);
    } catch { setBidMsg({ text: "Nätverksfel — försök igen", ok: false }); }
    finally { setPending(false); }
  }

  async function saljVaraAuktion(vara, antal, reservpris) {
    if (!besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/salj-vara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vara, antal, reservpris, besokare_id: besokareId, display_name: besokareNamn }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
      // Optimistiskt: lägg till den nya auktionen i listan
      setAktivaAukt(prev => [...prev, {
        id: Date.now(), saljare: besokareNamn, vara, antal, reservpris,
        nuv_bud: null, hogst_budgivare: null, stanger_at: d.stanger_at, status: "öppen",
      }]);
      setSaljVara(null); setSaljVaraAntal("1"); setSaljVaraPris("");
      setMarkMsg({ text: `✅ ${antal}× ${vara} lagd på auktion — stänger om 24h!`, ok: true });
      setTimeout(() => setMarkMsg(null), 5000);
    } catch { setMarkMsg({ text: "Nätverksfel — försök igen", ok: false }); }
    finally { setPending(false); }
  }

  async function laggKopOrder() {
    if (!besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/kop-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vara: kopVara, antal: kopAntal, max_pris_per_enhet: kopMaxPris, besokare_id: besokareId, display_name: besokareNamn }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
      // API reserverar saldo direkt
      if (d.saldo !== undefined) {
        setBesokSaldo(d.saldo);
        localStorage.setItem("mark_besokare_saldo", d.saldo);
      }
      // Lägg till ordern lokalt (med ID) så den kan avbrytas direkt
      if (d.order_id) {
        setServerKopOrdrar(prev => [...prev, {
          id: d.order_id, kop_agent: besokareNamn, vara: kopVara,
          antal: kopAntal, max_pris_per_enhet: kopMaxPris, reserverat_kr: d.reserverat_kr, status: "öppen",
        }]);
      }
      setMarkMsg({ text: `📋 Köporder lagd — matchar automatiskt när en säljare väljer ditt pris.`, ok: true });
      setTimeout(() => setMarkMsg(null), 6000);
    } catch { setMarkMsg({ text: "Nätverksfel — försök igen", ok: false }); }
    finally { setPending(false); }
  }

  async function avbrytKopOrder(orderId, reserverat) {
    if (!besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/kop-order/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ besokare_id: besokareId, display_name: besokareNamn, order_id: orderId }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
      if (d.saldo !== undefined) {
        setBesokSaldo(d.saldo);
        localStorage.setItem("mark_besokare_saldo", d.saldo);
      }
      setServerKopOrdrar(prev => prev.filter(o => o.id !== orderId));
      setMarkMsg({ text: `✅ Order avbruten — ${reserverat || 0} kr återbetalade.`, ok: true });
      setTimeout(() => setMarkMsg(null), 5000);
    } catch { setMarkMsg({ text: "Nätverksfel", ok: false }); }
    finally { setPending(false); }
  }

  // Bygg resurs-map: typ → { pris_multiplier, trend }
  const resursMap = Object.fromEntries(resurspriser.map(r => [r.typ, r]));

  // Beräkna aktuellt pris per vara
  function effektivtPris(vara) {
    const typ = Object.entries(TYP_TILL_VARA).find(([, v]) => v === vara)?.[0];
    const mult = parseFloat(resursMap[typ]?.pris_multiplier || 1);
    return Math.round(BASPRIS[vara] * mult);
  }

  // Lager per vara — top 3 innehavare
  const lagerPerVara = {};
  for (const row of lager) {
    if (!lagerPerVara[row.vara]) lagerPerVara[row.vara] = [];
    lagerPerVara[row.vara].push(row);
  }

  // Totalt lager per vara
  const totaltLager = {};
  for (const vara of VAROR) {
    totaltLager[vara] = (lagerPerVara[vara] || []).reduce((s, r) => s + r.antal, 0);
  }

  // Handelsvolym per vara (senaste 50)
  const volymPerVara = {};
  for (const t of handelLog) {
    volymPerVara[t.vara] = (volymPerVara[t.vara] || 0) + t.antal;
  }

  // Mitt lager (besökare) — beräknas i render, uppdateras när besokareNamn sätts
  const mittLager = besokareNamn ? lager.filter(r => r.agent === besokareNamn) : [];

  // Lager per agent per vara (for foradling context)
  const lagerPerAgent = {};
  for (const row of lager) {
    if (!lagerPerAgent[row.agent]) lagerPerAgent[row.agent] = {};
    lagerPerAgent[row.agent][row.vara] = row.antal;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ── BESÖKAR-HUD ── */}
      {besokareNamn && (
        <div style={{ background: "#070f10", border: `1px solid rgba(34,211,238,0.25)`, borderRadius: "8px", padding: "10px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", color: BESOKARE_FARG, fontFamily: C.mono, letterSpacing: "0.08em" }}>👤 {besokareNamn}</span>
            <span style={{ fontSize: "15px", color: "#e0e0e0", fontFamily: C.mono, fontWeight: 700 }}>
              {besokSaldo !== null ? `${besokSaldo.toLocaleString("sv-SE")} kr` : "…"}
            </span>
            <span style={{ fontSize: "9px", color: "rgba(34,211,238,0.5)", fontFamily: C.mono }}>· varumarknaden</span>
            <button
              onClick={() => { setRenameMode(v => !v); setRenameInput(""); setMarkMsg(null); }}
              style={{ marginLeft: "auto", fontSize: "9px", color: "rgba(34,211,238,0.6)", background: "none", border: "none", cursor: "pointer", fontFamily: C.mono, letterSpacing: "0.05em" }}
            >✏️ byt namn</button>
            {markMsg && (
              <span style={{ fontSize: "11px", color: markMsg.ok ? "#4ade80" : "#f87171", fontFamily: C.mono }}>
                {markMsg.text}
              </span>
            )}
          </div>
          {renameMode && (
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", color: "#888", fontFamily: C.mono }}>Besökare-</span>
              <input
                value={renameInput}
                onChange={e => setRenameInput(e.target.value)}
                placeholder="ditt-namn"
                maxLength={20}
                style={{ background: "#111", border: "1px solid rgba(34,211,238,0.3)", borderRadius: "4px", color: "#f0ede6", fontFamily: C.mono, fontSize: "11px", padding: "3px 8px", width: "140px" }}
              />
              <button
                disabled={pending || renameInput.trim().length < 2}
                onClick={async () => {
                  if (pending) return;
                  setPending(true); setMarkMsg(null);
                  try {
                    const r = await fetch("/api/mark/namn", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ besokare_id: besokareId, old_name: besokareNamn, new_suffix: renameInput.trim() }),
                    });
                    const d = await r.json();
                    if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
                    setBesokareNamn(d.new_name);
                    localStorage.setItem("mark_besokare_namn", d.new_name);
                    setRenameMode(false);
                    setMarkMsg({ text: "Namn uppdaterat!", ok: true });
                  } finally { setPending(false); }
                }}
                style={{ fontSize: "10px", background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.4)", borderRadius: "4px", color: BESOKARE_FARG, cursor: "pointer", padding: "3px 10px", fontFamily: C.mono }}
              >Spara</button>
              <button onClick={() => setRenameMode(false)} style={{ fontSize: "9px", color: "#555", background: "none", border: "none", cursor: "pointer" }}>avbryt</button>
            </div>
          )}
        </div>
      )}

      {/* ── MITT KONTO: LAGER + HANDELSWIDGET ── */}
      {besokareNamn && (
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(240px, 300px)", gap: "16px", alignItems: "start" }}>

            {/* Mitt lager */}
            <div>
              <Label>Mitt lager · {besokareNamn}</Label>
              {mittLager.length === 0 ? (
                <Card><p style={{ color: C.dim, fontSize: "12px", margin: 0 }}>Du har inget lager ännu — köp varor till höger!</p></Card>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
                  {mittLager.map(r => {
                    const harAktivAukt = now !== null && aktivaAukt.some(
                      a => a.saljare === besokareNamn && a.vara === r.vara && new Date(a.stanger_at) > now
                    );
                    return (
                      <Card key={r.vara} style={{ padding: "10px 14px", border: `1px solid rgba(34,211,238,0.2)` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "18px" }}>{VARA_IKON[r.vara] || "📦"}</span>
                          {harAktivAukt && (
                            <span style={{ fontSize: "8px", color: "#f59e0b", fontFamily: C.mono, background: "rgba(245,158,11,0.1)", padding: "1px 5px", borderRadius: "3px" }}>📋 på auktion</span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#f0ede6", fontFamily: C.mono, textTransform: "capitalize", marginTop: "4px" }}>{r.vara}</div>
                        <div style={{ fontSize: "18px", color: BESOKARE_FARG, fontFamily: C.mono, fontWeight: 700 }}>{r.antal}</div>
                        <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>≈ {Math.round(r.antal * (BASPRIS[r.vara] || 0))} kr</div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* KÖP/SÄLJ widget */}
            <div>
              <Label>Handla varor</Label>
              <Card>
                {/* Tabs */}
                <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                  {[["kop", "⬆️ KÖP"], ["salj", "⬇️ SÄLJ"]].map(([typ, lbl]) => (
                    <button key={typ} onClick={() => setWidgetTyp(typ)}
                      style={{ flex: 1, padding: "6px 0", fontSize: "11px", fontFamily: C.mono, fontWeight: widgetTyp === typ ? 700 : 400,
                        background: widgetTyp === typ ? "rgba(34,211,238,0.12)" : "transparent",
                        border: `1px solid ${widgetTyp === typ ? "rgba(34,211,238,0.5)" : "#333"}`,
                        color: widgetTyp === typ ? BESOKARE_FARG : C.dim, borderRadius: "4px", cursor: "pointer" }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* KÖP form */}
                {widgetTyp === "kop" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, marginBottom: "4px", letterSpacing: "0.1em" }}>VARA</div>
                      <select value={kopVara} onChange={e => setKopVara(e.target.value)}
                        style={{ width: "100%", background: "#0d1117", border: `1px solid rgba(34,211,238,0.25)`, color: "#f0ede6", borderRadius: "4px", padding: "6px 8px", fontSize: "12px", fontFamily: C.mono }}>
                        {[...VAROR, ...FORADLADE].map(v => (
                          <option key={v} value={v}>{VARA_IKON[v]} {v} — baspris {BASPRIS[v]} kr</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, marginBottom: "4px", letterSpacing: "0.1em" }}>ANTAL</div>
                        <input type="number" min="1" max="100" value={kopAntal}
                          onChange={e => setKopAntal(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ width: "100%", background: "#0d1117", border: `1px solid rgba(34,211,238,0.25)`, color: "#f0ede6", borderRadius: "4px", padding: "6px 8px", fontSize: "12px", fontFamily: C.mono, boxSizing: "border-box" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, marginBottom: "4px", letterSpacing: "0.1em" }}>MAX KR/ST</div>
                        <input type="number" min="5" value={kopMaxPris}
                          onChange={e => setKopMaxPris(Math.max(5, parseInt(e.target.value) || 5))}
                          style={{ width: "100%", background: "#0d1117", border: `1px solid rgba(34,211,238,0.25)`, color: "#f0ede6", borderRadius: "4px", padding: "6px 8px", fontSize: "12px", fontFamily: C.mono, boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>
                      Max totalt: {kopAntal * kopMaxPris} kr · Saldo: {besokSaldo !== null ? `${besokSaldo} kr` : "…"}
                    </div>
                    <button onClick={laggKopOrder} disabled={pending || !besokareId}
                      style={{ width: "100%", background: "rgba(34,211,238,0.12)", border: `1px solid rgba(34,211,238,0.5)`, color: BESOKARE_FARG, borderRadius: "4px", padding: "8px 0", fontSize: "12px", fontFamily: C.mono, cursor: "pointer", fontWeight: 700, letterSpacing: "0.05em" }}>
                      {pending ? "…" : `Köp ${kopAntal}× ${kopVara}`}
                    </button>
                    {(() => {
                      const minaOrdrar = serverKopOrdrar.filter(o => o.kop_agent === besokareNamn && o.status === "öppen");
                      if (!minaOrdrar.length) return null;
                      return (
                        <div style={{ borderTop: `1px solid #1e1e1e`, paddingTop: "10px" }}>
                          <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, marginBottom: "6px", letterSpacing: "0.1em" }}>AKTIVA KÖPORDRAR</div>
                          {minaOrdrar.map(o => (
                            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: C.muted, fontFamily: C.mono, marginBottom: "5px", gap: "6px" }}>
                              <span style={{ flex: 1 }}>{VARA_IKON[o.vara]} {o.antal}× {o.vara} · max {o.max_pris_per_enhet} kr/st</span>
                              <span style={{ color: "#f59e0b", whiteSpace: "nowrap" }}>res. {o.reserverat_kr} kr</span>
                              <button onClick={() => avbrytKopOrder(o.id, o.reserverat_kr)} disabled={pending}
                                style={{ fontSize: "9px", color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "3px", padding: "1px 6px", cursor: "pointer", fontFamily: C.mono, whiteSpace: "nowrap" }}>
                                ✕ avbryt
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* SÄLJ form */}
                {widgetTyp === "salj" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {mittLager.length === 0 ? (
                      <p style={{ color: C.dim, fontSize: "12px", margin: 0 }}>Du har inget lager att sälja. Köp varor först!</p>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, marginBottom: "4px", letterSpacing: "0.1em" }}>VÄLJ VARA</div>
                          <select value={saljVara || ""} onChange={e => {
                            const v = e.target.value || null;
                            setSaljVara(v); setSaljVaraAntal("1");
                            const item = mittLager.find(r => r.vara === v);
                            if (item) setSaljVaraPris(String(BASPRIS[item.vara] || 10));
                          }}
                            style={{ width: "100%", background: "#0d1117", border: `1px solid rgba(34,211,238,0.25)`, color: "#f0ede6", borderRadius: "4px", padding: "6px 8px", fontSize: "12px", fontFamily: C.mono }}>
                            <option value="">-- välj vara --</option>
                            {mittLager.map(r => (
                              <option key={r.vara} value={r.vara}>{VARA_IKON[r.vara]} {r.vara} ({r.antal} st)</option>
                            ))}
                          </select>
                        </div>
                        {saljVara && (() => {
                          const item = mittLager.find(r => r.vara === saljVara);
                          if (!item) return null;
                          return (
                            <>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, marginBottom: "4px", letterSpacing: "0.1em" }}>ANTAL (max {item.antal})</div>
                                  <input type="number" min="1" max={item.antal} value={saljVaraAntal}
                                    onChange={e => {
                                      setSaljVaraAntal(e.target.value);
                                      const n = parseInt(e.target.value) || 1;
                                      setSaljVaraPris(String(n * (BASPRIS[saljVara] || 10)));
                                    }}
                                    style={{ width: "100%", background: "#0d1117", border: `1px solid rgba(34,211,238,0.35)`, color: "#f0ede6", borderRadius: "4px", padding: "6px 8px", fontSize: "12px", fontFamily: C.mono, boxSizing: "border-box" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, marginBottom: "4px", letterSpacing: "0.1em" }}>RESERVPRIS (kr totalt)</div>
                                  <input type="number" min="5" value={saljVaraPris}
                                    onChange={e => setSaljVaraPris(e.target.value)}
                                    style={{ width: "100%", background: "#0d1117", border: `1px solid rgba(34,211,238,0.35)`, color: "#f0ede6", borderRadius: "4px", padding: "6px 8px", fontSize: "12px", fontFamily: C.mono, boxSizing: "border-box" }} />
                                </div>
                              </div>
                              <button
                                disabled={pending || parseInt(saljVaraAntal) < 1 || parseInt(saljVaraAntal) > item.antal || parseInt(saljVaraPris) < 5}
                                onClick={() => saljVaraAuktion(saljVara, parseInt(saljVaraAntal), parseInt(saljVaraPris))}
                                style={{ width: "100%", background: "rgba(34,211,238,0.12)", border: `1px solid rgba(34,211,238,0.5)`, color: BESOKARE_FARG, borderRadius: "4px", padding: "8px 0", fontSize: "12px", fontFamily: C.mono, cursor: "pointer", fontWeight: 700 }}>
                                {pending ? "…" : `Lägg ut ${saljVaraAntal}× ${saljVara} på auktion`}
                              </button>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}
              </Card>
            </div>

          </div>
        </section>
      )}

      {/* ── FÖRÄDLINGSKEDJOR ── */}
      <section>
        <Label>Förädlingskedjor · {FORADLINGS_KEDJOR.length} aktiva</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {FORADLINGS_KEDJOR.map(k => (
            <Card key={k.produkt} style={{ borderColor: "#1e2a1e" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center", minWidth: "60px" }}>
                  <div style={{ fontSize: "20px" }}>{VARA_IKON[k.ravara]}</div>
                  <div style={{ fontSize: "10px", color: C.muted, fontFamily: C.mono, textTransform: "capitalize" }}>{k.ravara}</div>
                  <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>{BASPRIS[k.ravara]} kr</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span style={{ fontSize: "12px", color: C.dim }}>×{k.ratio}</span>
                  <span style={{ color: "#4ade80", fontSize: "14px" }}>→</span>
                  <span style={{ fontSize: "9px", color: "#4ade80", fontFamily: C.mono, textTransform: "uppercase" }}>{k.krav_zon}</span>
                </div>
                <div style={{ textAlign: "center", minWidth: "60px" }}>
                  <div style={{ fontSize: "20px" }}>{VARA_IKON[k.produkt]}</div>
                  <div style={{ fontSize: "10px", color: C.muted, fontFamily: C.mono, textTransform: "capitalize" }}>{k.produkt}</div>
                  <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>{BASPRIS[k.produkt]} kr</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{ background: "#14532d", color: "#4ade80", fontSize: "10px", fontFamily: C.mono, padding: "2px 8px", borderRadius: "4px" }}>
                    +{k.bonus_pct}%
                  </span>
                </div>
              </div>
              <div style={{ marginTop: "8px", fontSize: "9px", color: C.dim, fontFamily: C.mono }}>
                Kräver {k.krav_zon}-zon · {k.ratio} {k.ravara} → 1 {k.produkt}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── RÅVARUPRISER ── */}
      <section>
        <Label>Råvarupriser · {resurspriser.length} typer + {FORADLADE.length} förädlade</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
          {[...VAROR, ...FORADLADE].map(vara => {
            const foradlad = FORADLADE.includes(vara);
            const typ = Object.entries(TYP_TILL_VARA).find(([, v]) => v === vara)?.[0];
            const res = resursMap[typ] || {};
            const mult = parseFloat(res.pris_multiplier || 1);
            const pris = foradlad ? BASPRIS[vara] : Math.round(BASPRIS[vara] * mult);
            const bas = BASPRIS[vara];
            const lagerTotal = totaltLager[vara] || 0;
            const vol = volymPerVara[vara] || 0;
            const prisColor = foradlad ? "#fbbf24" : (mult > 1.05 ? "#4ade80" : mult < 0.95 ? "#f87171" : "#f0ede6");

            return (
              <Card key={vara} style={{ padding: "12px 14px", borderColor: foradlad ? "#2a2a1a" : C.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{VARA_IKON[vara]}</span>
                  {foradlad
                    ? <span style={{ fontSize: "9px", background: "#14532d", color: "#4ade80", fontFamily: C.mono, padding: "1px 5px", borderRadius: "3px" }}>★ förädlad</span>
                    : <TrendPil mult={mult} />}
                </div>
                <div style={{ fontSize: "11px", color: C.muted, fontFamily: C.mono, marginBottom: "4px", textTransform: "capitalize" }}>{vara}</div>
                <div style={{ fontSize: "20px", color: prisColor, fontFamily: C.mono, fontWeight: 700, lineHeight: 1 }}>
                  {pris} <span style={{ fontSize: "10px", color: C.dim }}>kr</span>
                </div>
                <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono, marginTop: "4px" }}>
                  {foradlad ? "fast pris" : `bas ${bas} kr · ×${mult.toFixed(3)}`}
                </div>
                <div style={{ marginTop: "8px", height: "1px", background: C.border }} />
                <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>lager {lagerTotal}</span>
                  <span style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>vol {vol}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── ÖPPNA AUKTIONER ── */}
      <section>
        {(() => {
          const ejUtgångna = now === null ? aktivaAukt : aktivaAukt.filter(a => new Date(a.stanger_at) > now);
          return (
            <>
              <Label>Öppna auktioner · {ejUtgångna.length} st</Label>
              {ejUtgångna.length === 0 ? (
                <Card><p style={{ color: C.dim, fontSize: "13px", margin: 0 }}>Inga aktiva auktioner just nu — nya startas automatiskt av agenterna.</p></Card>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
                  {ejUtgångna.map(a => {
              const ikon = VARA_IKON[a.vara] || "📦";
              const harBud = a.nuv_bud && a.hogst_budgivare;
              return (
                <Card key={a.id} style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "15px", fontFamily: C.mono, color: "#f0ede6" }}>
                      {ikon} {a.antal}× <span style={{ textTransform: "capitalize" }}>{a.vara}</span>
                    </span>
                    <Nedrakning stangerAt={a.stanger_at} />
                  </div>
                  <div style={{ fontSize: "10px", color: C.muted, fontFamily: C.mono, marginBottom: "6px" }}>
                    Säljare: {a.saljare}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>RESERVPRIS</div>
                      <div style={{ fontSize: "13px", color: C.muted, fontFamily: C.mono }}>{a.reservpris} kr</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>HÖGSTA BUD</div>
                      {harBud ? (
                        <>
                          <div style={{ fontSize: "16px", color: "#fbbf24", fontFamily: C.mono, fontWeight: 700 }}>{a.nuv_bud} kr</div>
                          <div style={{ fontSize: "9px", color: a.hogst_budgivare === besokareNamn ? BESOKARE_FARG : C.dim, fontFamily: C.mono }}>{a.hogst_budgivare}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: "13px", color: C.dim, fontFamily: C.mono }}>inga bud</div>
                      )}
                    </div>
                  </div>
                  {/* Besökar-budknapp */}
                  {besokareNamn && a.saljare !== besokareNamn && (() => {
                    const isExpired = now !== null && new Date(a.stanger_at) <= now;
                    if (isExpired) return (
                      <div style={{ marginTop: "10px", fontSize: "10px", color: "#444", fontFamily: C.mono }}>Auktionen är stängd</div>
                    );
                    const minBud = Math.max(a.reservpris || 0, (a.nuv_bud || 0) + 10);
                    if (a.hogst_budgivare === besokareNamn) {
                      return <div style={{ marginTop: "10px", fontSize: "10px", color: BESOKARE_FARG, fontFamily: C.mono }}>✓ Du leder budgivningen</div>;
                    }
                    if (activeBid === a.id) {
                      return (
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <input
                              type="number" value={bidBelopp} min={minBud}
                              onChange={e => setBidBelopp(e.target.value)}
                              placeholder={`min ${minBud} kr`}
                              style={{ flex: 1, background: "#0d1117", border: `1px solid rgba(34,211,238,0.4)`, color: "#f0ede6", borderRadius: "4px", padding: "5px 8px", fontSize: "11px", fontFamily: C.mono, width: "80px" }}
                            />
                            <button onClick={() => laggBudVara(a)} disabled={pending}
                              style={{ background: `rgba(34,211,238,0.12)`, border: `1px solid rgba(34,211,238,0.5)`, color: BESOKARE_FARG, borderRadius: "4px", padding: "5px 10px", fontSize: "10px", fontFamily: C.mono, cursor: "pointer" }}>
                              {pending ? "…" : "Bud!"}
                            </button>
                            <button onClick={() => { setActiveBid(null); setBidMsg(null); }}
                              style={{ background: "transparent", border: `1px solid #333`, color: C.dim, borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: C.mono, cursor: "pointer" }}>
                              ✕
                            </button>
                          </div>
                          {bidMsg && (
                            <div style={{ marginTop: "5px", fontSize: "10px", color: bidMsg.ok ? "#4ade80" : "#f87171", fontFamily: C.mono }}>
                              {bidMsg.text}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <button onClick={() => { setActiveBid(a.id); setBidBelopp(String(minBud)); setBidMsg(null); }}
                        style={{ marginTop: "10px", width: "100%", background: "transparent", border: `1px solid rgba(34,211,238,0.3)`, color: BESOKARE_FARG, borderRadius: "4px", padding: "6px", fontSize: "10px", fontFamily: C.mono, cursor: "pointer" }}>
                        🏷️ Lägg bud ({minBud}+ kr)
                      </button>
                    );
                  })()}
                  </Card>
                );
              })}
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* ── HANDELSLOGG ── */}
      <section>
        <Label>Senaste affärer · {handelLog.length} visas</Label>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {handelLog.length === 0 ? (
            <p style={{ color: C.dim, fontSize: "13px", margin: "16px" }}>Inga affärer ännu.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: C.mono }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["VARA", "ANT", "KR/ST", "TOTALT", "KÖPARE", "SÄLJARE", "TID"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.dim, fontSize: "9px", letterSpacing: "0.1em", fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {handelLog.map((t, i) => {
                  const ikon = VARA_IKON[t.vara] || "📦";
                  const datum = new Date(t.skapad);
                  const tid = datum.toLocaleDateString("sv-SE", { month: "short", day: "numeric", timeZone: "Europe/Stockholm" }) + " " +
                    datum.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });
                  const baspris = BASPRIS[t.vara] || 1;
                  const mult = t.pris_per_enhet / baspris;
                  const prisColor = mult > 1.05 ? "#4ade80" : mult < 0.95 ? "#f87171" : "#f0ede6";
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid #111`, background: i % 2 === 0 ? "transparent" : "#0b0b0b" }}>
                      <td style={{ padding: "7px 12px", color: "#f0ede6" }}>{ikon} {t.vara}</td>
                      <td style={{ padding: "7px 12px", color: C.muted }}>{t.antal}</td>
                      <td style={{ padding: "7px 12px", color: prisColor }}>{t.pris_per_enhet} kr</td>
                      <td style={{ padding: "7px 12px", color: "#fbbf24" }}>{t.totalt} kr</td>
                      <td style={{ padding: "7px 12px", color: C.muted, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.kop_agent}</td>
                      <td style={{ padding: "7px 12px", color: C.muted, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.salj_agent}</td>
                      <td style={{ padding: "7px 12px", color: C.dim, whiteSpace: "nowrap" }}>{tid}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      {/* ── FÖRÄDLINGSLOGG ── */}
      {foradlingLog.length > 0 && (
        <section>
          <Label>Förädlingslogg · {foradlingLog.length} senaste</Label>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: C.mono }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["AGENT", "RÅVARA", "ANT", "→ PRODUKT", "ANT", "ZON", "TID"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.dim, fontSize: "9px", letterSpacing: "0.1em", fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {foradlingLog.map((f, i) => {
                  const datum = new Date(f.skapad);
                  const tid = datum.toLocaleDateString("sv-SE", { month: "short", day: "numeric", timeZone: "Europe/Stockholm" }) + " " +
                    datum.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid #111`, background: i % 2 === 0 ? "transparent" : "#0b0b0b" }}>
                      <td style={{ padding: "7px 12px", color: "#f0ede6", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.agent}</td>
                      <td style={{ padding: "7px 12px", color: C.muted }}>{VARA_IKON[f.ravara]} {f.ravara}</td>
                      <td style={{ padding: "7px 12px", color: C.dim }}>{f.ravara_antal}</td>
                      <td style={{ padding: "7px 12px", color: "#fbbf24" }}>{VARA_IKON[f.produkt]} {f.produkt}</td>
                      <td style={{ padding: "7px 12px", color: "#4ade80" }}>{f.produkt_antal}</td>
                      <td style={{ padding: "7px 12px", color: C.dim, fontSize: "10px" }}>{f.foradlings_zon}</td>
                      <td style={{ padding: "7px 12px", color: C.dim, whiteSpace: "nowrap" }}>{tid}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {/* ── LAGERSTATUS ── */}
      <section>
        <Label>Lagerstatus · top innehavare per råvara</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
          {[...VAROR, ...FORADLADE].map(vara => {
            const innehavare = (lagerPerVara[vara] || []).slice(0, 4);
            const maxAntal = innehavare[0]?.antal || 1;
            return (
              <Card key={vara} style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: C.muted, fontFamily: C.mono, marginBottom: "10px" }}>
                  {VARA_IKON[vara]} <span style={{ textTransform: "capitalize" }}>{vara}</span>
                  <span style={{ float: "right", color: C.dim }}>tot {totaltLager[vara] || 0}</span>
                </div>
                {innehavare.length === 0 ? (
                  <p style={{ fontSize: "10px", color: C.dim, margin: 0 }}>Inget lager</p>
                ) : innehavare.map(r => (
                  <div key={r.agent} style={{ marginBottom: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", color: "#f0ede6", fontFamily: C.mono, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.agent}</span>
                      <span style={{ fontSize: "10px", color: C.dim, fontFamily: C.mono }}>{r.antal}</span>
                    </div>
                    <div style={{ height: "2px", background: "#181818", borderRadius: "2px" }}>
                      <div style={{ height: "2px", background: "#60a5fa", borderRadius: "2px", width: `${(r.antal / maxAntal) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      </section>

    </div>
  );
}
