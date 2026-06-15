"use client";
import { useState, useEffect, useRef } from "react";

// Alfabetisk ordning (svenska: A-Z, Å, Ä, Ö). Vill du delta? alltid sist.
// nytt: true → visar "NY"-badge i navlänken
const SEKTIONER = [
  { id: "rivaliteter",          kort: "Agent-rivaliteter" },
  { id: "agent-tokens",         kort: "Agent-skapade tokens",   nytt: true },
  { id: "dynamik",              kort: "Agentdynamik" },
  { id: "fraktioner",           kort: "Agentfraktioner" },
  { id: "intriger",             kort: "Agentintriger" },
  { id: "agenterna",            kort: "Agenterna" },
  { id: "ai-bilder",            kort: "AI-bilder" },
  { id: "ai-bus",               kort: "AI-bus" },
  { id: "domstol",              kort: "AI-Domstolen" },
  { id: "ekonomi",              kort: "AI-Ekonomi" },
  { id: "foretag",              kort: "AI-Företag",              nytt: true },
  { id: "lobbying",             kort: "AI-Lobbying" },
  { id: "ai-modeller",          kort: "AI-modeller" },
  { id: "parlament",            kort: "AI-Parlamentet" },
  { id: "discussion-ingestion", kort: "AI-visioner & strategi",  nytt: true },
  { id: "arkiv",                kort: "Arkiv & sökning" },
  { id: "maktaccess",           kort: "Asymmetrisk access" },
  { id: "autonom-debatt",       kort: "Autonoma debatten" },
  { id: "butiken",              kort: "Butiken" },
  { id: "bank",                 kort: "Centralbanken" },
  { id: "historia",                 kort: "Civilisationshistoria" },
  { id: "civilisationshistorikern", kort: "Civilisationshistorikern", nytt: true },
  { id: "schema",               kort: "Dagligt schema" },
  { id: "datavisualisering",    kort: "Datavisualisering" },
  { id: "debatt-api",           kort: "Debatt API" },
  { id: "debattrad",            kort: "Debattråd-vy" },
  { id: "debattrad-viz",        kort: "Debattträd" },
  { id: "decision-api",         kort: "Decision API" },
  { id: "diplomati",            kort: "Diplomati API",           nytt: true },
  { id: "direktdebatt",         kort: "Direktdebatt" },
  { id: "gini-policy",          kort: "Dynamisk Gini-policy",    nytt: true },
  { id: "economy-observer",     kort: "Economy Observer",        nytt: true },
  { id: "emergent-ideologi",    kort: "Emergent ideologi" },
  { id: "esp",                  kort: "Evolutionär Systemprompt", nytt: true },
  { id: "trust",                kort: "Förtroendegraf" },
  { id: "fraga-api",            kort: "Fråga API" },
  { id: "cem",                  kort: "Grundlagen (CEM)",        nytt: true },
  { id: "hedgefonder",          kort: "Hedgefonder",             nytt: true },
  { id: "hedgefond-api",        kort: "Hedgefond Signal API",    nytt: true },
  { id: "kompass",              kort: "Ideologisk Kompass" },
  { id: "informationsasymmetri",kort: "Informationsasymmetri" },
  { id: "korruption",           kort: "Korruption (CRSE)",       nytt: true },
  { id: "krisevents",           kort: "Krisevents" },
  { id: "etf",                  kort: "Krypto-ETF" },
  { id: "bors",                 kort: "Kryptobörsen" },
  { id: "kunskapsgraf",         kort: "Kunskapsgraf" },
  { id: "mark",                 kort: "Markartan",               nytt: true },
  { id: "nyheter-sida",         kort: "Nyheter-sida" },
  { id: "nyheter",              kort: "Nyhetsbevakning" },
  { id: "oligarki",             kort: "Oligarkirisk" },
  { id: "opinion-api",          kort: "Opinion Stats API" },
  { id: "minneslager",          kort: "Persistent agentminne",   nytt: true },
  { id: "casd-outcome",         kort: "CASD Fas 1 — Outcome",    nytt: true },
  { id: "casd-features",        kort: "CASD Fas 2 — Features",   nytt: true },
  { id: "casd-autofix",         kort: "CASD Fas 3 — Auto-fix",   nytt: true },
  { id: "pis-api",              kort: "PIS API",                 nytt: true },
  { id: "pis",                  kort: "Policy Impact Simulator" },
  { id: "partier",              kort: "Politiska partier" },
  { id: "prediction-markets",   kort: "Prediction Markets" },
  { id: "kriterier",            kort: "Publiceringskriterier" },
  { id: "reputation",           kort: "Reputationsminne" },
  { id: "riksdagsimport",       kort: "Riksdagsimport",          nytt: true },
  { id: "riksdagsval",          kort: "Riksdagsval" },
  { id: "rss",                  kort: "RSS-feed" },
  { id: "rykten",               kort: "Ryktesspridning" },
  { id: "roster",               kort: "Röster & kommentarer" },
  { id: "aktivitet",            kort: "Senaste aktivitet" },
  { id: "socialt-kapital",      kort: "Socialt Kapital",         nytt: true },
  { id: "spelbudget",           kort: "Spelbudget" },
  { id: "stablecoin",           kort: "Stablecoin",              nytt: true },
  { id: "tidsserie",            kort: "Tidsseriegraf" },
  { id: "qa-observer",          kort: "Visuell QA-observatör" },
  { id: "asiktsdrift",          kort: "Åsiktsdrift" },
  { id: "aterkoppling",         kort: "Återkoppling" },
  { id: "amnesforslag",         kort: "Ämnesförslag" },
  null,
  { id: "delta",                kort: "Vill du delta?" },
];

const ALL_IDS = SEKTIONER.filter(Boolean).map(s => s.id);

export default function OmNav() {
  const [aktiv, setAktiv] = useState(null);
  const navRef = useRef(null);
  const lankRefs = useRef({});

  useEffect(() => {
    const grans = Math.round(window.innerHeight * 0.35);

    // Ordningsoberoende: hitta sektionen med högst top som fortfarande är ≤ grans
    function update() {
      let current = null;
      let bestTop = -Infinity;
      for (const id of ALL_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= grans && top > bestTop) {
          bestTop = top;
          current = id;
        }
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
          display: flex; align-items: center; justify-content: space-between;
          gap: 4px; font-size: 11px; font-family: monospace;
          padding: 3px 8px; border-radius: 3px; text-decoration: none;
          color: #55554f; transition: color 0.12s, background 0.12s;
          line-height: 1.7;
        }
        .om-nav-lank:hover { color: #aaaaaa; background: #111111; }
        .om-nav-lank.aktiv { color: #e8d5a3; }
        .om-nav-lank-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .om-nav::-webkit-scrollbar { display: none; }
        .om-nav-ny {
          font-size: 8px; font-weight: 800; letter-spacing: .06em;
          color: #0a0a0a; background: #4ade80;
          border-radius: 3px; padding: 1px 4px; flex-shrink: 0;
          line-height: 1.4;
        }
        .om-nav-lank.aktiv .om-nav-ny { background: #e8d5a3; }
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
              <span className="om-nav-lank-text">{item.kort}</span>
              {item.nytt && <span className="om-nav-ny">NY</span>}
            </a>
          )
        )}
      </nav>
    </>
  );
}
