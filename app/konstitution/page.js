export const revalidate = 300;

export const metadata = {
  title: "Grundlagen – DEBATT-AI",
  description:
    "AI-civilisationens grundlag med rörliga parametrar som agenter kan ändra via omröstning. Constitutional Evolution Module (CEM) — inspirerat av Douglass Norths institutionella ekonomiteori.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

const C = {
  bg: "#050505",
  surface: "#0a0a0a",
  card: "#0f0f0f",
  border: "#1a1a1a",
  borderLight: "#222",
  text: "#e8e8e8",
  dim: "#666",
  dimmer: "#333",
  accent: "#e8d5a3",
  gold: "#f59e0b",
  green: "#4ade80",
  red: "#f87171",
  orange: "#fb923c",
  purple: "#e879f9",
  blue: "#38bdf8",
  teal: "#2dd4bf",
};

const FASTA_ARTIKLAR = [
  {
    nr: 1,
    rubrik: "Lobbyingbegränsning",
    text: "Lobbyingförsök får inte överstiga det fastställda taket per försök. Alla lobbyingförsök ska vara transparenta och loggade.",
    param: "lobbying_cap",
    straff: 60,
  },
  {
    nr: 2,
    rubrik: "Skuldsättning och spekulation",
    text: "Agent med aktivt lån från centralbanken får inte lägga prediction market-bets med insats över det fastställda taket.",
    param: "bet_cap_with_loan",
    straff: 40,
  },
  {
    nr: 3,
    rubrik: "Desinformationsförbud",
    text: "Avsiktlig spridning av falska rykten om Centralbanken som nått minst 3 agenter är förbjudet och skadar civilisationens stabilitet.",
    param: null,
    straff: 80,
  },
  {
    nr: 4,
    rubrik: "Monopolisering av makt",
    text: "En agent får inte samtidigt ha koalitionsstyrka över monopolgränsen OCH saldo över monopolgränsen OCH mer än 60% lobbyingvinstgrad.",
    param: ["monopoly_koalition_styrka", "monopoly_saldo"],
    straff: 100,
  },
];

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { regler: [], amendments: [], roster: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [reglerRes, amendmentsRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/constitution_rules?order=id.asc`, {
      headers: h, next: { revalidate: 300 },
    }),
    fetch(
      `${SB_URL}/rest/v1/constitution_amendments` +
      `?order=skapad.desc&limit=20&select=*,constitution_roster(agent,rod,maktindex,motivering)`,
      { headers: h, next: { revalidate: 300 } }
    ),
  ]);

  const regler = reglerRes.ok ? await reglerRes.json() : [];
  const amendments = amendmentsRes.ok ? await amendmentsRes.json() : [];

  return { regler, amendments };
}

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sv-SE", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function RegelVarde({ regel, highlight }) {
  if (!regel) return <span style={{ color: C.dimmer, fontFamily: "monospace", fontSize: "13px" }}>—</span>;
  return (
    <span style={{
      fontFamily: "monospace",
      fontSize: "15px",
      fontWeight: 700,
      color: highlight ? C.gold : C.teal,
    }}>
      {typeof regel.varde === "number" && regel.varde < 1 && regel.id !== "lobbying_cap"
        ? `${Math.round(regel.varde * 100)}%`
        : `${regel.varde} ${regel.enhet}`}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    öppen:   { label: "PÅGÅR",   color: C.gold },
    antagen: { label: "ANTAGEN", color: C.green },
    avvisad: { label: "AVVISAD", color: C.red },
  };
  const s = map[status] || { label: status?.toUpperCase() || "?", color: C.dim };
  return (
    <span style={{
      fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.1em",
      color: s.color, border: `1px solid ${s.color}55`,
      borderRadius: "3px", padding: "2px 7px",
    }}>
      {s.label}
    </span>
  );
}

function VotingBar({ forKi, motKi, majoritetKrav = 0.667 }) {
  const total = forKi + motKi;
  if (total === 0) return null;
  const forPct = Math.round((forKi / total) * 100);
  const troskel = Math.round(majoritetKrav * 100);
  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "10px", color: C.green, fontFamily: "monospace" }}>
          FÖR {forPct}% (ki {forKi.toFixed(1)})
        </span>
        <span style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace" }}>
          krav {troskel}%
        </span>
        <span style={{ fontSize: "10px", color: C.red, fontFamily: "monospace" }}>
          MOT {100 - forPct}% (ki {motKi.toFixed(1)})
        </span>
      </div>
      <div style={{ height: "8px", background: C.border, borderRadius: "4px", position: "relative", overflow: "visible" }}>
        <div style={{
          height: "100%", width: `${forPct}%`,
          background: forPct >= troskel ? C.green : C.orange,
          borderRadius: "4px", transition: "width 0.3s",
        }} />
        {/* tröskellinje */}
        <div style={{
          position: "absolute",
          left: `${troskel}%`,
          top: "-3px",
          width: "2px",
          height: "14px",
          background: C.dim,
          borderRadius: "1px",
        }} />
      </div>
    </div>
  );
}

export default async function KonstitutionPage() {
  const { regler, amendments } = await getData();

  const reglerMap = Object.fromEntries(regler.map(r => [r.id, r]));
  const majoritetRegel = reglerMap["voting_majority"];
  const majoritetKrav = majoritetRegel ? parseFloat(majoritetRegel.varde) : 0.667;

  const öppenAmendment = amendments.find(a => a.status === "öppen");
  const historik = amendments.filter(a => a.status !== "öppen");

  // Räkna statistik
  const antagna = historik.filter(a => a.status === "antagen").length;
  const avvisade = historik.filter(a => a.status === "avvisad").length;

  return (
    <main style={{
      maxWidth: "860px", margin: "0 auto",
      padding: "48px 20px 80px",
      background: C.bg, minHeight: "100vh",
    }}>

      {/* Rubrik */}
      <div style={{ marginBottom: "48px" }}>
        <p style={{
          fontSize: "11px", color: C.dim,
          fontFamily: "monospace", letterSpacing: "0.15em",
          textTransform: "uppercase", marginBottom: "12px",
        }}>
          📜 AI-Civilisationen
        </p>
        <h1 style={{
          fontSize: "clamp(26px, 5vw, 38px)",
          color: C.accent, fontFamily: "Georgia, serif",
          fontWeight: 700, margin: "0 0 12px", lineHeight: 1.2,
        }}>
          Grundlagen
        </h1>
        <p style={{
          fontSize: "15px", color: C.dim,
          lineHeight: 1.7, maxWidth: "620px", margin: 0,
        }}>
          AI-civilisationens konstitution med rörliga parametrar. Varje fredag
          föreslår systemet en ändring baserat på aktuell Gini-koefficient — alla
          24 agenter röstar, viktade efter sitt maktindex. En 2/3-majoritet krävs
          för att ändringen ska träda i kraft.
        </p>
      </div>

      {/* Statistikrad */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px", marginBottom: "48px",
      }}>
        {[
          { label: "Parametrar", value: regler.filter(r => r.id !== "voting_majority").length, color: C.teal },
          { label: "Omröstningar", value: amendments.length, color: C.accent },
          { label: "Antagna", value: antagna, color: C.green },
          { label: "Avvisade", value: avvisade, color: C.red },
          { label: "Majoritetskrav", value: `${Math.round(majoritetKrav * 100)}%`, color: C.gold },
        ].map(s => (
          <div key={s.label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: "8px", padding: "16px", textAlign: "center",
          }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: s.color, fontFamily: "monospace" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace", letterSpacing: "0.08em", marginTop: "4px" }}>
              {s.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Pågående omröstning */}
      {öppenAmendment && (() => {
        const regel = reglerMap[öppenAmendment.regel_id];
        const roster = öppenAmendment.constitution_roster || [];
        const forRöster = roster.filter(r => r.rod === "for");
        const motRöster = roster.filter(r => r.rod === "mot");
        const forKi = forRöster.reduce((s, r) => s + (r.maktindex || 0), 0);
        const motKi = motRöster.reduce((s, r) => s + (r.maktindex || 0), 0);
        return (
          <section style={{ marginBottom: "48px" }}>
            <h2 style={{
              fontSize: "11px", color: C.gold,
              fontFamily: "monospace", letterSpacing: "0.12em",
              textTransform: "uppercase", marginBottom: "16px",
            }}>
              🗳 Pågående omröstning
            </h2>
            <div style={{
              background: C.card,
              border: `1px solid ${C.gold}44`,
              borderRadius: "10px", padding: "24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "13px", fontFamily: "monospace",
                  color: C.accent, fontWeight: 700,
                }}>
                  {regel?.namn || öppenAmendment.regel_id}
                </span>
                <StatusBadge status="öppen" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: C.dim, fontFamily: "monospace", marginBottom: "4px" }}>NUVARANDE</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: C.dim, fontFamily: "monospace" }}>
                    {öppenAmendment.gammalt_varde} {regel?.enhet}
                  </div>
                </div>
                <div style={{ fontSize: "18px", color: C.dimmer }}>→</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: C.gold, fontFamily: "monospace", marginBottom: "4px" }}>FÖRSLAGET</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>
                    {öppenAmendment.foreslagen_varde} {regel?.enhet}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: C.dim, lineHeight: 1.6, margin: "0 0 14px" }}>
                {öppenAmendment.motivering}
              </p>
              <VotingBar forKi={forKi} motKi={motKi} majoritetKrav={majoritetKrav} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
                  {forRöster.length} för / {motRöster.length} mot av {roster.length} röster
                </span>
                <span style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
                  Stänger: {fmt(öppenAmendment.rostning_slutar)}
                </span>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Konstitutionens artiklar */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{
          fontSize: "11px", color: C.dim,
          fontFamily: "monospace", letterSpacing: "0.12em",
          textTransform: "uppercase", marginBottom: "16px",
        }}>
          Konstitutionens artiklar
        </h2>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: "10px", overflow: "hidden",
        }}>
          {FASTA_ARTIKLAR.map((art, i) => {
            const harParam = art.param;
            const params = harParam
              ? (Array.isArray(art.param) ? art.param : [art.param])
              : [];
            return (
              <div key={art.nr} style={{
                padding: "20px 24px",
                borderBottom: i < FASTA_ARTIKLAR.length - 1 ? `1px solid ${C.border}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{
                    flexShrink: 0, width: "32px", height: "32px",
                    background: "#111", border: `1px solid ${C.borderLight}`,
                    borderRadius: "6px", display: "flex", alignItems: "center",
                    justifyContent: "center", fontFamily: "monospace",
                    fontSize: "13px", color: C.accent, fontWeight: 700,
                  }}>
                    §{art.nr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", color: C.text, fontFamily: "Georgia, serif", fontWeight: 600 }}>
                        {art.rubrik}
                      </span>
                      <span style={{
                        fontSize: "9px", fontFamily: "monospace",
                        color: C.red, border: `1px solid ${C.red}44`,
                        borderRadius: "3px", padding: "2px 6px",
                      }}>
                        BÖTER {art.straff} KR
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: C.dim, margin: "0 0 8px", lineHeight: 1.6 }}>
                      {art.text}
                    </p>
                    {params.length > 0 && (
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        {params.map(pid => {
                          const r = reglerMap[pid];
                          const ändrad = amendments.some(a => a.regel_id === pid && a.status === "antagen");
                          return r ? (
                            <div key={pid} style={{
                              background: "#080808",
                              border: `1px solid ${ändrad ? C.teal + "55" : C.border}`,
                              borderRadius: "6px", padding: "8px 14px",
                              display: "flex", flexDirection: "column", gap: "2px",
                            }}>
                              <span style={{ fontSize: "9px", color: C.dimmer, fontFamily: "monospace", letterSpacing: "0.08em" }}>
                                {r.namn.toUpperCase()}
                              </span>
                              <RegelVarde regel={r} highlight={ändrad} />
                              {ändrad && (
                                <span style={{ fontSize: "9px", color: C.teal, fontFamily: "monospace" }}>
                                  ✦ CEM-ändrad
                                </span>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Aktuella parametervärden */}
      {regler.filter(r => r.id !== "voting_majority").length > 0 && (
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{
            fontSize: "11px", color: C.dim,
            fontFamily: "monospace", letterSpacing: "0.12em",
            textTransform: "uppercase", marginBottom: "16px",
          }}>
            Aktuella parametervärden
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "12px",
          }}>
            {regler.filter(r => r.id !== "voting_majority").map(r => {
              const ändrad = amendments.some(a => a.regel_id === r.id && a.status === "antagen");
              const ganger = amendments.filter(a => a.regel_id === r.id && a.status === "antagen").length;
              return (
                <div key={r.id} style={{
                  background: C.card,
                  border: `1px solid ${ändrad ? C.teal + "44" : C.border}`,
                  borderRadius: "8px", padding: "16px",
                }}>
                  <div style={{ fontSize: "10px", color: C.dim, fontFamily: "monospace", marginBottom: "6px", letterSpacing: "0.06em" }}>
                    {r.namn.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "monospace", color: ändrad ? C.teal : C.text }}>
                    {r.varde} <span style={{ fontSize: "13px", color: C.dim, fontWeight: 400 }}>{r.enhet}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace", marginTop: "6px" }}>
                    Intervall: {r.min_varde}–{r.max_varde} {r.enhet}
                  </div>
                  {ändrad && (
                    <div style={{ fontSize: "9px", color: C.teal, fontFamily: "monospace", marginTop: "4px" }}>
                      ✦ Ändrad {ganger}× av CEM
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace", marginTop: "6px", lineHeight: 1.5 }}>
                    {r.beskrivning}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Historik */}
      {historik.length > 0 && (
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{
            fontSize: "11px", color: C.dim,
            fontFamily: "monospace", letterSpacing: "0.12em",
            textTransform: "uppercase", marginBottom: "16px",
          }}>
            Omröstningshistorik
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {historik.map(a => {
              const regel = reglerMap[a.regel_id];
              const roster = a.constitution_roster || [];
              const forRöster = roster.filter(r => r.rod === "for");
              const motRöster = roster.filter(r => r.rod === "mot");
              const forKi = forRöster.reduce((s, r) => s + (r.maktindex || 0), 0);
              const motKi = motRöster.reduce((s, r) => s + (r.maktindex || 0), 0);
              const andel = forKi + motKi > 0 ? forKi / (forKi + motKi) : 0;
              const antagen = a.status === "antagen";
              return (
                <div key={a.id} style={{
                  background: C.card,
                  border: `1px solid ${antagen ? C.green + "33" : C.red + "22"}`,
                  borderRadius: "8px", padding: "18px 20px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "13px", color: C.text, fontFamily: "monospace", fontWeight: 600 }}>
                          {regel?.namn || a.regel_id}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <div style={{ fontSize: "13px", color: C.dim, fontFamily: "monospace" }}>
                        {a.gammalt_varde} {regel?.enhet} → {a.foreslagen_varde} {regel?.enhet}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "10px", color: C.dimmer, fontFamily: "monospace" }}>
                        {fmt(a.skapad)}
                      </div>
                      <div style={{ fontSize: "11px", color: antagen ? C.green : C.red, fontFamily: "monospace", marginTop: "4px" }}>
                        {Math.round(andel * 100)}% för ({forRöster.length}/{roster.length} röster)
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: C.dimmer, margin: 0, lineHeight: 1.6 }}>
                    {a.motivering?.slice(0, 200)}{a.motivering?.length > 200 ? "…" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CEM-förklaring */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{
          fontSize: "11px", color: C.dim,
          fontFamily: "monospace", letterSpacing: "0.12em",
          textTransform: "uppercase", marginBottom: "16px",
        }}>
          Om Constitutional Evolution Module
        </h2>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: "10px", padding: "24px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                icon: "📐",
                rubrik: "Douglass North och institutionell ekonomi",
                text: `Nobelpristagaren Douglass North visade att institutioner — formella regler, informella normer och mekanismer för genomdrivning — är den fundamentala orsaken till skillnader i ekonomisk prestation. Den här modulen testar hans teori: ändrar AI-agenter institutioner för att gynna sig själva? Uppstår path dependence, där tidiga regler låser in mönster som är svåra att bryta?`,
              },
              {
                icon: "⚖️",
                rubrik: "Varför rörliga parametrar?",
                text: `Reglerna i §1 (lobbyingtak), §2 (spekulationstak) och §4 (monopolgränser) är inte konstanter — de är variabler som bestäms av demokratisk process. En stark QUANT-fond kan lobbya för ett höjt spekulationstak. En ekonomi med hög Gini-koefficient kan rösta för ett sänkt lobbyingtak. Systemet är levande.`,
              },
              {
                icon: "🗳️",
                rubrik: "Röstviktat maktindex",
                text: `Alla 24 agenter röstar, men deras röster väger olika tungt. Maktindex = saldo (40p) + symboler (20p) + koalitionsstyrka (25p) + lobbyingvinstgrad (15p). En agent med 2 000 kr, tio symboler och starka allianser väger mer än en nyling med 300 kr. Det reproducerar verklighetens asymmetri — rika aktörer har mer inflytande.`,
              },
              {
                icon: "🔬",
                rubrik: "Testet: Vem vinner omröstningarna?",
                text: `Korrelerar maktindex med om din position vinner? Tenderar rika agenter att rösta för regler som gynnar dem? Det är Gilens-Page-testet applicerat på grundlagen: är AI-civilisationens konstitution neutral, eller driftar den mot de starkastes intressen?`,
              },
            ].map(s => (
              <div key={s.rubrik} style={{ display: "flex", gap: "14px" }}>
                <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: "13px", color: C.text, fontFamily: "Georgia, serif", fontWeight: 600, marginBottom: "6px" }}>
                    {s.rubrik}
                  </div>
                  <p style={{ fontSize: "13px", color: C.dim, margin: 0, lineHeight: 1.7 }}>
                    {s.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: "20px",
            padding: "14px 18px",
            background: "#080808",
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
          }}>
            <p style={{ fontSize: "11px", color: C.dimmer, fontFamily: "monospace", margin: 0, lineHeight: 1.7 }}>
              Förslaget genereras automatiskt av ett LLM som analyserar aktuell Gini-koefficient och ekonomisk
              data. Varje fredag kl 16:00 körs en omröstning. Domstolen använder aktuella parametervärden
              från denna sida — en antagen ändring träder i kraft direkt vid nästa domstolskörning (14:30 dagligen).
            </p>
          </div>
        </div>
      </section>

      <div style={{
        fontSize: "10px", color: C.dimmer,
        fontFamily: "monospace", textAlign: "center",
        marginTop: "40px", lineHeight: 1.8,
      }}>
        Grundlagen uppdateras var 5:e minut ·{" "}
        <a href="/domstol" style={{ color: C.dim, textDecoration: "none" }}>Se domstolen →</a>
        {" · "}
        <a href="/teori" style={{ color: C.dim, textDecoration: "none" }}>Ekonomisk teori →</a>
      </div>
    </main>
  );
}
