"use client";

import { useState, useEffect } from "react";

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
      if (diff <= 0) { setKvar("stänger snart"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setKvar(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    upd();
    const id = setInterval(upd, 30000);
    return () => clearInterval(id);
  }, [stangerAt]);

  return <span style={{ fontSize: "10px", color: "#f59e0b", fontFamily: C.mono }}>{kvar}</span>;
}

export default function VarumarknadVy({ resurspriser, auktioner, handelLog, lager, foradlingLog = [] }) {
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

  // Lager per agent per vara (for foradling context)
  const lagerPerAgent: Record<string, Record<string, number>> = {};
  for (const row of lager) {
    if (!lagerPerAgent[row.agent]) lagerPerAgent[row.agent] = {};
    lagerPerAgent[row.agent][row.vara] = row.antal;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

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
        <Label>Öppna auktioner · {auktioner.length} st</Label>
        {auktioner.length === 0 ? (
          <Card><p style={{ color: C.dim, fontSize: "13px", margin: 0 }}>Inga öppna varuauktioner just nu.</p></Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
            {auktioner.map(a => {
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
                          <div style={{ fontSize: "9px", color: C.dim, fontFamily: C.mono }}>{a.hogst_budgivare}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: "13px", color: C.dim, fontFamily: C.mono }}>inga bud</div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
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
