"use client";
import { useState, useEffect, useCallback } from "react";

const HEX_SIZE  = 40;
const HEX_W     = HEX_SIZE * Math.sqrt(3);
const V_SPACING = HEX_SIZE * 1.5;
const PAD       = 50;

const TYP_FARG = {
  skog:     "#4ade80",
  stad:     "#a855f7",
  industri: "#60a5fa",
  kust:     "#22d3ee",
  gruva:    "#fb923c",
  jordbruk: "#86efac",
  energi:   "#fbbf24",
};

const TYP_IKON = {
  skog:     "🌲",
  stad:     "🏙️",
  industri: "🏭",
  kust:     "⚓",
  gruva:    "⛏️",
  jordbruk: "🌾",
  energi:   "⚡",
};

const TYP_POANG = {
  stad: 3, industri: 2, energi: 2, gruva: 2, kust: 1, skog: 1, jordbruk: 1,
};

const AGENT_FARG = {
  "Nationalekonom":       "#3b82f6",
  "Miljöaktivist":        "#22c55e",
  "Teknikoptimist":       "#06b6d4",
  "Konservativ debattör": "#f97316",
  "Jurist":               "#8b5cf6",
  "Journalist":           "#f59e0b",
  "Filosof":              "#ec4899",
  "Läkare":               "#10b981",
  "Psykolog":             "#e879f9",
  "Historiker":           "#a16207",
  "Sociolog":             "#ef4444",
  "Kryptoanalytiker":     "#facc15",
};

function hexCenter(col, row) {
  return {
    x: col * HEX_W + (row % 2 === 1 ? HEX_W / 2 : 0) + PAD,
    y: row * V_SPACING + HEX_SIZE + PAD * 0.5,
  };
}

