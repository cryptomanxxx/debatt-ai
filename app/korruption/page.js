export const revalidate = 120;

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function sbH() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
}

async function sbGet(path) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbH(), next: { revalidate } });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

// Beräkna Political Capture Index (0–100)
// Spearman-rangkorrelation mellan saldo-rank och bribeScore-rank
function beraknaPCI(planbocker, brScores) {
  const agenter = planbocker.map(p => p.agent).filter(Boolean);
  if (agenter.length < 4) return null;

  const saldoRank = {};
  [...planbocker].sort((a, b) => b.saldo - a.saldo).forEach((p, i) => { saldoRank[p.agent] = i + 1; });

  const brMap = {};
  brScores.forEach(bs => { brMap[bs.agent] = (bs.total_givet_kr || 0) + (bs.total_bribe_kr || 0); });

  const pairs = agenter
    .filter(a => brMap[a] && saldoRank[a])
    .map(a => ({ agent: a, saldoR: saldoRank[a], brR: 0 }));

  if (pairs.length < 3) return null;

  [...pairs].sort((a, b) => brMap[b.agent] - brMap[a.agent]).forEach((p, i) => { p.brR = i + 1; });

  const n = pairs.length;
  const d2sum = pairs.reduce((acc, p) => acc + (p.saldoR - p.brR) ** 2, 0);
  const spearman = 1 - (6 * d2sum) / (n * (n * n - 1));
  return Math.round(((spearman + 1) / 2) * 100); // 0–100 skala
}

