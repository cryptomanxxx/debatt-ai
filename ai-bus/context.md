# debatt.ai – AI-sessionskontext

> Den här filen läses av Claude Code i början av varje session.
> Uppdateras manuellt av projektägaren efter varje session.

---

## Vad projektet är

En svensk AI-nyhets- och debattplattform. 24 AI-agenter publicerar artiklar, repliker och debatter automatiskt 12 gånger om dagen. Besökare kan rösta, kommentera och se AI-agenter debattera live.

Stack: Next.js App Router, Supabase, Groq (primär AI), Gemini Flash (fallback), Vercel, GitHub Actions.

---

## Senaste sessionen (2026-07-04)

**Vad som gjordes (8 mergade PR:ar, #1193–#1200):**
- **Gemensam statistikkälla** (#1194, #1195): Gini beräknades på 5 ställen oberoende av varandra med olika systemkontofiltrering — economy-observern rapporterade Gini 0.862 samma dag som /oligarki visade 0.339 (Börskassan, 100 000 kr, ingick i den ena). Nu finns `app/lib/metrics.js` (CommonJS: `gini()`, `toppAndel()`, `filtreraSystemkonton()`, `SYSTEM_KONTON`, `EXKL_SYSTEM_QS`) och Python-spegeln i `supabase_utils.py` (`berakna_gini()`, `SYSTEM_KONTON`, `EXKL_SYSTEM_QS`). Fyra sidor som glömt filtrera Börskassan fixades (korruption, staten, formogenhet, forskning_test).
- **CI-testsvit** (#1199): `tests/test_berakningar.py` (pytest, 19 tester) + `tests/metrics.test.mjs` (node:test, 11 tester) körs via `.github/workflows/tests.yml` vid varje push/PR som rör `*.py`, `metrics.js` eller `tests/`. Inkluderar paritetstester Python↔JS och Börskassan-scenariot som regressionstest. `berakna_insats()` extraherades ur `spara_bet()` för testbarhet.
- **Cachad aktivitetsfeed** (#1196): startsidans 26 Supabase-fetchar per besökare var 30:e sekund flyttade till `GET /api/aktivitet` med 25s in-memory-cache + CDN s-maxage. Klientens `fetchAktivitetsFeed()` är nu en tunn fetch.
- **SEO** (#1197): `metadataBase` + självrefererande canonical (`"./"`) i layout, og:article publishedTime/authors/tags per artikel, 34 saknade sidor i sitemap, robots blockerar testsidor + /api/, WebSite/Organization JSON-LD med SearchAction på startsidan.
- **"Vad är detta?"-intro** (#1198): avvisningsbar sektion under hero på startsidan (localStorage-nyckel `introDold`), tre ingångar: /arkiv, /chatt, /hjarnan.
- **Grupperad nav** (#1200): GlobalNav har nu toppnivå (Hem/Nyheter/Direktdebatt/Arkiv/Debatthistorik) + fem dropdown-grupper (Debatt/Ekonomi/Politik/Socialt/Spel & Mer, 63 sidor). Desktop: klick-dropdowns; mobil: accordion. Footern förblir det kompletta indexet. Startsidans egen SPA-nav orörd.
- **ai-bus-städning** (#1193): QA-observern hash-cachar oförändrade sidor (MD5 i `detalj`-fältet, `[h:…]`-prefix; cache gäller bara vid 0 konsolfel, skärmdump sparas alltid för qa-tidslinjen), `agent_ager_token()` förhindrar ICO-dubbelköp. 11 inaktuella Codestral-förslag avvisade med rationale.

**Viktiga regler framåt:**
- All Gini/förmögenhetsstatistik ska gå via `app/lib/metrics.js` (JS) resp. `berakna_gini`/`SYSTEM_KONTON` i `supabase_utils.py` (Python) — aldrig egna inline-implementationer. Testerna i `tests/` låser pariteten.
- Systemkontona `Statskassa` och `Börskassan` ska ALLTID filtreras ur förmögenhetsdata. Använd `EXKL_SYSTEM_QS` i Supabase-queries (percent-enkodad — rå "ö" i URL-path ger HPE_INVALID_URL i Node).
- Codex granskar varje PR automatiskt: kommenterar vid fynd, reagerar med 👍 på PR-beskrivningen vid godkänt utan anmärkningar. Kolla reaktionen innan merge om ingen kommentar synts inom ~3 min.

**Varför vi valde dessa lösningar:**
- `metrics.js` som CommonJS — kan både importeras av Next-sidor och `require()`:as av fristående `agents/`-skript (ingen `"type": "module"` i package.json)
- Nodes inbyggda testrunner (`node --test`) — noll nya beroenden
- Paritetstest som parsar JS-filen från Python — Gini-implementationerna kan inte glida isär obemärkt

---

## Ska INTE göras (medvetna beslut)

- **Dela upp KanalPage i hooks/komponenter** — korrekt i princip men månaders refaktorering för marginell vinst
- **XState eller Zustand** — overkill för projektet
- **p-queue/bottleneck** — `await sleep()` fungerar tillräckligt bra
- **Server-side förrenderade MP3-filer** — intressant långsiktigt men inte nu
- **Feature-branches** — jobba alltid direkt på `main`. Claude Code-proxyn blockerar push till `main` om sessionen startas på en feature-branch. Begär alltid sessioner utan feature-branch så att `main` är målet från start.

---

## Kända problem / teknisk skuld

- `responsiveVoice` är instabilt (browser autoplay policies, mobil throttling) — accepterat tills vidare
- `langRef` och `lang` state kan divergera tillfälligt vid språkbyte — fungerar i praktiken
- KanalPage är fortfarande en stor komponent — accepterat

---

## Nästa prioritet

*(uppdateras av projektägaren)*

---

## Bildmappning för Anna (`/public/avatarer/podd/`)

**v5 (3 sep 2026, aktuell) — "anna_locked_final_v1", byggd av projektägaren + ChatGPT (~4h arbete), inte av Claude Code.**
Helt annan arkitektur än v1–v4: inte 12 separat AI-genererade helbildsframes
som efterhandsjusteras, utan EN omutlig masterduk (`anna_base.png`, 1536×1536)
+ 5 oberoende, alfamaskerade overlay-lager (`mouth_small/medium/large.png`,
`eyes_half/closed.png`) som var för sig bara täcker en liten, tight region
(mun ≈210×180px, ögon ≈375×115px — mätt, inte antaget). Pixelstabilitet är
garanterad by construction: allt utanför de aktiva maskerna är exakt 0
ändrade pixlar per design, inte något som behöver efterhandsverifieras och
råka stämma. Claude Code komponerade de 12 kombinationerna själv (bas +
valfri mun-lager + valfritt ögon-lager, `Image.alpha_composite` vid x=0,y=0
enligt medföljande README) och verifierade ANDRA gången oberoende — inte
bara tog leverantörens ord för det — innan filerna lades in: 0 pixlars
skillnad utanför mun/ögon-boxarna på samtliga 12 kombinationer, både före
och efter nedskalning 1536→1024px, plus riktig variation inuti boxarna
(32–56% av munregionen ändras mellan mun-lägen, 41% av ögonregionen mellan
open/half/closed). Detta är den första versionen där både "pixelstabilt"
OCH "verkligt uttrycksfull mun/ögon" är sanna SAMTIDIGT, verifierat med
samma rigorösa mätmetod som avslöjade att v3 inte var det den påstods vara.

**v5.1 (3 sep 2026) — feathering-fix på Codex-fynd (PR #1324):** källagrens
alfakanaler hade en mycket brant övergång (0→255 på 2–5px, praktiskt taget
en hård urklippskant) — synligt som en svag oval söm/kant kring munnen (mest
under underläppen och i mungiporna) när `AnchorImage` alternerar mun-frames
var 220:e ms under tal. Verifierat visuellt (zoomade in 3× på munregionen)
innan fix, inte bara Codex ord för det. Fix: `ImageFilter.GaussianBlur(6)`
på varje lagers ALFAKANAL innan kompositering (RGB-innehållet orört) —
mjukar upp övergångszonen utan att blanda ut mun-/ögondetaljerna själva.
Omverifierat efter fix: fortfarande exakt 0 pixlars skillnad utanför en
generöst breddad maskeringszon (samma garanti som v5, bara med bredare
marginal för den nu mjukare kanten), munregionens variation oförändrad
(32,9/47,0/57,9% — inom brus från v5:s 32,7/46,9/56,0%), och synlig söm
borta i en ny visuell 12-rutors kontaktkarta av alla mun-/ögonkombinationer.

Tidigare versioner (för historik): v1 (pixelstabil metod, näst intill
statisk mun — small/medium/large visuellt identiska) och v3 (bra
mun-/ögonvariation, PÅSTODS pixelstabil men var det inte — Codex-granskning
+ oberoende pixel-diff visade 50%+ ändrade pixlar i pannan/kinderna/näsan
mellan frames) löste var för sig bara hälften av problemet. v4 (Claude
Codes egen MediaPipe FaceMesh-baserade similarity-transform +
maskkompositering ovanpå en vald masterbild) löste båda halvorna men
lämnade kvar en mindre "pannan rör sig i sidled"-artefakt som användaren
själv upptäckte i video — det som ledde till att projektägaren och ChatGPT
byggde v5 från grunden med en helt annan (enklare, mer robust) arkitektur.

| Position | Öppna ögon | Halvöppna ögon | Stängda ögon |
|---|---|---|---|
| m0 stängd mun | `anna.png` | `anna-m0-half.png` | `anna-m0-closed.png` |
| m1 liten mun | `anna-small.png` | `anna-m1-half.png` | `anna-m1-closed.png` |
| m2 medium mun | `anna-medium.png` | `anna-m2-half.png` | `anna-m2-closed.png` |
| m3 stor mun | `anna-large.png` | `anna-m3-half.png` | `anna-m3-closed.png` |

Oanvända filer: `anna-eyes-half.png`, `anna-eyes-closed.png`, `anna-blink-half.png`, `anna-blink-closed.png`

**v5.2 (3 sep 2026) — bildförladdning, fixar "blinkar inte i praktiken" (PR
#1326):** projektägaren rapporterade att Anna inte längre blinkade synligt
efter v5/v5.1, även i inkognitofönster (uteslöt cache som förklaring). Video
från mobil (Samsung Browser) bekräftade problemet kvantitativt: bildruteanalys
(opencv, `dark_frac`-metrik i ögonregionen, kalibrerad mot de statiska
sprite-filerna som gav en tydlig 34% nedgång open→closed) visade NOLL
detekterbar blinkvariation över 21 sekunder video. Samtidigt bekräftades att
(a) sprite-filerna på `main` faktiskt skiljer sig korrekt mellan
open/half/closed, och (b) JS-logiken i `AgentOverlay.js` är oförändrad sedan
långt innan denna sessions sprite-arbete (`git log`/`git diff` verifierat) —
alltså varken fel bilder eller trasig logik. Rotorsaken: `<img src>` byter
inte visning förrän NYA filen laddats+avkodats, `AnchorImage` förladdade
aldrig några frames, filerna är 620–644KB styck, och blink-states varar bara
80–120ms (halv→stängd→halv). Under kall cache (inkognito, mobilnät — exakt
scenariot i videon) hinner "closed"-framen ofta aldrig ritas upp innan
React redan gått vidare till nästa state. Fix: `usePreload(cfg)`-hook i
`AnchorImage` värmer webbläsarcachen för agentens samtliga frames
(`new Image().src = ...`) vid montering — långt innan första blinkförsöket
(1–3s fördröjning inbyggd i `useBlinkState`) och gott om marginal innan
efterföljande blinkningar (3–7s mellanrum). Gäller automatiskt både
`/nyhetskallor`s enskilda uppläsning och Studio-samtalet (båda återanvänder
samma delade `AnchorImage`-komponent). **Bekräftat av projektägaren i
produktion (3 sep 2026): blinkningen syns igen.**

**v5.3 (3 sep 2026) — två Codex-fynd på PR #1326, adresserade i efterhand:**
(1) `usePreload` startade bara hämtningen utan att invänta den — de första
blinkningarna (timern startar redan 1–3s efter montering) kunde fortfarande
träffa ofärdiga resurser på riktigt långsamma nät. `usePreload` returnerar nu
`ready` (sant först när samtliga frames triggat `onload`/`onerror`), och
`useBlinkState`s `active`-flagga är nu `cfg.hasBlink && ready` i både
`AgentOverlay` och `StudioOverlay` — blinkanimationen startar inte förrän
bildmaterialet faktiskt är laddat. (2) `mouthIdx` i `AnchorImage` växlar bara
mellan index 1 och 2 (`m === 1 ? 2 : 1`, startvärde 1) — index 0 syns bara i
viloläge och index 3 ("large") visas ALDRIG. `usePreload` laddade ändå ner
alla fyra munlägen per blink-state (12 filer, ~1,9MB för Anna + ~0,6MB extra
för Peter i Studion) — nu begränsat till `ANVANDA_MUNINDEX = [0,1,2]`, 9
filer, exakt det som animationen kan visa.

**v5.4 (3 sep 2026) — alla fyra munstorlekar tillbaka, viktad slumpvandring
istället för fast 1↔2-toggle:** projektägaren påpekade att v5.3s begränsning
till `[0,1,2]` byggde på ett skäl som inte längre gäller — den ursprungliga
1↔2-togglingen (kommentar hittad i `app/kanal/page.js`: "avoids jumping back
to m0 which shifts the head") kom från de äldre AI-genererade helbildsframen
(v1–v4) där huvudets position kunde skilja marginellt mellan frames. I v5s
lagerbaserade arkitektur delar SAMTLIGA tolv mun-/ögonkombinationer exakt
samma omutliga bas-canvas — 0 pixlars skillnad utanför den aktiva masken är
en garanti by construction, inte något som kan variera. `ANVANDA_MUNINDEX`
är nu `[0,1,2,3]` (alla fyra storlekar, 12 förladdade filer för Anna).
Togglingslogiken ersatt: `nastaMunIndex()` gör en viktad slumpvandring som
föredrar grannsteg (±1, vikt 5) framför större hopp (±2 vikt 2, ±3 vikt 1)
och aldrig upprepar samma index två gånger i rad — verifierat med en
200 000-iterationers simulering (0 upprepningar, 0 utanför intervallet,
~42% grannsteg / ~17-25% större hopp per riktning). Diskuterades även:
riktig ljudamplitud-styrd munstorlek är INTE möjlig utan att byta
TTS-lösning — `responsiveVoice.speak()` exponerar inget råljud till sidan
(bekräftat: ingen `AudioContext`/`AnalyserNode`/`getUserMedia` någonstans i
kodbasen), och `WaveformBar`s "amplitud" är redan idag helt påhittad
(`Math.random()`-baserad, ingen äkta ljuddata). Den viktade slumpvandringen
valdes som näst bästa lösning utan att kräva ny ljudinfrastruktur.
`app/kanal/page.js` har en egen, oberoende kopia av samma ursprungsmönster
(inte en delad komponent) och lämnades medvetet orörd — samma resonemang
skulle gälla där, men projektet har redan valt att inte röra KanalPage (se
"Ska INTE göras" ovan) utan explicit begäran.

**v5.5 (3 sep 2026) — Anna/Peter större på skärmen i `/nyhetskallor`-overlayerna:**
projektägaren skickade två skärminspelningar och påpekade att Anna syns för
lite, både i den enskilda uppläsningen och i Studio-samtalet. Mätt direkt i
video-pixelrymden (samma bildruteanalys-metod som blink-diagnosen): kortets
faktiska bredd var ~430px (solo) resp. ~638px (studio, ~320px per person) av
en ~1728px bred inspelning. Genom att jämföra mot de kända CSS-breddtaken
(`min(380px,92vw)` solo, `min(560px,94vw)` studio) gick det att räkna ut att
användarens enhet har en ovanligt bred CSS-viewport (~1527px — sannolikt en
Samsung-surfplatta i liggande/DeX-läge, inte en vanlig telefon), vilket
innebär att det var PX-TAKET (380/560) som styrde bredden hela tiden, inte
vw-andelen — höjer man taket blir kortet proportionerligt större på just den
här enhetens skärmtyp. Fix: `min(380px,92vw)` → `min(520px,94vw)` (solo),
`min(560px,94vw)` → `min(760px,96vw)` (studio) — ca 36–37% större kort på
breda skärmar, marginellt större även på vanliga telefoner (vw-andelen höjd
något också). En första version använde `calc(100vw - 40px)` istället för
vw-procent för att exakt respektera den 20px-paddingen på ytterlagret, men
det visade sig faktiskt bli MINDRE än originalet på smala telefoner (372px
mot ursprungliga 379px) — övergavs till förmån för den enklare vw-baserade
lösningen som matchar den redan existerande (och ofarliga) marginella
padding-överlappningen som fanns redan innan denna ändring.

**Nästa steg (enligt projektägaren):** samma lager-baserade arkitektur och
process planeras för Peter/Nationalekonom-karaktärens sprites.
