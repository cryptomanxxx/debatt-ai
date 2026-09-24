// Strippar RÅA <a href="...">text</a>-ankartaggar — samma mönster som
// app/artikel/[id]/ArgumentRoster.js → linkifyRawAnchors() renderar säkert
// till en klickbar länk för LÄSARE — men den syntaxen ska aldrig nå
// text-till-tal. LyssnaKnapp skickar sin `text`-prop rakt in i
// responsiveVoice.speak() utan någon HTML-tolkning, så en bokstavlig
// <a href="...">-tagg (t.ex. Filmrecensentens kodgaranterade käll­attribution,
// se ✅123) skulle annars läsas upp som syntax istället för prosa
// (Codex-fynd, PR #1470-granskning). Behåller bara länkens synliga text.
//
// Delegerar till den delade, testade parsern i app/lib/rawAnchors.mjs — de
// två filerna hade tidigare varsin egen kopia av samma regex, vilket är
// exakt det duplikationsmönster som redan flera gånger visat sig glida isär
// på andra ställen i den här kodbasen (se ✅93s agentAnalys.js-utbrytning).
export { taBortAnkartaggar } from "./rawAnchors.mjs";
