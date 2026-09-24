import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRawAnchors, taBortAnkartaggar, insertNamedLink } from "../app/lib/rawAnchors.mjs";

// Regressionstest för artikel 1849 (sep 2026): en referenslänk visades inte
// korrekt. Grundorsaken var att den ursprungliga regexen krävde att href var
// det FÖRSTA och ENDA attributet direkt efter "<a " — en helt legitim
// variation i attributordning, whitespace eller citattecken gjorde att
// ankartaggen visades som rå, synlig text istället för en klickbar länk.
// Dessa tester låser fast att den nya, hårdare matchningen täcker de
// variationsklasser som orsakade buggen, utan att någonsin introducera
// dangerouslySetInnerHTML — parseRawAnchors returnerar bara rena
// data-tokens, aldrig HTML eller JSX.

function lankTokens(text) {
  return (parseRawAnchors(text) || []).filter((t) => t.type === "link");
}

test("standardfallet — href först, dubbla citattecken", () => {
  const tokens = parseRawAnchors('Läs mer: <a href="https://example.com/a">Källan</a>.');
  assert.equal(tokens.length, 3);
  assert.deepEqual(tokens[1], { type: "link", href: "https://example.com/a", text: "Källan" });
});

test("attributordning — href kommer EFTER target/rel (den rapporterade buggen)", () => {
  const [l] = lankTokens('<a target="_blank" rel="noopener" href="https://example.com/b">Källan</a>');
  assert.deepEqual(l, { type: "link", href: "https://example.com/b", text: "Källan" });
});

test("whitespace runt likhetstecknet", () => {
  const [l1] = lankTokens('<a href = "https://example.com/c">A</a>');
  assert.equal(l1.href, "https://example.com/c");
  const [l2] = lankTokens('<a href= "https://example.com/d">B</a>');
  assert.equal(l2.href, "https://example.com/d");
  const [l3] = lankTokens('<a href ="https://example.com/e">C</a>');
  assert.equal(l3.href, "https://example.com/e");
});

test("enkla citattecken runt href", () => {
  const [l] = lankTokens("<a href='https://example.com/f'>Källan</a>");
  assert.equal(l.href, "https://example.com/f");
});

test("helt utan citattecken runt href", () => {
  const [l] = lankTokens('<a href=https://example.com/g>Källan</a>');
  assert.equal(l.href, "https://example.com/g");
});

test("versaler i taggen och attributnamnet", () => {
  const [l] = lankTokens('<A HREF="https://example.com/h">Källan</A>');
  assert.equal(l.href, "https://example.com/h");
});

test("extra whitespace/radbrytning mellan attribut", () => {
  const [l] = lankTokens('<a\n  target="_blank"\n  href="https://example.com/i"\n>Källan</a>');
  assert.equal(l.href, "https://example.com/i");
});

test("www och icke-www fungerar identiskt", () => {
  const [l1] = lankTokens('<a href="https://www.example.com/j">A</a>');
  const [l2] = lankTokens('<a href="https://example.com/j">B</a>');
  assert.equal(l1.href, "https://www.example.com/j");
  assert.equal(l2.href, "https://example.com/j");
});

test("flera länkar i samma stycke, blandad attributordning och citattecken", () => {
  const text =
    'Se <a href="https://a.se">A</a> och <a target="_blank" href=\'https://b.se\'>B</a> samt <a rel="noopener" href=https://c.se>C</a>.';
  const tokens = lankTokens(text);
  assert.equal(tokens.length, 3);
  assert.deepEqual(
    tokens.map((t) => [t.href, t.text]),
    [
      ["https://a.se", "A"],
      ["https://b.se", "B"],
      ["https://c.se", "C"],
    ]
  );
});

test("flera källreferenser i olika stycken", () => {
  const p1 = parseRawAnchors('Källa ett: <a href="https://x.se">X</a>');
  const p2 = parseRawAnchors('Källa två: <a target="_blank" href="https://y.se">Y</a>');
  assert.equal(p1.filter((t) => t.type === "link")[0].href, "https://x.se");
  assert.equal(p2.filter((t) => t.type === "link")[0].href, "https://y.se");
});

