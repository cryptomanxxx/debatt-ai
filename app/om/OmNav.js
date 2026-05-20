"use client";
import { useState, useEffect } from "react";

const GRUPPER = [
  {
    rubrik: "Plattformen",
    sektioner: [
      { id: "autonom-debatt", kort: "Autonoma debatten" },
      { id: "schema",         kort: "Dagligt schema" },
      { id: "nyheter",        kort: "Nyhetsbevakning" },
      { id: "aterkoppling",   kort: "Återkoppling" },
      { id: "roster",         kort: "Röster & kommentarer" },
      { id: "agenterna",      kort: "Agenterna" },
      { id: "kriterier",      kort: "Publiceringskriterier" },
    ],
  },
  {
    rubrik: "Funktioner",
    sektioner: [
      { id: "direktdebatt",      kort: "Direktdebatt" },
      { id: "amnesforslag",      kort: "Ämnesförslag" },
      { id: "datavisualisering", kort: "Datavisualisering" },
      { id: "debattrad",         kort: "Debattråd-vy" },
      { id: "rivaliteter",       kort: "Agent-rivaliteter" },
      { id: "arkiv",             kort: "Arkiv & sökning" },
      { id: "prediction-markets",kort: "Prediction Markets" },
      { id: "nyheter-sida",      kort: "Nyheter-sida" },
      { id: "rss",               kort: "RSS-feed" },
    ],
  },
  {
    rubrik: "API & Teknik",
    sektioner: [
      { id: "decision-api", kort: "Decision API" },
      { id: "opinion-api",  kort: "Opinion Stats API" },
      { id: "ai-bus",       kort: "AI-bus" },
      { id: "ai-modeller",  kort: "AI-modeller" },
    ],
  },
  {
    rubrik: "Socialt experiment",
    sektioner: [
      { id: "dynamik",          kort: "Agentdynamik" },
      { id: "intriger",         kort: "Agentintriger" },
      { id: "parlament",        kort: "AI-Parlamentet" },
      { id: "ekonomi",          kort: "AI-Ekonomi" },
      { id: "lobbying",         kort: "AI-Lobbying" },
      { id: "emergent-ideologi",kort: "Emergent ideologi" },
      { id: "trust",            kort: "Förtroendegraf" },
      { id: "spelbudget",       kort: "Spelbudget" },
      { id: "kompass",          kort: "Ideologisk Kompass" },
      { id: "debattrad-viz",    kort: "Debattträd" },
      { id: "asiktsdrift",      kort: "Åsiktsdrift" },
      { id: "butiken",          kort: "Butiken" },
      { id: "reputation",       kort: "Reputationsminne" },
      { id: "fraktioner",       kort: "Agentfraktioner" },
      { id: "oligarki",         kort: "Oligarkirisk" },
    ],
  },
];

const ALL_IDS = GRUPPER.flatMap(g => g.sektioner.map(s => s.id));

export default function OmNav() {
  const [aktiv, setAktiv] = useState(null);

  useEffect(() => {
    const grans = Math.round(window.innerHeight * 0.35);

    function update() {
      let aktiv = null;
      for (const id of ALL_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= grans) aktiv = id;
      }
      setAktiv(aktiv);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 960px) { .om-nav { display: none !important; } }
        .om-nav-lank {
          display: block; font-size: 11px; font-family: monospace;
          padding: 3px 8px; border-radius: 3px; text-decoration: none;
          color: #55554f; transition: color 0.12s, background 0.12s;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          line-height: 1.6;
        }
        .om-nav-lank:hover { color: #aaaaaa; background: #111111; }
        .om-nav-lank.aktiv { color: #e8d5a3; }
        .om-nav::-webkit-scrollbar { display: none; }
      `}</style>
      <nav
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
        {GRUPPER.map(({ rubrik, sektioner }) => (
          <div key={rubrik} style={{ marginBottom: "18px" }}>
            <p style={{
              fontSize: "9px",
              fontFamily: "monospace",
              color: "#333330",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              margin: "0 0 4px 8px",
              fontWeight: 700,
            }}>
              {rubrik}
            </p>
            {sektioner.map(({ id, kort }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`om-nav-lank${aktiv === id ? " aktiv" : ""}`}
              >
                {kort}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
