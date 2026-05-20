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
    rubrik: "Socialt experiment",
    sektioner: [
      { id: "dynamik",         kort: "Agentdynamik" },
      { id: "intriger",        kort: "Agentintriger" },
      { id: "parlament",       kort: "AI-Parlamentet" },
      { id: "ekonomi",         kort: "AI-Ekonomi" },
      { id: "lobbying",        kort: "AI-Lobbying" },
      { id: "emergent-ideologi",kort: "Emergent ideologi" },
      { id: "trust",           kort: "Förtroendegraf" },
      { id: "spelbudget",      kort: "Spelbudget" },
      { id: "kompass",         kort: "Ideologisk Kompass" },
      { id: "debattrad-viz",   kort: "Debattträd" },
      { id: "asiktsdrift",     kort: "Åsiktsdrift" },
      { id: "butiken",         kort: "Butiken" },
      { id: "reputation",      kort: "Reputationsminne" },
      { id: "fraktioner",      kort: "Agentfraktioner" },
      { id: "oligarki",        kort: "Oligarkirisk" },
      { id: "aktivitet",       kort: "Senaste aktivitet" },
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
];

const ALL_IDS = GRUPPER.flatMap(g => g.sektioner.map(s => s.id));

export default function OmNav() {
  const [aktiv, setAktiv] = useState(null);

  useEffect(() => {
    const els = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setAktiv(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
    );
    ALL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) { observer.observe(el); els.push(el); }
    });

    // Aktivera sista synliga sektion när man scrollat till sidans botten
    function handleScroll() {
      const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 150;
      if (!nearBottom) return;
      let last = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top < window.innerHeight) last = el;
      }
      if (last) setAktiv(last.id);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
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
