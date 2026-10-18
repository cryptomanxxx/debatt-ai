// Delad, testbar logik för människors artikelinlämningar (/skicka-in och
// startsidans inlämningsformulär).
//
// Bakgrund: tidigare byggde webbläsaren själv AI-redaktörens prompt, skrev
// inlämningen till `inlamningar` och den publicerade artikeln till `artiklar`
// direkt med den publika anon-nyckeln. Det gjorde att vem som helst kunde läsa
// alla opublicerade inlämningar, och publicera en artikel med påhittade poäng
// utan att AI-redaktören någonsin bedömt den. Nu bygger servern prompten,
// sparar inlämningen och publicerar den bara om de SPARADE poängen räcker.
import { delningsToken, tokenMatchar } from "./lasarbildToken.mjs";

export const MIN_SCORE = 6;
export const MIN_ORD = { debattartikel: 300, nyhetsartikel: 300, filmrecension: 150 };
export const KATEGORI_FOR_TYP = {
  debattartikel: "Debatt",
  nyhetsartikel: "Nyheter",
  filmrecension: "Kultur & konst",
};
export const MAX_RUBRIK = 300;
export const MAX_FORFATTARE = 100;
export const MAX_ARTIKEL = 12_000;

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const LASARBILD_PREFIX = `${SB_URL}/storage/v1/object/public/lasarbilder/`;
// Samma form som app/lib/youtube.js (dupliceras här så modulen kan testas
// med node --test, där .js-filer tolkas som CommonJS).
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const LASARBILD_FILNAMN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

const JSON_FORMAT = `Svara ENDAST med JSON (inga andra tecken):
{"beslut":"publicera","motivering":"kort motivering","arg":8,"ori":7,"rel":9,"tro":8,"forbattringar":["förslag 1","förslag 2"],"styrkor":["styrka 1"],"rubrik":null,"taggar":["tagg1","tagg2","tagg3"]}

beslut är "publicera" om alla fyra >= ${MIN_SCORE}, annars "revidera" eller "avvisa".
taggar: 3–5 specifika ämnestaggar på svenska (gemener, max tre ord per tagg, mer specifika än en bred kategori).`;

export const SYSTEM_PROMPT = `Du är chefredaktör för en svensk debattajts. Bedöm artikeln på fyra kriterier (heltal 0-10):
1. Argumentationsklarhet – Är argumenten tydliga och logiskt uppbyggda?
2. Originalitet – Tillför artikeln något nytt till debatten?
3. Samhällsrelevans – Är ämnet viktigt och aktuellt?
4. Trovärdighet – Är faktapåståendena rimliga och välgrundade?

En artikel kan publiceras om ALLA fyra poäng är minst ${MIN_SCORE}/10.

${JSON_FORMAT}`;

// Speglar FILM_REVIEW_SYSTEM_PROMPT i app/api/agent/submit/route.js (✅123).
export const FILM_REVIEW_SYSTEM_PROMPT = `Du är chefredaktör för en svensk sajt som publicerar korta filmrecensioner. Bedöm recensionen på fyra kriterier (heltal 0-10) — ANPASSADE FÖR FILMKRITIK, inte en debattartikels tes/motargument/samhällsrelevans:
1. Argumentationsklarhet (arg) – Ger recensionen ett tydligt eget omdöme med motivering, inte bara en referering av handlingen?
2. Originalitet (ori) – Tillför recensionen en egen infallsvinkel eller insikt om filmen, inte bara en generisk beskrivning?
3. Relevans (rel) – Kopplar recensionen sina iakttagelser meningsfullt till filmen som helhet (berättelse, regi, skådespeleri)?
4. Trovärdighet (tro) – Verkar faktapåståendena (filmtitel, handling, skådespeleri) rimliga och fria från uppenbara påhitt?

En recension publiceras om ALLA fyra poäng är minst ${MIN_SCORE}/10. Kräv ALDRIG en debattartikels tes, motargument eller samhällsrelevans — det är en filmrecension, inte ett debattinlägg, och ska inte bedömas som ett sådant.

${JSON_FORMAT}`;

const ord = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;

/**
 * Validerar och normaliserar en inlämning. Returnerar `{ fel }` eller
 * `{ data }`. Bild-URL och YouTube-id släpps bara igenom om de har exakt den
 * form plattformens egna flöden skapar — annars null, aldrig fritext.
 */
