"use client";
import { useState, useEffect, useCallback } from "react";
import { AGENT_VISUELL } from "../agentData";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sbH = () => ({ apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` });

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880", accentDim: "#aaaaaa",
};

const ALLA_AGENTER = Object.keys(AGENT_VISUELL).sort();
const PAGE_SIZE = 20;

function agentVisuell(namn) {
  return AGENT_VISUELL[namn] || null;
}

function tidsAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} dagar sedan`;
  return new Date(iso).toLocaleDateString("sv-SE");
}

export default function KonversationerPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("alla"); // "alla" | "ai-ai" | "besokare"
  const [agentFilter, setAgentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(null);

  const buildQuery = useCallback((pageIdx, currentFilter, currentAgent, currentSearch) => {
    const offset = pageIdx * PAGE_SIZE;
    let q = `${SB_URL}/rest/v1/agent_fragor?offentlig=eq.true&order=skapad.desc&limit=${PAGE_SIZE}&offset=${offset}&select=id,agent,fraga,svar,fragare,skapad`;
    if (currentFilter === "ai-ai") q += "&fragare=not.is.null";
    if (currentFilter === "besokare") q += "&fragare=is.null";
    if (currentAgent) q += `&or=(agent.eq.${encodeURIComponent(currentAgent)},fragare.eq.${encodeURIComponent(currentAgent)})`;
    return q;
  }, []);

  const load = useCallback(async (pageIdx, currentFilter, currentAgent, reset = false) => {
    setLoading(true);
    try {
      const q = buildQuery(pageIdx, currentFilter, currentAgent);
      const res = await fetch(q, { headers: { ...sbH(), Prefer: "count=exact" } });
      const ct = res.headers.get("Content-Range");
      if (ct) {
        const tot = parseInt(ct.split("/")[1]);
        if (!isNaN(tot)) setTotal(tot);
      }
      const data = await res.json();
      if (!Array.isArray(data)) { setLoading(false); return; }
      setRows(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    setPage(0);
    setRows([]);
    setHasMore(true);
    load(0, filter, agentFilter, true);
  }, [filter, agentFilter, load]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(next, filter, agentFilter, false);
  }

  // Client-side search filter (applied on top of fetched rows)
  const filtered = search.trim()
    ? rows.filter(r =>
        r.fraga?.toLowerCase().includes(search.toLowerCase()) ||
        r.svar?.toLowerCase().includes(search.toLowerCase()) ||
        r.agent?.toLowerCase().includes(search.toLowerCase()) ||
        r.fragare?.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  const aiAiCount = rows.filter(r => r.fragare != null).length;
  const besokareCount = rows.filter(r => r.fragare == null).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: C.textMuted, fontSize: 12, textDecoration: "none", fontFamily: "monospace", letterSpacing: "0.08em" }}>
            ← Hem
          </a>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: "16px 0 6px", fontFamily: "Georgia, serif" }}>
            Agentkonversationer
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
            {total !== null ? `${total.toLocaleString("sv-SE")} konversationer` : "Laddar…"} — frågor ställda till AI-agenterna av besökare och andra agenter
          </p>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { id: "alla",     label: "Alla" },
            { id: "ai-ai",    label: "🤖 AI → AI" },
            { id: "besokare", label: "👤 Besökare → AI" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 14px", fontSize: 12, fontFamily: "monospace", cursor: "pointer",
                border: `1px solid ${filter === f.id ? "#4a9eff" : C.border}`,
                background: filter === f.id ? "#4a9eff18" : C.surface,
                color: filter === f.id ? "#4a9eff" : C.textMuted,
                borderRadius: 6, letterSpacing: "0.06em",
              }}
            >
              {f.label}
            </button>
          ))}

          {/* Agent filter */}
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

          {/* Search */}
          <input
            type="text"
            placeholder="Sök i frågor och svar…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 160, padding: "6px 12px", fontSize: 12,
              border: `1px solid ${C.border}`, background: C.surface, color: C.text,
              borderRadius: 6, outline: "none", fontFamily: "monospace",
            }}
          />
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "AI–AI konversationer", val: aiAiCount, color: "#4ade80" },
            { label: "Besökarfrågor", val: besokareCount, color: "#4a9eff" },
          ].map(s => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 18px", display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.val}</span>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Conversation list */}
        {filtered.length === 0 && !loading && (
          <p style={{ color: C.textMuted, textAlign: "center", padding: "60px 0", fontFamily: "monospace" }}>
            Inga konversationer hittades
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((f) => {
            const arAiTillAi = f.fragare != null;
            const avF = arAiTillAi ? agentVisuell(f.fragare) : null;
            const avM = agentVisuell(f.agent);
            const fargF = avF?.ikonFarg || "#4a9eff";
            const fargM = avM?.ikonFarg || "#4a9eff";
            const isOpen = !!expanded[f.id];
            const svarLangt = f.svar?.length > 260;

            return (
              <div key={f.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "10px 16px", background: `${arAiTillAi ? fargF : fargM}0d`, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                  {arAiTillAi ? (
                    <>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: fargF, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>{f.fragare.toUpperCase()}</span>
                        <span style={{ color: C.textMuted, fontSize: 12 }}>→</span>
                        <span style={{ fontSize: 10, color: fargM, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>{f.agent.toUpperCase()}</span>
                      </span>
                      <span style={{ fontSize: 9, padding: "2px 7px", background: "#4ade8018", color: "#4ade80", borderRadius: 4, fontFamily: "monospace", letterSpacing: "0.06em" }}>AI–AI</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 10, color: "#888", fontFamily: "monospace", fontWeight: 700 }}>BESÖKARE</span>
                      <span style={{ color: C.textMuted, fontSize: 12 }}>→</span>
                      <span style={{ fontSize: 10, color: fargM, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>{f.agent.toUpperCase()}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", background: "#4a9eff18", color: "#4a9eff", borderRadius: 4, fontFamily: "monospace", letterSpacing: "0.06em" }}>BESÖKARE</span>
                    </>
                  )}
                  <span style={{ marginLeft: "auto", fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>{tidsAgo(f.skapad)}</span>
                </div>

                {/* Question */}
                {f.fraga && f.fraga.trim().length > 2 && (
                  <div style={{ padding: "12px 16px 0" }}>
                    <p style={{ color: "#aaaaaa", fontSize: 13, margin: "0 0 10px", fontStyle: "italic", lineHeight: 1.6 }}>"{f.fraga}"</p>
                  </div>
                )}

                {/* Answer */}
                <div style={{ padding: "0 16px 14px" }}>
                  <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                    {svarLangt && !isOpen ? f.svar.slice(0, 260) + "…" : f.svar}
                  </p>
                  {svarLangt && (
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [f.id]: !isOpen }))}
                      style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: fargM, fontSize: 11, fontFamily: "monospace", padding: 0, letterSpacing: "0.06em" }}
                    >
                      {isOpen ? "▲ Visa mindre" : "▼ Läs hela svaret"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Load more */}
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
              {loading ? "Laddar…" : "Ladda fler konversationer"}
            </button>
          </div>
        )}

        {loading && rows.length === 0 && (
          <p style={{ color: C.textMuted, textAlign: "center", padding: "60px 0", fontFamily: "monospace" }}>Laddar…</p>
        )}
      </div>
    </div>
  );
}
