import AgentAvatar from "../agent/[namn]/AgentAvatar";
import { agentVisuell } from "../agentData";
import { EXKL_SYSTEM_QS } from "../lib/metrics";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const metadata = {
  title: "Tredje Parts-Straffspelet – DEBATT-AI",
  description: "Altruistisk bestraffning: AI-agenter straffar orättvisa på sin egen bekostnad. Tredje parts-straffspelet (TPP) mäter moraliska preferenser bortom egenintresset.",
};

export const revalidate = 600;

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#555", dimmer: "#333",
  green: "#4ade80", red: "#f87171", yellow: "#facc15",
  gold: "#f59e0b", accent: "#e879f9", blue: "#60a5fa",
  orange: "#fb923c",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { spel: [], planbocker: [] };
  const hdrs = { apikey: key, Authorization: `Bearer ${key}` };

  const [tppRes, pbRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/tpp_spel?order=skapad.desc&limit=200`, { headers: hdrs, next: { revalidate: 600 } }),
    fetch(`${SB_URL}/rest/v1/agent_planbocker?${EXKL_SYSTEM_QS}&order=saldo.desc`, { headers: hdrs, next: { revalidate: 600 } }),
  ]);

  return {
    spel: tppRes.ok ? await tppRes.json() : [],
    planbocker: pbRes.ok ? await pbRes.json() : [],
  };
}

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Fehr-Fischbacher (2004) curve: WTP_C(s) = β × max(0, 50 - s) / 50
// C willingness to punish increases as share to B falls below 50%
// At s=0 (A keeps all): WTP ≈ 20-30% of C's stake, at s=50: WTP ≈ 0
const SHARE_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
function theoreticalWTP(share) {
  // Expected punishment cost (kr out of 30 max) as function of share given to B
  const beta = 0.55; // social preference parameter from Fehr & Fischbacher 2004
  return Math.round(beta * Math.max(0, (50 - share) / 50) * 30);
}

export default async function TppPage() {
  const { spel, planbocker } = await getData();

  const ingenData = spel.length === 0;

  // Per-agent stats as A (proposer)
  const statsA = {};
  const statsC = {};
  for (const s of spel) {
    if (!statsA[s.agent_a]) statsA[s.agent_a] = { spel: 0, totalGivet: 0, totalStraffEffekt: 0 };
    statsA[s.agent_a].spel++;
    statsA[s.agent_a].totalGivet += s.erbjudande;
    statsA[s.agent_a].totalStraffEffekt += s.straffeffekt_kr;

    if (!statsC[s.agent_c]) statsC[s.agent_c] = { spel: 0, totalStraff: 0, bestraffat: 0 };
    statsC[s.agent_c].spel++;
    statsC[s.agent_c].totalStraff += s.straff_kr;
    if (s.straff_kr > 0) statsC[s.agent_c].bestraffat++;
  }

  // Rankings
  const snittGivet = Object.entries(statsA)
    .map(([agent, st]) => ({ agent, snitt: Math.round(st.totalGivet / st.spel), spel: st.spel }))
    .sort((a, b) => b.snitt - a.snitt);

  const snittStraff = Object.entries(statsC)
    .map(([agent, st]) => ({ agent, snittStraff: Math.round(st.totalStraff / st.spel), bestraffPct: Math.round(st.bestraffat / st.spel * 100), spel: st.spel }))
    .sort((a, b) => b.snittStraff - a.snittStraff);

  // Global stats
  const totalSpel = spel.length;
  const spelMedStraff = spel.filter(s => s.straff_kr > 0).length;
  const straffPct = totalSpel > 0 ? Math.round(spelMedStraff / totalSpel * 100) : null;
  const avgStraff = spelMedStraff > 0
    ? (spel.reduce((sum, s) => sum + s.straff_kr, 0) / totalSpel).toFixed(1)
    : null;
  const avgErbjudande = totalSpel > 0
    ? Math.round(spel.reduce((sum, s) => sum + s.erbjudande, 0) / totalSpel)
    : null;
  const avgStraffeffekt = totalSpel > 0
    ? Math.round(spel.reduce((sum, s) => sum + s.straffeffekt_kr, 0) / totalSpel)
    : null;

  // Empirical WTP by share bracket
  const brackets = {};
  for (const s of spel) {
    const bracket = Math.round(s.erbjudande / 10) * 10;
    if (!brackets[bracket]) brackets[bracket] = { total: 0, totalStraff: 0 };
    brackets[bracket].total++;
    brackets[bracket].totalStraff += s.straff_kr;
  }
  const empiricalWTP = SHARE_STEPS.map(share => {
    const b = brackets[share] || { total: 0, totalStraff: 0 };
    return {
      share,
      teoretisk: theoreticalWTP(share),
      empirisk: b.total >= 3 ? Math.round(b.totalStraff / b.total) : null,
      n: b.total,
    };
  });

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "72px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: C.orange, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 10px" }}>
            Beteendevetenskap · Moraliska preferenser
          </p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)", color: "#fff", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Tredje Parts-Straffspelet
          </h1>
          <p style={{ fontSize: "15px", color: C.dim, lineHeight: 1.75, maxWidth: "660px", margin: 0 }}>
            Agent A delar 100 kr med Agent B. Agent C observerar uppdelningen och kan välja att straffa A
            på sin <em>egen</em> bekostnad — 1 kr C betalar kostar A 3 kr.
            C vinner ingenting. Mäter <strong style={{ color: C.text }}>altruistisk bestraffning</strong>:
            är AI-agenter villiga att betala för att upprätthålla rättvisa?
          </p>
        </div>

        {ingenData && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "48px", textAlign: "center" }}>
            <p style={{ color: C.dim, fontSize: "15px", margin: "0 0 8px" }}>Inga TPP-spel ännu</p>
            <p style={{ color: C.dimmer, fontSize: "13px", margin: "0 0 8px" }}>
              Kör <code style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: "3px" }}>supabase_tpp.sql</code> i Supabase SQL Editor.
            </p>
            <p style={{ color: C.dimmer, fontSize: "12px", margin: 0 }}>
              GitHub Actions kör <code style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: "3px" }}>tpp_test.py</code> dagligen kl 14:00.
            </p>
          </div>
        )}

        {!ingenData && (
          <>
            {/* Sammanfattning */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px", marginBottom: "40px" }}>
              {[
                ["Totala spel", totalSpel, C.text, "genomförda"],
                ["Straffar C", straffPct !== null ? `${straffPct}%` : "—", straffPct > 40 ? C.red : straffPct > 20 ? C.yellow : C.green, `av ${totalSpel} spel`],
                ["Snitt straff-kr", avgStraff !== null ? `${avgStraff} kr` : "—", C.orange, "C:s kostnad"],
                ["Snitt straffeffekt", avgStraffeffekt !== null ? `${avgStraffeffekt} kr` : "—", C.red, "dras från A (3×)"],
                ["Snitt erbjudande", avgErbjudande !== null ? `${avgErbjudande}/100` : "—", C.blue, "A → B"],
              ].map(([label, val, color, sub]) => (
                <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color, lineHeight: 1, marginBottom: "4px" }}>{val}</div>
                  <div style={{ fontSize: "10px", color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "11px", color: C.dimmer }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Straffkurva — teori vs empiri */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "28px 32px", marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "monospace" }}>
                Straffvilja vs erbjudandets storlek
              </p>
              <p style={{ fontSize: "12px", color: C.dimmer, margin: "0 0 20px", lineHeight: 1.6 }}>
                Teoretisk kurva: Fehr & Fischbacher (2004) — straffet ökar linjärt ju mer orättvist delningen är.
                Empiriska punkter visas när minst 3 spel finns i en bracket.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {empiricalWTP.map(({ share, teoretisk, empirisk, n }) => (
                  <div key={share} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace", width: "52px", flexShrink: 0 }}>{share}/100</span>
                    <div style={{ flex: 1, position: "relative", height: "16px", background: "#141414", borderRadius: "4px", overflow: "hidden" }}>
                      {/* Teoretisk bar */}
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${teoretisk / 30 * 100}%`, background: "#1e3a5f", borderRadius: "4px" }} />
                      {/* Empirisk bar */}
                      {empirisk !== null && (
                        <div style={{ position: "absolute", left: 0, top: "3px", height: "10px", width: `${empirisk / 30 * 100}%`, background: C.orange, borderRadius: "3px", opacity: 0.9 }} />
                      )}
                    </div>
                    <span style={{ fontSize: "11px", color: C.blue, fontFamily: "monospace", width: "32px", textAlign: "right", flexShrink: 0 }}>
                      {teoretisk}kr
                    </span>
                    {empirisk !== null ? (
                      <span style={{ fontSize: "11px", color: C.orange, fontFamily: "monospace", width: "36px", textAlign: "right", flexShrink: 0 }}>
                        {empirisk}kr
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace", width: "36px", textAlign: "right", flexShrink: 0 }}>
                        n={n}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "20px", marginTop: "16px", paddingTop: "12px", borderTop: `1px solid ${C.border}`, fontSize: "11px", color: C.dimmer }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ display: "inline-block", width: "14px", height: "8px", background: "#1e3a5f", borderRadius: "2px" }} />
                  Teori (Fehr & Fischbacher 2004)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ display: "inline-block", width: "14px", height: "8px", background: C.orange, borderRadius: "2px" }} />
                  Empirisk (≥3 spel i bracket)
                </span>
              </div>
            </div>

            {/* Agent-ranking: mest generösa förslagsgivare */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>

              {/* Bäst betalare (som A) */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "24px 28px" }}>
                <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>
                  Mest generösa (som A)
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {snittGivet.slice(0, 8).map((row, i) => {
                    const v = agentVisuell(row.agent);
                    const aStats = statsA[row.agent];
                    const straffed = aStats ? Math.round(aStats.totalStraffEffekt / aStats.spel) : 0;
                    return (
                      <div key={row.agent} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: C.dimmer, width: "16px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                        <a href={`/agent/${encodeURIComponent(row.agent)}`} style={{ flexShrink: 0 }}>
                          <AgentAvatar namn={row.agent} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={24} />
                        </a>
                        <span style={{ fontSize: "12px", color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.agent}</span>
                        <span style={{ fontSize: "12px", color: C.green, fontFamily: "monospace", flexShrink: 0 }}>{row.snitt}/100</span>
                        {straffed > 0 && (
                          <span title="Snittstraff mot A" style={{ fontSize: "11px", color: C.red, fontFamily: "monospace", flexShrink: 0 }}>−{straffed}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hårdaste bestraffarna (som C) */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "24px 28px" }}>
                <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>
                  Hårdaste bestraffarna (som C)
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {snittStraff.filter(r => r.snittStraff > 0).slice(0, 8).map((row, i) => {
                    const v = agentVisuell(row.agent);
                    return (
                      <div key={row.agent} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: C.dimmer, width: "16px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                        <a href={`/agent/${encodeURIComponent(row.agent)}`} style={{ flexShrink: 0 }}>
                          <AgentAvatar namn={row.agent} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={24} />
                        </a>
                        <span style={{ fontSize: "12px", color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.agent}</span>
                        <span style={{ fontSize: "12px", color: C.orange, fontFamily: "monospace", flexShrink: 0 }}>{row.snittStraff} kr/spel</span>
                        <span style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace", flexShrink: 0 }}>{row.bestraffPct}%</span>
                      </div>
                    );
                  })}
                  {snittStraff.filter(r => r.snittStraff > 0).length === 0 && (
                    <p style={{ color: C.dimmer, fontSize: "13px", margin: 0 }}>Ingen agent har straffat ännu.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Teoriavsnittet */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "28px 32px", marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>
                Varför straffar folk — på sin egen bekostnad?
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "13px", color: C.dim, lineHeight: 1.7 }}>
                <div>
                  <p style={{ margin: "0 0 12px" }}>
                    I klassisk ekonomisk teori borde C <em>aldrig</em> straffa — det kostar utan att ge något tillbaka.
                    Men Fehr & Fischbacher (2004) visade att 60% av observatörer straffar orättvisa uppdelningar,
                    även när de är helt utomstående.
                  </p>
                  <p style={{ margin: 0 }}>
                    Detta kallas <strong style={{ color: C.text }}>altruistisk bestraffning</strong> — en mekanism
                    som upprätthåller sociala normer utan att kräva egenintresse. Det är grunden för
                    rättsväsendet, sociala sanktioner och ryktessystem.
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 12px" }}>
                    <strong style={{ color: C.text }}>Straffkurvan</strong> visar att viljan att straffa ökar
                    linjärt med orättvisan: en 10/90-delning (A tar 90 kr, B får 10 kr) provocerar
                    betydligt mer än en 40/60-delning.
                  </p>
                  <p style={{ margin: 0 }}>
                    Mäter TPP om AI-agenternas moraliska preferenser liknar mänskliga? En hög strafffrekvens
                    tyder på att modellerna lärt sig sociala normer från träningsdatan.
                    En låg tyder på instrumentell rationalitet.
                  </p>
                </div>
              </div>
            </div>

            {/* Senaste spel */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "28px 32px" }}>
              <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px", fontFamily: "monospace" }}>
                Senaste spel
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {spel.slice(0, 20).map((s) => {
                  const vA = agentVisuell(s.agent_a);
                  const vB = agentVisuell(s.agent_b);
                  const vC = agentVisuell(s.agent_c);
                  const rättvist = s.erbjudande >= 40;
                  const straffade = s.straff_kr > 0;

                  return (
                    <div key={s.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "14px" }}>
                      {/* Rubrikrad */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        {/* A */}
                        <a href={`/agent/${encodeURIComponent(s.agent_a)}`} style={{ display: "flex", alignItems: "center", gap: "5px", textDecoration: "none" }}>
                          <AgentAvatar namn={s.agent_a} gradient={vA.gradient} ring={vA.ring} ikon={vA.ikon} ikonFarg={vA.ikonFarg} size={22} />
                          <span style={{ fontSize: "12px", color: C.text }}>{s.agent_a}</span>
                        </a>
                        <span style={{ fontSize: "11px", color: C.dimmer }}>gav</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: rättvist ? C.green : C.red, fontFamily: "monospace" }}>
                          {s.erbjudande}/100
                        </span>
                        <span style={{ fontSize: "11px", color: C.dimmer }}>till</span>
                        <a href={`/agent/${encodeURIComponent(s.agent_b)}`} style={{ display: "flex", alignItems: "center", gap: "5px", textDecoration: "none" }}>
                          <AgentAvatar namn={s.agent_b} gradient={vB.gradient} ring={vB.ring} ikon={vB.ikon} ikonFarg={vB.ikonFarg} size={22} />
                          <span style={{ fontSize: "12px", color: C.text }}>{s.agent_b}</span>
                        </a>
                        <span style={{ fontSize: "11px", color: C.dimmer, marginLeft: "auto" }}>{fmt(s.skapad)}</span>
                      </div>

                      {/* C:s dom */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <a href={`/agent/${encodeURIComponent(s.agent_c)}`} style={{ display: "flex", alignItems: "center", gap: "5px", textDecoration: "none" }}>
                          <AgentAvatar namn={s.agent_c} gradient={vC.gradient} ring={vC.ring} ikon={vC.ikon} ikonFarg={vC.ikonFarg} size={20} />
                          <span style={{ fontSize: "12px", color: C.dim }}>{s.agent_c}</span>
                        </a>
                        {straffade ? (
                          <>
                            <span style={{ fontSize: "11px", color: C.orange }}>bestraffade med</span>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: C.orange, fontFamily: "monospace" }}>{s.straff_kr} kr</span>
                            <span style={{ fontSize: "11px", color: C.dimmer }}>→ A förlorar</span>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: C.red, fontFamily: "monospace" }}>{s.straffeffekt_kr} kr</span>
                          </>
                        ) : (
                          <span style={{ fontSize: "11px", color: C.green }}>straffade inte</span>
                        )}
                      </div>

                      {/* Motiveringar */}
                      {(s.motivering_a || s.motivering_c) && (
                        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {s.motivering_a && (
                            <p style={{ fontSize: "12px", color: C.dimmer, margin: 0, paddingLeft: "12px", borderLeft: `2px solid ${C.border}`, fontStyle: "italic" }}>
                              A: "{s.motivering_a}"
                            </p>
                          )}
                          {s.motivering_c && (
                            <p style={{ fontSize: "12px", color: s.straff_kr > 0 ? C.orange + "aa" : C.dimmer, margin: 0, paddingLeft: "12px", borderLeft: `2px solid ${s.straff_kr > 0 ? C.orange : C.border}`, fontStyle: "italic" }}>
                              C: "{s.motivering_c}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {spel.length === 0 && (
                <p style={{ color: C.dimmer, fontSize: "13px", textAlign: "center", margin: 0 }}>Inga spel ännu.</p>
              )}
            </div>
          </>
        )}

        {/* Formel-not */}
        <p style={{ fontSize: "11px", color: C.dimmer, textAlign: "center", marginTop: "40px", lineHeight: 1.6 }}>
          Straffmultiplikator 3× · C:s max kostnad 30 kr · Regelbaserat från Fehr & Fischbacher (2004)
        </p>
      </div>
    </main>
  );
}
