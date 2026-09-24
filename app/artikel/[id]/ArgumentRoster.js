"use client";
import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { parseRawAnchors, insertNamedLink } from "../../lib/rawAnchors.mjs";

const LANK_STIL = { color: "#38bdf8", textDecoration: "underline", textDecorationColor: "#38bdf850" };

// Bygger React-noder av en tokenlista (från parseRawAnchors, eventuellt
// utökad med en enstaka namngiven källänk via insertNamedLink) — parsar
// ALDRIG texten som HTML (ingen dangerouslySetInnerHTML, texten skickas
// aldrig till DOM:en som markup). Varje "link"-token bygger ett eget,
// riktigt React-element av bara de extraherade href/text-värdena — alla
// andra attribut i ett matchat ankarmönster (t.ex. ett insmugglat
// onclick=...) kastas bort helt. En "unsafe-anchor"-token (osäkert eller
// saknat URL-schema, se rawAnchors.mjs) lämnas kvar som exakt sin
// ursprungliga text, overksam.
function renderTokens(tokens, keyPrefix) {
  return tokens.map((t, i) => {
    if (t.type === "text") return t.value;
    if (t.type === "link") {
      return (
        <a key={`${keyPrefix}-${i}`} href={t.href} target="_blank" rel="noopener noreferrer" style={LANK_STIL}>
          {t.text}
        </a>
      );
    }
    return t.raw;
  });
}

// Delar upp brödtexten i stycken, känner igen råa mänskligt/AI-formaterade
// citatlänkar (parseRawAnchors, se rawAnchors.mjs) i VARJE stycke, och
// länkar därefter den FÖRSTA förekomsten av källnamnet — best-effort,
// eftersom artikeltexten är fri LLM-genererad prosa och inte alltid nämner
// källan ordagrant (då används fallback-raden istället).
//
// Källnamnet söks ENDAST i redan avgränsade text-tokens — ALDRIG inuti en
// redan igenkänd rå ankartaggs egen synliga länktext (insertNamedLink() i
// rawAnchors.mjs). Utan den avgränsningen kunde en källnamnsträff som råkar
// ligga INUTI en sådan tagg (t.ex. en "Källor"-lista där citatets EGEN
// länktext börjar med källnamnet — "Anthropic – Claude discovers ..." när
// källan heter "Anthropic") splittra den råa taggens markup mitt itu vid
// träffpunkten: öppningstaggen utan sin matchande </a> blir då ett
// ofullständigt mönster som aldrig kan kännas igen och visas som rå, synlig
// text (den rapporterade buggen på artikel 1849, ✅137).
//
// Matchar MEDVETET bara det fullständiga källnamnet, inte en utbruten
// sista/första-ords-substräng (t.ex. "Nyheter" ur "SVT Nyheter", "Sverige"
// ur "Reddit Sverige"). Många av plattformens källnamn (se nyheter.py) är
// sammansatta av vanliga svenska/engelska ord — "Sverige", "Nyheter",
// "Ekonomi", "Klimat", "Samhälle", "News" m.fl. — som med hög sannolikhet
// förekommer på helt orelaterade ställen i en debattartikel. Att länka en
// sådan förekomst hade gett en felaktig källattribution (Codex-fynd,
// PR #1382-granskning). Det fullständiga namnet är i praktiken alltid
// distinkt nog för en säker matchning.
function byggParagrafer(paragraphs, kalla) {
  const tokensPerStycke = paragraphs.map((p) => parseRawAnchors(p) || [{ type: "text", value: p }]);
  let matchIndex = -1;
  if (kalla?.url && kalla?.namn) {
    for (let i = 0; i < tokensPerStycke.length; i++) {
      const { tokens, found } = insertNamedLink(tokensPerStycke[i], kalla.namn, kalla.url);
      if (found) {
        tokensPerStycke[i] = tokens;
        matchIndex = i;
        break;
      }
    }
  }
  const noder = tokensPerStycke.map((tokens, j) => <Fragment key={`p-${j}`}>{renderTokens(tokens, `p-${j}`)}</Fragment>);
  return { noder, matchIndex };
}

