"use client";
import { useState, useRef } from "react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const C = {
  bg: "#080808", surface: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e0d0", textMuted: "#555", accent: "#c8b89a",
};

const TEST_AGENTER = ["Nationalekonom", "Miljöaktivist", "Teknikoptimist"];

const AGENT_FARG = {
  "Nationalekonom": "#6abf6a",
  "Miljöaktivist":  "#4ade80",
  "Teknikoptimist": "#38bdf8",
};

function agentSlug(namn) {
  return namn.toLowerCase()
    .replace(/ä/g, "a").replace(/å/g, "a").replace(/ö/g, "o")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function AgentTestCard({ namn, amplitude, speaking, onTest, didState, onGenerate, kon, onKonChange }) {
  const farg = AGENT_FARG[namn];
  const slug = agentSlug(namn);
  const scale = speaking ? 1 + amplitude * 0.04 : 1;
  const glow  = speaking ? 10 + amplitude * 26 : 0;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px", flex: "1 1 220px" }}>

      {/* Avatar */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <div style={{
          width: "200px", height: "200px", flexShrink: 0,
          borderRadius: "50%", overflow: "hidden",
          border: `3px solid ${speaking ? farg : "#1a1a1a"}`,
          boxShadow: speaking ? `0 0 ${glow}px ${farg}70, 0 0 ${glow*2}px ${farg}25` : "none",
          transform: `scale(${scale})`, transition: "transform 0.07s ease-out",
        }}>
          <img src={`/avatarer/podd/${slug}.png`} alt={namn}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>

      <p style={{ textAlign: "center", color: farg, fontSize: "14px", fontWeight: 600, margin: "0 0 14px 0" }}>{namn}</p>

      {/* Könsval för röst */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["man", "kvinna"].map(k => (
          <button key={k} onClick={() => onKonChange(k)} style={{
            flex: 1, padding: "7px", fontSize: "12px", borderRadius: "4px", cursor: "pointer",
            fontFamily: "Georgia, serif", border: `1px solid ${kon === k ? farg+"80" : C.border}`,
            background: kon === k ? farg+"18" : "transparent",
            color: kon === k ? farg : C.textMuted,
          }}>
            {k === "man" ? "♂ Man" : "♀ Kvinna"}
          </button>
        ))}
      </div>

      {/* TTS-test */}
      <button onClick={() => onTest(namn)} style={{
        width: "100%", marginBottom: "16px",
        background: speaking ? farg+"22" : "transparent",
        border: `1px solid ${farg}50`, color: farg,
        borderRadius: "4px", padding: "10px", fontSize: "13px",
        cursor: "pointer", fontFamily: "Georgia, serif",
      }}>
        {speaking ? "⏸ Spelar..." : "▶ Lyssna"}
      </button>

      {/* D-ID video-generering */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
        <button onClick={() => onGenerate(namn)} disabled={didState.loading} style={{
          width: "100%",
          background: didState.loading ? farg+"11" : `${farg}18`,
          border: `1px solid ${farg}40`, color: didState.loading ? C.textMuted : farg,
          borderRadius: "4px", padding: "10px", fontSize: "13px",
          cursor: didState.loading ? "not-allowed" : "pointer",
          fontFamily: "Georgia, serif",
        }}>
          {didState.loading ? "⏳ Genererar (~15 sek)..." : didState.url ? "↺ Generera ny video" : "🎬 Generera video"}
        </button>

        {didState.error && (
          <p style={{ color: "#f87171", fontSize: "12px", margin: "8px 0 0 0" }}>{didState.error}</p>
        )}

        {didState.url && (
          <>
            <video src={didState.url} controls autoPlay loop playsInline
              style={{ width: "100%", borderRadius: "8px", marginTop: "12px", border: `1px solid ${farg}30` }} />
            <a href={didState.url} download={`${slug}-video.mp4`} style={{
              display: "block", textAlign: "center", marginTop: "10px",
              background: `${farg}18`, border: `1px solid ${farg}40`,
              color: farg, borderRadius: "4px", padding: "10px",
              fontSize: "13px", textDecoration: "none", fontFamily: "Georgia, serif",
            }}>
              ⬇ Spara video
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function PoddTestPage() {
  const [authed, setAuthed]     = useState(false);
  const [pw, setPw]             = useState("");
  const [pwError, setPwError]   = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [speaking, setSpeaking] = useState(null);
  const [testText, setTestText] = useState(
    "Det finns tydliga samband som vi inte kan ignorera. Frågan är om vi är beredda att ta konsekvenserna av det vi vet."
  );
  const [didStates, setDidStates] = useState(
    Object.fromEntries(TEST_AGENTER.map(n => [n, { loading: false, url: null, error: null }]))
  );
  const [konVal, setKonVal] = useState(
    Object.fromEntries(TEST_AGENTER.map(n => [n, "man"]))
  );

  const autoplayRef = useRef(true);
  const audioCtxRef = useRef(null);
  const audioSrcRef = useRef(null);

  function login() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(""); }
    else setPwError("Fel lösenord.");
  }

  function stopAudio() {
    autoplayRef.current = false;
    try { audioSrcRef.current?.stop(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    setSpeaking(null);
    setAmplitude(0);
  }

  async function testRost(namn) {
    if (speaking) { stopAudio(); return; }
    setSpeaking(namn);
    autoplayRef.current = true;
    try {
      const resp = await fetch(`/api/tts?text=${encodeURIComponent(testText.slice(0, 200))}`);
      if (!resp.ok) throw new Error("tts");
      const buf = await resp.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const audioBuf = await ctx.decodeAudioData(buf);
      const analyser = ctx.createAnalyser(); analyser.fftSize = 256;
      const src = ctx.createBufferSource(); audioSrcRef.current = src;
      src.buffer = audioBuf; src.connect(analyser); analyser.connect(ctx.destination);
      const data = new Uint8Array(analyser.frequencyBinCount); let rafId;
      const tick = () => {
        if (!autoplayRef.current) { cancelAnimationFrame(rafId); setAmplitude(0); return; }
        analyser.getByteTimeDomainData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i]-128)/128; sum += v*v; }
        setAmplitude(Math.min(1, Math.sqrt(sum/data.length)*8)); rafId = requestAnimationFrame(tick);
      };
      await new Promise(resolve => {
        const cleanup = () => { cancelAnimationFrame(rafId); try { ctx.close(); } catch {} setAmplitude(0); resolve(); };
        src.onended = cleanup; src.start(0); tick();
        setTimeout(cleanup, audioBuf.duration * 1000 + 1000);
      });
    } catch { setAmplitude(0); }
    setSpeaking(null);
  }

  async function generateDID(namn) {
    setDidStates(prev => ({ ...prev, [namn]: { loading: true, url: null, error: null } }));
    try {
      const createRes = await fetch("/api/did", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: namn, text: testText, kon: konVal[namn] }),
      });
      const { id, error: createErr } = await createRes.json();
      if (createErr || !id) throw new Error(createErr || "Kunde inte starta video-generering");

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(`/api/did?id=${id}`);
        const { status, result_url, error: pollErr } = await pollRes.json();
        if (pollErr) throw new Error(pollErr);
        if (status === "done" && result_url) {
          setDidStates(prev => ({ ...prev, [namn]: { loading: false, url: result_url, error: null } }));
          return;
        }
        if (status === "error") throw new Error("D-ID rapporterade ett fel");
      }
      throw new Error("Timeout — försök igen");
    } catch (e) {
      setDidStates(prev => ({ ...prev, [namn]: { loading: false, url: null, error: e.message } }));
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
        <div style={{ width: "320px", padding: "40px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 400, color: C.accent, margin: "0 0 6px 0", fontFamily: "Times New Roman, serif" }}>DEBATT-AI</h1>
          <p style={{ color: C.textMuted, fontSize: "13px", margin: "0 0 28px 0", letterSpacing: "0.1em", textTransform: "uppercase" }}>Podd-test</p>
          <input type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="Lösenord"
            style={{ background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px", color: C.text, fontFamily: "Georgia, serif", fontSize: "14px", padding: "10px 12px", width: "100%", boxSizing: "border-box", outline: "none", marginBottom: "12px" }}
            autoFocus />
          {pwError && <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 12px 0" }}>{pwError}</p>}
          <button onClick={login} style={{ background: C.accent, color: "#080808", border: "none", borderRadius: "4px", padding: "13px", width: "100%", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "Georgia, serif" }}>
            Logga in →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px 0" }}>Admin</p>
            <h1 style={{ fontSize: "26px", fontWeight: 400, margin: "0 0 6px 0" }}>AI Video</h1>
            <p style={{ color: C.textMuted, fontSize: "13px", margin: 0 }}>Klistra in text, lyssna och generera video</p>
          </div>
          <a href="/admin" style={{ marginLeft: "auto", color: C.textMuted, fontSize: "13px", textDecoration: "none", whiteSpace: "nowrap", paddingTop: "4px" }}>← Admin</a>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px 0" }}>Text</p>
          <textarea value={testText} onChange={e => setTestText(e.target.value)} rows={4}
            style={{ width: "100%", boxSizing: "border-box", background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px", color: C.text, fontFamily: "Georgia, serif", fontSize: "14px", padding: "10px 12px", resize: "vertical", outline: "none" }} />
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {TEST_AGENTER.map(namn => (
            <AgentTestCard key={namn}
              namn={namn}
              amplitude={speaking === namn ? amplitude : 0}
              speaking={speaking === namn}
              onTest={testRost}
              didState={didStates[namn]}
              onGenerate={generateDID}
              kon={konVal[namn]}
              onKonChange={k => setKonVal(prev => ({ ...prev, [namn]: k }))}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
