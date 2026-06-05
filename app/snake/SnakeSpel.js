"use client";
import { useState, useEffect, useRef } from "react";

const AGENTER = [
  { namn:"Pensionären",         hastighet:140, mål:5,  svårighet:"Nybörjare", text:'Ta det lugnt, ungdom.',           ikonFarg:"#c8a850", ring:"#352a10" },
  { namn:"Mamman",              hastighet:130, mål:7,  svårighet:"Nybörjare", text:'Ät upp, det är nyttigt!',         ikonFarg:"#e87aaa", ring:"#501030" },
  { namn:"Den lugna",           hastighet:125, mål:8,  svårighet:"Nybörjare", text:'Ingen brådska alls.',             ikonFarg:"#50c8a0", ring:"#0a3028" },
  { namn:"Den trötta",          hastighet:125, mål:6,  svårighet:"Nybörjare", text:'Orkar knappt...',                 ikonFarg:"#7090b8", ring:"#152035" },
  { namn:"Optimisten",          hastighet:100, mål:12, svårighet:"Medel",     text:'Du klarar det, jag vet det!',    ikonFarg:"#f0c030", ring:"#3a3000" },
  { namn:"Den nostalgiske",     hastighet: 95, mål:13, svårighet:"Medel",     text:'Förr i tiden var ormar farligare.',ikonFarg:"#9080b8", ring:"#2a2035" },
  { namn:"Hypokondrikern",      hastighet: 95, mål:14, svårighet:"Medel",     text:'Är maten verkligen ofarlig?',    ikonFarg:"#40b890", ring:"#104030" },
  { namn:"Den sura",            hastighet: 90, mål:15, svårighet:"Medel",     text:'Typiskt att du ens försöker.',   ikonFarg:"#cc4444", ring:"#3a1515" },
  { namn:"Den stressade",       hastighet: 85, mål:16, svårighet:"Medel",     text:'SNABBARE! Hinner inte vänta!',   ikonFarg:"#e8a030", ring:"#3a2500" },
  { namn:"Journalist",          hastighet: 72, mål:22, svårighet:"Svår",      text:'Hinner du pressfristen?',        ikonFarg:"#e05252", ring:"#3a1010" },
  { namn:"Läkare",              hastighet: 68, mål:24, svårighet:"Svår",      text:'Precision och fokus krävs.',     ikonFarg:"#67c8e8", ring:"#0a3040" },
  { namn:"Psykolog",            hastighet: 68, mål:25, svårighet:"Svår",      text:'Vad säger din inre orm?',        ikonFarg:"#c084fc", ring:"#280840" },
  { namn:"Sociolog",            hastighet: 65, mål:26, svårighet:"Svår",      text:'Strukturerna avgör din rörelse.',ikonFarg:"#60a0d8", ring:"#103050" },
  { namn:"Historiker",          hastighet: 65, mål:28, svårighet:"Svår",      text:'Historia upprepar sig — även här.',ikonFarg:"#c8a060", ring:"#302010" },
  { namn:"Miljöaktivist",       hastighet: 52, mål:32, svårighet:"Expert",    text:'Varje äpple räknas för klimatet.',ikonFarg:"#4ade80", ring:"#1a4a20" },
  { namn:"Filosof",             hastighet: 50, mål:35, svårighet:"Expert",    text:'Är ormen egentligen fri?',       ikonFarg:"#f8fafc", ring:"#2a1050" },
  { namn:"Nationalekonom",      hastighet: 48, mål:38, svårighet:"Expert",    text:'Marginalnytta maximerad?',       ikonFarg:"#6abf6a", ring:"#2a4a2a" },
  { namn:"Jurist",              hastighet: 45, mål:40, svårighet:"Expert",    text:'Bevisbördan ligger hos dig.',    ikonFarg:"#d4945a", ring:"#3a2010" },
  { namn:"Konservativ debattör",hastighet: 43, mål:42, svårighet:"Expert",    text:'Tradition kräver skicklighet.',  ikonFarg:"#b8862a", ring:"#3a2a0a" },
  { namn:"Den rike",            hastighet: 40, mål:45, svårighet:"Extrem",    text:'Money moves fast. Häng med.',   ikonFarg:"#d4a820", ring:"#3a2808" },
  { namn:"Teknikoptimist",      hastighet: 38, mål:50, svårighet:"Extrem",    text:'AI > människa. Bevis detta.',   ikonFarg:"#38bdf8", ring:"#0a3a5a" },
  { namn:"Den hungriga",        hastighet: 36, mål:52, svårighet:"Extrem",    text:'Snabb som hungern.',             ikonFarg:"#e07820", ring:"#3a1e00" },
  { namn:"Kryptoanalytiker",    hastighet: 33, mål:60, svårighet:"Extrem",    text:'HODL din snake. 🐍',            ikonFarg:"#f7931a", ring:"#4a3200" },
  { namn:"Tonåringen",          hastighet: 28, mål:70, svårighet:"Omöjligt",  text:'Ez game lol 💀 gg',             ikonFarg:"#a855f7", ring:"#28106a" },
];

