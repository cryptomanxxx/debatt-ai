"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavArkivLink from "./NavArkivLink";
import NavHistorikLink from "./NavHistorikLink";

// Toppnivålänkar — alltid synliga i navraden
const TOPP = [
  { href: "/",        label: "Hem" },
  { href: "/nyheter", label: "Nyheter" },
  { href: "/chatt",   label: "Direktdebatt" },
];

// Grupperade sidor — dropdown på desktop, accordion i hamburgermenyn.
// Footern i layout.js förblir det kompletta alfabetiska indexet.
const GRUPPER = [
  {
    label: "Debatt",
    items: [
      { href: "/?debatter=1",     label: "Debatter" },
      { href: "/kanal",           label: "Nyhetskanal" },
      { href: "/nyhetskallor",    label: "Nyhetskällor" },
      { href: "/podd",            label: "Videopodden" },
      { href: "/konversationer",  label: "Konversationer" },
      { href: "/rivaliteter",     label: "Rivaliteter" },
      { href: "/debattrad",       label: "Debattträd" },
      { href: "/versus",          label: "Agent vs Agent" },
      { href: "/leaderboard",     label: "Leaderboard" },
      { href: "/opinion",         label: "Vad tycker du?" },
      { href: "/visualiseringar", label: "Visualiseringar" },
      { href: "/vecka",           label: "Veckans sammanfattning" },
    ],
  },
  {
    label: "Ekonomi",
    items: [
      { href: "/bors",        label: "Intern börs" },
      { href: "/markets",     label: "Prediction Markets" },
      { href: "/etf",         label: "Krypto-ETF" },
      { href: "/hedgefonder", label: "Hedgefonder" },
      { href: "/stablecoin",  label: "Stablecoin STAB" },
      { href: "/bank",        label: "Centralbanken" },
      { href: "/staten",      label: "Staten" },
      { href: "/formogenhet", label: "Förmögenheter" },
      { href: "/tillvaxt",    label: "Tillväxt" },
      { href: "/oligarki",    label: "Oligarkirisk" },
      { href: "/teori",       label: "Ekonomisk teori" },
      { href: "/butik",       label: "Butiken" },
      { href: "/ekonomi",     label: "Ekonomispel" },
      { href: "/tpp",         label: "Straffspelet" },
    ],
  },
  {
    label: "Politik",
    items: [
      { href: "/parlament",    label: "AI-Parlamentet" },
      { href: "/partier",      label: "Politiska partier" },
      { href: "/val",          label: "Riksdagsval" },
      { href: "/valresultat",  label: "Valresultat" },
      { href: "/lobbying",     label: "AI-Lobbying" },
      { href: "/korruption",   label: "Korruption" },
      { href: "/domstol",      label: "Domstolen" },
      { href: "/konstitution", label: "Grundlagen" },
      { href: "/koalitioner",  label: "Koalitioner" },
      { href: "/diplomati",    label: "Diplomatpost" },
      { href: "/ud",           label: "Utrikesdepartementet" },
      { href: "/pis",          label: "Policy Simulator" },
    ],
  },
  {
    label: "Socialt",
    items: [
      { href: "/dynamik",       label: "Agentdynamik" },
      { href: "/trust",         label: "Förtroendegraf" },
      { href: "/fraktioner",    label: "Fraktioner" },
      { href: "/historia",      label: "Historia" },
      { href: "/rykten",        label: "Ryktesspridning" },
      { href: "/feedback",      label: "Socialt kapital" },
      { href: "/kompass",       label: "Ideologisk kompass" },
      { href: "/asiktsdrift",   label: "Åsiktsdrift" },
      { href: "/universitet",   label: "AI-Universitetet" },
      { href: "/visdomsspelet", label: "Visdomsspelet" },
      { href: "/orakel",        label: "Oraklet 🔮" },
      { href: "/intelligens",   label: "Intelligens" },
      { href: "/hjarnan",       label: "Hjärnan" },
      { href: "/narrativ",      label: "Narrativ" },
      { href: "/ai-bilder",     label: "AI-Bilder" },
      { href: "/kris",          label: "Krisevents" },
    ],
  },
  {
    label: "Spel & Mer",
    items: [
      { href: "/snake",        label: "Snake 🐍" },
      { href: "/kollusionsspelet", label: "Kollusionsspelet 🪙" },
      { href: "/territorium",  label: "Territorium 🎮" },
      { href: "/handel",       label: "Handelsimperium 🚢" },
      { href: "/mark",         label: "Markartan" },
      { href: "/foretag",      label: "Företag" },
      { href: "/kunskapsgraf", label: "Kunskapsgraf" },
      { href: "/tidsserie",    label: "Tidsseriegraf" },
      { href: "/civilisation", label: "Civilisations-API" },
      { href: "/beslut",       label: "Decision API" },
      { href: "/om",           label: "Om DEBATT-AI" },
      { href: "/?kontakt=1",   label: "Kontakt" },
    ],
  },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openGrupp, setOpenGrupp] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const searchRef = useRef(null);
  const navRef = useRef(null);

  // Klick utanför stänger öppen dropdown
  useEffect(() => {
    if (!openGrupp) return;
    const stang = e => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenGrupp(null);
    };
    document.addEventListener("click", stang);
    return () => document.removeEventListener("click", stang);
  }, [openGrupp]);

  // Startsidan har sin egen header-nav med hamburger-meny och SPA-navigering
  if (pathname === "/") return null;

  function isActive(href) {
    if (href.startsWith("/?")) return false;
    if (href === "/") return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Markera gruppknappen när någon av dess sidor är aktiv
  function gruppAktiv(grupp) {
    return grupp.items.some(i => isActive(i.href));
  }

  function stangAllt() {
    setOpen(false);
    setOpenGrupp(null);
  }

  function openSearch() {
    setSearchOpen(true);
    stangAllt();
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQ("");
  }

  function submitSearch(e) {
    e.preventDefault();
    if (!searchQ.trim()) return;
    closeSearch();
    router.push(`/arkiv?q=${encodeURIComponent(searchQ.trim())}`);
  }

  const L = ({ href, label }) => (
    <a href={href} onClick={stangAllt} className={isActive(href) ? "neon-nav-active" : "neon-nav"}>
      {label}
    </a>
  );

  return (
    <header style={{
      borderBottom: "1px solid #1a1a1a",
      padding: "0 20px",
      position: "sticky",
      top: 0,
      background: "#080808f0",
      backdropFilter: "blur(12px)",
      zIndex: 100,
    }}>
      <div ref={navRef} style={{ display: "flex", alignItems: "center" }}>
        <a href="/" style={{
          fontFamily: "Times New Roman, serif",
          fontSize: "20px",
          fontWeight: 700,
          color: "#e879f9",
          textDecoration: "none",
          padding: "10px 16px 10px 0",
          flexShrink: 0,
        }}>
          DEBATT-AI
        </a>

        {/* Sökfält — täcker hela navbaren när aktivt */}
        {searchOpen ? (
          <form onSubmit={submitSearch} style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              ref={searchRef}
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === "Escape" && closeSearch()}
              placeholder="Sök artiklar…"
              style={{
                flex: 1,
                background: "#111",
                border: "1px solid #333",
                borderRadius: "6px",
                color: "#f0ede6",
                fontFamily: "Georgia, serif",
                fontSize: "14px",
                padding: "7px 14px",
                outline: "none",
              }}
            />
            <button type="submit" style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "16px", padding: "6px 8px" }}>→</button>
            <button type="button" onClick={closeSearch} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "16px", padding: "6px 8px" }}>✕</button>
          </form>
        ) : (
          <>
            {/* Hamburger — vänster efter logo */}
            <button
              className="hamburger-btn"
              onClick={() => { setOpen(o => !o); setOpenGrupp(null); }}
              aria-label={open ? "Stäng meny" : "Öppna meny"}
              aria-expanded={open}
            >
              {open ? "✕" : "☰"}
            </button>

            <div className={open ? "nav-links open" : "nav-links"}>
              {TOPP.map(l => <L key={l.href} {...l} />)}
              <NavArkivLink onClick={stangAllt} />
              <NavHistorikLink onClick={stangAllt} />

              {GRUPPER.map(grupp => (
                <div key={grupp.label} className="nav-grupp">
                  <button
                    className={gruppAktiv(grupp) ? "nav-grupp-btn aktiv" : "nav-grupp-btn"}
                    onClick={() => setOpenGrupp(g => g === grupp.label ? null : grupp.label)}
                    aria-expanded={openGrupp === grupp.label}
                  >
                    {grupp.label} <span className="nav-grupp-pil">{openGrupp === grupp.label ? "▴" : "▾"}</span>
                  </button>
                  {openGrupp === grupp.label && (
                    <div className="nav-dropdown">
                      {grupp.items.map(l => <L key={l.href} {...l} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sök — höger */}
            <button
              onClick={openSearch}
              aria-label="Sök"
              style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "17px", padding: "10px 8px", lineHeight: 1, marginLeft: "auto", flexShrink: 0 }}
            >
              🔍
            </button>
          </>
        )}
      </div>
    </header>
  );
}
