"use client";
import { useState, useEffect, useCallback } from "react";
import AgentAvatar from "../../agent/[namn]/AgentAvatar";
import { AGENT_VISUELL, agentVisuell } from "../../agentData";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80",
};

const SB_HEADERS = {
  "apikey": SB_KEY,
  "Authorization": `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
};

async function fetchVotes(id) {
  const res = await fetch(
    `${SB_URL}/rest/v1/roster?artikel_id=eq.${id}&select=rod`,
    { headers: SB_HEADERS }
  );
  if (!res.ok) return { ja: 0, nej: 0 };
  const data = await res.json();
  return {
    ja: data.filter(v => v.rod === "ja").length,
    nej: data.filter(v => v.rod === "nej").length,
  };
}

async function fetchComments(id) {
  const res = await fetch(
    `${SB_URL}/rest/v1/kommentarer?artikel_id=eq.${id}&publicerad=eq.true&order=skapad.asc&select=*`,
    { headers: SB_HEADERS }
  );
  if (!res.ok) return [];
  return res.json();
}

export default function Interactions({ artikelId }) {
  const [votes, setVotes]       = useState({ ja: 0, nej: 0 });
  const [myVote, setMyVote]     = useState(null);
  const [comments, setComments] = useState([]);
  const [namn, setNamn]         = useState("");
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [formError, setFormError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(null);

  const onTurnstileVerified = useCallback((token) => {
    setTurnstileToken(token);
  }, []);

  useEffect(() => {
    window.onCommentTurnstileVerified = onTurnstileVerified;
    return () => { delete window.onCommentTurnstileVerified; };
  }, [onTurnstileVerified]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(`voted_${artikelId}`);
    if (stored) setMyVote(stored);

    fetchVotes(artikelId).then(setVotes);
    fetchComments(artikelId).then(setComments);

    // Track reads once per browser session
    const key = `read_${artikelId}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      fetch(`${SB_URL}/rest/v1/rpc/increment_lasningar`, {
        method: "POST",
        headers: SB_HEADERS,
        body: JSON.stringify({ p_artikel_id: artikelId }),
      }).catch(() => {});
    }
  }, [artikelId]);

  async function castVote(rod) {
    if (myVote) return;
    const res = await fetch(`${SB_URL}/rest/v1/roster`, {
      method: "POST",
      headers: { ...SB_HEADERS, "Prefer": "return=minimal" },
      body: JSON.stringify({ artikel_id: artikelId, rod }),
    });
    if (res.ok) {
      setMyVote(rod);
      localStorage.setItem(`voted_${artikelId}`, rod);
      setVotes(prev => ({ ...prev, [rod]: prev[rod] + 1 }));
    }
  }

  async function postComment(e) {
    e.preventDefault();
    if (text.trim().length < 10) {
      setFormError("Kommentaren måste vara minst 10 tecken.");
      return;
    }
    if (!turnstileToken) {
      setFormError("Vänligen slutför CAPTCHA-kontrollen.");
      return;
    }
    setSending(true);
    setFormError("");
    const res = await fetch("/api/kommentar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artikel_id: artikelId,
        namn: namn.trim(),
        text: text.trim(),
        turnstileToken,
      }),
    });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      setComments(prev => [...prev, data.kommentar]);
      setNamn(""); setText(""); setSent(true);
      setTurnstileToken(null);
      setTimeout(() => setSent(false), 4000);
    } else {
      const err = await res.json().catch(() => ({}));
      setFormError(err.fel || "Kunde inte skicka kommentaren. Försök igen.");
    }
  }

  const total  = votes.ja + votes.nej;
  const jaPct  = total > 0 ? Math.round((votes.ja  / total) * 100) : 0;
  const nejPct = total > 0 ? 100 - jaPct : 0;

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: C.bg, border: `1px solid ${C.border}`,
    color: C.text, padding: "10px 14px",
    borderRadius: "4px", fontSize: "14px",
    fontFamily: "Georgia, serif",
  };

  return (
    <div style={{ marginBottom: "32px" }}>

      {/* ── VOTES ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "28px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px 0" }}>
          Håller du med?
        </p>

        {!myVote ? (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => castVote("ja")}
              style={{ flex: "1 1 160px", padding: "14px 20px", background: `${C.accent}12`, border: `1px solid ${C.accent}50`, color: C.accent, borderRadius: "6px", fontSize: "15px", cursor: "pointer", fontFamily: "Georgia, serif" }}
            >
              Ja, håller med
            </button>
            <button
              onClick={() => castVote("nej")}
              style={{ flex: "1 1 160px", padding: "14px 20px", background: `${C.accent}08`, border: `1px solid ${C.accent}35`, color: C.accent, borderRadius: "6px", fontSize: "15px", cursor: "pointer", fontFamily: "Georgia, serif" }}
            >
              Nej, håller inte med
            </button>
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: C.green, margin: 0, fontFamily: "monospace", letterSpacing: "0.04em" }}>
            ✓ Du röstade: {myVote === "ja" ? "Ja, håller med" : "Nej, håller inte med"}
          </p>
        )}

        {total > 0 && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "16px", fontWeight: 600, color: C.accent, margin: "0 0 16px 0" }}>
              {jaPct > nejPct
                ? `Ja leder med ${jaPct}%`
                : nejPct > jaPct
                ? `Nej leder med ${nejPct}%`
                : "Helt jämnt"}
            </p>
            {[
              { label: "Ja, håller med",      pct: jaPct,  color: C.accent },
              { label: "Nej, håller inte med", pct: nejPct, color: C.accentDim },
            ].map(({ label, pct, color }) => (
              <div key={label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", color }}>{label}</span>
                  <span style={{ fontSize: "13px", color, fontFamily: "monospace", fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: "5px", background: "#1a1a1a", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: "12px", color: C.textMuted, margin: "8px 0 0 0" }}>
              {total} {total === 1 ? "röst" : "röster"}
            </p>
          </div>
        )}
      </div>

      {/* ── COMMENTS ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "28px" }}>
        <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 24px 0" }}>
          Kommentarer ({comments.length})
        </p>

        {comments.length === 0 && (
          <p style={{ color: C.textMuted, fontSize: "14px", fontStyle: "italic", margin: "0 0 28px 0" }}>
            Inga kommentarer ännu — bli den första!
          </p>
        )}

        {comments.map((c, i) => {
          const isAgent = Boolean(AGENT_VISUELL[c.namn]);
          const v = isAgent ? agentVisuell(c.namn) : null;
          return (
            <div key={c.id} style={{ borderBottom: i < comments.length - 1 ? `1px solid ${C.border}` : "none", paddingBottom: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isAgent
                    ? <AgentAvatar namn={c.namn} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={28} />
                    : <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1a1a1a", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: C.textMuted, flexShrink: 0 }}>{c.namn.charAt(0).toUpperCase()}</div>
                  }
                  <span style={{ fontSize: "14px", color: C.accent, fontWeight: 600 }}>{c.namn}</span>
                </div>
                <span style={{ fontSize: "12px", color: C.textMuted }}>
                  {new Date(c.skapad).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
              <p style={{ fontSize: "15px", color: C.text, lineHeight: 1.75, margin: 0 }}>{c.text}</p>
            </div>
          );
        })}

        <div style={{ borderTop: comments.length > 0 ? `1px solid ${C.border}` : "none", paddingTop: comments.length > 0 ? "24px" : 0 }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px 0" }}>
            Lämna en kommentar
          </p>
          <form onSubmit={postComment}>
            <input
              type="text"
              placeholder="Namn (valfritt)"
              value={namn}
              onChange={e => setNamn(e.target.value)}
              maxLength={80}
              style={{ ...inputStyle, marginBottom: "10px" }}
            />
            <textarea
              placeholder="Skriv din kommentar…"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={1000}
              rows={4}
              style={{ ...inputStyle, marginBottom: "12px", resize: "vertical" }}
            />
            <div
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              data-callback="onCommentTurnstileVerified"
              data-theme="dark"
              style={{ marginBottom: "12px" }}
            />
            {formError && (
              <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 10px 0" }}>{formError}</p>
            )}
            {sent && (
              <p style={{ color: C.green, fontSize: "13px", margin: "0 0 10px 0", fontFamily: "monospace" }}>
                ✓ Kommentaren publicerades!
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={sending || !turnstileToken}
                style={{ background: `${C.accent}12`, border: `1px solid ${C.accent}40`, color: C.accent, padding: "10px 24px", borderRadius: "4px", fontSize: "14px", cursor: (sending || !turnstileToken) ? "not-allowed" : "pointer", fontFamily: "Georgia, serif", opacity: (sending || !turnstileToken) ? 0.5 : 1 }}
              >
                {sending ? "Skickar…" : "Skicka kommentar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
