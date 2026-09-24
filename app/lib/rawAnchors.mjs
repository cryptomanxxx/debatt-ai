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

// Tokeniserar EN attribut-token i taggens attributsträng: ett attributnamn
// följt av ett valfritt =värde (citerat med " eller ', eller ociterat fram
// till nästa whitespace/'>'). Grupp 1 = attributnamnet, grupp 2/3/4 =
// värdet (dubbla citattecken/enkla citattecken/ociterat).
//
// Används för att hitta href SOM ETT EGET, NAMNGIVET ATTRIBUT — inte som en
// lös delsträng "href=" var som helst i attributsträngen. En tidigare
// version sökte "href=" fritt i hela strängen (\bhref\s*=), vilket felaktigt
// kunde matcha "href=" INUTI ett annat attributs citerade värde (t.ex.
// title="href=https://fel.example" href="https://ratt.example" hade gett
// fel URL) eller ett attribut med ett liknande men annat namn (t.ex.
// data-href="..." hade blivit klickbart trots att det inte har någon
// href alls) — eftersom \b bara kräver en ordgräns, inte att "href" är
// hela attributnamnet (Codex-fynd, PR #1525-granskning). Genom att
// tokenisera ETT HELT attribut i taget (namn + eventuellt VÄRDE, där ett
// citerat värde konsumeras i sin helhet innan nästa attribut söks) kan
// "href=" aldrig hittas inuti ett annat attributs citerade innehåll, och
// ett namn som bara RÅKAR sluta på "href" (data-href, xlink:href) matchar
// aldrig eftersom hela attributnamnet ("data-href") jämförs, inte bara en
// delsträng av det.
const ATTR_TOKEN_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function extraheraHref(attrs) {
  ATTR_TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_TOKEN_RE.exec(attrs)) !== null) {
    if (m[1].toLowerCase() === "href") return (m[2] ?? m[3] ?? m[4] ?? "").trim();
    // Skydd mot en oändlig loop vid en nolllängdsmatchning — attributnamnets
    // teckenklass kräver minst ett tecken, så detta bör aldrig inträffa i
    // praktiken, men en trasig indata (t.ex. bara skräptecken) ska aldrig
    // kunna hänga skriptet.
    if (m.index === ATTR_TOKEN_RE.lastIndex) ATTR_TOKEN_RE.lastIndex++;
  }
  return "";
}

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
    const href = extraheraHref(attrs);
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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Söker `namn` (helt ord, skiftlägesokänsligt) i en tokenlista från
 * parseRawAnchors() (eller motsvarande `[{type:"text", value}]`-fallback)
 * — ENDAST i "text"-tokens, ALDRIG inuti en redan igenkänd länks (type
 * "link"/"unsafe-anchor") egen synliga text.
 *
 * Detta är avsiktligt: om en källas namn råkar förekomma INUTI en redan
 * inbäddad rå ankartaggs egen länktext (t.ex. en "Källor"-lista där citatets
 * EGEN synliga text börjar med källnamnet — "Anthropic – Claude discovers
 * ..." när källan heter "Anthropic") och man naivt letar efter namnet i hela
 * paragraf-STRÄNGEN innan man känner igen ankartaggar, splittras den råa
 * taggens markup mitt itu vid träffpunkten. Ena halvan (öppningstaggen utan
 * sin matchande </a>) blir då ett ofullständigt ankarmönster som aldrig kan
 * kännas igen och visas som rå, synlig text (den rapporterade buggen på
 * artikel 1849, ✅137). Genom att bara söka i redan avgränsade text-tokens
 * kan en sådan kollision aldrig uppstå — hela den råa ankartaggens token
 * lämnas helt orörd, oavsett vad dess synliga text råkar innehålla.
 *
 * Hittas en träff ersätts den delen av det text-tokenet med en ny
 * { type: "link", href, text }-token (kringliggande tokens oförändrade och i
 * ursprunglig ordning), och `{ tokens: <ny lista>, found: true }` returneras.
 * Ingen träff → `{ tokens: <samma lista, oförändrad>, found: false }`.
 */
export function insertNamedLink(tokens, namn, href) {
  const n = (namn || "").trim();
  if (!n || !href || !Array.isArray(tokens)) return { tokens, found: false };
  const re = new RegExp(`\\b(${escapeRegExp(n)})\\b`, "i");
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== "text") continue;
    const val = tokens[i].value;
    const m = val.match(re);
    if (!m) continue;
    const start = m.index;
    const slut = start + m[0].length;
    const nya = [
      ...tokens.slice(0, i),
      ...(start > 0 ? [{ type: "text", value: val.slice(0, start) }] : []),
      { type: "link", href, text: val.slice(start, slut) },
      ...(slut < val.length ? [{ type: "text", value: val.slice(slut) }] : []),
      ...tokens.slice(i + 1),
    ];
    return { tokens: nya, found: true };
  }
  return { tokens, found: false };
}
