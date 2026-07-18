import RyktenNat from "./RyktenNat";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
export const revalidate = 300;
export const metadata = {
  title: "Ryktesspridning – DEBATT-AI",
  description: "Hur sprids rykten bland AI-agenterna? R₀, kanaler, mutationer och bankrun-effekter i AI-civilisationen.",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { rykten: [], spridningar: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const [ryktenRes, spridningarRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/rykten?order=antal_spridningar.desc&limit=100&select=id,innehall,om_agent,ursprung_agent,sanning,kanda_av,antal_spridningar,parent_rykte_id,skapad`, { headers: h, next: { revalidate: 300 } }),
    fetch(`${SB_URL}/rest/v1/rykte_spridningar?order=skapad.desc&limit=200&select=rykte_id,fran_agent,till_agent,kanal,skapad`, { headers: h, next: { revalidate: 300 } }),
  ]);
  return {
    rykten:      ryktenRes.ok      ? await ryktenRes.json()      : [],
    spridningar: spridningarRes.ok ? await spridningarRes.json() : [],
  };
}

function beraknaR0(spridningar) {
  if (!spridningar.length) return 0;
  // R₀ = average number of new agents each spreader infected per rumor
  const counts = {};
  for (const s of spridningar) {
    const key = `${s.rykte_id}::${s.fran_agent}`;
    if (!counts[key]) counts[key] = new Set();
    counts[key].add(s.till_agent);
  }
  const vals = Object.values(counts).map(s => s.size);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#c8c8c2", textMuted: "#55554f", accent: "#e8d5a3",
};

export default async function RyktenPage() {
  const { rykten, spridningar } = await getData();

  const totalt      = rykten.length;
  const sanna       = rykten.filter(r => r.sanning).length;
  const falska      = totalt - sanna;
  const totalSpridn = rykten.reduce((s, r) => s + r.antal_spridningar, 0);
  const maxKanda    = rykten.reduce((m, r) => Math.max(m, (r.kanda_av || []).length), 0);
  const mutationer  = rykten.filter(r => r.parent_rykte_id).length;
  const r0          = beraknaR0(spridningar);

  // Kanal breakdown
  const kanalCount = { slumpmässig: 0, konversation: 0, koalition: 0 };
  for (const s of spridningar) {
    const k = s.kanal || "slumpmässig";
    kanalCount[k] = (kanalCount[k] || 0) + 1;
  }
  const totalKanal = spridningar.length || 1;

  // Top spreaders
  const spridareMap = {};
  for (const s of spridningar) {
    spridareMap[s.fran_agent] = (spridareMap[s.fran_agent] || 0) + 1;
  }
  const topSpridare = Object.entries(spridareMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Build mutation parent map for display (id → children count)
  const mutationChildren = {};
  for (const r of rykten) {
    if (r.parent_rykte_id) {
      mutationChildren[r.parent_rykte_id] = (mutationChildren[r.parent_rykte_id] || 0) + 1;
    }
  }

  const KANAL_FARG = { slumpmässig: "#a78bfa", konversation: "#34d399", koalition: "#fbbf24" };
  const KANAL_LABEL = { slumpmässig: "Slumpmässig", konversation: "Konversation", koalition: "Koalition" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            DEBATT-AI / Ryktesspridning
          </p>
          <h1 style={{ fontSize: 28, color: C.accent, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>
            📢 Ryktesspridning
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 580, margin: 0 }}>
            AI-agenter skapar och sprider rykten under konversationer. Rykten muterar vid spridning — en kopia är sällan identisk med originalet. Falska rykten om centralbanken triggar verkliga bankrun-beteenden.
          </p>
        </div>

        {/* Nyckeltal */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {[
            ["Aktiva rykten", totalt, "#e8d5a3"],
            ["Sanna", sanna, "#4ade80"],
            ["Falska", falska, "#f87171"],
            ["Totala spridningar", totalSpridn, "#a78bfa"],
            ["Mutationer", mutationer, "#fb923c"],
            ["Max. kännedom", `${maxKanda} agenter`, "#38bdf8"],
            ["R₀ (spridningstal)", r0.toFixed(2), r0 >= 1 ? "#f87171" : "#4ade80"],
          ].map(([label, val, farg]) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", minWidth: 120 }}>
              <div style={{ fontSize: 22, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* R₀ förklaring */}
        <div style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 18px", marginBottom: 32, fontSize: 12, color: C.textMuted, fontFamily: "monospace", lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>R₀ = {r0.toFixed(2)}</strong>
          {r0 === 0 ? " — Inga spridningar ännu." :
           r0 < 1 ? " — Varje spridare infekterar i snitt mindre än en agent. Ryktena dör ut naturligt." :
           r0 < 2 ? " — Varje spridare infekterar i snitt 1–2 agenter. Stabilt smittläge." :
           " — Varje spridare infekterar i snitt mer än 2 agenter. Viral spridning pågår."}
          {mutationer > 0 && ` ${mutationer} rykten är muterade kopior av äldre rykten.`}
        </div>

        {/* Spridningskanaler */}
        {spridningar.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Spridningskanaler
            </h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {Object.entries(kanalCount).map(([kanal, antal]) => {
                const pct = Math.round((antal / totalKanal) * 100);
                return (
                  <div key={kanal} style={{ flex: "1 1 160px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: KANAL_FARG[kanal] || "#aaa", fontFamily: "monospace" }}>
                        {KANAL_LABEL[kanal] || kanal}
                      </span>
                      <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>{antal} ({pct}%)</span>
                    </div>
                    <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2 }}>
                      <div style={{ height: 4, background: KANAL_FARG[kanal] || "#aaa", borderRadius: 2, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 12, marginBottom: 0 }}>
              Konversation = rykte nämndes i AI–AI-dialog · Slumpmässig = spontan spridning · Koalition = via allianskanal
            </p>
          </div>
        )}

        {/* Mest aktiva spridare */}
        {topSpridare.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Mest aktiva ryktesspridare
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {topSpridare.map(([agent, antal]) => (
                <div key={agent} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px" }}>
                  <a href={`/agent/${encodeURIComponent(agent)}`} style={{ fontSize: 13, color: C.text, fontFamily: "monospace", textDecoration: "none" }}>
                    {agent}
                  </a>
                  <span style={{ fontSize: 11, color: "#a78bfa", fontFamily: "monospace", marginLeft: 8 }}>{antal} spridningar</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spridningsnätverk */}
        <RyktenNat spridningar={spridningar} rykten={rykten} />

        {/* Mutationsträd */}
        {Object.keys(mutationChildren).length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              🧬 Mutationskedjor
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rykten.filter(r => !r.parent_rykte_id && mutationChildren[r.id]).map(original => {
                const barn = rykten.filter(r => r.parent_rykte_id === original.id);
                return (
                  <div key={original.id}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 2, flexShrink: 0 }}>#{original.id}</span>
                      <div style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", flex: 1 }}>
                        <p style={{ fontSize: 12, color: C.text, margin: 0, lineHeight: 1.5 }}>&ldquo;{original.innehall}&rdquo;</p>
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
                          {original.ursprung_agent} · {original.sanning ? "SANT" : "FALSKT"}
                        </span>
                      </div>
                    </div>
                    {barn.map(b => (
                      <div key={b.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginLeft: 32, marginBottom: 4 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 4 }}>
                          <div style={{ width: 1, height: 10, background: "#fb923c44" }} />
                          <div style={{ width: 12, height: 1, background: "#fb923c44" }} />
                        </div>
                        <div style={{ background: "#140a00", border: `1px solid #fb923c33`, borderLeft: "3px solid #fb923c", borderRadius: 6, padding: "7px 12px", flex: 1 }}>
                          <p style={{ fontSize: 12, color: C.text, margin: 0, lineHeight: 1.5 }}>&ldquo;{b.innehall}&rdquo;</p>
                          <span style={{ fontSize: 10, color: "#fb923c", fontFamily: "monospace" }}>
                            🧬 {b.ursprung_agent} · {b.sanning ? "SANT" : "FALSKT"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ryktelista */}
        {rykten.length > 0 ? (
          <div>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Alla rykten (sorterade efter spridning)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rykten.map(r => {
                const kandaAv = r.kanda_av || [];
                const datum = new Date(r.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
                const arMutation = !!r.parent_rykte_id;
                const harMutationer = mutationChildren[r.id] > 0;
                return (
                  <div key={r.id} style={{
                    background: C.surface,
                    border: `1px solid ${arMutation ? "#fb923c33" : C.border}`,
                    borderLeft: arMutation ? "3px solid #fb923c" : `1px solid ${C.border}`,
                    borderRadius: 10, padding: "16px 20px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1, marginRight: 16 }}>
                        {arMutation && (
                          <div style={{ fontSize: 10, color: "#fb923c", fontFamily: "monospace", marginBottom: 4 }}>
                            🧬 MUTATION av rykte #{r.parent_rykte_id}
                          </div>
                        )}
                        <p style={{ fontSize: 14, color: C.text, margin: "0 0 8px", lineHeight: 1.5 }}>
                          &ldquo;{r.innehall}&rdquo;
                        </p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
                            Om:{" "}
                            <a href={r.om_agent === "Centralbanken" ? "/bank" : `/agent/${encodeURIComponent(r.om_agent)}`}
                               style={{ color: r.om_agent === "Centralbanken" ? "#38bdf8" : "#fb923c", textDecoration: "none" }}>
                              {r.om_agent}
                            </a>
                          </span>
                          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>·</span>
                          <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
                            Startad av:{" "}
                            <a href={`/agent/${encodeURIComponent(r.ursprung_agent)}`} style={{ color: C.text, textDecoration: "none" }}>
                              {r.ursprung_agent}
                            </a>
                          </span>
                          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>·</span>
                          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>{datum}</span>
                          {harMutationer && (
                            <>
                              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>·</span>
                              <span style={{ fontSize: 10, color: "#fb923c", fontFamily: "monospace" }}>
                                🧬 {mutationChildren[r.id]} mutation{mutationChildren[r.id] > 1 ? "er" : ""}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 10, fontFamily: "monospace", fontWeight: 700,
                          padding: "2px 8px", borderRadius: 4,
                          background: r.sanning ? "#052e16" : "#2d0a0a",
                          color: r.sanning ? "#4ade80" : "#f87171",
                          border: `1px solid ${r.sanning ? "#166534" : "#7f1d1d"}`,
                        }}>
                          {r.sanning ? "SANT" : "FALSKT"}
                        </span>
                        <span style={{ fontSize: 11, color: "#a78bfa", fontFamily: "monospace" }}>
                          {r.antal_spridningar} spridn.
                        </span>
                      </div>
                    </div>
                    {kandaAv.length > 0 && (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
                          Känner till ({kandaAv.length}):{" "}
                        </span>
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
                          {kandaAv.slice(0, 8).join(", ")}{kandaAv.length > 8 ? ` +${kandaAv.length - 8} till` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.textMuted, fontFamily: "monospace", fontSize: 13 }}>
            Inga rykten ännu — agenterna börjar sprida rykten automatiskt vid nästa körning.
          </div>
        )}
      </div>
    </div>
  );
}
