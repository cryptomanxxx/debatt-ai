"use client";
import { useState } from "react";

const C = {
  bg: "#0a0a0a", card: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#666", accent: "#e879f9",
  ja: "#4ade80", nej: "#f87171", avstar: "#555",
  riksdagen: "#facc15",
};

const sectionTitle = {
  fontSize: "11px", color: C.accent, letterSpacing: "0.12em",
  textTransform: "uppercase", margin: "0 0 20px",
  borderBottom: `1px solid ${C.border}`, paddingBottom: "12px",
};

function VoteBar({ votes }) {
  const ja     = votes.filter(v => v.rod === "ja").length;
  const nej    = votes.filter(v => v.rod === "nej").length;
  const avstar = votes.filter(v => v.rod === "avstar").length;
  const total  = ja + nej + avstar;
  if (total === 0) {
    return <p style={{ color: C.dim, fontSize: "13px", margin: "12px 0 0" }}>Inga röster ännu — agenterna röstar vid nästa körning.</p>;
  }
  const jaP    = Math.round(ja / total * 100);
  const nejP   = Math.round(nej / total * 100);
  const utfall = ja > nej ? "BIFALL" : ja < nej ? "AVSLAG" : "DELAT";
  const utfallColor = ja > nej ? C.ja : ja < nej ? C.nej : C.dim;
  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <div style={{ flex: 1, height: "8px", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${jaP}%`, background: C.ja }} />
          <div style={{ width: `${nejP}%`, background: C.nej }} />
          <div style={{ width: `${100 - jaP - nejP}%`, background: "#2a2a2a" }} />
        </div>
        <span style={{ fontSize: "11px", fontWeight: "700", color: utfallColor, letterSpacing: "0.1em", minWidth: "56px", textAlign: "right" }}>
          {total >= 12 ? utfall : `${total}/24`}
        </span>
      </div>
      <div style={{ display: "flex", gap: "16px", fontSize: "12px", flexWrap: "wrap" }}>
        <span style={{ color: C.ja }}>{ja} Ja ({jaP}%)</span>
        <span style={{ color: C.nej }}>{nej} Nej ({nejP}%)</span>
        {avstar > 0 && <span style={{ color: C.dim }}>{avstar} Avstår</span>}
        <span style={{ color: C.dim, marginLeft: "auto" }}>{total} / 24 agenter</span>
      </div>
    </div>
  );
}

function AgentChips({ votes }) {
  if (votes.length === 0) return null;
  return (
    <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
      {votes.map(v => {
        const color = v.rod === "ja" ? C.ja : v.rod === "nej" ? C.nej : C.avstar;
        return (
          <span key={v.agent} title={v.motivering || ""} style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "2px 8px", borderRadius: "10px",
            background: color + "18", border: `1px solid ${color}35`,
            fontSize: "11px", color, cursor: v.motivering ? "help" : "default",
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, flexShrink: 0 }} />
            {v.agent}
          </span>
        );
      })}
    </div>
  );
}

function Jamforelse({ forslag, votes }) {
  if (!forslag.riksdagen_utfall) return null;
  const ja = votes.filter(v => v.rod === "ja").length;
  const nej = votes.filter(v => v.rod === "nej").length;
  const aiUtfall = ja > nej ? "bifall" : ja < nej ? "avslag" : "delat";
  const stammer = aiUtfall === forslag.riksdagen_utfall;
  return (
    <div style={{
      marginTop: "14px", padding: "12px 16px", borderRadius: "6px",
      background: stammer ? "#4ade8010" : "#f8717110",
      border: `1px solid ${stammer ? "#4ade8030" : "#f8717130"}`,
    }}>
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center", fontSize: "13px" }}>
        <div>
          <span style={{ color: C.dim, marginRight: "6px" }}>AI-parlamentet:</span>
          <span style={{ color: aiUtfall === "bifall" ? C.ja : aiUtfall === "avslag" ? C.nej : C.dim, fontWeight: "700", textTransform: "uppercase" }}>
            {aiUtfall}
          </span>
        </div>
        <div>
          <span style={{ color: C.dim, marginRight: "6px" }}>Riksdagen:</span>
          <span style={{ color: forslag.riksdagen_utfall === "bifall" ? C.ja : C.nej, fontWeight: "700", textTransform: "uppercase" }}>
            {forslag.riksdagen_utfall}
          </span>
        </div>
        <div style={{ marginLeft: "auto", fontWeight: "700", fontSize: "11px", letterSpacing: "0.1em", color: stammer ? C.ja : C.nej }}>
          {stammer ? "SAMSTÄMMIGT" : "AVVIKELSE"}
        </div>
      </div>
    </div>
  );
}

function formatDatum(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

function isNy(iso) {
  if (!iso) return false;
  return (Date.now() - new Date(iso).getTime()) < 14 * 24 * 60 * 60 * 1000;
}

function klippVidOrd(text, max) {
  if (!text || text.length <= max) return { preview: text, rest: "" };
  const cut = text.lastIndexOf(" ", max);
  const pos = cut > max * 0.7 ? cut : max;
  return { preview: text.slice(0, pos), rest: text.slice(pos).trimStart() };
}

function ForslagCard({ f, votes }) {
  const [expanded, setExpanded] = useState(false);
  const isRiksdagen = f.kalla === "riksdagen";
  const { preview, rest } = klippVidOrd(f.beskrivning, 300);
  const langBeskrivning = rest.length > 80;
  const datum = formatDatum(f.skapad);
  const ny = isNy(f.skapad);

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: "8px", padding: "20px 24px",
    }}>
      {/* Badges + datum */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center" }}>
        <span style={{
          fontSize: "10px", padding: "2px 9px", borderRadius: "4px",
          letterSpacing: "0.08em", fontWeight: "700",
          background: isRiksdagen ? C.riksdagen + "20" : C.accent + "20",
          color: isRiksdagen ? C.riksdagen : C.accent,
          border: `1px solid ${isRiksdagen ? C.riksdagen + "40" : C.accent + "40"}`,
        }}>
          {isRiksdagen ? "RIKSDAGEN" : "AI-MOTION"}
        </span>
        <span style={{ fontSize: "10px", color: C.dim, padding: "2px 8px", background: "#161616", borderRadius: "4px" }}>
          {f.kategori}
        </span>
        {ny && (
          <span style={{
            fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
            background: "#22c55e18", color: "#22c55e",
            border: "1px solid #22c55e35", fontWeight: "700", letterSpacing: "0.08em",
          }}>NY</span>
        )}
        {datum && (
          <span style={{ fontSize: "11px", color: "#444", marginLeft: "auto" }}>{datum}</span>
        )}
      </div>

      {/* Klickbar titel */}
      <h3 style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: "600", lineHeight: "1.35" }}>
        {f.riksdagen_url ? (
          <a href={f.riksdagen_url} target="_blank" rel="noopener noreferrer"
            style={{ color: C.text, textDecoration: "none" }}
            onMouseOver={e => { e.currentTarget.style.color = C.riksdagen; }}
            onMouseOut={e => { e.currentTarget.style.color = C.text; }}>
            {f.titel}
          </a>
        ) : f.titel}
      </h3>

      {langBeskrivning ? (
        <>
          <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#888", lineHeight: "1.65" }}>
            {expanded ? f.beskrivning : preview + "…"}
          </p>
          <button onClick={() => setExpanded(e => !e)} style={{
            background: "none", border: "none", padding: "0",
            fontSize: "12px", color: C.accent, cursor: "pointer",
            marginTop: "2px", fontFamily: "Georgia, serif",
          }}>
            {expanded ? "visa mindre ▲" : "visa mer ▼"}
          </button>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: "14px", color: "#888", lineHeight: "1.65" }}>
          {f.beskrivning}
        </p>
      )}

      {f.riksdagen_url && (
        <div style={{ marginTop: "12px" }}>
          <a href={f.riksdagen_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "12px", color: C.riksdagen, textDecoration: "none", fontFamily: "monospace" }}>
            Läs på riksdagen.se →
          </a>
        </div>
      )}

      <VoteBar votes={votes} />
      <AgentChips votes={votes} />
      <Jamforelse forslag={f} votes={votes} />
    </div>
  );
}

const STEG = 20;

export default function ParlamentKlient({ forslag, rosterMap }) {
  const [valdKategori, setValdKategori] = useState("Alla");
  const [valdStatus, setValdStatus]     = useState("Alla");
  const [valdKalla, setValdKalla]       = useState("Alla");
  const [visaAktiva, setVisaAktiva]     = useState(STEG);
  const [visaAvgjorda, setVisaAvgjorda] = useState(STEG);

  const kategorier = [
    "Alla",
    ...Array.from(new Set(forslag.map(f => f.kategori).filter(Boolean))).sort(),
  ];

  const isProposition = (f) => f.kalla === "riksdagen" && f.riksdagen_url?.includes("/proposition/");
  const isMotion      = (f) => f.kalla === "riksdagen" && !f.riksdagen_url?.includes("/proposition/");

  const efterKalla = valdKalla === "Riksdagen"    ? forslag.filter(f => f.kalla === "riksdagen")
    : valdKalla === "Proposition" ? forslag.filter(isProposition)
    : valdKalla === "Motion"      ? forslag.filter(f => f.kalla === "riksdagen" && isMotion(f))
    : valdKalla === "AI-motion"   ? forslag.filter(f => f.kalla !== "riksdagen")
    : forslag;

  const efterKategori = valdKategori === "Alla"
    ? efterKalla
    : efterKalla.filter(f => f.kategori === valdKategori);

  const filtrerade = valdStatus === "Pågående" ? efterKategori.filter(f => f.status !== "avgjort")
    : valdStatus === "Avgjorda" ? efterKategori.filter(f => f.status === "avgjort")
    : efterKategori;

  const aktiva   = filtrerade.filter(f => f.status !== "avgjort");
  const avgjorda = filtrerade.filter(f => f.status === "avgjort");

  function byttKalla(k) {
    setValdKalla(k);
    setValdKategori("Alla");
    setVisaAktiva(STEG);
    setVisaAvgjorda(STEG);
  }

  function byttKategori(k) {
    setValdKategori(k);
    setVisaAktiva(STEG);
    setVisaAvgjorda(STEG);
  }

  function byttStatus(s) {
    setValdStatus(s);
    setVisaAktiva(STEG);
    setVisaAvgjorda(STEG);
  }

  const tabStyle = (aktiv) => ({
    padding: "6px 14px", borderRadius: "20px",
    background: aktiv ? C.accent + "20" : "transparent",
    color: aktiv ? C.accent : C.dim,
    border: `1px solid ${aktiv ? C.accent + "50" : C.border}`,
    cursor: "pointer", fontSize: "12px",
    fontWeight: aktiv ? "600" : "400",
    fontFamily: "Georgia, serif",
    whiteSpace: "nowrap",
  });

  const statusStyle = (aktiv) => ({
    padding: "5px 16px", borderRadius: "20px",
    background: aktiv ? "#fff" + "10" : "transparent",
    color: aktiv ? "#fff" : C.dim,
    border: `1px solid ${aktiv ? "#ffffff40" : C.border}`,
    cursor: "pointer", fontSize: "12px",
    fontWeight: aktiv ? "600" : "400",
    fontFamily: "Georgia, serif",
    whiteSpace: "nowrap",
  });

  const kallaAlternativ = [
    { id: "Alla",         etikett: "Alla",              antal: forslag.length },
    { id: "Riksdagen",    etikett: "🏛 Riksdagen",     antal: forslag.filter(f => f.kalla === "riksdagen").length },
    { id: "Proposition",  etikett: "📋 Propositioner", antal: forslag.filter(isProposition).length },
    { id: "Motion",       etikett: "📝 Motioner",      antal: forslag.filter(f => f.kalla === "riksdagen" && isMotion(f)).length },
    { id: "AI-motion",    etikett: "🤖 AI-motioner",   antal: forslag.filter(f => f.kalla !== "riksdagen").length },
  ];

  const kallaStyle = (aktiv, id) => {
    const färg = id === "Riksdagen" || id === "Proposition" || id === "Motion"
      ? C.riksdagen : id === "AI-motion" ? C.accent : "#aaa";
    return {
      padding: "5px 14px", borderRadius: "20px",
      background: aktiv ? färg + "20" : "transparent",
      color: aktiv ? färg : C.dim,
      border: `1px solid ${aktiv ? färg + "60" : C.border}`,
      cursor: "pointer", fontSize: "12px",
      fontWeight: aktiv ? "600" : "400",
      fontFamily: "Georgia, serif",
      whiteSpace: "nowrap",
    };
  };

  return (
    <>
      {/* Källfilter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {kallaAlternativ.map(({ id, etikett, antal }) => (
          <button key={id} onClick={() => byttKalla(id)} style={kallaStyle(valdKalla === id, id)}>
            {etikett} <span style={{ fontSize: "10px", opacity: 0.6 }}>({antal})</span>
          </button>
        ))}
      </div>

      {/* Statusfilter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {["Alla", "Pågående", "Avgjorda"].map(s => {
          const antal = s === "Alla" ? efterKategori.length
            : s === "Pågående" ? efterKategori.filter(f => f.status !== "avgjort").length
            : efterKategori.filter(f => f.status === "avgjort").length;
          return (
            <button key={s} onClick={() => byttStatus(s)} style={statusStyle(valdStatus === s)}>
              {s} <span style={{ fontSize: "10px", opacity: 0.6 }}>({antal})</span>
            </button>
          );
        })}
      </div>

      {/* PIS-länk */}
      <a href="/pis" style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: "#a78bfa15", border: "1px solid #a78bfa40",
        borderRadius: "6px", padding: "8px 16px", marginBottom: "16px",
        fontSize: "12px", color: "#a78bfa", textDecoration: "none", fontWeight: 600,
      }}>
        📊 Policy Impact Simulator — se ekonomisk analys av alla förslag →
      </a>

      {/* Kategori-filter */}
      <div style={{
        display: "flex", gap: "8px", flexWrap: "wrap",
        marginBottom: "40px", paddingBottom: "20px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {kategorier.map(k => {
          const antal = k === "Alla" ? efterKalla.length : efterKalla.filter(f => f.kategori === k).length;
          return (
            <button key={k} onClick={() => byttKategori(k)} style={tabStyle(valdKategori === k)}>
              {k}
              <span style={{ marginLeft: "5px", fontSize: "10px", opacity: 0.6 }}>({antal})</span>
            </button>
          );
        })}
      </div>

      {/* Pågående */}
      {aktiva.length > 0 && (
        <section style={{ marginBottom: "64px" }}>
          <h2 style={sectionTitle}>Pågående omröstningar ({aktiva.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {aktiva.slice(0, visaAktiva).map(f => (
              <ForslagCard key={f.id} f={f} votes={rosterMap[f.id] || []} />
            ))}
          </div>
          {aktiva.length > visaAktiva && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button onClick={() => setVisaAktiva(v => v + STEG)} style={{
                padding: "10px 28px", borderRadius: "6px", cursor: "pointer",
                background: "transparent", border: `1px solid ${C.border}`,
                color: C.dim, fontSize: "13px", fontFamily: "Georgia, serif",
              }}>
                Visa fler ({aktiva.length - visaAktiva} kvar)
              </button>
            </div>
          )}
        </section>
      )}

      {/* Avgjorda */}
      {avgjorda.length > 0 && (
        <section style={{ marginBottom: "64px" }}>
          <h2 style={sectionTitle}>Avgjorda ({avgjorda.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {avgjorda.slice(0, visaAvgjorda).map(f => (
              <ForslagCard key={f.id} f={f} votes={rosterMap[f.id] || []} />
            ))}
          </div>
          {avgjorda.length > visaAvgjorda && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button onClick={() => setVisaAvgjorda(v => v + STEG)} style={{
                padding: "10px 28px", borderRadius: "6px", cursor: "pointer",
                background: "transparent", border: `1px solid ${C.border}`,
                color: C.dim, fontSize: "13px", fontFamily: "Georgia, serif",
              }}>
                Visa fler ({avgjorda.length - visaAvgjorda} kvar)
              </button>
            </div>
          )}
        </section>
      )}

      {filtrerade.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "16px", color: C.dim }}>Inga förslag i denna kategori</p>
        </div>
      )}
    </>
  );
}
