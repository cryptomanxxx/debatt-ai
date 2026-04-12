"use client";
import { useState, useEffect } from "react";

const MIN_SCORE = 6;

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SYSTEM_PROMPT = `Du är chefredaktör för en svensk debattajts. Bedöm artikeln på fyra kriterier (heltal 0-10):
1. Argumentationsklarhet – Är argumenten tydliga och logiskt uppbyggda?
2. Originalitet – Tillför artikeln något nytt till debatten?
3. Samhällsrelevans – Är ämnet viktigt och aktuellt?
4. Trovärdighet – Är faktapåståendena rimliga och välgrundade?

En artikel kan publiceras om ALLA fyra poäng är minst ${MIN_SCORE}/10.

Svara ENDAST med JSON (inga andra tecken):
{"beslut":"publicera","motivering":"kort motivering","arg":8,"ori":7,"rel":9,"tro":8,"forbattringar":["förslag 1","förslag 2"],"styrkor":["styrka 1"],"rubrik":null}

beslut är "publicera" om alla fyra >= ${MIN_SCORE}, annars "revidera" eller "avvisa".`;

// ── Supabase REST helpers ─────────────────────────────────────────────────────
function sbHeaders() {
  return {
    "apikey": SB_KEY,
    "Authorization": `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
  };
}

async function sbInsert(row) {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function sbSelect() {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=*&order=skapad.desc`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", red: "#f87171", yellow: "#fbbf24",
};

const inp = {
  background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px",
  color: C.text, fontFamily: "Georgia, serif", fontSize: "15px",
  padding: "12px 14px", width: "100%", boxSizing: "border-box",
  outline: "none", lineHeight: "1.5",
};

// ── Components ────────────────────────────────────────────────────────────────
function Lbl({ children }) {
  return (
    <label style={{ display: "block", fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
      {children}
    </label>
  );
}

function ScoreBar({ label, value }) {
  const passes = value >= MIN_SCORE;
  const color = value >= 8 ? C.green : passes ? C.yellow : C.red;
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
          <span style={{ fontSize: "11px", color: passes ? C.green : C.red, fontFamily: "monospace" }}>
            {passes ? "✓ Godkänd" : `✗ Kräver ${MIN_SCORE}+`}
          </span>
        </div>
        <span style={{ fontSize: "14px", color, fontWeight: 700, fontFamily: "monospace" }}>{value}/10</span>
      </div>
      <div style={{ height: "5px", background: "#1e1e1e", borderRadius: "3px", position: "relative" }}>
        <div style={{ height: "100%", width: `${value * 10}%`, background: color, borderRadius: "3px", transition: "width 1.2s ease" }} />
        <div style={{ position: "absolute", top: "-4px", left: `${MIN_SCORE * 10}%`, width: "2px", height: "13px", background: "#555", borderRadius: "1px" }} />
      </div>
    </div>
  );
}

function Badge({ type }) {
  const cfg = {
    eligible:   { label: "GODKÄND FÖR PUBLICERING", color: C.green, bg: "#052011" },
    ineligible: { label: "EJ PUBLICERINGSBAR",       color: C.red,   bg: "#200505" },
    published:  { label: "PUBLICERAD",               color: C.green, bg: "#052011" },
  }[type];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 16px", background: cfg.bg, border: `1px solid ${cfg.color}40`, borderRadius: "4px" }}>
      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
      <span style={{ color: cfg.color, fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", fontFamily: "monospace" }}>{cfg.label}</span>
    </div>
  );
}

function isEligible(r) {
  return r && r.arg >= MIN_SCORE && r.ori >= MIN_SCORE && r.rel >= MIN_SCORE && r.tro >= MIN_SCORE;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DebattClient() {
  const [view, setView]     = useState("submit");
  const [title, setTitle]   = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText]     = useState("");
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [dots, setDots]           = useState(0);
  const [articles, setArticles]   = useState([]);
  const [articleCount, setArticleCount] = useState(null);
  const [loadingArt, setLoadingArt] = useState(false);
  const [selected, setSelected]   = useState(null);

  // Load count on mount
  useEffect(() => {
    sbSelect().then(data => setArticleCount(data.length)).catch(() => {});
  }, []);

  useEffect(() => {
    if (view !== "published") return;
    setLoadingArt(true);
    sbSelect()
      .then(data => { setArticles(data); setArticleCount(data.length); })
      .catch(e => setError("Kunde inte hämta artiklar: " + e.message))
      .finally(() => setLoadingArt(false));
  }, [view]);

  useEffect(() => {
    if (!analyzing) return;
    const iv = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(iv);
  }, [analyzing]);

  async function analyze() {
    setAnalyzing(true); setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\nRubrik: ${title}\nFörfattare: ${author}\n\n${text}` }],
        }),
      });
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setResult(parsed);
      setView("result");
    } catch {
      setError("Analysen misslyckades. Försök igen.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function publish() {
    setSaving(true); setError(null);
    try {
      await sbInsert({
        rubrik: title,
        forfattare: author,
        artikel: text,
        motivering: result.motivering,
        arg: result.arg, ori: result.ori, rel: result.rel, tro: result.tro,
      });
      setView("published");
    } catch (e) {
      setError("Sparning misslyckades: " + e.message);
    }
    setSaving(false);
  }

  function reset() {
    setView("submit"); setResult(null); setError(null); setSelected(null);
    setTitle("");
    setAuthor(""); setText("");
  }

  const ok = isEligible(result);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "68px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", cursor: "pointer" }} onClick={reset}>
          <span style={{ fontFamily: "Times New Roman, serif", fontSize: "24px", fontWeight: 700, color: C.accent }}>DEBATT.AI</span>
          <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.16em", textTransform: "uppercase" }}>Redaktionen är artificiell</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[["submit","Skicka in",reset],["published", articleCount !== null ? `Arkiv (${articleCount})` : "Arkiv", ()=>setView("published")]].map(([v,lbl,fn])=>(
            <button key={v} onClick={fn} style={{ background: view===v?`${C.accent}15`:"transparent", border: `1px solid ${view===v?C.accentDim:C.border}`, color: view===v?C.accent:C.textMuted, padding: "7px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", letterSpacing: "0.05em", fontFamily: "Georgia, serif" }}>{lbl}</button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "56px 40px" }}>

        {/* ── SUBMIT ── */}
        {view === "submit" && (
          <div>
            <div style={{ marginBottom: "40px" }}>
              <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px 0" }}>Artikelinlämning</p>
              <h1 style={{ fontSize: "32px", fontWeight: 400, margin: "0 0 20px 0", lineHeight: 1.2 }}>Skicka din debattartikel</h1>
              <div style={{ background: "#0d0f0a", border: `1px solid ${C.green}30`, borderRadius: "8px", padding: "24px" }}>
                <p style={{ fontSize: "12px", color: C.green, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px 0", fontWeight: 700 }}>Publiceringsregler</p>
                <p style={{ color: C.text, fontSize: "15px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
                  Artikeln bedöms av vår AI-redaktör på fyra kriterier. Alla måste uppnå <strong style={{ color: C.green }}>minst {MIN_SCORE} av 10</strong> för att publicering ska vara möjlig:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  {["Argumentationsklarhet","Originalitet","Samhällsrelevans","Trovärdighet"].map(k=>(
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                      <span style={{ fontSize: "14px", color: C.textMuted }}>{k}</span>
                    </div>
                  ))}
                </div>
                <p style={{ color: C.textMuted, fontSize: "13px", lineHeight: 1.6, margin: 0 }}>Artiklar som inte uppfyller kraven får detaljerade förbättringsförslag och kan skickas in på nytt.</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div><Lbl>Rubrik</Lbl><input value={title} onChange={e=>setTitle(e.target.value)} style={inp} /></div>
              <div><Lbl>Författare & titel</Lbl><input value={author} onChange={e=>setAuthor(e.target.value)} style={inp} /></div>
              <div><Lbl>Artikeltext</Lbl><textarea value={text} onChange={e=>setText(e.target.value)} rows={16} style={{...inp, resize:"vertical", lineHeight:1.8}} /></div>
              <button onClick={analyze} disabled={analyzing||!text.trim()||!title.trim()} style={{ background:analyzing?`${C.accent}20`:C.accent, color:analyzing?C.accentDim:"#0a0a0a", border:"none", borderRadius:"4px", padding:"15px 32px", fontSize:"14px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", cursor:analyzing?"default":"pointer", fontFamily:"Georgia, serif", alignSelf:"flex-start" }}>
                {analyzing?`Redaktören läser${".".repeat(dots)}`:"Skicka till redaktionen →"}
              </button>
              {error && <p style={{ color:C.red, fontSize:"14px", margin:0 }}>{error}</p>}
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {view === "result" && result && (
          <div>
            <button onClick={reset} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:"14px", padding:0, marginBottom:"36px", fontFamily:"Georgia, serif" }}>← Ny artikel</button>
            <div style={{ marginBottom:"32px" }}>
              <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.12em", textTransform:"uppercase", margin:"0 0 14px 0" }}>Redaktörens bedömning</p>
              <h2 style={{ fontSize:"22px", fontWeight:400, margin:"0 0 6px 0", lineHeight:1.3 }}>{title}</h2>
              <p style={{ color:C.textMuted, fontSize:"14px", margin:"0 0 20px 0", fontStyle:"italic" }}>{author}</p>
              <Badge type={ok?"eligible":"ineligible"} />
              <p style={{ color:C.text, fontSize:"16px", lineHeight:1.8, marginTop:"16px", fontStyle:"italic" }}>"{result.motivering}"</p>
            </div>

            <div style={{ background:C.surface, border:`1px solid ${ok?C.green+"40":C.border}`, borderRadius:"8px", padding:"24px", marginBottom:"20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <p style={{ fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", margin:0 }}>Poäng</p>
                <span style={{ fontSize:"12px", color:ok?C.green:C.red, fontFamily:"monospace", fontWeight:700 }}>{ok?"✓ ALLA KRITERIER UPPFYLLDA":`✗ KRÄVER ${MIN_SCORE}+ PÅ ALLA`}</span>
              </div>
              <ScoreBar label="Argumentation" value={result.arg} />
              <ScoreBar label="Originalitet"  value={result.ori} />
              <ScoreBar label="Relevans"       value={result.rel} />
              <ScoreBar label="Trovärdighet"   value={result.tro} />
            </div>

            {result.styrkor?.length > 0 && (
              <div style={{ background:"#050f08", border:`1px solid ${C.green}25`, borderRadius:"8px", padding:"20px", marginBottom:"20px" }}>
                <p style={{ fontSize:"11px", color:C.green, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 14px 0" }}>Styrkor</p>
                {result.styrkor.map((s,i)=><div key={i} style={{ display:"flex", gap:"12px", marginBottom:"10px" }}><span style={{color:C.green,fontSize:"16px"}}>+</span><span style={{color:C.text,fontSize:"15px",lineHeight:1.6}}>{s}</span></div>)}
              </div>
            )}

            {result.forbattringar?.length > 0 && (
              <div style={{ background:"#0f0f05", border:`1px solid ${C.yellow}25`, borderRadius:"8px", padding:"20px", marginBottom:"20px" }}>
                <p style={{ fontSize:"11px", color:C.yellow, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 14px 0" }}>
                  {ok?"Förslag för ytterligare förbättring":"Förbättringsförslag – revidera och skicka in igen"}
                </p>
                {result.forbattringar.map((f,i)=><div key={i} style={{ display:"flex", gap:"12px", marginBottom:"10px" }}><span style={{color:C.yellow,fontFamily:"monospace",minWidth:"20px",fontSize:"14px"}}>{i+1}.</span><span style={{color:C.text,fontSize:"15px",lineHeight:1.6}}>{f}</span></div>)}
              </div>
            )}

            {result.rubrik && result.rubrik !== "null" && (
              <div style={{ background:`${C.accent}08`, border:`1px solid ${C.accent}20`, borderRadius:"8px", padding:"20px", marginBottom:"28px" }}>
                <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 10px 0" }}>Rubrikförslag</p>
                <p style={{ color:C.accent, fontSize:"18px", fontStyle:"italic", margin:0 }}>"{result.rubrik}"</p>
              </div>
            )}

            <div style={{ display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
              <button onClick={ok&&!saving?publish:undefined} disabled={!ok||saving} style={{ background:ok?(saving?`${C.green}60`:C.green):"#1a1a1a", color:ok?"#050f08":"#444", border:`2px solid ${ok?C.green:"#2a2a2a"}`, borderRadius:"4px", padding:"15px 32px", fontSize:"14px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", cursor:ok&&!saving?"pointer":"not-allowed", fontFamily:"Georgia, serif", transition:"all 0.3s", boxShadow:ok?`0 0 24px ${C.green}35`:"none" }}>
                {saving?"Publicerar…":ok?"✓ Publicera →":`Publicering låst – kräver ${MIN_SCORE}+ på alla`}
              </button>
              {!ok && <button onClick={reset} style={{ background:"none", border:`1px solid ${C.accentDim}`, color:C.accentDim, borderRadius:"4px", padding:"14px 22px", fontSize:"14px", cursor:"pointer", fontFamily:"Georgia, serif" }}>Revidera och skicka in igen →</button>}
            </div>
            {error && <p style={{ color:C.red, fontSize:"14px", marginTop:"14px" }}>{error}</p>}
          </div>
        )}

        {/* ── ARCHIVE ── */}
        {view === "published" && (
          <div>
            <div style={{ marginBottom:"40px" }}>
              <p style={{ fontSize:"11px", color:C.accentDim, letterSpacing:"0.12em", textTransform:"uppercase", margin:"0 0 10px 0" }}>Arkiv</p>
              <h1 style={{ fontSize:"32px", fontWeight:400, margin:"0 0 8px 0" }}>Publicerade artiklar</h1>
              <p style={{ color:C.textMuted, fontSize:"15px", margin:0 }}>Klicka på en artikel för att läsa hela texten.</p>
            </div>
            {loadingArt ? <p style={{ color:C.textMuted }}>Hämtar från databas…</p>
              : articles.length === 0 ? (
                <div style={{ textAlign:"center", padding:"80px 0", color:C.textMuted }}>
                  <p style={{ fontSize:"40px", margin:"0 0 16px 0" }}>📭</p>
                  <p style={{ fontSize:"16px" }}>Inga artiklar publicerade än.</p>
                  <button onClick={reset} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textMuted, padding:"12px 24px", borderRadius:"4px", cursor:"pointer", marginTop:"20px", fontFamily:"Georgia, serif", fontSize:"14px" }}>Skicka in en artikel</button>
                </div>
              ) : articles.map((a,i)=>(
                <div key={a.id||i} onClick={()=>{setSelected(a);setView("article");}} style={{ borderTop:`1px solid ${C.border}`, paddingTop:"32px", marginBottom:"32px", cursor:"pointer", transition:"opacity 0.15s" }} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                    <Badge type="published" />
                    <span style={{ fontSize:"13px", color:C.textMuted }}>{a.skapad?new Date(a.skapad).toLocaleDateString("sv-SE"):""}</span>
                  </div>
                  <h2 style={{ fontSize:"22px", fontWeight:400, margin:"0 0 8px 0", lineHeight:1.3, color:C.accent }}>{a.rubrik}</h2>
                  <p style={{ color:C.textMuted, fontSize:"14px", margin:"0 0 14px 0", fontStyle:"italic" }}>{a.forfattare}</p>
                  <p style={{ color:C.textMuted, fontSize:"15px", lineHeight:1.7, margin:"0 0 14px 0" }}>{(a.artikel||"").slice(0,220)}…</p>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"8px 16px", background:`${C.accent}10`, border:`1px solid ${C.accent}30`, borderRadius:"4px" }}>
                    <span style={{ fontSize:"14px", color:C.accent, fontWeight:600 }}>Läs hela artikeln →</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ── FULL ARTICLE ── */}
        {view === "article" && selected && (
          <div>
            <button onClick={()=>setView("published")} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:"14px", padding:0, marginBottom:"48px", fontFamily:"Georgia, serif" }}>← Tillbaka till arkivet</button>
            <div style={{ marginBottom:"36px", paddingBottom:"36px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <Badge type="published" />
                <span style={{ fontSize:"13px", color:C.textMuted }}>{selected.skapad?new Date(selected.skapad).toLocaleDateString("sv-SE",{year:"numeric",month:"long",day:"numeric"}):""}</span>
              </div>
              <h1 style={{ fontSize:"30px", fontWeight:400, margin:"0 0 14px 0", lineHeight:1.25, color:C.accent }}>{selected.rubrik}</h1>
              <p style={{ color:C.textMuted, fontSize:"15px", margin:0, fontStyle:"italic" }}>{selected.forfattare}</p>
            </div>
            <div style={{ marginBottom:"56px" }}>
              {(selected.artikel||"").split("\n\n").filter(Boolean).map((p,i)=>(
                <p key={i} style={{ fontSize:"18px", lineHeight:2, color:C.text, margin:"0 0 28px 0" }}>{p}</p>
              ))}
            </div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"28px" }}>
              <p style={{ fontSize:"11px", color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 20px 0" }}>Redaktörens noteringar</p>
              {selected.motivering && <p style={{ color:C.textMuted, fontSize:"15px", lineHeight:1.8, fontStyle:"italic", margin:"0 0 24px 0" }}>"{selected.motivering}"</p>}
              <ScoreBar label="Argumentation" value={selected.arg} />
              <ScoreBar label="Originalitet"  value={selected.ori} />
              <ScoreBar label="Relevans"       value={selected.rel} />
              <ScoreBar label="Trovärdighet"   value={selected.tro} />
            </div>
          </div>
        )}

      </main>

      <footer style={{ borderTop:`1px solid ${C.border}`, padding:"28px 40px", textAlign:"center", marginTop:"60px" }}>
        <p style={{ color:C.textMuted, fontSize:"13px", margin:0, letterSpacing:"0.05em" }}>
          DEBATT.AI · Publicering kräver minst {MIN_SCORE}/10 på alla kriterier · Ansvarig utgivare: Du
        </p>
      </footer>
    </div>
  );
}
