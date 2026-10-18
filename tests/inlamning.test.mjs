import { test } from "node:test";
import assert from "node:assert/strict";
import {
  valideraInlamning, tolkaBedomning, passerarKrav, byggBedomningsMeddelanden,
  publiceringsToken, publiceringsTokenMatchar, artikelradFranInlamning,
  FILM_REVIEW_SYSTEM_PROMPT, SYSTEM_PROMPT,
} from "../app/lib/inlamning.mjs";

const SECRET = "service-role-test";
const text = (n) => Array.from({ length: n }, (_, i) => `ord${i}`).join(" ");
const BILD = "https://fmwxftnistkoqazfwnuj.supabase.co/storage/v1/object/public/lasarbilder/0f8fad5b-d9cb-469f-a165-70867728950e.jpg";

test("validering kräver känd typ och ordminimum per typ", () => {
  const bas = { rubrik: "R", forfattare: "A" };
  assert.ok(valideraInlamning({ ...bas, typ: "hackad", artikel: text(400) }).fel);
  assert.ok(valideraInlamning({ ...bas, typ: "debattartikel", artikel: text(299) }).fel);
  assert.ok(valideraInlamning({ ...bas, typ: "debattartikel", artikel: text(300) }).data);
  assert.ok(valideraInlamning({ ...bas, typ: "filmrecension", artikel: text(150) }).data);
});

test("bild-URL och YouTube-id släpps bara igenom i exakt rätt form", () => {
  const bas = { typ: "debattartikel", rubrik: "R", forfattare: "A", artikel: text(300) };
  const ok = valideraInlamning({ ...bas, bild_url: BILD, bild_fotograf: "eget foto", youtube_video_id: "dQw4w9WgXcQ" }).data;
  assert.equal(ok.bild_url, BILD);
  assert.equal(ok.bild_fotograf, "eget foto");
  assert.equal(ok.youtube_video_id, "dQw4w9WgXcQ");
  const fel = valideraInlamning({ ...bas, bild_url: "https://evil.example/x.jpg", bild_fotograf: "x", youtube_video_id: "javascript:1" }).data;
  assert.equal(fel.bild_url, null);
  assert.equal(fel.bild_fotograf, null);
  assert.equal(fel.youtube_video_id, null);
});

test("prompten byggs på servern och väljs efter typ", () => {
  const film = byggBedomningsMeddelanden({ typ: "filmrecension", rubrik: "R", forfattare: "A", artikel: "T" });
  assert.ok(film[0].content.startsWith(FILM_REVIEW_SYSTEM_PROMPT));
  const debatt = byggBedomningsMeddelanden({ typ: "debattartikel", rubrik: "R", forfattare: "A", artikel: "T" });
  assert.ok(debatt[0].content.startsWith(SYSTEM_PROMPT));
});

test("bedömningen klampas och beslutet följer poängen", () => {
  const b = tolkaBedomning({ beslut: "publicera", arg: 99, ori: "7", rel: 6.4, tro: -3, rubrik: "null" });
  assert.deepEqual([b.arg, b.ori, b.rel, b.tro], [10, 7, 6, 0]);
  assert.equal(b.beslut, "revidera");
  assert.equal(b.rubrik, null);
  const ok = tolkaBedomning({ beslut: "avvisa", arg: 6, ori: 6, rel: 6, tro: 6 });
  assert.equal(ok.beslut, "publicera");
  assert.equal(passerarKrav(ok), true);
  assert.equal(passerarKrav({ arg: 6, ori: 6, rel: 6, tro: 5 }), false);
});

test("publiceringstoken är bunden till id och rubrikförslag", () => {
  const t = publiceringsToken(42, "Förslag", SECRET);
  assert.equal(publiceringsTokenMatchar(42, "Förslag", t, SECRET), true);
  assert.equal(publiceringsTokenMatchar(43, "Förslag", t, SECRET), false);
  assert.equal(publiceringsTokenMatchar(42, "Annan rubrik", t, SECRET), false);
  assert.equal(publiceringsTokenMatchar(42, "Förslag", t, ""), false);
  const utan = publiceringsToken(42, null, SECRET);
  assert.equal(publiceringsTokenMatchar(42, null, utan, SECRET), true);
});

test("artikelraden byggs ur sparade fält, nyhetsmarkör bara för människors nyheter", () => {
  const inl = { rubrik: "R", forfattare: "A", artikel: "T", kategori: "Nyheter", arg: 7, ori: 7, rel: 7, tro: 7, kalla: "manniska" };
  assert.equal(artikelradFranInlamning(inl).nyhetskalla.typ, "manuell");
  assert.equal(artikelradFranInlamning(inl, "Ny").rubrik, "Ny");
  assert.equal(artikelradFranInlamning({ ...inl, kategori: "Debatt" }).nyhetskalla, null);
  assert.equal(artikelradFranInlamning({ ...inl, kalla: "ai" }).nyhetskalla, null);
});
