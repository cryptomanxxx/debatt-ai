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
const JOHAN_FARG = "#f0b050";
const ORAKLET_FARG = "#dd6e5f"; // samma accentfärg som AGENTER.Oraklet.farg i AgentOverlay.js
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
  johan_sager: { ikon: "💡", namn: "Johan", farg: JOHAN_FARG },
  oraklet_forklarar: { ikon: "🎓", namn: "Oraklet", farg: ORAKLET_FARG },
  diskussion: { ikon: "🎭", namn: "Studio", farg: STUDIO_FARG },
};

const SPEAKER_INFO = {
  anna: { namn: "Anna", farg: ANNA_FARG },
  peter: { namn: "Peter", farg: PETER_FARG },
  johan: { namn: "Johan", farg: JOHAN_FARG },
};

// Mappar AGENTER-nyckeln (som styr röst/avatar i AgentOverlay) mot aktion-
// strängen som sparas i historiken, och tillbaka igen vid "Spela upp igen".
const AGENT_TILL_AKTION = { Anna: "anna_sager", Nationalekonom: "peter_sager", Teknikoptimist: "johan_sager", Oraklet: "oraklet_forklarar" };
const AKTION_TILL_AGENT = { anna_sager: { agent: "Anna", namn: "Anna" }, peter_sager: { agent: "Nationalekonom", namn: "Peter" }, johan_sager: { agent: "Teknikoptimist", namn: "Johan" }, oraklet_forklarar: { agent: "Oraklet", namn: "Professor Oraklet" } };

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
  const [kopierat, setKopierat] = useState(false);
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

  async function kopieraLank() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/fraga-anna-och-peter?visa=${rad.id}`);
      setKopierat(true);
      setTimeout(() => setKopierat(false), 2000);
    } catch {
      // clipboard kan vara blockerad (behörighet nekad, icke-https m.m.) — tyst
    }
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", background: `${info.farg}0d`, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: info.farg, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>
          {info.ikon} {info.namn.toUpperCase()}{rad.aktion === "diskussion" ? " DISKUTERAR" : rad.aktion === "oraklet_forklarar" ? " FÖRKLARAR" : " SÄGER"}
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
              {dialog.length} repliker mellan Anna, Peter och Johan.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
              {dialog.map((t, i) => {
                const info = SPEAKER_INFO[t.speaker] || SPEAKER_INFO.anna;
                return (
                  <p key={i} style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                    <span style={{ color: info.farg, fontWeight: 700 }}>
                      {info.namn}:{" "}
                    </span>
                    {t.text}
                  </p>
                );
              })}
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
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={onSpelaUpp}
              style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${info.farg}50`, color: info.farg, borderRadius: 6, fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer" }}
            >
              🔁 Spela upp igen
            </button>
            <button
              onClick={kopieraLank}
              style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${LANK}50`, color: LANK, borderRadius: 6, fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer" }}
            >
              {kopierat ? "✓ Länk kopierad" : "🔗 Kopiera länk"}
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
  const [orakelLaddar, setOrakelLaddar] = useState(false);

  const [lasning, setLasning] = useState(null); // { agent, namn, text }
  const [studio, setStudio] = useState(null); // { rubrik, beskrivning, turns?, meta? }
  // Privat läge — samma "spara inte"-princip som den privata frågeknappen på
  // agentprofilsidorna (✅23). Uppläsningen/studiosamtalet fungerar identiskt,
  // men ingen historikpost skrivs: sagFritext()/sagUrlResultat() hoppar över
  // sparaHistorik(), och diskuteraFritext()/diskuteraUrlResultat() utelämnar
  // studio.meta helt (onTurns-callbacken nedan är redan villkorad på att meta
  // finns, så en tom meta räcker för att inget studiosamtal sparas heller).
  const [privat, setPrivat] = useState(false);

  // Delat inlägg som väntar på ett klick innan uppspelning (se effekten
  // nedan) — { ...rad från fraga_anna_peter_log } | null
  const [delatInlagg, setDelatInlagg] = useState(null);

  const [historik, setHistorik] = useState([]);
  const [historikLaddar, setHistorikLaddar] = useState(true);
  const [historikMer, setHistorikMer] = useState(true);
  const [expanderad, setExpanderad] = useState({});

  const fritextTrimmed = fritext.trim();

  // Cursor-baserad paginering på `id` (bigserial, strikt stigande med
  // infogningsordning) istället för offset — en offset skiftar så fort en
  // ny post prependas lokalt efter en sparning, eller en annan besökare
  // hinner spara något mellan två "Ladda fler"-klick, vilket dubblettvisar
  // (inkl. dubblerad React key) raden som råkar hamna vid sidbrytningen
  // (Codex-fynd, PR #1345).
  async function laddaHistorik(cursor) {
    setHistorikLaddar(true);
    try {
      let q = `${SB_URL}/rest/v1/fraga_anna_peter_log?select=*&order=id.desc&limit=${PAGE_SIZE}`;
      if (cursor != null) q += `&id=lt.${cursor}`;
      const res = await fetch(q, { headers: sbH() });
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        setHistorik(prev => (cursor == null ? data : [...prev, ...data]));
        setHistorikMer(data.length === PAGE_SIZE);
      }
    } catch {
      // tyst — historiken är ett komplement, inte kritiskt för sidans funktion
    } finally {
      setHistorikLaddar(false);
    }
  }

  useEffect(() => { laddaHistorik(null); }, []);

  // Delningslänkar — en besökare som klickar "🔗 Kopiera länk" på ett
  // historikinlägg (eller på ett nyss avslutat studiosamtal på
  // /nyhetsanalyser) får en URL på formen ?visa=<fraga_anna_peter_log.id>.
  // Läses av här vid mount. window.location istället för useSearchParams()
  // undviker Next.js-kravet på en Suspense-gräns runt useSearchParams i App
  // Router.
  //
  // Sparar bara raden i `delatInlagg` — spelar INTE upp den direkt
  // (Codex-fynd, PR #1387-granskning): ett `useEffect` som triggar
  // responsiveVoice.speak() utan en föregående klickhändelse saknar den
  // "user gesture" webbläsare som Mobile Safari kräver för att inte blockera
  // autoplay av ljud, så en delad länk hade riskerat att öppna overlayen
  // helt tyst. En liten banner (se render nedan) låter besökaren själv
  // trycka "▶ Spela upp" — samma mönster som varje annan läs-/studioknapp på
  // sidan redan använder (klick → state-ändring → AgentOverlay/StudioOverlay
  // startar uppspelning i sin egen effekt, inom webbläsarens gest-fönster).
  useEffect(() => {
    const visaId = new URLSearchParams(window.location.search).get("visa");
    if (!visaId) return;
    (async () => {
      try {
        const res = await fetch(`${SB_URL}/rest/v1/fraga_anna_peter_log?id=eq.${encodeURIComponent(visaId)}&select=*`, { headers: sbH() });
        const data = await res.json().catch(() => []);
        const rad = Array.isArray(data) ? data[0] : null;
        if (rad) setDelatInlagg(rad);
      } catch {
        // tyst — en trasig eller borttagen delningslänk ska aldrig krascha sidan
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function laddaFlerHistorik() {
    const sista = historik[historik.length - 1];
    if (!sista) return;
    laddaHistorik(sista.id);
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
    if (!privat) sparaHistorik({ typ: "fritext", aktion: AGENT_TILL_AKTION[agent] || "anna_sager", text: fritextTrimmed });
  }
  function diskuteraFritext() {
    if (!fritextTrimmed) return;
    setStudio({
      rubrik: kortRubrik(fritextTrimmed),
      beskrivning: fritextTrimmed.slice(0, 800),
      meta: privat ? undefined : { typ: "fritext", text: fritextTrimmed },
    });
  }

  function sagUrlResultat(agent, namn) {
    if (!urlResultat) return;
    const text = [urlResultat.titel, urlResultat.sammanfattning].filter(Boolean).join(". ");
    setLasning({ agent, namn, text });
    if (!privat) {
      sparaHistorik({
        typ: "url", aktion: AGENT_TILL_AKTION[agent] || "anna_sager",
        url: urlResultat.url, titel: urlResultat.titel, sammanfattning: urlResultat.sammanfattning,
      });
    }
  }

  // Oraklet får en egen, djupare pipeline istället för den korta
  // og:description-teasern Anna/Peter/Johan läser: hämtar HELA artikelns
  // brödtext och kör den genom en LLM som sammanfattar OCH översätter till
  // svenska (samma sammanfattaForOraklet()-pipeline som /universitet
  // använder). Fail-open: misslyckas anropet (nätverksfel, för kort text,
  // LLM nere) faller vi tillbaka på den vanliga korta teasern istället för
  // att inte läsa alls.
  async function sagUrlOraklet() {
    if (!urlResultat) return;
    setOrakelLaddar(true);
    try {
      const res = await fetch("/api/fraga-anna-och-peter/oraklet-sammanfattning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlResultat.url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.sammanfattning) {
        sagUrlResultat("Oraklet", "Professor Oraklet");
        return;
      }
      const text = [data.titel, data.sammanfattning].filter(Boolean).join(". ");
      setLasning({ agent: "Oraklet", namn: "Professor Oraklet", text });
      if (!privat) {
        sparaHistorik({
          typ: "url", aktion: "oraklet_forklarar",
          url: data.url || urlResultat.url, titel: data.titel || urlResultat.titel, sammanfattning: data.sammanfattning,
        });
      }
    } catch {
      sagUrlResultat("Oraklet", "Professor Oraklet");
    } finally {
      setOrakelLaddar(false);
    }
  }
  function diskuteraUrlResultat() {
    if (!urlResultat) return;
    setStudio({
      rubrik: urlResultat.titel || kortRubrik(urlResultat.sammanfattning || ""),
      beskrivning: urlResultat.sammanfattning || "",
      meta: privat ? undefined : { typ: "url", url: urlResultat.url, titel: urlResultat.titel, sammanfattning: urlResultat.sammanfattning },
    });
  }

  function spelaUppHistorik(rad) {
    if (rad.aktion === "diskussion") {
      if (!Array.isArray(rad.dialog) || rad.dialog.length === 0) return;
      setStudio({ rubrik: rad.titel || kortRubrik(rad.input_text || ""), beskrivning: rad.sammanfattning || "", turns: rad.dialog });
    } else {
      const { agent, namn } = AKTION_TILL_AGENT[rad.aktion] || AKTION_TILL_AGENT.anna_sager;
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
            Fråga AI-agenterna
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            Klistra in valfri text — eller en länk till en nyhetsartikel — och låt{" "}
            <span style={{ color: ANNA_FARG }}>Anna</span> (nyhetsankare),{" "}
            <span style={{ color: PETER_FARG }}>Peter</span> (nationalekonom),{" "}
            <span style={{ color: JOHAN_FARG }}>Johan</span> (teknikoptimist) läsa upp den, eller{" "}
            <span style={{ color: ORAKLET_FARG }}>Professor Oraklet</span> förklara den — han hämtar
            hela artikeltexten, sammanfattar och översätter till svenska om källan är på ett annat
            språk — eller låt Anna, Peter och Johan diskutera den tillsammans i studion. Samma röster och
            animerade ansikten som på{" "}
            <a href="/nyhetsanalyser" style={{ color: LANK }}>Nyhetsanalyser</a>,{" "}
            <a href="/kanal" style={{ color: LANK }}>Nyhetskanalen</a> och{" "}
            <a href="/podd" style={{ color: LANK }}>Videopodden</a>.
          </p>
        </div>

        {/* ── Delat inlägg — väntar på ett klick innan uppspelning ── */}
        {delatInlagg && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap",
              padding: "12px 16px", background: `${STUDIO_FARG}0d`, border: `1px solid ${STUDIO_FARG}50`, borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 13, color: C.text, fontFamily: "Georgia, serif" }}>
              🔗 Någon delade {delatInlagg.aktion === "diskussion" ? "ett studiosamtal" : "en uppläsning"} med dig.
            </span>
            <button
              onClick={() => { spelaUppHistorik(delatInlagg); setDelatInlagg(null); }}
              style={{
                marginLeft: "auto", padding: "8px 16px", background: "transparent",
                border: `1px solid ${STUDIO_FARG}`, color: STUDIO_FARG, borderRadius: 6,
                fontSize: 13, fontFamily: "Georgia, serif", cursor: "pointer",
              }}
            >
              ▶ Spela upp
            </button>
          </div>
        )}

        {/* ── Privat läge ──────────────────────────────────────── */}
        <label
          style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
            padding: "10px 14px", background: C.surface, border: `1px solid ${privat ? "#e879f950" : C.border}`,
            borderRadius: 8, cursor: "pointer", userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={privat}
            onChange={e => setPrivat(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#e879f9" }}
          />
          <span style={{ fontSize: 13, color: privat ? "#e879f9" : C.text, fontFamily: "Georgia, serif" }}>
            🔒 Privat
          </span>
          <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 4 }}>
            — sparas inte i historiken nedan
          </span>
        </label>

        {/* ── Fri text ─────────────────────────────────────────── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", fontFamily: "monospace", color: C.textMuted, marginBottom: 10 }}>
            FRI TEXT
          </div>
          <textarea
            value={fritext}
            onChange={e => setFritext(e.target.value.slice(0, TEXT_MAX))}
            placeholder="Skriv eller klistra in text som Anna, Peter eller Johan ska säga eller diskutera…"
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
            <AktionsKnapp farg={JOHAN_FARG} disabled={!fritextTrimmed} onClick={() => sagFritext("Teknikoptimist", "Johan")}>
              💡 Johan säger det
            </AktionsKnapp>
            <AktionsKnapp farg={ORAKLET_FARG} disabled={!fritextTrimmed} onClick={() => sagFritext("Oraklet", "Professor Oraklet")}>
              🎓 Oraklet förklarar det
            </AktionsKnapp>
            <AktionsKnapp farg={STUDIO_FARG} disabled={!fritextTrimmed} onClick={diskuteraFritext}>
              🎭 Anna, Peter &amp; Johan diskuterar det
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
                <AktionsKnapp farg={JOHAN_FARG} onClick={() => sagUrlResultat("Teknikoptimist", "Johan")}>
                  💡 Johan läser den
                </AktionsKnapp>
                <AktionsKnapp farg={ORAKLET_FARG} disabled={orakelLaddar} onClick={sagUrlOraklet}>
                  {orakelLaddar ? "🎓 Förbereder…" : "🎓 Oraklet förklarar den"}
                </AktionsKnapp>
                <AktionsKnapp farg={STUDIO_FARG} onClick={diskuteraUrlResultat}>
                  🎭 Anna, Peter &amp; Johan diskuterar den
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
              Inget sparat än — bli den första att fråga Anna, Peter eller Johan.
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
          på fakta som inte finns i underlaget. Frågor och diskussioner sparas och visas
          offentligt i historiken ovan — förutom när "🔒 Privat" är ikryssad ovan, då sparas
          ingenting.
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