export function valideraInlamning(body) {
  const b = body && typeof body === "object" ? body : {};
  const typ = Object.hasOwn(KATEGORI_FOR_TYP, b.typ) ? b.typ : null;
  if (!typ) return { fel: "Okänd artikeltyp." };
  const rubrik = typeof b.rubrik === "string" ? b.rubrik.trim() : "";
  const forfattare = typeof b.forfattare === "string" ? b.forfattare.trim() : "";
  const artikel = typeof b.artikel === "string" ? b.artikel.trim() : "";
  if (!rubrik || rubrik.length > MAX_RUBRIK) return { fel: "Rubrik saknas eller är för lång." };
  if (!forfattare || forfattare.length > MAX_FORFATTARE) return { fel: "Författarnamn saknas eller är för långt." };
  if (!artikel || artikel.length > MAX_ARTIKEL) return { fel: `Artikeltext saknas eller är för lång (max ${MAX_ARTIKEL} tecken).` };
  if (ord(artikel) < MIN_ORD[typ]) return { fel: `Texten behöver minst ${MIN_ORD[typ]} ord.` };

  let bild_url = null;
  if (typeof b.bild_url === "string" && b.bild_url.startsWith(LASARBILD_PREFIX)) {
    const filnamn = b.bild_url.slice(LASARBILD_PREFIX.length);
    if (LASARBILD_FILNAMN_RE.test(filnamn)) bild_url = b.bild_url;
  }
  const bild_fotograf = bild_url && typeof b.bild_fotograf === "string"
    ? (b.bild_fotograf.trim().slice(0, 200) || null)
    : null;
  const youtube_video_id = typeof b.youtube_video_id === "string" && YOUTUBE_ID_RE.test(b.youtube_video_id)
    ? b.youtube_video_id
    : null;

  return { data: { typ, rubrik, forfattare, artikel, bild_url, bild_fotograf, youtube_video_id } };
}

export function byggBedomningsMeddelanden({ typ, rubrik, forfattare, artikel }) {
  const prompt = typ === "filmrecension" ? FILM_REVIEW_SYSTEM_PROMPT : SYSTEM_PROMPT;
  return [{ role: "user", content: `${prompt}\n\nRubrik: ${rubrik}\nFörfattare: ${forfattare}\n\n${artikel}` }];
}

const poang = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : 0;
};
const strangLista = (v, max) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => x.slice(0, 300)).slice(0, max) : []);

/** Gör AI-redaktörens svar till säkra värden: heltalspoäng 0–10, korta textlistor. */
export function tolkaBedomning(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const arg = poang(r.arg), ori = poang(r.ori), rel = poang(r.rel), tro = poang(r.tro);
  const godkand = passerarKrav({ arg, ori, rel, tro });
  const beslutIn = typeof r.beslut === "string" ? r.beslut : "";
  // Beslutet följer alltid poängen, oavsett vad modellen skrev.
  const beslut = godkand ? "publicera" : (beslutIn === "avvisa" ? "avvisa" : "revidera");
  const rubrik = typeof r.rubrik === "string" && r.rubrik.trim() && r.rubrik.trim() !== "null"
    ? r.rubrik.trim().slice(0, MAX_RUBRIK)
    : null;
  return {
    beslut,
    motivering: typeof r.motivering === "string" ? r.motivering.slice(0, 2000) : "",
    arg, ori, rel, tro,
    forbattringar: strangLista(r.forbattringar, 8),
    styrkor: strangLista(r.styrkor, 8),
    rubrik,
    taggar: strangLista(r.taggar, 5).map((t) => t.slice(0, 60)),
  };
}

export function passerarKrav(row) {
  return ["arg", "ori", "rel", "tro"].every((k) => Number(row?.[k]) >= MIN_SCORE);
}

// Publiceringstoken: bevisar att den som publicerar är den som skickade in.
// Rubrikförslaget ingår i den signerade texten så att klienten bara kan välja
// mellan sin egen rubrik och AI-redaktörens förslag, inget annat.
const tokenText = (id, rubrikForslag) => `inlamning:${id}:${rubrikForslag || ""}`;

export function publiceringsToken(id, rubrikForslag, secret) {
  return delningsToken(tokenText(id, rubrikForslag), secret);
}

export function publiceringsTokenMatchar(id, rubrikForslag, token, secret) {
  return tokenMatchar(tokenText(id, rubrikForslag), token, secret);
}

/**
 * Bygger `artiklar`-raden ur en sparad inlämning. Typen härleds ur sparade
 * fält (kategori/filmrecension), aldrig ur något klienten skickar vid publicering.
 */
export function artikelradFranInlamning(inl, rubrik) {
  const arNyhet = (inl.kalla || "manniska") === "manniska"
    && inl.kategori === KATEGORI_FOR_TYP.nyhetsartikel
    && inl.filmrecension !== true;
  return {
    rubrik: rubrik || inl.rubrik,
    forfattare: inl.forfattare,
    artikel: inl.artikel,
    motivering: inl.motivering,
    kategori: inl.kategori,
    arg: inl.arg, ori: inl.ori, rel: inl.rel, tro: inl.tro,
    taggar: Array.isArray(inl.taggar) ? inl.taggar : [],
    kalla: inl.kalla || "manniska",
    bild_url: inl.bild_url || null,
    bild_fotograf: inl.bild_fotograf || null,
    youtube_video_id: inl.youtube_video_id || null,
    filmrecension: inl.filmrecension === true,
    // Manuella nyhetsartiklar använder referenslistan i artikeltexten. Behåll
    // en liten typmarkör så befintliga nyhetsfilter känner igen artikeln.
    nyhetskalla: arNyhet
      ? { typ: "manuell", namn: null, url: null, publicerad: null, antal_utvärderade: 0 }
      : null,
  };
}
