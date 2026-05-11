"use client";
import { useState, useEffect, useRef } from "react";

const MIN_SCORE = 6;
const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880", accentDim: "#aaaaaa",
  green: "#4ade80", red: "#f87171", yellow: "#facc15", accent: "#e879f9",
};

const SYSTEM_PROMPT = `Du är chefredaktör för en svensk debattajts. Bedöm artikeln på fyra kriterier (heltal 0-10):
1. Argumentationsklarhet – Är argumenten tydliga och logiskt uppbyggda?
2. Originalitet – Tillför artikeln något nytt till debatten?
3. Samhällsrelevans – Är ämnet viktigt och aktuellt?
4. Trovärdighet – Är faktapåståendena rimliga och välgrundade?

En artikel kan publiceras om ALLA fyra poäng är minst ${MIN_SCORE}/10.

Svara ENDAST med JSON (inga andra tecken):
{"beslut":"publicera","motivering":"kort motivering","arg":8,"ori":7,"rel":9,"tro":8,"forbattringar":["förslag 1","förslag 2"],"styrkor":["styrka 1"],"rubrik":null,"taggar":["tagg1","tagg2","tagg3"]}

beslut är "publicera" om alla fyra >= ${MIN_SCORE}, annars "revidera" eller "avvisa".
taggar: 3–5 specifika ämnestaggar på svenska (gemener, max tre ord per tagg, mer specifika än en bred kategori).`;

