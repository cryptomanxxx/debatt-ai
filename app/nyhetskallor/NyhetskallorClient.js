"use client";
import { useMemo, useState } from "react";
import NyhetsTicker from "./NyhetsTicker";
import NastaHamtningRaknare from "./NastaHamtningRaknare";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
};
const LANK = "#38bdf8";
const ANNA_FARG = "#a0c8f0";

const KATEGORIER = [
  { id: "sverige", label: "Sverige" },
  { id: "politik", label: "Politik" },
  { id: "ekonomi", label: "Ekonomi" },
  { id: "samhälle", label: "Samhälle" },
  { id: "international", label: "Internationellt" },
  { id: "tech", label: "Tech" },
  { id: "ai", label: "AI" },
  { id: "klimat", label: "Klimat" },
  { id: "energi", label: "Energi" },
  { id: "krypto", label: "Krypto" },
  { id: "medicin", label: "Medicin" },
  { id: "forskning", label: "Forskning" },
  { id: "spel", label: "Spel" },
];

const ALLA_AGENTER = [
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör",
  "Jurist","Journalist","Filosof","Läkare","Psykolog","Historiker",
  "Sociolog","Kryptoanalytiker","Den hungriga","Mamman","Den sura",
  "Den trötta","Den stressade","Den lugna","Pensionären","Tonåringen",
  "Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
];

const AGENT_FARG = {
  "Nationalekonom":"#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör":"#b8862a","Jurist":"#d4945a","Journalist":"#f8fafc",
  "Filosof":"#e879f9","Läkare":"#f87171","Psykolog":"#f8fafc",
  "Historiker":"#f8fafc","Sociolog":"#34d399","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":"#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":"#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":"#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":"#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
};
function af(namn) { return AGENT_FARG[namn] || LANK; }

function tidsSedan(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just nu";
  if (min < 60) return `${min} min sedan`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  return `${d} dygn sedan`;
}

// En avbruten leverantörsström lämnar inte alltid text helt tom — samma heuristik
// som Direktdebatten använder för att upptäcka avhuggna svar (se app/chatt/page.js).
function arTroligenAvbruten(text) {
  const t = (text || "").trim();
  if (t.length < 20) return true;
  return !/[.!?…][”"')\]]*$/.test(t);
}

async function streamAgentAnalys({ agent, amne, artikelTitel, artikelSammanfattning, hoppaOverGroq, nyhetId, onToken, signal }) {
  const res = await fetch("/api/chatt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typ: "nyhetsanalys", amne, historik: [], agent, artikelTitel, artikelSammanfattning, hoppaOverGroq, nyhetId }),
    signal,
  });
  if (!res.ok || !res.body) {
    const status = res.status;
    const errBody = await res.text().catch(() => "");
    throw Object.assign(new Error(`HTTP ${status}: ${errBody.slice(0, 120)}`), { status });
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "", buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return { text, klar: true };
        try {
          const token = JSON.parse(raw).choices?.[0]?.delta?.content ?? "";
          if (token) { text += token; onToken(text); }
        } catch { /* ignore */ }
      }
    }
  } catch (e) { if (e.name !== "AbortError") throw e; }
  return { text, klar: false };
}

// Ett omförsök hoppar förbi Groq (samma resonemang som Direktdebattens retry-logik):
// en avhuggen ström beror oftast på Groqs streaming, inte på ämnet/agenten.
async function analyseraMedAgent(agent, n, uppdatera) {
  let text = null, klar = false;
  for (let forsok = 0; forsok < 2 && (!klar || arTroligenAvbruten(text)); forsok++) {
    if (forsok > 0) await new Promise(r => setTimeout(r, 400));
    try {
      const resultat = await streamAgentAnalys({
        agent, amne: n.rubrik, artikelTitel: n.rubrik, artikelSammanfattning: n.beskrivning,
        hoppaOverGroq: forsok > 0, nyhetId: n.id,
        onToken: (t) => uppdatera({ status: "laddar", text: t }),
      });
      text = resultat.text;
      klar = resultat.klar;
    } catch (e) {
      uppdatera({ status: "fel", text: e.status === 429 ? "För många analyser just nu — försök igen om en stund." : "Något gick fel." });
      return;
    }
  }
  uppdatera({ status: text ? "klar" : "fel", text: text || "Kunde inte hämta ett svar." });
}

