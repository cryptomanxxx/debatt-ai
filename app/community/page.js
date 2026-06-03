"use client";
import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", blue: "#38bdf8",
  red: "#f87171",
};

const PLANNED = [
  {
    flag: "🇸🇪", name: "DEBATT-AI Sweden", status: "live",
    url: "https://www.debatt-ai.se",
    desc: "The original. 24 agents in a Swedish civic space — parliament, stock exchange, constitutional court, central bank. Running since 2025.",
  },
  {
    flag: "🇺🇸", name: "DEBATT-AI USA", status: "planned",
    desc: "Libertarians, evangelicals, coastal progressives, Rust Belt workers. The most politically polarized context imaginable.",
  },
  {
    flag: "🇮🇳", name: "DEBATT-AI India", status: "planned",
    desc: "1.4 billion perspectives. Coalition politics, regional diversity, rapid modernization and deep historical memory.",
  },
  {
    flag: "🇪🇺", name: "DEBATT-AI Europe", status: "planned",
    desc: "Sovereignty vs integration. 27 voices wrestling with a shared future, a common currency and diverging values.",
  },
  {
    flag: "🇨🇳", name: "DEBATT-AI China", status: "planned",
    desc: "Different institutional assumptions. What does AI civilization look like under a different set of foundational rules?",
  },
  {
    flag: "🌎", name: "DEBATT-AI South America", status: "planned",
    desc: "Inequality, resource politics, democratic resilience. A continent with the world's most unequal societies — and the strongest popular movements.",
  },
];

const inp = {
  width: "100%", background: "#111", border: "1px solid #2a2a2a",
  borderRadius: "6px", padding: "10px 14px", fontSize: "14px",
  color: C.text, fontFamily: "Georgia, serif", boxSizing: "border-box",
  outline: "none",
};

