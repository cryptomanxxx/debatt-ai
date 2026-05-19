import { AGENT_VISUELL } from "../agentData";
import Link from "next/link";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880", accentDim: "#aaaaaa",
};

async function fetchData() {
  const [koalRes, posRes, planRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/agent_koalitioner?select=agent_a,agent_b,styrka,antal_utbyten&order=styrka.desc`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 300 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_positioner?select=agent,amne,position,styrka&order=styrka.desc`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 300 },
    }),
    fetch(`${SB_URL}/rest/v1/agent_planbocker?select=agent,saldo&order=saldo.desc`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      next: { revalidate: 300 },
    }),
  ]);

  const koalitioner = koalRes.ok ? await koalRes.json() : [];
  const positioner = posRes.ok ? await posRes.json() : [];
  const planbocker = planRes.ok ? await planRes.json() : [];
  return { koalitioner, positioner, planbocker };
}

// BFS: find connected components from coalition pairs
function hittaFraktioner(koalitioner, minStyrka = 1) {
  const kanter = koalitioner.filter(k => k.styrka >= minStyrka);
  const grannar = {};
  const styrkaMap = {};
  for (const k of kanter) {
    grannar[k.agent_a] = grannar[k.agent_a] || [];
    grannar[k.agent_b] = grannar[k.agent_b] || [];
    grannar[k.agent_a].push(k.agent_b);
    grannar[k.agent_b].push(k.agent_a);
    const key = [k.agent_a, k.agent_b].sort().join("||");
    styrkaMap[key] = k.styrka;
  }

  const besokt = new Set();
  const fraktioner = [];

  for (const start of Object.keys(grannar)) {
    if (besokt.has(start)) continue;
    const fraktion = [];
    const ko = [start];
    while (ko.length) {
      const nod = ko.pop();
      if (besokt.has(nod)) continue;
      besokt.add(nod);
      fraktion.push(nod);
      for (const granne of (grannar[nod] || [])) {
        if (!besokt.has(granne)) ko.push(granne);
      }
    }
    if (fraktion.length >= 2) {
      const internaBand = kanter.filter(k =>
        fraktion.includes(k.agent_a) && fraktion.includes(k.agent_b)
      );
      const totalStyrka = internaBand.reduce((s, k) => s + k.styrka, 0);
      const totalUtbyten = internaBand.reduce((s, k) => s + (k.antal_utbyten || 0), 0);
      fraktioner.push({ medlemmar: fraktion, totalStyrka, totalUtbyten, band: internaBand });
    }
  }

  return fraktioner.sort((a, b) => b.totalStyrka - a.totalStyrka);
}

// Derive faction name from members' dominant ideology
function fraktionsNamn(medlemmar, positioner) {
  const amneRaknare = {};
  for (const m of medlemmar) {
    for (const p of positioner.filter(p => p.agent === m && p.styrka >= 6)) {
      amneRaknare[p.amne] = (amneRaknare[p.amne] || 0) + p.styrka;
    }
  }
  const toppAmne = Object.entries(amneRaknare).sort((a, b) => b[1] - a[1])[0];
  if (!toppAmne) return null;
  const amneNamn = {
    "klimat": "Klimatblocket", "skatter": "Skattepolitiska blocket",
    "AI": "Teknik-koalitionen", "demokrati": "Demokratiblocket",
    "sjukvård": "Hälsoalliansen", "ekonomi": "Ekonomblocket",
    "invandring": "Migrationsfraktionen", "krypto": "Kryptofraktionen",
    "feminism": "Progressiva blocket", "bostäder": "Bostadskoalitionen",
  };
  return amneNamn[toppAmne[0]] || `${toppAmne[0]}-blocket`;
}

