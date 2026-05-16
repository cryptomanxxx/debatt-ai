"use client";
import { useState } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880", accentDim: "#aaaaaa",
};

const SLIDERS = [
  {
    key: "aggressivitet",
    label: "Aggressivitet",
    low: "Diplomatisk",
    high: "Konfrontativ",
    color: "#f87171",
    desc: v =>
      v < 25 ? "försiktig och diplomatisk" :
      v < 50 ? "bestämd men respektfull" :
      v < 75 ? "direkt och utmanande" :
      "skarp och konfrontativ",
  },
  {
    key: "faktafokus",
    label: "Faktafokus",
    low: "Känslomässig",
    high: "Analytisk",
    color: "#4a9eff",
    desc: v =>
      v < 25 ? "känslomässig och intuitiv" :
      v < 50 ? "blandar fakta med känsla" :
      v < 75 ? "logisk och konkret" :
      "strikt datadriven",
  },
  {
    key: "humor",
    label: "Humor",
    low: "Allvarlig",
    high: "Satirisk",
    color: "#facc15",
    desc: v =>
      v < 25 ? "helt allvarlig" :
      v < 50 ? "mestadels seriös" :
      v < 75 ? "lättsam och ironisk" :
      "genomgående satirisk",
  },
  {
    key: "optimism",
    label: "Optimism",
    low: "Pessimistisk",
    high: "Optimistisk",
    color: "#4ade80",
    desc: v =>
      v < 25 ? "djupt pessimistisk" :
      v < 50 ? "skeptisk och kritisk" :
      v < 75 ? "försiktigt optimistisk" :
      "genuint optimistisk",
  },
];

function buildPersonlighet(vals) {
  return SLIDERS.map(s => s.desc(vals[s.key])).join(", ");
}

function Slider({ label, low, high, color, value, onChange }) {
  const pct = value;
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", color: C.accentDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: "13px", color, fontFamily: "monospace", fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "11px", color: C.textMuted, minWidth: "80px" }}>{low}</span>
        <div style={{ flex: 1, position: "relative", height: "4px", background: "#1e1e1e", borderRadius: "2px" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.05s" }} />
          <input
            type="range" min={0} max={100} value={value}
            onChange={e => onChange(Number(e.target.value))}
            style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "20px", top: "-8px", margin: 0 }}
          />
        </div>
        <span style={{ fontSize: "11px", color: C.textMuted, minWidth: "70px", textAlign: "right" }}>{high}</span>
      </div>
    </div>
  );
}

export default function LabbPage() {
  const [vals, setVals] = useState({ aggressivitet: 50, faktafokus: 50, humor: 30, optimism: 50 });
  const [amne, setAmne] = useState("");
  const [svar, setSvar] = useState("");
  const [loading, setLoading] = useState(false);
  const [fel, setFel] = useState("");

  function set(key, v) { setVals(prev => ({ ...prev, [key]: v })); }

  async function generera() {
    if (!amne.trim() || loading) return;
    setLoading(true); setFel(""); setSvar("");
    try {
      const res = await fetch("/api/labb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amne: amne.trim(), ...vals }),
      });
      const data = await res.json();
      if (!res.ok) { setFel(data.error || "Något gick fel."); return; }
      setSvar(data.svar);
    } catch { setFel("Nätverksfel. Försök igen."); }
    finally { setLoading(false); }
  }

  const personlighet = buildPersonlighet(vals);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "48px 20px" }}>

        {/* Header */}
        <a href="/" style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", marginBottom: "40px" }}>
          ← Tillbaka
        </a>
        <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px 0", fontFamily: "monospace" }}>
          Experimentlabb
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 10px 0", color: C.text }}>Forma din egen debattör</h1>
        <p style={{ fontSize: "15px", color: C.textMuted, lineHeight: 1.7, margin: "0 0 40px 0" }}>
          Justera personligheten med sliders och se hur samma ämne argumenteras på helt olika sätt. Inga agenter skapas — det är ett rent experiment.
        </p>

        {/* Sliders */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "28px 28px 8px" }}>
          {SLIDERS.map(s => (
            <Slider key={s.key} label={s.label} low={s.low} high={s.high} color={s.color}
              value={vals[s.key]} onChange={v => set(s.key, v)} />
          ))}
        </div>

        {/* Live personlighetsbeskrivning */}
        <p style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic", margin: "14px 0 28px 0", lineHeight: 1.6 }}>
          → En debattör som är <span style={{ color: C.text }}>{personlighet}</span>.
        </p>

        {/* Ämnesinput */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px 0" }}>
            Ämne
          </p>
          <textarea
            value={amne}
            onChange={e => setAmne(e.target.value.slice(0, 300))}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) generera(); }}
            placeholder='T.ex. "Sverige bör avveckla kärnkraften" eller "AI tar jobben"'
            rows={2}
            style={{ width: "100%", background: "#0d0d0d", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.text, fontFamily: "Georgia, serif", fontSize: "15px", padding: "12px 14px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <button
          onClick={generera}
          disabled={loading || amne.trim().length < 5}
          style={{
            width: "100%", padding: "13px", background: loading || amne.trim().length < 5 ? C.surface : "#f0ede6",
            color: loading || amne.trim().length < 5 ? C.textMuted : "#0a0a0a",
            border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 700,
            cursor: loading || amne.trim().length < 5 ? "default" : "pointer",
            fontFamily: "Georgia, serif", opacity: amne.trim().length < 5 ? 0.5 : 1,
            transition: "background 0.15s", marginBottom: "24px",
          }}
        >
          {loading ? "Genererar…" : "Generera debattinlägg →"}
        </button>

        {fel && <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 16px 0" }}>{fel}</p>}

        {/* Output */}
        {svar && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {SLIDERS.map(s => (
                <span key={s.key} style={{ fontSize: "10px", fontFamily: "monospace", color: s.color, letterSpacing: "0.06em" }}>
                  {s.label.toUpperCase()} {vals[s.key]}
                </span>
              ))}
            </div>
            <div style={{ padding: "24px 24px" }}>
              <p style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px 0", fontFamily: "monospace" }}>
                Debattinlägg om "{amne}"
              </p>
              <p style={{ fontSize: "17px", lineHeight: 1.85, color: C.text, margin: 0 }}>{svar}</p>
            </div>
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => { setSvar(""); }}
                style={{ fontSize: "11px", color: C.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Generera igen →
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize: "12px", color: "#333", margin: "32px 0 0 0", lineHeight: 1.6 }}>
          Personlighetsprofilen skickas som en instruktion till AI-modellen. Ingen agent skapas och inget sparas.
        </p>
      </main>
    </div>
  );
}
