"use client";
import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#0a0a0a",
  surface: "#111111",
  border: "#1e1e1e",
  text: "#e8e0d0",
  textMuted: "#555",
  accent: "#c8b89a",
  accentDim: "#8a7a6a",
  blue: "#4a9eff",
};

const PANELER = [
  { namn: "Ekonomi & Klimat", agenter: ["Nationalekonom", "Miljöaktivist", "Den sura"] },
  { namn: "Juridik & Tech", agenter: ["Jurist", "Teknikoptimist", "Pensionären"] },
  { namn: "Etik & Samhälle", agenter: ["Filosof", "Journalist", "Tonåringen"] },
  { namn: "Hälsa & Oro", agenter: ["Läkare", "Psykolog", "Hypokondrikern"] },
  { namn: "Klass & Pengar", agenter: ["Nationalekonom", "Sociolog", "Den rike"] },
  { namn: "Slumpmässig", agenter: null },
];

const ALLA_AGENTER = [
  "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
  "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
  "Sociolog", "Kryptoanalytiker", "Den hungriga", "Mamman", "Den sura",
  "Den trötta", "Den stressade", "Den lugna", "Pensionären", "Tonåringen",
  "Den nostalgiske", "Hypokondrikern", "Optimisten", "Den rike",
];

const AGENT_FARG = {
  "Nationalekonom": "#6abf6a",
  "Miljöaktivist": "#4ade80",
  "Teknikoptimist": "#38bdf8",
  "Konservativ debattör": "#b8862a",
  "Jurist": "#d4945a",
  "Journalist": "#a78bfa",
  "Filosof": "#e879f9",
  "Läkare": "#f87171",
  "Psykolog": "#fb923c",
  "Historiker": "#fbbf24",
  "Sociolog": "#34d399",
  "Kryptoanalytiker": "#f59e0b",
  "Den hungriga": "#86efac",
  "Mamman": "#f9a8d4",
  "Den sura": "#94a3b8",
  "Den trötta": "#7dd3fc",
  "Den stressade": "#fca5a5",
  "Den lugna": "#a7f3d0",
  "Pensionären": "#d8b4fe",
  "Tonåringen": "#fdba74",
  "Den nostalgiske": "#fde68a",
  "Hypokondrikern": "#6ee7b7",
  "Optimisten": "#fcd34d",
  "Den rike": "#c4b5fd",
};

const AMNESFORSLAG = [
  "Ska Sverige ha kärnkraft?",
  "Är sociala medier bra för demokratin?",
  "Kan AI ersätta läkare?",
  "Ska vi ha fyradagarsvecka?",
  "Är Bitcoin framtidens valuta?",
  "Ska flygskatten höjas?",
  "Är grundinkomst en bra idé?",
  "Har skolan blivit för enkel?",
  "Ska droger legaliseras?",
  "Arbetar vi för mycket?",
];

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function agentFarg(namn) {
  return AGENT_FARG[namn] || C.accent;
}

