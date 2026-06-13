"use client";
import { useState, useEffect, useRef } from "react";
import { AGENT_VISUELL } from "../agentData";

const TYP_FARG = {
  energi:   "#f59e0b",
  jordbruk: "#22c55e",
  industri: "#3b82f6",
  gruva:    "#ea580c",
  stad:     "#9333ea",
  kust:     "#0891b2",
  skog:     "#16a34a",
};

const TYP_IKON = {
  energi:   "⚡",
  jordbruk: "🌾",
  industri: "🏭",
  gruva:    "⛏️",
  stad:     "🏙️",
  kust:     "🌊",
  skog:     "🌲",
};

const TYP_NAMN = {
  energi:   "Energi",
  jordbruk: "Jordbruk",
  industri: "Industri",
  gruva:    "Gruva",
  stad:     "Stad",
  kust:     "Kust",
  skog:     "Skog",
};

const EVENT_IKON = { torka: "☀️", gruvras: "💥", cyberattack: "🔒" };
const EVENT_FARG = { torka: "#f59e0b", gruvras: "#ef4444", cyberattack: "#a78bfa" };

// Fyra institutioner placerade på specifika zoner — synliga som glödande pins
const INSTITUTIONS = {
  "Storstaden":       { icon: "🏛", fullName: "AI-Parlamentet", color: "#c084fc" },
  "Handelsstaden":    { icon: "🏦", fullName: "Centralbanken",  color: "#fbbf24" },
  "Datacenterparken": { icon: "📈", fullName: "Kryptobörsen",   color: "#34d399" },
  "Kulturcentrum":    { icon: "⚖️", fullName: "AI-Domstolen",  color: "#f87171" },
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const BESOKARE_FARG = "#22d3ee";
const isVisitor = n => typeof n === "string" && n.startsWith("Besökare-");

const TERRAIN_BG = null; // ingen extern bild — använder CSS-gradient

const TERRAIN_STOPS = {
  energi:   [["#fef08a", 0.16], ["#f59e0b", 0.08], ["#78350f", 0.02]],
  jordbruk: [["#bbf7d0", 0.14], ["#22c55e", 0.07], ["#14532d", 0.01]],
  industri: [["#bfdbfe", 0.14], ["#3b82f6", 0.07], ["#1e3a8a", 0.01]],
  gruva:    [["#fed7aa", 0.16], ["#ea580c", 0.08], ["#7c2d12", 0.02]],
  stad:     [["#f0e0ff", 0.20], ["#9333ea", 0.10], ["#3b0764", 0.03]],
  kust:     [["#cffafe", 0.16], ["#0891b2", 0.08], ["#0c4a6e", 0.02]],
  skog:     [["#dcfce7", 0.14], ["#16a34a", 0.07], ["#14532d", 0.01]],
};

const HEX = 33;        // polygonradie (visuell storlek på hexagonen)
const HEX_SP = 40;     // gitteravstånd — frikopplat från radien så kartan inte komprimeras
const SQRT3 = Math.sqrt(3);
const SVG_W = 530;
const SVG_H = 490;

function clampPan(x, y, z, W, H) {
  if (z <= 1) return [0, 0];
  return [Math.min(0, Math.max(x, W * (1 - z))), Math.min(0, Math.max(y, H * (1 - z)))];
}

function hexCenter(col, row, ox, oy) {
  const x = HEX_SP * SQRT3 * (col + (row % 2 === 1 ? 0.5 : 0)) + ox;
  const y = HEX_SP * 1.5 * row + oy;
  return [x, y];
}

function hexPts(cx, cy, size = HEX) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function relativeTime(ts) {
  if (!ts) return "";
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h sedan`;
  return `${Math.floor(diff / 86400)}d sedan`;
}

function timeLeft(ts) {
  if (!ts) return "";
  const diff = (new Date(ts) - Date.now()) / 1000;
  if (diff <= 0) return "Avslutar...";
  if (diff < 3600) return `${Math.floor(diff / 60)}m kvar`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h kvar`;
  return `${Math.floor(diff / 86400)}d kvar`;
}

// Baspris per vara (kr) — speglar BASPRIS i mark_test.py
const BASPRIS_VARA = {
  el: 15, spannmål: 10, maskiner: 25, malm: 20, tjänster: 18, fisk: 12, virke: 14,
};
const VARA_IKON = {
  el: "⚡", spannmål: "🌾", maskiner: "🏭", malm: "⛏️", tjänster: "🏙️", fisk: "🌊", virke: "🌲",
};
// Zontyp → vara
const TYP_VARA = {
  energi: "el", jordbruk: "spannmål", industri: "maskiner",
  gruva: "malm", stad: "tjänster", kust: "fisk", skog: "virke",
};

// vara → zontyp (omvänd TYP_VARA)
const VARA_TYP = Object.fromEntries(
  Object.entries(TYP_VARA).map(([t, v]) => [v, t])
);

export default function MarkKarta({ zoner, agare, transaktioner, auktioner = [], resurspriser = [], lager = [], handelLog = [], varaAuktioner = [], transClearing = [], handelClearing = [], zonEvents = [], kopOrdrar = [] }) {
  const [hover, setHover]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [floats, setFloats]       = useState([]);
  const [besokareId,   setBesokareId]   = useState(null);
  const [besokareNamn, setBesokareNamn] = useState(null);
  const [besokSaldo,   setBesokSaldo]   = useState(null);
  const [lokalAgare,   setLokalAgare]   = useState([]);
  const [activeBid,    setActiveBid]    = useState(null);  // { id, type }
  const [bidBelopp,    setBidBelopp]    = useState("");
  const [saljInput,    setSaljInput]    = useState(null);  // zon_id som listas
  const [saljPris,     setSaljPris]     = useState("");
  const [pending,      setPending]      = useState(false);
  const [markMsg,      setMarkMsg]      = useState(null);  // { text, ok }
  const [renameMode,   setRenameMode]   = useState(false);
  const [renameInput,  setRenameInput]  = useState("");
  const [tfm,          setTfm]          = useState({ z: 1, x: 0, y: 0 });
  const [kartLager,    setKartLager]    = useState("ägande");
  const [kopOrderVara,    setKopOrderVara]    = useState("malm");
  const [kopOrderAntal,   setKopOrderAntal]   = useState("3");
  const [kopOrderMaxPris, setKopOrderMaxPris] = useState("");
  const [lokalaOrdrar,    setLokalaOrdrar]    = useState([]);
  const [widgetTyp,       setWidgetTyp]       = useState("kop");   // "kop" | "salj"
  const [widgetSubjekt,   setWidgetSubjekt]   = useState("varor"); // "varor" | "mark"
  const [saljWidgetZon,   setSaljWidgetZon]   = useState("");
  const [kopMarkZonId,    setKopMarkZonId]    = useState("");
  const [saljVaraVara,    setSaljVaraVara]    = useState("");
  const [saljVaraAntal,   setSaljVaraAntal]   = useState("1");
  const [saljVaraReservpris, setSaljVaraReservpris] = useState("");
  const tfmRef       = useRef({ z: 1, x: 0, y: 0 });
  const containerRef = useRef(null);
  const dragRef      = useRef({ active: false, startX: 0, startY: 0, px: 0, py: 0, moved: false });
  const touchRef     = useRef({ d0: 1, z0: 1, mx0: 0, my0: 0, px0: 0, py0: 0 });

  const mergedAgare = [
    ...agare.filter(a => !lokalAgare.some(la => la.zon_id === a.zon_id)),
    ...lokalAgare,
  ];
  const agareMap    = Object.fromEntries(mergedAgare.map(a => [a.zon_id, a]));
  const zonEventMap = Object.fromEntries(zonEvents.map(e => [e.zon_id, e]));
  const auktionMap  = Object.fromEntries(auktioner.map(a => [a.mark_zoner?.id, a]));

  // Centrera hexklustret dynamiskt i SVG
  // OX/OY centrerar klustret med fast padding från origo — viewBox anpassas dynamiskt
  const PAD = HEX_SP * 1.5;
  const [OX, OY] = (() => {
    if (!zoner.length) return [PAD + HEX, PAD + HEX];
    const raw = zoner.map(z => [
      HEX_SP * SQRT3 * (z.hex_col + (z.hex_row % 2 === 1 ? 0.5 : 0)),
      HEX_SP * 1.5 * z.hex_row,
    ]);
    const minX = Math.min(...raw.map(c => c[0]));
    const minY = Math.min(...raw.map(c => c[1]));
    return [PAD - minX, PAD - minY];
  })();

  // Dynamisk viewBox — passar alltid alla hexagoner oavsett antal
  const [VB_W, VB_H] = (() => {
    if (!zoner.length) return [SVG_W, SVG_H];
    const centers = zoner.map(z => hexCenter(z.hex_col, z.hex_row, OX, OY));
    return [
      Math.max(SVG_W, Math.max(...centers.map(c => c[0])) + PAD + HEX),
      Math.max(SVG_H, Math.max(...centers.map(c => c[1])) + PAD + HEX),
    ];
  })();

  const agentGrads = [...new Set(mergedAgare.map(a => a.agent))]
    .map(name => ({ name, farg: isVisitor(name) ? BESOKARE_FARG : (AGENT_VISUELL[name]?.ikonFarg || "#888") }));

  const leaderMap = {};
  mergedAgare.forEach(a => {
    const z = zoner.find(z => z.id === a.zon_id);
    if (!z) return;
    if (!leaderMap[a.agent]) leaderMap[a.agent] = { antal: 0 };
    leaderMap[a.agent].antal++;
  });
  const leaders = Object.entries(leaderMap).sort((a, b) => b[1].antal - a[1].antal).slice(0, 8);

  // Resurspriser: map typ → { pris_multiplier, trend, uppdaterad }
  const resursMap = Object.fromEntries(resurspriser.map(r => [r.typ, r]));

  // Genomsnittligt listpris per zontyp — används som bas när ingen transaktion finns.
  const avgKopprisPerTyp = {};
  for (const z of zoner) {
    if (!avgKopprisPerTyp[z.typ]) avgKopprisPerTyp[z.typ] = { sum: 0, count: 0 };
    avgKopprisPerTyp[z.typ].sum += Number(z.koppris) || 0;
    avgKopprisPerTyp[z.typ].count++;
  }
  for (const [typ, d] of Object.entries(avgKopprisPerTyp)) {
    avgKopprisPerTyp[typ] = d.count > 0 ? Math.round(d.sum / d.count) : 0;
  }

  // Senaste clearing-pris per zontyp.
  // Primär: transClearing (limit=1000). Fallback om fetch misslyckades: transaktioner (limit=20).
  // Sista utväg: resurspriser × genomsnittligt listpris.
  const zonNamnTypMap = Object.fromEntries(zoner.map(z => [z.namn, z.typ]));
  const clearingPerTyp = {};
  for (const t of (transClearing.length ? transClearing : transaktioner)) {
    const typ = zonNamnTypMap[t.zon_namn];
    if (typ && !clearingPerTyp[typ]) clearingPerTyp[typ] = { pris: t.pris, skapad: t.skapad, estimated: false };
  }
  // Fyll i saknade zontyper med formelbaserat estimat från resurspriser
  for (const typ of Object.keys(avgKopprisPerTyp)) {
    if (!clearingPerTyp[typ] && resursMap[typ]) {
      const estimerat = Math.round(avgKopprisPerTyp[typ] * resursMap[typ].pris_multiplier);
      if (estimerat > 0) {
        clearingPerTyp[typ] = { pris: estimerat, skapad: resursMap[typ].uppdaterad, estimated: true };
      }
    }
  }

  // Senaste clearing-pris per vara (från mark_handel_log) — bredare fönster med
  // fallback till den senaste handeln.
  const clearingPerVara = {};
  for (const h of (handelClearing.length ? handelClearing : handelLog)) {
    if (h.pris_per_enhet && !clearingPerVara[h.vara])
      clearingPerVara[h.vara] = { pris: h.pris_per_enhet, skapad: h.skapad };
  }

  // Handelsnätverk: agent → alla ägda zoner (används för HANDEL-lagret)
  const agentZonerMap = {};
  for (const zon of zoner) {
    const ag = agareMap[zon.id];
    if (!ag?.agent) continue;
    if (!agentZonerMap[ag.agent]) agentZonerMap[ag.agent] = [];
    agentZonerMap[ag.agent].push(zon);
  }
  // Välj säljarens zon som matchar varans typ; köparens: vilken zon som helst
  function pickZonForAgent(agent, vara) {
    const zones = agentZonerMap[agent] || [];
    const targetTyp = VARA_TYP[vara];
    return zones.find(z => z.typ === targetTyp) || zones[0] || null;
  }

  // Aggregera handelLog per rutt (salj_zon → kop_zon, per vara)
  const handelRutter = {};
  for (const h of handelLog) {
    const sZon = pickZonForAgent(h.salj_agent, h.vara);
    const kZon = (agentZonerMap[h.kop_agent] || [])[0] || null;
    if (!sZon || !kZon || sZon.id === kZon.id) continue;
    const key = `${sZon.id}_${kZon.id}_${h.vara}`;
    if (!handelRutter[key]) handelRutter[key] = { sZon, kZon, vara: h.vara, totalt: 0, antal: 0 };
    handelRutter[key].totalt += Number(h.totalt) || 0;
    handelRutter[key].antal  += Number(h.antal)  || 0;
  }
  const rutterArr = Object.values(handelRutter);
  const maxHandelVol = rutterArr.length ? Math.max(...rutterArr.map(r => r.totalt || r.antal)) : 1;

  // Normaliserade min/max för rikedoms- och produktionslagret
  const kopprisList = zoner.map(z => z.koppris || 0);
  const vekiList    = zoner.map(z => z.veckoinkomst || 0);
  const minKoppris  = Math.min(...kopprisList);
  const maxKoppris  = Math.max(...kopprisList);
  const minVeki     = Math.min(...vekiList);
  const maxVeki     = Math.max(...vekiList);

  const active = selected || hover;
  const activeAgare = active ? agareMap[active.id] : null;
  const activeAgentFarg = activeAgare
    ? (AGENT_VISUELL[activeAgare.agent]?.ikonFarg || "#888")
    : null;

  useEffect(() => {
    let id = localStorage.getItem("mark_besokare_id");
    if (!id) {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
      });
      localStorage.setItem("mark_besokare_id", id);
    }
    const fallback = "Besökare-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();
    const namn = localStorage.getItem("mark_besokare_namn") || fallback;
    setBesokareId(id);
    setBesokareNamn(namn);
    const cached = parseInt(localStorage.getItem("mark_besokare_saldo") || "2000");
    setBesokSaldo(cached);
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Hämta saldo
    fetch(`${SB_URL}/rest/v1/visitor_wallets?id=eq.${id}&select=saldo,display_name`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (data.length) {
          setBesokSaldo(data[0].saldo);
          localStorage.setItem("mark_besokare_saldo", data[0].saldo);
          if (data[0].display_name) {
            setBesokareNamn(data[0].display_name);
            localStorage.setItem("mark_besokare_namn", data[0].display_name);
          }
        }
      })
      .catch(() => {});

    // Hämta ägda zoner — fyller på lokalAgare vid sidladdning så säljknappen syns direkt
    fetch(`${SB_URL}/rest/v1/mark_agare?agent=eq.${encodeURIComponent(namn)}&select=zon_id,agent,kopt_pris`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(rows => {
        if (rows.length) {
          setLokalAgare(prev => {
            const merged = [...prev];
            rows.forEach(r => {
              if (!merged.some(p => p.zon_id === r.zon_id)) merged.push(r);
            });
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e) {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const { z, x, y } = tfmRef.current;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const nz = Math.min(5, Math.max(1, z * factor));
      const nx = mx - (mx - x) * (nz / z);
      const ny = my - (my - y) * (nz / z);
      const [cx, cy] = clampPan(nx, ny, nz, r.width, r.height);
      const next = { z: nz, x: cx, y: cy };
      tfmRef.current = next;
      setTfm(next);
    }
    function onTouchMove(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t = touchRef.current;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const d = Math.hypot(dx, dy);
        const nz = Math.min(5, Math.max(1, t.z0 * d / t.d0));
        const r = el.getBoundingClientRect();
        const nx = t.mx0 - (t.mx0 - t.px0) * (nz / t.z0);
        const ny = t.my0 - (t.my0 - t.py0) * (nz / t.z0);
        const [cx, cy] = clampPan(nx, ny, nz, r.width, r.height);
        const next = { z: nz, x: cx, y: cy };
        tfmRef.current = next;
        setTfm(next);
      } else if (e.touches.length === 1 && dragRef.current.active && tfmRef.current.z > 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - dragRef.current.startX;
        const dy = e.touches[0].clientY - dragRef.current.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
        const r = el.getBoundingClientRect();
        const [cx, cy] = clampPan(dragRef.current.px + dx, dragRef.current.py + dy, tfmRef.current.z, r.width, r.height);
        const next = { ...tfmRef.current, x: cx, y: cy };
        tfmRef.current = next;
        setTfm(next);
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  function applyZoom(factor) {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = r.width / 2, my = r.height / 2;
    const { z, x, y } = tfmRef.current;
    const nz = Math.min(5, Math.max(1, z * factor));
    const nx = mx - (mx - x) * (nz / z);
    const ny = my - (my - y) * (nz / z);
    const [cx, cy] = clampPan(nx, ny, nz, r.width, r.height);
    const next = { z: nz, x: cx, y: cy };
    tfmRef.current = next;
    setTfm(next);
  }

  function handleMouseDown(e) {
    const { x, y } = tfmRef.current;
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, px: x, py: y, moved: false };
  }

  function handleMouseMove(e) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    const { z } = tfmRef.current;
    const r = containerRef.current.getBoundingClientRect();
    const [cx, cy] = clampPan(dragRef.current.px + dx, dragRef.current.py + dy, z, r.width, r.height);
    const next = { ...tfmRef.current, x: cx, y: cy };
    tfmRef.current = next;
    setTfm(next);
  }

  function handleMouseUp() {
    dragRef.current.active = false;
  }

  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      const { x, y } = tfmRef.current;
      dragRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, px: x, py: y, moved: false };
    } else if (e.touches.length === 2) {
      dragRef.current.active = false;
      const r = containerRef.current.getBoundingClientRect();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      touchRef.current = { d0: Math.hypot(dx, dy), z0: tfmRef.current.z, mx0: mx, my0: my, px0: tfmRef.current.x, py0: tfmRef.current.y };
    }
  }

  function handleTouchEnd() {
    dragRef.current.active = false;
  }

  async function kopZon(zon) {
    if (!besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/kop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zon_id: zon.id, besokare_id: besokareId, display_name: besokareNamn }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Köp misslyckades", ok: false }); return; }
      setBesokSaldo(d.saldo);
      localStorage.setItem("mark_besokare_saldo", d.saldo);
      setLokalAgare(prev => [...prev.filter(a => a.zon_id !== zon.id), { zon_id: zon.id, agent: besokareNamn, kopt_pris: zon.koppris }]);
      setMarkMsg({ text: `✅ Köpte ${d.zon_namn} för ${d.pris} kr!`, ok: true });
      setTimeout(() => setMarkMsg(null), 5000);
    } catch { setMarkMsg({ text: "Nätverksfel — försök igen", ok: false }); }
    finally { setPending(false); }
  }

  async function laggBud(auktion_id, type) {
    const belopp = parseInt(bidBelopp);
    if (!belopp || belopp < 10 || !besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/bud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auktion_id, belopp, besokare_id: besokareId, display_name: besokareNamn, type }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Bud misslyckades", ok: false }); return; }
      setMarkMsg({ text: `✅ Bud på ${belopp} kr lagt!`, ok: true });
      setActiveBid(null); setBidBelopp("");
      setTimeout(() => setMarkMsg(null), 5000);
    } catch { setMarkMsg({ text: "Nätverksfel", ok: false }); }
    finally { setPending(false); }
  }

  async function saljZon(zon) {
    const rp = parseInt(saljPris);
    if (!rp || rp < 50 || !besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/salj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zon_id: zon.id, reservpris: rp, besokare_id: besokareId, display_name: besokareNamn }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
      setMarkMsg({ text: `✅ ${zon.namn} lagd på auktion — stänger om 24h!`, ok: true });
      setSaljInput(null); setSaljPris("");
      setTimeout(() => setMarkMsg(null), 5000);
    } catch { setMarkMsg({ text: "Nätverksfel", ok: false }); }
    finally { setPending(false); }
  }

  async function laggKopOrder() {
    const antal = parseInt(kopOrderAntal);
    const maxPris = parseFloat(kopOrderMaxPris);
    if (!antal || antal < 1 || !maxPris || maxPris <= 0 || !besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/kop-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ besokare_id: besokareId, display_name: besokareNamn, vara: kopOrderVara, antal, max_pris_per_enhet: maxPris }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
      setBesokSaldo(d.saldo);
      localStorage.setItem("mark_besokare_saldo", d.saldo);
      setLokalaOrdrar(prev => [...prev, { id: d.order_id, kop_agent: besokareNamn, vara: kopOrderVara, antal, max_pris_per_enhet: maxPris, reserverat_kr: d.reserverat_kr, status: "öppen", skapad: new Date().toISOString() }]);
      setMarkMsg({ text: `✅ Köporder lagd! ${d.reserverat_kr} kr reserverade.`, ok: true });
      setKopOrderMaxPris("");
      setTimeout(() => setMarkMsg(null), 6000);
    } catch { setMarkMsg({ text: "Nätverksfel", ok: false }); }
    finally { setPending(false); }
  }

  async function avbrytKopOrder(orderId, reserverat) {
    if (!besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/kop-order/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ besokare_id: besokareId, display_name: besokareNamn, order_id: orderId }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Avbryt misslyckades", ok: false }); return; }
      if (d.saldo != null) { setBesokSaldo(d.saldo); localStorage.setItem("mark_besokare_saldo", d.saldo); }
      setLokalaOrdrar(prev => prev.filter(o => o.id !== orderId));
      setMarkMsg({ text: `✅ Order avbruten — ${d.refunded} kr återbetalade.`, ok: true });
      setTimeout(() => setMarkMsg(null), 5000);
    } catch { setMarkMsg({ text: "Nätverksfel", ok: false }); }
    finally { setPending(false); }
  }

  async function saljWidgetZonAuktion() {
    const zon = zoner.find(z => String(z.id) === String(saljWidgetZon));
    if (!zon || !besokareId || pending) return;
    const rp = Math.ceil(zon.koppris * 0.65);
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/salj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zon_id: zon.id, reservpris: rp, besokare_id: besokareId, display_name: besokareNamn }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
      setMarkMsg({ text: `✅ ${zon.namn} lagd på auktion!`, ok: true });
      setSaljWidgetZon("");
      setTimeout(() => setMarkMsg(null), 5000);
    } catch { setMarkMsg({ text: "Nätverksfel", ok: false }); }
    finally { setPending(false); }
  }

  async function kopMarkViaWidget() {
    const zon = zoner.find(z => String(z.id) === String(kopMarkZonId));
    if (!zon) return;
    await kopZon(zon);
    setKopMarkZonId("");
  }

  async function saljVara() {
    const antal = parseInt(saljVaraAntal);
    const reservpris = parseInt(saljVaraReservpris);
    if (!saljVaraVara || !antal || antal < 1 || !reservpris || reservpris < 5 || !besokareId || pending) return;
    setPending(true); setMarkMsg(null);
    try {
      const r = await fetch("/api/mark/salj-vara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vara: saljVaraVara, antal, reservpris, besokare_id: besokareId, display_name: besokareNamn }),
      });
      const d = await r.json();
      if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
      setMarkMsg({ text: `✅ ${antal}× ${saljVaraVara} lagda på auktion (reservpris ${reservpris} kr)!`, ok: true });
      setSaljVaraVara(""); setSaljVaraAntal("1"); setSaljVaraReservpris("");
      setTimeout(() => setMarkMsg(null), 6000);
    } catch { setMarkMsg({ text: "Nätverksfel", ok: false }); }
    finally { setPending(false); }
  }

  function handleEnter(zon) {
    setHover(zon);
    const [cx, cy] = hexCenter(zon.hex_col, zon.hex_row, OX, OY);
    const id = Math.random();
    setFloats(prev => [...prev.slice(-4), { id, cx, cy }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1600);
  }

  // Zoner som besökaren äger (för SÄLJ + MARK-widgeten)
  const mina_zoner = zoner.filter(z => {
    const a = mergedAgare.find(a => a.zon_id === z.id);
    return a && a.agent === besokareNamn;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── KÖP/SÄLJ-WIDGET ── */}
      {besokareNamn && (
        <div style={{ background: "#07090f", border: "1px solid #1a2535", borderRadius: "10px", overflow: "hidden" }}>
          {/* Rubrik + dropdown-par */}
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", borderBottom: "1px solid #111820", background: "#080b14" }}>
            <span style={{ fontSize: "13px" }}>🛒</span>
            <span style={{ fontSize: "10px", color: "#60a5fa", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em", flex: 1 }}>
              HANDEL
            </span>
            {/* Typ-select */}
            <select value={widgetTyp} onChange={e => setWidgetTyp(e.target.value)}
              style={{ background: "#0d1220", border: "1px solid #1e3050", color: "#a0c4ff", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer" }}>
              <option value="kop">KÖP</option>
              <option value="salj">SÄLJ</option>
            </select>
            {/* Subjekt-select */}
            <select value={widgetSubjekt} onChange={e => setWidgetSubjekt(e.target.value)}
              style={{ background: "#0d1220", border: "1px solid #1e3050", color: "#a0c4ff", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer" }}>
              <option value="varor">VAROR</option>
              <option value="mark">MARK</option>
            </select>
            <span style={{ fontSize: "9px", color: "#2a3a4a", fontFamily: "monospace" }}>Saldo: {besokSaldo ?? "…"} kr</span>
          </div>

          <div style={{ padding: "14px 16px" }}>
            {/* KÖP + VAROR */}
            {widgetTyp === "kop" && widgetSubjekt === "varor" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: "8px", color: "#2a3a4a", fontFamily: "monospace", marginBottom: "3px" }}>VARA</div>
                  <select value={kopOrderVara} onChange={e => setKopOrderVara(e.target.value)}
                    style={{ background: "#0d140d", border: "1px solid #1a2a1a", color: "#4ade80", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: "monospace" }}>
                    {Object.keys(BASPRIS_VARA).map(v => (
                      <option key={v} value={v}>{VARA_IKON[v]} {v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "8px", color: "#2a3a4a", fontFamily: "monospace", marginBottom: "3px" }}>ANTAL (1–20)</div>
                  <input type="number" min="1" max="20" value={kopOrderAntal} onChange={e => setKopOrderAntal(e.target.value)}
                    style={{ width: "70px", background: "#0d140d", border: "1px solid #1a2a1a", color: "#e0e0e0", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: "monospace" }} />
                </div>
                <div>
                  <div style={{ fontSize: "8px", color: "#2a3a4a", fontFamily: "monospace", marginBottom: "3px" }}>MAX KR/ENHET (≥{Math.ceil(BASPRIS_VARA[kopOrderVara] * 0.5)})</div>
                  <input type="number" min="1" placeholder={`${Math.ceil(BASPRIS_VARA[kopOrderVara] * 0.5)}`} value={kopOrderMaxPris} onChange={e => setKopOrderMaxPris(e.target.value)}
                    style={{ width: "90px", background: "#0d140d", border: "1px solid #1a2a1a", color: "#e0e0e0", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: "monospace" }} />
                </div>
                <button onClick={laggKopOrder}
                  disabled={pending || !kopOrderMaxPris || parseFloat(kopOrderMaxPris) < Math.ceil(BASPRIS_VARA[kopOrderVara] * 0.5) || parseInt(kopOrderAntal) < 1}
                  style={{ background: pending ? "#1a2a1a" : "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.40)", color: "#4ade80", borderRadius: "4px", padding: "5px 14px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>
                  {pending ? "…" : "📋 Lägg order"}
                </button>
                {kopOrderMaxPris && parseFloat(kopOrderMaxPris) > 0 && parseInt(kopOrderAntal) > 0 && (
                  <span style={{ fontSize: "9px", color: "#2a4a2a", fontFamily: "monospace" }}>
                    Reservation: {Math.ceil(parseInt(kopOrderAntal) * parseFloat(kopOrderMaxPris))} kr
                  </span>
                )}
              </div>
            )}

            {/* KÖP + MARK */}
            {widgetTyp === "kop" && widgetSubjekt === "mark" && (() => {
              const ledigaZoner = zoner.filter(z => !agareMap[z.id]);
              const valdZon = ledigaZoner.find(z => String(z.id) === String(kopMarkZonId));
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
                  {ledigaZoner.length === 0 ? (
                    <span style={{ fontSize: "10px", color: "#2a3a4a", fontFamily: "monospace" }}>Inga lediga zoner just nu — alla är ägda.</span>
                  ) : (
                    <>
                      <div>
                        <div style={{ fontSize: "8px", color: "#2a3a4a", fontFamily: "monospace", marginBottom: "3px" }}>LEDIG ZON</div>
                        <select value={kopMarkZonId} onChange={e => setKopMarkZonId(e.target.value)}
                          style={{ background: "#0d140d", border: "1px solid #1a2a1a", color: "#4ade80", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: "monospace", maxWidth: "200px" }}>
                          <option value="">— välj zon —</option>
                          {ledigaZoner.map(z => (
                            <option key={z.id} value={z.id}>{TYP_IKON[z.typ]} {z.namn} · {z.koppris} kr</option>
                          ))}
                        </select>
                      </div>
                      {valdZon && (
                        <span style={{ fontSize: "9px", color: "#2a4a2a", fontFamily: "monospace" }}>
                          Kostnad: {valdZon.koppris} kr · Saldo efter: {(besokSaldo ?? 0) - valdZon.koppris} kr
                        </span>
                      )}
                      <button onClick={kopMarkViaWidget} disabled={!kopMarkZonId || pending || (besokSaldo ?? 0) < (valdZon?.koppris ?? 999999)}
                        style={{ background: pending ? "#1a2a1a" : "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.40)", color: "#4ade80", borderRadius: "4px", padding: "5px 14px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>
                        {pending ? "…" : "🗺 Köp zon"}
                      </button>
                    </>
                  )}
                </div>
              );
            })()}

            {/* SÄLJ + VAROR */}
            {widgetTyp === "salj" && widgetSubjekt === "varor" && (() => {
              const mittLager = lager.filter(l => l.agent === besokareNamn && l.antal > 0);
              const valdVaraRow = mittLager.find(l => l.vara === saljVaraVara);
              const maxAntal = valdVaraRow?.antal ?? 0;
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
                  {mittLager.length === 0 ? (
                    <span style={{ fontSize: "10px", color: "#2a3a4a", fontFamily: "monospace" }}>
                      Du har inga varor i lager. Köpordrar fylls av agenter vid kl 09:30.
                    </span>
                  ) : (
                    <>
                      <div>
                        <div style={{ fontSize: "8px", color: "#2a3a4a", fontFamily: "monospace", marginBottom: "3px" }}>VARA I LAGER</div>
                        <select value={saljVaraVara} onChange={e => { setSaljVaraVara(e.target.value); setSaljVaraAntal("1"); setSaljVaraReservpris(""); }}
                          style={{ background: "#140d0d", border: "1px solid #2a1a1a", color: "#f87171", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: "monospace" }}>
                          <option value="">— välj vara —</option>
                          {mittLager.map(l => (
                            <option key={l.vara} value={l.vara}>{VARA_IKON[l.vara] || "📦"} {l.vara} ({l.antal} st)</option>
                          ))}
                        </select>
                      </div>
                      {saljVaraVara && (
                        <>
                          <div>
                            <div style={{ fontSize: "8px", color: "#2a3a4a", fontFamily: "monospace", marginBottom: "3px" }}>ANTAL (1–{maxAntal})</div>
                            <input type="number" min="1" max={maxAntal} value={saljVaraAntal} onChange={e => setSaljVaraAntal(e.target.value)}
                              style={{ width: "65px", background: "#140d0d", border: "1px solid #2a1a1a", color: "#e0e0e0", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: "monospace" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: "8px", color: "#2a3a4a", fontFamily: "monospace", marginBottom: "3px" }}>RESERVPRIS KR (≥5)</div>
                            <input type="number" min="5" placeholder={`${Math.ceil(BASPRIS_VARA[saljVaraVara] ?? 10)}`} value={saljVaraReservpris} onChange={e => setSaljVaraReservpris(e.target.value)}
                              style={{ width: "80px", background: "#140d0d", border: "1px solid #2a1a1a", color: "#e0e0e0", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: "monospace" }} />
                          </div>
                          <button onClick={saljVara}
                            disabled={pending || !saljVaraVara || parseInt(saljVaraAntal) < 1 || parseInt(saljVaraAntal) > maxAntal || parseInt(saljVaraReservpris) < 5}
                            style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)", color: "#f87171", borderRadius: "4px", padding: "5px 14px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>
                            {pending ? "…" : "🏷 Lista på auktion"}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* SÄLJ + MARK */}
            {widgetTyp === "salj" && widgetSubjekt === "mark" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
                {mina_zoner.length === 0 ? (
                  <span style={{ fontSize: "10px", color: "#2a3a4a", fontFamily: "monospace" }}>
                    Du äger inga zoner ännu. Köp en zon på kartan för att sälja den vidare.
                  </span>
                ) : (
                  <>
                    <div>
                      <div style={{ fontSize: "8px", color: "#2a3a4a", fontFamily: "monospace", marginBottom: "3px" }}>DIN ZON</div>
                      <select value={saljWidgetZon} onChange={e => setSaljWidgetZon(e.target.value)}
                        style={{ background: "#140d0d", border: "1px solid #2a1a1a", color: "#f87171", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", fontFamily: "monospace" }}>
                        <option value="">— välj zon —</option>
                        {mina_zoner.map(z => (
                          <option key={z.id} value={z.id}>{TYP_IKON[z.typ]} {z.namn} ({z.koppris} kr)</option>
                        ))}
                      </select>
                    </div>
                    {saljWidgetZon && (
                      <div style={{ fontSize: "9px", color: "#4a2a2a", fontFamily: "monospace" }}>
                        Reservpris: {Math.ceil((zoner.find(z => String(z.id) === String(saljWidgetZon))?.koppris || 0) * 0.65)} kr (65% av listpris)
                      </div>
                    )}
                    <button onClick={saljWidgetZonAuktion} disabled={!saljWidgetZon || pending}
                      style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)", color: "#f87171", borderRadius: "4px", padding: "5px 14px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>
                      {pending ? "…" : "🏷 Lista på auktion"}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Meddelanden */}
            {markMsg && (
              <div style={{ marginTop: "10px", fontSize: "10px", color: markMsg.ok ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
                {markMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KARTLAGER-TOGGLE ── */}
      <div style={{ display: "flex", gap: "6px" }}>
        {[
          { id: "ägande",     label: "ÄGANDE",     color: "#60a5fa" },
          { id: "rikedom",    label: "RIKEDOM",    color: "#f59e0b" },
          { id: "produktion", label: "PRODUKTION", color: "#4ade80" },
          { id: "handel",     label: "HANDEL",     color: "#e879f9" },
        ].map(l => (
          <button key={l.id} onClick={() => setKartLager(l.id)}
            style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.1em", padding: "4px 12px", borderRadius: "4px", cursor: "pointer", background: kartLager === l.id ? rgba(l.color, 0.12) : "transparent", border: `1px solid ${kartLager === l.id ? l.color : "#2a2a2a"}`, color: kartLager === l.id ? l.color : "#444" }}>
            {l.label}
          </button>
        ))}
        <span style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", alignSelf: "center", paddingLeft: "4px" }}>
          {kartLager === "ägande" ? "agentfärg" : kartLager === "rikedom" ? "köppris · mörk=billig · ljus=dyr" : kartLager === "produktion" ? "dagsinkomst · mörk=låg · ljus=hög" : `handelsflöden · tjocklek=volym · ${rutterArr.length} rutter`}
        </span>
      </div>

      {/* ── HEX MAP ── max 700px */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClickCapture={e => { if (dragRef.current.moved) { e.stopPropagation(); dragRef.current.moved = false; } }}
        style={{ width: "100%", maxWidth: "700px", position: "relative", borderRadius: "12px", overflow: "hidden", background: "#030a18", border: "1px solid #1a3020", boxShadow: "0 4px 40px rgba(0,10,30,0.9)", cursor: tfm.z > 1 ? "grab" : "default", userSelect: "none" }}
      >
        {/* Terrängbild + SVG inuti zoom/pan-wrapper */}
        <div style={{ position: "relative", transform: `translate(${tfm.x}px,${tfm.y}px) scale(${tfm.z})`, transformOrigin: "0 0", willChange: "transform" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/mark-terrain.jpg')", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(1.8)", zIndex: 0 }} />
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          style={{
            display: "block",
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "auto",
            background: "transparent",
            mixBlendMode: "normal",
          }}
        >
          <defs>
            {Object.entries(TERRAIN_STOPS).map(([typ, stops]) => (
              <radialGradient key={typ} id={`grad-${typ}`} cx="30%" cy="25%" r="80%">
                <stop offset="0%"   stopColor={stops[0][0]} stopOpacity={stops[0][1]} />
                <stop offset="50%"  stopColor={stops[1][0]} stopOpacity={stops[1][1]} />
                <stop offset="100%" stopColor={stops[2][0]} stopOpacity={stops[2][1]} />
              </radialGradient>
            ))}
            {agentGrads.map(({ name, farg }) => (
              <radialGradient key={name} id={`grad-ag-${name.replace(/[^a-zA-Z]/g, "")}`} cx="32%" cy="25%" r="78%">
                <stop offset="0%"   stopColor={farg} stopOpacity="0.14" />
                <stop offset="50%"  stopColor={farg} stopOpacity="0.06" />
                <stop offset="100%" stopColor={farg} stopOpacity="0.01" />
              </radialGradient>
            ))}
            <radialGradient id="grad-ag-besokare" cx="32%" cy="25%" r="78%">
              <stop offset="0%"   stopColor={BESOKARE_FARG} stopOpacity="0.18" />
              <stop offset="50%"  stopColor={BESOKARE_FARG} stopOpacity="0.08" />
              <stop offset="100%" stopColor={BESOKARE_FARG} stopOpacity="0.01" />
            </radialGradient>
            <linearGradient id="hex-light" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.07" />
              <stop offset="40%"  stopColor="white" stopOpacity="0.01" />
              <stop offset="100%" stopColor="black" stopOpacity="0.10" />
            </linearGradient>
            <radialGradient id="grad-hover" cx="50%" cy="38%" r="68%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
            </radialGradient>
            <radialGradient id="vignette" cx="50%" cy="50%" r="58%">
              <stop offset="72%" stopColor="#060d18" stopOpacity="0" />
              <stop offset="100%" stopColor="#060d18" stopOpacity="0.40" />
            </radialGradient>
            <filter id="softglow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="textglow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="cityglow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g>
            {zoner.map(zon => {
              const [cx, cy] = hexCenter(zon.hex_col, zon.hex_row, OX, OY);
              const agInfo  = agareMap[zon.id];
              const agName  = agInfo?.agent;
              const agFarg  = agName ? (isVisitor(agName) ? BESOKARE_FARG : (AGENT_VISUELL[agName]?.ikonFarg || "#888")) : null;
              const typFarg = TYP_FARG[zon.typ] || "#555";
              const isHov = hover?.id === zon.id;
              const isSel = selected?.id === zon.id;
              const isAct = isHov || isSel;
              const agGradId = agName ? (isVisitor(agName) ? "grad-ag-besokare" : `grad-ag-${agName.replace(/[^a-zA-Z]/g, "")}`) : null;
              const evt = zonEventMap[zon.id] || null;
              const strokeCol = agFarg
                ? rgba(agFarg,  isAct ? 1.0 : 0.90)
                : isAct ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.45)";

              // Kartlager-specifika beräkningar
              const normRikedom = maxKoppris > minKoppris ? (zon.koppris - minKoppris) / (maxKoppris - minKoppris) : 0.5;
              const normProd    = maxVeki > minVeki ? ((zon.veckoinkomst || 0) - minVeki) / (maxVeki - minVeki) : 0;
              const layerStroke = kartLager === "ägande"    ? strokeCol
                : kartLager === "rikedom"    ? rgba("#f59e0b", isAct ? 1.0 : 0.22 + 0.72 * normRikedom)
                : kartLager === "produktion" ? rgba("#4ade80", isAct ? 1.0 : 0.18 + 0.72 * normProd)
                : /* handel */                 rgba("#e879f9", isAct ? 1.0 : 0.30);
              const layerFill   = kartLager === "ägande" ? null
                : kartLager === "rikedom"    ? `rgba(245,158,11,${(0.02 + 0.18 * normRikedom).toFixed(3)})`
                : kartLager === "produktion" ? `rgba(74,222,128,${(0.02 + 0.14 * normProd).toFixed(3)})`
                : null;
              const layerGradId = kartLager === "ägande" ? agGradId : null;
              const layerStrokeW = kartLager === "ägande"
                ? (isAct ? 2.4 : agFarg ? 1.8 : 1.2)
                : (isAct ? 2.4 : 1.6);
              const pts = hexPts(cx, cy);
              return (
                <g key={zon.id} style={{ cursor: "pointer" }}
                  onMouseEnter={() => handleEnter(zon)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(s => s?.id === zon.id ? null : zon)}
                >
                  {zon.typ === "stad" && (
                    <>
                      <polygon points={hexPts(cx, cy, HEX + 8)} fill="none" stroke="#9333ea"
                        strokeWidth="1.5" filter="url(#cityglow)">
                        <animate attributeName="opacity" values="0.02;0.15;0.02" dur="2.2s" repeatCount="indefinite" />
                      </polygon>
                      <polygon points={hexPts(cx, cy, HEX + 3)} fill="none" stroke="#c084fc"
                        strokeWidth="0.8" filter="url(#softglow)">
                        <animate attributeName="opacity" values="0.04;0.22;0.04" dur="1.8s" repeatCount="indefinite" />
                      </polygon>
                    </>
                  )}

                  <polygon points={pts} fill="rgba(0,0,0,0)" stroke="none" />
                  <polygon points={pts} fill={`url(#grad-${zon.typ})`} stroke="none" />
                  {layerGradId && <polygon points={pts} fill={`url(#${layerGradId})`} stroke="none" />}
                  {layerFill && <polygon points={pts} fill={layerFill} stroke="none" />}
                  <polygon points={pts} fill="url(#hex-light)" stroke="none" />
                  {isAct && <polygon points={pts} fill="url(#grad-hover)" stroke="none" />}
                  {/* Mörk skugga bakom kanten för kontrast mot ljus terräng */}
                  <polygon points={pts} fill="none" stroke="rgba(0,0,0,0.45)"
                    strokeWidth={isAct ? 4.0 : 2.8} shapeRendering="crispEdges" />
                  <polygon points={pts} fill="none" stroke={layerStroke}
                    strokeWidth={layerStrokeW}
                    shapeRendering="crispEdges" />
                  {isAct && (
                    <polygon points={hexPts(cx, cy, HEX - 4)} fill="none"
                      stroke={kartLager === "ägande"
                        ? (agFarg ? rgba(agFarg, 0.45) : rgba(typFarg, 0.28))
                        : kartLager === "rikedom" ? rgba("#f59e0b", 0.45)
                        : kartLager === "produktion" ? rgba("#4ade80", 0.45)
                        : rgba("#e879f9", 0.45)}
                      strokeWidth="0.8" />
                  )}
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                    fontSize={isAct ? 20 : 16} filter={isAct ? "url(#textglow)" : undefined}
                    style={{ userSelect: "none", pointerEvents: "none" }}>
                    {TYP_IKON[zon.typ]}
                  </text>
                  {evt && (
                    <>
                      <polygon points={hexPts(cx, cy, HEX + 4)} fill="none"
                        stroke={EVENT_FARG[evt.event_typ] || "#f87171"} strokeWidth="1.6">
                        <animate attributeName="opacity" values="0.18;0.80;0.18" dur="1.4s" repeatCount="indefinite" />
                      </polygon>
                      <text x={cx + HEX - 9} y={cy - HEX + 9} textAnchor="middle" dominantBaseline="middle"
                        fontSize="11" style={{ userSelect: "none", pointerEvents: "none" }}>
                        {EVENT_IKON[evt.event_typ]}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── HANDELSNÄTVERK-LAGER ── */}
          {kartLager === "handel" && rutterArr.map((r, i) => {
            const [sx, sy] = hexCenter(r.sZon.hex_col, r.sZon.hex_row, OX, OY);
            const [kx, ky] = hexCenter(r.kZon.hex_col, r.kZon.hex_row, OX, OY);
            const vol = r.totalt || r.antal || 1;
            const norm = Math.min(vol / maxHandelVol, 1);
            const sw = 0.8 + norm * 3.5;
            const typ = VARA_TYP[r.vara] || "industri";
            const col = TYP_FARG[typ] || "#e879f9";
            const mx = (sx + kx) / 2;
            const my = (sy + ky) / 2 - 12;
            return (
              <g key={i} style={{ pointerEvents: "none" }}>
                <path d={`M${sx.toFixed(1)},${sy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${kx.toFixed(1)},${ky.toFixed(1)}`}
                  fill="none" stroke={col} strokeWidth={sw + 1.5} strokeOpacity="0.12" />
                <path d={`M${sx.toFixed(1)},${sy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${kx.toFixed(1)},${ky.toFixed(1)}`}
                  fill="none" stroke={col} strokeWidth={sw} strokeOpacity="0.72"
                  strokeLinecap="round" strokeDasharray={norm < 0.25 ? "3 4" : undefined} />
                {norm >= 0.35 && (
                  <text x={mx} y={my - 5} textAnchor="middle" fontSize="7"
                    fill={col} fillOpacity="0.85" fontFamily="monospace"
                    style={{ userSelect: "none" }}>
                    {VARA_IKON[r.vara]} {r.totalt ? `${Math.round(r.totalt)} kr` : `${r.antal}st`}
                  </text>
                )}
              </g>
            );
          })}

          {zoner.filter(zon => INSTITUTIONS[zon.namn]).map(zon => {
            const [cx, cy] = hexCenter(zon.hex_col, zon.hex_row, OX, OY);
            const inst = INSTITUTIONS[zon.namn];
            return (
              <g key={`inst-${zon.id}`} style={{ pointerEvents: "none" }}>
                <line x1={cx} y1={cy - HEX} x2={cx} y2={cy - HEX - 2}
                  stroke={inst.color} strokeWidth="1" strokeOpacity="0.55" />
                <circle cx={cx} cy={cy - HEX - 12} r={11}
                  fill="#060810" stroke={inst.color} strokeWidth="1.8"
                  filter="url(#softglow)">
                  <animate attributeName="opacity" values="0.65;1.0;0.65" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <text x={cx} y={cy - HEX - 12} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" style={{ userSelect: "none" }}>
                  {inst.icon}
                </text>
              </g>
            );
          })}

          <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#vignette)" style={{ pointerEvents: "none" }} />

          {floats.map(f => (
            <circle key={f.id} cx={f.cx} cy={f.cy - 16} r="5"
              fill="#fbbf24" filter="url(#softglow)" style={{ pointerEvents: "none" }}>
              <animate attributeName="opacity" from="0.9" to="0" dur="1.2s" fill="freeze" />
              <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -36" dur="1.2s" fill="freeze" />
            </circle>
          ))}

          <text x="12" y="18" fontSize="9" fill="#1a3050" fontFamily="monospace" letterSpacing="0.12em">
            MARKARTAN · {zoner.length} ZONER · {agare.length} ÄGDA
          </text>
        </svg>
        </div>{/* /zoom wrapper */}
        {/* Zoom-knappar */}
        <div style={{ position: "absolute", bottom: "10px", right: "10px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 20, pointerEvents: "none" }}>
          {[
            { label: "+", action: () => applyZoom(1.4), disabled: false },
            { label: "−", action: () => applyZoom(1 / 1.4), disabled: tfm.z <= 1 },
            { label: "↺", action: () => { const n = { z: 1, x: 0, y: 0 }; tfmRef.current = n; setTfm(n); }, disabled: tfm.z <= 1 },
          ].map(({ label, action, disabled }) => (
            <button key={label} onClick={e => { e.stopPropagation(); action(); }}
              disabled={disabled}
              style={{ pointerEvents: "all", width: "28px", height: "28px", background: "rgba(3,10,24,0.85)", border: `1px solid ${disabled ? "#1a3050" : "#2a5080"}`, borderRadius: "4px", color: disabled ? "#1a3050" : "#60a5fa", cursor: disabled ? "default" : "pointer", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", lineHeight: 1 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

        {besokareNamn && (
          <div style={{ marginTop: "10px", background: "#070f10", border: `1px solid ${rgba(BESOKARE_FARG, 0.25)}`, borderRadius: "8px", padding: "10px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", color: BESOKARE_FARG, fontFamily: "monospace", letterSpacing: "0.08em" }}>👤 {besokareNamn}</span>
              <span style={{ fontSize: "15px", color: "#e0e0e0", fontFamily: "monospace", fontWeight: 700 }}>
                {besokSaldo !== null ? `${besokSaldo.toLocaleString("sv-SE")} kr` : "…"}
              </span>
              {besokSaldo !== null && (
                <span style={{ fontSize: "9px", color: rgba(BESOKARE_FARG, 0.5), fontFamily: "monospace" }}>
                  · {mergedAgare.filter(a => a.agent === besokareNamn).length} zon{mergedAgare.filter(a => a.agent === besokareNamn).length !== 1 ? "er" : ""}
                </span>
              )}
              <button
                onClick={() => { setRenameMode(v => !v); setRenameInput(""); setMarkMsg(null); }}
                style={{ marginLeft: "auto", fontSize: "9px", color: rgba(BESOKARE_FARG, 0.6), background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em" }}
              >✏️ byt namn</button>
              {markMsg && (
                <span style={{ fontSize: "10px", color: markMsg.ok ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
                  {markMsg.text}
                </span>
              )}
            </div>
            {renameMode && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "10px", color: "#888", fontFamily: "monospace" }}>Besökare-</span>
                <input
                  value={renameInput}
                  onChange={e => setRenameInput(e.target.value)}
                  placeholder="ditt-namn"
                  maxLength={20}
                  style={{ background: "#111", border: `1px solid ${rgba(BESOKARE_FARG, 0.3)}`, borderRadius: "4px", color: "#f0ede6", fontFamily: "monospace", fontSize: "11px", padding: "3px 8px", width: "140px" }}
                />
                <button
                  disabled={pending || renameInput.trim().length < 2}
                  onClick={async () => {
                    if (pending) return;
                    setPending(true); setMarkMsg(null);
                    try {
                      const r = await fetch("/api/mark/namn", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ besokare_id: besokareId, old_name: besokareNamn, new_suffix: renameInput.trim() }),
                      });
                      const d = await r.json();
                      if (!r.ok) { setMarkMsg({ text: d.error || "Misslyckades", ok: false }); return; }
                      setBesokareNamn(d.new_name);
                      localStorage.setItem("mark_besokare_namn", d.new_name);
                      setRenameMode(false);
                      setMarkMsg({ text: "Namn uppdaterat!", ok: true });
                    } finally { setPending(false); }
                  }}
                  style={{ fontSize: "10px", background: rgba(BESOKARE_FARG, 0.15), border: `1px solid ${rgba(BESOKARE_FARG, 0.4)}`, borderRadius: "4px", color: BESOKARE_FARG, cursor: "pointer", padding: "3px 10px", fontFamily: "monospace" }}
                >Spara</button>
                <button onClick={() => setRenameMode(false)} style={{ fontSize: "9px", color: "#555", background: "none", border: "none", cursor: "pointer" }}>avbryt</button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
          {Object.entries(TYP_FARG).map(([typ, farg]) => (
            <span key={typ} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "1px", background: farg, opacity: 0.75 }} />
              <span style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>
                {TYP_IKON[typ]} {TYP_NAMN[typ]}
              </span>
            </span>
          ))}
        </div>

      {/* ── BOTTENPANEL ── detaljkort + (stats/markägare/resurspriser) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", alignItems: "start" }}>

        {active ? (
          <div style={{
            background: "#0e0e0e",
            border: `1px solid ${rgba(TYP_FARG[active.typ] || "#333", 0.35)}`,
            borderRadius: "8px", padding: "14px 16px",
            boxShadow: `0 0 20px ${rgba(TYP_FARG[active.typ] || "#333", 0.08)}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "20px" }}>{TYP_IKON[active.typ]}</span>
              <span style={{ fontSize: "15px", color: "#f0ede6", fontFamily: "Georgia, serif" }}>{active.namn}</span>
            </div>
            {INSTITUTIONS[active.namn] && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px",
                padding: "5px 10px", borderRadius: "4px",
                background: rgba(INSTITUTIONS[active.namn].color, 0.08),
                border: `1px solid ${rgba(INSTITUTIONS[active.namn].color, 0.30)}` }}>
                <span style={{ fontSize: "15px" }}>{INSTITUTIONS[active.namn].icon}</span>
                <div>
                  <div style={{ fontSize: "8px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em" }}>INSTITUTIONSPLATS</div>
                  <div style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "700",
                    color: INSTITUTIONS[active.namn].color }}>{INSTITUTIONS[active.namn].fullName}</div>
                </div>
              </div>
            )}
            <p style={{ fontSize: "11px", color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>{active.beskrivning}</p>
            <div style={{ marginBottom: "10px", display: "flex", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "8px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "2px" }}>KÖPPRIS</div>
                <div style={{ fontSize: "18px", color: TYP_FARG[active.typ] || "#fff", lineHeight: 1 }}>
                  {active.koppris} <span style={{ fontSize: "10px" }}>kr</span>
                </div>
              </div>
              {active.veckoinkomst > 0 && (
                <div>
                  <div style={{ fontSize: "8px", color: "#444", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: "2px" }}>DAGLIG INKOMST</div>
                  <div style={{ fontSize: "18px", color: "#4ade80", lineHeight: 1 }}>
                    +{Math.round(active.veckoinkomst / 7)} <span style={{ fontSize: "10px" }}>kr/dag</span>
                  </div>
                </div>
              )}
            </div>
            {activeAgare ? (
              <div style={{ padding: "7px 10px", background: rgba(isVisitor(activeAgare.agent) ? BESOKARE_FARG : (activeAgentFarg || "#888"), 0.07), border: `1px solid ${rgba(isVisitor(activeAgare.agent) ? BESOKARE_FARG : (activeAgentFarg || "#888"), 0.25)}`, borderRadius: "4px" }}>
                <span style={{ fontSize: "10px", fontFamily: "monospace", color: isVisitor(activeAgare.agent) ? BESOKARE_FARG : (activeAgentFarg || "#888") }}>
                  {isVisitor(activeAgare.agent) ? "👤" : "▣"} ÄGES AV: {activeAgare.agent}
                </span>
              </div>
            ) : (
              <div style={{ padding: "7px 10px", background: "#0a140a", border: "1px solid #1a3a1a", borderRadius: "4px" }}>
                <span style={{ fontSize: "10px", color: "#4ade8077", fontFamily: "monospace" }}>◯ TILLGÄNGLIG FÖR KÖP</span>
              </div>
            )}

            {/* Besökaråtgärder */}
            {besokareNamn && (() => {
              const activeAukt = auktionMap[active.id];
              const agerAv = activeAgare?.agent;

              // Besökaren äger zonen → kan sälja
              if (agerAv === besokareNamn) {
                if (activeAukt) {
                  return <div style={{ marginTop: "8px", fontSize: "9px", color: "#f59e0b", fontFamily: "monospace" }}>📋 Zonen är redan på auktion</div>;
                }
                if (saljInput === active.id) {
                  return (
                    <div style={{ marginTop: "8px", display: "flex", gap: "6px", alignItems: "center" }}>
                      <input type="number" min="50" placeholder="Reservpris kr" value={saljPris} onChange={e => setSaljPris(e.target.value)}
                        style={{ flex: 1, background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: "4px", padding: "5px 8px", fontSize: "11px", fontFamily: "monospace" }} />
                      <button onClick={() => saljZon(active)} disabled={pending || parseInt(saljPris) < 50}
                        style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: "4px", padding: "5px 10px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>
                        {pending ? "…" : "Sälj"}
                      </button>
                      <button onClick={() => { setSaljInput(null); setSaljPris(""); }}
                        style={{ background: "#1a1a1a", color: "#666", border: "1px solid #333", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                    </div>
                  );
                }
                return (
                  <button onClick={() => { setSaljInput(active.id); setSaljPris(String(Math.round(active.koppris * 0.7))); }}
                    style={{ marginTop: "8px", width: "100%", background: "transparent", border: `1px solid ${rgba(BESOKARE_FARG, 0.4)}`, color: BESOKARE_FARG, borderRadius: "4px", padding: "7px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer" }}>
                    🏷️ Lägg på auktion
                  </button>
                );
              }

              // Zonen är i aktiv auktion → kan lägga bud
              if (!agerAv && activeAukt) {
                const minBud = Math.max(activeAukt.reservpris || 0, (activeAukt.nuv_bud || 0) + 10);
                if (activeBid?.id === activeAukt.id && activeBid?.type === "mark") {
                  return (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontSize: "9px", color: "#f59e0b", fontFamily: "monospace", marginBottom: "4px" }}>Min bud: {minBud} kr</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input type="number" min={minBud} placeholder={`≥ ${minBud} kr`} value={bidBelopp} onChange={e => setBidBelopp(e.target.value)}
                          style={{ flex: 1, background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: "4px", padding: "5px 8px", fontSize: "11px", fontFamily: "monospace" }} />
                        <button onClick={() => laggBud(activeAukt.id, "mark")} disabled={pending || parseInt(bidBelopp) < minBud}
                          style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: "4px", padding: "5px 10px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>
                          {pending ? "…" : "Bud!"}
                        </button>
                        <button onClick={() => { setActiveBid(null); setBidBelopp(""); }}
                          style={{ background: "#1a1a1a", color: "#666", border: "1px solid #333", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  );
                }
                return (
                  <button onClick={() => { setActiveBid({ id: activeAukt.id, type: "mark" }); setBidBelopp(String(minBud)); }}
                    style={{ marginTop: "8px", width: "100%", background: "transparent", border: `1px solid ${rgba(BESOKARE_FARG, 0.4)}`, color: BESOKARE_FARG, borderRadius: "4px", padding: "7px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer" }}>
                    🏷️ Lägg bud ({minBud}+ kr)
                  </button>
                );
              }

              // Ledig zon utan auktion → kan köpa direkt
              if (!agerAv && !activeAukt) {
                const harRad = besokSaldo !== null && besokSaldo >= active.koppris;
                return (
                  <button onClick={() => kopZon(active)} disabled={pending || !harRad}
                    style={{ marginTop: "8px", width: "100%", background: harRad ? rgba(BESOKARE_FARG, 0.12) : "#111", border: `1px solid ${rgba(BESOKARE_FARG, harRad ? 0.5 : 0.15)}`, color: harRad ? BESOKARE_FARG : "#444", borderRadius: "4px", padding: "7px", fontSize: "10px", fontFamily: "monospace", cursor: harRad ? "pointer" : "not-allowed" }}>
                    {pending ? "Köper…" : harRad ? `💳 Köp för ${active.koppris} kr` : `💳 Otillräckligt saldo (${besokSaldo} kr)`}
                  </button>
                );
              }

              return null;
            })()}
            {zonEventMap[active.id] && (() => {
              const ev = zonEventMap[active.id];
              const evFarg = EVENT_FARG[ev.event_typ] || "#f87171";
              const daysLeft = Math.max(0, Math.ceil((new Date(ev.slutar) - Date.now()) / 86400000));
              return (
                <div style={{ marginTop: "10px", padding: "9px 10px", background: rgba(evFarg, 0.07), border: `1px solid ${rgba(evFarg, 0.32)}`, borderRadius: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px" }}>{EVENT_IKON[ev.event_typ]}</span>
                    <span style={{ fontSize: "10px", color: evFarg, fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{ev.event_typ}</span>
                    <span style={{ marginLeft: "auto", fontSize: "9px", color: evFarg, fontFamily: "monospace" }}>{daysLeft}d kvar</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#888880", lineHeight: 1.55 }}>{ev.beskrivning}</div>
                  {ev.produktion_effekt === 0
                    ? <div style={{ fontSize: "9px", color: "#f87171", fontFamily: "monospace", marginTop: "5px" }}>⏸ PRODUKTION PAUSAD</div>
                    : <div style={{ fontSize: "9px", color: "#fbbf24", fontFamily: "monospace", marginTop: "5px" }}>⚠ HALVERAD PRODUKTION · {Math.round(ev.produktion_effekt * 100)}%</div>
                  }
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "12px 14px", fontSize: "11px", color: "#333", fontFamily: "monospace", textAlign: "center" }}>
            Tryck på en zon för detaljer
          </div>
        )}

        {/* ── ETT GEMENSAMT KORT med stats + 2 kolumner (col 2, 2fr) ── */}
        <div style={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "8px", overflow: "hidden" }}>

          {/* Statistikrad — header-rad i kortets topp */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", padding: "14px 16px", borderBottom: "1px solid #1e1e1e", background: "#111" }}>
            {[
              ["ZONER",  zoner.length,                "#666"],
              ["ÄGDA",   agare.length,                "#4ade80"],
              ["FRIA",   zoner.length - agare.length, "#38bdf8"],
            ].map(([lbl, val, c]) => (
              <div key={lbl}>
                <div style={{ fontSize: "8px", color: "#3a3a3a", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: "3px" }}>{lbl}</div>
                <div style={{ fontSize: "17px", color: c, lineHeight: 1 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* MARKÄGARE — full bredd */}
          <div style={{ padding: "14px 16px" }}>
            <p style={{ fontSize: "9px", color: "#333", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 10px" }}>MARKÄGARE</p>
            {leaders.length === 0 ? (
              <div style={{ fontSize: "10px", color: "#222", fontFamily: "monospace", textAlign: "center", padding: "10px 0" }}>Inga ägare ännu</div>
            ) : leaders.map(([agent, stats], i) => {
              const af = AGENT_VISUELL[agent]?.ikonFarg || "#888";
              return (
                <div key={agent} style={{ marginBottom: "9px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontSize: "11px", color: af, fontFamily: "monospace" }}>{i + 1}. {agent}</span>
                    <span style={{ fontSize: "10px", color: "#333", fontFamily: "monospace" }}>{stats.antal} zon{stats.antal !== 1 ? "er" : ""}</span>
                  </div>
                  <div style={{ height: "2px", background: "#181818", borderRadius: "2px" }}>
                    <div style={{ height: "2px", background: af, borderRadius: "2px", width: `${(stats.antal / (agare.length || 1)) * 100}%`, boxShadow: `0 0 6px ${rgba(af, 0.6)}`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>{/* /3-kolumns grid */}

      {/* ── AKTIVA ZONEVENT ── */}
      {zonEvents.length > 0 && (
        <div style={{ background: "#0d0907", border: "1px solid rgba(239,68,68,0.20)", borderRadius: "8px", padding: "14px 16px" }}>
          <p style={{ fontSize: "9px", color: "#7a1a1a", fontFamily: "monospace", letterSpacing: "0.12em", margin: "0 0 10px" }}>
            ⚠ AKTIVA ZONEVENT · {zonEvents.length} DRABBADE ZON{zonEvents.length !== 1 ? "ER" : ""}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "8px" }}>
            {zonEvents.map(ev => {
              const evFarg = EVENT_FARG[ev.event_typ] || "#f87171";
              const daysLeft = Math.max(0, Math.ceil((new Date(ev.slutar) - Date.now()) / 86400000));
              const agFarg = ev.agare ? (AGENT_VISUELL[ev.agare]?.ikonFarg || "#888") : null;
              return (
                <div key={ev.id} style={{ padding: "9px 12px", background: rgba(evFarg, 0.05), border: `1px solid ${rgba(evFarg, 0.25)}`, borderLeft: `3px solid ${rgba(evFarg, 0.65)}`, borderRadius: "0 6px 6px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px" }}>{EVENT_IKON[ev.event_typ]}</span>
                    <span style={{ fontSize: "11px", color: evFarg, fontFamily: "monospace", fontWeight: 700 }}>{ev.zon_namn}</span>
                    <span style={{ marginLeft: "auto", fontSize: "9px", color: evFarg, fontFamily: "monospace" }}>{daysLeft}d</span>
                  </div>
                  <div style={{ fontSize: "9px", color: "#666", lineHeight: 1.5, marginBottom: "5px" }}>{ev.beskrivning}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {ev.agare
                      ? <span style={{ fontSize: "9px", color: agFarg, fontFamily: "monospace" }}>▣ {ev.agare}</span>
                      : <span style={{ fontSize: "9px", color: "#333", fontFamily: "monospace" }}>◯ fri zon</span>
                    }
                    {ev.produktion_effekt === 0
                      ? <span style={{ fontSize: "8px", color: "#f87171", fontFamily: "monospace" }}>⏸ PAUSAD</span>
                      : <span style={{ fontSize: "8px", color: "#fbbf24", fontFamily: "monospace" }}>⚠ {Math.round(ev.produktion_effekt * 100)}%</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MARKNADER — 2 kolumner, 4 rader (header/auktioner/clearing/handel alltid i linje) ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginTop: "16px" }}>

        {/* ── ROW 1: Headers ── */}
        <div style={{ background: "#0b0a07", border: "1px solid rgba(245,158,11,0.22)", borderBottom: "none", borderRadius: "10px 10px 0 0", padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>🏷️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "#f59e0b", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>MARKAUKTIONER</div>
            <div style={{ fontSize: "9px", color: "#4a3a00", fontFamily: "monospace" }}>BUDRUNDOR · ZONÄGARSKAP · 24H</div>
          </div>
          {auktioner.length > 0 && (
            <span style={{ fontSize: "10px", color: "#f59e0b", fontFamily: "monospace", background: "rgba(245,158,11,0.10)", padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(245,158,11,0.20)" }}>
              {auktioner.length} aktiva
            </span>
          )}
        </div>
        <div style={{ background: "#070b0d", border: "1px solid rgba(8,145,178,0.22)", borderBottom: "none", borderRadius: "10px 10px 0 0", padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>📦</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "#22d3ee", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>VARUMARKNAD</div>
            <div style={{ fontSize: "9px", color: "#003040", fontFamily: "monospace" }}>BUDRUNDOR · VARUÄGARSKAP · 24H</div>
          </div>
          {varaAuktioner.length > 0 && (
            <span style={{ fontSize: "10px", color: "#22d3ee", fontFamily: "monospace", background: "rgba(8,145,178,0.10)", padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(8,145,178,0.20)" }}>
              {varaAuktioner.length} aktiva
            </span>
          )}
        </div>

        {/* ── ROW 2: Auktionskort (variabel höjd — CSS grid gör att rad 3+ börjar på samma Y) ── */}
        <div style={{ background: "#0b0a07", borderLeft: "1px solid rgba(245,158,11,0.22)", borderRight: "1px solid rgba(245,158,11,0.22)", padding: "4px 20px 10px" }}>
          {auktioner.length === 0 ? (
            <div style={{ fontSize: "11px", color: "#2a2200", fontFamily: "monospace", textAlign: "center", padding: "20px 0" }}>Inga aktiva auktioner just nu</div>
          ) : auktioner.map(a => {
            const zon     = a.mark_zoner || {};
            const typFarg = TYP_FARG[zon.typ] || "#555";
            const saljare = a.saljare || "Plattformen";
            const saljFarg = a.saljare ? (AGENT_VISUELL[a.saljare]?.ikonFarg || "#888") : "#4a4a4a";
            const budFarg = a.hogst_budgivare ? (AGENT_VISUELL[a.hogst_budgivare]?.ikonFarg || "#f59e0b") : null;
            const harBud  = !!a.nuv_bud;
            return (
              <div key={a.id} style={{ background: "#0d0c08", border: `1px solid ${rgba(typFarg, 0.25)}`, borderLeft: `3px solid ${rgba(typFarg, 0.70)}`, borderRadius: "0 6px 6px 0", padding: "10px 12px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: typFarg, fontFamily: "monospace", fontWeight: 700 }}>{TYP_IKON[zon.typ]} {zon.namn}</span>
                  <span style={{ fontSize: "9px", color: "#4a3a00", fontFamily: "monospace", background: "#1a1200", padding: "1px 5px", borderRadius: "3px" }}>{timeLeft(a.stanger_at)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "8px", color: "#3a3a3a", fontFamily: "monospace", marginBottom: "2px" }}>{a.saljare ? "SÄLJS AV" : "PLATTFORM"}</div>
                    <div style={{ fontSize: "10px", color: saljFarg, fontFamily: "monospace" }}>{saljare}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {harBud ? (
                      <>
                        <div style={{ fontSize: "13px", color: budFarg || "#f59e0b", fontFamily: "monospace", lineHeight: 1 }}>{a.nuv_bud} kr</div>
                        <div style={{ fontSize: "9px", color: budFarg || "#888", fontFamily: "monospace" }}>↑ {a.hogst_budgivare}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "12px", color: "#555", fontFamily: "monospace", lineHeight: 1 }}>{a.reservpris} kr</div>
                        <div style={{ fontSize: "8px", color: "#333", fontFamily: "monospace" }}>reservpris</div>
                      </>
                    )}
                  </div>
                </div>
                {besokareNamn && a.saljare !== besokareNamn && a.hogst_budgivare !== besokareNamn && (() => {
                  const minBud = Math.max(a.reservpris || 0, (a.nuv_bud || 0) + 10);
                  if (activeBid?.id === a.id && activeBid?.type === "mark") {
                    return (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ fontSize: "8px", color: "#f59e0b", fontFamily: "monospace", marginBottom: "4px" }}>Min bud: {minBud} kr</div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input type="number" min={minBud} placeholder={`≥ ${minBud} kr`} value={bidBelopp} onChange={e => setBidBelopp(e.target.value)}
                            style={{ flex: 1, background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: "4px", padding: "4px 7px", fontSize: "11px", fontFamily: "monospace" }} />
                          <button onClick={() => laggBud(a.id, "mark")} disabled={pending || parseInt(bidBelopp) < minBud}
                            style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: "4px", padding: "4px 9px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>
                            {pending ? "…" : "Bud!"}
                          </button>
                          <button onClick={() => { setActiveBid(null); setBidBelopp(""); }}
                            style={{ background: "#1a1a1a", color: "#666", border: "1px solid #333", borderRadius: "4px", padding: "4px 7px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button onClick={() => { setActiveBid({ id: a.id, type: "mark" }); setBidBelopp(String(minBud)); }}
                      style={{ marginTop: "8px", width: "100%", background: "transparent", border: `1px solid ${rgba(BESOKARE_FARG, 0.35)}`, color: BESOKARE_FARG, borderRadius: "4px", padding: "5px", fontSize: "9px", fontFamily: "monospace", cursor: "pointer" }}>
                      🏷️ Lägg bud ({minBud}+ kr)
                    </button>
                  );
                })()}
                {besokareNamn && a.hogst_budgivare === besokareNamn && (
                  <div style={{ marginTop: "6px", fontSize: "9px", color: BESOKARE_FARG, fontFamily: "monospace", textAlign: "center" }}>✓ Du leder budgivningen</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ background: "#070b0d", borderLeft: "1px solid rgba(8,145,178,0.22)", borderRight: "1px solid rgba(8,145,178,0.22)", padding: "4px 20px 10px" }}>
          {varaAuktioner.length === 0 ? (
            <div style={{ fontSize: "11px", color: "#002030", fontFamily: "monospace", textAlign: "center", padding: "20px 0" }}>Inga aktiva varuauktioner just nu</div>
          ) : varaAuktioner.map(a => {
            const typ     = VARA_TYP[a.vara];
            const typFarg = typ ? TYP_FARG[typ] : "#22d3ee";
            const saljFarg = AGENT_VISUELL[a.saljare]?.ikonFarg || "#888";
            const budFarg  = a.hogst_budgivare ? (AGENT_VISUELL[a.hogst_budgivare]?.ikonFarg || "#22d3ee") : null;
            const harBud   = !!a.nuv_bud;
            return (
              <div key={a.id} style={{ background: "#0a0f12", border: `1px solid ${rgba(typFarg, 0.25)}`, borderLeft: `3px solid ${rgba(typFarg, 0.70)}`, borderRadius: "0 6px 6px 0", padding: "10px 12px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", color: typFarg, fontFamily: "monospace", fontWeight: 700 }}>{VARA_IKON[a.vara]} {a.antal}× {a.vara}</span>
                  <span style={{ fontSize: "9px", color: "#002030", fontFamily: "monospace", background: "#030f14", padding: "1px 5px", borderRadius: "3px" }}>{timeLeft(a.stanger_at)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "8px", color: "#3a3a3a", fontFamily: "monospace", marginBottom: "2px" }}>SÄLJS AV</div>
                    <div style={{ fontSize: "10px", color: saljFarg, fontFamily: "monospace" }}>{a.saljare}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {harBud ? (
                      <>
                        <div style={{ fontSize: "13px", color: budFarg || "#22d3ee", fontFamily: "monospace", lineHeight: 1 }}>{a.nuv_bud} kr</div>
                        <div style={{ fontSize: "9px", color: budFarg || "#888", fontFamily: "monospace" }}>↑ {a.hogst_budgivare}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "12px", color: "#555", fontFamily: "monospace", lineHeight: 1 }}>{a.reservpris} kr</div>
                        <div style={{ fontSize: "8px", color: "#333", fontFamily: "monospace" }}>reservpris</div>
                      </>
                    )}
                  </div>
                </div>
                {besokareNamn && a.saljare !== besokareNamn && a.hogst_budgivare !== besokareNamn && (() => {
                  const minBud = Math.max(a.reservpris || 0, (a.nuv_bud || 0) + 10);
                  if (activeBid?.id === a.id && activeBid?.type === "vara") {
                    return (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ fontSize: "8px", color: "#22d3ee", fontFamily: "monospace", marginBottom: "4px" }}>Min bud: {minBud} kr</div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input type="number" min={minBud} placeholder={`≥ ${minBud} kr`} value={bidBelopp} onChange={e => setBidBelopp(e.target.value)}
                            style={{ flex: 1, background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: "4px", padding: "4px 7px", fontSize: "11px", fontFamily: "monospace" }} />
                          <button onClick={() => laggBud(a.id, "vara")} disabled={pending || parseInt(bidBelopp) < minBud}
                            style={{ background: "#22d3ee", color: "#000", border: "none", borderRadius: "4px", padding: "4px 9px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>
                            {pending ? "…" : "Bud!"}
                          </button>
                          <button onClick={() => { setActiveBid(null); setBidBelopp(""); }}
                            style={{ background: "#1a1a1a", color: "#666", border: "1px solid #333", borderRadius: "4px", padding: "4px 7px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button onClick={() => { setActiveBid({ id: a.id, type: "vara" }); setBidBelopp(String(minBud)); }}
                      style={{ marginTop: "8px", width: "100%", background: "transparent", border: `1px solid ${rgba(BESOKARE_FARG, 0.35)}`, color: BESOKARE_FARG, borderRadius: "4px", padding: "5px", fontSize: "9px", fontFamily: "monospace", cursor: "pointer" }}>
                      📦 Lägg bud ({minBud}+ kr)
                    </button>
                  );
                })()}
                {besokareNamn && a.hogst_budgivare === besokareNamn && (
                  <div style={{ marginTop: "6px", fontSize: "9px", color: BESOKARE_FARG, fontFamily: "monospace", textAlign: "center" }}>✓ Du leder budgivningen</div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── ROW 3: Clearing-priser (alltid i linje) ── */}
        <div style={{ background: "#0b0a07", borderLeft: "1px solid rgba(245,158,11,0.22)", borderRight: "1px solid rgba(245,158,11,0.22)", borderTop: "1px solid #1a1600", padding: "14px 20px" }}>
          <p style={{ fontSize: "9px", color: "#3a3000", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>SENASTE CLEARING-PRISER</p>
          {Object.keys(TYP_FARG).map(typ => {
            const c = clearingPerTyp[typ];
            const farg = TYP_FARG[typ];
            return (
              <div key={typ} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "#0d0c08", borderLeft: `2px solid ${rgba(farg, 0.35)}`, borderRadius: "0 4px 4px 0", marginBottom: "3px" }}>
                <span style={{ fontSize: "10px", color: farg, fontFamily: "monospace" }}>{TYP_IKON[typ]} {TYP_NAMN[typ]}</span>
                <div style={{ textAlign: "right" }}>
                  {c ? (
                    <>
                      <div style={{ fontSize: "11px", color: c.estimated ? "#7a6a20" : "#f59e0b", fontFamily: "monospace" }}>
                        {c.estimated ? "~" : ""}{c.pris} kr
                      </div>
                      <div style={{ fontSize: "8px", color: "#2a2a2a", fontFamily: "monospace" }}>
                        {c.estimated ? "estimerat" : relativeTime(c.skapad)}
                      </div>
                    </>
                  ) : <div style={{ fontSize: "10px", color: "#2a2a2a", fontFamily: "monospace" }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: "#070b0d", borderLeft: "1px solid rgba(8,145,178,0.22)", borderRight: "1px solid rgba(8,145,178,0.22)", borderTop: "1px solid #001a20", padding: "14px 20px" }}>
          <p style={{ fontSize: "9px", color: "#003a4a", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>SENASTE CLEARING-PRISER</p>
          {Object.keys(VARA_IKON).map(vara => {
            const c = clearingPerVara[vara];
            const typ = VARA_TYP[vara];
            const farg = typ ? TYP_FARG[typ] : "#22d3ee";
            return (
              <div key={vara} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "#0a0f12", borderLeft: `2px solid ${rgba(farg, 0.35)}`, borderRadius: "0 4px 4px 0", marginBottom: "3px" }}>
                <span style={{ fontSize: "10px", color: farg, fontFamily: "monospace" }}>{VARA_IKON[vara]} {vara}</span>
                <div style={{ textAlign: "right" }}>
                  {c ? (
                    <>
                      <div style={{ fontSize: "11px", color: "#22d3ee", fontFamily: "monospace" }}>{c.pris} <span style={{ fontSize: "8px", color: "#003a4a" }}>kr/enhet</span></div>
                      <div style={{ fontSize: "8px", color: "#1a3a44", fontFamily: "monospace" }}>{relativeTime(c.skapad)}</div>
                    </>
                  ) : <div style={{ fontSize: "10px", color: "#1a3a44", fontFamily: "monospace" }}>—</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── ROW 4: Senaste handel (alltid i linje) ── */}
        <div style={{ background: "#0b0a07", borderLeft: "1px solid rgba(245,158,11,0.22)", borderRight: "1px solid rgba(245,158,11,0.22)", borderBottom: "1px solid rgba(245,158,11,0.22)", borderTop: "1px solid #1a1600", borderRadius: "0 0 10px 10px", padding: "14px 20px 18px" }}>
          <p style={{ fontSize: "9px", color: "#3a3000", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>SENASTE HANDEL</p>
          {transaktioner.length === 0 ? (
            <div style={{ fontSize: "10px", color: "#2a2200", fontFamily: "monospace", textAlign: "center", padding: "8px 0" }}>Ingen handel ännu</div>
          ) : transaktioner.slice(0, 5).map((t, i) => {
            const af = AGENT_VISUELL[t.kop_agent]?.ikonFarg || "#888";
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "#0d0c08", borderLeft: `2px solid ${rgba(af, 0.35)}`, marginBottom: "4px", borderRadius: "0 4px 4px 0" }}>
                <div>
                  <div style={{ fontSize: "10px", color: af, fontFamily: "monospace" }}>{t.kop_agent}</div>
                  <div style={{ fontSize: "9px", color: "#3a3a3a" }}>{t.zon_namn}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "monospace" }}>{t.pris} kr</div>
                  <div style={{ fontSize: "8px", color: "#2a2a2a", fontFamily: "monospace" }}>{relativeTime(t.skapad)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: "#070b0d", borderLeft: "1px solid rgba(8,145,178,0.22)", borderRight: "1px solid rgba(8,145,178,0.22)", borderBottom: "1px solid rgba(8,145,178,0.22)", borderTop: "1px solid #001a20", borderRadius: "0 0 10px 10px", padding: "14px 20px 18px" }}>
          <p style={{ fontSize: "9px", color: "#003a4a", fontFamily: "monospace", letterSpacing: "0.1em", margin: "0 0 8px" }}>SENASTE HANDEL</p>
          {handelLog.length === 0 ? (
            <div style={{ fontSize: "10px", color: "#002030", fontFamily: "monospace", textAlign: "center", padding: "8px 0" }}>Ingen handel ännu</div>
          ) : handelLog.slice(0, 6).map((h, i) => {
            const kFarg = AGENT_VISUELL[h.kop_agent]?.ikonFarg  || "#888";
            const sFarg = AGENT_VISUELL[h.salj_agent]?.ikonFarg || "#555";
            return (
              <div key={i} style={{ padding: "5px 8px", background: "#0a0f12", borderLeft: `2px solid ${rgba(kFarg, 0.35)}`, borderRadius: "0 4px 4px 0", marginBottom: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontFamily: "monospace" }}>
                    {VARA_IKON[h.vara] || "📦"}{" "}
                    <span style={{ color: kFarg }}>{h.kop_agent}</span>
                    <span style={{ color: "#222" }}> ← </span>
                    <span style={{ color: sFarg }}>{h.salj_agent}</span>
                  </span>
                  <span style={{ fontSize: "10px", color: "#22d3ee", fontFamily: "monospace" }}>{h.totalt} kr</span>
                </div>
                <div style={{ fontSize: "8px", color: "#1a3a44", fontFamily: "monospace", marginTop: "2px" }}>{h.antal}× {h.vara} · {relativeTime(h.skapad)}</div>
              </div>
            );
          })}
        </div>

      </div>{/* /marknader 4-raders grid */}

      {/* ── KÖPORDRAR ── */}
      {(() => {
        const alleOrdrar = [
          ...kopOrdrar.filter(o => !lokalaOrdrar.some(l => l.id === o.id)),
          ...lokalaOrdrar,
        ];
        return (
          <div style={{ background: "#070d07", border: "1px solid rgba(74,222,128,0.20)", borderRadius: "10px", overflow: "hidden", marginTop: "0" }}>
            {/* Header */}
            <div style={{ padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(74,222,128,0.12)", background: "#090f09" }}>
              <span style={{ fontSize: "18px" }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", color: "#4ade80", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>KÖPORDRAR</div>
                <div style={{ fontSize: "9px", color: "#1a3a1a", fontFamily: "monospace" }}>ÖNSKADE KÖP · AGENTER MATCHAR VID NÄSTA KÖRNING (09:30)</div>
              </div>
              {alleOrdrar.length > 0 && (
                <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "monospace", background: "rgba(74,222,128,0.10)", padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(74,222,128,0.20)" }}>
                  {alleOrdrar.length} öppna
                </span>
              )}
            </div>

            <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: besokareNamn ? "1fr 1fr" : "1fr", gap: "16px" }}>

              {/* Vänster: Ny köporder (bara för inloggade besökare) */}
              {besokareNamn && (
                <div>
                  <p style={{ fontSize: "9px", color: "#1a3a1a", fontFamily: "monospace", letterSpacing: "0.10em", margin: "0 0 10px" }}>NY KÖPORDER</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                      <div>
                        <div style={{ fontSize: "8px", color: "#2a3a2a", fontFamily: "monospace", marginBottom: "3px" }}>VARA</div>
                        <select value={kopOrderVara} onChange={e => setKopOrderVara(e.target.value)}
                          style={{ width: "100%", background: "#0d140d", border: "1px solid #1a2a1a", color: "#4ade80", borderRadius: "4px", padding: "5px 7px", fontSize: "10px", fontFamily: "monospace" }}>
                          {Object.keys(BASPRIS_VARA).map(v => (
                            <option key={v} value={v}>{VARA_IKON[v]} {v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: "8px", color: "#2a3a2a", fontFamily: "monospace", marginBottom: "3px" }}>ANTAL (1–20)</div>
                        <input type="number" min="1" max="20" value={kopOrderAntal} onChange={e => setKopOrderAntal(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", background: "#0d140d", border: "1px solid #1a2a1a", color: "#e0e0e0", borderRadius: "4px", padding: "5px 7px", fontSize: "10px", fontFamily: "monospace" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "8px", color: "#2a3a2a", fontFamily: "monospace", marginBottom: "3px" }}>MAX KR/ENHET</div>
                        <input type="number" min="1" placeholder={`≥ ${Math.ceil(BASPRIS_VARA[kopOrderVara] * 0.5)}`} value={kopOrderMaxPris} onChange={e => setKopOrderMaxPris(e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", background: "#0d140d", border: "1px solid #1a2a1a", color: "#e0e0e0", borderRadius: "4px", padding: "5px 7px", fontSize: "10px", fontFamily: "monospace" }} />
                      </div>
                    </div>
                    {kopOrderMaxPris && parseFloat(kopOrderMaxPris) > 0 && parseInt(kopOrderAntal) > 0 && (
                      <div style={{ fontSize: "9px", color: "#3a5a3a", fontFamily: "monospace" }}>
                        Reservation: {Math.ceil(parseInt(kopOrderAntal) * parseFloat(kopOrderMaxPris))} kr · Ditt saldo: {besokSaldo ?? "…"} kr
                      </div>
                    )}
                    <button onClick={laggKopOrder}
                      disabled={pending || !kopOrderMaxPris || parseFloat(kopOrderMaxPris) < Math.ceil(BASPRIS_VARA[kopOrderVara] * 0.5) || parseInt(kopOrderAntal) < 1}
                      style={{ background: pending ? "#1a2a1a" : "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.40)", color: "#4ade80", borderRadius: "4px", padding: "8px", fontSize: "10px", fontFamily: "monospace", cursor: "pointer", fontWeight: 700, letterSpacing: "0.05em" }}>
                      {pending ? "Lägger order…" : "📋 Lägg köporder"}
                    </button>
                    <div style={{ fontSize: "9px", color: "#2a3a2a", fontFamily: "monospace", lineHeight: 1.6 }}>
                      Beloppet reserveras nu. Agenter med lager matchar din order vid nästa dagliga körning kl 09:30. Eventuell skillnad mot ditt maxpris återbetalas automatiskt.
                    </div>
                  </div>
                </div>
              )}

              {/* Höger (eller full bredd om ej inloggad): Öppna ordrar */}
              <div>
                <p style={{ fontSize: "9px", color: "#1a3a1a", fontFamily: "monospace", letterSpacing: "0.10em", margin: "0 0 10px" }}>ÖPPNA ORDRAR</p>
                {alleOrdrar.length === 0 ? (
                  <div style={{ fontSize: "10px", color: "#1a2a1a", fontFamily: "monospace", textAlign: "center", padding: "16px 0" }}>
                    Inga öppna köpordrar
                    {!besokareNamn && <div style={{ fontSize: "9px", color: "#1a2a1a", marginTop: "6px" }}>Ladda sidan för att placera en order</div>}
                  </div>
                ) : alleOrdrar.map(o => {
                  const isMin = o.kop_agent === besokareNamn;
                  const varTyp = VARA_TYP[o.vara];
                  const farg = varTyp ? TYP_FARG[varTyp] : "#4ade80";
                  return (
                    <div key={o.id} style={{ background: "#0a140a", border: `1px solid ${rgba(farg, 0.22)}`, borderLeft: `3px solid ${rgba(farg, 0.60)}`, borderRadius: "0 6px 6px 0", padding: "9px 12px", marginBottom: "7px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", color: farg, fontFamily: "monospace", fontWeight: 700 }}>
                          {VARA_IKON[o.vara] || "📦"} {o.antal}× {o.vara}
                        </span>
                        {isMin ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "8px", color: "#4ade80", fontFamily: "monospace", background: "rgba(74,222,128,0.10)", padding: "1px 5px", borderRadius: "3px" }}>DIN ORDER</span>
                            <button onClick={() => avbrytKopOrder(o.id, o.reserverat_kr)} disabled={pending}
                              style={{ fontSize: "8px", color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "3px", padding: "1px 6px", cursor: "pointer", fontFamily: "monospace" }}>
                              ✕ avbryt
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontFamily: "monospace" }}>
                        <span style={{ color: "#2a4a2a" }}>Max {o.max_pris_per_enhet} kr/enhet</span>
                        <span style={{ color: "#1a3a1a" }}>{relativeTime(o.skapad)}</span>
                      </div>
                      <div style={{ fontSize: "9px", color: isMin ? "#3a6a3a" : "#1a3a1a", fontFamily: "monospace", marginTop: "3px" }}>
                        {o.kop_agent} · {o.reserverat_kr} kr reserverat
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
