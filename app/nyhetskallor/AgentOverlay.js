"use client";
import { useEffect, useRef, useState } from "react";

// Bildramarna (anna/nationalekonom/johan/oraklet, 58 filer) flyttades till
// Supabase Storage sep 2026 — Vercels Deployment Storage-gräns (10 GB free
// tier) nåddes delvis eftersom public/avatarer/podd/ (45 MB) buntades in i
// VARJE deployment. Se scripts/upload-podd-assets.js för migreringen.
export const PODD_AVATAR_BASE = "https://fmwxftnistkoqazfwnuj.supabase.co/storage/v1/object/public/podd-avatarer";

// Per-agent overlay-konfiguration. Anna, Nationalekonom (Peter),
// Teknikoptimist (Johan) och Oraklet har alla fyra fullständiga blink+mun-
// frames (samma lagerbaserade, pixelstabila arkitektur — se
// ai-bus/context.md v5.9). Exporteras tillsammans med
// AnchorImage/WaveformBar/useBlinkState så StudioOverlay.js (Anna+Peter+Johan
// i samma studio) kan återanvända exakt samma animationslogik.
export const AGENTER = {
  Anna: {
    farg: "#a0c8f0",
    roll: "Nyhetsankare",
    rvVoice: "Swedish Female",
    pitch: 1.0,
    rate: 1.0,
    hasBlink: true,
    mouthOpen:   ["anna.png", "anna-small.png", "anna-medium.png", "anna-large.png"],
    mouthHalf:   ["anna-m0-half.png", "anna-m1-half.png", "anna-m2-half.png", "anna-m3-half.png"],
    mouthClosed: ["anna-m0-closed.png", "anna-m1-closed.png", "anna-m2-closed.png", "anna-m3-closed.png"],
    idleOpen: "anna.png", idleHalf: "anna-m0-half.png", idleClosed: "anna-m0-closed.png",
  },
  Nationalekonom: {
    farg: "#6abf6a",
    roll: "Nationalekonom",
    rvVoice: "Swedish Male",
    pitch: 0.85,
    rate: 0.88,
    hasBlink: true,
    mouthOpen:   ["nationalekonom.png", "nationalekonom-small.png", "nationalekonom-medium.png", "nationalekonom-large.png"],
    mouthHalf:   ["nationalekonom-m0-half.png", "nationalekonom-m1-half.png", "nationalekonom-m2-half.png", "nationalekonom-m3-half.png"],
    mouthClosed: ["nationalekonom-m0-closed.png", "nationalekonom-m1-closed.png", "nationalekonom-m2-closed.png", "nationalekonom-m3-closed.png"],
    idleOpen: "nationalekonom.png", idleHalf: "nationalekonom-m0-half.png", idleClosed: "nationalekonom-m0-closed.png",
  },
  Teknikoptimist: {
    farg: "#f0b050",
    roll: "Teknikoptimist",
    rvVoice: "Swedish Male",
    pitch: 1.06,
    rate: 0.95,
    hasBlink: true,
    mouthOpen:   ["johan.png", "johan-small.png", "johan-medium.png", "johan-large.png"],
    mouthHalf:   ["johan-m0-half.png", "johan-m1-half.png", "johan-m2-half.png", "johan-m3-half.png"],
    mouthClosed: ["johan-m0-closed.png", "johan-m1-closed.png", "johan-m2-closed.png", "johan-m3-closed.png"],
    idleOpen: "johan.png", idleHalf: "johan-m0-half.png", idleClosed: "johan-m0-closed.png",
  },
  // Professor Oraklet — läser AI-forskningsfynd och vetenskapliga nyheter på
  // /universitet (se app/universitet/UniversitetVy.js). Levererades som ett
  // låst tillgångspaket (bas-master + låsta ögon-/munmasker + sex källbilder:
  // neutral/small/medium/large + eyes_half/eyes_closed) utan den fulla
  // mun×blink-korsprodukten Anna/Peter/Johan har. De åtta saknade m1–m3-half/
  // closed-bilderna genererades offline med Pillow — ett rent maskbaserat
  // alpha-paste av respektive mun-tillstånds mask (masks/mouth_*_feature_mask.png)
  // ovanpå eyes_half/eyes_closed-basen, verifierat med samma "0 pixlar ändrade
  // utanför masken"-metod som paketets egen docs/qc_metrics.json — INGEN
  // generativ AI-bildredigering av hela bilden, vilket paketets README
  // uttryckligen förbjuder. Bara mun+blink-regionerna komponerades ihop.
  // rate: 1.0 hålls omedveten (användarens uttryckliga önskan — "jag gillar
  // inte när man ändrar hastighet på rösten"); pitch 0.75 (djupare, äldre
  // röst) skiljer honom hörbart från Peter (0.85) och Johan (1.06) utan att
  // röra rate. Färgen är samplad ur hans egen rosett i konstverket.
  Oraklet: {
    farg: "#dd6e5f",
    roll: "Professor",
    rvVoice: "Swedish Male",
    pitch: 0.75,
    rate: 1.0,
    hasBlink: true,
    mouthOpen:   ["oraklet.png", "oraklet-small.png", "oraklet-medium.png", "oraklet-large.png"],
    mouthHalf:   ["oraklet-m0-half.png", "oraklet-m1-half.png", "oraklet-m2-half.png", "oraklet-m3-half.png"],
    mouthClosed: ["oraklet-m0-closed.png", "oraklet-m1-closed.png", "oraklet-m2-closed.png", "oraklet-m3-closed.png"],
    idleOpen: "oraklet.png", idleHalf: "oraklet-m0-half.png", idleClosed: "oraklet-m0-closed.png",
  },
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Blink-hook (samma logik som /kanal) ─────────────────────────────────────
export function useBlinkState(active) {
  const [blinkState, setBlinkState] = useState("open");
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setBlinkState("open");
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    let cancelled = false;
    const doBlink = async () => {
      if (cancelled) return;
      setBlinkState("half");
      await sleep(80);
      if (cancelled) return;
      setBlinkState("closed");
      await sleep(120);
      if (cancelled) return;
      setBlinkState("half");
      await sleep(80);
      if (cancelled) return;
      setBlinkState("open");
      timerRef.current = setTimeout(doBlink, 3000 + Math.random() * 4000);
    };
    timerRef.current = setTimeout(doBlink, 1000 + Math.random() * 2000);
    return () => { cancelled = true; if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  return blinkState;
}

// ── Amplitude-hook (samma logik som /kanal) ─────────────────────────────────
function useAmplitude(isSpeaking) {
  const amplitudeRef = useRef(1);
  const frameRef = useRef(null);
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const target = isSpeaking ? 0.5 + Math.random() * 0.5 : 0.05 + Math.random() * 0.08;
      amplitudeRef.current += (target - amplitudeRef.current) * 0.15;
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { running = false; if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [isSpeaking]);
  return amplitudeRef;
}

export function WaveformBar({ isSpeaking, isThinking, farg }) {
  const canvasRef = useRef(null);
  const amplitudeRef = useAmplitude(isSpeaking);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, BARS = 12, GAP = 3;
    const barW = (W - GAP * (BARS - 1)) / BARS;
    let frameId, dotPhase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (isThinking) {
        dotPhase += 0.06;
        const dotR = 4, dots = 3;
        const totalW = dots * dotR * 2 + (dots - 1) * 10;
        const startX = (W - totalW) / 2, cy = H / 2;
        for (let d = 0; d < dots; d++) {
          const phase = dotPhase + d * (Math.PI * 2 / 3);
          const opacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(phase));
          const scale = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(phase));
          ctx.beginPath();
          ctx.arc(startX + d * (dotR * 2 + 10) + dotR, cy, dotR * scale, 0, Math.PI * 2);
          ctx.fillStyle = farg;
          ctx.globalAlpha = opacity;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        for (let b = 0; b < BARS; b++) {
          const amp = amplitudeRef.current;
          const noise = 0.4 + Math.random() * 0.6;
          const height = Math.max(2, (H * amp * noise) * (isSpeaking ? 1 : 0.12));
          const x = b * (barW + GAP), y = (H - height) / 2;
          ctx.fillStyle = farg;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, height, 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [isSpeaking, isThinking, amplitudeRef, farg]);

  return <canvas ref={canvasRef} width={240} height={12} style={{ width: "100%", height: "12px", display: "block" }} />;
}

// mouthIdx nedan gör en viktad slumpvandring över hela indexintervallet
// (se nastaMunIndex) medan agenten talar — alla fyra munstorlekar (stängd/
// liten/medium/stor) kan visas, så samtliga förladdas. I v5s lagerbaserade
// spritearkitektur delar alla mun-lägen exakt samma bas-canvas (0 pixlars
// skillnad utanför den aktiva mun-masken, verifierat) — det gamla skälet
// att undvika index 0 (huvudet "hoppade" mellan de äldre AI-genererade
// helbildsframen) gäller alltså inte längre.
const ANVANDA_MUNINDEX = [0, 1, 2, 3];

// Värmer webbläsarens bildcache för alla frames en agent kan tänkas visa,
// innan blink/mun-animationen börjar cykla, och signalerar när det är klart.
// Utan detta byter <img src> till en okänd fil första gången ett state (t.ex.
// "closed") träffas — under kall cache (inkognito, mobilnät) hinner den
// 620–644KB stora filen ofta inte laddas+avkodas inom det 80–120ms långa
// blinkfönstret, så bytet ritas aldrig upp och blinkningen ser ut att helt
// utebli trots korrekt logik och korrekta bildfiler (bekräftat med
// bildruteanalys av en inspelad video). Att bara starta hämtningen räckte
// inte — utan att invänta den kunde ändå de första blinkningarna träffa
// ofärdiga resurser (Codex-fynd, PR #1326) — därför returneras `ready` som
// callern gatear blink-timern på.
export function usePreload(cfg) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const filnamn = new Set([
      cfg.idleOpen, cfg.idleHalf, cfg.idleClosed,
      ...ANVANDA_MUNINDEX.map(i => cfg.mouthOpen?.[i]),
      ...ANVANDA_MUNINDEX.map(i => cfg.mouthHalf?.[i]),
      ...ANVANDA_MUNINDEX.map(i => cfg.mouthClosed?.[i]),
    ].filter(Boolean));
    let cancelled = false;
    const bilder = [...filnamn].map(namn => {
      const img = new window.Image();
      const klar = new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // en trasig fil ska inte blockera animationen för evigt
      });
      img.src = `${PODD_AVATAR_BASE}/${namn}`;
      return { img, klar };
    });
    Promise.all(bilder.map(b => b.klar)).then(() => { if (!cancelled) setReady(true); });
    return () => {
      cancelled = true;
      bilder.forEach(({ img }) => { img.onload = null; img.onerror = null; img.src = ""; });
    };
  }, [cfg]);
  return ready;
}

