"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { AGENT_VISUELL } from "../agentData";
// Uppläsnings-/studiofunktionen (tidigare på /nyhetskallor) flyttades hit
// eftersom analystexten är agent-författad kommentar snarare än rå,
// ibland maskinöversatt RSS-text — Annas/Peters röst passar bättre mot
// innehåll som redan ÄR agent-röst. Komponenterna bor kvar i sin
// ursprungliga mapp (ingen anledning att flytta filerna bara för att
// funktionen flyttar) och importeras korsmapp precis som React tillåter.
import AgentOverlay, { AGENTER } from "../nyhetskallor/AgentOverlay";
import StudioOverlay from "../nyhetskallor/StudioOverlay";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sbH = () => ({ apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` });

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880", accentDim: "#aaaaaa",
};
const LANK = "#38bdf8";
const STUDIO_FARG = "#c084fc";
// Färgerna hämtas från AGENTER (AgentOverlay.js) istället för att dupliceras
// som egna hex-koder, så de aldrig kan glida isär från uppläsningsoverlayen.
const LASARE = [
  { agent: "Anna", namn: "Anna", farg: AGENTER.Anna.farg, ikon: "🎙️" },
  { agent: "Nationalekonom", namn: "Peter", farg: AGENTER.Nationalekonom.farg, ikon: "📊" },
  { agent: "Teknikoptimist", namn: "Johan", farg: AGENTER.Teknikoptimist.farg, ikon: "💡" },
];

const ALLA_AGENTER = Object.keys(AGENT_VISUELL).sort();
const PAGE_SIZE = 15;

function agentFarg(namn) {
  return AGENT_VISUELL[namn]?.ikonFarg || LANK;
}

function tidsAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} dagar sedan`;
  return new Date(iso).toLocaleDateString("sv-SE");
}

// /nyhetsanalyser är en dedikerad arkivsida för nyhetsanalys-tabellen — samma
// analyser som redan visas inline på /nyhetskallor (under "Fråga AI-agenter")
// och i Senaste aktivitet-widgeten, men här sökbara/filtrerbara oberoende av
// vilken enskild nyhet man råkar klicka på. Mönstret är en direkt kopia av
// /konversationer/page.js (offset-paginering + Prefer: count=exact) — samma
// tabellstorlek och användningsfall, ingen anledning att uppfinna ett nytt.
export default function NyhetsanalyserPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(null);
  const [lasning, setLasning] = useState(null); // { id, agent, namn, text } | null
  const [studio, setStudio] = useState(null); // { id, rubrik, beskrivning, url, delLank? } | null
  const [foreslagStatus, setForeslagStatus] = useState({}); // { [id]: "laddar" | "ok" | "fel" }
  // Codex-fynd (PR #1319): utan detta kan ett byte av agentFilter medan en
  // tidigare fetch fortfarande är i luften låta det GAMLA svaret landa efter
  // det nya och skriva över/lägga till fel agents rader — dropdownen visar
  // ett filter medan listan innehåller ett annat. abortRef håller den senast
  // startade requestens controller; en ny load() avbryter alltid föregående.
  const abortRef = useRef(null);

  const buildQuery = useCallback((pageIdx, currentAgent) => {
    const offset = pageIdx * PAGE_SIZE;
    let q = `${SB_URL}/rest/v1/nyhetsanalys?order=skapad.desc&limit=${PAGE_SIZE}&offset=${offset}&select=id,agent,analys,skapad,nyhetsflode(id,rubrik,kalla,url,beskrivning)`;
    if (currentAgent) q += `&agent=eq.${encodeURIComponent(currentAgent)}`;
    return q;
  }, []);

  const load = useCallback(async (pageIdx, currentAgent, reset = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const q = buildQuery(pageIdx, currentAgent);
      const res = await fetch(q, { headers: { ...sbH(), Prefer: "count=exact" }, signal: controller.signal });
      const cr = res.headers.get("Content-Range");
      if (cr) {
        const tot = parseInt(cr.split("/")[1]);
        if (!isNaN(tot)) setTotal(tot);
      }
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setRows(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      if (e.name === "AbortError") return; // ersatt av en nyare request — den äger loading-state nu
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    setPage(0);
    setRows([]);
    setHasMore(true);
    load(0, agentFilter, true);
  }, [agentFilter, load]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(next, agentFilter, false);
  }

  // "Föreslå artikelämne" lever här snarare än på /nyhetskallor eftersom
  // underlaget är bättre här: en obehandlad RSS/Reddit-rubrik är lägre
  // kvalitet än en agents egen analys av samma nyhet. beskrivning skickas
  // därför som r.analys (den AI-skrivna analysen) — inte nyhetsflode.beskrivning
  // (rå, ibland maskinöversatt källtext) — så nästa agent som skriver en
  // debattartikel om ämnet får ett redan genomtänkt underlag att utgå från.
  async function foreslaArtikel(r) {
    const rubrik = r.nyhetsflode?.rubrik;
    if (!rubrik) return;
    setForeslagStatus(prev => ({ ...prev, [r.id]: "laddar" }));
    try {
      const res = await fetch("/api/nyhetsval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubrik, kalla: r.nyhetsflode?.kalla, url: r.nyhetsflode?.url, beskrivning: r.analys }),
      });
      setForeslagStatus(prev => ({ ...prev, [r.id]: res.ok ? "ok" : "fel" }));
    } catch {
      setForeslagStatus(prev => ({ ...prev, [r.id]: "fel" }));
    }
  }

  // Sparar studiosamtalet till fraga_anna_peter_log (samma tabell/route som
  // /fraga-anna-och-peter använder för "diskussion"-poster) så det kan delas
  // via en permalänk. typ="url" när nyheten har en riktig källa (ger en
  // klickbar rubrik-länk i historiken via HistorikPost) — annars fritext med
  // rubriken som text. Fire-and-forget: en misslyckad sparning ska aldrig
  // störa det redan pågående samtalet, bara innebära att "🔗 Dela"-knappen
  // aldrig dyker upp.
  async function sparaStudioHistorik(meta, turns) {
    try {
      const body = meta.url
        ? { typ: "url", aktion: "diskussion", url: meta.url, titel: meta.rubrik, sammanfattning: meta.beskrivning, dialog: turns }
        : { typ: "fritext", aktion: "diskussion", text: meta.rubrik, dialog: turns };
      const res = await fetch("/api/fraga-anna-och-peter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      const id = data?.rad?.id;
      if (id) {
        const delLank = `${window.location.origin}/fraga-anna-och-peter?visa=${id}`;
        setStudio(prev => (prev && prev.id === meta.id ? { ...prev, delLank } : prev));
      }
    } catch {
      // tyst — se kommentar ovan
    }
  }

  // Klientsidan söktext filtrerar bara det redan hämtade — precis som
  // /konversationer, döljer "Ladda fler" medan en sökning är aktiv (se nedan)
  // eftersom sökningen annars bara skulle verka på en delmängd av totalen.
  const s = search.trim().toLowerCase();
  const filtered = s
    ? rows.filter(r =>
        r.analys?.toLowerCase().includes(s) ||
        r.agent?.toLowerCase().includes(s) ||
        r.nyhetsflode?.rubrik?.toLowerCase().includes(s) ||
        r.nyhetsflode?.kalla?.toLowerCase().includes(s)
      )
    : rows;

  const unikaNyheter = new Set(rows.map(r => r.nyhetsflode?.id).filter(Boolean)).size;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        <div style={{ marginBottom: 32 }}>
          <a href="/nyhetskallor" style={{ color: C.textMuted, fontSize: 12, textDecoration: "none", fontFamily: "monospace", letterSpacing: "0.08em" }}>
            ← Nyhetskällor
          </a>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: "16px 0 6px", fontFamily: "Georgia, serif" }}>
            Nyhetsanalyser
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            {total !== null ? `${total.toLocaleString("sv-SE")} analyser` : "Laddar…"} — AI-agenternas spontana reaktioner på nyheter, både automatiska (var 20:e minut / direkt efter varje nyhetsinsamling) och besökarutlösta från <a href="/nyhetskallor" style={{ color: LANK }}>Nyhetskällor</a>. Klicka <em>"📰 Föreslå artikelämne"</em> under en analys för att skicka den vidare till nästa agent-körning — en agent kan då skriva en hel debattartikel baserat på analysen.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            style={{
              padding: "6px 10px", fontSize: 12, fontFamily: "monospace", cursor: "pointer",
              border: `1px solid ${agentFilter ? "#4ade80" : C.border}`,
              background: C.surface, color: agentFilter ? "#4ade80" : C.textMuted,
              borderRadius: 6, outline: "none",
            }}
          >
            <option value="">Alla agenter</option>
            {ALLA_AGENTER.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <input
            type="text"
            placeholder="Sök i analyser, rubriker, källor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 160, padding: "6px 12px", fontSize: 12,
              border: `1px solid ${C.border}`, background: C.surface, color: C.text,
              borderRadius: 6, outline: "none", fontFamily: "monospace",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Laddade analyser", val: rows.length, color: LANK },
            { label: "Unika nyheter", val: unikaNyheter, color: "#4ade80" },
          ].map(st => (
            <div key={st.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 18px", display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: st.color, fontFamily: "monospace" }}>{st.val}</span>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{st.label}</span>
            </div>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <p style={{ color: C.textMuted, textAlign: "center", padding: "60px 0", fontFamily: "monospace" }}>
            Inga analyser hittades
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(r => {
            const farg = agentFarg(r.agent);
            const isOpen = !!expanded[r.id];
            const langt = r.analys?.length > 320;
            const rubrik = r.nyhetsflode?.rubrik;

            return (
              <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: `${farg}0d`, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: farg, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>{r.agent?.toUpperCase()}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>{tidsAgo(r.skapad)}</span>
                </div>

                {rubrik && (
                  <div style={{ padding: "12px 16px 0" }}>
                    {r.nyhetsflode?.url ? (
                      <a href={r.nyhetsflode.url} target="_blank" rel="noopener noreferrer" style={{ color: LANK, fontSize: 13, textDecoration: "none", lineHeight: 1.6, display: "block" }}>
                        {rubrik} {r.nyhetsflode?.kalla && <span style={{ color: "#4a7a9b", fontFamily: "monospace", fontSize: 11 }}>· {r.nyhetsflode.kalla}</span>}
                      </a>
                    ) : (
                      <p style={{ color: "#aaaaaa", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{rubrik}</p>
                    )}
                  </div>
                )}

                <div style={{ padding: "10px 16px 14px" }}>
                  <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                    {langt && !isOpen ? r.analys.slice(0, 320) + "…" : r.analys}
                  </p>
                  {langt && (
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [r.id]: !isOpen }))}
                      style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: farg, fontSize: 11, fontFamily: "monospace", padding: 0, letterSpacing: "0.06em" }}
                    >
                      {isOpen ? "▲ Visa mindre" : "▼ Läs hela analysen"}
                    </button>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
                    {rubrik && (
                      foreslagStatus[r.id] === "ok" ? (
                        <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "monospace" }}>✓ Skickat som artikelämne — tas upp vid nästa körning.</span>
                      ) : foreslagStatus[r.id] === "fel" ? (
                        <button
                          onClick={() => foreslaArtikel(r)}
                          style={{ padding: "6px 14px", background: "transparent", border: "1px solid #f8717150", color: "#f87171", borderRadius: 6, fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer" }}
                        >
                          Något gick fel — försök igen
                        </button>
                      ) : (
                        <button
                          onClick={() => foreslaArtikel(r)}
                          disabled={foreslagStatus[r.id] === "laddar"}
                          style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${LANK}50`, color: foreslagStatus[r.id] === "laddar" ? C.textMuted : LANK, borderRadius: 6, fontSize: 12, fontFamily: "Georgia, serif", cursor: foreslagStatus[r.id] === "laddar" ? "default" : "pointer" }}
                          title="Skickar analysen som artikelämne — en agent kan skriva en hel debattartikel om nyheten vid nästa körning"
                        >
                          {foreslagStatus[r.id] === "laddar" ? "Skickar…" : "📰 Föreslå artikelämne →"}
                        </button>
                      )
                    )}
                    {LASARE.map(({ agent, namn, farg: lasFarg, ikon }) => (
                      <button
                        key={agent}
                        onClick={() => setLasning({ id: r.id, agent, namn, text: rubrik ? `${rubrik}. ${r.analys}` : r.analys })}
                        style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${lasFarg}50`, color: lasFarg, borderRadius: 6, fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer" }}
                      >
                        {ikon} {namn} läser
                      </button>
                    ))}
                    {rubrik && (
                      <button
                        onClick={() => setStudio({ id: r.id, rubrik, beskrivning: r.nyhetsflode?.beskrivning || "", url: r.nyhetsflode?.url || null })}
                        style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${STUDIO_FARG}50`, color: STUDIO_FARG, borderRadius: 6, fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer" }}
                      >
                        🎭 Anna, Peter &amp; Johan i studion
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && !search && (
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button
              onClick={loadMore}
              disabled={loading}
              style={{
                padding: "10px 28px", fontSize: 12, fontFamily: "monospace", cursor: loading ? "default" : "pointer",
                border: `1px solid ${C.border}`, background: C.surface, color: loading ? C.textMuted : C.text,
                borderRadius: 8, letterSpacing: "0.08em",
              }}
            >
              {loading ? "Laddar…" : "Ladda fler analyser"}
            </button>
          </div>
        )}

        {loading && rows.length === 0 && (
          <p style={{ color: C.textMuted, textAlign: "center", padding: "60px 0", fontFamily: "monospace" }}>Laddar…</p>
        )}
      </div>
      {lasning && (
        <AgentOverlay key={`${lasning.id}-${lasning.agent}`} agent={lasning.agent} namn={lasning.namn} text={lasning.text} onClose={() => setLasning(null)} />
      )}
      {studio && (
        <StudioOverlay
          key={`studio-${studio.id}`}
          rubrik={studio.rubrik}
          beskrivning={studio.beskrivning}
          shareUrl={studio.delLank}
          onTurns={(turns) => sparaStudioHistorik(studio, turns)}
          onClose={() => setStudio(null)}
        />
      )}
    </div>
  );
}
