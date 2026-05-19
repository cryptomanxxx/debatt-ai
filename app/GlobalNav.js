"use client";
import { useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavArkivLink from "./NavArkivLink";
import NavHistorikLink from "./NavHistorikLink";

const LINKS = [
  { href: "/",                label: "Hem" },
  { href: "/?debatter=1",     label: "Debatter" },
  { href: "/nyheter",         label: "Nyheter" },
  { href: "/chatt",           label: "Direktdebatt" },
  { href: "/kanal",           label: "Nyhetskanal" },
  { href: "/podd",            label: "Videopodden" },
  { href: "/opinion",         label: "Vad tycker du?" },
  { href: "/visualiseringar", label: "Visualiseringar" },
  { href: "/fraktioner",      label: "Fraktioner" },
  { href: "/konversationer",  label: "Konversationer" },
  { href: "/rivaliteter",     label: "Rivaliteter" },
  { href: "/markets",         label: "Markets" },
  { href: "/leaderboard",     label: "Leaderboard" },
  { href: "/om",              label: "Om DEBATT-AI" },
  { href: "/?kontakt=1",      label: "Kontakt" },
];

export default function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const searchRef = useRef(null);

  // Startsidan har sin egen header-nav med hamburger-meny och SPA-navigering
  if (pathname === "/") return null;

  function isActive(href) {
    if (href.startsWith("/?")) return false;
    if (href === "/") return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function openSearch() {
    setSearchOpen(true);
    setOpen(false);
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
    <a href={href} onClick={() => setOpen(false)} className={isActive(href) ? "neon-nav-active" : "neon-nav"}>
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
      <div style={{ display: "flex", alignItems: "center" }}>
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
            {/* Desktop: alla länkar i rad */}
              {/* Hamburger — vänster efter logo */}
            <button
              className="hamburger-btn"
              onClick={() => setOpen(o => !o)}
              aria-label={open ? "Stäng meny" : "Öppna meny"}
              aria-expanded={open}
            >
              {open ? "✕" : "☰"}
            </button>

            <div className={open ? "nav-links open" : "nav-links"}>
              {LINKS.slice(0, 3).map(l => <L key={l.href} {...l} />)}
              <NavArkivLink onClick={() => setOpen(false)} />
              {LINKS.slice(3, 4).map(l => <L key={l.href} {...l} />)}
              <NavHistorikLink onClick={() => setOpen(false)} />
              {LINKS.slice(4).map(l => <L key={l.href} {...l} />)}
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
