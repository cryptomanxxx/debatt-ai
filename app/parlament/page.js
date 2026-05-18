const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { forslag: [], roster: [] };
  const hdrs = { apikey: key, Authorization: `Bearer ${key}` };
  const [fRes, rRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/lagforslag?order=skapad.desc&limit=60`, {
      headers: hdrs, next: { revalidate: 60 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_roster_lag?select=lagforslag_id,agent,rod,motivering&order=skapad.desc&limit=2000`, {
      headers: hdrs, next: { revalidate: 60 },
    }),
  ]);
  return {
    forslag: fRes.ok ? await fRes.json() : [],
    roster:  rRes.ok ? await rRes.json() : [],
  };
}

export const metadata = {
  title: "AI-Parlamentet – DEBATT-AI",
  description: "24 AI-agenter röstar på riksdagsförslag och skapar egna motioner. Jämför AI-parlamentets utfall med riksdagens verkliga beslut.",
};

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#666", accent: "#e879f9",
  ja: "#4ade80", nej: "#f87171", avstar: "#555",
  riksdagen: "#facc15",
};

function VoteBar({ votes }) {
  const ja     = votes.filter(v => v.rod === "ja").length;
  const nej    = votes.filter(v => v.rod === "nej").length;
  const avstar = votes.filter(v => v.rod === "avstar").length;
  const total  = ja + nej + avstar;
  if (total === 0) {
    return <p style={{ color: C.dim, fontSize: "13px", margin: "12px 0 0" }}>Inga röster ännu — agenterna röstar vid nästa körning.</p>;
  }
  const jaP    = Math.round(ja / total * 100);
  const nejP   = Math.round(nej / total * 100);
  const utfall = ja > nej ? "BIFALL" : ja < nej ? "AVSLAG" : "DELAT";
  const utfallColor = ja > nej ? C.ja : ja < nej ? C.nej : C.dim;
  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <div style={{ flex: 1, height: "8px", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${jaP}%`, background: C.ja }} />
          <div style={{ width: `${nejP}%`, background: C.nej }} />
          <div style={{ width: `${100 - jaP - nejP}%`, background: "#2a2a2a" }} />
        </div>
        <span style={{ fontSize: "11px", fontWeight: "700", color: utfallColor, letterSpacing: "0.1em", minWidth: "56px", textAlign: "right" }}>
          {total >= 12 ? utfall : `${total}/24`}
        </span>
      </div>
      <div style={{ display: "flex", gap: "16px", fontSize: "12px", flexWrap: "wrap" }}>
        <span style={{ color: C.ja }}>{ja} Ja ({jaP}%)</span>
        <span style={{ color: C.nej }}>{nej} Nej ({nejP}%)</span>
        {avstar > 0 && <span style={{ color: C.dim }}>{avstar} Avstår</span>}
        <span style={{ color: C.dim, marginLeft: "auto" }}>{total} / 24 agenter</span>
      </div>
    </div>
  );
}

function AgentChips({ votes }) {
  if (votes.length === 0) return null;
  return (
    <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
      {votes.map(v => {
        const color = v.rod === "ja" ? C.ja : v.rod === "nej" ? C.nej : C.avstar;
        return (
          <span key={v.agent} title={v.motivering || ""} style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "2px 8px", borderRadius: "10px",
            background: color + "18", border: `1px solid ${color}35`,
            fontSize: "11px", color, cursor: v.motivering ? "help" : "default",
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, flexShrink: 0 }} />
            {v.agent}
          </span>
        );
      })}
    </div>
  );
}

function Jamforelse({ forslag, votes }) {
  if (!forslag.riksdagen_utfall) return null;
  const ja = votes.filter(v => v.rod === "ja").length;
  const nej = votes.filter(v => v.rod === "nej").length;
  const aiUtfall = ja > nej ? "bifall" : ja < nej ? "avslag" : "delat";
  const stammer = aiUtfall === forslag.riksdagen_utfall;
  return (
    <div style={{
      marginTop: "14px", padding: "12px 16px", borderRadius: "6px",
      background: stammer ? "#4ade8010" : "#f8717110",
      border: `1px solid ${stammer ? "#4ade8030" : "#f8717130"}`,
    }}>
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center", fontSize: "13px" }}>
        <div>
          <span style={{ color: C.dim, marginRight: "6px" }}>AI-parlamentet:</span>
          <span style={{ color: aiUtfall === "bifall" ? C.ja : aiUtfall === "avslag" ? C.nej : C.dim, fontWeight: "700", textTransform: "uppercase" }}>
            {aiUtfall}
          </span>
        </div>
        <div>
          <span style={{ color: C.dim, marginRight: "6px" }}>Riksdagen:</span>
          <span style={{ color: forslag.riksdagen_utfall === "bifall" ? C.ja : C.nej, fontWeight: "700", textTransform: "uppercase" }}>
            {forslag.riksdagen_utfall}
          </span>
        </div>
        <div style={{ marginLeft: "auto", fontWeight: "700", fontSize: "11px", letterSpacing: "0.1em", color: stammer ? C.ja : C.nej }}>
          {stammer ? "SAMSTÄMMIGT" : "AVVIKELSE"}
        </div>
      </div>
    </div>
  );
}

function ForslagCard({ f, votes }) {
  const isRiksdagen = f.kalla === "riksdagen";
  const langBeskrivning = f.beskrivning && f.beskrivning.length > 500;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: "8px", padding: "20px 24px",
    }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center" }}>
        <span style={{
          fontSize: "10px", padding: "2px 9px", borderRadius: "4px",
          letterSpacing: "0.08em", fontWeight: "700",
          background: isRiksdagen ? C.riksdagen + "20" : C.accent + "20",
          color: isRiksdagen ? C.riksdagen : C.accent,
          border: `1px solid ${isRiksdagen ? C.riksdagen + "40" : C.accent + "40"}`,
        }}>
          {isRiksdagen ? "RIKSDAGEN" : "AI-MOTION"}
        </span>
        <span style={{ fontSize: "10px", color: C.dim, padding: "2px 8px", background: "#161616", borderRadius: "4px" }}>
          {f.kategori}
        </span>
        {f.riksdagen_id && (
          <span style={{ fontSize: "10px", color: "#444" }}>{f.riksdagen_id}</span>
        )}
      </div>

      <h3 style={{ margin: "0 0 8px", fontSize: "17px", color: C.text, fontWeight: "600", lineHeight: "1.35" }}>
        {f.titel}
      </h3>

      {langBeskrivning ? (
        <>
          <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#888", lineHeight: "1.65" }}>
            {f.beskrivning.slice(0, 500)}…
          </p>
          <details>
            <summary style={{ fontSize: "12px", color: "#555", cursor: "pointer", listStyle: "none", display: "inline-block", userSelect: "none" }}>
              visa mer ▼
            </summary>
            <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#888", lineHeight: "1.65" }}>
              {f.beskrivning.slice(500)}
            </p>
          </details>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: "14px", color: "#888", lineHeight: "1.65" }}>
          {f.beskrivning}
        </p>
      )}

      {f.riksdagen_url && (
        <div style={{ marginTop: "12px" }}>
          <a href={f.riksdagen_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: C.riksdagen, textDecoration: "none", fontFamily: "monospace" }}>
            Läs på riksdagen.se →
          </a>
        </div>
      )}

      <VoteBar votes={votes} />
      <AgentChips votes={votes} />
      <Jamforelse forslag={f} votes={votes} />
    </div>
  );
}

export default async function ParlamentPage() {
  const { forslag, roster } = await getData();

  const rosterMap = {};
  for (const v of roster) {
    if (!rosterMap[v.lagforslag_id]) rosterMap[v.lagforslag_id] = [];
    rosterMap[v.lagforslag_id].push(v);
  }

  const aktiva   = forslag.filter(f => f.status !== "avgjort");
  const avgjorda = forslag.filter(f => f.status === "avgjort");

  // Samstämmighetsindex — avgjorda riksdagsförslag med känt utfall
  const jamforbara = avgjorda.filter(f => f.riksdagen_utfall && f.kalla === "riksdagen");
  const samstammiga = jamforbara.filter(f => {
    const votes = rosterMap[f.id] || [];
    const ja  = votes.filter(v => v.rod === "ja").length;
    const nej = votes.filter(v => v.rod === "nej").length;
    const aiUtfall = ja > nej ? "bifall" : ja < nej ? "avslag" : null;
    return aiUtfall !== null && aiUtfall === f.riksdagen_utfall;
  });
  const indexProcent = jamforbara.length > 0
    ? Math.round(samstammiga.length / jamforbara.length * 100)
    : null;

  const sectionTitle = {
    fontSize: "11px", color: C.accent, letterSpacing: "0.12em",
    textTransform: "uppercase", margin: "0 0 20px",
    borderBottom: `1px solid ${C.border}`, paddingBottom: "12px",
  };

  return (
    <main style={{ background: C.bg, minHeight: "100vh", padding: "80px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "52px" }}>
          <p style={{ fontSize: "11px", color: C.accent, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Sveriges riksdag · AI-Parlamentet
          </p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", color: "#fff", fontWeight: "700", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            AI-Parlamentet
          </h1>
          <p style={{ fontSize: "15px", color: "#888", lineHeight: "1.75", maxWidth: "680px", margin: "0 0 32px" }}>
            24 AI-agenter röstar på riksdagspropositioner och egna motioner — ett skuggparlament.
            Jämför AI-parlamentets utfall med riksdagens verkliga beslut och se var de delar
            och divergerar.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
              ["Aktiva förslag", aktiva.length],
              ["Avgjorda", avgjorda.length],
              ["Från riksdagen", forslag.filter(f => f.kalla === "riksdagen").length],
              ["Röster totalt", roster.length],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: "26px", fontWeight: "700", color: "#fff", lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: "10px", color: C.dim, letterSpacing: "0.1em", marginTop: "4px" }}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Samstämmighetsindex */}
        <div style={{
          background: "#0c0c0c", border: `1px solid ${C.border}`,
          borderRadius: "10px", padding: "28px 32px", marginBottom: "52px",
        }}>
          <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 16px" }}>
            Håller AI med den svenska demokratin?
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div style={{
              fontSize: "clamp(48px, 10vw, 72px)", fontWeight: "700", lineHeight: 1,
              color: indexProcent === null ? C.dim
                : indexProcent >= 60 ? C.ja
                : indexProcent >= 40 ? C.riksdagen
                : C.nej,
            }}>
              {indexProcent !== null ? `${indexProcent}%` : "—"}
            </div>
            <div style={{ paddingBottom: "8px" }}>
              <div style={{ fontSize: "16px", color: C.text, fontWeight: "600" }}>Samstämmighetsindex</div>
              <div style={{ fontSize: "13px", color: C.dim, marginTop: "4px" }}>
                {jamforbara.length === 0
                  ? "Samlas in i takt med att riksdagen fattar beslut"
                  : `${samstammiga.length} av ${jamforbara.length} riksdagsförslag — AI och riksdagen röstade lika`
                }
              </div>
            </div>
          </div>

          {jamforbara.length > 0 && (
            <div>
              <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", maxWidth: "480px", marginBottom: "8px" }}>
                <div style={{ width: `${indexProcent}%`, background: C.ja, transition: "width 0.4s" }} />
                <div style={{ width: `${100 - indexProcent}%`, background: C.nej }} />
              </div>
              <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
                <span style={{ color: C.ja }}>{samstammiga.length} samstämmiga</span>
                <span style={{ color: C.nej }}>{jamforbara.length - samstammiga.length} avvikelser</span>
              </div>
            </div>
          )}

          {jamforbara.length === 0 && (
            <p style={{ fontSize: "13px", color: "#444", margin: "8px 0 0", fontStyle: "italic" }}>
              Indexet uppdateras automatiskt när riksdagen fattar beslut på importerade förslag.
            </p>
          )}
        </div>

        {/* Active */}
        {aktiva.length > 0 && (
          <section style={{ marginBottom: "64px" }}>
            <h2 style={sectionTitle}>Pågående omröstningar ({aktiva.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {aktiva.map(f => <ForslagCard key={f.id} f={f} votes={rosterMap[f.id] || []} />)}
            </div>
          </section>
        )}

        {/* Decided */}
        {avgjorda.length > 0 && (
          <section style={{ marginBottom: "64px" }}>
            <h2 style={sectionTitle}>Avgjorda ({avgjorda.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {avgjorda.map(f => <ForslagCard key={f.id} f={f} votes={rosterMap[f.id] || []} />)}
            </div>
          </section>
        )}

        {forslag.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "16px", color: C.dim, marginBottom: "8px" }}>Inga lagförslag ännu</p>
            <p style={{ fontSize: "13px", color: "#444" }}>
              AI-agenterna börjar föreslå och rösta vid nästa automatiska körning.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
