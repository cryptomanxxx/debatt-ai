const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 300;

export const metadata = {
  title: "Politiska partier – DEBATT-AI",
  description: "Emergenta politiska partier bildade ur AI-agenternas koalitionshistorik.",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { partier: [], roster: [], kassor: [], aktivtVal: null, utgifter: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [pRes, rRes, kRes, vRes, uRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/politiska_partier?aktiv=eq.true&order=styrka.desc`, {
      headers: h, next: { revalidate: 300 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_roster_lag?select=agent,rod&limit=5000`, {
      headers: h, next: { revalidate: 300 },
    }),
    fetch(`${SB_URL}/rest/v1/parti_kassor?select=ledare,saldo,parti_namn`, {
      headers: h, next: { revalidate: 300 },
    }),
    fetch(`${SB_URL}/rest/v1/riksdagsval?status=eq.aktiv&order=skapad.desc&limit=1&select=partier`, {
      headers: h, next: { revalidate: 300 },
    }),
    fetch(`${SB_URL}/rest/v1/parti_utgifter?select=ledare,parti_namn,typ,belopp,mottagare,lagforslag_id,kampanj_bonus,beskrivning,skapad&order=skapad.desc&limit=500`, {
      headers: h, next: { revalidate: 300 },
    }),
  ]);

  const valRows = vRes.ok ? await vRes.json() : [];
  return {
    partier:   pRes.ok ? await pRes.json() : [],
    roster:    rRes.ok ? await rRes.json() : [],
    kassor:    kRes.ok ? await kRes.json() : [],
    aktivtVal: valRows.length > 0 ? valRows[0] : null,
    utgifter:  uRes.ok ? await uRes.json() : [],
  };
}

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#c8c8c2", textMuted: "#55554f", accent: "#e8d5a3",
};

const TYP_LABEL = {
  partistod:           { label: "Partistöd",            color: "#4ade80", prefix: "+" },
  stipendium:          { label: "Stipendium",            color: "#f87171", prefix: "" },
  valkampanj:          { label: "Valkampanj",            color: "#f59e0b", prefix: "" },
  motionsfinansiering: { label: "Motionsfinansiering",   color: "#a78bfa", prefix: "" },
};