const COLS = 20, ROWS = 20;
const SVÅR_FÄRG = {
  "Nybörjare":"#4ade80", "Medel":"#f0c030", "Svår":"#e05252",
  "Expert":"#c084fc", "Extrem":"#f7931a", "Omöjligt":"#ff0044",
};

function rnd(n) { return Math.floor(Math.random() * n); }
function nyMat(snake) {
  let p;
  do { p = { x: rnd(COLS), y: rnd(ROWS) }; }
  while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
}

export default function SnakeSpel() {
  const canvasRef    = useRef(null);
  const wrapRef      = useRef(null);
  const gameRef      = useRef(null);
  const rafRef       = useRef(null);
  const touchRef     = useRef(null);

  const [screen,  setScreen]  = useState("val");   // val | spel | slut
  const [agent,   setAgent]   = useState(null);
  const [score,   setScore]   = useState(0);
  const [vann,    setVann]    = useState(false);
  const [filter,  setFilter]  = useState("Alla");

  // ── Drawing ──────────────────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current;
    const g = gameRef.current;
    if (!canvas || !g) return;
    const ctx = canvas.getContext("2d");
    const cs = g.cs;
    const col = g.col;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = "#141414";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*cs,0); ctx.lineTo(x*cs,canvas.height); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y*cs); ctx.lineTo(canvas.width,y*cs); ctx.stroke(); }

    // Food — glowing circle
    ctx.save();
    ctx.shadowBlur = 14; ctx.shadowColor = col;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(g.mat.x*cs + cs/2, g.mat.y*cs + cs/2, cs/2 - 2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Snake
    g.snake.forEach((seg, i) => {
      const isHead = i === 0;
      ctx.fillStyle = isHead ? col : col + "65";
      const pad = isHead ? 1 : 2;
      const r = isHead ? cs/2 - 1 : 3;
      ctx.beginPath();
      ctx.roundRect(seg.x*cs + pad, seg.y*cs + pad, cs - pad*2, cs - pad*2, r);
      ctx.fill();
    });
  }

  // ── Start game (called after canvas is in DOM) ───────────────────────────
  function startGame(ag) {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const w = Math.min(wrap.clientWidth, 420);
    const cs = Math.floor(w / COLS);
    canvas.width  = cs * COLS;
    canvas.height = cs * ROWS;

    const snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    gameRef.current = {
      snake, dir:[1,0], nextDir:[1,0],
      mat: nyMat(snake),
      score: 0, running: true,
      cs, col: ag.ikonFarg,
      hastighet: ag.hastighet, mål: ag.mål,
    };
    setScore(0); setVann(false);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    let last = 0;
    function loop(ts) {
      const g = gameRef.current;
      if (!g?.running) return;

      if (ts - last >= g.hastighet) {
        last = ts;
        const [ndx,ndy] = g.nextDir;
        if (!(ndx === -g.dir[0] && ndy === -g.dir[1])) g.dir = g.nextDir;

        const h = g.snake[0];
        const nx = (h.x + g.dir[0] + COLS) % COLS;
        const ny = (h.y + g.dir[1] + ROWS) % ROWS;

        const ate = nx === g.mat.x && ny === g.mat.y;

        // Self collision — the tail moves away this tick on a non-eating move,
        // so its current cell is free to enter (exclude it from the test).
        const kropp = ate ? g.snake : g.snake.slice(0, -1);
        if (kropp.some(s => s.x === nx && s.y === ny)) {
          g.running = false;
          setScore(g.score); setVann(false); setScreen("slut");
          draw(); return;
        }

        g.snake = [{x:nx,y:ny}, ...g.snake];
        if (ate) {
          g.score++;
          setScore(g.score);
          if (g.score >= g.mål) {
            g.running = false;
            setVann(true); setScreen("slut");
            draw(); return;
          }
          g.mat = nyMat(g.snake);
        } else {
          g.snake.pop();
        }
      }
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  // ── Select agent → show game screen → init ───────────────────────────────
  const [pending, setPending] = useState(null);
  function veljaAgent(ag) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAgent(ag);
    setPending(ag);
    setScreen("spel");
  }

  useEffect(() => {
    if (screen === "spel" && pending) {
      startGame(pending);
      setPending(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, pending]);

  function omstart() {
    if (agent) { setPending(agent); setScreen("spel"); }
  }

  // Cleanup on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Direction helpers ────────────────────────────────────────────────────
  function setDir(dx, dy) {
    if (gameRef.current) gameRef.current.nextDir = [dx, dy];
  }

  // Keyboard
  useEffect(() => {
    const MAP = {
      ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
      w:[0,-1], s:[0,1], a:[-1,0], d:[1,0],
    };
    const h = e => { const d = MAP[e.key]; if (d) { setDir(...d); e.preventDefault(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Touch swipe on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || screen !== "spel") return;
    const onStart = e => { touchRef.current = {x:e.touches[0].clientX, y:e.touches[0].clientY}; e.preventDefault(); };
    const onEnd = e => {
      if (!touchRef.current) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      const th = 15;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > th) setDir(dx > 0 ? 1 : -1, 0);
      else if (Math.abs(dy) > th) setDir(0, dy > 0 ? 1 : -1);
      touchRef.current = null;
      e.preventDefault();
    };
    canvas.addEventListener("touchstart", onStart, {passive:false});
    canvas.addEventListener("touchend",   onEnd,   {passive:false});
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchend",   onEnd);
    };
  }, [screen]);

  // ── UI ───────────────────────────────────────────────────────────────────
  const filters = ["Alla","Nybörjare","Medel","Svår","Expert","Extrem","Omöjligt"];
  const visade  = filter === "Alla" ? AGENTER : AGENTER.filter(a => a.svårighet === filter);

  const DPAD = (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,marginTop:20,userSelect:"none"}}>
      <DpadBtn onPress={() => setDir(0,-1)}>▲</DpadBtn>
      <div style={{display:"flex",gap:6}}>
        <DpadBtn onPress={() => setDir(-1,0)}>◀</DpadBtn>
        <div style={{width:52,height:52,background:"#111",borderRadius:10,border:"1px solid #1e1e1e"}}/>
        <DpadBtn onPress={() => setDir(1,0)}>▶</DpadBtn>
      </div>
      <DpadBtn onPress={() => setDir(0,1)}>▼</DpadBtn>
      <p style={{color:"#333",fontSize:11,margin:"8px 0 0",textAlign:"center"}}>Svep på spelplanen · piltangenter · D-pad</p>
    </div>
  );

  return (
    <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px 80px",color:"#f0ede6"}}>

      {/* ── AGENTVAL ── */}
      {screen === "val" && (
        <>
          <div style={{padding:"20px 0 16px"}}>
            <h1 style={{fontFamily:"Georgia,serif",color:"#e8d5a3",fontSize:22,margin:"0 0 6px"}}>🐍 Snake — Utmana en agent</h1>
            <p style={{color:"#666",fontSize:13,margin:0}}>
              Slå agentens målpoäng för att vinna. Svårare agent = snabbare tempo.
            </p>
          </div>

          {/* Filter-pills */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:"4px 12px",borderRadius:20,border:"1px solid",cursor:"pointer",fontSize:12,
                borderColor: filter===f ? "#e8d5a3" : "#2a2a2a",
                background:  filter===f ? "#1a1a1a"  : "transparent",
                color:       filter===f ? "#e8d5a3"  : "#555",
              }}>{f}</button>
            ))}
          </div>

          {/* Agent grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {visade.map(ag => (
              <button key={ag.namn} onClick={() => veljaAgent(ag)} style={{
                background:"#0e0e0e",border:`1px solid ${ag.ring}`,borderRadius:12,
                padding:"14px 12px",cursor:"pointer",textAlign:"left",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <span style={{fontFamily:"Georgia,serif",color:ag.ikonFarg,fontSize:13,fontWeight:"bold",lineHeight:1.3}}>
                    {ag.namn}
                  </span>
                  <span style={{
                    fontSize:10,padding:"2px 7px",borderRadius:10,marginLeft:6,flexShrink:0,
                    background:`${SVÅR_FÄRG[ag.svårighet]}18`,
                    color:SVÅR_FÄRG[ag.svårighet],
                    border:`1px solid ${SVÅR_FÄRG[ag.svårighet]}35`,
                  }}>{ag.svårighet}</span>
                </div>
                <div style={{color:"#555",fontSize:11,fontStyle:"italic",marginBottom:8,lineHeight:1.4}}>
                  "{ag.text}"
                </div>
                <div style={{color:"#444",fontSize:11}}>🎯 Mål: {ag.mål} poäng</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── SPELPLAN ── */}
      {(screen === "spel" || screen === "slut") && agent && (
        <>
          {/* Toprad */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0 10px"}}>
            <button onClick={() => { if(rafRef.current) cancelAnimationFrame(rafRef.current); setScreen("val"); }}
              style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:13,padding:0}}>
              ← Byt agent
            </button>
            <div style={{textAlign:"center"}}>
              <div style={{color:agent.ikonFarg,fontFamily:"Georgia,serif",fontSize:14,fontWeight:"bold"}}>{agent.namn}</div>
              <div style={{color:"#444",fontSize:11}}>Mål: {agent.mål} poäng</div>
            </div>
            <div style={{textAlign:"right",minWidth:48}}>
              <div style={{color:"#e8d5a3",fontSize:24,fontWeight:"bold",fontVariantNumeric:"tabular-nums"}}>{score}</div>
              <div style={{color:"#333",fontSize:10}}>POÄNG</div>
            </div>
          </div>

          {/* Framgångsbar */}
          <div style={{background:"#111",borderRadius:4,height:4,marginBottom:10,overflow:"hidden"}}>
            <div style={{
              background:agent.ikonFarg,height:"100%",borderRadius:4,
              width:`${Math.min(100, (score/agent.mål)*100)}%`,
              transition:"width 0.2s",
            }}/>
          </div>

          {/* Canvas-wrapper */}
          <div ref={wrapRef} style={{width:"100%",position:"relative"}}>
            <canvas ref={canvasRef} style={{
              display:"block",width:"100%",borderRadius:8,
              border:`1px solid ${agent.ring}`,touchAction:"none",
            }}/>

            {/* Game over / win overlay */}
            {screen === "slut" && (
              <div style={{
                position:"absolute",inset:0,display:"flex",flexDirection:"column",
                alignItems:"center",justifyContent:"center",
                background:"rgba(0,0,0,0.88)",borderRadius:8,
              }}>
                <div style={{fontSize:44,marginBottom:8}}>{vann ? "🏆" : "💀"}</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:"bold",marginBottom:4,
                  color: vann ? "#e8d5a3" : "#e05252"}}>
                  {vann ? "Du vann!" : "Game over"}
                </div>
                <div style={{color:"#888",fontSize:14,marginBottom:4}}>
                  {vann ? `Du slog ${agent.namn}! ${score} poäng.` : `${score} av ${agent.mål} poäng`}
                </div>
                <div style={{color:"#444",fontSize:12,fontStyle:"italic",marginBottom:22,
                  textAlign:"center",maxWidth:220,lineHeight:1.4}}>
                  "{agent.text}"
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={omstart} style={{
                    background:agent.ikonFarg,color:"#0a0a0a",border:"none",
                    padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:"bold",cursor:"pointer",
                  }}>Igen</button>
                  <button onClick={() => setScreen("val")} style={{
                    background:"#1a1a1a",color:"#e8d5a3",border:"1px solid #2a2a2a",
                    padding:"10px 22px",borderRadius:8,fontSize:14,cursor:"pointer",
                  }}>Byt agent</button>
                </div>
              </div>
            )}
          </div>

          {/* D-pad (alltid synlig på touch-enheter) */}
          {screen === "spel" && DPAD}
        </>
      )}
    </div>
  );
}

function DpadBtn({ onPress, children }) {
  return (
    <button
      onPointerDown={e => { e.preventDefault(); onPress(); }}
      style={{
        width:52,height:52,background:"#151515",border:"1px solid #2a2a2a",
        borderRadius:10,color:"#888",fontSize:20,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        userSelect:"none",WebkitUserSelect:"none",touchAction:"none",
      }}
    >{children}</button>
  );
}
