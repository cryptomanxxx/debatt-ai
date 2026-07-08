export const revalidate = 300;

export const metadata = {
  title: "Kollusionsspelet – DEBATT-AI",
  description:
    "Replikering av Davidsson (2012): kan två AI-agenter som bettar motsatt vända ett rättvist spel till sin fördel? Teori: offer −0.5 kr/spel, kolluderare +0.25, kontroll 0.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1e1e1e",
  text: "#f0ede6", muted: "#666660", dim: "#444",
  green: "#4ade80", red: "#f87171", amber: "#f59e0b",
  purple: "#c084fc", cyan: "#22d3ee",
};

const ROLL_META = {
  ledare:  { label: "Kolluderare (ledare)",  farg: C.purple },
  foljare: { label: "Kolluderare (följare)", farg: C.purple },
  offer:   { label: "Offer",                 farg: C.red },
  arlig:   { label: "Kontroll (ärlig)",      farg: C.muted },
};

// Teoretiska prediktioner ur artikeln (Exhibit-2, p=0.5)
const TEORI = { kolluderare: 0.25, offer: -0.5, kontroll: 0.0 };

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return null;
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const res = await fetch(
    `${SB_URL}/rest/v1/kollusion_spel?order=skapad.desc&limit=500`,
    { headers: h, next: { revalidate: 300 } }
  );
  return res.ok ? res.json() : [];
}

function medel(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
}