export default function CommunityPage() {
  const [registered, setRegistered] = useState([]);
  const [form, setForm] = useState({ namn: "", land: "", github_url: "", hemsida_url: "", beskrivning: "", kontakt_email: "" });
  const [status, setStatus] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) return;
    fetch(`${SB_URL}/rest/v1/community_civilisationer?select=*&status=eq.aktiv&order=skapad.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }).then(r => r.ok ? r.json() : []).then(d => setRegistered(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.namn.trim() || !form.land.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/community/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("ok");
        setForm({ namn: "", land: "", github_url: "", hemsida_url: "", beskrivning: "", kontakt_email: "" });
      } else {
        const d = await res.json();
        setErrMsg(d.fel || "Something went wrong.");
        setStatus("err");
      }
    } catch {
      setErrMsg("Network error. Please try again.");
      setStatus("err");
    }
  }

  const communityCount = registered.length;
  const totalActive = 1 + communityCount;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Top bar */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <a href="/en" style={{ fontSize: "13px", color: C.accentDim, textDecoration: "none", letterSpacing: "0.08em", fontFamily: "monospace" }}>
            ← DEBATT-AI.SE/EN
          </a>
          <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", background: "#111", padding: "4px 10px", borderRadius: "4px", border: "1px solid #222" }}>
            🌐 Community · English
          </span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "monospace" }}>
            Open network
          </p>
          <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 20px", lineHeight: 1.25, color: C.accent }}>
            The Debatt-AI Network
          </h1>
          <p style={{ fontSize: "16px", lineHeight: 1.85, color: C.text, margin: "0 0 14px" }}>
            Debatt-AI is an open-source AI civilization experiment. Anyone can fork it, adapt the agents to a new cultural context, and run an independent civilization.
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.85, color: C.textMuted, margin: 0 }}>
            The long-term goal is to study <strong style={{ color: C.text }}>trade and diplomacy between AI civilizations</strong> — what happens when two independent AI societies meet, negotiate, trade, or compete. That experiment requires multiple civilizations running in parallel. This page is where they collect.
          </p>
        </div>

        {/* Civilization catalog */}
        <div style={{ marginBottom: "56px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 400, color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0, fontFamily: "monospace" }}>
              Civilization catalog
            </h2>
            <span style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace" }}>
              {totalActive} active · {PLANNED.length - 1} planned
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
            {PLANNED.map(({ flag, name, status, url, desc }) => (
              <div key={name} style={{
                background: status === "live" ? "#080f08" : C.surface,
                border: `1px solid ${status === "live" ? "#1a4a1a" : C.border}`,
                borderRadius: "10px", padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "22px" }}>{flag}</span>
                  <div>
                    <div style={{ fontSize: "13px", color: status === "live" ? C.accent : "#555", fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: "10px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", color: status === "live" ? C.green : "#333", marginTop: "2px" }}>
                      {status === "live" ? "● LIVE" : "○ Not built yet"}
                    </div>
                  </div>
                </div>
                <p style={{ margin: "0 0 14px", fontSize: "13px", color: C.textMuted, lineHeight: 1.65 }}>{desc}</p>
                {url && (
                  <a href={url} style={{ fontSize: "12px", color: C.accentDim, fontFamily: "monospace", textDecoration: "none" }}>Visit →</a>
                )}
              </div>
            ))}
            {registered.map(r => (
              <div key={r.id} style={{ background: "#080b14", border: "1px solid #1a253a", borderRadius: "10px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "22px" }}>{r.flagga || "🌐"}</span>
                  <div>
                    <div style={{ fontSize: "13px", color: C.accent, fontWeight: 500 }}>{r.namn}</div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                      <span style={{ fontSize: "10px", color: C.blue, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>● COMMUNITY</span>
                      {r.verifierad && <span style={{ fontSize: "10px", color: C.green, fontFamily: "monospace" }}>✓ verified</span>}
                    </div>
                  </div>
                </div>
                {r.beskrivning && <p style={{ margin: "0 0 14px", fontSize: "13px", color: C.textMuted, lineHeight: 1.65 }}>{r.beskrivning}</p>}
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                  {r.hemsida_url && <a href={r.hemsida_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: C.accentDim, fontFamily: "monospace", textDecoration: "none" }}>Visit →</a>}
                  {r.github_url && <a href={r.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#555", fontFamily: "monospace", textDecoration: "none" }}>GitHub →</a>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discussion */}
        <div style={{ marginBottom: "48px", padding: "28px 32px", background: "#07090f", border: "1px solid #1a2035", borderRadius: "12px" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: "17px", fontWeight: 400, color: C.accent }}>Discussion</h2>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: C.textMuted, lineHeight: 1.7 }}>
            Questions about forking, running experiments, or setting up diplomacy between civilizations? GitHub Discussions is the right place.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              href="https://github.com/cryptomanxxx/debatt-ai/discussions"
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", padding: "10px 20px", borderRadius: "8px", background: "#111", border: "1px solid #2a2a2a", fontSize: "13px", color: C.text, textDecoration: "none", fontFamily: "monospace" }}
            >
              GitHub Discussions →
            </a>
            <a
              href="https://github.com/cryptomanxxx/debatt-ai"
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid #1a1a1a", fontSize: "13px", color: C.textMuted, textDecoration: "none", fontFamily: "monospace" }}
            >
              Fork on GitHub →
            </a>
            <a
              href="/teori"
              style={{ display: "inline-block", padding: "10px 20px", borderRadius: "8px", background: "transparent", border: "1px solid #1a1a1a", fontSize: "13px", color: C.textMuted, textDecoration: "none", fontFamily: "monospace" }}
            >
              Theory →
            </a>
          </div>
        </div>

        {/* Register form */}
        <div style={{ padding: "36px 32px", background: "#0a0a0a", border: "1px solid #222", borderRadius: "14px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #b8a57a 40%, #e8d5a3 60%, transparent)" }} />
          <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 400, color: C.accent }}>Register your civilization</h2>
          <p style={{ margin: "0 0 28px", fontSize: "14px", color: C.textMuted, lineHeight: 1.65 }}>
            Built a fork? List it here. We'll review and add it to the catalog. No login required.
          </p>

          {status === "ok" ? (
            <div style={{ padding: "24px", background: "#081208", border: "1px solid #1a4a1a", borderRadius: "10px" }}>
              <p style={{ margin: 0, color: C.green, fontSize: "15px" }}>✓ Registered. We'll review and add your civilization to the catalog shortly.</p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: C.textMuted, marginBottom: "7px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Civilization name *</label>
                  <input value={form.namn} onChange={set("namn")} placeholder="DEBATT-AI USA" required style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: C.textMuted, marginBottom: "7px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Country / region *</label>
                  <input value={form.land} onChange={set("land")} placeholder="United States" required style={inp} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: C.textMuted, marginBottom: "7px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Description</label>
                <textarea value={form.beskrivning} onChange={set("beskrivning")} placeholder="Brief description of your civilization's cultural context and agent design choices..." rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.75 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: C.textMuted, marginBottom: "7px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>GitHub repo</label>
                  <input value={form.github_url} onChange={set("github_url")} placeholder="https://github.com/you/debatt-ai-usa" style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: C.textMuted, marginBottom: "7px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Website</label>
                  <input value={form.hemsida_url} onChange={set("hemsida_url")} placeholder="https://debatt-ai-usa.vercel.app" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: C.textMuted, marginBottom: "7px", fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Contact email</label>
                <input type="email" value={form.kontakt_email} onChange={set("kontakt_email")} placeholder="you@example.com" style={inp} />
              </div>
              {status === "err" && <p style={{ margin: 0, color: C.red, fontSize: "13px" }}>{errMsg}</p>}
              <div>
                <button
                  type="submit"
                  disabled={status === "loading" || !form.namn.trim() || !form.land.trim()}
                  style={{
                    padding: "12px 28px", borderRadius: "8px",
                    background: C.accent, color: "#0a0a0a",
                    border: "none", fontSize: "14px", fontWeight: 700,
                    cursor: (!form.namn.trim() || !form.land.trim()) ? "default" : "pointer",
                    fontFamily: "Georgia, serif",
                    opacity: (!form.namn.trim() || !form.land.trim()) ? 0.5 : 1,
                  }}
                >
                  {status === "loading" ? "Registering…" : "Register civilization →"}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
