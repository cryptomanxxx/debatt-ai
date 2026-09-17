"use client";
import { useState, useEffect, useRef, useMemo, Fragment } from "react";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Länkar den FÖRSTA förekomsten av källnamnet i brödtexten till källans URL —
// best-effort, eftersom artikeltexten är fri LLM-genererad prosa och inte
// alltid nämner källan ordagrant (då används fallback-raden istället).
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
function linkifyKalla(paragraphs, kalla) {
  if (!kalla?.url || !kalla?.namn) return { noder: paragraphs, matchIndex: -1 };
  const namn = kalla.namn.trim();
  if (namn) {
    const re = new RegExp(`\\b(${escapeRegExp(namn)})\\b`, "i");
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const m = p.match(re);
      if (!m) continue;
      const start = m.index;
      const slut = start + m[0].length;
      const noder = paragraphs.map((pp, j) => {
        if (j !== i) return pp;
        // Källnamnet kan dela stycke med en mänskligt formaterad citatlänk (t.ex.
        // en "Källor"-lista där källnamnet också nämns i prosan) — kör därför
        // linkifyRawAnchors på texten FÖRE och EFTER källnamnsmatchningen också,
        // inte bara på stycken linkifyKalla lämnar orörda (Codex-fynd,
        // PR #1463-granskning: den ursprungliga versionen hoppade helt över
        // raw-anchor-parsning för hela det källnamnsmatchade stycket).
        return (
          <Fragment key={`kalla-${j}`}>
            {linkifyRawAnchors(pp.slice(0, start), `kalla-${j}-pre`)}
            <a
              href={kalla.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#38bdf8", textDecoration: "underline", textDecorationColor: "#38bdf850" }}
            >
              {pp.slice(start, slut)}
            </a>
            {linkifyRawAnchors(pp.slice(slut), `kalla-${j}-post`)}
          </Fragment>
        );
      });
      return { noder, matchIndex: i };
    }
  }
  return { noder: paragraphs, matchIndex: -1 };
}

// Säker matchning av MÄNNISKO-skrivna citatlänkar i brödtexten — parsar ALDRIG
// texten som HTML (ingen dangerouslySetInnerHTML, texten skickas aldrig till
// DOM:en som markup). Extraherar bara href och länktext ur ett textmönster som
// RÅKAR se ut som en ankartagg, och bygger ett eget riktigt React-element av de
// extraherade värdena — alla andra attribut i det matchade mönstret (t.ex. ett
// insmugglat onclick=...) kastas bort helt, eftersom det nya elementet bara får
// href/target/rel/style, aldrig de matchade attributen rakt av. href godkänns
// bara om den börjar med http:// eller https:// — javascript:/data:/vbscript:
// m.fl. avvisas och lämnas kvar som overksam, synlig text istället för att bli
// klickbara (skydd mot att en mänsklig inlämning smugglar in en XSS-nyttolast
// via en falsk länk, t.ex. i en egenhändigt formaterad "Källor"-lista).
const SAFE_URL_RE = /^https?:\/\//i;
const RAW_ANCHOR_RE = /<a\s+href=(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;
// Snabb förkontroll innan den kostsammare loopen körs — måste vara lika
// tolerant mot skiftläge och whitespace som RAW_ANCHOR_RE självt (case-
// insensitive, godtyckligt whitespace mellan "<a" och "href"), annars
// missas giltiga former som <A href="..."> eller <a\thref="..."> som
// regexen faktiskt skulle ha matchat (Codex-fynd, PR #1463-granskning:
// den ursprungliga .includes("<a ") var skiftlägeskänslig och krävde
// exakt ett mellanslag).
const HAS_ANCHOR_RE = /<a\s/i;

function linkifyRawAnchors(text, keyPrefix) {
  if (typeof text !== "string" || !HAS_ANCHOR_RE.test(text)) return text;
  const nodes = [];
  let lastIndex = 0;
  let key = 0;
  let m;
  RAW_ANCHOR_RE.lastIndex = 0;
  while ((m = RAW_ANCHOR_RE.exec(text)) !== null) {
    const href = (m[1] ?? m[2] ?? "").trim();
    const linkText = m[3];
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    if (SAFE_URL_RE.test(href)) {
      nodes.push(
        <a
          key={`${keyPrefix}-raw-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#38bdf8", textDecoration: "underline", textDecorationColor: "#38bdf850" }}
        >
          {linkText}
        </a>
      );
    } else {
      // Osäkert URL-schema — lämna kvar exakt den ursprungliga texten, overksam.
      nodes.push(m[0]);
    }
    lastIndex = RAW_ANCHOR_RE.lastIndex;
  }
  if (lastIndex === 0) return text; // inget giltigt ankarmönster hittades trots "<a "-träffen
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return <Fragment key={keyPrefix}>{nodes}</Fragment>;
}

export default function ArgumentRoster({ artikelId, artikelText, kalla }) {
  const paragraphs = (artikelText || "").split("\n\n").filter(Boolean);
  const { noder: renderedParagraphs, matchIndex } = useMemo(
    () => linkifyKalla(paragraphs, kalla),
    [artikelText, kalla?.namn, kalla?.url]
  );
  // linkifyKalla har redan kört linkifyRawAnchors på sitt matchade styckes
  // pre-/post-delar internt (se ovan) — här körs den bara på råa strängar.
  // linkifyRawAnchors no-opar tyst på ett redan färdigt Fragment (typeof
  // text !== "string"), så samma anrop kan köras uniformt över alla stycken
  // utan att särbehandla matchIndex.
  const finalParagraphs = useMemo(
    () => renderedParagraphs.map((p, i) => linkifyRawAnchors(p, `p-${i}`)),
    [renderedParagraphs]
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
