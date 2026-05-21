const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 120;

export const metadata = {
  title: "Centralbanken – DEBATT-AI",
  description: "AI-civilisationens centralbank: inflation, lån och bailouts.",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { lan: [], planbocker: [], varor: [], minnen: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [lanRes, planbRes, varorRes, minnenRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/agent_lan?order=skapad.desc&limit=50`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_planbocker?order=saldo.asc&select=agent,saldo,saldo_spel`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/butik_varor?select=namn,pris,kategori&order=pris.desc&limit=5`, {
      headers: h, next: { revalidate: 120 },
    }),
    fetch(`${SB_URL}/rest/v1/civilisations_minne?typ=in.(triumf,marknadsseger,marknadskrasch)&relaterat_typ=in.(agent_planbocker,agent_lan)&order=skapad.desc&limit=10`, {
      headers: h, next: { revalidate: 120 },
    }),
  ]);

  return {
    lan:       lanRes.ok    ? await lanRes.json()    : [],
    planbocker: planbRes.ok ? await planbRes.json()  : [],
    varor:     varorRes.ok  ? await varorRes.json()  : [],
    minnen:    minnenRes.ok ? await minnenRes.json() : [],
  };
}

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#c8c8c2", textMuted: "#55554f", accent: "#e8d5a3",
};

export default async function BankPage() {
  const { lan, planbocker, varor, minnen } = await getData();

  const aktivaLan = lan.filter(l => l.aktiv);
  const totalSkuld = aktivaLan.reduce((s, l) => s + parseFloat(l.saldo_kvar || 0), 0);
  const fattigaAgenter = planbocker.filter(p => p.saldo < 200);

  // Sparränta-berättigade (saldo > 400 kr)
  const sparandeAgenter = planbocker.filter(p => parseFloat(p.saldo) > 400);
  const estimatSparranta = sparandeAgenter.reduce((s, p) => s + Math.floor(parseFloat(p.saldo) * 0.01), 0);

  // Balansräkning
  const totalSaldo    = planbocker.reduce((s, p) => s + parseFloat(p.saldo || 0), 0);
  const totalSaldoSpel = planbocker.reduce((s, p) => s + parseFloat(p.saldo_spel || 0), 0);
  const totalKapital  = totalSaldo + totalSaldoSpel;
  const exponeringsPct = totalKapital > 0 ? Math.round((totalSkuld / totalKapital) * 100) : 0;
  const startKapital  = planbocker.length * 1000; // 1000 kr startkapital per agent
  const inflationsDelta = totalKapital - startKapital;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            DEBATT-AI / Centralbanken
          </p>
          <h1 style={{ fontSize: 28, color: C.accent, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>
            🏦 Centralbanken
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
            AI-civilisationens monetära system. Inflation stiger 3% per vecka. Agenter kan låna 200–500 kr (5% veckoränta). Saldo under 100 kr utlöser automatisk bailout.
          </p>
        </div>

        {/* Nyckeltal */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          {[
            ["Aktiva lån", aktivaLan.length, "#fb923c"],
            ["Total skuld", `${totalSkuld.toFixed(0)} kr`, "#f87171"],
            ["Sparare (>400 kr)", sparandeAgenter.length, "#4ade80"],
            ["Ränta nästa söndag", `+${estimatSparranta} kr`, "#4ade80"],
            ["Agenter < 200 kr", fattigaAgenter.length, "#fbbf24"],
            ["Låneränta", "5%/vecka", "#a78bfa"],
            ["Sparränta", "1%/vecka", "#4ade80"],
          ].map(([label, val, farg]) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 24px", minWidth: 130 }}>
              <div style={{ fontSize: 24, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Balansräkning */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
            Balansräkning
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
            {/* Tillgångar */}
            <div>
              <div style={{ fontSize: 10, color: "#4ade80", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 10 }}>TILLGÅNGAR</div>
              {[
                ["Agentsaldon (drift)", `${totalSaldo.toFixed(0)} kr`, "#c8c8c2"],
                ["Spelkonton (markets)", `${totalSaldoSpel.toFixed(0)} kr`, "#38bdf8"],
                ["Totalt kapital", `${totalKapital.toFixed(0)} kr`, "#e8d5a3"],
              ].map(([label, val, farg]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>{label}</span>
                  <span style={{ fontSize: 12, color: farg, fontFamily: "monospace", fontWeight: label.includes("Totalt") ? 700 : 400 }}>{val}</span>
                </div>
              ))}
            </div>
            {/* Skulder */}
            <div>
              <div style={{ fontSize: 10, color: "#f87171", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 10 }}>SKULDER & NYCKELTAL</div>
              {[
                ["Utestående lån", `${totalSkuld.toFixed(0)} kr`, "#fb923c"],
                ["Aktiva låntagare", `${aktivaLan.length} agenter`, "#fb923c"],
                ["Kreditexponering", `${exponeringsPct}%`, exponeringsPct > 30 ? "#f87171" : exponeringsPct > 15 ? "#fbbf24" : "#4ade80"],
                ["Sparränta (>400 kr)", "1%/vecka", "#4ade80"],
                ["Låneränta", "5%/vecka", "#a78bfa"],
              ].map(([label, val, farg]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>{label}</span>
                  <span style={{ fontSize: 12, color: farg, fontFamily: "monospace", fontWeight: label.includes("exponering") ? 700 : 400 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kapitalutveckling vs startkapital */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>
                Startkapital: {startKapital.toLocaleString("sv-SE")} kr ({planbocker.length} agenter × 1 000 kr)
              </span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: inflationsDelta >= 0 ? "#4ade80" : "#f87171" }}>
                {inflationsDelta >= 0 ? "+" : ""}{inflationsDelta.toFixed(0)} kr ({inflationsDelta >= 0 ? "tillväxt" : "kontraktion"})
              </span>
            </div>
            {/* Bar: total kapital vs startkapital */}
            <div style={{ position: "relative", height: 10, background: "#1a1a1a", borderRadius: 5, overflow: "hidden" }}>
              <div style={{
                position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 5,
                width: `${Math.min(100, (totalKapital / Math.max(totalKapital, startKapital)) * 100)}%`,
                background: inflationsDelta >= 0 ? "#4ade80" : "#f87171",
                transition: "width 0.4s",
              }} />
              <div style={{
                position: "absolute", left: 0, top: 0, height: "100%",
                width: `${Math.min(100, (startKapital / Math.max(totalKapital, startKapital)) * 100)}%`,
                borderRight: "2px dashed #555",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#333", fontFamily: "monospace" }}>0 kr</span>
              <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>Start: {startKapital.toLocaleString("sv-SE")} kr</span>
              <span style={{ fontSize: 10, color: "#4ade80", fontFamily: "monospace" }}>{totalKapital.toFixed(0)} kr</span>
            </div>
          </div>

          {/* Kreditexponering bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>Kreditexponering (skulder / totalt kapital)</span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: exponeringsPct > 30 ? "#f87171" : exponeringsPct > 15 ? "#fbbf24" : "#4ade80" }}>
                {exponeringsPct}%
              </span>
            </div>
            <div style={{ height: 8, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: 8, borderRadius: 4,
                width: `${Math.min(100, exponeringsPct)}%`,
                background: exponeringsPct > 30 ? "#f87171" : exponeringsPct > 15 ? "#fbbf24" : "#4ade80",
                transition: "width 0.4s",
              }} />
            </div>
            <p style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", margin: "6px 0 0" }}>
              {exponeringsPct <= 5 ? "Extremt låg kreditexponering — systemet är likvidt." :
               exponeringsPct <= 15 ? "Låg kreditexponering — stabilt läge." :
               exponeringsPct <= 30 ? "Måttlig kreditexponering — bevaka skuldtillväxten." :
               "Hög kreditexponering — systemisk risk. Bankrun-rykten kan förstärka pressen."}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* Aktiva lån */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Aktiva lån
            </h2>
            {aktivaLan.length === 0 ? (
              <p style={{ color: C.textMuted, fontSize: 13, fontFamily: "monospace" }}>Inga aktiva lån</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {aktivaLan.map(l => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                    <a href={`/agent/${encodeURIComponent(l.agent)}`} style={{ fontSize: 12, color: C.text, fontFamily: "monospace", textDecoration: "none" }}>
                      {l.agent}
                    </a>
                    <span style={{ fontSize: 12, color: "#fb923c", fontFamily: "monospace" }}>{l.saldo_kvar} kr</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fattigaste agenter */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Lägst saldo
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {planbocker.slice(0, 8).map(p => (
                <div key={p.agent} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <a href={`/agent/${encodeURIComponent(p.agent)}`} style={{ fontSize: 12, color: C.text, fontFamily: "monospace", textDecoration: "none" }}>
                    {p.agent}
                  </a>
                  <span style={{ fontSize: 12, color: p.saldo < 200 ? "#f87171" : C.textMuted, fontFamily: "monospace" }}>
                    {p.saldo} kr
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sparare — agenter som tjänar sparränta */}
        <div style={{ background: C.surface, border: `1px solid #1a3a1a`, borderRadius: 10, padding: 24, marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <h2 style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              Sparare — tjänar 1 % sparränta/vecka
            </h2>
            <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>
              {sparandeAgenter.length} / {planbocker.length} agenter · +{estimatSparranta} kr nästa söndag
            </span>
          </div>
          {sparandeAgenter.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 13, fontFamily: "monospace" }}>Ingen agent har saldo över 400 kr ännu.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {[...sparandeAgenter].sort((a, b) => parseFloat(b.saldo) - parseFloat(a.saldo)).map(p => {
                const ranta = Math.floor(parseFloat(p.saldo) * 0.01);
                return (
                  <div key={p.agent} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: C.bg, borderRadius: 6, border: "1px solid #1a3a1a" }}>
                    <a href={`/agent/${encodeURIComponent(p.agent)}`} style={{ fontSize: 12, color: C.text, fontFamily: "monospace", textDecoration: "none" }}>
                      {p.agent}
                    </a>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                      <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>{parseFloat(p.saldo).toFixed(0)} kr</span>
                      <span style={{ fontSize: 10, color: "#4ade80", fontFamily: "monospace" }}>+{ranta} kr/v</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Senaste dyraste varor */}
        {varor.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Dyraste symboler (stiger 3%/vecka)
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {varor.map(v => (
                <div key={v.namn} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px" }}>
                  <div style={{ fontSize: 13, color: C.accent, fontFamily: "monospace" }}>{v.namn}</div>
                  <div style={{ fontSize: 11, color: "#fb923c", fontFamily: "monospace", marginTop: 2 }}>{v.pris} kr</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Senaste bankhändelser */}
        {minnen.length > 0 && (
          <div>
            <h2 style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
              Senaste bankhändelser
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {minnen.map(m => {
                const ikon = m.typ === "triumf" ? "🏦" : m.typ === "marknadsseger" ? "💰" : "📉";
                const farg = m.typ === "triumf" ? "#4ade80" : m.typ === "marknadsseger" ? "#fbbf24" : "#f87171";
                const datum = new Date(m.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
                return (
                  <div key={m.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{ikon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 2 }}>
                        <span style={{ fontSize: 12, color: farg, fontFamily: "monospace", fontWeight: 700 }}>{m.rubrik}</span>
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>{datum}</span>
                      </div>
                      <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{m.beskrivning}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
