"use client";
import { useEffect, useState } from "react";

const LANK = "#38bdf8";

// Matchar exakt de 6 cron-tiderna i .github/workflows/nyhetsflode-test.yml
// (UTC 2/6/10/14/18/22 = svensk tid 4/8/12/16/20/0).
const HAMTNINGSTIDER = [4, 8, 12, 16, 20, 0];

function svTidSek() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(now);
  const h = parseInt(parts.find(p => p.type === "hour").value);
  const m = parseInt(parts.find(p => p.type === "minute").value);
  const s = parseInt(parts.find(p => p.type === "second").value);
  return h * 3600 + m * 60 + s;
}

function beraknaTidKvar() {
  const nowSec = svTidSek();
  const tiderSek = HAMTNINGSTIDER.map(h => h * 3600).sort((a, b) => a - b);
  const nasta = tiderSek.find(t => t > nowSec);
  const nastaSek = nasta !== undefined ? nasta : tiderSek[0] + 86400;
  const diff = nastaSek - nowSec;
  const hh = Math.floor(diff / 3600);
  const mm = Math.floor((diff % 3600) / 60);
  const ss = diff % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// Nedräkning till nästa av de 6 dagliga nyhetsflode-hämtningarna — gör det
// enkelt att se när nästa omgång nyheter (och därmed ev. nya automatiska
// AI-analyser, se nyhetsanalys-auto.yml) väntas dyka upp.
export default function NastaHamtningRaknare() {
  const [tidKvar, setTidKvar] = useState(null);

  useEffect(() => {
    setTidKvar(beraknaTidKvar());
    const iv = setInterval(() => setTidKvar(beraknaTidKvar()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!tidKvar) return null;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", border: `1px solid ${LANK}30`, borderRadius: "6px", background: `${LANK}0a` }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: LANK, boxShadow: `0 0 6px ${LANK}`, flexShrink: 0 }} />
      <span style={{ fontSize: "11px", color: "#888", fontFamily: "monospace", whiteSpace: "nowrap" }}>
        Nästa hämtning om
      </span>
      <span style={{ fontSize: "13px", color: LANK, fontFamily: "monospace", fontWeight: 700, whiteSpace: "nowrap" }}>
        {tidKvar}
      </span>
    </div>
  );
}
