"use client";
import { useState, useEffect, useCallback } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", red: "#f87171", yellow: "#fbbf24",
};

const inp = {
  background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px",
  color: C.text, fontFamily: "Georgia, serif", fontSize: "14px",
  padding: "10px 12px", width: "100%", boxSizing: "border-box", outline: "none",
};

function sbHeaders() {
  return {
    "apikey": SB_KEY,
    "Authorization": `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
  };
}

async function fetchInlamningar() {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?select=*&order=skapad.desc`, {
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function fetchArtiklar() {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=*&order=skapad.desc`, {
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function updateStatus(id, status) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function deleteInlamning(id) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function deleteArtikelById(id) {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function fetchKommentarer() {
  const res = await fetch(`${SB_URL}/rest/v1/kommentarer?select=*&order=skapad.desc`, {
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function deleteKommentar(id) {
  const res = await fetch(`${SB_URL}/rest/v1/kommentarer?id=eq.${id}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function updateArtikel(id, changes) {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function publishToArtiklar(row) {
  const check = await fetch(`${SB_URL}/rest/v1/artiklar?rubrik=eq.${encodeURIComponent(row.rubrik)}&select=id`, {
    headers: sbHeaders(),
  });
  const existing = await check.json();
  if (existing.length > 0) throw new Error("Artikeln finns redan publicerad i arkivet.");
  const res = await fetch(`${SB_URL}/rest/v1/artiklar`, {
    method: "POST",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({
      rubrik: row.rubrik, forfattare: row.forfattare, artikel: row.artikel,
      kategori: row.kategori, motivering: row.motivering,
      arg: row.arg, ori: row.ori, rel: row.rel, tro: row.tro,
      kalla: row.kalla || "manniska",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

function StatusBadge({ status }) {
  const cfg = {
    inkorg:     { label: "INKORG",     color: C.yellow, bg: "#1a1200" },
    publicerad: { label: "PUBLICERAD", color: C.green,  bg: "#052011" },
    avvisad:    { label: "AVVISAD",    color: C.red,    bg: "#200505" },
  }[status] || { label: status?.toUpperCase(), color: C.textMuted, bg: "#111" };
  return (
    <span style={{ fontSize:"11px", fontWeight:700, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}40`, borderRadius:"4px", padding:"3px 8px", fontFamily:"monospace", letterSpacing:"0.08em" }}>
      {cfg.label}
    </span>
  );
}

function ScoreBar({ label, value }) {
  if (!value) return null;
  const color = value >= 8 ? C.green : value >= 6 ? C.yellow : C.red;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"4px" }}>
      <span style={{ color:C.textMuted }}>{label}</span>
      <span style={{ color, fontFamily:"monospace", fontWeight:700 }}>{value}/10</span>
    </div>
  );
}

function pct(a, b) {
  if (!b) return "–";
  return (a / b * 100).toFixed(1) + "%";
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
      <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px", fontFamily: "monospace" }}>{label}</p>
      <p style={{ fontSize: "36px", fontWeight: 400, color: color || C.accent, margin: "0 0 4px", fontFamily: "monospace" }}>{value}</p>
      {sub && <p style={{ color: C.textMuted, fontSize: "13px", margin: 0 }}>{sub}</p>}
    </div>
  );
}

function MatningTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
      const [evAll, ev7, forslag, artiklar] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/debatt_events?select=event_type,amne,skapad&order=skapad.desc&limit=2000`, { headers: h }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/debatt_events?select=event_type,amne&skapad=gte.${since7}`, { headers: h }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/amnesforslag?select=skapad`, { headers: h }).then(r => r.json()),
        fetch(`${SB_URL}/rest/v1/artiklar?select=lasningar,rubrik,taggar,kalla&order=lasningar.desc.nullslast&limit=10`, { headers: h }).then(r => r.json()),
      ]);
      const countType = (arr, type) => arr.filter(e => e.event_type === type).length;
      const topAmnen = Object.entries(
        evAll.filter(e => e.event_type === "start" && e.amne)
          .reduce((acc, e) => { acc[e.amne] = (acc[e.amne] || 0) + 1; return acc; }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 5);
      setData({
        allStart: countType(evAll, "start"), allKlar: countType(evAll, "klar"),
        weekStart: countType(ev7, "start"), weekKlar: countType(ev7, "klar"),
        forslagTotal: Array.isArray(forslag) ? forslag.length : 0,
        topAmnen, artiklar: Array.isArray(artiklar) ? artiklar : [],
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p style={{ color: C.textMuted }}>Laddar…</p>;
  if (!data) return <p style={{ color: C.red }}>Kunde inte ladda data.</p>;

  const { allStart, allKlar, weekStart, weekKlar, forslagTotal, topAmnen, artiklar } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <p style={{ color: C.textMuted, fontSize: "13px", margin: 0 }}>Senaste 7 dagarna visas i parentes.</p>

      {/* De 3 nyckeltalen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <MetricCard
          label="Debatter startade"
          value={allStart}
          sub={`${weekStart} senaste 7 dagarna`}
        />
        <MetricCard
          label="Completion rate"
          value={pct(allKlar, allStart)}
          sub={`${allKlar} av ${allStart} fullföljda · ${pct(weekKlar, weekStart)} denna vecka`}
          color={allStart && allKlar / allStart > 0.5 ? C.green : C.yellow}
        />
        <MetricCard
          label="Send-to-agents rate"
          value={pct(forslagTotal, allKlar)}
          sub={`${forslagTotal} förslag av ${allKlar} avslutade debatter`}
          color={allKlar && forslagTotal / allKlar > 0.15 ? C.green : C.yellow}
        />
      </div>

      {/* Populäraste ämnen */}
      {topAmnen.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>Populäraste debattämnen (totalt)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topAmnen.map(([amne, count], i) => (
              <div key={amne} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: C.textMuted, fontSize: "11px", fontFamily: "monospace", width: "16px" }}>{i + 1}</span>
                <div style={{ flex: 1, background: C.border, borderRadius: "4px", height: "6px" }}>
                  <div style={{ width: `${(count / topAmnen[0][1]) * 100}%`, background: C.accent, height: "6px", borderRadius: "4px" }} />
                </div>
                <span style={{ color: C.text, fontSize: "13px", flex: 3 }}>{amne}</span>
                <span style={{ color: C.textMuted, fontSize: "12px", fontFamily: "monospace" }}>{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mest lästa artiklar */}
      {artiklar.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "24px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", fontFamily: "monospace" }}>Mest lästa artiklar</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {artiklar.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: C.textMuted, fontSize: "11px", fontFamily: "monospace", width: "16px" }}>{i + 1}</span>
                <span style={{ color: a.kalla === "ai" ? "#4a9eff" : C.accent, fontSize: "10px", fontFamily: "monospace", width: "60px" }}>{a.kalla === "ai" ? "AI" : "MÄNNISKA"}</span>
                <span style={{ color: C.text, fontSize: "13px", flex: 1 }}>{a.rubrik}</span>
                <span style={{ color: C.textMuted, fontSize: "12px", fontFamily: "monospace" }}>{a.lasningar ?? 0} läsn.</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminClient() {
  const [authed, setAuthed]       = useState(false);
  const [pw, setPw]               = useState("");
  const [pwError, setPwError]     = useState("");
  const [mainTab, setMainTab]     = useState("inlamningar");
  const [subCount, setSubCount]   = useState(null);
  const [digestMsg, setDigestMsg] = useState("");
  const [digestLoading, setDigestLoading] = useState(false);

  // Inlamningar state
  const [inlamningar, setInlamningar] = useState([]);
  const [loadingInl, setLoadingInl]   = useState(false);
  const [filter, setFilter]           = useState("alla");
  const [expanded, setExpanded]       = useState(null);

  // Artiklar state
  const [artiklar, setArtiklar]       = useState([]);
  const [loadingArt, setLoadingArt]   = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [editData, setEditData]       = useState({});

  // Kommentarer state
  const [kommentarer, setKommentarer] = useState([]);
  const [loadingKomm, setLoadingKomm] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError]               = useState("");

  function login() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      loadInlamningar();
      loadSubCount();
    } else {
      setPwError("Fel lösenord.");
    }
  }

  const loadInlamningar = useCallback(async (silent = false) => {
    if (!silent) setLoadingInl(true);
    setError("");
    try {
      const data = await fetchInlamningar();
      setInlamningar(prev => {
        const prevKey = prev.map(a => `${a.id}:${a.status}`).join(",");
        const newKey  = data.map(a => `${a.id}:${a.status}`).join(",");
        return prevKey === newKey ? prev : data;
      });
    } catch (e) {
      if (!silent) setError("Kunde inte hämta inlämningar: " + e.message);
    }
    if (!silent) setLoadingInl(false);
  }, []);

  const loadArtiklar = useCallback(async (silent = false) => {
    if (!silent) setLoadingArt(true);
    setError("");
    try {
      const data = await fetchArtiklar();
      setArtiklar(prev => {
        const prevKey = prev.map(a => `${a.id}`).join(",");
        const newKey  = data.map(a => `${a.id}`).join(",");
        return prevKey === newKey ? prev : data;
      });
    } catch (e) {
      if (!silent) setError("Kunde inte hämta artiklar: " + e.message);
    }
    if (!silent) setLoadingArt(false);
  }, []);

  const loadKommentarer = useCallback(async (silent = false) => {
    if (!silent) setLoadingKomm(true);
    try {
      const data = await fetchKommentarer();
      setKommentarer(prev => {
        const prevKey = prev.map(c => c.id).join(",");
        const newKey  = data.map(c => c.id).join(",");
        return prevKey === newKey ? prev : data;
      });
    } catch (e) {
      if (!silent) setError("Kunde inte hämta kommentarer: " + e.message);
    }
    if (!silent) setLoadingKomm(false);
  }, []);

  async function handleDeleteKommentar(id, namn) {
    if (!confirm(`Ta bort kommentar av ${namn}?`)) return;
    setActionLoading(id);
    try {
      await deleteKommentar(id);
      setKommentarer(prev => prev.filter(c => c.id !== id));
    } catch (e) { setError("Fel vid borttagning: " + e.message); }
    setActionLoading(null);
  }

  async function loadSubCount() {
    try {
      const res = await fetch(`${SB_URL}/rest/v1/prenumeranter?aktiv=eq.true&select=id`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      });
      const data = await res.json();
      setSubCount(Array.isArray(data) ? data.length : 0);
    } catch {}
  }

  async function sendDigest() {
    setDigestLoading(true); setDigestMsg("");
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_ADMIN_PASSWORD }),
      });
      const data = await res.json();
      setDigestMsg(data.meddelande || data.fel || "Klart.");
    } catch { setDigestMsg("Något gick fel."); }
    setDigestLoading(false);
  }

  // Poll silently — only re-renders if data actually changed (no blink)
  useEffect(() => {
    if (!authed) return;
    const iv = setInterval(() => {
      if (mainTab === "inlamningar") loadInlamningar(true);
      else if (mainTab === "artiklar") loadArtiklar(true);
      else if (mainTab === "kommentarer") loadKommentarer(true);
    }, 30000);
    return () => clearInterval(iv);
  }, [authed, mainTab, loadInlamningar, loadArtiklar, loadKommentarer]);

  useEffect(() => {
    if (!authed) return;
    if (mainTab === "artiklar"    && artiklar.length    === 0) loadArtiklar();
    if (mainTab === "kommentarer" && kommentarer.length === 0) loadKommentarer();
  }, [mainTab, authed]);

  async function handlePublish(row) {
    setActionLoading(row.id);
    try {
      await publishToArtiklar(row);
      await updateStatus(row.id, "publicerad");
      setInlamningar(prev => prev.map(a => a.id === row.id ? {...a, status:"publicerad"} : a));
    } catch (e) { setError("Fel vid publicering: " + e.message); }
    setActionLoading(null);
  }

  async function handleAvvisa(id) {
    setActionLoading(id);
    try {
      await updateStatus(id, "avvisad");
      setInlamningar(prev => prev.map(a => a.id === id ? {...a, status:"avvisad"} : a));
    } catch (e) { setError("Fel: " + e.message); }
    setActionLoading(null);
  }

  async function handleDeleteInlamning(id) {
    if (!confirm("Ta bort inlämningen?")) return;
    setActionLoading(id);
    try {
      await deleteInlamning(id);
      setInlamningar(prev => prev.filter(a => a.id !== id));
    } catch (e) { setError("Fel vid borttagning: " + e.message); }
    setActionLoading(null);
  }

  async function handleDeleteArtikel(id, rubrik) {
    if (!confirm(`Ta bort "${rubrik}" från sajten?`)) return;
    setActionLoading(id);
    try {
      await deleteArtikelById(id);
      setArtiklar(prev => prev.filter(a => a.id !== id));
    } catch (e) { setError("Fel vid borttagning: " + e.message); }
    setActionLoading(null);
  }

  function startEdit(a) {
    setEditingId(a.id);
    setEditData({ rubrik: a.rubrik, forfattare: a.forfattare, artikel: a.artikel });
  }

  async function saveEdit(id) {
    setActionLoading(id);
    try {
      await updateArtikel(id, editData);
      setArtiklar(prev => prev.map(a => a.id === id ? {...a, ...editData} : a));
      setEditingId(null);
    } catch (e) { setError("Fel vid sparning: " + e.message); }
    setActionLoading(null);
  }

  const filteredInl = inlamningar.filter(a =>
    filter === "alla" ? true : a.status === filter
  );
  const counts = {
    alla: inlamningar.length,
    inkorg: inlamningar.filter(a => a.status === "inkorg").length,
    publicerad: inlamningar.filter(a => a.status === "publicerad").length,
    avvisad: inlamningar.filter(a => a.status === "avvisad").length,
  };

  if (!authed) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia, serif" }}>
        <div style={{ width:"320px", padding:"40px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px" }}>
          <h1 style={{ fontSize:"22px", fontWeight:400, color:C.accent, margin:"0 0 6px 0", fontFamily:"Times New Roman, serif" }}>DEBATT.AI</h1>
          <p style={{ color:C.textMuted, fontSize:"13px", margin:"0 0 28px 0", letterSpacing:"0.1em", textTransform:"uppercase" }}>Admin</p>
          <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Lösenord</label>
          <input
            type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ ...inp, marginBottom:"12px" }}
            autoFocus
          />
          {pwError && <p style={{ color:C.red, fontSize:"13px", margin:"0 0 12px 0" }}>{pwError}</p>}
          <button onClick={login} style={{ background:C.accent, color:"#0a0a0a", border:"none", borderRadius:"4px", padding:"13px", width:"100%", fontSize:"14px", fontWeight:700, cursor:"pointer", fontFamily:"Georgia, serif" }}>
            Logga in →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"Georgia, serif" }}>
      <header style={{ borderBottom:`1px solid ${C.border}`, padding:"0 24px", height:"64px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:`${C.bg}f0`, backdropFilter:"blur(12px)", zIndex:100 }}>
        <div>
          <span style={{ fontFamily:"Times New Roman, serif", fontSize:"20px", fontWeight:700, color:C.accent }}>DEBATT.AI</span>
          <span style={{ fontSize:"11px", color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", marginLeft:"12px" }}>Admin</span>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <a href="/" style={{ fontSize:"13px", color:C.textMuted, textDecoration:"none", padding:"6px 14px", border:`1px solid ${C.border}`, borderRadius:"4px" }}>← Sajten</a>
          <button onClick={() => mainTab === "inlamningar" ? loadInlamningar() : loadArtiklar()} style={{ fontSize:"13px", color:C.accent, background:"transparent", border:`1px solid ${C.accentDim}`, borderRadius:"4px", padding:"6px 14px", cursor:"pointer", fontFamily:"Georgia, serif" }}>↻ Uppdatera</button>
        </div>
      </header>

      <main style={{ maxWidth:"900px", margin:"0 auto", padding:"32px 20px" }}>
        {error && <p style={{ color:C.red, fontSize:"14px", marginBottom:"16px" }}>{error}</p>}

        {/* Main tabs */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"32px", flexWrap:"wrap" }}>
          {[
            ["inlamningar","Inlämningar"],
            ["artiklar","Publicerade artiklar"],
            ["kommentarer", `Kommentarer${kommentarer.length > 0 ? ` (${kommentarer.length})` : ""}`],
            ["nyhetsbrev","Nyhetsbrev" + (subCount !== null ? ` (${subCount})` : "")],
            ["matning","Mätning"],
          ].map(([val,lbl]) => (
            <button key={val} onClick={() => setMainTab(val)} style={{ background:mainTab===val?`${C.accent}15`:"transparent", border:`1px solid ${mainTab===val?C.accentDim:C.border}`, color:mainTab===val?C.accent:C.textMuted, padding:"8px 20px", borderRadius:"4px", cursor:"pointer", fontSize:"14px", fontFamily:"Georgia, serif" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── INLÄMNINGAR ── */}
        {mainTab === "inlamningar" && (
          <>
            <div style={{ display:"flex", gap:"8px", marginBottom:"28px", flexWrap:"wrap" }}>
              {[["alla","Alla"],["inkorg","Inkorg"],["publicerad","Publicerade"],["avvisad","Avvisade"]].map(([val,lbl]) => (
                <button key={val} onClick={() => setFilter(val)} style={{ background:filter===val?`${C.accent}15`:"transparent", border:`1px solid ${filter===val?C.accentDim:C.border}`, color:filter===val?C.accent:C.textMuted, padding:"6px 14px", borderRadius:"4px", cursor:"pointer", fontSize:"13px", fontFamily:"Georgia, serif" }}>
                  {lbl} ({counts[val]})
                </button>
              ))}
            </div>

            {loadingInl ? <p style={{ color:C.textMuted }}>Laddar…</p>
              : filteredInl.length === 0 ? <p style={{ color:C.textMuted }}>Inga inlämningar.</p>
              : filteredInl.map(a => (
              <div key={a.id} style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px", marginBottom:"24px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px", gap:"12px", flexWrap:"wrap" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px", flexWrap:"wrap" }}>
                      <StatusBadge status={a.status} />
                      {a.kategori && <span style={{ fontSize:"11px", color:C.accentDim, background:`${C.accent}10`, border:`1px solid ${C.accent}20`, borderRadius:"20px", padding:"2px 10px" }}>{a.kategori}</span>}
                      <span style={{ fontSize:"12px", color:C.textMuted }}>{a.skapad ? new Date(a.skapad).toLocaleDateString("sv-SE", {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}</span>
                    </div>
                    <h2 style={{ fontSize:"18px", fontWeight:400, margin:"0 0 4px 0", color:C.accent, lineHeight:1.3 }}>{a.rubrik}</h2>
                    <p style={{ color:C.textMuted, fontSize:"13px", margin:0, fontStyle:"italic" }}>{a.forfattare}</p>
                  </div>
                  <div style={{ minWidth:"150px" }}>
                    <ScoreBar label="Argumentation" value={a.arg} />
                    <ScoreBar label="Originalitet"  value={a.ori} />
                    <ScoreBar label="Relevans"       value={a.rel} />
                    <ScoreBar label="Trovärdighet"   value={a.tro} />
                  </div>
                </div>

                {a.motivering && (
                  <p style={{ color:C.textMuted, fontSize:"13px", fontStyle:"italic", margin:"0 0 12px 0", borderLeft:`3px solid ${C.accentDim}`, paddingLeft:"12px" }}>"{a.motivering}"</p>
                )}

                <button onClick={() => setExpanded(expanded===a.id?null:a.id)} style={{ background:"none", border:"none", color:C.accentDim, cursor:"pointer", fontSize:"13px", padding:0, fontFamily:"Georgia, serif", marginBottom:"12px" }}>
                  {expanded===a.id ? "▲ Dölj text" : "▼ Visa artikeltext"}
                </button>

                {expanded===a.id && (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"6px", padding:"16px", marginBottom:"12px", maxHeight:"280px", overflowY:"auto" }}>
                    {(a.artikel||"").split("\n\n").filter(Boolean).map((p,i) => (
                      <p key={i} style={{ fontSize:"14px", lineHeight:1.8, color:C.text, margin:"0 0 14px 0" }}>{p}</p>
                    ))}
                  </div>
                )}

                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {a.status === "inkorg" && (
                    <>
                      <button onClick={() => handlePublish(a)} disabled={actionLoading===a.id} style={{ background:C.green, color:"#050f08", border:"none", borderRadius:"4px", padding:"8px 16px", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Georgia, serif" }}>
                        {actionLoading===a.id ? "…" : "✓ Publicera"}
                      </button>
                      <button onClick={() => handleAvvisa(a.id)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.red, border:`1px solid ${C.red}40`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                        {actionLoading===a.id ? "…" : "✗ Avvisa"}
                      </button>
                    </>
                  )}
                  {a.status === "avvisad" && (
                    <button onClick={() => handlePublish(a)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.green, border:`1px solid ${C.green}40`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                      {actionLoading===a.id ? "…" : "↑ Publicera ändå"}
                    </button>
                  )}
                  <button onClick={() => handleDeleteInlamning(a.id)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif", marginLeft:"auto" }}>
                    {actionLoading===a.id ? "…" : "🗑 Ta bort"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── PUBLICERADE ARTIKLAR ── */}
        {mainTab === "artiklar" && (
          <>
            <p style={{ color:C.textMuted, fontSize:"14px", margin:"0 0 24px 0" }}>{artiklar.length} publicerade artiklar. Redigering och borttagning sker direkt i databasen.</p>

            {loadingArt ? <p style={{ color:C.textMuted }}>Laddar…</p>
              : artiklar.length === 0 ? <p style={{ color:C.textMuted }}>Inga publicerade artiklar.</p>
              : artiklar.map(a => (
              <div key={a.id} style={{ borderTop:`1px solid ${C.border}`, paddingTop:"24px", marginBottom:"24px" }}>
                {editingId === a.id ? (
                  /* ── Edit form ── */
                  <div>
                    <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 16px 0" }}>Redigerar artikel #{a.id}</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                      <div>
                        <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Rubrik</label>
                        <input value={editData.rubrik} onChange={e => setEditData(d => ({...d, rubrik:e.target.value}))} style={inp} />
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Författare</label>
                        <input value={editData.forfattare} onChange={e => setEditData(d => ({...d, forfattare:e.target.value}))} style={inp} />
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Artikeltext</label>
                        <textarea value={editData.artikel} onChange={e => setEditData(d => ({...d, artikel:e.target.value}))} rows={12} style={{...inp, resize:"vertical", lineHeight:1.8}} />
                      </div>
                      <div style={{ display:"flex", gap:"8px" }}>
                        <button onClick={() => saveEdit(a.id)} disabled={actionLoading===a.id} style={{ background:C.green, color:"#050f08", border:"none", borderRadius:"4px", padding:"10px 20px", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Georgia, serif" }}>
                          {actionLoading===a.id ? "Sparar…" : "✓ Spara"}
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"10px 20px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                          Avbryt
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Article view ── */
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px", gap:"12px", flexWrap:"wrap" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px", flexWrap:"wrap" }}>
                          {a.kalla === "ai" && <span style={{ fontSize:"11px", color:"#4a9eff", background:"#050a1a", border:"1px solid #4a9eff40", borderRadius:"20px", padding:"2px 10px", fontFamily:"monospace", fontWeight:700 }}>AI</span>}
                          {a.kalla === "manniska" && <span style={{ fontSize:"11px", color:C.accent, background:"#0a0a05", border:`1px solid ${C.accent}40`, borderRadius:"20px", padding:"2px 10px", fontFamily:"monospace", fontWeight:700 }}>MÄNNISKA</span>}
                          {a.kategori && <span style={{ fontSize:"11px", color:C.accentDim, background:`${C.accent}10`, border:`1px solid ${C.accent}20`, borderRadius:"20px", padding:"2px 10px" }}>{a.kategori}</span>}
                          <span style={{ fontSize:"12px", color:C.textMuted }}>{a.skapad ? new Date(a.skapad).toLocaleDateString("sv-SE", {year:"numeric",month:"short",day:"numeric"}) : ""}</span>
                        </div>
                        <h2 style={{ fontSize:"18px", fontWeight:400, margin:"0 0 4px 0", color:C.accent, lineHeight:1.3 }}>{a.rubrik}</h2>
                        <p style={{ color:C.textMuted, fontSize:"13px", margin:"0 0 4px 0", fontStyle:"italic" }}>{a.forfattare}</p>
                        {(a.taggar||[]).length > 0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", marginTop:"6px" }}>
                            {(a.taggar||[]).map(t => <span key={t} style={{ fontSize:"11px", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"20px", padding:"1px 8px" }}>#{t}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth:"150px" }}>
                        <ScoreBar label="Arg" value={a.arg} />
                        <ScoreBar label="Ori" value={a.ori} />
                        <ScoreBar label="Rel" value={a.rel} />
                        <ScoreBar label="Tro" value={a.tro} />
                      </div>
                    </div>

                    <p style={{ color:C.textMuted, fontSize:"14px", lineHeight:1.7, margin:"0 0 14px 0" }}>{(a.artikel||"").slice(0,200)}…</p>

                    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                      <a href={`/artikel/${a.id}`} target="_blank" rel="noreferrer" style={{ fontSize:"13px", color:C.accentDim, textDecoration:"none", padding:"8px 16px", border:`1px solid ${C.border}`, borderRadius:"4px" }}>
                        ↗ Visa
                      </a>
                      <button onClick={() => startEdit(a)} style={{ background:`${C.accent}15`, color:C.accent, border:`1px solid ${C.accentDim}`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                        ✎ Redigera
                      </button>
                      <button onClick={() => handleDeleteArtikel(a.id, a.rubrik)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.red, border:`1px solid ${C.red}30`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif", marginLeft:"auto" }}>
                        {actionLoading===a.id ? "…" : "🗑 Ta bort"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── KOMMENTARER ── */}
        {mainTab === "kommentarer" && (
          <>
            <p style={{ color:C.textMuted, fontSize:"14px", margin:"0 0 24px 0" }}>{kommentarer.length} kommentarer.</p>
            {loadingKomm ? <p style={{ color:C.textMuted }}>Laddar…</p>
              : kommentarer.length === 0 ? <p style={{ color:C.textMuted }}>Inga kommentarer ännu.</p>
              : kommentarer.map(c => (
              <div key={c.id} style={{ borderTop:`1px solid ${C.border}`, paddingTop:"20px", marginBottom:"20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px", flexWrap:"wrap", marginBottom:"10px" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"14px", color:C.accent, fontWeight:600 }}>{c.namn}</span>
                      <span style={{ fontSize:"12px", color:C.textMuted }}>
                        {c.skapad ? new Date(c.skapad).toLocaleDateString("sv-SE", {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}
                      </span>
                      <a href={`/artikel/${c.artikel_id}`} target="_blank" rel="noreferrer" style={{ fontSize:"12px", color:C.accentDim, textDecoration:"none", border:`1px solid ${C.border}`, borderRadius:"4px", padding:"2px 8px" }}>
                        Artikel #{c.artikel_id} ↗
                      </a>
                    </div>
                    <p style={{ fontSize:"14px", color:C.text, lineHeight:1.7, margin:0 }}>{c.text}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteKommentar(c.id, c.namn)}
                    disabled={actionLoading === c.id}
                    style={{ background:"transparent", color:C.red, border:`1px solid ${C.red}30`, borderRadius:"4px", padding:"8px 14px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif", flexShrink:0 }}
                  >
                    {actionLoading === c.id ? "…" : "🗑 Ta bort"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── MÄTNING ── */}
        {mainTab === "matning" && <MatningTab />}

        {/* ── NYHETSBREV ── */}
        {mainTab === "nyhetsbrev" && (
          <div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"28px", marginBottom:"24px" }}>
              <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 8px" }}>Prenumeranter</p>
              <p style={{ fontSize:"36px", fontWeight:400, color:C.accent, margin:"0 0 4px", fontFamily:"monospace" }}>{subCount ?? "–"}</p>
              <p style={{ color:C.textMuted, fontSize:"14px", margin:"0 0 20px" }}>aktiva prenumeranter</p>
              <button onClick={loadSubCount} style={{ background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>↻ Uppdatera</button>
            </div>

            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"28px" }}>
              <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 8px" }}>Skicka digest</p>
              <p style={{ color:C.textMuted, fontSize:"14px", lineHeight:1.7, margin:"0 0 20px" }}>
                Skickar ett nyhetsbrev med artiklar från de senaste 7 dagarna till alla aktiva prenumeranter.
                GitHub Actions skickar också automatiskt varje måndag kl 10:00.
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                <button onClick={sendDigest} disabled={digestLoading} style={{ background:C.accent, color:"#0a0a0a", border:"none", borderRadius:"4px", padding:"12px 24px", fontSize:"14px", fontWeight:700, cursor:digestLoading?"default":"pointer", fontFamily:"Georgia, serif" }}>
                  {digestLoading ? "Skickar…" : "✉ Skicka digest nu"}
                </button>
                {digestMsg && <p style={{ color:digestMsg.includes("Fel") || digestMsg.includes("fel") ? C.red : C.green, fontSize:"14px", margin:0 }}>{digestMsg}</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