// Nästa munindex under tal: viktad slumpvandring i intervallet
// [0, ANVANDA_MUNINDEX.length-1] som föredrar ett steg åt gången (grannsteg)
// framför fria hopp mellan ytterligheter — utan riktig ljudamplitud att
// synka mot (responsiveVoice exponerar inget råljud till sidan; se
// diskussion i PR) ger detta en mjukare, mindre ryckig rörelse än ren
// oviktad slump, utan att kräva ny ljudinfrastruktur. Upprepar aldrig
// samma index två gånger i rad.
function nastaMunIndex(nuvarande, maxIndex) {
  const kandidater = [];
  for (let i = 0; i <= maxIndex; i++) {
    if (i === nuvarande) continue;
    const steg = Math.abs(i - nuvarande);
    const vikt = steg === 1 ? 5 : steg === 2 ? 2 : 1;
    for (let k = 0; k < vikt; k++) kandidater.push(i);
  }
  return kandidater[Math.floor(Math.random() * kandidater.length)];
}

export function AnchorImage({ cfg, blinkState, isSpeaking }) {
  const [mouthIdx, setMouthIdx] = useState(1);
  useEffect(() => {
    if (!isSpeaking) { setMouthIdx(1); return; }
    const maxIndex = ANVANDA_MUNINDEX.length - 1;
    const id = setInterval(() => setMouthIdx(m => nastaMunIndex(m, maxIndex)), 220);
    return () => clearInterval(id);
  }, [isSpeaking]);

  let src;
  if (isSpeaking) {
    const frames = cfg.hasBlink
      ? (blinkState === "closed" ? cfg.mouthClosed : blinkState === "half" ? cfg.mouthHalf : cfg.mouthOpen)
      : cfg.mouthOpen;
    src = `${PODD_AVATAR_BASE}/${frames[mouthIdx]}`;
  } else if (cfg.hasBlink) {
    src = blinkState === "open" ? `${PODD_AVATAR_BASE}/${cfg.idleOpen}`
        : blinkState === "half" ? `${PODD_AVATAR_BASE}/${cfg.idleHalf}`
        : `${PODD_AVATAR_BASE}/${cfg.idleClosed}`;
  } else {
    src = `${PODD_AVATAR_BASE}/${cfg.idleOpen}`;
  }

  return <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />;
}

