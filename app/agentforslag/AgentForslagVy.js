"use client";
import { useState, useMemo } from "react";
import { agentVisuell } from "../agentData";

const KAT_FARG = {
  UX:       "#60a5fa",
  ekonomi:  "#4ade80",
  debatt:   "#e879f9",
  social:   "#fb923c",
  teknisk:  "#38bdf8",
};

const KAT_LABEL = {
  UX:       "UX",
  ekonomi:  "Ekonomi",
  debatt:   "Debatt",
  social:   "Social",
  teknisk:  "Teknisk",
};

const PRIO_FARG  = { high: "#ef4444", medium: "#f59e0b", low: "#555" };
const PRIO_LABEL = { high: "Hög", medium: "Medium", low: "Låg" };

const STATUS_FARG  = { open: "#22c55e", implemented: "#a855f7", rejected: "#ef4444" };
const STATUS_LABEL = { open: "Öppen", implemented: "Implementerad", rejected: "Avvisad" };

function Chip({ color, children, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "999px", fontSize: "10px",
      fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase",
      background: `${color}18`, color, border: `1px solid ${color}40`,
      fontFamily: "monospace", ...style,
    }}>
      {children}
    </span>
  );
}

function AgentAvatar({ namn, size = 28 }) {
  const v = agentVisuell(namn);
  return (
    <a href={`/agent/${encodeURIComponent(namn)}`} style={{ textDecoration: "none", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: v.gradient,
        border: `1.5px solid ${v.ring}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42, color: v.ikonFarg,
        fontWeight: "700", fontFamily: "monospace",
        flexShrink: 0,
      }}>
        {v.ikon}
      </div>
    </a>
  );
}

function KortDato({ skapad }) {
  const d = new Date(skapad);
  return (
    <span style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>
      {d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
    </span>
  );
}

function ForslagKort({ f }) {
  const [open, setOpen] = useState(false);
  const v = agentVisuell(f.agent);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: "#0c0c0c",
        border: `1px solid ${open ? "#2a2a2a" : "#181818"}`,
        borderLeft: `3px solid ${KAT_FARG[f.kategori] || "#444"}`,
        borderRadius: "10px",
        padding: "16px 18px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#111"}
      onMouseLeave={e => e.currentTarget.style.background = open ? "#111" : "#0c0c0c"}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <AgentAvatar namn={f.agent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: v.ikonFarg, fontFamily: "monospace", fontWeight: "600" }}>
              {f.agent}
            </span>
            <Chip color={KAT_FARG[f.kategori] || "#888"}>
              {KAT_LABEL[f.kategori] || f.kategori}
            </Chip>
            <Chip color={PRIO_FARG[f.prioritet] || "#555"}>
              {PRIO_LABEL[f.prioritet] || f.prioritet}
            </Chip>
            <Chip color={STATUS_FARG[f.status] || "#555"}>
              {STATUS_LABEL[f.status] || f.status}
            </Chip>
            <div style={{ marginLeft: "auto" }}>
              <KortDato skapad={f.skapad} />
            </div>
          </div>
          <p style={{
            fontSize: "14px", color: "#ddd", fontWeight: "600", margin: 0,
            lineHeight: "1.4", fontFamily: "Georgia, serif",
          }}>
            {f.titel}
          </p>
        </div>
      </div>

      {/* Expandable description */}
      {open && f.beskrivning && (
        <p style={{
          margin: "12px 0 0 38px", fontSize: "13px", color: "#999",
          lineHeight: "1.7", fontFamily: "Georgia, serif",
        }}>
          {f.beskrivning}
        </p>
      )}
    </div>
  );
}

export default function AgentForslagVy({ forslag }) {
  const [valdKat, setValdKat]       = useState("alla");
  const [valdStatus, setValdStatus] = useState("alla");

  const kategorier = useMemo(() => {
    const m = {};
    forslag.forEach(f => { m[f.kategori] = (m[f.kategori] || 0) + 1; });
    return m;
  }, [forslag]);

  const filtered = useMemo(() => forslag.filter(f =>
    (valdKat    === "alla" || f.kategori === valdKat) &&
    (valdStatus === "alla" || f.status   === valdStatus)
  ), [forslag, valdKat, valdStatus]);

  const antalOpen        = forslag.filter(f => f.status === "open").length;
  const antalImpl        = forslag.filter(f => f.status === "implemented").length;
  const antalRejected    = forslag.filter(f => f.status === "rejected").length;

  const tabStyle = (active, color = "#e879f9") => ({
    padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontFamily: "monospace",
    cursor: "pointer", border: "none", fontWeight: "600",
    background: active ? `${color}22` : "transparent",
    color: active ? color : "#555",
    outline: active ? `1px solid ${color}44` : "1px solid transparent",
    transition: "all 0.12s",
  });

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", marginBottom: "36px" }}>
        {[
          ["Totalt",         forslag.length, "#fff"],
          ["Öppna",          antalOpen,      "#22c55e"],
          ["Implementerade", antalImpl,      "#a855f7"],
          ["Avvisade",       antalRejected,  "#ef4444"],
        ].map(([label, val, farg]) => (
          <div key={label}>
            <div style={{ fontSize: "28px", fontWeight: "700", color: farg, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: "10px", color: "#444", letterSpacing: "0.1em", marginTop: "4px", fontFamily: "monospace" }}>
              {label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "28px", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
        {Object.entries(kategorier).sort((a, b) => b[1] - a[1]).map(([kat, n]) => (
          <div key={kat} style={{
            flex: n, background: KAT_FARG[kat] || "#444",
            transition: "flex 0.3s",
          }} title={`${KAT_LABEL[kat] || kat}: ${n}`} />
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "28px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          <button onClick={() => setValdKat("alla")} style={tabStyle(valdKat === "alla", "#888")}>Alla kategorier</button>
          {Object.keys(kategorier).sort().map(kat => (
            <button key={kat} onClick={() => setValdKat(kat)} style={tabStyle(valdKat === kat, KAT_FARG[kat] || "#888")}>
              {KAT_LABEL[kat] || kat}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {[["alla", "Alla", "#888"], ["open", "Öppna", "#22c55e"], ["implemented", "Implementerade", "#a855f7"], ["rejected", "Avvisade", "#ef4444"]].map(([key, label, color]) => (
            <button key={key} onClick={() => setValdStatus(key)} style={tabStyle(valdStatus === key, color)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <p style={{ color: "#444", fontFamily: "monospace", fontSize: "13px" }}>Inga förslag matchar filtret.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(f => <ForslagKort key={f.id} f={f} />)}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "28px" }}>
        {Object.entries(KAT_FARG).map(([kat, color]) => (
          <div key={kat} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: color }} />
            <span style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>{KAT_LABEL[kat]}</span>
          </div>
        ))}
      </div>
    </>
  );
}
