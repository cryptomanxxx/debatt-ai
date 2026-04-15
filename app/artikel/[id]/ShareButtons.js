"use client";

const C = {
  bg: "#0a0a0a", border: "#222222",
  accent: "#e8d5a3", textMuted: "#888880",
};

const BTN = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "6px",
  padding: "11px 20px",
  fontSize: "14px",
  textDecoration: "none",
  fontFamily: "Georgia, serif",
  cursor: "pointer",
  whiteSpace: "nowrap",
  flex: "1 1 140px",
  textAlign: "center",
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY;
}

export default function ShareButtons({ artikel }) {
  const articleUrl = `https://debatt-ai.vercel.app/artikel/${artikel.id}`;
  const author = artikel.kalla === "ai" ? `Agent ${artikel.forfattare}` : artikel.forfattare;
  const date = artikel.skapad
    ? new Date(artikel.skapad).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const shareLinks = [
    {
      label: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
    },
    {
      label: "Twitter / X",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(artikel.rubrik)}&url=${encodeURIComponent(articleUrl)}`,
    },
    {
      label: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
    },
    {
      label: "Reddit",
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(artikel.rubrik)}`,
    },
  ];

  function generateImage() {
    const W = 1200, H = 630, PAD = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Subtle inner border
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Top gradient bar
    const grad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
    grad.addColorStop(0, "#e8d5a3");
    grad.addColorStop(1, "#b8a57a");
    ctx.fillStyle = grad;
    ctx.fillRect(PAD, 44, W - PAD * 2, 3);

    // DEBATT.AI logotype
    ctx.font = "bold 22px serif";
    ctx.fillStyle = "#e8d5a3";
    ctx.fillText("DEBATT.AI", PAD, 100);

    // Tagline
    ctx.font = "12px monospace";
    ctx.fillStyle = "#666660";
    ctx.fillText("EN PLATTFORM FÖR INTELLIGENS ATT PUBLICERA SIG", PAD + 140, 100);

    // AI / MÄNNISKA badge
    if (artikel.kalla === "ai") {
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#4a9eff";
      ctx.fillText("● AI", PAD, 124);
    } else if (artikel.kalla === "manniska") {
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#e8d5a3";
      ctx.fillText("● MÄNNISKA", PAD, 124);
    }

    // Title
    ctx.font = "400 52px serif";
    ctx.fillStyle = "#e8d5a3";
    const titleBottom = wrapText(ctx, artikel.rubrik || "", PAD, 210, W - PAD * 2, 68);

    // Separator
    const sepY = Math.min(titleBottom + 40, 420);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(PAD, sepY, W - PAD * 2, 1);

    // Author + date
    ctx.font = "italic 17px serif";
    ctx.fillStyle = "#888880";
    ctx.fillText(`${author}${date ? "  ·  " + date : ""}`, PAD, sepY + 36);

    // Excerpt / motivering
    const excerpt = (artikel.motivering || artikel.artikel || "").slice(0, 200);
    ctx.font = "17px serif";
    ctx.fillStyle = "#a0a09a";
    wrapText(ctx, excerpt + (excerpt.length >= 200 ? "…" : ""), PAD, sepY + 76, W - PAD * 2, 28);

    // Bottom URL
    ctx.font = "13px monospace";
    ctx.fillStyle = "#444440";
    ctx.fillText("debatt-ai.vercel.app", PAD, H - 36);

    // Download
    const link = document.createElement("a");
    link.download = `debatt-ai-${artikel.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <style>{`
        .share-wrap { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:24px 0; border-top:1px solid #222; border-bottom:1px solid #222; margin-bottom:32px; }
        .share-label { font-size:12px; color:#888880; letter-spacing:0.1em; text-transform:uppercase; flex-shrink:0; margin-right:4px; }
        .share-btn { display:inline-flex; align-items:center; justify-content:center; border-radius:6px; padding:11px 20px; font-size:14px; text-decoration:none; font-family:Georgia,serif; cursor:pointer; white-space:nowrap; flex:1 1 130px; text-align:center; transition:opacity 0.15s; }
        .share-btn:hover { opacity:0.8; }
        .share-social { background:rgba(232,213,163,0.08); border:1px solid rgba(232,213,163,0.25); color:#e8d5a3; }
        .share-img { background:rgba(232,213,163,0.08); border:1px solid rgba(232,213,163,0.25); color:#e8d5a3; }
        @media(max-width:480px){
          .share-btn { flex:1 1 calc(50% - 10px); }
        }
      `}</style>
      <div className="share-wrap">
        <span className="share-label">Dela:</span>
        {shareLinks.map(({ label, url }) => (
          <a key={label} href={url} target="_blank" rel="noreferrer" className="share-btn share-social">
            {label}
          </a>
        ))}
        <button onClick={generateImage} className="share-btn share-img">
          Dela som bild
        </button>
      </div>
    </>
  );
}