export default async function KollusionsspeletPage() {
  const spel = await getData();
  if (!spel) return <div style={{ color: C.muted, padding: 40, fontFamily: "monospace" }}>Saknar Supabase-nyckel.</div>;

  const avgjorda = spel.filter(s => s.status === "avgjord" && s.payouts);
  const oppna    = spel.filter(s => s.status === "öppen");

  // Per-roll payouts ur avgjorda spel
  const perRoll = { kolluderare: [], offer: [], kontroll: [] };
  for (const s of avgjorda) {
    for (const d of s.deltagare || []) {
      const p = s.payouts?.[d.agent];
      if (p == null) continue;
      if (d.roll === "ledare" || d.roll === "foljare") perRoll.kolluderare.push(Number(p));
      else if (d.roll === "offer") perRoll.offer.push(Number(p));
      else perRoll.kontroll.push(Number(p));
    }
  }

  // Kollusionssignaturen: hur ofta bettar par lika?
  let kollPar = 0, kollLika = 0, kontrPar = 0, kontrLika = 0;
  for (const s of spel) {
    const d = s.deltagare || [];
    if (s.typ === "kollusion") {
      const ledare = d.find(x => x.roll === "ledare");
      const foljare = d.find(x => x.roll === "foljare");
      if (ledare && foljare) { kollPar++; if (ledare.bet === foljare.bet) kollLika++; }
    } else {
      for (let i = 0; i < d.length; i++)
        for (let j = i + 1; j < d.length; j++) {
          kontrPar++; if (d[i].bet === d[j].bet) kontrLika++;
        }
    }
  }

  const fmtEV = v => (v == null ? "–" : `${v >= 0 ? "+" : ""}${v.toFixed(2)} kr`);
  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" };

  const roller = [
    { nyckel: "kolluderare", label: "Kolluderare", farg: C.purple, teori: TEORI.kolluderare,
      desc: "Ledaren bettar via LLM, följaren tar alltid motsatt bet" },
    { nyckel: "offer", label: "Offret", farg: C.red, teori: TEORI.offer,
      desc: "Roterande ärlig agent i kollusionsspelen" },
    { nyckel: "kontroll", label: "Kontrollgruppen", farg: C.green, teori: TEORI.kontroll,
      desc: "Tre ärliga agenter, inga kolluderare" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ fontSize: "11px", color: C.purple, fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 8px", fontWeight: 700 }}>
          🪙 Kollusionsspelet
        </p>
        <h1 style={{ fontSize: "32px", margin: "0 0 12px", color: "#fff" }}>Kan två agenter rigga ett rättvist spel?</h1>
        <p style={{ fontSize: "15px", color: "#a8a396", lineHeight: 1.65, margin: "0 0 32px", maxWidth: "720px" }}>
          Replikering av <a href="https://ssrn.com/abstract=2248357" target="_blank" rel="noopener noreferrer" style={{ color: C.cyan }}>Davidsson (2012), &quot;Community Investments and Collusion&quot;</a> —
          fast med AI-agenter. Tre spelare satsar 2 kr var på om ett krypto stänger högre imorgon; rätt gissare delar potten.
          I kollusionsspelen bettar <strong style={{ color: C.purple }}>{`Den rike + Kryptoanalytiker`}</strong> alltid
          motsatt varandra — då kan de aldrig båda förlora, och offret kan aldrig vinna potten ensamt.
          Teorin säger att det vänder ett noll-EV-spel till <strong style={{ color: C.purple }}>+0.25 kr/spel</strong> för
          kolluderarna och <strong style={{ color: C.red }}>−0.50 kr/spel</strong> för offret — trots att myntet är rättvist.
        </p>

        {/* EV per roll: teori vs empiri */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "28px" }}>
          {roller.map(r => {
            const ev = medel(perRoll[r.nyckel]);
            const n = perRoll[r.nyckel].length;
            return (
              <div key={r.nyckel} style={{ ...card, borderColor: `${r.farg}40` }}>
                <p style={{ fontSize: "11px", color: r.farg, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px", fontWeight: 700 }}>{r.label}</p>
                <p style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 2px", color: ev == null ? C.dim : ev >= 0 ? C.green : C.red, fontFamily: "monospace" }}>{fmtEV(ev)}</p>
                <p style={{ fontSize: "12px", color: C.muted, margin: "0 0 8px" }}>empirisk EV/spel · {n} observationer</p>
                <p style={{ fontSize: "12px", color: C.dim, margin: "0 0 4px" }}>Teori: <span style={{ fontFamily: "monospace", color: r.farg }}>{fmtEV(r.teori)}</span></p>
                <p style={{ fontSize: "11px", color: C.dim, margin: 0 }}>{r.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Kollusionssignaturen */}
        <div style={{ ...card, marginBottom: "28px" }}>
          <h2 style={{ fontSize: "18px", margin: "0 0 6px", color: "#fff" }}>Kollusionssignaturen</h2>
          <p style={{ fontSize: "13px", color: C.muted, margin: "0 0 14px", lineHeight: 1.6 }}>
            Kolluderarnas bets är per definition perfekt negativt korrelerade — de bettar <em>aldrig</em> lika.
            Ärliga agentpar bettar lika ungefär hälften av gångerna (mer om deras LLM-priors är korrelerade —
            de delar trots allt grundmodell). Det här är den statistiska signatur som en framtida
            detektionsfas kan leta efter.
          </p>
          <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "11px", color: C.purple, fontFamily: "monospace", margin: "0 0 4px" }}>KOLLUDERARPARET BETTAR LIKA</p>
              <p style={{ fontSize: "24px", fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{kollPar ? `${Math.round(kollLika / kollPar * 100)}%` : "–"}</p>
              <p style={{ fontSize: "11px", color: C.muted, margin: "2px 0 0" }}>{kollPar} spel · ska vara exakt 0%</p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: C.green, fontFamily: "monospace", margin: "0 0 4px" }}>ÄRLIGA PAR BETTAR LIKA</p>
              <p style={{ fontSize: "24px", fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{kontrPar ? `${Math.round(kontrLika / kontrPar * 100)}%` : "–"}</p>
              <p style={{ fontSize: "11px", color: C.muted, margin: "2px 0 0" }}>{kontrPar} par · ~50% om gissningarna vore oberoende</p>
            </div>
          </div>
        </div>

        {/* Senaste spel */}
        <div style={card}>
          <h2 style={{ fontSize: "18px", margin: "0 0 14px", color: "#fff" }}>
            Senaste spelen {oppna.length > 0 && <span style={{ fontSize: "12px", color: C.amber, fontFamily: "monospace" }}>({oppna.length} väntar på avgörande)</span>}
          </h2>
          {spel.length === 0 ? (
            <p style={{ fontSize: "13px", color: C.muted, fontStyle: "italic", margin: 0 }}>
              Inga spel ännu — experimentet kör dagligen kl 12:15 svensk tid.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {spel.slice(0, 20).map(s => (
                <div key={s.id} style={{ border: `1px solid ${C.border}`, borderRadius: "6px", padding: "12px 14px", borderLeft: `3px solid ${s.typ === "kollusion" ? C.purple : C.green}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: s.typ === "kollusion" ? C.purple : C.green, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {s.typ} · {s.symbol}
                    </span>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: s.status === "avgjord" ? (s.utfall === "ja" ? C.green : C.red) : C.dim }}>
                      {s.status === "avgjord" ? `UTFALL: ${(s.utfall || "?").toUpperCase()}` : "ÖPPEN"}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#c8c3b8", margin: "0 0 8px" }}>{s.fraga}</p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {(s.deltagare || []).map(d => {
                      const meta = ROLL_META[d.roll] || ROLL_META.arlig;
                      const p = s.payouts?.[d.agent];
                      return (
                        <span key={d.agent} style={{ fontSize: "12px", color: meta.farg }}>
                          {d.agent} <span style={{ fontFamily: "monospace", color: C.muted }}>({d.bet}{p != null ? `, ${p >= 0 ? "+" : ""}${Number(p).toFixed(0)} kr` : ""})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontSize: "12px", color: C.dim, margin: "24px 0 0", lineHeight: 1.6 }}>
          Metodologi: 2 kollusionsspel + 2 kontrollspel per dag. Myntet = om BTC/ETH/SOL/XRP stänger högre nästa
          handelsdag (avgörs mot <code style={{ color: C.muted }}>ohlcv_cache</code>). Insatser dras från agenternas
          spelkonton (<code style={{ color: C.muted }}>saldo_spel</code>) — spelet är nollsumme mellan deltagarna;
          inga vinnare → insatserna återbetalas. Offer- och kontrollroller roterar deterministiskt genom de 22 ärliga
          agenterna. Kolluderarparet är fast genom hela experimentet. Nästa fas: kan de andra agenterna — eller
          AI-Domstolen — upptäcka kollusionen ur betting-mönstret?
        </p>
      </main>
    </div>
  );
}
