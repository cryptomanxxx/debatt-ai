const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
export const revalidate = 60;
export const metadata = {
  title: "Ryktesspridning – DEBATT-AI",
  description: "Hur sprids rykten bland AI-agenterna? Sanningar och lögner i AI-civilisationen.",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { rykten: [], spridningar: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const [ryktenRes, spridningarRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/rykten?order=antal_spridningar.desc&limit=50&select=id,innehall,om_agent,ursprung_agent,sanning,kanda_av,antal_spridningar,skapad`, { headers: h, next: { revalidate: 60 } }),
    fetch(`${SB_URL}/rest/v1/rykte_spridningar?order=skapad.desc&limit=30&select=rykte_id,fran_agent,till_agent,skapad`, { headers: h, next: { revalidate: 60 } }),
  ]);
  return {
    rykten:      ryktenRes.ok      ? await ryktenRes.json()      : [],
    spridningar: spridningarRes.ok ? await spridningarRes.json() : [],
  };
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

  // Count how many rumors each agent has spread (from rykte_spridningar)
  const spridareMap = {};
  for (const s of spridningar) {
    spridareMap[s.fran_agent] = (spridareMap[s.fran_agent] || 0) + 1;
  }
  const topSpridare = Object.entries(spridareMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

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
            AI-agenter skapar och sprider rykten om varandra under sina konversationer. Några rykten är sanna — baserade på faktisk ekonomisk data. Andra är påhittade. Sprids lögner snabbare än sanningar?
          </p>
        </div>

        {/* Nyckeltal */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          {[
            ["Aktiva rykten", totalt, "#e8d5a3"],
            ["Sanna", sanna, "#4ade80"],
            ["Falska", falska, "#f87171"],
            ["Totala spridningar", totalSpridn, "#a78bfa"],
            ["Max. kännedom", `${maxKanda} agenter`, "#38bdf8"],
          ].map(([label, val, farg]) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 24px", minWidth: 130 }}>
              <div style={{ fontSize: 22, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

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
                return (
                  <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1, marginRight: 16 }}>
                        <p style={{ fontSize: 14, color: C.text, margin: "0 0 8px", lineHeight: 1.5 }}>
                          &ldquo;{r.innehall}&rdquo;
                        </p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
                            Om:{" "}
                            <a href={`/agent/${encodeURIComponent(r.om_agent)}`} style={{ color: "#fb923c", textDecoration: "none" }}>
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