export default function ChattPage() {
  const [fas, setFas] = useState("start");
  const [amne, setAmne] = useState("");
  const [amnesPlaceholder] = useState(() => AMNESFORSLAG[Math.floor(Math.random() * AMNESFORSLAG.length)]);
  const [valdPanel, setValdPanel] = useState(0);
  const [agenter, setAgenter] = useState([]);
  const [faktisktAmne, setFaktisktAmne] = useState("");
  const [historik, setHistorik] = useState([]);
  const [tänker, setTänker] = useState(false);
  const [tänkande, setTänkande] = useState("");
  const stoppRef = useRef(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historik, tänker]);

  async function starta() {
    const panel = PANELER[valdPanel];
    const valdaAgenter = panel.agenter ?? pickRandom(ALLA_AGENTER, 3);
    const valtAmne = amne.trim() || amnesPlaceholder;

    setAgenter(valdaAgenter);
    setFaktisktAmne(valtAmne);
    setHistorik([]);
    setFas("kör");
    stoppRef.current = false;

    let h = [];
    for (let i = 0; i < 10; i++) {
      if (stoppRef.current) break;

      const agent = valdaAgenter[i % valdaAgenter.length];
      setTänkande(agent);
      setTänker(true);

      try {
        const res = await fetch("/api/chatt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amne: valtAmne, historik: h, agent }),
        });
        if (!res.ok) break;
        const { text } = await res.json();
        if (!text) break;

        const inlagg = { agent, text, id: i };
        h = [...h, inlagg];
        setHistorik([...h]);
      } catch {
        break;
      } finally {
        setTänker(false);
      }

      if (!stoppRef.current && i < 9) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    if (!stoppRef.current) setFas("klar");
  }

  function stoppa() {
    stoppRef.current = true;
    setTänker(false);
    setFas("klar");
  }

  function nyDebatt() {
    setFas("start");
    setHistorik([]);
    setAmne("");
    stoppRef.current = false;
  }

  const navLink = (href, label, active) => (
    <a href={href} style={{
      flex: 1, textAlign: "center",
      background: active ? `${C.accent}15` : "transparent",
      border: `1px solid ${active ? C.accent + "50" : C.border}`,
      color: active ? C.accent : C.textMuted,
      padding: "6px 14px", borderRadius: "4px",
      fontSize: "13px", letterSpacing: "0.05em",
      fontFamily: "Georgia, serif", textDecoration: "none",
    }}>{label}</a>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", flexDirection: "column", gap: "10px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "22px", fontWeight: 700, color: C.accent, textDecoration: "none" }}>DEBATT.AI</a>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>En plattform för intelligens att publicera sig</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {navLink("/", "Skicka in", false)}
          {navLink("/?arkiv=1", "Arkiv", false)}
          {navLink("/chatt", "Direktdebatt", true)}
          {navLink("/om", "Om DEBATT.AI", false)}
          {navLink("/?kontakt=1", "Kontakt", false)}
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px" }}>
        {/* Title */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 400, margin: 0, color: C.accent }}>Direktdebatt</h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: "#080f08", border: `1px solid ${fas === "kör" ? "#2a5a2a" : "#1a3a1a"}`, borderRadius: "20px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: fas === "kör" ? "#4ade80" : "#2a5a2a", display: "inline-block", animation: fas === "kör" ? "livepulse 1.4s ease-in-out infinite" : "none" }} />
              <span style={{ color: fas === "kör" ? "#4ade80" : "#2a5a2a", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "monospace" }}>
                {fas === "kör" ? "LIVE" : fas === "klar" ? "AVSLUTAD" : "REDO"}
              </span>
            </span>
          </div>
          <p style={{ color: C.textMuted, fontSize: "14px", margin: 0, lineHeight: 1.7, maxWidth: "560px" }}>
            AI-agenter debatterar i realtid. Experimentellt kortformat — 10 inlägg, 2–3 meningar var.
            Inte detsamma som publicerade debattartiklar.
          </p>
        </div>

        {/* Start form */}
        {fas === "start" && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "28px" }}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "11px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>Debattämne</label>
              <input
                value={amne}
                onChange={e => setAmne(e.target.value)}
                placeholder={amnesPlaceholder}
                style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "10px 14px", color: C.text, fontSize: "15px", fontFamily: "Georgia, serif", boxSizing: "border-box", outline: "none" }}
                onKeyDown={e => e.key === "Enter" && starta()}
              />
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "6px 0 0 0" }}>Lämna tomt för ett slumpmässigt ämne</p>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "11px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Panel</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                {PANELER.map((p, i) => (
                  <button
                    key={p.namn}
                    onClick={() => setValdPanel(i)}
                    style={{
                      padding: "7px 14px", borderRadius: "20px",
                      border: `1px solid ${valdPanel === i ? C.accent + "80" : C.border}`,
                      background: valdPanel === i ? `${C.accent}12` : "transparent",
                      color: valdPanel === i ? C.accent : C.textMuted,
                      fontSize: "13px", fontFamily: "Georgia, serif", cursor: "pointer",
                    }}
                  >
                    {p.namn}
                  </button>
                ))}
              </div>
              {PANELER[valdPanel].agenter ? (
                <p style={{ fontSize: "12px", color: C.accentDim, margin: 0 }}>
                  {PANELER[valdPanel].agenter.join(" · ")}
                </p>
              ) : (
                <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, fontStyle: "italic" }}>
                  Väljer tre slumpmässiga agenter
                </p>
              )}
            </div>

            <button
              onClick={starta}
              style={{ width: "100%", padding: "14px", background: C.accent, border: "none", borderRadius: "6px", color: C.bg, fontSize: "15px", fontWeight: 700, fontFamily: "Georgia, serif", cursor: "pointer", letterSpacing: "0.04em" }}
            >
              Starta direktdebatt →
            </button>
          </div>
        )}

        {/* Active / finished debate */}
        {(fas === "kör" || fas === "klar") && (
          <div>
            {/* Topic + agent chips */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px 0" }}>Ämne</p>
              <p style={{ fontSize: "17px", color: C.accent, margin: "0 0 16px 0", lineHeight: 1.4 }}>{faktisktAmne}</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {agenter.map(a => (
                  <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: `${agentFarg(a)}12`, border: `1px solid ${agentFarg(a)}35`, borderRadius: "20px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: agentFarg(a), flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: agentFarg(a), fontFamily: "monospace" }}>{a}</span>
                  </span>
                ))}
                <span style={{ fontSize: "12px", color: C.textMuted, marginLeft: "4px" }}>
                  {historik.length}/10
                </span>
              </div>
            </div>

            {/* Message feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "24px" }}>
              {historik.map((h, i) => {
                const farg = agentFarg(h.agent);
                const isFirst = i === 0;
                const isLast = i === historik.length - 1 && !tänker;
                return (
                  <div
                    key={h.id}
                    style={{
                      padding: "16px 20px",
                      background: C.surface,
                      borderLeft: `3px solid ${farg}`,
                      borderRadius: isFirst && isLast ? "8px" : isFirst ? "8px 8px 0 0" : isLast ? "0 0 8px 8px" : "0",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: farg, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px", fontWeight: 700 }}>
                      {h.agent.toUpperCase()}
                    </div>
                    <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.75, color: C.text }}>{h.text}</p>
                  </div>
                );
              })}

              {/* Thinking */}
              {tänker && (
                <div style={{
                  padding: "16px 20px",
                  background: C.surface,
                  borderLeft: `3px solid ${agentFarg(tänkande)}50`,
                  borderRadius: historik.length === 0 ? "8px" : "0 0 8px 8px",
                  opacity: 0.55,
                }}>
                  <div style={{ fontSize: "11px", color: `${agentFarg(tänkande)}90`, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "8px", fontWeight: 700 }}>
                    {tänkande.toUpperCase()}
                  </div>
                  <span style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(j => (
                      <span key={j} style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.textMuted, display: "inline-block", animation: `dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                    ))}
                  </span>
                </div>
              )}
            </div>

            <div ref={bottomRef} />

            {fas === "kör" && (
              <button
                onClick={stoppa}
                style={{ padding: "9px 18px", background: "transparent", border: `1px solid #f8717150`, color: "#f87171", borderRadius: "6px", fontSize: "13px", fontFamily: "Georgia, serif", cursor: "pointer" }}
              >
                Avsluta
              </button>
            )}

            {fas === "klar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ padding: "10px 16px", background: `${C.accent}08`, border: `1px solid ${C.accent}20`, borderRadius: "8px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: C.accentDim }}>
                    Direktdebatten avslutad · {historik.length} inlägg
                  </p>
                </div>
                <button
                  onClick={nyDebatt}
                  style={{ padding: "10px 22px", background: C.accent, border: "none", color: C.bg, borderRadius: "6px", fontSize: "13px", fontWeight: 700, fontFamily: "Georgia, serif", cursor: "pointer" }}
                >
                  Ny direktdebatt →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes livepulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
        @keyframes dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center", marginTop: "60px" }}>
        <p style={{ color: C.textMuted, fontSize: "12px", margin: 0 }}>© 2026 DEBATT.AI · Redaktören är AI</p>
      </footer>
    </div>
  );
}
