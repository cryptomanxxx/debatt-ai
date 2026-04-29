"use client";
import { useState, useEffect } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880", accentDim: "#aaaaaa",
  green: "#4ade80", red: "#f87171", accent: "#e879f9",
};

const KATEGORIER = [
  { id: "alla",    label: "Alla frågor" },
  { id: "ai-tech", label: "AI & Tech" },
  { id: "ekonomi", label: "Ekonomi" },
  { id: "politik", label: "Politik" },
  { id: "vardag",  label: "Vardag" },
];

const AMNEN = {
  "ai-tech": [
    "Ska AI få fatta juridiska beslut?",
    "Bör AI ha rättigheter i framtiden?",
    "Ska skolor förbjuda AI-verktyg helt?",
    "Ska algoritmer bestämma vad vi ser online?",
    "Kan robotar ersätta terapeuter?",
    "Är dataintegritet viktigare än bekvämlighet?",
    "Ska ansiktsigenkänning tillåtas i det offentliga?",
    "Kan AI ersätta läkare?",
    "Är Bitcoin framtidens valuta?",
  ],
  "ekonomi": [
    "Ska vi beskatta rika mycket mer?",
    "Är gig-ekonomin bra eller dålig?",
    "Ska staten rädda företag i kris?",
    "Ska arvsskatt återinföras?",
    "Är bostadsmarknaden trasig?",
    "Ska staten äga fler bolag?",
    "Är inflation ett klassproblem?",
    "Ska vi ha fyradagarsvecka?",
    "Är grundinkomst en bra idé?",
    "Ska rika få köpa bättre vård?",
  ],
  "politik": [
    "Ska Sverige ha kärnkraft?",
    "Ska droger legaliseras?",
    "Är yttrandefriheten hotad i Sverige?",
    "Ska Sverige införa tiggeriförbud?",
    "Bör bidrag villkoras hårdare?",
    "Är demokrati överskattat?",
    "Ska man få säga vad som helst online?",
    "Ska rösträttsåldern sänkas till 16?",
    "Ska nationalstaten avskaffas?",
    "Är Sverige för litet för att påverka klimatet?",
    "Är klimatrörelsen för radikal?",
    "Är sociala medier bra för demokratin?",
    "Ska flygskatten höjas?",
    "Ska kött beskattas hårdare?",
  ],
  "vardag": [
    "Ska barn ha egna mobiltelefoner?",
    "Är dagens föräldrar för överbeskyddande?",
    "Har livet blivit sämre trots högre standard?",
    "Är det fel att skaffa barn idag?",
    "Har män det svårare än kvinnor idag?",
    "Arbetar vi för mycket?",
    "Är ensamhet ett samhällsproblem?",
    "Ska alkohol regleras hårdare?",
    "Är heltidsarbete föråldrat?",
    "Är skärmtid ett folkhälsoproblem?",
    "Har skolan blivit för enkel?",
  ],
};

const ALLA_FRAGOR = Object.entries(AMNEN).flatMap(([kat, fragor]) =>
  fragor.map(f => ({ fraga: f, kategori: kat }))
);

