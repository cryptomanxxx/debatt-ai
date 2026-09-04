"use client";
import { useEffect, useState } from "react";
import AgentOverlay from "../nyhetskallor/AgentOverlay";
import StudioOverlay from "../nyhetskallor/StudioOverlay";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sbH = () => ({ apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` });

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
const PAGE_SIZE = 15;
// Tröskel för när "Visa hela frågan"-knappen dyker upp i historiken — ingen
// hård gräns, texten kapas aldrig bortom det som faktiskt sparades.
const BRODTEXT_GRANS = 400;

// /api/studio kräver en "rubrik" (≤300 tecken) — fri text har ingen egen
// rubrik, så en kort sammanfattning av inledningen används istället. Hela
// texten skickas ändå med som "beskrivning" (servern kapar den vid 800
// tecken om den är längre).
function kortRubrik(text) {
  const rad = text.trim().replace(/\s+/g, " ");
  return rad.length > 120 ? rad.slice(0, 119) + "…" : rad;
}

function tidsAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} dagar sedan`;
  return new Date(iso).toLocaleDateString("sv-SE");
}

const AKTION_INFO = {
  anna_sager: { ikon: "🎙️", namn: "Anna", farg: ANNA_FARG },
  peter_sager: { ikon: "📊", namn: "Peter", farg: PETER_FARG },
  diskussion: { ikon: "🎭", namn: "Studio", farg: STUDIO_FARG },
};

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

function HistorikPost({ rad, expanded, onToggle, onSpelaUpp }) {
  const info = AKTION_INFO[rad.aktion] || AKTION_INFO.anna_sager;
  const ärUrl = rad.typ === "url";
  const dialog = Array.isArray(rad.dialog) ? rad.dialog : null;
  // Fri text-frågan (eller URL-artikelns sammanfattning) visas i sin helhet
  // — tidigare kapades fri text hårt vid 120 tecken via kortRubrik() med
  // ingen väg att se resten alls när aktionen var "diskussion" (den
  // truncated bilden var den ENDA representationen). BRODTEXT_GRANS är bara
  // var expand/collapse-knappen dyker upp, inte en hård gräns — "Visa hela
  // frågan" avslöjar alltid allt (upp till serverns 1500-teckensgräns).
  const brodtext = ärUrl ? (rad.sammanfattning || "") : (rad.input_text || "");
  const brodtextArLang = brodtext.length > BRODTEXT_GRANS;
  const kanExpandera = brodtextArLang || !!dialog;
  // Måste gate:as på rad.aktion — inte bara på om `dialog` råkar finnas —
  // så den här knappen aldrig kan visas för en "diskussion"-post vars
  // dialog blivit null (t.ex. sanerad bort av stadaDialog() på servern):
  // spelaUppHistorik() nedan gör exakt samma aktion-check och avbryter
  // annars tyst, vilket gjorde knappen klickbar men verkningslös
  // (Codex-fynd, PR #1346).
  const kanSpelaUpp = rad.aktion === "diskussion" ? !!dialog?.length : !!(brodtext || rad.titel);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", background: `${info.farg}0d`, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: info.farg, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>
          {info.ikon} {info.namn.toUpperCase()}{rad.aktion === "diskussion" ? " DISKUTERAR" : " SÄGER"}
        </span>
        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
          {rad.typ === "url" ? "🔗 länk" : "✏️ fri text"}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>{tidsAgo(rad.skapad)}</span>
      </div>

      <div style={{ padding: "12px 16px 14px" }}>
        {ärUrl && rad.titel && (
          rad.kalla_url ? (
            <a href={rad.kalla_url} target="_blank" rel="noopener noreferrer" style={{ color: LANK, fontSize: 14, fontWeight: 700, textDecoration: "none", lineHeight: 1.5, display: "block", marginBottom: 4 }}>
              {rad.titel}
            </a>
          ) : (
            <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.5 }}>{rad.titel}</p>
          )
        )}

        {brodtext && (
          <p style={{ color: ärUrl ? C.textMuted : C.text, fontSize: 13, margin: dialog ? "0 0 10px" : 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {!brodtextArLang || expanded ? brodtext : brodtext.slice(0, BRODTEXT_GRANS) + "…"}
          </p>
        )}

        {dialog && (
          !expanded ? (
            <p style={{ color: C.textMuted, fontSize: 13, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
              {dialog.length} repliker mellan Anna och Peter.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
              {dialog.map((t, i) => (
                <p key={i} style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                  <span style={{ color: t.speaker === "anna" ? ANNA_FARG : PETER_FARG, fontWeight: 700 }}>
                    {t.speaker === "anna" ? "Anna" : "Peter"}:{" "}
                  </span>
                  {t.text}
                </p>
              ))}
            </div>
          )
        )}

        {kanExpandera && (
          <button
            onClick={onToggle}
            style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: STUDIO_FARG, fontSize: 11, fontFamily: "monospace", padding: 0, letterSpacing: "0.06em" }}
          >
            {expanded ? "▲ Visa mindre" : dialog ? "▼ Visa hela frågan och samtalet" : "▼ Visa hela frågan"}
          </button>
        )}

        {kanSpelaUpp && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={onSpelaUpp}
              style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${info.farg}50`, color: info.farg, borderRadius: 6, fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer" }}
            >
              🔁 Spela upp igen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FragaAnnaOchPeterPage() {
  const [fritext, setFritext] = useState("");
  const [url, setUrl] = useState("");
  const [urlLaddar, setUrlLaddar] = useState(false);
  const [urlFel, setUrlFel] = useState("");
  const [urlResultat, setUrlResultat] = useState(null); // { titel, sammanfattning, url }

  const [lasning, setLasning] = useState(null); // { agent, namn, text }
  const [studio, setStudio] = useState(null); // { rubrik, beskrivning, turns?, meta? }

  const [historik, setHistorik] = useState([]);
  const [historikLaddar, setHistorikLaddar] = useState(true);
  const [historikSida, setHistorikSida] = useState(0);
  const [historikMer, setHistorikMer] = useState(true);
  const [expanderad, setExpanderad] = useState({});

  const fritextTrimmed = fritext.trim();

  async function laddaHistorik(sida) {
    setHistorikLaddar(true);
    try {
      const offset = sida * PAGE_SIZE;
      const res = await fetch(
        `${SB_URL}/rest/v1/fraga_anna_peter_log?select=*&order=skapad.desc&limit=${PAGE_SIZE}&offset=${offset}`,
        { headers: sbH() }
      );
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        setHistorik(prev => (sida === 0 ? data : [...prev, ...data]));
        setHistorikMer(data.length === PAGE_SIZE);
      }
    } catch {
      // tyst — historiken är ett komplement, inte kritiskt för sidans funktion
    } finally {
      setHistorikLaddar(false);
    }
  }

  useEffect(() => { laddaHistorik(0); }, []);

  function laddaFlerHistorik() {
    const nasta = historikSida + 1;
    setHistorikSida(nasta);
    laddaHistorik(nasta);
  }

  async function sparaHistorik(entry) {
    try {
      const res = await fetch("/api/fraga-anna-och-peter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.rad) setHistorik(prev => [data.rad, ...prev]);
    } catch {
      // fire-and-forget — historikloggning ska aldrig störa uppläsningen/samtalet
    }
  }

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
    sparaHistorik({ typ: "fritext", aktion: agent === "Anna" ? "anna_sager" : "peter_sager", text: fritextTrimmed });
  }
  function diskuteraFritext() {
    if (!fritextTrimmed) return;
    setStudio({
      rubrik: kortRubrik(fritextTrimmed),
      beskrivning: fritextTrimmed.slice(0, 800),
      meta: { typ: "fritext", text: fritextTrimmed },
    });
  }

  function sagUrlResultat(agent, namn) {
    if (!urlResultat) return;
    const text = [urlResultat.titel, urlResultat.sammanfattning].filter(Boolean).join(". ");
    setLasning({ agent, namn, text });
    sparaHistorik({
      typ: "url", aktion: agent === "Anna" ? "anna_sager" : "peter_sager",
      url: urlResultat.url, titel: urlResultat.titel, sammanfattning: urlResultat.sammanfattning,
    });
  }
  function diskuteraUrlResultat() {
    if (!urlResultat) return;
    setStudio({
      rubrik: urlResultat.titel || kortRubrik(urlResultat.sammanfattning || ""),
      beskrivning: urlResultat.sammanfattning || "",
      meta: { typ: "url", url: urlResultat.url, titel: urlResultat.titel, sammanfattning: urlResultat.sammanfattning },
    });
  }

  function spelaUppHistorik(rad) {
    if (rad.aktion === "diskussion") {
      if (!Array.isArray(rad.dialog) || rad.dialog.length === 0) return;
      setStudio({ rubrik: rad.titel || kortRubrik(rad.input_text || ""), beskrivning: rad.sammanfattning || "", turns: rad.dialog });
    } else {
      const agent = rad.aktion === "anna_sager" ? "Anna" : "Nationalekonom";
      const namn = agent === "Anna" ? "Anna" : "Peter";
      const text = rad.typ === "url" ? [rad.titel, rad.sammanfattning].filter(Boolean).join(". ") : rad.input_text;
      if (text) setLasning({ agent, namn, text });
    }
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
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, marginBottom: 36 }}>
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

        {/* ── Historik ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", fontFamily: "monospace", color: C.textMuted, marginBottom: 12 }}>
            HISTORIK
          </div>

          {historik.length === 0 && !historikLaddar && (
            <p style={{ color: C.textMuted, fontSize: 13, fontFamily: "monospace", padding: "20px 0", textAlign: "center" }}>
              Inget sparat än — bli den första att fråga Anna eller Peter.
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {historik.map(rad => (
              <HistorikPost
                key={rad.id}
                rad={rad}
                expanded={!!expanderad[rad.id]}
                onToggle={() => setExpanderad(prev => ({ ...prev, [rad.id]: !prev[rad.id] }))}
                onSpelaUpp={() => spelaUppHistorik(rad)}
              />
            ))}
          </div>

          {historikMer && historik.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={laddaFlerHistorik}
                disabled={historikLaddar}
                style={{
                  padding: "10px 28px", fontSize: 12, fontFamily: "monospace", cursor: historikLaddar ? "default" : "pointer",
                  border: `1px solid ${C.border}`, background: C.surface, color: historikLaddar ? C.textMuted : C.text,
                  borderRadius: 8, letterSpacing: "0.08em",
                }}
              >
                {historikLaddar ? "Laddar…" : "Ladda fler"}
              </button>
            </div>
          )}
        </div>

        <p style={{ color: "#444", fontSize: 11, marginTop: 24, lineHeight: 1.7 }}>
          Uppläsning sker direkt i webbläsaren via ResponsiveVoice. Studiosamtal genereras
          av en AI-modell utifrån enbart den text eller artikel du anger — hittar aldrig
          på fakta som inte finns i underlaget. Alla frågor och diskussioner sparas och
          visas offentligt i historiken ovan.
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
          key={`studio-${studio.rubrik}-${studio.turns ? "replay" : "ny"}`}
          rubrik={studio.rubrik}
          beskrivning={studio.beskrivning}
          turns={studio.turns}
          onTurns={studio.meta ? (turns) => sparaHistorik({ ...studio.meta, aktion: "diskussion", dialog: turns }) : undefined}
          onClose={() => setStudio(null)}
        />
      )}
    </div>
  );
}