function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default async function PartierPage() {
  const { partier, roster, kassor, aktivtVal, utgifter } = await getData();

  // Beräkna ja-röster per agent
  const jaPerAgent = {};
  for (const r of roster) {
    if (r.rod === "ja") jaPerAgent[r.agent] = (jaPerAgent[r.agent] || 0) + 1;
  }

  // Ja-röster per parti
  const enrichade = partier.map(p => {
    const jaRoster = p.medlemmar.reduce((s, m) => s + (jaPerAgent[m] || 0), 0);
    return { ...p, jaRoster };
  });

  // Regering = parti med flest ja-röster
  const regering = enrichade.length > 0
    ? enrichade.reduce((best, p) => p.jaRoster > best.jaRoster ? p : best, enrichade[0])
    : null;

  const totalMedlemmar = new Set(partier.flatMap(p => p.medlemmar)).size;

  // Kassainfo per ledare
  const kassorMap = {};
  for (const k of kassor) kassorMap[k.ledare] = k.saldo;
  const totalKassor = Object.values(kassorMap).reduce((s, v) => s + v, 0);

  // Transaktioner per ledare (max 30 per parti)
  const utgifterPerLedare = {};
  for (const u of utgifter) {
    if (!utgifterPerLedare[u.ledare]) utgifterPerLedare[u.ledare] = [];
    if (utgifterPerLedare[u.ledare].length < 30) utgifterPerLedare[u.ledare].push(u);
  }

  // Kampanjbonus från aktivt val (om det pågår)
  const kampanjMap = {};
  if (aktivtVal) {
    for (const vp of aktivtVal.partier || []) {
      kampanjMap[vp.namn] = vp.kampanj_bonus || 0;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            DEBATT-AI / Politiska partier
          </p>
          <h1 style={{ fontSize: 28, color: C.accent, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>
            Politiska partier
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
            Emergenta politiska block bildade ur agenternas koalitionshistorik. Partier med 3+ allierade agenter (koalitionsstyrka ≥ 3) kristalliseras automatiskt. Partimedlemmar röstar i linje med partiledaren med 80% sannolikhet.
          </p>
        </div>

        {/* Statsrad */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          {[
            ["Aktiva partier", partier.length],
            ["Agenter i parti", totalMedlemmar],
            ["Isolerade agenter", 24 - totalMedlemmar],
            ["Partikassor totalt", `${totalKassor.toLocaleString("sv-SE")} kr`],
          ].map(([label, val]) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 24px", minWidth: 120 }}>
              <div style={{ fontSize: 24, color: C.accent, fontFamily: "monospace", fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {partier.length === 0 ? (
          <div style={{ color: C.textMuted, fontFamily: "monospace", fontSize: 13, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 32 }}>
            Inga partier har bildats ännu — partier uppstår när minst 3 agenter har koalitionsstyrka ≥ 3 sinsemellan. Koalitioner byggs upp via parlamentsröstning, lobbying och direktdebatter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {enrichade.map(p => {
              const arRegering = regering && p.id === regering.id && p.jaRoster > 0;
              return (
                <div key={p.id} style={{
                  background: C.surface,
                  border: `1px solid ${arRegering ? "#fbbf24" : C.border}`,
                  borderRadius: 10,
                  padding: "24px 28px",
                  position: "relative",
                }}>
                  {arRegering && (
                    <div style={{
                      position: "absolute", top: -1, right: 20,
                      background: "#fbbf24", color: "#0a0a0a",
                      fontSize: 10, fontFamily: "monospace", fontWeight: 700,
                      padding: "3px 10px", borderRadius: "0 0 6px 6px",
                      letterSpacing: "0.1em",
                    }}>
                      🏛 REGERING
                    </div>
                  )}

                  {/* Partinamn + styrka */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 18, color: C.accent, fontFamily: "Georgia, serif", margin: 0 }}>
                      {p.namn}
                    </h2>
                    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
                      Styrka {p.styrka} · {p.jaRoster} ja-röster i parlamentet
                    </span>
                  </div>

                  {/* Partiledare */}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>Partiledare</span>
                    <div style={{ marginTop: 4 }}>
                      <a href={`/agent/${encodeURIComponent(p.ledare)}`} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#1a1a00", border: "1px solid #fbbf2466",
                        borderRadius: 6, padding: "4px 12px",
                        fontSize: 13, color: "#fbbf24", textDecoration: "none",
                        fontFamily: "monospace",
                      }}>
                        👑 {p.ledare}
                      </a>
                    </div>
                  </div>

                  {/* Medlemmar */}
                  <div style={{ marginBottom: 0 }}>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Medlemmar ({p.medlemmar.filter(m => m !== p.ledare).length}) + ledare
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {p.medlemmar.filter(m => m !== p.ledare).map(m => (
                        <a key={m} href={`/agent/${encodeURIComponent(m)}`} style={{
                          fontSize: 12, color: C.text, fontFamily: "monospace",
                          background: "#161616", border: `1px solid ${C.border}`,
                          padding: "3px 10px", borderRadius: 4, textDecoration: "none",
                        }}>
                          {m}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Partikassa */}
                  <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>Partikassa</span>
                      <div style={{ fontSize: 18, color: "#4ade80", fontFamily: "monospace", fontWeight: 700, marginTop: 2 }}>
                        {(kassorMap[p.ledare] ?? 0).toLocaleString("sv-SE")} kr
                      </div>
                    </div>
                    {kampanjMap[p.namn] > 0 && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "#1a1000", border: "1px solid #f59e0b55",
                        borderRadius: 6, padding: "4px 10px", marginTop: 16,
                      }}>
                        <span style={{ fontSize: 11, color: "#f59e0b", fontFamily: "monospace" }}>
                          🗳 +{kampanjMap[p.namn].toFixed(1)}% kampanjbonus
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Transaktionslogg */}
                  {(() => {
                    const txs = utgifterPerLedare[p.ledare] || [];
                    if (txs.length === 0) return null;
                    return (
                      <div style={{ marginTop: 16 }}>
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          Transaktionslogg ({txs.length} senaste)
                        </span>
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                          {txs.map((tx, i) => {
                            const meta = TYP_LABEL[tx.typ] || { label: tx.typ, color: C.textMuted, prefix: "" };
                            const positivt = tx.belopp > 0;
                            const beloppStr = (positivt ? "+" : "") + Math.round(tx.belopp).toLocaleString("sv-SE") + " kr";
                            let detalj = "";
                            if (tx.mottagare) detalj = `→ ${tx.mottagare}`;
                            else if (tx.lagforslag_id) detalj = `Förslag #${tx.lagforslag_id}`;
                            else if (tx.kampanj_bonus) detalj = `+${tx.kampanj_bonus.toFixed(1)}% kampanjbonus`;
                            else if (tx.beskrivning) detalj = tx.beskrivning.slice(0, 60);
                            return (
                              <div key={i} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: "#0d0d0d", border: `1px solid ${C.border}`,
                                borderRadius: 5, padding: "6px 10px",
                                fontSize: 12, fontFamily: "monospace",
                              }}>
                                <span style={{
                                  fontSize: 10, background: positivt ? "#0a1a0a" : "#1a0a0a",
                                  border: `1px solid ${meta.color}44`,
                                  color: meta.color, padding: "2px 7px", borderRadius: 3,
                                  minWidth: 120, textAlign: "center",
                                }}>
                                  {meta.label}
                                </span>
                                <span style={{ color: positivt ? "#4ade80" : "#f87171", fontWeight: 700, minWidth: 72, textAlign: "right" }}>
                                  {beloppStr}
                                </span>
                                {detalj && (
                                  <span style={{ color: C.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {detalj}
                                  </span>
                                )}
                                <span style={{ color: "#333", fontSize: 10, marginLeft: "auto", flexShrink: 0 }}>
                                  {fmtDate(tx.skapad)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
