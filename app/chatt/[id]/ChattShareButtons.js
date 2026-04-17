"use client";

const AGENT_FARG = {
  "Nationalekonom":"#6abf6a","Miljöaktivist":"#4ade80","Teknikoptimist":"#38bdf8",
  "Konservativ debattör":"#b8862a","Jurist":"#d4945a","Journalist":"#a78bfa",
  "Filosof":"#e879f9","Läkare":"#f87171","Psykolog":"#fb923c",
  "Historiker":"#fbbf24","Sociolog":"#34d399","Kryptoanalytiker":"#f59e0b",
  "Den hungriga":"#86efac","Mamman":"#f9a8d4","Den sura":"#94a3b8",
  "Den trötta":"#7dd3fc","Den stressade":"#fca5a5","Den lugna":"#a7f3d0",
  "Pensionären":"#d8b4fe","Tonåringen":"#fdba74","Den nostalgiske":"#fde68a",
  "Hypokondrikern":"#6ee7b7","Optimisten":"#fcd34d","Den rike":"#c4b5fd",
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

export default function ChattShareButtons({ debatt, debattId }) {
  const url = `https://debatt-ai.vercel.app/chatt/${debattId}`;
  const agenter = Array.isArray(debatt.agenter) ? debatt.agenter : [];

  const shareLinks = [
    {
      label: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "Twitter / X",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`AI-debatt: ${debatt.amne}`)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: "Reddit",
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`AI-debatt: ${debatt.amne}`)}`,
    },
  ];

  function generateImage() {
    const W = 1200, H = 630, PAD = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Inner border
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Top gradient bar
    const grad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
    grad.addColorStop(0, "#c8b89a");
    grad.addColorStop(1, "#8a7a6a");
    ctx.fillStyle = grad;
    ctx.fillRect(PAD, 44, W - PAD * 2, 3);

    // DEBATT.AI logotype
    ctx.font = "bold 22px serif";
    ctx.fillStyle = "#c8b89a";
    ctx.fillText("DEBATT.AI", PAD, 100);

    // Tagline
    ctx.font = "12px monospace";
    ctx.fillStyle = "#555";
    ctx.fillText("DIREKTDEBATT", PAD + 140, 100);

    // Agent names with colors
    let agentX = PAD;
    const agentY = 132;
    ctx.font = "bold 11px monospace";
    agenter.forEach((a, i) => {
      const farg = AGENT_FARG[a] || "#c8b89a";
      ctx.fillStyle = farg;
      ctx.fillText(i === 0 ? a : `  ·  ${a}`, agentX, agentY);
      agentX += ctx.measureText(i === 0 ? a : `  ·  ${a}`).width;
    });

    // Topic / title
    ctx.font = "400 52px serif";
    ctx.fillStyle = "#c8b89a";
    const titleBottom = wrapText(ctx, debatt.amne || "", PAD, 220, W - PAD * 2, 68);

    // Separator
    const sepY = Math.min(titleBottom + 40, 420);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(PAD, sepY, W - PAD * 2, 1);

    // Summering
    if (debatt.summering) {
      ctx.font = "italic 17px serif";
      ctx.fillStyle = "#a0a09a";
      wrapText(ctx, debatt.summering, PAD, sepY + 36, W - PAD * 2, 28);
    }

    // Bottom URL
    ctx.font = "13px monospace";
    ctx.fillStyle = "#444";
    ctx.fillText(`debatt-ai.vercel.app/chatt/${debattId}`, PAD, H - 36);

    const link = document.createElement("a");
    link.download = `debatt-ai-chatt-${debattId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <style>{`
        .share-wrap{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:24px 0;border-top:1px solid #222;border-bottom:1px solid #222;margin-bottom:32px}
        .share-label{font-size:12px;color:#888;letter-spacing:0.1em;text-transform:uppercase;flex-shrink:0;margin-right:4px}
        .share-btn{display:inline-flex;align-items:center;justify-content:center;border-radius:6px;padding:11px 20px;font-size:14px;text-decoration:none;font-family:Georgia,serif;cursor:pointer;white-space:nowrap;flex:1 1 130px;text-align:center;transition:opacity 0.15s;background:rgba(200,184,154,0.08);border:1px solid rgba(200,184,154,0.25);color:#c8b89a}
        .share-btn:hover{opacity:0.8}
        @media(max-width:480px){.share-btn{flex:1 1 calc(50% - 10px)}}
      `}</style>
      <div className="share-wrap">
        <span className="share-label">Dela:</span>
        {shareLinks.map(({ label, url }) => (
          <a key={label} href={url} target="_blank" rel="noreferrer" className="share-btn">{label}</a>
        ))}
        <button onClick={generateImage} className="share-btn">Dela som bild</button>
      </div>
    </>
  );
}
