"use client";
import { useState } from "react";

const AGENT_FARG = {
  "Nationalekonom":"#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör":"#b8862a","Jurist":"#d4945a","Journalist":"#facc15",
  "Filosof":"#e879f9","Läkare":"#f87171","Psykolog":"#facc15",
  "Historiker":"#facc15","Sociolog":"#34d399","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":"#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":"#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":"#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":"#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
};

const AGENT_RÖST = {
  "Nationalekonom":       { pitch: 1.0,  rate: 0.90 },
  "Miljöaktivist":        { pitch: 1.1,  rate: 1.05 },
  "Teknikoptimist":       { pitch: 1.1,  rate: 1.10 },
  "Konservativ debattör": { pitch: 0.90, rate: 0.85 },
  "Jurist":               { pitch: 0.95, rate: 0.90 },
  "Journalist":           { pitch: 1.0,  rate: 1.10 },
  "Filosof":              { pitch: 0.90, rate: 0.80 },
  "Läkare":               { pitch: 1.0,  rate: 0.95 },
  "Psykolog":             { pitch: 1.05, rate: 0.85 },
  "Historiker":           { pitch: 0.95, rate: 0.90 },
  "Sociolog":             { pitch: 1.0,  rate: 1.00 },
  "Kryptoanalytiker":     { pitch: 1.05, rate: 1.10 },
  "Den hungriga":         { pitch: 0.95, rate: 0.90 },
  "Mamman":               { pitch: 1.10, rate: 0.95 },
  "Den sura":             { pitch: 0.90, rate: 1.05 },
  "Den trötta":           { pitch: 0.88, rate: 0.75 },
  "Den stressade":        { pitch: 1.05, rate: 1.20 },
  "Den lugna":            { pitch: 1.0,  rate: 0.78 },
  "Pensionären":          { pitch: 0.85, rate: 0.82 },
  "Tonåringen":           { pitch: 1.10, rate: 1.15 },
  "Den nostalgiske":      { pitch: 0.95, rate: 0.85 },
  "Hypokondrikern":       { pitch: 1.05, rate: 1.05 },
  "Optimisten":           { pitch: 1.10, rate: 1.05 },
  "Den rike":             { pitch: 0.95, rate: 0.88 },
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "", currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else { line = testLine; }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY;
}

export default function ChattShareButtons({ debatt, shareUrl, inlagg, hideListen = false }) {
  const [copied, setCopied] = useState(false);
  const [spelar, setSpelar] = useState(false);
  const agenter = Array.isArray(debatt.agenter) ? debatt.agenter : [];

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function lyssna() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const entries = Array.isArray(inlagg) && inlagg.length > 0
      ? inlagg
      : debatt.summering ? [{ agent: null, text: debatt.summering }] : [];
    if (!entries.length) return;
    setSpelar(true);
    let idx = 0;
    function spelaNext() {
      if (idx >= entries.length) { setSpelar(false); return; }
      const e = entries[idx];
      const utt = new SpeechSynthesisUtterance(e.text);
      utt.lang = "sv-SE";
      const röst = e.agent ? (AGENT_RÖST[e.agent] || { pitch: 1.0, rate: 1.0 }) : { pitch: 1.0, rate: 0.9 };
      utt.pitch = röst.pitch;
      utt.rate = röst.rate;
      utt.onend = () => { idx++; setTimeout(spelaNext, 400); };
      utt.onerror = () => setSpelar(false);
      window.speechSynthesis.speak(utt);
    }
    spelaNext();
  }

  function stoppLyssna() {
    window.speechSynthesis?.cancel();
    setSpelar(false);
  }

  const shareLinks = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { label: "Twitter / X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`AI-debatt: ${debatt.amne}`)}&url=${encodeURIComponent(shareUrl)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
    { label: "Reddit", href: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`AI-debatt: ${debatt.amne}`)}` },
  ];

  function generateImage() {
    const W = 1200, H = 630, PAD = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e1e1e"; ctx.lineWidth = 1; ctx.strokeRect(20, 20, W - 40, H - 40);
    const grad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
    grad.addColorStop(0, "#c8b89a"); grad.addColorStop(1, "#8a7a6a");
    ctx.fillStyle = grad; ctx.fillRect(PAD, 44, W - PAD * 2, 3);
    ctx.font = "bold 22px serif"; ctx.fillStyle = "#c8b89a"; ctx.fillText("DEBATT-AI", PAD, 100);
    ctx.font = "12px monospace"; ctx.fillStyle = "#555"; ctx.fillText("DIREKTDEBATT", PAD + 140, 100);
    let agentX = PAD; ctx.font = "bold 11px monospace";
    agenter.forEach((a, i) => {
      const farg = AGENT_FARG[a] || "#c8b89a"; ctx.fillStyle = farg;
      const label = i === 0 ? a : `  ·  ${a}`; ctx.fillText(label, agentX, 132);
      agentX += ctx.measureText(label).width;
    });
    ctx.font = "400 52px serif"; ctx.fillStyle = "#c8b89a";
    const titleBottom = wrapText(ctx, debatt.amne || "", PAD, 220, W - PAD * 2, 68);
    const sepY = Math.min(titleBottom + 40, 420);
    ctx.fillStyle = "#2a2a2a"; ctx.fillRect(PAD, sepY, W - PAD * 2, 1);
    if (debatt.summering) {
      ctx.font = "italic 17px serif"; ctx.fillStyle = "#a0a09a";
      wrapText(ctx, debatt.summering, PAD, sepY + 36, W - PAD * 2, 28);
    }
    ctx.font = "13px monospace"; ctx.fillStyle = "#444";
    ctx.fillText(shareUrl.replace("https://", ""), PAD, H - 36);
    const link = document.createElement("a");
    link.download = `debatt-ai-chatt.png`; link.href = canvas.toDataURL("image/png"); link.click();
  }

  return (
    <>
      <style>{`
        .chatt-share-wrap{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:24px 0;border-top:1px solid #222;border-bottom:1px solid #222;margin-bottom:24px}
        .chatt-share-label{font-size:12px;color:#888;letter-spacing:0.1em;text-transform:uppercase;flex-shrink:0;margin-right:4px}
        .chatt-share-btn{display:inline-flex;align-items:center;justify-content:center;border-radius:6px;padding:11px 20px;font-size:14px;text-decoration:none;font-family:Georgia,serif;cursor:pointer;white-space:nowrap;flex:1 1 130px;text-align:center;transition:opacity 0.15s;background:rgba(200,184,154,0.08);border:1px solid rgba(200,184,154,0.25);color:#c8b89a}
        .chatt-share-btn:hover{opacity:0.8}
        @media(max-width:480px){.chatt-share-btn{flex:1 1 calc(50% - 10px)}}
      `}</style>
      <div className="chatt-share-wrap">
        <span className="chatt-share-label">Dela:</span>
        {!hideListen && (
          <button onClick={spelar ? stoppLyssna : lyssna} className="chatt-share-btn">
            {spelar ? "⏹ Stoppa" : "🎧 Lyssna"}
          </button>
        )}
        <button onClick={copyLink} className="chatt-share-btn">
          {copied ? "✓ Kopierad!" : "🔗 Kopiera länk"}
        </button>
        {shareLinks.map(({ label, href }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="chatt-share-btn">{label}</a>
        ))}
        <button onClick={generateImage} className="chatt-share-btn">Dela som bild</button>
      </div>
    </>
  );
}
