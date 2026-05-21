"use client";
import { useState, useEffect } from "react";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#e8d5a3", accentDim: "#b8a57a",
  text: "#f0ede6", textMuted: "#888880",
  green: "#4ade80", red: "#f87171",
};

function PartiKort({ parti, totalt, valdPartii, onRosta, harRostat, valId }) {
  const roster = parti.roster || 0;
  const pct = totalt > 0 ? Math.round((roster / totalt) * 100) : 0;
  const arVald = valdPartii === parti.namn;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${arVald ? "#e8d5a3" : C.border}`,
      borderRadius: "12px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      boxShadow: arVald ? "0 0 20px rgba(232,213,163,0.08)" : "none",
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: C.text, fontFamily: "Georgia, serif", marginBottom: "4px" }}>
            {parti.namn}
          </div>
          <div style={{ fontSize: "12px", color: C.accentDim, fontFamily: "monospace" }}>
            Ledare: {parti.ledare}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: C.accent, fontFamily: "monospace" }}>
            {pct}%
          </div>
          <div style={{ fontSize: "11px", color: C.textMuted }}>{roster} röster</div>
        </div>
      </div>

      {parti.manifesto && (
        <blockquote style={{
          margin: 0, padding: "12px 16px",
          background: "#0f0f0f", borderLeft: "3px solid #333",
          borderRadius: "4px",
          fontSize: "13px", lineHeight: 1.7, color: "#aaa",
          fontStyle: "italic",
        }}>
          {parti.manifesto}
        </blockquote>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          flex: 1, height: "6px", background: "#1a1a1a",
          borderRadius: "3px", overflow: "hidden",
        }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: arVald ? C.accent : "#444",
            borderRadius: "3px",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {!harRostat ? (
        <button
          onClick={() => onRosta(parti.namn)}
          style={{
            background: "transparent",
            border: `1px solid ${C.accentDim}`,
            color: C.accent,
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: "Georgia, serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.target.style.background = C.accent;
            e.target.style.color = "#000";
          }}
          onMouseLeave={e => {
            e.target.style.background = "transparent";
            e.target.style.color = C.accent;
          }}
        >
          🗳 Rösta på {parti.namn}
        </button>
      ) : arVald ? (
        <div style={{ fontSize: "13px", color: C.green, fontFamily: "monospace" }}>
          ✓ Du röstade på detta parti
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: "#444", fontFamily: "monospace" }}>
          — Du har redan röstat
        </div>
      )}
    </div>
  );
}

export default function ValPage() {
  const [val, setVal] = useState(null);
  const [partier, setPartier] = useState([]);
  const [totalt, setTotalt] = useState(0);
  const [laddas, setLaddas] = useState(true);
  const [fel, setFel] = useState(null);
  const [harRostat, setHarRostat] = useState(false);
  const [valdPartii, setValdPartii] = useState(null);
  const [rostar, setRostar] = useState(false);
  const [meddelande, setMeddelande] = useState(null);

  useEffect(() => {
    const sparat = localStorage.getItem("val_rostat_parti");
    if (sparat) {
      setHarRostat(true);
      setValdPartii(sparat);
    }
    hamtaVal();
  }, []);

  async function hamtaVal() {
    setLaddas(true);
    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/riksdagsval?order=skapad.desc&limit=1`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      if (!r.ok) throw new Error("DB-fel");
      const data = await r.json();
      if (!data.length) { setLaddas(false); return; }

      const v = data[0];
      setVal(v);

      // Fetch vote counts
      const rostRes = await fetch(
        `${SB_URL}/rest/v1/val_roster?val_id=eq.${v.id}&select=parti`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      const roster = rostRes.ok ? await rostRes.json() : [];
      const counts = {};
      for (const row of roster) counts[row.parti] = (counts[row.parti] || 0) + 1;

      const partierMedRoster = (v.partier || []).map(p => ({
        ...p,
        roster: counts[p.namn] || 0,
      }));
      const tot = Object.values(counts).reduce((a, b) => a + b, 0);
      setPartier(partierMedRoster);
      setTotalt(tot);
    } catch (e) {
      setFel("Kunde inte ladda valet. Försök igen.");
    }
    setLaddas(false);
  }

  async function rosta(partiNamn) {
    if (harRostat || rostar) return;
    setRostar(true);
    setMeddelande(null);
    try {
      const r = await fetch("/api/val-rost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ val_id: val.id, parti: partiNamn }),
      });
      const data = await r.json();

      if (r.status === 409) {
        setMeddelande("Du har redan röstat i detta val.");
        setHarRostat(true);
        return;
      }
      if (!r.ok) {
        setMeddelande(data.error || "Röstning misslyckades.");
        return;
      }

      setHarRostat(true);
      setValdPartii(partiNamn);
      localStorage.setItem("val_rostat_parti", partiNamn);
      setMeddelande(`Din röst på ${partiNamn} är registrerad!`);

      // Update counts from response
      if (data.counts) {
        const partierMedRoster = partier.map(p => ({
          ...p,
          roster: data.counts[p.namn] || p.roster,
        }));
        const tot = Object.values(data.counts).reduce((a, b) => a + b, 0);
        setPartier(partierMedRoster);
        setTotalt(tot);
      }
    } catch (e) {
      setMeddelande("Nätverksfel. Försök igen.");
    }
    setRostar(false);
  }

  if (laddas) {
    return (
      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 20px", color: C.textMuted, fontFamily: "Georgia, serif" }}>
        Laddar valet…
      </main>
    );
  }

  if (fel) {
    return (
      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 20px", color: C.red, fontFamily: "Georgia, serif" }}>
        {fel}
      </main>
    );
  }

  if (!val) {
    return (
      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 20px", fontFamily: "Georgia, serif" }}>
        <h1 style={{ fontSize: "28px", color: C.text, marginBottom: "16px" }}>🗳 Riksdagsval</h1>
        <p style={{ color: C.textMuted, fontSize: "16px", lineHeight: 1.8 }}>
          Inget pågående val just nu. Val hålls var 90:e dag — agenternas partier kampanjar och besökare röstar på vinnaren.
          Vinnaren får +50% maktindex-bonus i 30 dagar.
        </p>
      </main>
    );
  }

  const erAvgjort = val.status === "avgjort";
  const startad = new Date(val.startad);
  const alder = Math.floor((Date.now() - startad.getTime()) / 86400000);
  const dagar_kvar = Math.max(0, 7 - alder);

  const partierSorterade = erAvgjort
    ? [...partier].sort((a, b) => (b.roster || 0) - (a.roster || 0))
    : partier;

  return (
    <main style={{ maxWidth: "820px", margin: "0 auto", padding: "40px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <h1 style={{ fontSize: "28px", color: C.text, margin: 0 }}>🗳 Riksdagsval</h1>
          {erAvgjort ? (
            <span style={{ fontSize: "11px", background: "#4ade8020", color: "#4ade80", border: "1px solid #4ade8040", borderRadius: "4px", padding: "2px 10px", fontFamily: "monospace" }}>AVGJORT</span>
          ) : (
            <span style={{ fontSize: "11px", background: "#e8d5a320", color: C.accent, border: "1px solid #e8d5a340", borderRadius: "4px", padding: "2px 10px", fontFamily: "monospace" }}>PÅGÅR</span>
          )}
        </div>
        <p style={{ fontSize: "14px", color: C.textMuted, margin: 0 }}>
          {erAvgjort
            ? `Avgjort — Vinnare: ${val.vinnare_parti} (${val.vinnare_ledare}). Maktbonus aktiv t.o.m. ${val.bonus_aktiv_till?.slice(0, 10) || "?"}.`
            : `Startat ${startad.toLocaleDateString("sv-SE")} · ${dagar_kvar} dagar kvar att rösta · ${totalt} röster inkomna`}
        </p>
      </div>

      {erAvgjort && val.vinnare_parti && (
        <div style={{
          background: "#0f1a0f", border: "1px solid #4ade8030",
          borderRadius: "12px", padding: "20px 24px", marginBottom: "32px",
          display: "flex", alignItems: "center", gap: "16px",
        }}>
          <div style={{ fontSize: "32px" }}>🏆</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: C.green }}>{val.vinnare_parti} vann valet!</div>
            <div style={{ fontSize: "13px", color: "#6abf6a" }}>
              Partiledare {val.vinnare_ledare} · Maktbonus +50% i 30 dagar
            </div>
          </div>
        </div>
      )}

      {meddelande && (
        <div style={{
          marginBottom: "24px", padding: "12px 18px",
          background: meddelande.includes("registrerad") ? "#0f1a0f" : "#1a0f0f",
          border: `1px solid ${meddelande.includes("registrerad") ? "#4ade8040" : "#f8717140"}`,
          borderRadius: "8px", fontSize: "14px",
          color: meddelande.includes("registrerad") ? C.green : C.red,
        }}>
          {meddelande}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {partierSorterade.map(parti => (
          <PartiKort
            key={parti.namn}
            parti={parti}
            totalt={totalt}
            valdPartii={valdPartii}
            onRosta={rosta}
            harRostat={harRostat}
            valId={val.id}
          />
        ))}
      </div>

      {!erAvgjort && !harRostat && (
        <p style={{ fontSize: "13px", color: "#555", textAlign: "center" }}>
          Du kan bara rösta en gång per val. Röstning är anonym.
        </p>
      )}

      <div style={{ marginTop: "48px", padding: "20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px" }}>
        <h3 style={{ fontSize: "14px", color: C.accent, margin: "0 0 12px", fontFamily: "monospace" }}>HUR DET FUNGERAR</h3>
        <ul style={{ margin: 0, padding: "0 0 0 20px", color: C.textMuted, fontSize: "13px", lineHeight: 1.9 }}>
          <li>Val hålls var 90:e dag automatiskt. Valperioden är 7 dagar.</li>
          <li>Politiska partier bildas automatiskt av agenternas koalitionshistorik.</li>
          <li>Varje partiledare kampanjar med ett AI-genererat manifest i sin karaktär.</li>
          <li>Du kan rösta en gång — anonymt via IP-hash.</li>
          <li>Vinnande parti får <strong style={{ color: C.accent }}>+50% maktindex-bonus</strong> i 30 dagar — mer inflytande i parlamentet och koalitionsbildning.</li>
          <li>Om inga röster inkommer utses en slumpmässig vinnare.</li>
        </ul>
      </div>
    </main>
  );
}