// Fristående overlay som visar en agent (video + röst) precis som på /kanal
// och /podd, men för en enskild nyhet i taget istället för en löpande
// sändning eller debatt. Ett enda instans monteras i taget från
// NyhetskallorClient (key=`${nyhet-id}-${agent}` tvingar en ren remount —
// och därmed cancel() av föregående uppläsning — när besökaren klickar en
// annan nyhets eller agents läs-knapp medan overlayen redan är öppen).
export default function AgentOverlay({ agent, namn, text, shareUrl, onClose }) {
  const cfg = AGENTER[agent] || AGENTER.Anna;
  const visningsnamn = namn || agent;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(true);
  const [kopierat, setKopierat] = useState(false);
  const running = isSpeaking || isThinking;
  const framesReady = usePreload(cfg);
  const blinkState = useBlinkState(cfg.hasBlink && framesReady);
  const startedRef = useRef(false);
  // shareUrl kan dyka upp asynkront (efter att sidan hunnit spara en
  // historikpost) en bra stund efter mount — speak()-effekten nedan har
  // tomma deps och läser därför bara det INITIALA värdet direkt, så en ref
  // håller den senaste versionen tillgänglig i onend/onerror-callbacken.
  const shareUrlRef = useRef(shareUrl);
  useEffect(() => { shareUrlRef.current = shareUrl; }, [shareUrl]);

  async function kopieraLank() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setKopierat(true);
      setTimeout(() => setKopierat(false), 2000);
    } catch {
      // clipboard kan vara blockerad (behörighet nekad, icke-https m.m.) — tyst
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (typeof window === "undefined" || !window.responsiveVoice || !window.responsiveVoice.voiceSupport()) {
      setIsThinking(false);
      return;
    }
    window.responsiveVoice.speak(text, cfg.rvVoice, {
      rate: cfg.rate,
      pitch: cfg.pitch,
      onstart: () => { setIsThinking(false); setIsSpeaking(true); },
      // Stänger inte automatiskt om en delningslänk finns — samma resonemang
      // som StudioOverlay: besökaren ska hinna hitta och klicka
      // "🔗 Dela"-knappen istället för att overlayen försvinner direkt när
      // uppläsningen tar slut.
      onend:   () => { setIsSpeaking(false); if (!shareUrlRef.current) onClose(); },
      onerror: () => { setIsSpeaking(false); if (!shareUrlRef.current) onClose(); },
    });
    return () => { window.responsiveVoice?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }}
    >
      {/* Rad med avataren till vänster och lästexten till höger — wrapar ner
          textpanelen under avataren på smala skärmar istället för en fast
          brytpunkt, samma "låt flexbox avgöra"-mönster som bredd/höjd-caparna
          ovan. Till skillnad från Studio (som lägger texten UNDER två
          sida-vid-sida-avatarer, där bredden redan är upptagen) har den
          enskilda uppläsningen gott om ledigt utrymme till höger om den
          ganska smala avatarrutan — använd det istället för att göra rutan
          högre. */}
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", margin: "auto 0" }}>
        <div style={{ width: "min(520px, 94vw)" }}>
          <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #1a1a1a", aspectRatio: "3/4", background: "#050505" }}>
            <AnchorImage cfg={cfg} blinkState={blinkState} isSpeaking={isSpeaking} />

            <div style={{
              position: "absolute", top: "12px", left: "12px",
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "4px 8px",
            }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: running ? "#e05050" : "#444",
                boxShadow: running ? "0 0 6px #e05050" : "none",
              }} />
              <span style={{ fontSize: "10px", letterSpacing: "0.12em", fontFamily: "monospace", color: running ? "#e05050" : "#555" }}>
                LIVE
              </span>
            </div>

            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "20px 14px 10px" }}>
              <div style={{ fontSize: "20px", fontWeight: 400, lineHeight: 1, color: cfg.farg }}>{visningsnamn}</div>
              <div style={{ fontSize: "11px", color: "#888", letterSpacing: "0.08em", marginTop: "2px" }}>{cfg.roll}</div>
              <div style={{ marginTop: "8px" }}>
                <WaveformBar isSpeaking={isSpeaking} isThinking={isThinking} farg={cfg.farg} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            {shareUrl && (
              <button
                onClick={kopieraLank}
                style={{
                  flex: 1, padding: "10px",
                  borderRadius: "6px", fontSize: "13px", fontFamily: "Georgia, serif",
                  border: "1px solid #1a4a6a", background: "#081218", color: "#38bdf8",
                  cursor: "pointer", letterSpacing: "0.06em", boxSizing: "border-box",
                }}
              >
                {kopierat ? "✓ Länk kopierad" : "🔗 Dela"}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px",
                borderRadius: "6px", fontSize: "13px", fontFamily: "Georgia, serif",
                border: "1px solid #5a2020", background: "#1a0808", color: "#e05050",
                cursor: "pointer", letterSpacing: "0.06em", boxSizing: "border-box",
              }}
            >
              ⏹ Stäng
            </button>
          </div>
        </div>

        {/* boxSizing:"border-box" — utan den (ingen global reset finns i
            projektet) räknas padding+border UTANPÅ width:min(320px,94vw),
            vilket gör panelen bredare än 94vw och orsakar horisontell
            scroll på smala telefoner (~320–354px), Codex-fynd på PR #1334. */}
        <div style={{
          width: "min(320px, 94vw)", background: "#050505", border: "1px solid #1a1a1a",
          borderRadius: "12px", padding: "16px", overflowY: "auto", boxSizing: "border-box",
        }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", fontFamily: "monospace", color: "#555", marginBottom: "10px" }}>
            TEXT
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#ccc", lineHeight: 1.7 }}>{text}</p>
        </div>
      </div>
    </div>
  );
}
