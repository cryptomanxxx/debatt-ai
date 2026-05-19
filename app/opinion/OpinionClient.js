"use client";
import { useState, useEffect } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880", accentDim: "#aaaaaa",
  green: "#4ade80", red: "#f87171", yellow: "#facc15", accent: "#e879f9",
};

const KATEGORIER = [
  { id: "alla",         label: "Alla frågor" },
  { id: "ai-tech",      label: "AI & Tech" },
  { id: "ekonomi",      label: "Ekonomi" },
  { id: "politik",      label: "Politik" },
  { id: "vardag",       label: "Vardag" },
  { id: "agentfragor",  label: "Agentfrågor" },
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

function RostatBar({ ja, nej, osaker, label, color }) {
  const total = ja + nej + (osaker || 0);
  if (total === 0) return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
      <span style={{ fontSize: "10px", color, fontFamily: "monospace", letterSpacing: "0.08em", minWidth: "72px" }}>{label}</span>
      <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>–</span>
    </div>
  );
  const jaPct = Math.round((ja / total) * 100);
  const osakPct = Math.round(((osaker || 0) / total) * 100);
  const nejPct = 100 - jaPct - osakPct;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
      <span style={{ fontSize: "10px", color, fontFamily: "monospace", letterSpacing: "0.08em", minWidth: "72px", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", height: "5px", borderRadius: "3px", overflow: "hidden", marginBottom: "3px" }}>
          <div style={{ width: `${jaPct}%`, background: C.green, transition: "width 0.4s ease" }} />
          <div style={{ width: `${osakPct}%`, background: C.yellow, transition: "width 0.4s ease" }} />
          <div style={{ width: `${nejPct}%`, background: C.red, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <span style={{ fontSize: "10px", color: C.green, fontFamily: "monospace" }}>Ja {jaPct}%</span>
          <span style={{ fontSize: "10px", color: C.yellow, fontFamily: "monospace" }}>{osakPct > 0 ? `Osäker ${osakPct}%` : ""}</span>
          <span style={{ fontSize: "10px", color: C.red, fontFamily: "monospace" }}>Nej {nejPct}%</span>
          <span style={{ fontSize: "10px", color: C.textMuted, fontFamily: "monospace", marginLeft: "auto" }}>{total} röster</span>
        </div>
      </div>
    </div>
  );
}

function FragaKort({ fraga, kategori, rosterData, onVote, isAgent = false }) {
  const key = `opinion_${fraga}`;
  const [rostat, setRostat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sparat = localStorage.getItem(key);
    if (sparat) setRostat(sparat);
  }, [key]);

  const dbData = rosterData[fraga] ?? { roster_ja: 0, roster_nej: 0, roster_osaker: 0, ai_ja: 0, ai_nej: 0, ai_osaker: 0 };
  const visaJa = dbData.roster_ja;
  const visaNej = dbData.roster_nej;
  const visaOsaker = dbData.roster_osaker || 0;
  const aiJa = dbData.ai_ja || 0;
  const aiNej = dbData.ai_nej || 0;
  const aiOsaker = dbData.ai_osaker || 0;

  async function rosta(svar) {
    if (rostat || loading) return;
    setLoading(true);
    setRostat(svar);
    localStorage.setItem(key, svar);
    onVote(fraga, kategori, svar);
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
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
        <p style={{ margin: 0, fontSize: "16px", color: C.text, lineHeight: 1.4, fontFamily: "Georgia, serif", flex: 1 }}>
          {fraga}
        </p>
        {isAgent && (
          <span style={{ fontSize: "9px", color: "#4a9eff", fontFamily: "monospace", letterSpacing: "0.1em", border: "1px solid #4a9eff44", borderRadius: "3px", padding: "2px 5px", flexShrink: 0, marginTop: "3px" }}>AI</span>
        )}
      </div>

      {!rostat ? (
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          {[["ja","Ja",C.green],["osaker","Osäker",C.yellow],["nej","Nej",C.red]].map(([svar,lbl,color]) => (
            <button key={svar} onClick={() => rosta(svar)} disabled={loading} style={{
              flex: 1, padding: "10px", borderRadius: "6px", border: `1px solid ${color}44`,
              background: "transparent", color, fontSize: "14px", fontFamily: "Georgia, serif",
              cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseEnter={e => e.target.style.background = color + "15"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              {lbl}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: "10px", fontSize: "11px", color: rostat === "ja" ? C.green : rostat === "nej" ? C.red : C.yellow, fontFamily: "monospace" }}>
          Du röstade: {rostat === "ja" ? "Ja ✓" : rostat === "nej" ? "Nej ✓" : "Osäker ✓"}
        </div>
      )}

      <div style={{ marginTop: "4px" }}>
        <RostatBar ja={visaJa} nej={visaNej} osaker={visaOsaker} label="BESÖKARE" color="#aaaaaa" />
        <RostatBar ja={aiJa} nej={aiNej} osaker={aiOsaker} label="AI-AGENTER" color="#4a9eff" />
      </div>
    </div>
  );
}

const HARDCODED_SET = new Set(ALLA_FRAGOR.map(f => f.fraga));

const PAGE_SIZE = 10;

export default function OpinionClient() {
  const [aktivKat, setAktivKat] = useState("alla");
  const [rosterData, setRosterData] = useState({});
  const [agentFragor, setAgentFragor] = useState([]);
  const [visaAntal, setVisaAntal] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch("/api/opinion")
      .then(r => r.json())
      .then(rows => {
        const map = {};
        for (const r of rows) map[r.fraga] = r;
        setRosterData(map);
        const dynamic = rows
          .filter(r => !HARDCODED_SET.has(r.fraga))
          .map(r => ({ fraga: r.fraga, kategori: r.kategori || "övrigt", isAgent: true }));
        setAgentFragor(dynamic);
      })
      .catch(() => {});
  }, []);

  function onVote(fraga, kategori, svar) {
    setRosterData(prev => {
      const current = prev[fraga] ?? { roster_ja: 0, roster_nej: 0, roster_osaker: 0, ai_ja: 0, ai_nej: 0, ai_osaker: 0, fraga, kategori };
      return {
        ...prev,
        [fraga]: {
          ...current,
          roster_ja: current.roster_ja + (svar === "ja" ? 1 : 0),
          roster_nej: current.roster_nej + (svar === "nej" ? 1 : 0),
          roster_osaker: (current.roster_osaker || 0) + (svar === "osaker" ? 1 : 0),
        },
      };
    });
  }

  const allaFragor = aktivKat === "agentfragor"
    ? agentFragor
    : aktivKat === "alla"
      ? [...ALLA_FRAGOR, ...agentFragor]
      : ALLA_FRAGOR.filter(f => f.kategori === aktivKat);

  const sorterade = [...allaFragor].sort((a, b) => {
    const totA = (rosterData[a.fraga]?.roster_ja || 0) + (rosterData[a.fraga]?.roster_nej || 0) + (rosterData[a.fraga]?.ai_ja || 0) + (rosterData[a.fraga]?.ai_nej || 0);
    const totB = (rosterData[b.fraga]?.roster_ja || 0) + (rosterData[b.fraga]?.roster_nej || 0) + (rosterData[b.fraga]?.ai_ja || 0) + (rosterData[b.fraga]?.ai_nej || 0);
    return totB - totA;
  });

  const fragor = sorterade.slice(0, visaAntal);

  const totalBesokare = Object.values(rosterData).reduce(
    (s, r) => s + (r.roster_ja || 0) + (r.roster_nej || 0), 0
  );
  const totalAI = Object.values(rosterData).reduce(
    (s, r) => s + (r.ai_ja || 0) + (r.ai_nej || 0), 0
  );

  return (
    <div>
      <div style={{ marginBottom: "28px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "11px", color: C.accentDim, fontFamily: "monospace", margin: "0 0 4px", letterSpacing: "0.1em" }}>FRÅGOR</p>
          <p style={{ fontSize: "24px", color: C.text, margin: 0, fontFamily: "Georgia, serif" }}>{ALLA_FRAGOR.length + agentFragor.length}</p>
        </div>
        <div>
          <p style={{ fontSize: "11px", color: "#aaaaaa", fontFamily: "monospace", margin: "0 0 4px", letterSpacing: "0.1em" }}>BESÖKARRÖSTER</p>
          <p style={{ fontSize: "24px", color: C.accent, margin: 0, fontFamily: "Georgia, serif" }}>{totalBesokare}</p>
        </div>
        <div>
          <p style={{ fontSize: "11px", color: "#4a9eff", fontFamily: "monospace", margin: "0 0 4px", letterSpacing: "0.1em" }}>AI-RÖSTER</p>
          <p style={{ fontSize: "24px", color: "#4a9eff", margin: 0, fontFamily: "Georgia, serif" }}>{totalAI}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {KATEGORIER.map(k => (
          <button key={k.id} onClick={() => { setAktivKat(k.id); setVisaAntal(PAGE_SIZE); }} style={{
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

      {fragor.map(({ fraga, kategori, isAgent }) => (
        <FragaKort key={fraga} fraga={fraga} kategori={kategori} rosterData={rosterData} onVote={onVote} isAgent={isAgent} />
      ))}

      {visaAntal < sorterade.length && (
        <button
          onClick={() => setVisaAntal(v => v + PAGE_SIZE)}
          style={{
            width: "100%", padding: "14px", marginTop: "8px",
            background: "transparent", border: `1px solid ${C.border}`,
            borderRadius: "8px", color: C.textMuted, fontSize: "14px",
            fontFamily: "Georgia, serif", cursor: "pointer",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          Visa fler ({sorterade.length - visaAntal} återstår)
        </button>
      )}
    </div>
  );
}