function AgentAnalysPanel({ n, expanderad, onToggle, valda, onToggleAgent, analys, onKor }) {
  const korAntal = Object.values(analys || {}).filter(a => a.status === "laddar").length;
  return (
    <div style={{ marginTop: "8px" }}>
      <button onClick={onToggle} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "12px", fontFamily: "Georgia, serif", cursor: "pointer", padding: 0 }}>
        {expanderad ? "▾" : "▸"} Fråga AI-agenter om denna nyhet
      </button>
      {expanderad && (
        <div style={{ marginTop: "10px", padding: "12px", background: "#0a0d10", border: `1px solid ${C.border}`, borderRadius: "6px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {ALLA_AGENTER.map(agent => {
              const vald = valda.has(agent);
              return (
                <button key={agent} onClick={() => onToggleAgent(agent)} style={{ padding: "4px 10px", borderRadius: "20px", border: `1px solid ${vald ? af(agent) + "90" : C.border}`, background: vald ? `${af(agent)}18` : "transparent", color: vald ? af(agent) : C.textMuted, fontSize: "11px", fontFamily: "Georgia, serif", cursor: "pointer" }}>
                  {agent}
                </button>
              );
            })}
          </div>
          <button
            onClick={onKor}
            disabled={valda.size === 0 || korAntal > 0}
            style={{ padding: "6px 14px", background: valda.size === 0 || korAntal > 0 ? "transparent" : `${LANK}18`, border: `1px solid ${LANK}60`, color: valda.size === 0 || korAntal > 0 ? C.textMuted : LANK, borderRadius: "6px", fontSize: "12px", fontFamily: "Georgia, serif", cursor: valda.size === 0 || korAntal > 0 ? "default" : "pointer" }}
          >
            {korAntal > 0 ? "Analyserar…" : "Analysera →"}
          </button>

          {analys && Object.keys(analys).length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(analys).map(([agent, a]) => (
                <div key={agent} style={{ padding: "10px 14px", background: C.surface, borderLeft: `3px solid ${af(agent)}${a.status === "laddar" ? "60" : ""}`, borderRadius: "4px" }}>
                  <div style={{ fontSize: "10px", color: af(agent), fontFamily: "monospace", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "4px" }}>{agent.toUpperCase()}</div>
                  <p style={{ margin: 0, fontSize: "13px", color: a.status === "fel" ? "#f87171" : C.text, lineHeight: 1.65 }}>
                    {a.text}
                    {a.status === "laddar" && <span style={{ display: "inline-block", width: "2px", height: "12px", background: af(agent), marginLeft: "2px", verticalAlign: "text-bottom", animation: "blink 0.8s step-end infinite" }} />}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Besökare klistrar in en länk till en nyhetsartikel som inte täcks av de
// automatiskt bevakade källorna. Servern hämtar och extraherar titel/text
// själv (SSRF-säkert, samma logik som artikelkontexten på /chatt) — vi litar
// aldrig på klient-inskickad text för en tabell som presenteras som "vad
// plattformen faktiskt hämtat". Se app/api/nyhetsflode/importera/route.js.
function ImporteraForm({ onImporterad }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(null); // null | "laddar" | "ok" | "dubblett" | "fel"
  const [felText, setFelText] = useState("");

  async function importera(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || status === "laddar") return;
    setStatus("laddar");
    setFelText("");
    try {
      const res = await fetch("/api/nyhetsflode/importera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("fel");
        setFelText(data.fel || "Kunde inte importera artikeln.");
        return;
      }
      onImporterad(data.rad);
      setStatus(data.redanImporterad ? "dubblett" : "ok");
      setUrl("");
    } catch {
      setStatus("fel");
      setFelText("Nätverksfel — försök igen.");
    }
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px 18px", marginBottom: "24px" }}>
      <div style={{ fontSize: "11px", letterSpacing: "0.1em", fontFamily: "monospace", color: C.textMuted, marginBottom: "10px" }}>
        IMPORTERA EN NYHETSARTIKEL
      </div>
      <form onSubmit={importera} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={url}
          onChange={e => { setUrl(e.target.value); if (status && status !== "laddar") setStatus(null); }}
          placeholder="https://exempel.se/en-nyhetsartikel"
          style={{ flex: 1, minWidth: "220px", padding: "10px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "6px", color: C.text, fontSize: "13px", fontFamily: "monospace", outline: "none" }}
        />
        <button
          type="submit"
          disabled={!url.trim() || status === "laddar"}
          style={{ padding: "10px 18px", borderRadius: "6px", fontSize: "13px", fontFamily: "Georgia, serif", border: `1px solid ${LANK}50`, background: "transparent", color: !url.trim() || status === "laddar" ? C.textMuted : LANK, cursor: !url.trim() || status === "laddar" ? "default" : "pointer" }}
        >
          {status === "laddar" ? "Hämtar…" : "Importera →"}
        </button>
      </form>
      {status === "ok" && (
        <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#4ade80", fontFamily: "monospace" }}>✓ Importerad — visas överst i listan nedan.</p>
      )}
      {status === "dubblett" && (
        <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#fbbf24", fontFamily: "monospace" }}>Nyheten fanns redan i nyhetsflödet.</p>
      )}
      {status === "fel" && (
        <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#f87171", fontFamily: "monospace" }}>{felText}</p>
      )}
    </div>
  );
}

function NyhetsRad({ n, status, onForesla, analysProps }) {
  const [expanderad, setExpanderad] = useState(false);
  const kortText = (n.beskrivning || "").length > 220;
  const visadText = expanderad || !kortText ? n.beskrivning : n.beskrivning.slice(0, 220) + "…";

  return (
    <div style={{ padding: "16px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", marginBottom: "10px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "#4a7a9b", fontFamily: "monospace" }}>{n.kalla}</span>
        <span style={{ fontSize: "11px", color: "#555" }}>· {tidsSedan(n.hamtad)}</span>
        {(n.kategori || []).slice(0, 3).map(k => (
          <span key={k} style={{ fontSize: "10px", color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "1px 8px", fontFamily: "monospace" }}>{k}</span>
        ))}
      </div>
      <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: "16px", color: LANK, lineHeight: 1.4, fontFamily: "Georgia, serif", textDecoration: "none", marginBottom: n.beskrivning ? "6px" : "10px" }}>
        {n.rubrik}
      </a>
      {n.beskrivning && (
        <p style={{ margin: "0 0 4px", fontSize: "13px", color: C.textMuted, lineHeight: 1.6 }}>
          {visadText}
        </p>
      )}
      {kortText && (
        <button
          onClick={() => setExpanderad(e => !e)}
          style={{ display: "block", background: "transparent", border: "none", color: LANK, fontSize: "12px", fontFamily: "Georgia, serif", cursor: "pointer", padding: 0, marginBottom: "10px" }}
        >
          {expanderad ? "Visa mindre ↑" : "Visa mer ↓"}
        </button>
      )}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {status === "ok" ? (
          <span style={{ fontSize: "12px", color: "#4ade80", fontFamily: "monospace" }}>✓ Skickat! Agenterna tar upp det vid nästa körning.</span>
        ) : status === "fel" ? (
          <span style={{ fontSize: "12px", color: "#f87171", fontFamily: "monospace" }}>Något gick fel — försök igen.</span>
        ) : (
          <button
            onClick={onForesla}
            disabled={status === "laddar"}
            style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${LANK}50`, color: status === "laddar" ? C.textMuted : LANK, borderRadius: "6px", fontSize: "12px", fontFamily: "Georgia, serif", cursor: status === "laddar" ? "default" : "pointer" }}
          >
            {status === "laddar" ? "Skickar…" : "Föreslå för agenterna →"}
          </button>
        )}
      </div>
      <AgentAnalysPanel n={n} {...analysProps} />
    </div>
  );
}

export default function NyhetskallorClient({ nyheter: initialNyheter, pageSize = 150, order = "hamtad.desc,id.desc" }) {
  const [nyheter, setNyheter] = useState(initialNyheter);
  // Vi hämtade en full sida vid SSR → det KAN finnas fler äldre rader att
  // ladda. Om SSR-fetchen misslyckats/gett tomt vet vi inte om det beror på
  // att tabellen är tom eller ett nätverksfel — döljer hellre knappen än
  // visar den mot en trasig fetch, den kan visas igen efter en omladdning.
  const [harMer, setHarMer] = useState(initialNyheter.length >= pageSize);
  const [laddarMer, setLaddarMer] = useState(false);
  const [sok, setSok] = useState("");
  const [valdKategori, setValdKategori] = useState(null);
  const [valdKalla, setValdKalla] = useState(null);
  const [visaAllaKallor, setVisaAllaKallor] = useState(false);
  const [statusar, setStatusar] = useState({}); // { [id]: "laddar" | "ok" | "fel" }
  const [expanderade, setExpanderade] = useState(() => new Set());
  const [valdaAgenter, setValdaAgenter] = useState({}); // { [id]: Set<agent> }
  const [analyser, setAnalyser] = useState({}); // { [id]: { [agent]: { status, text } } }

  // Datumbaserad paginering (hamtad < senaste laddade tidsstämpel) istället
  // för offset — offset skulle kunna hoppa över eller dubblettvisa rader om
  // nyhetsflode_test.py skriver nya rader mellan två "Ladda fler"-klick,
  // eftersom offset räknas mot en tabell som hela tiden växer i toppen.
  //
  // Codex-fynd (PR #1319): en ren hamtad-cursor är inte entydig — Postgres
  // now() fryser till EN tidsstämpel per INSERT-sats, och nyhetsflode_test.py
  // skriver batchar på upp till 200 rader åt gången, så flera rader kan dela
  // exakt samma hamtad-värde. `hamtad=lt.<X>` exkluderar då ALLA rader med
  // det värdet, inklusive de som inte fick plats på förra sidan — de skulle
  // aldrig kunna laddas. id (bigserial, monotont) som sekundär cursor-nyckel
  // (samma NYHETSFLODE_ORDER som SSR-fetchen i page.js) gör gränsen entydig:
  // "hamtad < X, ELLER hamtad = X och id < senaste id".
  async function laddaFler() {
    if (laddarMer || !harMer || nyheter.length === 0) return;
    setLaddarMer(true);
    try {
      const sista = nyheter[nyheter.length - 1];
      const h = encodeURIComponent(sista.hamtad);
      const cursor = `or=(hamtad.lt.${h},and(hamtad.eq.${h},id.lt.${sista.id}))`;
      const url = `${SB_URL}/rest/v1/nyhetsflode?select=id,rubrik,beskrivning,kalla,url,publicerad,kategori,hamtad&order=${order}&${cursor}&limit=${pageSize}`;
      const res = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
      const fler = res.ok ? await res.json() : [];
      setNyheter(prev => [...prev, ...fler]);
      setHarMer(fler.length === pageSize);
    } catch {
      setHarMer(false);
    } finally {
      setLaddarMer(false);
    }
  }

  // Källor byggs dynamiskt ur den faktiska datan istället för en hårdkodad
  // lista — det finns ~49 RSS-flöden + 28 YouTube-kanaler, för många och för
  // rörligt (nya källor läggs till då och då) för att underhålla för hand som
  // KATEGORIER ovan. Sorterat efter frekvens så de mest aktiva källorna syns
  // först utan att behöva expandera.
  const kallor = useMemo(() => {
    const antal = {};
    for (const n of nyheter) antal[n.kalla] = (antal[n.kalla] || 0) + 1;
    return Object.entries(antal)
      .map(([kalla, antal]) => ({ kalla, antal }))
      .sort((a, b) => b.antal - a.antal || a.kalla.localeCompare(b.kalla, "sv"));
  }, [nyheter]);
  const KALLOR_STANDARD = 14;
  const synligaKallor = useMemo(() => {
    if (visaAllaKallor) return kallor;
    const topp = kallor.slice(0, KALLOR_STANDARD);
    // Håller den valda källans pill synlig även om den ligger utanför topp-14,
    // så filtret aldrig "försvinner ur sikte" bara för att listan är hopfälld.
    if (valdKalla && !topp.some(k => k.kalla === valdKalla)) {
      const vald = kallor.find(k => k.kalla === valdKalla);
      if (vald) return [...topp, vald];
    }
    return topp;
  }, [kallor, visaAllaKallor, valdKalla]);

  const filtrerade = useMemo(() => {
    const s = sok.trim().toLowerCase();
    return nyheter.filter(n => {
      if (valdKategori && !(n.kategori || []).includes(valdKategori)) return false;
      if (valdKalla && n.kalla !== valdKalla) return false;
      if (s && !(n.rubrik.toLowerCase().includes(s) || n.kalla.toLowerCase().includes(s))) return false;
      return true;
    });
  }, [nyheter, sok, valdKategori, valdKalla]);

  async function foreslaNyhet(n) {
    setStatusar(s => ({ ...s, [n.id]: "laddar" }));
    try {
      const res = await fetch("/api/nyhetsval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubrik: n.rubrik, kalla: n.kalla, url: n.url, beskrivning: n.beskrivning }),
      });
      setStatusar(s => ({ ...s, [n.id]: res.ok ? "ok" : "fel" }));
    } catch {
      setStatusar(s => ({ ...s, [n.id]: "fel" }));
    }
  }

  function nyhetImporterad(rad) {
    if (!rad) return;
    setNyheter(prev => (prev.some(n => n.id === rad.id) ? prev : [rad, ...prev]));
  }

  function toggleExpand(id) {
    setExpanderade(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAgent(id, agent) {
    setValdaAgenter(prev => {
      const current = new Set(prev[id] || []);
      if (current.has(agent)) current.delete(agent); else current.add(agent);
      return { ...prev, [id]: current };
    });
  }

  function korAnalys(n) {
    const agenter = Array.from(valdaAgenter[n.id] || []);
    if (!agenter.length) return;
    setAnalyser(prev => ({
      ...prev,
      [n.id]: { ...(prev[n.id] || {}), ...Object.fromEntries(agenter.map(a => [a, { status: "laddar", text: "" }])) },
    }));
    agenter.forEach(agent => {
      analyseraMedAgent(agent, n, (patch) => {
        setAnalyser(prev => ({ ...prev, [n.id]: { ...(prev[n.id] || {}), [agent]: patch } }));
      });
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <NyhetsTicker nyheter={nyheter} />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 20px" }}>
        <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>Transparens</p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <NastaHamtningRaknare />
              <a href="/nyhetsanalyser" style={{ padding: "6px 14px", border: `1px solid ${LANK}50`, borderRadius: "6px", color: LANK, fontSize: "12px", fontFamily: "monospace", textDecoration: "none", whiteSpace: "nowrap" }}>
                🔎 Alla analyser →
              </a>
              <a href="/nyhetskallor/statistik" style={{ padding: "6px 14px", border: `1px solid ${LANK}50`, borderRadius: "6px", color: LANK, fontSize: "12px", fontFamily: "monospace", textDecoration: "none", whiteSpace: "nowrap" }}>
                📊 Statistik →
              </a>
            </div>
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 12px", color: C.accent }}>Nyhetskällor</h1>
          <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.75, margin: "0 0 10px" }}>
            Det här är ett urval av de nyheter AI-agenterna automatiskt hämtar från runt 44 RSS- och Reddit-flöden, sex gånger om dagen — oavsett om en agent någonsin skriver om dem. Skvaller och kändisnyheter filtreras bort innan de hamnar här.
          </p>
          <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.75, margin: "0 0 10px" }}>
            Hittar du en nyhet du tycker agenterna borde debattera? Klicka <em>"Föreslå för agenterna"</em> — den tas upp med högsta prioritet vid nästa körning, precis som ämnesförslag från Direktdebatten.
          </p>
          <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.75, margin: "0 0 10px" }}>
            Eller välj en eller flera agenter under <em>"Fråga AI-agenter om denna nyhet"</em> för en analys direkt, i realtid.
          </p>
          <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
            Saknas en nyhet i flödet? Klistra in länken i formuläret nedan så hämtar vi den och lägger till den.
          </p>
        </div>

        <ImporteraForm onImporterad={nyhetImporterad} />

        <div style={{ marginBottom: "20px" }}>
          <input
            value={sok}
            onChange={e => setSok(e.target.value)}
            placeholder="Sök på rubrik eller källa…"
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "10px 14px", color: C.text, fontSize: "14px", fontFamily: "Georgia, serif", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button onClick={() => setValdKategori(null)} style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid ${!valdKategori ? LANK + "80" : C.border}`, background: !valdKategori ? `${LANK}12` : "transparent", color: !valdKategori ? LANK : C.textMuted, fontSize: "12px", fontFamily: "Georgia, serif", cursor: "pointer" }}>
              Alla
            </button>
            {KATEGORIER.map(k => (
              <button key={k.id} onClick={() => setValdKategori(k.id === valdKategori ? null : k.id)} style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid ${valdKategori === k.id ? LANK + "80" : C.border}`, background: valdKategori === k.id ? `${LANK}12` : "transparent", color: valdKategori === k.id ? LANK : C.textMuted, fontSize: "12px", fontFamily: "Georgia, serif", cursor: "pointer" }}>
                {k.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
            <button onClick={() => setValdKalla(null)} style={{ padding: "4px 11px", borderRadius: "20px", border: `1px solid ${!valdKalla ? ANNA_FARG + "80" : C.border}`, background: !valdKalla ? `${ANNA_FARG}12` : "transparent", color: !valdKalla ? ANNA_FARG : "#666", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>
              Alla källor
            </button>
            {synligaKallor.map(({ kalla, antal }) => (
              <button key={kalla} onClick={() => setValdKalla(kalla === valdKalla ? null : kalla)} style={{ padding: "4px 11px", borderRadius: "20px", border: `1px solid ${valdKalla === kalla ? ANNA_FARG + "80" : C.border}`, background: valdKalla === kalla ? `${ANNA_FARG}12` : "transparent", color: valdKalla === kalla ? ANNA_FARG : "#666", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>
                {kalla} <span style={{ opacity: 0.6 }}>{antal}</span>
              </button>
            ))}
            {kallor.length > KALLOR_STANDARD && (
              <button onClick={() => setVisaAllaKallor(v => !v)} style={{ padding: "4px 11px", borderRadius: "20px", border: `1px solid ${C.border}`, background: "transparent", color: "#666", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>
                {visaAllaKallor ? "Färre källor ↑" : `+${kallor.length - KALLOR_STANDARD} fler källor ↓`}
              </button>
            )}
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "#555", fontFamily: "monospace", margin: "0 0 16px" }}>
          {filtrerade.length} av {nyheter.length} laddade nyheter{harMer ? " — fler kan laddas nedan" : ""}
        </p>

        {filtrerade.length === 0 ? (
          <p style={{ color: C.textMuted, fontStyle: "italic" }}>Inga nyheter matchar filtret ännu.</p>
        ) : (
          filtrerade.map(n => (
            <NyhetsRad
              key={n.id}
              n={n}
              status={statusar[n.id]}
              onForesla={() => foreslaNyhet(n)}
              analysProps={{
                expanderad: expanderade.has(n.id),
                onToggle: () => toggleExpand(n.id),
                valda: valdaAgenter[n.id] || new Set(),
                onToggleAgent: (agent) => toggleAgent(n.id, agent),
                analys: analyser[n.id],
                onKor: () => korAnalys(n),
              }}
            />
          ))
        )}

        {harMer && (
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button
              onClick={laddaFler}
              disabled={laddarMer}
              style={{ padding: "10px 28px", background: "transparent", border: `1px solid ${C.border}`, color: laddarMer ? C.textMuted : C.text, borderRadius: "8px", fontSize: "12px", fontFamily: "monospace", letterSpacing: "0.08em", cursor: laddarMer ? "default" : "pointer" }}
            >
              {laddarMer ? "Laddar…" : "Ladda fler nyheter ↓"}
            </button>
          </div>
        )}
      </main>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}
