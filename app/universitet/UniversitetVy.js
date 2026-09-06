"use client";
import { useCallback, useState } from "react";
import ForskningsListaVy from "./ForskningsListaVy";
import VetenskapsFlodeVy from "./VetenskapsFlodeVy";
import OrakletsLaslistaVy from "./OrakletsLaslistaVy";
import AgentOverlay from "../nyhetskallor/AgentOverlay";

function TypTab({ label, count, active, onClick, farg }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: "160px",
        textAlign: "left",
        background: active ? farg + "18" : "transparent",
        border: `1px solid ${active ? farg + "88" : "#0d2040"}`,
        borderRadius: "10px",
        padding: "14px 16px",
        cursor: "pointer",
        color: active ? farg : "#1e4a80",
      }}
    >
      <div style={{ fontSize: "13px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{ fontSize: "10px", fontFamily: "monospace", opacity: 0.75, marginTop: "3px" }}>
        {count} st
      </div>
    </button>
  );
}

// Innan denna komponent visades ForskningsListaVy och VetenskapsFlodeVy
// staplade under varandra — två långa kronologiska listor efter varandra,
// vilket tvingade besökaren att skrolla förbi hela forskningslistan (upp
// till 50 rader) bara för att nå vetenskapsnyheterna längst ner. En
// typväxlare löser det genom att bara visa EN lista åt gången — inget
// skrollberg att ta sig förbi för att nå den andra.
export default function UniversitetVy({ fynd, nyheter, urval }) {
  const [typ, setTyp] = useState(
    fynd.length > 0 ? "forskning" : nyheter.length > 0 ? "nyheter" : urval.length > 0 ? "urval" : "forskning"
  );
  // Professor Oraklet läser ett enskilt fynd/nyhet i taget — samma
  // AgentOverlay-mönster som "🎙️ Anna läser" m.fl. på /nyhetsanalyser, men
  // med bara EN läsare (ingen trevägsväljare) eftersom det bara finns en
  // föreläsande professor på universitetet. Lyfts hit till den gemensamma
  // föräldern istället för att dupliceras i både ForskningsListaVy och
  // VetenskapsFlodeVy, så bara en overlay-instans kan vara öppen åt gången
  // oavsett vilken flik besökaren står på.
  const [lasning, setLasning] = useState(null);

  // Sparar uppläsningen till fraga_anna_peter_log (samma tabell/route och
  // aktion "oraklet_forklarar" som Oraklets URL-förklaring på
  // /fraga-anna-och-peter redan använder) så den kan delas via en
  // ?visa=<id>-permalänk — samma mönster som "🔗 Dela"-knappen på
  // /nyhetsanalyser. En separat sparning från den fire-and-forget-loggning
  // som redan finns till /api/oraklet-lasning (som bara är till för
  // Senaste aktivitet-feeden och inte sparar den lästa texten). Matchar på
  // ett unikt invocationId per klick, inte payload.id, eftersom samma
  // fynd/nyhet kan öppnas flera gånger och en tidigare, fortfarande
  // pågående sparning annars kunde hamna på en senare öppning (samma
  // race-skydd som redan finns på /nyhetsanalyser).
  //
  // Sparas som typ "url" när fyndet/nyheten har en riktig källartikel-URL
  // (VetenskapsFlodeVy/OrakletsLaslistaVy — inte ForskningsListaVy, vars
  // fynd är plattformens EGNA forskningsresultat och inte "baserade på" en
  // extern artikel), annars typ "fritext". Utan detta saknade HistorikPost
  // helt en klickbar länk till källartikeln under Oraklets uppläsning
  // (användarrapport, sep 2026) — samma bugg som fanns på /nyhetsanalyser.
  // `meta.text` är redan en sammanslagen "titel. resten"-sträng (se
  // ForskningsListaVy/VetenskapsFlodeVy/OrakletsLaslistaVy), så titel-
  // prefixet klipps bort igen för sammanfattning-fältet istället för att
  // dupliceras vid uppspelning (som slår ihop titel+sammanfattning igen).
  //
  // Codex-fynd, PR #1392-granskning: om nyheten saknar beskrivning/motivering
  // (t.ex. /api/nyhetsflode/forbered-lasning misslyckades eller är rate-
  // limited) blir meta.text bara rubriken själv, utan "titel. "-separatorn —
  // startsWith()-kollen missar då detta fallet och den ANDRA grenen ("annars
  // meta.text") sparade tyst hela rubriken en gång till som sammanfattning,
  // vilket dubblerade titeln vid uppspelning ("Rubrik. Rubrik."). En explicit
  // exakt-match-koll mot meta.titel behandlar det fallet som "ingen
  // sammanfattning" istället.
  //
  // Rensar alltid sharePending när anropet är klart (lyckat eller ej) —
  // AgentOverlay håller overlayen öppen tills sharePending går till false,
  // annars kunde en kort uppläsning hinna avsluta talet och stänga overlayen
  // innan den här sparningen ens svarat, vilket permanent tappade
  // share-länken (samma race som fixades på /nyhetsanalyser, Codex-fynd
  // PR #1389-granskning).
  async function sparaLasningHistorik(meta) {
    try {
      const titelPrefix = meta.titel ? `${meta.titel}. ` : null;
      let resten;
      if (titelPrefix && meta.text.startsWith(titelPrefix)) {
        resten = meta.text.slice(titelPrefix.length);
      } else if (meta.titel && meta.text === meta.titel) {
        resten = null;
      } else {
        resten = meta.text;
      }
      const body = meta.url
        ? { typ: "url", aktion: "oraklet_forklarar", url: meta.url, titel: meta.titel, sammanfattning: resten }
        : { typ: "fritext", aktion: "oraklet_forklarar", text: meta.text };
      const res = await fetch("/api/fraga-anna-och-peter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      const id = data?.rad?.id;
      setLasning(prev => {
        if (!prev || prev.invocationId !== meta.invocationId) return prev;
        return id
          ? { ...prev, shareUrl: `${window.location.origin}/fraga-anna-och-peter?visa=${id}`, sharePending: false }
          : { ...prev, sharePending: false };
      });
    } catch {
      setLasning(prev => (prev && prev.invocationId === meta.invocationId ? { ...prev, sharePending: false } : prev));
    }
  }

  // Loggar uppläsningen (fire-and-forget) så den syns i Senaste
  // aktivitet-feeden på startsidan (se app/api/aktivitet/route.js) — utan
  // detta lämnade en Oraklet-uppläsning inget spår alls i databasen. Ett
  // loggningsfel ska aldrig hindra själva uppläsningen, som redan startat
  // klientsidan (overlayen öppnas synkront via setLasning).
  const handleLasa = useCallback((payload) => {
    const entry = { ...payload, invocationId: `${payload.typ}-${payload.id}-${Date.now()}`, sharePending: true };
    setLasning(entry);
    fetch("/api/oraklet-lasning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typ: payload.typ, ref_id: payload.id, titel: payload.titel }),
    }).catch(() => {});
    sparaLasningHistorik(entry);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
        <TypTab
          label="🔬 AI-forskning"
          count={fynd.length}
          active={typ === "forskning"}
          onClick={() => setTyp("forskning")}
          farg="#38bdf8"
        />
        <TypTab
          label="📡 Vetenskapliga Nyheter"
          count={nyheter.length}
          active={typ === "nyheter"}
          onClick={() => setTyp("nyheter")}
          farg="#fb923c"
        />
        <TypTab
          label="🎓 Professor Oraklets Läslista"
          count={urval.length}
          active={typ === "urval"}
          onClick={() => setTyp("urval")}
          farg="#dd6e5f"
        />
      </div>

      {typ === "forskning"
        ? <ForskningsListaVy fynd={fynd} onLasa={handleLasa} />
        : typ === "nyheter"
        ? <VetenskapsFlodeVy nyheter={nyheter} onLasa={handleLasa} />
        : <OrakletsLaslistaVy urval={urval} onLasa={handleLasa} />}

      {lasning && (
        // Nyckeln använder invocationId (unikt per klick) snarare än bara
        // typ+id — utan det kunde en snabb stäng+återöppna av SAMMA fynd/
        // nyhet återanvända samma nyckel och overlayen då inte remounta
        // korrekt mellan de två separata sparningarna (samma race som
        // åtgärdats på /nyhetsanalyser).
        <AgentOverlay
          key={`oraklet-${lasning.invocationId}`}
          agent="Oraklet"
          namn="Professor Oraklet"
          text={lasning.text}
          shareUrl={lasning.shareUrl}
          sharePending={lasning.sharePending}
          onClose={() => setLasning(null)}
        />
      )}
    </div>
  );
}
