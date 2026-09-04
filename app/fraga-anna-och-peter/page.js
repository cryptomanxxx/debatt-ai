"use client";
import { useState } from "react";
import AgentOverlay from "../nyhetskallor/AgentOverlay";
import StudioOverlay from "../nyhetskallor/StudioOverlay";

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  text: "#f0ede6", textMuted: "#888880",
};
const ANNA_FARG = "#a0c8f0";
const PETER_FARG = "#6abf6a";
const STUDIO_FARG = "#c084fc";
const LANK = "#38bdf8";

const TEXT_MAX = 1500;
const URL_MAX = 2000;

// /api/studio kräver en "rubrik" (≤300 tecken) — fri text har ingen egen
// rubrik, så en kort sammanfattning av inledningen används istället. Hela
// texten skickas ändå med som "beskrivning" (servern kapar den vid 800
// tecken om den är längre).
function kortRubrik(text) {
  const rad = text.trim().replace(/\s+/g, " ");
  return rad.length > 120 ? rad.slice(0, 119) + "…" : rad;
}

function AktionsKnapp({ farg, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 16px",
        background: "transparent",
        border: `1px solid ${disabled ? C.border : farg + "60"}`,
        color: disabled ? C.textMuted : farg,
        borderRadius: 6,
        fontSize: 13,
        fontFamily: "Georgia, serif",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function FragaAnnaOchPeterPage() {
  const [fritext, setFritext] = useState("");
  const [url, setUrl] = useState("");
  const [urlLaddar, setUrlLaddar] = useState(false);
  const [urlFel, setUrlFel] = useState("");
  const [urlResultat, setUrlResultat] = useState(null); // { titel, sammanfattning, url }

  const [lasning, setLasning] = useState(null); // { agent, namn, text }
  const [studio, setStudio] = useState(null); // { rubrik, beskrivning }

  const fritextTrimmed = fritext.trim();

  async function hamtaUrl() {
    const trimmed = url.trim();
    setUrlFel("");
    setUrlResultat(null);
    if (!trimmed) { setUrlFel("Klistra in en länk till en nyhetsartikel först."); return; }

    setUrlLaddar(true);
    try {
      const res = await fetch("/api/chatt/artikel-kontext", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUrlFel(data.error || "Kunde inte hämta artikeln — försök med en annan länk.");
        return;
      }
      setUrlResultat(data);
    } catch {
      setUrlFel("Nätverksfel — försök igen.");
    } finally {
      setUrlLaddar(false);
    }
  }

  function sagFritext(agent, namn) {
    if (!fritextTrimmed) return;
    setLasning({ agent, namn, text: fritextTrimmed });
  }
  function diskuteraFritext() {
    if (!fritextTrimmed) return;
    setStudio({ rubrik: kortRubrik(fritextTrimmed), beskrivning: fritextTrimmed.slice(0, 800) });
  }

  function sagUrlResultat(agent, namn) {
    if (!urlResultat) return;
    const text = [urlResultat.titel, urlResultat.sammanfattning].filter(Boolean).join(". ");
    setLasning({ agent, namn, text });
  }
  function diskuteraUrlResultat() {
    if (!urlResultat) return;
    setStudio({
      rubrik: urlResultat.titel || kortRubrik(urlResultat.sammanfattning || ""),
      beskrivning: urlResultat.sammanfattning || "",
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <div style={{ marginBottom: 32 }}>
          <a href="/nyhetsanalyser" style={{ color: C.textMuted, fontSize: 12, textDecoration: "none", fontFamily: "monospace", letterSpacing: "0.08em" }}>
            ← Nyhetsanalyser
          </a>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: "16px 0 6px", fontFamily: "Georgia, serif" }}>
            Fråga Anna och Peter
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            Klistra in valfri text — eller en länk till en nyhetsartikel — och låt{" "}
            <span style={{ color: ANNA_FARG }}>Anna</span> (nyhetsankare) eller{" "}
            <span style={{ color: PETER_FARG }}>Peter</span> (nationalekonom) läsa upp den,
            eller låt dem diskutera den tillsammans i studion. Samma röster och animerade
            ansikten som på{" "}
            <a href="/nyhetsanalyser" style={{ color: LANK }}>Nyhetsanalyser</a>,{" "}
            <a href="/kanal" style={{ color: LANK }}>Nyhetskanalen</a> och{" "}
            <a href="/podd" style={{ color: LANK }}>Videopodden</a>.
          </p>
        </div>

        {/* ── Fri text ─────────────────────────────────────────── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", fontFamily: "monospace", color: C.textMuted, marginBottom: 10 }}>
            FRI TEXT
          </div>
          <textarea
            value={fritext}
            onChange={e => setFritext(e.target.value.slice(0, TEXT_MAX))}
            placeholder="Skriv eller klistra in text som Anna eller Peter ska säga eller diskutera…"
            rows={5}
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 12px",
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
              color: C.text, fontSize: 14, fontFamily: "Georgia, serif", lineHeight: 1.6,
              resize: "vertical", outline: "none",
            }}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: C.textMuted, fontFamily: "monospace", margin: "4px 0 12px" }}>
            {fritextTrimmed.length} / {TEXT_MAX}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <AktionsKnapp farg={ANNA_FARG} disabled={!fritextTrimmed} onClick={() => sagFritext("Anna", "Anna")}>
              🎙️ Anna säger det
            </AktionsKnapp>
            <AktionsKnapp farg={PETER_FARG} disabled={!fritextTrimmed} onClick={() => sagFritext("Nationalekonom", "Peter")}>
              📊 Peter säger det
            </AktionsKnapp>
            <AktionsKnapp farg={STUDIO_FARG} disabled={!fritextTrimmed} onClick={diskuteraFritext}>
              🎭 Anna &amp; Peter diskuterar det
            </AktionsKnapp>
          </div>
        </div>

        {/* ── Nyhetsartikel-URL ────────────────────────────────── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", fontFamily: "monospace", color: C.textMuted, marginBottom: 10 }}>
            NYHETSARTIKEL — LÄNK
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value.slice(0, URL_MAX))}
              placeholder="https://exempel.se/en-artikel"
              style={{
                flex: 1, minWidth: 220, padding: "10px 12px",
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.text, fontSize: 14, fontFamily: "monospace", outline: "none",
              }}
            />
            <button
              onClick={hamtaUrl}
              disabled={urlLaddar}
              style={{
                padding: "10px 18px", borderRadius: 8, fontSize: 13, fontFamily: "Georgia, serif",
                border: `1px solid ${C.border}`, background: C.bg,
                color: urlLaddar ? C.textMuted : C.text, cursor: urlLaddar ? "default" : "pointer",
              }}
            >
              {urlLaddar ? "Hämtar…" : "Hämta artikel"}
            </button>
          </div>

          {urlFel && (
            <p style={{ color: "#e05050", fontSize: 13, marginTop: 12 }}>{urlFel}</p>
          )}

          {urlResultat && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              {urlResultat.titel && (
                <p style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.5 }}>
                  {urlResultat.titel}
                </p>
              )}
              <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>
                {urlResultat.sammanfattning}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <AktionsKnapp farg={ANNA_FARG} onClick={() => sagUrlResultat("Anna", "Anna")}>
                  🎙️ Anna läser den
                </AktionsKnapp>
                <AktionsKnapp farg={PETER_FARG} onClick={() => sagUrlResultat("Nationalekonom", "Peter")}>
                  📊 Peter läser den
                </AktionsKnapp>
                <AktionsKnapp farg={STUDIO_FARG} onClick={diskuteraUrlResultat}>
                  🎭 Anna &amp; Peter diskuterar den
                </AktionsKnapp>
              </div>
            </div>
          )}
        </div>

        <p style={{ color: "#444", fontSize: 11, marginTop: 24, lineHeight: 1.7 }}>
          Uppläsning sker direkt i webbläsaren via ResponsiveVoice. Studiosamtal genereras
          av en AI-modell utifrån enbart den text eller artikel du anger — hittar aldrig
          på fakta som inte finns i underlaget.
        </p>
      </div>

      {lasning && (
        <AgentOverlay
          key={`${lasning.agent}-${lasning.text.length}`}
          agent={lasning.agent}
          namn={lasning.namn}
          text={lasning.text}
          onClose={() => setLasning(null)}
        />
      )}
      {studio && (
        <StudioOverlay
          key={`studio-${studio.rubrik}`}
          rubrik={studio.rubrik}
          beskrivning={studio.beskrivning}
          onClose={() => setStudio(null)}
        />
      )}
    </div>
  );
}