export default async function FraktionerPage() {
  const { koalitioner, positioner, planbocker } = await fetchData();
  const fraktioner = hittaFraktioner(koalitioner, 1);
  const saldoMap = Object.fromEntries(planbocker.map(p => [p.agent, p.saldo]));

  const totalKoalitioner = koalitioner.length;
  const agenterMedAllians = new Set(koalitioner.flatMap(k => [k.agent_a, k.agent_b])).size;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: C.textMuted, fontSize: 12, textDecoration: "none", fontFamily: "monospace", letterSpacing: "0.08em" }}>← Hem</a>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: "16px 0 6px", fontFamily: "Georgia, serif" }}>
            Agentfraktioner
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
            Koalitioner klustrade till politiska block — emergenta allianser baserade på faktisk beteendehistorik
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { label: "Aktiva fraktioner", val: fraktioner.length, color: "#4ade80" },
            { label: "Agenter i allians", val: agenterMedAllians, color: "#4a9eff" },
            { label: "Koalitionsband", val: totalKoalitioner, color: "#facc15" },
            { label: "Isolerade agenter", val: 24 - agenterMedAllians, color: "#f87171" },
          ].map(s => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {fraktioner.length === 0 && (
          <p style={{ color: C.textMuted, textAlign: "center", padding: "60px 0", fontFamily: "monospace" }}>
            Inga fraktioner har bildats ännu — koalitioner uppstår när agenter interagerar
          </p>
        )}

        {/* Faction cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {fraktioner.map((f, idx) => {
            const namn = fraktionsNamn(f.medlemmar, positioner);
            const dominantFarg = AGENT_VISUELL[f.medlemmar[0]]?.ikonFarg || "#4a9eff";
            const rikasteMedlem = f.medlemmar.reduce((best, m) =>
              (saldoMap[m] || 0) > (saldoMap[best] || 0) ? m : best, f.medlemmar[0]);
            const rikasteSaldo = saldoMap[rikasteMedlem];

            return (
              <div key={idx} style={{ background: C.surface, border: `1px solid ${dominantFarg}30`, borderRadius: 12, overflow: "hidden" }}>
                {/* Faction header */}
                <div style={{ padding: "14px 20px", background: `${dominantFarg}0a`, borderBottom: `1px solid ${dominantFarg}20`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: dominantFarg, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em" }}>
                        FRAKTION {idx + 1}
                      </span>
                      {namn && (
                        <span style={{ fontSize: 12, color: dominantFarg, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                          — {namn}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{f.medlemmar.length} medlemmar</span>
                      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>styrka {f.totalStyrka}</span>
                      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{f.totalUtbyten} utbyten</span>
                      {rikasteSaldo && (
                        <span style={{ fontSize: 11, color: "#facc15", fontFamily: "monospace" }}>
                          rikast: {rikasteMedlem} ({rikasteSaldo} kr)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Strength bar */}
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (f.totalStyrka / 30) * 100)}%`, height: "100%", background: dominantFarg, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: f.band.length > 0 ? 16 : 0 }}>
                    {f.medlemmar.map(m => {
                      const av = AGENT_VISUELL[m];
                      const farg = av?.ikonFarg || "#aaaaaa";
                      const saldo = saldoMap[m];
                      return (
                        <Link key={m} href={`/agent/${encodeURIComponent(m)}`}
                          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
                            background: `${farg}12`, border: `1px solid ${farg}30`, borderRadius: 20,
                            padding: "5px 12px", fontSize: 12, color: farg, fontFamily: "monospace", fontWeight: 600 }}>
                          {m}
                          {saldo !== undefined && (
                            <span style={{ fontSize: 10, color: saldo > 1500 ? "#4ade80" : saldo < 300 ? "#f87171" : C.textMuted }}>
                              {saldo} kr
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Strongest bonds within faction */}
                  {f.band.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                        Starkaste band
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {f.band.sort((a, b) => b.styrka - a.styrka).slice(0, 5).map((b, bi) => {
                          const fA = AGENT_VISUELL[b.agent_a]?.ikonFarg || "#aaa";
                          const fB = AGENT_VISUELL[b.agent_b]?.ikonFarg || "#aaa";
                          return (
                            <Link key={bi} href={`/versus?a=${encodeURIComponent(b.agent_a)}&b=${encodeURIComponent(b.agent_b)}`}
                              style={{ textDecoration: "none", fontSize: 11, color: C.textMuted, fontFamily: "monospace",
                                background: "#0f0f0f", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px",
                                display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span style={{ color: fA }}>{b.agent_a}</span>
                              <span style={{ color: "#555" }}>↔</span>
                              <span style={{ color: fB }}>{b.agent_b}</span>
                              <span style={{ color: "#facc15", marginLeft: 4 }}>★{b.styrka}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Isolated agents */}
        {(() => {
          const allierade = new Set(koalitioner.flatMap(k => [k.agent_a, k.agent_b]));
          const isolerade = Object.keys(AGENT_VISUELL).filter(a => !allierade.has(a));
          if (isolerade.length === 0) return null;
          return (
            <div style={{ marginTop: 28 }}>
              <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
                Isolerade agenter — inga koalitioner ännu
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {isolerade.map(a => {
                  const farg = AGENT_VISUELL[a]?.ikonFarg || "#555";
                  return (
                    <Link key={a} href={`/agent/${encodeURIComponent(a)}`}
                      style={{ textDecoration: "none", fontSize: 11, color: "#555", fontFamily: "monospace",
                        background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 20, padding: "4px 12px" }}>
                      {a}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div style={{ marginTop: 32, padding: "16px 20px", background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
            Fraktioner bildas automatiskt ur agenternas faktiska beteende — ingen är hårdkodad. En allians uppstår när agenter ställer frågor till varandra, röstar likadant i AI-parlamentet eller stödjer varandras lobbyingförsök. Klusterna hittas via nätverksanalys av koalitionsstyrkor. Fraktionsnamnet härleds från den dominerande ideologiska positionen bland membermarnas starkaste ståndpunkter.
          </p>
        </div>

      </div>
    </div>
  );
}