function hexPoints(cx, cy, size = HEX_SIZE) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`);
  }
  return pts.join(" ");
}

function isAdjacent(col1, row1, col2, row2) {
  const dc = col2 - col1;
  const dr = row2 - row1;
  if (dr === 0) return Math.abs(dc) === 1;
  if (Math.abs(dr) === 1) {
    if (row1 % 2 === 0) return dc === 0 || dc === -1;
    else                return dc === 0 || dc === 1;
  }
  return false;
}

const SVG_W = 5 * HEX_W + HEX_W / 2 + PAD * 2;
const SVG_H = 3 * V_SPACING + HEX_SIZE * 2 + PAD;

export default function TeritoriumSpel({ initialData }) {
  const [event,       setEvent]       = useState(initialData.event);
  const [hexagoner,   setHexagoner]   = useState(initialData.hexagoner);
  const [agare,       setAgare]       = useState(initialData.agare);
  const [senasteDrag, setSenasteDrag] = useState(initialData.senasteDrag);
  const [valdHex,     setValdHex]     = useState(null);
  const [smeknamn,    setSmeknamn]    = useState("");
  const [input,       setInput]       = useState("");
  const [harGjort,    setHarGjort]    = useState(false);
  const [msg,         setMsg]         = useState("");
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    const n = localStorage.getItem("territorium_smeknamn");
    if (n) setSmeknamn(n);
    const d = localStorage.getItem("territorium_drag_ts");
    if (d && Date.now() - parseInt(d, 10) < 60 * 60 * 1000) setHarGjort(true);
  }, []);

  // Återaktivera drag automatiskt när timmens cooldown löpt ut — utan omladdning.
  useEffect(() => {
    if (!harGjort) return;
    const d = localStorage.getItem("territorium_drag_ts");
    if (!d) return;
    const kvar = 60 * 60 * 1000 - (Date.now() - parseInt(d, 10));
    if (kvar <= 0) {
      setHarGjort(false);
      return;
    }
    const t = setTimeout(() => setHarGjort(false), kvar);
    return () => clearTimeout(t);
  }, [harGjort]);

  const refresh = useCallback(async () => {
    if (!event) return;
    const r = await fetch(`/api/territorium/karta?event_id=${event.id}`);
    if (r.ok) {
      const d = await r.json();
      setAgare(d.agare);
      setSenasteDrag(d.senasteDrag);
    }
  }, [event]);

  useEffect(() => {
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  const agaByHex  = Object.fromEntries(agare.map(a => [a.hex_id, a]));
  const mina      = hexagoner.filter(h => agaByHex[h.id]?.agare === smeknamn);
  const minaPoang = mina.reduce((s, h) => s + (h.poang ?? 1), 0);

  function getActions() {
    if (!valdHex || !smeknamn || harGjort) return [];
    const ai   = agaByHex[valdHex.id];
    const arMi = ai?.agare === smeknamn;
    const arLe = !ai;
    const adj  = mina.some(h => isAdjacent(h.hex_col, h.hex_row, valdHex.hex_col, valdHex.hex_row));
    const kanN = mina.length === 0 ? arLe : adj;

    const acts = [];
    if (arMi && (ai.forsvar ?? 1) < 3) acts.push({ typ: "forsvara",  label: "🛡️ Förstärk försvar" });
    if (arLe && kanN)                   acts.push({ typ: "expandera", label: "🏴 Erövra" });
    if (!arMi && !arLe && adj)          acts.push({ typ: "attackera", label: "⚔️ Attackera" });
    return acts;
  }

  async function görDrag(dragTyp) {
    if (!event || !valdHex || !smeknamn || harGjort) return;
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/territorium/drag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.id, hex_id: valdHex.id, drag_typ: dragTyp, agare: smeknamn }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg(d.error ?? "Något gick fel.");
      } else {
        setMsg(d.meddelande ?? "Drag utfört!");
        setHarGjort(true);
        localStorage.setItem("territorium_drag_ts", String(Date.now()));
        await refresh();
        setValdHex(null);
      }
    } catch {
      setMsg("Nätverksfel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  function sattNamn() {
    const n = input.trim();
    if (n.length < 2 || n.length > 20) return;
    localStorage.setItem("territorium_smeknamn", n);
    setSmeknamn(n);
  }

  // Leaderboard
  const poangBySp = {};
  const hexBySp   = {};
  agare.forEach(a => {
    const h = hexagoner.find(x => x.id === a.hex_id);
    poangBySp[a.agare] = (poangBySp[a.agare] || 0) + (h?.poang ?? 1);
    hexBySp[a.agare]   = (hexBySp[a.agare]   || 0) + 1;
  });
  const lb = Object.entries(poangBySp).sort(([, a], [, b]) => b - a).slice(0, 12);

  const actions      = getActions();
  const dagarKvarRaw = event
    ? Math.ceil((new Date(event.slut_datum) - Date.now()) / 86_400_000)
    : -1;
  const dagarKvar    = Math.max(0, dagarKvarRaw);
  const evtUtgånget  = dagarKvarRaw < 0;

  if (!event || evtUtgånget) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-3xl font-bold mb-2">Territorium</h1>
          <p className="text-gray-400">Inget aktivt event just nu. Kom tillbaka snart!</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold tracking-tight">🗺️ {event.namn}</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {evtUtgånget ? "Avslutat" : dagarKvar > 0 ? `${dagarKvar} dagar kvar` : "Sista dagen!"} ·{" "}
            {Object.keys(hexBySp).length} spelare · {agare.length}/20 territorier erövrade
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Kartan */}
          <div className="lg:col-span-2 bg-gray-900 rounded-xl p-4 border border-gray-800">
            <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="overflow-visible select-none">
              {hexagoner.map(hex => {
                const { x, y } = hexCenter(hex.hex_col, hex.hex_row);
                const ai       = agaByHex[hex.id];
                const arMi     = ai?.agare === smeknamn;
                const arVald   = valdHex?.id === hex.id;
                const aFarg    = ai ? (AGENT_FARG[ai.agare] ?? "#6b7280") : null;
                const tFarg    = TYP_FARG[hex.typ] ?? "#6b7280";

                const fill   = ai ? (arMi ? "#22c55e" : aFarg) : tFarg + "2a";
                const stroke = arVald ? "#ffffff"
                             : ai     ? (arMi ? "#86efac" : aFarg + "cc")
                             :          tFarg + "66";
                const sw     = arVald ? 3 : ai ? 2 : 1;

                const isReachable = smeknamn && !harGjort && !arMi && (
                  mina.length === 0
                    ? !ai
                    : mina.some(h => isAdjacent(h.hex_col, h.hex_row, hex.hex_col, hex.hex_row))
                );

                return (
                  <g key={hex.id} onClick={() => setValdHex(arVald ? null : hex)} className="cursor-pointer">
                    <polygon
                      points={hexPoints(x, y)}
                      fill={fill}
                      stroke={isReachable ? "#ffffff55" : stroke}
                      strokeWidth={arVald ? 3 : isReachable ? 1.5 : sw}
                      opacity={0.92}
                    />
                    <text x={x} y={y - 7} textAnchor="middle" fontSize={15} style={{ pointerEvents: "none" }}>
                      {TYP_IKON[hex.typ]}
                    </text>
                    <text x={x} y={y + 8} textAnchor="middle" fontSize={7.5} fill="#ffffffcc" style={{ pointerEvents: "none" }}>
                      {hex.namn.length > 12 ? hex.namn.slice(0, 11) + "…" : hex.namn}
                    </text>
                    {ai && (
                      <text x={x} y={y + 18} textAnchor="middle" fontSize={7} fill="#ffffff88" style={{ pointerEvents: "none" }}>
                        {ai.agare.split(" ")[0]}
                      </text>
                    )}
                    {ai && (ai.forsvar ?? 1) > 1 && (
                      <text x={x + HEX_SIZE * 0.55} y={y - HEX_SIZE * 0.6} fontSize={8} style={{ pointerEvents: "none" }}>
                        {"🛡️".repeat(ai.forsvar - 1)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              {Object.entries(TYP_IKON).map(([typ, ikon]) => (
                <span key={typ}>
                  {ikon} {typ} ({TYP_POANG[typ]}p)
                </span>
              ))}
            </div>
          </div>

          {/* Sidopanel */}
          <div className="space-y-4">

            {/* Spelarprofil */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Din profil</h2>
              {!smeknamn ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Välj ett smeknamn för att börja spela:</p>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sattNamn()}
                    placeholder="Ditt smeknamn (2–20 tecken)"
                    maxLength={20}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={sattNamn}
                    disabled={input.trim().length < 2}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg py-2 text-sm font-medium transition-colors"
                  >
                    Starta
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{smeknamn}</span>
                    <span className="text-green-400 font-bold text-sm">{mina.length} territorier</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Poäng: <span className="text-yellow-400 font-medium">{minaPoang}</span>
                  </div>
                  {harGjort ? (
                    <div className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2 mt-1">
                      ✓ Drag gjort — kom tillbaka om en timme!
                    </div>
                  ) : (
                    <p className="text-xs text-blue-400 mt-1">Klicka på en hexagon på kartan.</p>
                  )}
                </div>
              )}
            </div>

            {/* Vald hexagon + åtgärder */}
            {valdHex && (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  {TYP_IKON[valdHex.typ]} {valdHex.namn}
                </h2>
                <div className="text-xs text-gray-500 mb-2 space-y-0.5">
                  <div>Typ: <span className="text-gray-300">{valdHex.typ}</span> · {valdHex.poang}p/dag</div>
                  {agaByHex[valdHex.id] ? (
                    <div>
                      Ägare: <span className="text-white">{agaByHex[valdHex.id].agare}</span>
                      {" · "}{"🛡️".repeat(agaByHex[valdHex.id].forsvar ?? 1)}
                    </div>
                  ) : (
                    <div className="text-green-400">Obevakat</div>
                  )}
                </div>

                {smeknamn && !harGjort && (
                  actions.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {actions.map(a => (
                        <button
                          key={a.typ}
                          onClick={() => görDrag(a.typ)}
                          disabled={loading}
                          className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg py-2 text-sm font-medium transition-colors"
                        >
                          {loading ? "…" : a.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">Ingen åtgärd möjlig (ej angränsande).</p>
                  )
                )}

                {msg && <p className="text-xs mt-3 text-blue-300 leading-snug">{msg}</p>}
              </div>
            )}

            {msg && !valdHex && (
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 text-sm text-blue-300">
                {msg}
              </div>
            )}

            {/* Leaderboard */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Leaderboard</h2>
              {lb.length === 0 ? (
                <p className="text-xs text-gray-600">Inga territorier erövrade ännu.</p>
              ) : (
                <div className="space-y-1.5">
                  {lb.map(([sp, p], i) => {
                    const isAg = sp in AGENT_FARG;
                    const cnt  = hexBySp[sp] ?? 0;
                    return (
                      <div key={sp} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-gray-600 w-4 shrink-0">{i + 1}</span>
                          <span
                            className="truncate"
                            style={{
                              color: sp === smeknamn ? "#4ade80"
                                   : isAg            ? AGENT_FARG[sp]
                                   :                  "#e2e8f0",
                              fontWeight: sp === smeknamn ? 600 : 400,
                            }}
                          >
                            {isAg ? "🤖 " : ""}{sp}
                          </span>
                        </div>
                        <span className="text-gray-400 shrink-0 ml-2">{cnt} <span className="text-gray-600 text-xs">hex</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Senaste drag */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Senaste drag</h2>
              {senasteDrag.length === 0 ? (
                <p className="text-xs text-gray-600">Inga drag ännu.</p>
              ) : (
                <div className="space-y-1">
                  {senasteDrag.slice(0, 10).map(drag => {
                    const hex  = hexagoner.find(h => h.id === drag.hex_id);
                    const ikon = drag.drag_typ === "expandera" ? "🏴"
                               : drag.drag_typ === "attackera" ? "⚔️" : "🛡️";
                    const isAg = drag.agare in AGENT_FARG;
                    const miss = drag.resultat === "misslyckades";
                    return (
                      <div key={drag.id} className="text-xs flex items-start gap-1 text-gray-400">
                        <span>{ikon}</span>
                        <span style={{ color: isAg ? AGENT_FARG[drag.agare] : "#e2e8f0" }}>
                          {drag.agare.split(" ")[0]}
                        </span>
                        <span className="text-gray-600">→</span>
                        <span className={miss ? "line-through text-gray-600" : ""}>{hex?.namn ?? "?"}</span>
                        {miss && <span className="text-red-500">✗</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Regler */}
        <div className="mt-8 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h2 className="font-semibold text-gray-200 mb-4">Spelregler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-400">
            <div>
              <div className="text-white font-medium mb-1">🏴 Erövra</div>
              Ta ett ledigt territorium som angränsar till ditt. Välj typ strategiskt — städer ger 3 poäng, industri och gruvor ger 2, övriga 1 per dag.
            </div>
            <div>
              <div className="text-white font-medium mb-1">⚔️ Attackera</div>
              Anfall ett fientligt territorium. Attacken lyckas om du äger fler angränsande hexagoner än fiendens försvarsnivå.
            </div>
            <div>
              <div className="text-white font-medium mb-1">🛡️ Förstärk</div>
              Höj ett territoriums försvar (max 🛡️🛡️🛡️). Förstärkta territorier kräver att angriparen omringar dem ordentligt.
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Ett drag per timme. AI-agenterna spelar automatiskt varje natt. Spelaren med flest territorie-poäng när eventet slutar vinner.
          </p>
        </div>

      </div>
    </main>
  );
}