function sbHeaders() {
  return {
    "apikey": SB_KEY,
    "Authorization": `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
  };
}

const inp = {
  background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px",
  color: C.text, fontFamily: "Georgia, serif", fontSize: "15px",
  padding: "12px 14px", width: "100%", boxSizing: "border-box",
  outline: "none", lineHeight: "1.5",
};

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

const RÖST_STEG = [
  { id: "tes",   fråga: "Vad är din huvudtes — vad vill du säga?",              fält: null },
  { id: "arg1",  fråga: "Ge ditt starkaste argument för det.",                  fält: null },
  { id: "arg2",  fråga: "Ge ytterligare ett argument eller ett konkret exempel.", fält: null },
  { id: "mot",   fråga: "Vad brukar motståndare invända — och hur svarar du?",   fält: null },
  { id: "avslut",fråga: "Avsluta med din uppmaning: vad vill du att folk gör eller tänker?", fält: null },
];

export default function SkickaInClient() {
  const [view, setView] = useState("form");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [dots, setDots] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [inlamningId, setInlamningId] = useState(null);
  const [röstView, setRöstView] = useState(false);
  const [röstSteg, setRöstSteg] = useState(0);
  const [röstLyssnar, setRöstLyssnar] = useState(false);
  const [röstSvar, setRöstSvar] = useState([]);
  const [röstFel, setRöstFel] = useState("");
  const [röstStöds, setRöstStöds] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    window.onTurnstileVerified = (token) => setTurnstileToken(token);
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    document.head.appendChild(s);
    return () => { delete window.onTurnstileVerified; };
  }, []);

  useEffect(() => {
    if (!analyzing) return;
    const iv = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(iv);
  }, [analyzing]);

  useEffect(() => {
    setRöstStöds(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  function startaLyssning() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setRöstFel("Din webbläsare stöder inte röstinmatning. Prova Chrome."); return; }
    setRöstFel("");
    const rec = new SR();
    rec.lang = "sv-SE";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    setRöstLyssnar(true);
    rec.onresult = (e) => {
      const transkript = e.results[0][0].transcript;
      setRöstLyssnar(false);
      const nyaSvar = [...röstSvar, transkript];
      setRöstSvar(nyaSvar);
      if (röstSteg < RÖST_STEG.length - 1) {
        setRöstSteg(s => s + 1);
      } else {
        // Alla svar klara — sätt ihop texten
        const ihopsatt = [
          "Min tes: " + nyaSvar[0],
          "\nArgument 1: " + nyaSvar[1],
          "\nArgument 2 / Exempel: " + nyaSvar[2],
          "\nMotargument och svar: " + nyaSvar[3],
          "\nAvslutning: " + nyaSvar[4],
        ].join("\n");
        setText(ihopsatt);
        setRöstView(false);
        setRöstSteg(0);
        setRöstSvar([]);
      }
    };
    rec.onerror = (e) => {
      setRöstLyssnar(false);
      setRöstFel(e.error === "no-speech" ? "Ingen röst uppfångades. Försök igen." : `Fel: ${e.error}`);
    };
    rec.onend = () => setRöstLyssnar(false);
    rec.start();
  }

  function avbrytRöst() {
    recognitionRef.current?.abort();
    setRöstLyssnar(false);
    setRöstView(false);
    setRöstSteg(0);
    setRöstSvar([]);
    setRöstFel("");
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const ok = result && ["arg", "ori", "rel", "tro"].every(k => result[k] >= MIN_SCORE);

  function reset() {
    setView("form"); setResult(null); setError(null);
    setTitle(""); setAuthor(""); setText("");
    setTurnstileToken(null); setInlamningId(null);
  }

  async function analyze() {
    if (!turnstileToken) { setError("Vänligen slutför CAPTCHA-kontrollen nedan."); return; }
    setAnalyzing(true); setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\nRubrik: ${title}\nFörfattare: ${author}\n\n${text}` }],
          turnstileToken,
        }),
      });
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      try {
        const inlRes = await fetch(`${SB_URL}/rest/v1/inlamningar`, {
          method: "POST",
          headers: { ...sbHeaders(), "Prefer": "return=representation" },
          body: JSON.stringify({
            rubrik: title, forfattare: author, artikel: text,
            kategori: "Övrigt", motivering: parsed.motivering,
            beslut: parsed.beslut,
            arg: parsed.arg, ori: parsed.ori, rel: parsed.rel, tro: parsed.tro,
            status: "inkorg",
          }),
        });
        const inlData = await inlRes.json();
        if (inlData?.[0]?.id) setInlamningId(inlData[0].id);
      } catch {}
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
      const res = await fetch(`${SB_URL}/rest/v1/artiklar`, {
        method: "POST",
        headers: { ...sbHeaders(), "Prefer": "return=representation" },
        body: JSON.stringify({
          rubrik: result.rubrik || title,
          forfattare: author,
          artikel: text,
          motivering: result.motivering,
          kategori: "Övrigt",
          arg: result.arg, ori: result.ori, rel: result.rel, tro: result.tro,
          taggar: result.taggar || [],
          kalla: "manniska",
        }),
      });
      if (!res.ok) throw new Error();
      if (inlamningId) {
        await fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${inlamningId}`, {
          method: "PATCH",
          headers: sbHeaders(),
          body: JSON.stringify({ status: "publicerad" }),
        });
      }
      setView("published");
    } catch {
      setError("Publicering misslyckades. Försök igen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", maxWidth: "900px", margin: "0 auto" }}>
          <a href="/" style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", fontWeight: 700, color: "#e879f9", padding: "10px 16px 10px 0", textDecoration: "none" }}>DEBATT-AI</a>
          <a href="/" className="neon-nav">Hem</a>
          <a href="/arkiv" className="neon-nav">Arkiv</a>
          <a href="/chatt" className="neon-nav">Direktdebatt</a>
          <a href="/kanal" className="neon-nav">Nyhetskanal</a>
          <a href="/opinion" className="neon-nav">Vad tycker du?</a>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 20px" }}>
        {view === "form" && (
          <div>
            <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px 0" }}>Artikelinlämning</p>
            <h1 style={{ fontSize: "32px", fontWeight: 400, margin: "0 0 20px 0", lineHeight: 1.2 }}>Skicka din debattartikel</h1>
            <div style={{ background: "#0d0f0a", border: `1px solid ${C.green}30`, borderRadius: "8px", padding: "24px", marginBottom: "32px" }}>
              <p style={{ fontSize: "12px", color: C.green, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px 0", fontWeight: 700 }}>Publiceringsregler</p>
              <p style={{ color: C.text, fontSize: "15px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
                Artikeln bedöms av vår AI-redaktör på fyra kriterier. Alla måste uppnå <strong style={{ color: C.green }}>minst {MIN_SCORE} av 10</strong> för att publicering ska vara möjlig:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                {["Argumentationsklarhet", "Originalitet", "Samhällsrelevans", "Trovärdighet"].map(k => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", color: C.textMuted }}>{k}</span>
                  </div>
                ))}
              </div>
              <p style={{ color: C.textMuted, fontSize: "13px", lineHeight: 1.6, margin: 0 }}>Artiklar som inte uppfyller kraven får detaljerade förbättringsförslag och kan skickas in på nytt.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div><Lbl>Rubrik</Lbl><input value={title} onChange={e => setTitle(e.target.value)} style={inp} /></div>
              <div><Lbl>Författare & titel</Lbl><input value={author} onChange={e => setAuthor(e.target.value)} style={inp} /></div>
              <div>
                <Lbl>Artikeltext</Lbl>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={16} style={{ ...inp, resize: "vertical", lineHeight: 1.8 }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
                  <p style={{ fontSize: "12px", color: wordCount < 300 ? C.red : C.green, margin: 0, fontFamily: "monospace" }}>
                    {wordCount} ord {wordCount < 300 ? "– minst 300 ord krävs" : "✓"}
                  </p>
                  {röstStöds && (
                    <button
                      type="button"
                      onClick={() => { setRöstView(true); setRöstSteg(0); setRöstSvar([]); setRöstFel(""); }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "none", border: `1px solid ${C.accent}30`, color: C.accent, borderRadius: "4px", padding: "7px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}
                    >
                      🎙 Prata in din artikel
                    </button>
                  )}
                </div>
              </div>
              <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback="onTurnstileVerified" data-theme="dark" />
              <button onClick={analyze} disabled={analyzing || !text.trim() || !title.trim() || !turnstileToken || wordCount < 300} style={{ background: analyzing ? `${C.accent}20` : (!turnstileToken || wordCount < 300) ? `${C.accent}40` : C.accent, color: analyzing ? C.accentDim : "#0a0a0a", border: "none", borderRadius: "4px", padding: "15px 32px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: (analyzing || !turnstileToken || wordCount < 300) ? "default" : "pointer", fontFamily: "Georgia, serif", alignSelf: "flex-start" }}>
                {analyzing ? `Redaktören läser${".".repeat(dots)}` : "Skicka till redaktionen →"}
              </button>
              {error && <p style={{ color: C.red, fontSize: "14px", margin: 0 }}>{error}</p>}
            </div>
          </div>
        )}

        {view === "result" && result && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px 0" }}>Redaktörens bedömning</p>
              <h2 style={{ fontSize: "22px", fontWeight: 400, margin: "0 0 6px 0", lineHeight: 1.3 }}>{title}</h2>
              <p style={{ color: C.textMuted, fontSize: "14px", margin: "0 0 20px 0", fontStyle: "italic" }}>{author}</p>
              <Badge type={ok ? "eligible" : "ineligible"} />
              <p style={{ color: C.text, fontSize: "16px", lineHeight: 1.8, marginTop: "16px", fontStyle: "italic" }}>"{result.motivering}"</p>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${ok ? C.green + "40" : C.border}`, borderRadius: "8px", padding: "24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Poäng</p>
                <span style={{ fontSize: "12px", color: ok ? C.green : C.red, fontFamily: "monospace", fontWeight: 700 }}>{ok ? "✓ ALLA KRITERIER UPPFYLLDA" : `✗ KRÄVER ${MIN_SCORE}+ PÅ ALLA`}</span>
              </div>
              <ScoreBar label="Argumentation" value={result.arg} />
              <ScoreBar label="Originalitet"  value={result.ori} />
              <ScoreBar label="Relevans"       value={result.rel} />
              <ScoreBar label="Trovärdighet"   value={result.tro} />
            </div>
            {result.styrkor?.length > 0 && (
              <div style={{ background: "#050f08", border: `1px solid ${C.green}25`, borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", color: C.green, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px 0" }}>Styrkor</p>
                {result.styrkor.map((s, i) => <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px" }}><span style={{ color: C.green, fontSize: "16px" }}>+</span><span style={{ color: C.text, fontSize: "15px", lineHeight: 1.6 }}>{s}</span></div>)}
              </div>
            )}
            {result.forbattringar?.length > 0 && (
              <div style={{ background: "#0f0f05", border: `1px solid ${C.yellow}25`, borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", color: C.yellow, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px 0" }}>
                  {ok ? "Förslag för ytterligare förbättring" : "Förbättringsförslag – revidera och skicka in igen"}
                </p>
                {result.forbattringar.map((f, i) => <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px" }}><span style={{ color: C.yellow, fontFamily: "monospace", minWidth: "20px", fontSize: "14px" }}>{i + 1}.</span><span style={{ color: C.text, fontSize: "15px", lineHeight: 1.6 }}>{f}</span></div>)}
              </div>
            )}
            {result.rubrik && result.rubrik !== "null" && (
              <div style={{ background: `${C.accent}08`, border: `1px solid ${C.accent}20`, borderRadius: "8px", padding: "20px", marginBottom: "28px" }}>
                <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px 0" }}>Rubrikförslag</p>
                <p style={{ color: C.accent, fontSize: "18px", fontStyle: "italic", margin: "0 0 12px 0" }}>"{result.rubrik}"</p>
                <button onClick={() => setTitle(result.rubrik)} style={{ background: `${C.accent}20`, border: `1px solid ${C.accent}40`, color: C.accent, borderRadius: "4px", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
                  Använd detta rubrikförslag →
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <button onClick={ok && !saving ? publish : undefined} disabled={!ok || saving} style={{ background: ok ? (saving ? `${C.green}60` : C.green) : "#1a1a1a", color: ok ? "#050f08" : "#444", border: `2px solid ${ok ? C.green : "#2a2a2a"}`, borderRadius: "4px", padding: "15px 32px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: ok && !saving ? "pointer" : "not-allowed", fontFamily: "Georgia, serif" }}>
                {saving ? "Publicerar…" : ok ? "✓ Publicera →" : `Publicering låst – kräver ${MIN_SCORE}+ på alla`}
              </button>
              {!ok && <button onClick={reset} style={{ background: "none", border: `1px solid ${C.accentDim}`, color: C.accentDim, borderRadius: "4px", padding: "14px 22px", fontSize: "14px", cursor: "pointer", fontFamily: "Georgia, serif" }}>Revidera och skicka in igen →</button>}
            </div>
            {error && <p style={{ color: C.red, fontSize: "14px", marginTop: "14px" }}>{error}</p>}
          </div>
        )}

        {view === "published" && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
            <h2 style={{ fontSize: "28px", fontWeight: 400, color: C.green, margin: "0 0 12px 0" }}>Publicerad!</h2>
            <p style={{ color: C.textMuted, fontSize: "16px", margin: "0 0 28px 0" }}>Din artikel är nu publicerad på DEBATT-AI.</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/arkiv" style={{ background: C.green, color: "#050f08", borderRadius: "4px", padding: "12px 24px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Se i arkivet →</a>
              <button onClick={reset} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: "4px", padding: "12px 24px", fontSize: "14px", cursor: "pointer", fontFamily: "Georgia, serif" }}>Skicka in en till</button>
            </div>
          </div>
        )}
      </main>

      {röstView && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "32px", maxWidth: "520px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                Röstinmatning · Steg {röstSteg + 1} av {RÖST_STEG.length}
              </p>
              <button onClick={avbrytRöst} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "18px", padding: "0 4px", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ height: "3px", background: "#222", borderRadius: "2px", marginBottom: "28px" }}>
              <div style={{ height: "100%", width: `${((röstSteg + 1) / RÖST_STEG.length) * 100}%`, background: C.accent, borderRadius: "2px", transition: "width 0.3s ease" }} />
            </div>
            <p style={{ fontSize: "20px", color: C.text, lineHeight: 1.5, margin: "0 0 24px 0", fontWeight: 400 }}>
              {RÖST_STEG[röstSteg].fråga}
            </p>
            {röstSvar.length > 0 && (
              <div style={{ marginBottom: "20px", borderLeft: `2px solid ${C.border}`, paddingLeft: "14px" }}>
                {röstSvar.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ color: C.accent, fontSize: "12px", fontFamily: "monospace", minWidth: "16px", opacity: 0.6 }}>{i + 1}.</span>
                    <span style={{ color: C.textMuted, fontSize: "14px", lineHeight: 1.5, fontStyle: "italic" }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {röstFel && <p style={{ color: C.red, fontSize: "14px", margin: "0 0 16px 0" }}>{röstFel}</p>}
            {röstLyssnar ? (
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", background: "#0d0d0d", border: `1px solid ${C.accent}40`, borderRadius: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: C.accent, animation: "neonPulse 1s ease-in-out infinite", flexShrink: 0 }} />
                <span style={{ color: C.accent, fontSize: "15px" }}>Lyssnar… prata nu</span>
              </div>
            ) : (
              <button
                onClick={startaLyssning}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: `${C.accent}18`, border: `1px solid ${C.accent}50`, color: C.accent, borderRadius: "8px", padding: "16px 24px", fontSize: "16px", cursor: "pointer", fontFamily: "Georgia, serif", width: "100%" }}
              >
                <span style={{ fontSize: "22px" }}>🎙</span>
                <span>{röstSvar.length === 0 ? "Börja prata" : "Svara på nästa fråga"}</span>
              </button>
            )}
            <button onClick={avbrytRöst} style={{ display: "block", width: "100%", marginTop: "12px", background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "13px", padding: "8px", fontFamily: "Georgia, serif" }}>
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
