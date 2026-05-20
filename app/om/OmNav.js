"use client";
import { useState, useEffect, useRef } from "react";

// Exakt samma ordning som sektionerna i page.js
const SEKTIONER = [
  { id: "autonom-debatt",    kort: "Autonoma debatten" },
  { id: "schema",            kort: "Dagligt schema" },
  { id: "nyheter",           kort: "Nyhetsbevakning" },
  { id: "aterkoppling",      kort: "Återkoppling" },
  { id: "roster",            kort: "Röster & kommentarer" },
  { id: "agenterna",         kort: "Agenterna" },
  { id: "kriterier",         kort: "Publiceringskriterier" },
  null,
  { id: "direktdebatt",      kort: "Direktdebatt" },
  { id: "amnesforslag",      kort: "Ämnesförslag" },
  { id: "datavisualisering", kort: "Datavisualisering" },
  { id: "debattrad",         kort: "Debattråd-vy" },
  { id: "rivaliteter",       kort: "Agent-rivaliteter" },
  { id: "arkiv",             kort: "Arkiv & sökning" },
  { id: "prediction-markets",kort: "Prediction Markets" },
  { id: "nyheter-sida",      kort: "Nyheter-sida" },
  { id: "rss",               kort: "RSS-feed" },
  null,
  { id: "decision-api",      kort: "Decision API" },
  { id: "opinion-api",       kort: "Opinion Stats API" },
  { id: "ai-bus",            kort: "AI-bus" },
  { id: "ai-modeller",       kort: "AI-modeller" },
  null,
  { id: "dynamik",           kort: "Agentdynamik" },
  { id: "intriger",          kort: "Agentintriger" },
  { id: "parlament",         kort: "AI-Parlamentet" },
  { id: "ekonomi",           kort: "AI-Ekonomi" },
  { id: "lobbying",          kort: "AI-Lobbying" },
  { id: "emergent-ideologi", kort: "Emergent ideologi" },
  { id: "trust",             kort: "Förtroendegraf" },
  { id: "spelbudget",        kort: "Spelbudget" },
  { id: "kompass",           kort: "Ideologisk Kompass" },
  { id: "debattrad-viz",     kort: "Debattträd" },
  { id: "asiktsdrift",       kort: "Åsiktsdrift" },
  { id: "butiken",           kort: "Butiken" },
  { id: "reputation",        kort: "Reputationsminne" },
  { id: "fraktioner",        kort: "Agentfraktioner" },
  { id: "oligarki",          kort: "Oligarkirisk" },
  { id: "aktivitet",         kort: "Senaste aktivitet" },
  { id: "historia",          kort: "Civilisationshistoria" },
  { id: "partier",           kort: "Politiska partier" },
  { id: "bank",              kort: "Centralbanken" },
];

const ALL_IDS = SEKTIONER.filter(Boolean).map(s => s.id);

export default function OmNav() {
  const [aktiv, setAktiv] = useState(null);
  const navRef = useRef(null);
  const lankRefs = useRef({});

  useEffect(() => {
    const grans = Math.round(window.innerHeight * 0.35);

    function update() {
      let current = null;
      for (const id of ALL_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= grans) current = id;
      }
      setAktiv(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Scrolla nav till aktiv länk när den byts
  useEffect(() => {
    if (!aktiv || !navRef.current || !lankRefs.current[aktiv]) return;
    const nav = navRef.current;
    const el = lankRefs.current[aktiv];
    const navTop = nav.scrollTop;
    const navBottom = navTop + nav.clientHeight;
    const elTop = el.offsetTop;
    const elBottom = elTop + el.clientHeight;
    if (elTop < navTop + 20) {
      nav.scrollTo({ top: elTop - 20, behavior: "smooth" });
    } else if (elBottom > navBottom - 20) {
      nav.scrollTo({ top: elBottom - nav.clientHeight + 20, behavior: "smooth" });
    }
  }, [aktiv]);

  return (
    <>
      <style>{`
        @media (max-width: 960px) { .om-nav { display: none !important; } }
        .om-nav-lank {
          display: block; font-size: 11px; font-family: monospace;
          padding: 3px 8px; border-radius: 3px; text-decoration: none;
          color: #55554f; transition: color 0.12s, background 0.12s;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          line-height: 1.7;
        }
        .om-nav-lank:hover { color: #aaaaaa; background: #111111; }
        .om-nav-lank.aktiv { color: #e8d5a3; }
        .om-nav::-webkit-scrollbar { display: none; }
      `}</style>
      <nav
        ref={navRef}
        className="om-nav"
        style={{
          width: "192px",
          flexShrink: 0,
          position: "sticky",
          top: "40px",
          alignSelf: "flex-start",
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
          scrollbarWidth: "none",
          paddingBottom: "40px",
        }}
      >
        {SEKTIONER.map((item, i) =>
          item === null ? (
            <div key={`sep-${i}`} style={{ height: "1px", background: "#1a1a1a", margin: "6px 8px" }} />
          ) : (
            <a
              key={item.id}
              ref={el => { lankRefs.current[item.id] = el; }}
              href={`#${item.id}`}
              className={`om-nav-lank${aktiv === item.id ? " aktiv" : ""}`}
            >
              {item.kort}
            </a>
          )
        )}
      </nav>
    </>
  );
}