export default function ArgumentRoster({ artikelId, artikelText, kalla }) {
  const paragraphs = (artikelText || "").split("\n\n").filter(Boolean);
  const { noder: finalParagraphs, matchIndex } = useMemo(
    () => byggParagrafer(paragraphs, kalla),
    [artikelText, kalla?.namn, kalla?.url]
  );
  const [votes, setVotes] = useState({});
  const [voted, setVoted] = useState({});
  const [hovered, setHovered] = useState(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia("(hover: none)").matches) setIsTouch(true);

    const v = {};
    paragraphs.forEach((_, i) => {
      if (localStorage.getItem(`arg_${artikelId}_${i}`) === "1") v[i] = true;
    });
    setVoted(v);

    fetch(`/api/argument-roster?artikel_ids=${artikelId}`)
      .then(r => r.json())
      .then(data => {
        const m = {};
        for (const row of Array.isArray(data) ? data : []) {
          if (String(row.artikel_id) === String(artikelId)) m[row.stycke_index] = row.roster;
        }
        setVotes(m);
      })
      .catch(() => {});
  }, [artikelId]);

  async function vote(index) {
    if (voted[index]) return;
    setVoted(prev => ({ ...prev, [index]: true }));
    setVotes(prev => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
    localStorage.setItem(`arg_${artikelId}_${index}`, "1");
    try {
      const res = await fetch("/api/argument-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artikel_id: artikelId, stycke_index: index, stycke_text: paragraphs[index] }),
      });
      const d = await res.json();
      if (d.roster !== undefined) setVotes(prev => ({ ...prev, [index]: d.roster }));
    } catch {}
  }

  return (
    <div style={{ marginBottom: "48px", maxWidth: "660px" }}>
      {/* Förklaringstext */}
      <p style={{ fontSize: "11px", color: "#444", fontFamily: "monospace", letterSpacing: "0.06em", margin: "0 0 24px 0", textAlign: "right" }}>
        {isTouch ? "Tryck på ▲ bredvid ett stycke för att lyfta fram det bästa argumentet" : "Hovra över ett stycke och klicka ▲ för att lyfta fram det bästa argumentet"}
      </p>

      {paragraphs.map((p, i) => {
        const hasVotes = (votes[i] || 0) > 0;
        const isVoted = !!voted[i];
        // On touch: always show button (at low opacity unless voted/has votes)
        // On desktop: show on hover or if voted/has votes
        const showBtn = isTouch || hovered === i || hasVotes || isVoted;
        const btnOpacity = isTouch && !hovered && !hasVotes && !isVoted ? 0.25 : 1;

        return (
          <div
            key={i}
            style={{ position: "relative", margin: "0 0 28px 0" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <p style={{ fontSize: "18px", lineHeight: 2, color: "#f0ede6", margin: 0, paddingRight: "48px" }}>{finalParagraphs[i]}</p>
            <button
              onClick={() => vote(i)}
              title={isVoted ? "Röstad" : "Lyft fram detta argument"}
              aria-label="Rösta på argument"
              style={{
                position: "absolute",
                right: 0,
                top: "4px",
                display: showBtn ? "flex" : "none",
                flexDirection: "column",
                alignItems: "center",
                gap: "1px",
                background: isVoted ? "#0a200a" : "transparent",
                border: isVoted ? "1px solid #4ade8040" : "1px solid transparent",
                borderRadius: "6px",
                cursor: isVoted ? "default" : "pointer",
                padding: "5px 8px",
                opacity: btnOpacity,
                transition: "opacity 0.15s, background 0.15s",
                minWidth: "32px",
              }}
            >
              <span style={{ fontSize: "12px", color: isVoted ? "#4ade80" : "#555555", lineHeight: 1 }}>▲</span>
              <span style={{ fontSize: "10px", color: isVoted ? "#4ade80" : "#666666", fontFamily: "monospace", lineHeight: 1, minHeight: "12px" }}>
                {hasVotes ? votes[i] : ""}
              </span>
            </button>
          </div>
        );
      })}

      {/* Fallback när källnamnet inte nämns ordagrant i brödtexten — garanterar
          att en klickbar källänk alltid finns direkt i artikelflödet, inte bara
          i den separata metadata-boxen under artikeln. */}
      {matchIndex === -1 && kalla?.url && (
        <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#8a8a8a", fontStyle: "italic", margin: "-4px 0 0 0" }}>
          Läs källan: <a href={kalla.url} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "underline", textDecorationColor: "#38bdf850" }}>{kalla.namn}</a>
        </p>
      )}
    </div>
  );
}
