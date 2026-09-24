// Delad, testbar parsning av RÅA <a href="...">text</a>-ankartaggar som
// råkar förekomma som ren text i artikelbrödtext — ALDRIG som riktig HTML
// (ingen dangerouslySetInnerHTML, texten skickas aldrig till DOM:en som
// markup). Detta extraherar bara href och länktext ur ett textmönster som
// råkar se ut som en ankartagg; anroparen bygger själv ett eget React-element
// av de extraherade värdena. Alla andra attribut i det matchade mönstret
// (t.ex. ett insmugglat onclick=...) kastas bort helt — det nya elementet
// får bara href/text.
//
// Två konsumenter delar den här modulen för att aldrig kunna glida isär:
// - app/artikel/[id]/ArgumentRoster.js → renderar en säker klickbar länk
// - app/lib/htmlText.js → strippar taggen ner till bara sin synliga text
//   inför text-till-tal (så en bokstavlig ankartagg aldrig läses upp som
//   syntax, se ✅123 Codex-fynd PR #1470-granskning)
//
// Ursprunget till den här filen: en tidigare version av regexen krävde att
// href var det FÖRSTA och ENDA attributet direkt efter "<a " (t.ex.
// `<a target="_blank" href="...">` matchade INTE, eftersom target kom
// före href). Det gjorde parsningen skör mot helt legitima variationer i
// hur en LLM eller en mänsklig inlämning råkar formatera en ankartagg:
// attributordning, whitespace runt "=", saknade citattecken. Denna version
// matchar hela <a ...>...</a>-elementet oavsett attributordning och letar
// sedan efter href NÅGONSTANS i attributsträngen.

// Snabb förkontroll innan den kostsammare loopen körs — kräver bara "<a"
// följt av whitespace, oavsett vad som kommer sedan (attributordning spelar
// ingen roll här, det är redan maximalt tolerant).
const HAS_ANCHOR_RE = /<a\s/i;

// Matchar ett helt <a ...>...</a>-element. Grupp 1 = den råa attributsträngen
// (kan innehålla href var som helst, i valfri ordning), grupp 2 = den
// synliga länktexten.
const ANCHOR_TAG_RE = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;

// Extraherar href-värdet ur en attributsträng — tolerant mot attributordning
// (den kan stå var som helst bland andra attribut), whitespace runt "="
// (href = "...", href="...", href ="..."), och citattecken (dubbla, enkla,
// eller helt utan citattecken).
const HREF_ATTR_RE = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

// Bara http(s)-länkar blir klickbara — javascript:/data:/vbscript: m.fl.
// avvisas och lämnas kvar som overksam, synlig text (skydd mot att en
// inlämning smugglar in en XSS-nyttolast via en falsk länk).
const SAFE_URL_RE = /^https?:\/\//i;

/**
 * Delar upp `text` i en lista av tokens:
 *   { type: "text", value }                — ren text, rendera som-is
 *   { type: "link", href, text }           — en giltig, säker ankartagg
 *   { type: "unsafe-anchor", text, raw }   — en ankartaggsliknande matchning
 *                                             utan en säker http(s)-href;
 *                                             `raw` är hela den ursprungliga
 *                                             matchade texten (visas orört,
 *                                             overksamt), `text` är bara den
 *                                             synliga länktexten (för TTS)
 *
 * Returnerar `null` om texten inte innehåller något giltigt ankarmönster
 * alls — anroparen kan då använda originaltexten oförändrad utan att bygga
 * en token-lista.
 */
export function parseRawAnchors(text) {
  if (typeof text !== "string" || !HAS_ANCHOR_RE.test(text)) return null;
  const tokens = [];
  let lastIndex = 0;
  let m;
  ANCHOR_TAG_RE.lastIndex = 0;
  while ((m = ANCHOR_TAG_RE.exec(text)) !== null) {
    if (m.index > lastIndex) tokens.push({ type: "text", value: text.slice(lastIndex, m.index) });
    const attrs = m[1] || "";
    const linkText = m[2];
    const hrefMatch = attrs.match(HREF_ATTR_RE);
    const href = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? "").trim() : "";
    if (href && SAFE_URL_RE.test(href)) {
      tokens.push({ type: "link", href, text: linkText });
    } else {
      tokens.push({ type: "unsafe-anchor", text: linkText, raw: m[0] });
    }
    lastIndex = ANCHOR_TAG_RE.lastIndex;
  }
  if (lastIndex === 0) return null; // inget giltigt ankarmönster hittades trots "<a "-träffen
  if (lastIndex < text.length) tokens.push({ type: "text", value: text.slice(lastIndex) });
  return tokens;
}

/** Ersätter varje ankartagg (giltig eller ej) med bara sin synliga text. */
export function taBortAnkartaggar(text) {
  const tokens = parseRawAnchors(text);
  if (!tokens) return text;
  return tokens.map((t) => (t.type === "text" ? t.value : t.text)).join("");
}