test("osäkert URL-schema blir aldrig klickbart", () => {
  const tokens = parseRawAnchors('<a href="javascript:alert(1)">Klicka</a>');
  assert.equal(tokens.some((t) => t.type === "link"), false);
  const unsafe = tokens.find((t) => t.type === "unsafe-anchor");
  assert.ok(unsafe);
  assert.equal(unsafe.raw, '<a href="javascript:alert(1)">Klicka</a>');
});

test("ankartagg med attribut men utan href behandlas som osäker", () => {
  // En helt attributlös <a>text</a> (utan whitespace efter "<a") matchar
  // aldrig HAS_ANCHOR_RE:s förkontroll — precis som innan denna fix — och
  // ger korrekt null (ren overksam text, se testet för "text utan någon
  // ankartagg" ovan). Testar därför fallet där taggen HAR ett attribut
  // (och därmed whitespace) men saknar href specifikt.
  const tokens = parseRawAnchors('<a class="x">Klicka</a>');
  assert.ok(tokens);
  assert.equal(tokens.some((t) => t.type === "link"), false);
  const unsafe = tokens.find((t) => t.type === "unsafe-anchor");
  assert.ok(unsafe);
  assert.equal(unsafe.text, "Klicka");
});

test("text utan någon ankartagg returneras oförändrad (null)", () => {
  assert.equal(parseRawAnchors("Vanlig text utan länkar."), null);
});

test("ett stray '<a' utan avslutande </a> ger också null", () => {
  assert.equal(parseRawAnchors("Text med <a som aldrig stängs"), null);
});

test("icke-strängindata ger tillbaka indata oförändrad", () => {
  assert.equal(parseRawAnchors(null), null);
  assert.equal(parseRawAnchors(undefined), null);
});

test("taBortAnkartaggar — behåller bara synlig text för en giltig länk", () => {
  assert.equal(
    taBortAnkartaggar('Filmen är bra. Källa: <a href="https://x.se">@Kanalen</a>.'),
    "Filmen är bra. Källa: @Kanalen."
  );
});

test("taBortAnkartaggar — strippar även en attributordning-varierad tagg", () => {
  assert.equal(
    taBortAnkartaggar('<a target="_blank" href="https://x.se">@Kanalen</a>'),
    "@Kanalen"
  );
});

test("taBortAnkartaggar — strippar ner en osäker ankartagg till bara sin text också", () => {
  assert.equal(taBortAnkartaggar('<a href="javascript:x">Klicka</a>'), "Klicka");
});

test("taBortAnkartaggar — text utan ankartagg är oförändrad", () => {
  assert.equal(taBortAnkartaggar("Helt vanlig text."), "Helt vanlig text.");
});

test("taBortAnkartaggar — icke-sträng skickas tillbaka orörd", () => {
  assert.equal(taBortAnkartaggar(null), null);
  assert.equal(taBortAnkartaggar(42), 42);
});

// insertNamedLink — regressionstest för den FAKTISKA buggen på artikel 1849
// (sep 2026, bekräftad via en skärmdump av den publicerade artikeln): en
// källhänvisning i en "Källor"-lista visades som RÅ, synlig text — inklusive
// bokstavligen "<a href=...>" och en föräldralös "</a>" — istället för att
// bli en klickbar länk. Den attributordning-toleranta fixen ovan (PR #1525)
// löste INTE detta, eftersom det är en helt annan bugg: källans namn
// ("Anthropic") råkade vara det FÖRSTA ordet i citatets EGEN synliga
// länktext ("Anthropic – Claude discovers..."). Den gamla linkifyKalla()
// letade efter källnamnet i HELA paragraf-strängen INNAN den kände igen
// ankartaggar, hittade "Anthropic" mitt inuti citatets egen <a>...</a>, och
// klippte paragrafen vid den träffpunkten — vilket splittrade den råa
// ankartaggens markup i två ofullständiga halvor (en öppningstagg utan sin
// </a>, och en </a> utan sin öppningstagg), ingendera igenkännbar.
// insertNamedLink() söker nu bara i redan avgränsade text-tokens, ALDRIG
// inuti en redan igenkänd länks egen text — vilket förhindrar just detta.