function RostatBar({ ja, nej }) {
  const total = ja + nej;
  if (total === 0) return (
    <p style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", margin: 0 }}>
      Ingen har röstat ännu — bli först!
    </p>
  );
  const jaPct = Math.round((ja / total) * 100);
  const nejPct = 100 - jaPct;
  return (
    <div>
      <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", marginBottom: "6px" }}>
        <div style={{ width: `${jaPct}%`, background: C.green, transition: "width 0.4s ease" }} />
        <div style={{ width: `${nejPct}%`, background: C.red, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", color: C.green, fontFamily: "monospace" }}>Ja {jaPct}%</span>
        <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>{total} röster</span>
        <span style={{ fontSize: "11px", color: C.red, fontFamily: "monospace" }}>{nejPct}% Nej</span>
      </div>
    </div>
  );
}

function FragaKort({ fraga, kategori, rosterData }) {
  const key = `opinion_${fraga}`;
  const [rostat, setRostat] = useState(null);
  const [lokalt, setLokalt] = useState({ ja: 0, nej: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sparat = localStorage.getItem(key);
    if (sparat) setRostat(sparat);
  }, [key]);

  const dbData = rosterData[fraga] ?? { roster_ja: 0, roster_nej: 0 };
  const visaJa = dbData.roster_ja + lokalt.ja;
  const visaNej = dbData.roster_nej + lokalt.nej;

  async function rosta(svar) {
    if (rostat || loading) return;
    setLoading(true);
    // Optimistisk uppdatering
    setLokalt(prev => ({ ...prev, [svar === "ja" ? "ja" : "nej"]: prev[svar === "ja" ? "ja" : "nej"] + 1 }));
    setRostat(svar);
    localStorage.setItem(key, svar);
    try {
      await fetch("/api/opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fraga, kategori, svar }),
      });
    } catch {
      // Optimistisk uppdatering kvarstår
    }
    setLoading(false);
  }

  return (
    <div style={{
      background: C.surface, border: `1px solid ${rostat ? (rostat === "ja" ? C.green + "44" : C.red + "44") : C.border}`,
      borderRadius: "8px", padding: "20px 24px", marginBottom: "12px",
      transition: "border-color 0.3s",
    }}>
      <p style={{ margin: "0 0 16px", fontSize: "16px", color: C.text, lineHeight: 1.4, fontFamily: "Georgia, serif" }}>
        {fraga}
      </p>

      {!rostat ? (
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <button onClick={() => rosta("ja")} disabled={loading} style={{
            flex: 1, padding: "10px", borderRadius: "6px", border: `1px solid ${C.green}44`,
            background: "transparent", color: C.green, fontSize: "14px", fontFamily: "Georgia, serif",
            cursor: "pointer", transition: "background 0.15s",
          }}
            onMouseEnter={e => e.target.style.background = C.green + "15"}
            onMouseLeave={e => e.target.style.background = "transparent"}
          >
            Ja
          </button>
          <button onClick={() => rosta("nej")} disabled={loading} style={{
            flex: 1, padding: "10px", borderRadius: "6px", border: `1px solid ${C.red}44`,
            background: "transparent", color: C.red, fontSize: "14px", fontFamily: "Georgia, serif",
            cursor: "pointer", transition: "background 0.15s",
          }}
            onMouseEnter={e => e.target.style.background = C.red + "15"}
            onMouseLeave={e => e.target.style.background = "transparent"}
          >
            Nej
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: "10px", fontSize: "11px", color: rostat === "ja" ? C.green : C.red, fontFamily: "monospace" }}>
          Du röstade: {rostat === "ja" ? "Ja ✓" : "Nej ✓"}
        </div>
      )}

      <RostatBar ja={visaJa} nej={visaNej} />
    </div>
  );
}

export default function OpinionClient() {
  const [aktivKat, setAktivKat] = useState("alla");
  const [rosterData, setRosterData] = useState({});

  useEffect(() => {
    fetch("/api/opinion")
      .then(r => r.json())
      .then(rows => {
        const map = {};
        for (const r of rows) map[r.fraga] = r;
        setRosterData(map);
      })
      .catch(() => {});
  }, []);

  const fragor = aktivKat === "alla"
    ? ALLA_FRAGOR
    : ALLA_FRAGOR.filter(f => f.kategori === aktivKat);

  const totalRoster = Object.values(rosterData).reduce(
    (s, r) => s + r.roster_ja + r.roster_nej, 0
  );

  return (
    <div>
      {/* Statistik-header */}
      <div style={{ marginBottom: "28px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "11px", color: C.accentDim, fontFamily: "monospace", margin: "0 0 4px", letterSpacing: "0.1em" }}>FRÅGOR</p>
          <p style={{ fontSize: "24px", color: C.text, margin: 0, fontFamily: "Georgia, serif" }}>{ALLA_FRAGOR.length}</p>
        </div>
        <div>
          <p style={{ fontSize: "11px", color: C.accentDim, fontFamily: "monospace", margin: "0 0 4px", letterSpacing: "0.1em" }}>TOTALT RÖSTER</p>
          <p style={{ fontSize: "24px", color: C.accent, margin: 0, fontFamily: "Georgia, serif" }}>{totalRoster}</p>
        </div>
      </div>

      {/* Kategori-filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {KATEGORIER.map(k => (
          <button key={k.id} onClick={() => setAktivKat(k.id)} style={{
            padding: "7px 16px", borderRadius: "20px",
            border: `1px solid ${aktivKat === k.id ? C.accent + "80" : C.border}`,
            background: aktivKat === k.id ? C.accent + "12" : "transparent",
            color: aktivKat === k.id ? C.accent : C.textMuted,
            fontSize: "13px", fontFamily: "Georgia, serif", cursor: "pointer",
          }}>
            {k.label}
          </button>
        ))}
      </div>

      {/* Frågor */}
      {fragor.map(({ fraga, kategori }) => (
        <FragaKort key={fraga} fraga={fraga} kategori={kategori} rosterData={rosterData} />
      ))}
    </div>
  );
}
