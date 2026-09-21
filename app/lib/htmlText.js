// Strippar RÅA <a href="...">text</a>-ankartaggar — samma mönster som
// app/artikel/[id]/ArgumentRoster.js → linkifyRawAnchors() renderar säkert
// till en klickbar länk för LÄSARE — men den syntaxen ska aldrig nå
// text-till-tal. LyssnaKnapp skickar sin `text`-prop rakt in i
// responsiveVoice.speak() utan någon HTML-tolkning, så en bokstavlig
// <a href="...">-tagg (t.ex. Filmrecensentens kodgaranterade käll­attribution,
// se ✅123) skulle annars läsas upp som syntax istället för prosa
// (Codex-fynd, PR #1470-granskning). Behåller bara länkens synliga text.
const RAW_ANCHOR_RE = /<a\s+href=(?:"[^"]*"|'[^']*')[^>]*>([\s\S]*?)<\/a>/gi;

export function taBortAnkartaggar(text) {
  if (typeof text !== "string" || !text) return text;
  return text.replace(RAW_ANCHOR_RE, "$1");
}