test("insertNamedLink — hittar namnet i ett rent textstycke", () => {
  const tokens = [{ type: "text", value: "Enligt Aftonbladet är läget allvarligt." }];
  const { tokens: nya, found } = insertNamedLink(tokens, "Aftonbladet", "https://aftonbladet.se");
  assert.equal(found, true);
  assert.deepEqual(nya, [
    { type: "text", value: "Enligt " },
    { type: "link", href: "https://aftonbladet.se", text: "Aftonbladet" },
    { type: "text", value: " är läget allvarligt." },
  ]);
});

test("insertNamedLink — rör ALDRIG en redan igenkänd länks egen text, även om namnet står där", () => {
  // Detta är den EXAKTA formen på artikel 1849:s trasiga citat — källnamnet
  // "Anthropic" är det första ordet i citatets EGEN synliga länktext.
  const paragraf =
    '[1] <a href="https://www.anthropic.com/news/claude-discovers-novel-enzyme-system" target="_blank" rel="noopener noreferrer">Anthropic – Claude discovers a novel enzyme system with CRISPR-like repeats</a>';
  const tokens = parseRawAnchors(paragraf);
  // Grundläggande förutsättning: taggen känns igen som EN komplett länk.
  assert.equal(tokens.length, 2);
  assert.equal(tokens[1].type, "link");
  assert.equal(tokens[1].href, "https://www.anthropic.com/news/claude-discovers-novel-enzyme-system");

  const { tokens: nya, found } = insertNamedLink(
    tokens,
    "Anthropic",
    "https://www.anthropic.com/news/claude-discovers-novel-enzyme-system"
  );
  // "Anthropic" finns bara inuti länk-tokenets egen text — ingen träff ska
  // rapporteras, och tokenlistan ska vara HELT oförändrad (samma referens
  // eller åtminstone identiskt innehåll — taggen får aldrig splittras).
  assert.equal(found, false);
  assert.deepEqual(nya, tokens);
  assert.equal(nya[1].type, "link"); // fortfarande EN hel länk, inte itusplittrad
});

test("insertNamedLink — hittar namnet i ett SENARE textstycke när det bara förekommer inuti en tidigare länk", () => {
  const tokens = [
    { type: "link", href: "https://x.se/a", text: "Anthropic gjorde ett fynd" },
    { type: "text", value: " Läs mer hos Anthropic här." },
  ];
  const { tokens: nya, found } = insertNamedLink(tokens, "Anthropic", "https://anthropic.com");
  assert.equal(found, true);
  // Den första länk-tokenet ska vara helt orört.
  assert.deepEqual(nya[0], tokens[0]);
  // Träffen ska ligga i det EFTERFÖLJANDE textstycket.
  assert.deepEqual(nya.slice(1), [
    { type: "text", value: " Läs mer hos " },
    { type: "link", href: "https://anthropic.com", text: "Anthropic" },
    { type: "text", value: " här." },
  ]);
});

test("insertNamedLink — ingen träff alls (varken i text eller länk) ger tokenlistan oförändrad", () => {
  const tokens = [{ type: "text", value: "Helt orelaterad text." }];
  const { tokens: nya, found } = insertNamedLink(tokens, "SVT Nyheter", "https://svt.se");
  assert.equal(found, false);
  assert.equal(nya, tokens);
});

test("insertNamedLink — saknat namn eller href ger found:false utan att kasta", () => {
  const tokens = [{ type: "text", value: "Text." }];
  assert.equal(insertNamedLink(tokens, "", "https://x.se").found, false);
  assert.equal(insertNamedLink(tokens, "X", "").found, false);
  assert.equal(insertNamedLink(tokens, null, "https://x.se").found, false);
});

test("insertNamedLink — matchar bara hela ord, inte en substräng inuti ett annat ord", () => {
  // Den ENDA förekomsten av "Nyheter" i den här texten sitter ihopskriven
  // med "24" utan mellanslag — ingen ordgräns mellan "r" och "2", så
  // \bNyheter\b ska INTE matcha där.
  const tokens = [{ type: "text", value: "Vi läser Nyheter24 varje dag." }];
  const { found } = insertNamedLink(tokens, "Nyheter", "https://svt.se/nyheter");
  assert.equal(found, false);
});
