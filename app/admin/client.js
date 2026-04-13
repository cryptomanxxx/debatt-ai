"use client";
import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", red: "#f87171", yellow: "#fbbf24",
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

async function updateStatus(id, status) {
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function deleteInlamning(id, rubrik) {
  // Delete from inlamningar
  const res = await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${id}`, {
    method: "DELETE",
    headers: sbHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  // Also delete from artiklar if exists
  if (rubrik) {
    await fetch(`${SB_URL}/rest/v1/artiklar?rubrik=eq.${encodeURIComponent(rubrik)}`, {
      method: "DELETE",
      headers: sbHeaders(),
    });
  }
}

async function checkDuplicate(rubrik) {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?rubrik=eq.${encodeURIComponent(rubrik)}&select=id`, {
    headers: sbHeaders(),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.length > 0;
}

async function publishToArtiklar(row) {
  // Check for duplicate first
  const isDuplicate = await checkDuplicate(row.rubrik);
  if (isDuplicate) throw new Error("Artikeln finns redan publicerad i arkivet.");
  const res = await fetch(`${SB_URL}/rest/v1/artiklar`, {
    method: "POST",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({
      rubrik: row.rubrik,
      forfattare: row.forfattare,
      artikel: row.artikel,
      kategori: row.kategori,
      motivering: row.motivering,
      arg: row.arg, ori: row.ori, rel: row.rel, tro: row.tro,
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

export default function AdminClient() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("alla");
  const [expanded, setExpanded] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  function login() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      load();
    } else {
      setPwError("Fel lösenord.");
    }
  }

  async function load() {
    setLoading(true); setError("");
    try {
      const data = await fetchInlamningar();
      setArticles(data);
    } catch (e) {
      setError("Kunde inte hämta inlämningar: " + e.message);
    }
    setLoading(false);
  }

  async function handlePublish(row) {
    setActionLoading(row.id);
    try {
      await publishToArtiklar(row);
      await updateStatus(row.id, "publicerad");
      setArticles(prev => prev.map(a => a.id === row.id ? {...a, status:"publicerad"} : a));
    } catch (e) {
      setError("Fel vid publicering: " + e.message);
    }
    setActionLoading(null);
  }

  async function handleAvvisa(id) {
    setActionLoading(id);
    try {
      await updateStatus(id, "avvisad");
      setArticles(prev => prev.map(a => a.id === id ? {...a, status:"avvisad"} : a));
    } catch (e) {
      setError("Fel: " + e.message);
    }
    setActionLoading(null);
  }

  useEffect(() => {
    if (!authed) return;
    // Poll every 15 seconds for new submissions
    const interval = setInterval(() => {
      load();
    }, 15000);
    return () => clearInterval(interval);
  }, [authed]);

  async function handleDelete(id, rubrik) {
    if (!confirm("Är du säker? Artikeln tas bort från både admin och arkivet.")) return;
    setActionLoading(id);
    try {
      await deleteInlamning(id, rubrik);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      setError("Fel vid borttagning: " + e.message);
    }
    setActionLoading(null);
  }

  const filtered = articles.filter(a =>
    filter === "alla" ? true : a.status === filter
  );

  const counts = {
    alla: articles.length,
    inkorg: articles.filter(a => a.status === "inkorg").length,
    publicerad: articles.filter(a => a.status === "publicerad").length,
    avvisad: articles.filter(a => a.status === "avvisad").length,
  };

  if (!authed) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia, serif" }}>
        <div style={{ width:"320px", padding:"40px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px" }}>
          <h1 style={{ fontSize:"22px", fontWeight:400, color:C.accent, margin:"0 0 6px 0", fontFamily:"Times New Roman, serif" }}>DEBATT.AI</h1>
          <p style={{ color:C.textMuted, fontSize:"13px", margin:"0 0 28px 0", letterSpacing:"0.1em", textTransform:"uppercase" }}>Admin</p>
          <label style={{ display:"block", fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Lösenord</label>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ background:"#0d0d0d", border:`1px solid ${C.border}`, borderRadius:"4px", color:C.text, fontFamily:"Georgia, serif", fontSize:"15px", padding:"12px 14px", width:"100%", boxSizing:"border-box", outline:"none", marginBottom:"12px" }}
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
          <span style={{ fontSize:"11px", color:C.textMuted }}>↻ auto 15s</span>
          <a href="/" style={{ fontSize:"13px", color:C.textMuted, textDecoration:"none", padding:"6px 14px", border:`1px solid ${C.border}`, borderRadius:"4px" }}>← Sajten</a>
          <button onClick={load} style={{ fontSize:"13px", color:C.accent, background:"transparent", border:`1px solid ${C.accentDim}`, borderRadius:"4px", padding:"6px 14px", cursor:"pointer", fontFamily:"Georgia, serif" }}>↻ Nu</button>
        </div>
      </header>

      <main style={{ maxWidth:"900px", margin:"0 auto", padding:"32px 20px" }}>
        <div style={{ marginBottom:"28px" }}>
          <h1 style={{ fontSize:"26px", fontWeight:400, margin:"0 0 6px 0" }}>Inlämningar</h1>
          <p style={{ color:C.textMuted, fontSize:"14px", margin:0 }}>Alla artiklar som skickats in.</p>
        </div>

        {error && <p style={{ color:C.red, fontSize:"14px", marginBottom:"16px" }}>{error}</p>}

        <div style={{ display:"flex", gap:"8px", marginBottom:"28px", flexWrap:"wrap" }}>
          {[["alla","Alla"],["inkorg","Inkorg"],["publicerad","Publicerade"],["avvisad","Avvisade"]].map(([val,lbl])=>(
            <button key={val} onClick={()=>setFilter(val)} style={{ background:filter===val?`${C.accent}15`:"transparent", border:`1px solid ${filter===val?C.accentDim:C.border}`, color:filter===val?C.accent:C.textMuted, padding:"6px 14px", borderRadius:"4px", cursor:"pointer", fontSize:"13px", fontFamily:"Georgia, serif" }}>
              {lbl} ({counts[val]})
            </button>
          ))}
        </div>

        {loading ? <p style={{ color:C.textMuted }}>Laddar…</p>
          : filtered.length === 0 ? <p style={{ color:C.textMuted }}>Inga inlämningar.</p>
          : filtered.map(a => (
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

            <button onClick={()=>setExpanded(expanded===a.id?null:a.id)} style={{ background:"none", border:"none", color:C.accentDim, cursor:"pointer", fontSize:"13px", padding:0, fontFamily:"Georgia, serif", marginBottom:"12px" }}>
              {expanded===a.id ? "▲ Dölj text" : "▼ Visa artikeltext"}
            </button>

            {expanded===a.id && (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"6px", padding:"16px", marginBottom:"12px", maxHeight:"280px", overflowY:"auto" }}>
                {(a.artikel||"").split("\n\n").filter(Boolean).map((p,i)=>(
                  <p key={i} style={{ fontSize:"14px", lineHeight:1.8, color:C.text, margin:"0 0 14px 0" }}>{p}</p>
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              {a.status === "inkorg" && (
                <>
                  <button onClick={()=>handlePublish(a)} disabled={actionLoading===a.id} style={{ background:C.green, color:"#050f08", border:"none", borderRadius:"4px", padding:"8px 16px", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"Georgia, serif" }}>
                    {actionLoading===a.id ? "…" : "✓ Publicera"}
                  </button>
                  <button onClick={()=>handleAvvisa(a.id)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.red, border:`1px solid ${C.red}40`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                    {actionLoading===a.id ? "…" : "✗ Avvisa"}
                  </button>
                </>
              )}
              {a.status === "avvisad" && (
                <button onClick={()=>handlePublish(a)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.green, border:`1px solid ${C.green}40`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                  {actionLoading===a.id ? "…" : "↑ Publicera ändå"}
                </button>
              )}
              <button onClick={()=>handleDelete(a.id, a.rubrik)} disabled={actionLoading===a.id} style={{ background:"transparent", color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia, serif", marginLeft:"auto" }}>
                {actionLoading===a.id ? "…" : "🗑 Ta bort"}
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
