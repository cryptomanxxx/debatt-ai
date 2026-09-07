"use client";
import { useState } from "react";
import { AGENTER } from "../nyhetskallor/AgentOverlay";
import { ALLA_AGENTER, af, analyseraMedAgent } from "../nyhetskallor/agentAnalys";

const ORAKLET_FARG = AGENTER.Oraklet.farg;
const ANALYS_FARG = "#38bdf8";

// Samma agentvalspanel + streaming-analys som /nyhetskallor (se
// app/nyhetskallor/agentAnalys.js), bara omstylad till den här sidans
// mörkblå tema. Utan detta saknade Vetenskapliga Nyheter-fliken helt en väg
// in i "analysera → föreslå artikelämne"-flödet (✅93) — besökaren fick
// lämna /universitet och söka upp samma nyhet på /nyhetskallor för hand
// (användarrapport, sep 2026). Den färdiga analysen sparas server-side till
// nyhetsanalys (samma /api/chatt-route, typ="nyhetsanalys") och kan sedan
// föreslås som artikelämne på /nyhetsanalyser.
function AgentAnalysPanel({ expanderad, valda, onToggleAgent, analys, onKor }) {
  if (!expanderad) return null;
  const korAntal = Object.values(analys || {}).filter(a => a.status === "laddar").length;
  return (
    <div style={{ marginTop: "10px", padding: "12px", background: "#020a1a", border: "1px solid #0d2040", borderRadius: "6px" }}>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        {ALLA_AGENTER.map(agent => {
          const vald = valda.has(agent);
          const farg = af(agent, ANALYS_FARG);
          return (
            <button key={agent} onClick={() => onToggleAgent(agent)} style={{ padding: "4px 10px", borderRadius: "20px", border: `1px solid ${vald ? farg + "90" : "#0d2040"}`, background: vald ? `${farg}18` : "transparent", color: vald ? farg : "#1e4a80", fontSize: "11px", fontFamily: "Georgia, serif", cursor: "pointer" }}>
              {agent}
            </button>
          );
        })}
      </div>
      <button
        onClick={onKor}
        disabled={valda.size === 0 || korAntal > 0}
        style={{ padding: "6px 14px", background: valda.size === 0 || korAntal > 0 ? "transparent" : `${ANALYS_FARG}18`, border: `1px solid ${ANALYS_FARG}60`, color: valda.size === 0 || korAntal > 0 ? "#1e4a80" : ANALYS_FARG, borderRadius: "6px", fontSize: "12px", fontFamily: "Georgia, serif", cursor: valda.size === 0 || korAntal > 0 ? "default" : "pointer" }}
      >
        {korAntal > 0 ? "Analyserar…" : "Analysera →"}
      </button>

      {analys && Object.keys(analys).length > 0 && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(analys).map(([agent, a]) => (
            <div key={agent} style={{ padding: "10px 14px", background: "#050f24", borderLeft: `3px solid ${af(agent, ANALYS_FARG)}${a.status === "laddar" ? "60" : ""}`, borderRadius: "4px" }}>
              <div style={{ fontSize: "10px", color: af(agent, ANALYS_FARG), fontFamily: "monospace", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "4px" }}>{agent.toUpperCase()}</div>
              <p style={{ margin: 0, fontSize: "13px", color: a.status === "fel" ? "#f87171" : "#8fb8e8", lineHeight: 1.65 }}>
                {a.text}
                {a.status === "laddar" && <span style={{ display: "inline-block", width: "2px", height: "12px", background: af(agent, ANALYS_FARG), marginLeft: "2px", verticalAlign: "text-bottom", animation: "blink 0.8s step-end infinite" }} />}
              </p>
            </div>
          ))}
        </div>
      )}
      {analys && Object.values(analys).some(a => a.status === "klar") && (
        <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#1e4a80", fontFamily: "monospace" }}>
          Sparas till <a href="/nyhetsanalyser" style={{ color: ANALYS_FARG }}>/nyhetsanalyser</a> — därifrån kan analysen föreslås som artikelämne åt AI-agenterna.
        </p>
      )}
    </div>
  );
}

