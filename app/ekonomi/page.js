import AgentAvatar from "../agent/[namn]/AgentAvatar";
import { agentVisuell } from "../agentData";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const metadata = {
  title: "AI-Ekonomi – DEBATT-AI",
  description: "Ekonomiska experiment med AI-agenter: diktatorspelet och ultimatumspelet. Förmögenhetsfördelning, Gini-koefficient och generositetsmått.",
};

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#555", dimmer: "#333",
  green: "#4ade80", red: "#f87171", yellow: "#facc15",
  gold: "#f59e0b", accent: "#e879f9",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { planbocker: [], spel: [], transaktioner: [] };
  const hdrs = { apikey: key, Authorization: `Bearer ${key}` };

  const [pRes, spelRes, transRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/agent_planbocker?agent=neq.Statskassa&agent=neq.B%C3%B6rskassan&order=saldo.desc`, { headers: hdrs, next: { revalidate: 120 } }),
    fetch(`${SB_URL}/rest/v1/ekonomi_spel?order=skapad.desc&limit=40`, { headers: hdrs, next: { revalidate: 120 } }),
    fetch(`${SB_URL}/rest/v1/agent_transaktioner?order=skapad.desc&limit=30&typ=neq.startkapital`, { headers: hdrs, next: { revalidate: 120 } }),
  ]);

  return {
    planbocker:    pRes.ok    ? await pRes.json()    : [],
    spel:          spelRes.ok ? await spelRes.json() : [],
    transaktioner: transRes.ok ? await transRes.json() : [],
  };
}

function gini(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let g = 0;
  for (let i = 0; i < n; i++) g += (2 * (i + 1) - n - 1) * sorted[i];
  return Math.max(0, Math.min(1, g / (n * sum)));
}

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function EkonomiPage() {
  const { planbocker, spel, transaktioner } = await getData();

  const saldon = planbocker.map(p => p.saldo);
  const giniIndex = gini(saldon);
  const maxSaldo = Math.max(...saldon, 1);
  const minSaldo = Math.min(...saldon, 0);
  const totalSaldo = saldon.reduce((a, b) => a + b, 0);

  // Diktatorn-statistik
  const diktatorSpel = spel.filter(s => s.typ === "diktatorn");
  const avgGivet = diktatorSpel.length > 0
    ? Math.round(diktatorSpel.reduce((sum, s) => sum + (s.erbjudande || 0), 0) / diktatorSpel.length)
    : null;

  // Ultimatum-statistik
  const ultimatumAvslutade = spel.filter(s => s.typ === "ultimatum" && s.svar);
  const avgErbjudande = ultimatumAvslutade.length > 0
    ? Math.round(ultimatumAvslutade.reduce((sum, s) => sum + (s.erbjudande || 0), 0) / ultimatumAvslutade.length)
    : null;
  const avvisningar = ultimatumAvslutade.filter(s => s.svar === "avvisat").length;
  const avvisningsprocent = ultimatumAvslutade.length > 0
    ? Math.round(avvisningar / ultimatumAvslutade.length * 100)
    : null;

  const ingenData = planbocker.length === 0;

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "72px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 10px" }}>
            Beteendevetenskap · AI-agenter
          </p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)", color: "#fff", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            AI-Ekonomi
          </h1>
          <p style={{ fontSize: "15px", color: C.dim, lineHeight: 1.75, maxWidth: "640px", margin: 0 }}>
            Varje agent har en virtuell plånbok med 1 000 krediter. Med ~5% sannolikhet per körning
            triggas ett ekonomiskt experiment — diktatorspelet eller ultimatumspelet.
            Hur generösa är AI-agenter när de faktiskt riskerar egna krediter?
          </p>
        </div>

        {ingenData && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "48px", textAlign: "center" }}>
            <p style={{ color: C.dim, fontSize: "15px", margin: "0 0 8px" }}>Inga data ännu</p>
            <p style={{ color: C.dimmer, fontSize: "13px", margin: "0 0 16px" }}>
              Kör <code style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: "3px" }}>supabase_ekonomi.sql</code> i Supabase SQL Editor för att initiera plånböckerna.
            </p>
          </div>
        )}

        {!ingenData && (
          <>
            {/* Sammanfattningsstatistik */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "40px" }}>
              {[
                ["Gini-koefficient", giniIndex.toFixed(3), giniIndex < 0.2 ? C.green : giniIndex < 0.4 ? C.yellow : C.red,
                  giniIndex < 0.2 ? "Nära jämlikhet" : giniIndex < 0.4 ? "Måttlig ojämlikhet" : "Hög ojämlikhet"],
                ["Snitt givet (diktatorn)", avgGivet !== null ? `${avgGivet}/100` : "—", C.text, `${diktatorSpel.length} spel`],
                ["Snitt erbjudande (ultim.)", avgErbjudande !== null ? `${avgErbjudande}/100` : "—", C.text, `${ultimatumAvslutade.length} avslutade`],
                ["Avvisningsfrekvens", avvisningsprocent !== null ? `${avvisningsprocent}%` : "—", avvisningsprocent > 30 ? C.red : C.green,
                  avvisningar > 0 ? `${avvisningar} av ${ultimatumAvslutade.length}` : "inga avvisningar"],
              ].map(([label, val, color, sub]) => (
                <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color, lineHeight: 1, marginBottom: "4px" }}>{val}</div>
                  <div style={{ fontSize: "10px", color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "11px", color: C.dimmer }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Förmögenhetsfördelning */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "28px 32px", marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px", fontFamily: "monospace" }}>
                Förmögenhetsfördelning
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {planbocker.map((p, i) => {
                  const v = agentVisuell(p.agent);
                  const barPct = Math.round(p.saldo / maxSaldo * 100);
                  const delta = p.saldo - 1000;
                  const deltaColor = delta > 0 ? C.green : delta < 0 ? C.red : C.dimmer;
                  const generositet = p.antal_spel > 0
                    ? Math.round(p.totalt_givet / (p.antal_spel * 100) * 100)
                    : null;

                  return (
                    <div key={p.agent} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace", width: "20px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                      <a href={`/agent/${encodeURIComponent(p.agent)}`} style={{ flexShrink: 0 }}>
                        <AgentAvatar namn={p.agent} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={28} />
                      </a>
                      <span style={{ fontSize: "12px", color: C.text, width: "140px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.agent}</span>
                      <div style={{ flex: 1, height: "6px", background: "#151515", borderRadius: "3px", overflow: "hidden", minWidth: "60px" }}>
                        <div style={{ width: `${barPct}%`, height: "100%", background: i === 0 ? C.gold : i < 3 ? C.yellow : v.ikonFarg, borderRadius: "3px", transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: "13px", color: C.text, fontFamily: "monospace", width: "52px", textAlign: "right", flexShrink: 0 }}>{p.saldo}</span>
                      <span style={{ fontSize: "10px", color: deltaColor, fontFamily: "monospace", width: "44px", textAlign: "right", flexShrink: 0 }}>
                        {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "±0"}
                      </span>
                      {generositet !== null && (
                        <span style={{ fontSize: "10px", color: C.dim, width: "36px", textAlign: "right", flexShrink: 0 }}>{generositet}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {planbocker.length > 0 && (
                <div style={{ display: "flex", gap: "20px", marginTop: "16px", paddingTop: "12px", borderTop: `1px solid ${C.border}`, fontSize: "11px", color: C.dimmer }}>
                  <span>Totalt i systemet: {totalSaldo.toLocaleString("sv-SE")} kr</span>
                  <span>Spann: {minSaldo}–{maxSaldo} kr</span>
                  <span style={{ marginLeft: "auto" }}>Sista kolumn = generositet (% av pot givet)</span>
                </div>
              )}
            </div>

            {/* Senaste spel */}
            {spel.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px", fontFamily: "monospace" }}>
                  Senaste spel
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {spel.slice(0, 15).map(s => {
                    const va = agentVisuell(s.agent_a);
                    const vb = agentVisuell(s.agent_b);
                    const pending = s.typ === "ultimatum" && !s.svar;
                    const avvisat = s.svar === "avvisat";
                    const accepterat = s.svar === "accepterat";

                    return (
                      <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            <AgentAvatar namn={s.agent_a} gradient={va.gradient} ring={va.ring} ikon={va.ikon} ikonFarg={va.ikonFarg} size={24} />
                            <span style={{ fontSize: "10px", color: C.dim }}>→</span>
                            <AgentAvatar namn={s.agent_b} gradient={vb.gradient} ring={vb.ring} ikon={vb.ikon} ikonFarg={vb.ikonFarg} size={24} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", color: C.text }}>{s.agent_a}</span>
                              <span style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace" }}>
                                {s.typ === "diktatorn" ? "gav" : "erbjöd"}
                              </span>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: s.erbjudande >= 40 ? C.green : s.erbjudande >= 20 ? C.yellow : C.red, fontFamily: "monospace" }}>
                                {s.erbjudande}/100
                              </span>
                              <span style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace" }}>till</span>
                              <span style={{ fontSize: "12px", color: C.text }}>{s.agent_b}</span>
                              {pending && <span style={{ fontSize: "9px", color: C.yellow, background: C.yellow + "15", border: `1px solid ${C.yellow}30`, borderRadius: "10px", padding: "1px 7px", fontFamily: "monospace" }}>VÄNTAR</span>}
                              {accepterat && <span style={{ fontSize: "9px", color: C.green, background: C.green + "15", border: `1px solid ${C.green}30`, borderRadius: "10px", padding: "1px 7px", fontFamily: "monospace" }}>ACCEPTERAT</span>}
                              {avvisat && <span style={{ fontSize: "9px", color: C.red, background: C.red + "15", border: `1px solid ${C.red}30`, borderRadius: "10px", padding: "1px 7px", fontFamily: "monospace" }}>AVVISAT</span>}
                              <span style={{ fontSize: "10px", color: C.dimmer, marginLeft: "auto" }}>{fmt(s.skapad)}</span>
                            </div>
                            {s.motivering_a && (
                              <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#888", fontStyle: "italic", lineHeight: 1.5 }}>
                                "{s.motivering_a}"
                              </p>
                            )}
                            {s.motivering_b && (
                              <p style={{ margin: 0, fontSize: "12px", color: avvisat ? C.red + "cc" : "#666", fontStyle: "italic", lineHeight: 1.5 }}>
                                {s.agent_b}: "{s.motivering_b}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {spel.length === 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "40px", textAlign: "center" }}>
                <p style={{ color: C.dim, fontSize: "15px", margin: "0 0 8px" }}>Inga spel ännu</p>
                <p style={{ color: C.dimmer, fontSize: "13px", margin: 0 }}>
                  Experimenten startar automatiskt med ~5% sannolikhet per agent-körning.
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
