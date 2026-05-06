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

function AgentTestCard({ namn, amplitude, speaking, onTest, onRecord, localState, didState, onGenerate, kon, onKonChange }) {
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

      {/* Könsval */}
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

      {/* Lyssna */}
      <button onClick={() => onTest(namn)} style={{
        width: "100%", marginBottom: "10px",
        background: speaking ? farg+"22" : "transparent",
        border: `1px solid ${farg}50`, color: farg,
        borderRadius: "4px", padding: "10px", fontSize: "13px",
        cursor: "pointer", fontFamily: "Georgia, serif",
      }}>
        {speaking ? "⏸ Spelar..." : "▶ Lyssna"}
      </button>

      {/* Spela in video (utan D-ID) */}
      <button onClick={() => onRecord(namn)} disabled={localState.recording} style={{
        width: "100%", marginBottom: "16px",
        background: localState.recording ? farg+"11" : `${farg}28`,
        border: `1px solid ${farg}60`, color: localState.recording ? C.textMuted : farg,
        borderRadius: "4px", padding: "10px", fontSize: "13px",
        cursor: localState.recording ? "not-allowed" : "pointer",
        fontFamily: "Georgia, serif", fontWeight: 600,
      }}>
        {localState.recording ? "⏺ Spelar in..." : "🎬 Spela in video"}
      </button>

      {localState.error && (
        <p style={{ color: "#f87171", fontSize: "12px", margin: "-8px 0 12px 0" }}>{localState.error}</p>
      )}

      {localState.url && (
        <div style={{ marginBottom: "16px" }}>
          <video src={localState.url} controls playsInline
            style={{ width: "100%", borderRadius: "8px", border: `1px solid ${farg}30` }} />
          <a href={localState.url} download={`${slug}-video.webm`} style={{
            display: "block", textAlign: "center", marginTop: "10px",
            background: `${farg}18`, border: `1px solid ${farg}40`,
            color: farg, borderRadius: "4px", padding: "10px",
            fontSize: "13px", textDecoration: "none", fontFamily: "Georgia, serif",
          }}>
            ⬇ Spara video
          </a>
        </div>
      )}

      {/* D-ID (om krediter finns) */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
        <p style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px 0" }}>D-ID lip-sync (kräver krediter)</p>
        <button onClick={() => onGenerate(namn)} disabled={didState.loading} style={{
          width: "100%",
          background: "transparent",
          border: `1px solid ${C.border}`, color: C.textMuted,
          borderRadius: "4px", padding: "8px", fontSize: "12px",
          cursor: didState.loading ? "not-allowed" : "pointer",
          fontFamily: "Georgia, serif",
        }}>
          {didState.loading ? "⏳ Genererar..." : didState.url ? "↺ Ny D-ID video" : "🎬 Generera D-ID video"}
        </button>
        {didState.error && <p style={{ color: "#f87171", fontSize: "11px", margin: "6px 0 0 0" }}>{didState.error}</p>}
        {didState.url && (
          <>
            <video src={didState.url} controls autoPlay loop playsInline
              style={{ width: "100%", borderRadius: "8px", marginTop: "10px", border: `1px solid ${farg}30` }} />
            <a href={didState.url} download={`${slug}-did.mp4`} style={{
              display: "block", textAlign: "center", marginTop: "8px",
              background: `${farg}18`, border: `1px solid ${farg}40`,
              color: farg, borderRadius: "4px", padding: "8px",
              fontSize: "12px", textDecoration: "none", fontFamily: "Georgia, serif",
            }}>⬇ Spara D-ID video</a>
          </>
        )}
      </div>
    </div>
  );
}

