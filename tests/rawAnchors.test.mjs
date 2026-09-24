import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRawAnchors, taBortAnkartaggar } from "../app/lib/rawAnchors.mjs";

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