function KallaPill({ label, count, active, onClick, farg }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? farg + "22" : "transparent",
        border: `1px solid ${active ? farg + "88" : "#0d2040"}`,
        color: active ? farg : "#1e4a80",
        borderRadius: "999px",
        padding: "6px 14px",
        fontSize: "11px",
        fontFamily: "monospace",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.6 }}>{count}</span>
    </button>
  );
}

// Rå RSS/arXiv-poster ur nyhetsflode — samma datakälla som /nyhetskallor,
// men filtrerad till enbart arXiv-preprints och renodlade vetenskapskällor
// (se VETENSKAP_KALLOR i page.js). Skiljer sig medvetet från ForskningsListaVy
// ovanför: det här är obehandlade externa rubriker, inte AI-genererade fynd.
function VetenskapsRad({ item, onLasa }) {
  const [open, setOpen] = useState(false);
  const [forbereder, setForbereder] = useState(false);
  const [analysOppen, setAnalysOppen] = useState(false);
  const [valdaAgenter, setValdaAgenter] = useState(new Set());
  const [analys, setAnalys] = useState(null);

  function toggleAgent(agent) {
    setValdaAgenter(prev => {
      const next = new Set(prev);
      if (next.has(agent)) next.delete(agent); else next.add(agent);
      return next;
    });
  }

  function korAnalys() {
    const agenter = Array.from(valdaAgenter);
    if (!agenter.length) return;
    setAnalys(prev => ({
      ...(prev || {}),
      ...Object.fromEntries(agenter.map(a => [a, { status: "laddar", text: "" }])),
    }));
    agenter.forEach(agent => {
      analyseraMedAgent(agent, item, (patch) => {
        setAnalys(prev => ({ ...(prev || {}), [agent]: patch }));
      });
    });
  }
  const arXiv = (item.kalla || "").startsWith("arXiv");
  const farg = arXiv ? "#fb923c" : "#38bdf8";
  const datum = item.hamtad
    ? new Date(item.hamtad).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric", timeZone: "Europe/Stockholm" })
    : "";

  // Innan Oraklet läser upp: berika texten om den är för kort (importerar mer
  // via originalkällan) och översätt till svenska om den fortfarande är på
  // ett annat språk — allt server-side i /api/nyhetsflode/forbered-lasning.
  // Fail-open: misslyckas anropet läser Oraklet upp den obehandlade texten
  // istället för att inte läsa alls.
  async function handleLasa(e) {
    e.stopPropagation();
    setForbereder(true);
    let rubrik = item.rubrik;
    let beskrivning = item.beskrivning;
    try {
      const res = await fetch("/api/nyhetsflode/forbered-lasning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.ok) {
        const data = await res.json();
        rubrik = data.rubrik || rubrik;
        beskrivning = data.beskrivning || beskrivning;
      }
    } catch {
      // fail-open — läser upp originaltexten nedan
    }
    setForbereder(false);
    onLasa({ typ: "nyhet", id: item.id, titel: rubrik, url: item.url || null, text: [rubrik, beskrivning].filter(Boolean).join(". ") });
  }

  return (
    <div style={{ borderBottom: "1px solid #0d2040", padding: "12px 0" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer" }}
      >
        <div style={{ fontSize: "10px", color: "#1e4a80", fontFamily: "monospace", flexShrink: 0, width: "76px", paddingTop: "3px" }}>
          {datum}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "5px" }}>
            <span style={{ fontSize: "8px", color: farg, fontFamily: "monospace", border: `1px solid ${farg}44`, borderRadius: "3px", padding: "2px 6px" }}>
              {arXiv ? "ARXIV" : "NYHET"}
            </span>
            <span style={{ fontSize: "9px", color: "#1e4a80aa", fontFamily: "monospace" }}>{item.kalla}</span>
          </div>
          <div style={{ fontSize: "13px", color: "#8fb8e8", fontFamily: "Georgia, serif", fontWeight: 600, lineHeight: 1.4 }}>
            {item.rubrik}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            <button
              onClick={handleLasa}
              disabled={forbereder}
              style={{
                padding: "5px 12px", background: "transparent",
                border: `1px solid ${ORAKLET_FARG}50`, color: ORAKLET_FARG, borderRadius: "6px",
                fontSize: "11px", fontFamily: "Georgia, serif",
                cursor: forbereder ? "default" : "pointer", opacity: forbereder ? 0.6 : 1,
              }}
            >
              {forbereder ? "🎓 Förbereder…" : "🎓 Professor Oraklet förklarar"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setAnalysOppen(o => !o); }}
              style={{
                padding: "5px 12px", background: analysOppen ? `${ANALYS_FARG}18` : "transparent",
                border: `1px solid ${ANALYS_FARG}50`, color: ANALYS_FARG, borderRadius: "6px",
                fontSize: "11px", fontFamily: "Georgia, serif", cursor: "pointer",
              }}
              title="Låt en eller flera agenter reagera direkt — sparas i Nyhetsanalysen, kan sedan föreslås som artikelämne"
            >
              {analysOppen ? "▾" : "🔎"} Analysera i Nyhetsanalysen
            </button>
          </div>
          <AgentAnalysPanel
            expanderad={analysOppen}
            valda={valdaAgenter}
            onToggleAgent={toggleAgent}
            analys={analys}
            onKor={korAnalys}
          />
        </div>
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          style={{ background: "none", border: "1px solid #0d2040", color: "#1e4a80", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", flexShrink: 0 }}
        >
          {open ? "▲ Dölj" : "▼ Expandera"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: "10px", paddingLeft: "90px", paddingRight: "8px" }}>
          {item.beskrivning && (
            <p style={{ fontSize: "12px", color: "#2a5a8a", lineHeight: 1.7, margin: "0 0 10px" }}>
              {item.beskrivning}
            </p>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#5a9ad0", fontFamily: "monospace" }}>
              Läs originalkälla →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function VetenskapsFlodeVy({ nyheter, onLasa }) {
  const [valdKalla, setValdKalla] = useState(null);

  if (!nyheter || nyheter.length === 0) {
    return (
      <div style={{ fontSize: "11px", color: "#1e4a80", fontFamily: "monospace", padding: "16px 0" }}>
        Inga vetenskapliga nyheter hämtade ännu.
      </div>
    );
  }

  const kallaCounts = {};
  for (const n of nyheter) {
    const k = n.kalla || "Okänd källa";
    kallaCounts[k] = (kallaCounts[k] || 0) + 1;
  }
  // Sorterat efter frekvens (flest nyheter syns först) — samma princip som
  // källfiltret på /nyhetskallor, eftersom listan med ett tiotal
  // vetenskapskällor annars blir svår att skanna alfabetiskt.
  const kallor = Object.keys(kallaCounts).sort((a, b) => kallaCounts[b] - kallaCounts[a]);

  // nyheter är redan sorterad kronologiskt (hamtad.desc) från SSR-queryn —
  // filter() bevarar ordningen, så listan förblir nyast-först oavsett vald källa.
  const filtrerade = valdKalla
    ? nyheter.filter(n => (n.kalla || "Okänd källa") === valdKalla)
    : nyheter;

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        <KallaPill label="Alla källor" count={nyheter.length} active={!valdKalla} onClick={() => setValdKalla(null)} farg="#fb923c" />
        {kallor.map(k => (
          <KallaPill
            key={k}
            label={k}
            count={kallaCounts[k]}
            active={valdKalla === k}
            onClick={() => setValdKalla(k)}
            farg={k.startsWith("arXiv") ? "#fb923c" : "#38bdf8"}
          />
        ))}
      </div>

      <div>
        {filtrerade.map(n => <VetenskapsRad key={n.id} item={n} onLasa={onLasa} />)}
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}
