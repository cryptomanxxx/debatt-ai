"use client";
import { usePathname } from "next/navigation";
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
  { href: "/rivaliteter",     label: "Rivaliteter" },
  { href: "/markets",         label: "Markets" },
  { href: "/leaderboard",     label: "Leaderboard" },
  { href: "/om",              label: "Om DEBATT-AI" },
  { href: "/?kontakt=1",      label: "Kontakt" },
];

export default function GlobalNav() {
  const pathname = usePathname();

  // Startsidan har sin egen header-nav med hamburger-meny och SPA-navigering
  if (pathname === "/") return null;

  function isActive(href) {
    if (href.startsWith("/?")) return false;
    if (href === "/") return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const L = ({ href, label }) => (
    <a key={href} href={href} className={isActive(href) ? "neon-nav-active" : "neon-nav"}>
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
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
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
        {LINKS.slice(0, 3).map(l => <L key={l.href} {...l} />)}
        <NavArkivLink />
        {LINKS.slice(3, 4).map(l => <L key={l.href} {...l} />)}
        <NavHistorikLink />
        {LINKS.slice(4).map(l => <L key={l.href} {...l} />)}
      </div>
    </header>
  );
}