export default function PoddTestPage() {
  const [authed, setAuthed]       = useState(false);
  const [pw, setPw]               = useState("");
  const [pwError, setPwError]     = useState("");
  const [amplitude, setAmplitude] = useState(0);
  const [speaking, setSpeaking]   = useState(null);
  const [testText, setTestText]   = useState(
    "Det finns tydliga samband som vi inte kan ignorera. Frågan är om vi är beredda att ta konsekvenserna av det vi vet."
  );
  const [didStates, setDidStates] = useState(
    Object.fromEntries(TEST_AGENTER.map(n => [n, { loading: false, url: null, error: null }]))
  );
  const [localStates, setLocalStates] = useState(
    Object.fromEntries(TEST_AGENTER.map(n => [n, { recording: false, url: null, error: null }]))
  );
  const [konVal, setKonVal] = useState(
    Object.fromEntries(TEST_AGENTER.map(n => [n, "man"]))
  );

  const autoplayRef = useRef(true);
  const audioCtxRef = useRef(null); // används av recordLocalVideo
  const audioSrcRef = useRef(null); // används av recordLocalVideo

  function login() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(""); }
    else setPwError("Fel lösenord.");
  }

  function stopAudio() {
    try { window.responsiveVoice?.cancel(); } catch {}
    autoplayRef.current = false;
    try { audioSrcRef.current?.stop(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    setSpeaking(null); setAmplitude(0);
  }

  function testRost(namn) {
    if (speaking) { stopAudio(); return; }
    if (!window.responsiveVoice) { alert("ResponsiveVoice laddar, försök igen om ett ögonblick."); return; }
    setSpeaking(namn);
    const voice = konVal[namn] === "kvinna" ? "Swedish Female" : "Swedish Male";
    let iv;
    window.responsiveVoice.speak(testText, voice, {
      onstart: () => {
        iv = setInterval(() => {
          const t = Date.now();
          setAmplitude(Math.max(0.05, 0.35 + 0.55 * Math.sin(t * 0.009) * Math.abs(Math.cos(t * 0.014))));
        }, 70);
      },
      onend: () => { clearInterval(iv); setAmplitude(0); setSpeaking(null); },
      onerror: () => { clearInterval(iv); setAmplitude(0); setSpeaking(null); },
    });
  }

  async function recordLocalVideo(namn) {
    const slug = agentSlug(namn);
    const farg = AGENT_FARG[namn];
    const rvVoice = konVal[namn] === "kvinna" ? "Swedish Female" : "Swedish Male";

    setLocalStates(prev => ({ ...prev, [namn]: { recording: true, url: null, error: null } }));

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve; img.onerror = reject;
        img.src = `/avatarer/podd/${slug}.png`;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 512; canvas.height = 512;
      const ctx2d = canvas.getContext("2d");

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      await audioCtx.resume();
      const mixDest = audioCtx.createMediaStreamDestination();

      const videoStream = canvas.captureStream(25);
      const combined = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...mixDest.stream.getAudioTracks(),
      ]);
      const mimeType = ["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"]
        .find(t => MediaRecorder.isTypeSupported(t)) || "video/webm";
      const recorder = new MediaRecorder(combined, { mimeType });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const drawFrame = (amp = 0) => {
        ctx2d.fillStyle = "#080808";
        ctx2d.fillRect(0, 0, 512, 512);
        const s = 1 + amp * 0.025;
        const off = (512 * s - 512) / 2;
        ctx2d.drawImage(img, -off, -off, 512 * s, 512 * s);
        if (amp > 0.05) {
          ctx2d.save();
          ctx2d.shadowColor = farg;
          ctx2d.shadowBlur = 20 + amp * 40;
          ctx2d.strokeStyle = farg + "99";
          ctx2d.lineWidth = 3;
          ctx2d.strokeRect(2, 2, 508, 508);
          ctx2d.restore();
        }
        ctx2d.fillStyle = "#ffffffcc";
        ctx2d.font = "bold 22px Georgia, serif";
        ctx2d.textAlign = "center";
        ctx2d.fillText(namn, 256, 496);
      };

      drawFrame(0);
      recorder.start(100);

      // Fetch audio server-side (no CORS) and decode into AudioContext.
      const sentences = testText.replace(/\n+/g, " ").match(/[^.!?]+[.!?]*/g) || [testText];
      const gender = konVal[namn];

      for (const sentence of sentences) {
        const trimmed = sentence.trim().slice(0, 500);
        if (!trimmed) continue;
        try {
          const resp = await fetch(`/api/rv-tts?text=${encodeURIComponent(trimmed)}&gender=${gender}`);
          if (!resp.ok) continue;
          const buf = await resp.arrayBuffer();
          const audioBuf = await audioCtx.decodeAudioData(buf);
          const analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
          const src = audioCtx.createBufferSource();
          src.buffer = audioBuf;
          src.connect(analyser);
          analyser.connect(mixDest);
          analyser.connect(audioCtx.destination);
          const data = new Uint8Array(analyser.frequencyBinCount);
          let rafId;
          const animate = () => {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
            drawFrame(Math.min(1, Math.sqrt(sum / data.length) * 8));
            rafId = requestAnimationFrame(animate);
          };
          await new Promise(resolve => {
            src.onended = () => { cancelAnimationFrame(rafId); drawFrame(0); resolve(); };
            src.start(0);
            animate();
            setTimeout(resolve, audioBuf.duration * 1000 + 800);
          });
        } catch { /* hoppa över mening */ }
      }

      recorder.stop();
      await new Promise(resolve => { recorder.onstop = resolve; });
      await audioCtx.close();

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setLocalStates(prev => ({ ...prev, [namn]: { recording: false, url, error: null } }));
    } catch (e) {
      setLocalStates(prev => ({ ...prev, [namn]: { recording: false, url: null, error: e.message } }));
    }
  }

  async function generateDID(namn) {
    setDidStates(prev => ({ ...prev, [namn]: { loading: true, url: null, error: null } }));
    try {
      const createRes = await fetch("/api/did", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: namn, text: testText, kon: konVal[namn] }),
      });
      const { id, error: createErr } = await createRes.json();
      if (createErr || !id) throw new Error(createErr || "Kunde inte starta");
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
          <p style={{ color: C.textMuted, fontSize: "13px", margin: "0 0 28px 0", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Video</p>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()} placeholder="Lösenord"
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
            <p style={{ color: C.textMuted, fontSize: "13px", margin: 0 }}>Klistra in text, lyssna och spela in video</p>
          </div>
          <a href="/admin" style={{ marginLeft: "auto", color: C.textMuted, fontSize: "13px", textDecoration: "none", whiteSpace: "nowrap", paddingTop: "4px" }}>← Admin</a>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px 0" }}>Text</p>
          <textarea value={testText} onChange={e => setTestText(e.target.value)} rows={5}
            style={{ width: "100%", boxSizing: "border-box", background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "4px", color: C.text, fontFamily: "Georgia, serif", fontSize: "14px", padding: "10px 12px", resize: "vertical", outline: "none" }} />
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {TEST_AGENTER.map(namn => (
            <AgentTestCard key={namn}
              namn={namn}
              amplitude={speaking === namn ? amplitude : 0}
              speaking={speaking === namn}
              onTest={testRost}
              onRecord={recordLocalVideo}
              localState={localStates[namn]}
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