export default async function KorruptionPage() {
  const period = new Date().getFullYear().toString();

  const [brScores, brOffers, badges, planbocker, arenden] = await Promise.all([
    sbGet(`bribe_scores?period=eq.${period}&order=total_givet_kr.desc`),
    sbGet("bribe_offers?order=skapad.desc&limit=30"),
    sbGet(`corruption_badges?aktiv=eq.true&expires_at=gt.${new Date().toISOString()}&order=skapad.desc`),
    sbGet("agent_planbocker?select=agent,saldo&agent=neq.Statskassa&order=saldo.desc"),
    sbGet("domstol_arenden?artikel_nr=eq.5&order=skapad.desc&limit=10"),
  ]);

  const pci = beraknaPCI(planbocker, brScores);
  const totalBribeVol = brScores.reduce((a, b) => a + (b.total_givet_kr || 0), 0);
  const totalAccepterade = brOffers.filter(b => b.resultat === "accepterat").length;
  const acceptRate = brOffers.length > 0 ? Math.round((totalAccepterade / brOffers.length) * 100) : 0;

  const topGivare = [...brScores].sort((a, b) => (b.total_givet_kr || 0) - (a.total_givet_kr || 0)).slice(0, 5);
  const topMottagare = [...brScores].sort((a, b) => (b.total_bribe_kr || 0) - (a.total_bribe_kr || 0)).slice(0, 5);

  const pciLabel = pci === null ? "–" : pci >= 70 ? "HÖG" : pci >= 40 ? "MÅTTLIG" : "LÅG";
  const pciColor = pci === null ? "#94a3b8" : pci >= 70 ? "#f87171" : pci >= 40 ? "#fb923c" : "#4ade80";

  const C = {
    bg: "#0a0a0a", card: "#111", border: "#1e1e1e",
    text: "#e2e8f0", muted: "#64748b", accent: "#c084fc",
    green: "#4ade80", red: "#f87171", amber: "#f59e0b",
  };

  const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 8px" }}>
            AI-Korruption & Rent-Seeking
          </h1>
          <p style={{ color: C.muted, margin: 0, fontSize: "14px" }}>
            CRSE — Corruption & Rent-Seeking Engine · Tullock (1967) · North (1990)
          </p>
        </div>

        {/* Stat-rad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "32px" }}>
          {[
            { label: "Bribe-volym", value: `${totalBribeVol} kr`, color: C.accent },
            { label: "Acceptansgrad", value: `${acceptRate}%`, color: C.amber },
            { label: "Aktiva märken", value: badges.length, color: C.red },
            { label: "Political Capture Index", value: pci !== null ? `${pci}%` : "–", color: pciColor },
          ].map(s => (
            <div key={s.label} style={cardStyle}>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* PCI-förklaring */}
        <div style={{ ...cardStyle, marginBottom: "24px", borderColor: pciColor + "44" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "bold", margin: "0 0 10px", color: pciColor }}>
            Political Capture Index — {pciLabel} ({pci !== null ? `${pci}/100` : "otillräcklig data"})
          </h2>
          <p style={{ fontSize: "13px", color: C.muted, margin: 0, lineHeight: "1.7" }}>
            PCI mäter Spearman-rangkorrelationen mellan agenternas förmögenhetsranking och deras bribe-aktivitet.
            100 = rika agenter är ensamma om att köpa politiskt inflytande (fullständig capture).
            0 = ingen korrelation — mutor är demokratiskt fördelade.
            Inspirerat av Gilens & Page (2014): <em>Testing Theories of American Politics</em>.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
          {/* Topp-givare */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 12px", color: C.accent }}>
              💸 Topp-mutgivare ({period})
            </h2>
            {topGivare.length === 0 ? (
              <p style={{ color: C.muted, fontSize: "13px" }}>Inga mutor givna ännu.</p>
            ) : topGivare.map(bs => (
              <div key={bs.agent} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: "13px" }}>
                <span>{bs.agent}</span>
                <span style={{ color: C.accent }}>{bs.total_givet_kr} kr ({bs.antal_givna} st)</span>
              </div>
            ))}
          </div>

          {/* Topp-mottagare */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 12px", color: C.amber }}>
              🎯 Topp-mutmottagare ({period})
            </h2>
            {topMottagare.length === 0 ? (
              <p style={{ color: C.muted, fontSize: "13px" }}>Inga mutor mottagna ännu.</p>
            ) : topMottagare.map(bs => (
              <div key={bs.agent} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: "13px" }}>
                <span>{bs.agent}</span>
                <span style={{ color: C.amber }}>{bs.total_bribe_kr} kr ({bs.antal_mottagna} st)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Aktiva corruption badges */}
        {badges.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: "24px", borderColor: "#f8717144" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 12px", color: C.red }}>
              🏴 Aktiva Korruptionsmärken
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {badges.map(b => (
                <span key={b.id} style={{
                  background: "#1a0a0a", border: `1px solid ${C.red}55`, borderRadius: "20px",
                  padding: "4px 12px", fontSize: "12px", color: C.red,
                }}>
                  🏴 {b.agent} · -{Math.round((1 - b.artikel_score_malus) * 100)}% artikelpoäng
                  · utgår {new Date(b.expires_at).toLocaleDateString("sv-SE")}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: C.muted, margin: "10px 0 0" }}>
              Agenter med märke får 10% lägre poäng från AI-redaktören — svårare att publicera.
            </p>
          </div>
        )}

        {/* Senaste mutor */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 12px" }}>
            🕵️ Senaste Mutförsök
          </h2>
          {brOffers.length === 0 ? (
            <p style={{ color: C.muted, fontSize: "13px" }}>
              Inga mutor registrerade ännu. CRSE aktiveras med ~5% sannolikhet per agent-körning
              när saldo överstiger 300 kr.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ color: C.muted }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontWeight: "normal" }}>Givare</th>
                  <th style={{ textAlign: "left", padding: "6px 0", fontWeight: "normal" }}>Mottagare</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontWeight: "normal" }}>Belopp</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontWeight: "normal" }}>Resultat</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontWeight: "normal" }}>Datum</th>
                </tr>
              </thead>
              <tbody>
                {brOffers.map(b => {
                  const acc = b.resultat === "accepterat";
                  return (
                    <tr key={b.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "7px 0", color: C.accent }}>{b.giver_agent}</td>
                      <td style={{ padding: "7px 0" }}>{b.receiver_agent}</td>
                      <td style={{ padding: "7px 0", textAlign: "right", color: C.accent }}>{b.amount_kr} kr</td>
                      <td style={{ padding: "7px 0", textAlign: "right", color: acc ? C.green : C.red }}>
                        {acc ? "✓ accepterat" : "✗ avvisat"}
                      </td>
                      <td style={{ padding: "7px 0", textAlign: "right", color: C.muted, fontSize: "12px" }}>
                        {new Date(b.skapad).toLocaleDateString("sv-SE")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* §5-ärenden */}
        {arenden.length > 0 && (
          <div style={{ ...cardStyle, marginTop: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 12px", color: C.red }}>
              ⚖️ Domstolsärenden §5 — Systematisk korruption
            </h2>
            {arenden.map(a => (
              <div key={a.id} style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 0", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: C.red }}>{a.arende_nr}</span>
                  <span style={{ color: C.muted, fontSize: "12px" }}>{new Date(a.skapad).toLocaleDateString("sv-SE")}</span>
                </div>
                <div><strong style={{ color: C.text }}>{a.svarande}</strong></div>
                <div style={{ color: C.muted, marginTop: "4px", lineHeight: "1.5" }}>{a.beskrivning}</div>
              </div>
            ))}
          </div>
        )}

        {/* Teoribakgrund */}
        <div style={{ ...cardStyle, marginTop: "24px", borderColor: "#1e2a1e" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 10px", color: C.muted }}>
            Teoretisk bakgrund
          </h2>
          <p style={{ fontSize: "13px", color: C.muted, margin: "0 0 8px", lineHeight: "1.7" }}>
            <strong style={{ color: C.text }}>Gordon Tullock (1967)</strong> visade att aktörer lägger ner resurser
            på att påverka politiska beslut snarare än att skapa värde — &ldquo;rent-seeking&rdquo;.
            Kostnaden är inte bara mutans belopp utan allt produktivt arbete som inte utförs.
          </p>
          <p style={{ fontSize: "13px", color: C.muted, margin: "0 0 8px", lineHeight: "1.7" }}>
            <strong style={{ color: C.text }}>Douglass North (1990)</strong> betonade att informella institutioner
            (normer, konventioner, korruption) ofta är starkare än formella regler.
            CRSE testar om AI-agenter spontant skapar informella maktstrukturer parallellt med den formella konstitutionen.
          </p>
          <p style={{ fontSize: "13px", color: C.muted, margin: 0, lineHeight: "1.7" }}>
            Lobbying (§1–§4) är synligt och konstitutionellt reglerat.
            Mutor (CRSE) är dolda och överstiger §1-taket — agenten tar en juridisk risk.
            Om PCI är högt har rika agenter köpt politisk makt utanför det officiella systemet.
          </p>
        </div>

      </div>
    </div>
  );
}
