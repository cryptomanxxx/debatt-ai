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

**v5.6 (3 sep 2026) — solo-croppen fixad (kapades vid hakan), skyddsnät mot
att popupen blir högre än skärmen:** v5.5 gjorde bara popup-fönstren
BREDARE, inte annat — men projektägaren rapporterade att bilden fortfarande
kapas: vid hakan i solo-läget, under axlarna i Studio. Simulerade CSS
`object-fit:cover`+`object-position:center top`-croppen exakt med PIL på de
faktiska sprite-filerna (`anna.png` 1024×1024, `nationalekonom.png`
1024×672) istället för att gissa. Bekräftat: solo-kortets `aspectRatio:
"4/3"` (liggande) på en fyrkantig, tajt beskuren källbild gav ett
matematiskt konstant croppat 25% av bildens underkant — munnen hamnade
bokstavligen i nederkant, ingen hals synlig, OBEROENDE av kortets
absoluta storlek (samma crop-andel fanns redan innan v5.5, blev bara mer
påtaglig när kortet blev större). Studio-per-person-rutans `aspectRatio:
"3/4"` (stående) gav i simuleringen en korrekt, ocroppad bild ner till
kavaj/krage för både Anna och Peter — inget crop-fel där enligt matematiken.
Fix: solo-kortets aspectRatio ändrad `4/3` → `3/4` (samma proportioner som
Studio) — verifierat visuellt att båda agenter nu visas ner till
kavaj/krage utan att hakan skärs av. Bieffekt av fixen: en `3/4`-ruta är
~78% högre än en `4/3`-ruta vid samma bredd, vilket ökar risken att hela
popupen (kort + textremsa + Stäng-knapp) blir högre än skärmens synliga
yta på kortare enheter — exakt den typ av "osynlig avklippning bortom
skärmkanten" som troligen redan drabbade Studio-läget (ingen `maxHeight`
eller `overflow`-hantering fanns någonstans innan denna fix, trots att
v5.5 gjorde båda overlayerna påtagligt större). Lades till som skyddsnät:
`overflowY: "auto"` på båda overlayernas yttre `position:fixed`-lager —
om innehållet någon gång blir högre än skärmen går det att scrolla istället
för att tyst försvinna utanför synfältet, utan att ändra något visuellt på
enheter där innehållet redan får plats. **Bekräftat av projektägaren i
produktion (3 sep 2026): ser bra ut.**

**v5.7 (3 sep 2026) — två Codex-fynd på PR #1330/#1331, adresserade i
efterhand:** (1) bekräftade konkret att den förstorade solo-/studio-rutan
kan bli högre än korta liggande viewports (t.ex. 844×390, 1024×600) —
samma risk jag redan misstänkt i v5.6, nu med konkreta exempel. (2) mer
allvarligt: `overflowY:"auto"`-skyddsnätet jag lade till i v5.6 löste INTE
problemet fullt ut — `alignItems:"center"` i kombination med `overflow`
är en känd CSS-fälla: innehåll som hamnar OVANFÖR den centrerade
positionen blir inte nåbart via scroll i många webbläsare (flexboxens
statiska centreringsalgoritm skapar ett "osynligt" överflödesområde som
`safe`-nyckelordet — inte brett stött ännu — specifikt uppfanns för att
lösa). Fix: bytte centreringsmetod till den vedertagna scroll-säkra
varianten — ytterlagrets `alignItems` ändrad `"center"` → `"flex-start"`,
och kortets egen `margin: "auto 0"` centrerar det vertikalt genom att
absorbera ledigt utrymme (samma visuella resultat när allt får plats),
men kollapsar till normalt boxflöde (top-startpunkt, fullt scrollbart)
när innehållet är högre än skärmen — till skillnad från
`alignItems:"center"` ger detta ALDRIG onåbart innehåll, oavsett
webbläsarens stöd för `safe center`.

**v5.8 (3 sep 2026) — lästexten synlig bredvid avataren i solo-läget:**
`AgentOverlay` (den enskilda "Anna/Peter läser"-uppläsningen) visade
tidigare aldrig den faktiska nyhetstexten som lästes upp — bara ljud, ingen
synlig text, till skillnad från `StudioOverlay` som redan visar den aktiva
repliken i en textremsa. Projektägaren föreslog att placera texten till
HÖGER om avataren i solo-läget (istället för under, som i Studio) eftersom
Studio redan använder bredden fullt ut (två avatarer sida vid sida) medan
solo-rutan (520px, `3/4`-proportioner sedan v5.6) lämnar gott om ledigt
utrymme åt sidorna på breda skärmar — att lägga texten under hade istället
gjort popupen ännu högre och återinfört risken från v5.6/v5.7.

Layout: en ny flex-rad (`flexWrap:"wrap"`) omsluter både den befintliga
avatarkolumnen (kort + Stäng-knapp, oförändrad) och en ny textpanel
(`min(320px,94vw)`, mörk bakgrund matchande kortstilen, `overflowY:"auto"`
för längre texter). Ingen fast brytpunkt — flexbox wrapar automatiskt ner
textpanelen under avataren på smala skärmar, samma "låt webbläsaren
avgöra"-mönster som bredd-/höjd-caparna i v5.5–v5.7. `margin:"auto 0"`
(scroll-säker centrering från v5.7) flyttades till den nya yttre raden så
hela raden (båda kolumnerna tillsammans) centreras och förblir scrollbar
som en enhet. Texten kommer från samma `lasning.text`-prop som redan
skickades in för TTS (`rubrik. beskrivning` från `NyhetskallorClient.js`)
— ingen ny datakälla behövdes, bara ny visning av befintlig data.

**Codex-fynd på PR #1334, adresserat i efterhand:** textpanelen
(`width:min(320px,94vw)` + `padding:16px` + `border:1px`) hade ingen
`boxSizing:"border-box"` — projektet saknar en global `box-sizing`-reset,
så padding+border adderas UTANPÅ den angivna bredden i standardläget
(`content-box`). Vid viewports smalare än ~354px CSS-px (t.ex. 320px)
blev panelens faktiska renderade bredd ~335px — bredare än skärmen,
vilket kunde orsaka horisontell scroll. Fix: `boxSizing:"border-box"`
tillagd på textpanelen. Samma exakta mönster (`width:"100%"` + padding +
border, utan border-box) fanns redan sedan tidigare på båda "⏹ Stäng"-
knapparna i `AgentOverlay.js` och `StudioOverlay.js` — fixade båda
proaktivt samtidigt eftersom det är identisk bugklass, inte bara det
enda Codex råkade flagga.

**Nästa steg (enligt projektägaren):** samma lager-baserade arkitektur och
process planeras för Peter/Nationalekonom-karaktärens sprites.

## Bildmappning för Peter/Nationalekonom (`/public/avatarer/podd/`)

**v5.9 (3 sep 2026) — Peter får mun- och blinkanimation, ny skäggfri
masterbild:** projektägaren + ChatGPT byggde ett helt nytt Peter-paket
("peter_animation_for_claude_code_v14") med samma lagerbaserade,
pixelstabila arkitektur som Anna v5 — men med en HELT NY masterbild
(1536×1229, tidigare skäggig 1024×672-bild ersatt). Anledning: det gamla
skägget var statiskt målat på originalbilden medan munlagret rörde sig
ovanpå, vilket gjorde att underläppen hamnade synligt UNDER det stilla
skägget vid tal. Den nya bilden är skäggfri och visar en bredare miljö
(bokhylla, ram på väggen, ljusare kontor) istället för den gamla tighta
mörka headshoten — en betydande visuell förändring, inte bara en
animationsförbättring.

**Paketets struktur skiljer sig från Annas:** istället för transparenta
RGBA-overlays som `alpha_composite`:as rakt av innehöll paketet ogenomskinliga
RGB-lager (`peter_mouth_small/medium/large.png`, `peter_eyes_half/closed.png`)
plus separata gråskale-alfamasker (`mouth_inner_blend_mask.png`,
`eye_mask_LOCKED.png`) som styr en mjuk blend: `resultat = bas×(1−mask) +
lager×mask`. Verifierat innan användning: samtliga fem lager skiljer sig
från basbilden UTESLUTANDE inom sin respektive masks gränser (0 pixlar
förändring utanför masken, per lager) — samma pixelstabilitetsgaranti som
Anna v5, fast med en annan kompositeringsmekanik. 12 kombinationer
genererade (4 munlägen × 3 ögonlägen, inkl. bas=stängd mun/öppna ögon) och
verifierade på samma sätt.

**Kända skuggartefakter — delvis åtgärdade:** paketet kom med en tredje
mask (`skin_restore_three_areas.png`) som markerade tre kvarvarande
skuggfel projektägaren/ChatGPT inte lyckats lösa: insidan av vänster öra,
insidan av höger öra (svagare), och en skugga vid näsroten nära vänster
öga. Verifierat att felen fanns redan i RÅ BASBILDEN (syns i `m0_open`,
som är pixelidentisk med `peter_base.png` — alltså inte en blend-artefakt
från kompositeringen). Ett första försök med `cv2.inpaint` (Telea)
misslyckades tydligt — algoritmen har ingen giltig källtextur att
rekonstruera ett helt öra från och suddade ut öronen till oigenkännlighet.
Övergick till en försiktigare, verifierat säker metod: lokal
skugg-mjukning — pixlar mörkare än ett kraftigt Gaussian-blurrat
lokalgenomsnitt dras mot det blurrade värdet (max 55% blandning), vilket
bevarar örats form och textur men jämnar ut den mörka fläcken. Tydlig,
synlig förbättring för båda öronen (jämfört före/efter i zoomade crops).
För näsa/öga-artefakten gav samma teknik ingen tydligt mätbar förändring
(artefakten verkar inte vara en enkel "mörkare än omgivningen"-skugga) —
en svagare, ovillkorad lokal blend applicerades där också som en säker men
osäker förbättring; kvarstår som en genuint olöst, väldigt subtil
kvarleva. Reparationen applicerades på basbilden EN gång, sedan
återgenererades alla 12 kombinationer därifrån — verifierat att inga
pixlar ändrades utanför de tre flaggade zonerna.

**Filer:** de fyra befintliga `nationalekonom(-small/-medium/-large).png`
ersattes med den nya bilden (samma filnamn, ny bildkälla). Åtta nya filer
tillkom: `nationalekonom-m{0-3}-half.png` och `nationalekonom-m{0-3}-closed.png`.
1024px bred (proportionerlig höjd 819px, ny bildproportion 1536:1229 ≈
1,25:1 — annorlunda än gamla 1024:672 ≈ 1,52:1). ~795KB/fil (större än
Annas ~620KB — mer detaljerad bakgrund komprimerar sämre).

**Kodändringar:** `AGENTER.Nationalekonom` i `AgentOverlay.js` fick
`hasBlink: true` + `mouthHalf`/`mouthClosed`/`idleHalf`/`idleClosed` —
samma fullständiga struktur som Anna. `StudioOverlay.js`s blink-villkor
var hårdkodat till `rolle.agent === "Anna"` — generaliserat till
`cfg.hasBlink` så Peter nu blinkar i Studio-samtalet också.

**Sidoeffekt att känna till:** `/podd/page.js` återanvänder samma fyra
`nationalekonom(-small/-medium/-large).png`-filer för sin egen
amplitud-styrda munanimation (`TalkingFace`) — ingen kodändring krävdes
där, men Peters nya utseende (ingen skägg, ny bakgrund) syns nu även på
`/podd`, inte bara `/nyhetskallor`. `/kanal` påverkas INTE — den sidans
`AnchorImage` är hårdkodad till bara Anna.

**Bekräftat av projektägaren i produktion (3 sep 2026): blinkningen
fungerar bra.**

---

## Uppläsningsfunktionen flyttad: /nyhetskallor → /nyhetsanalyser (3 sep 2026)

Projektägaren observerade att `/nyhetskallor` i praktiken är rå, ibland
maskinöversatt RSS-text, medan `/nyhetsanalyser` innehåller faktisk
agent-författad kommentar — och att Anna/Peters uppläsning hörde
tematiskt hemma på den senare, inte den förra. Efter diskussion (se
"Vad tycker du om..." i sessionshistoriken) flyttades funktionen rakt av:

- **Togs bort från `/nyhetskallor`:** `LASARE`-arrayen, `STUDIO_FARG`,
  `onLas`/`onStudio`-proppar på `NyhetsRad`, `lasning`/`studio`-state,
  och `<AgentOverlay>`/`<StudioOverlay>`-renderingen i
  `NyhetskallorClient.js`. "Fråga AI-agenter"-panelen (`AgentAnalysPanel`,
  separat feature) rördes INTE.
- **Tillagd på `/nyhetsanalyser`:** samma tre knappar (🎙️ Anna läser /
  📊 Peter läser / 🎭 Anna & Peter i studion) per analysrad i
  `app/nyhetsanalyser/page.js`. `AgentOverlay`/`StudioOverlay` importeras
  korsmapp från `app/nyhetskallor/` (komponentfilerna flyttades INTE —
  ingen anledning att röra filplatsen bara för att funktionen flyttar).
- **Vad som läses upp ändrades medvetet:** solo-uppläsningen läser nu
  `rubrik. analys` (agentens egen kommentartext) istället för
  `rubrik. beskrivning` (rå RSS-text) — det är hela poängen med flytten.
  Studio-samtalet genererar precis som förut ett NYTT Anna+Peter-samtal
  om den underliggande nyheten (via `/api/studio`, rubrik+beskrivning),
  oförändrad logik — bara omkopplad till att triggas från
  `nyhetsanalys`-radens länkade `nyhetsflode`-post istället för en
  `nyhetsflode`-rad direkt. `beskrivning`-fältet lades till i
  `nyhetsanalyser`s Supabase-select (`nyhetsflode(...,beskrivning)`) för
  att Studio ska ha samma kontext som förut.
- **`/api/studio/route.js`s toppkommentar uppdaterad** för att referera
  `/nyhetsanalyser` istället för den nu inaktuella `/nyhetskallor`.

Läs-knapparna gäller Anna/Peter oavsett vilken av de 24 agenterna som
skrev själva analysen (samma mönster som förut — en liten fast uppsättning
"uppläsarpersonas", inte kopplat till vem som "äger" texten), eftersom
`AgentOverlay`/`StudioOverlay` bara har röst/bildkonfiguration för Anna
och Nationalekonom.

---

## Nyhetskällor återinförda — Expressen + 10 gamla källor (3 sep 2026)

Projektägaren saknade Expressen på `/nyhetskallor` och frågade om fler
källor saknades. Kollade `nyheter.py`s faktiska `feeds`-lista mot vad
CLAUDE.md dokumenterar — betydande drift: Expressen, CoinDesk,
Cointelegraph, IGN, The Lancet, MDPI Healthcare, Nature, Science Alert,
Quanta Magazine, Amazon Science och Big Think fanns alla dokumenterade
men saknades helt i den faktiska koden (troligen borttagna vid någon
tidigare omarbetning, förmodligen när Reddit-grupperingen byggdes ut för
att komma runt 429-problem, utan att CLAUDE.md uppdaterades — `coindesk.com`
fanns kvar som en föräldralös post i rss-proxyns allowlist, ett spår av
detta). Projektägaren ville ha tillbaka alla ("Ju mer nyhetskällor vi har
ju bättre blir det").

**Återinfört (11 källor):**
| Källa | Kategori(er) |
|---|---|
| Expressen | sverige, samhälle |
| CoinDesk | krypto, ekonomi |
| Cointelegraph | krypto, ekonomi |
| IGN | spel |
| The Lancet | medicin, forskning |
| MDPI Healthcare | medicin, forskning |
| Nature | forskning, medicin |
| Science Alert | forskning |
| Quanta Magazine | forskning, ai |
| Amazon Science | ai, forskning, tech |
| Big Think | forskning, samhälle |

**Tre ställen ändrade** (alla tre krävdes — att bara lägga till i `feeds`
hade gett `403 Domän inte tillåten` för alla nya källor):
1. `nyheter.py` → `feeds`-listan i `hamta_nyheter()`: nya `(kalla, _p(url))`-rader
2. `nyheter.py` → `FEED_KATEGORIER`: en kategori-post per ny källa (annars
   faller den tillbaka på `["sverige"]` som standard, se `filtrera_feeds_for_agent()`,
   och hamnar fel i agenternas nyhetsbubblor)
3. `app/api/rss-proxy/route.js` → `TILLÅTNA_DOMÄNER`: proxyn (som kringgår
   GitHub Actions IP-block) har en explicit domän-allowlist av SSRF-skäl —
   nya domäner måste läggas till där oavsett vad `nyheter.py` gör

**Viktig brasklapp — RSS-URL:erna är INTE verifierade live.** Sandboxen
saknar generell internetåtkomst (bara en allowlistad proxy för verktygsanrop,
inte fria HTTP-anrop till godtyckliga nyhetssajter), så URL:erna är
skrivna utifrån tidigare kännedom om respektive sajts vanliga RSS-mönster,
inte testade mot de faktiska adresserna. Kodens befintliga felhantering
(`misslyckade`/`rss_stats` med per-källa ok/fel-status, `HTTP {status}`-
loggning) gör att en trasig URL failar tyst utan att krascha något — men
projektägaren bör kolla admin-panelens nyhetslogg eller `/nyhetskallor`s
källfilter efter nästa `Nyhetsflöde`-körning (var 4:e timme) för att se
vilka av de 11 nya källorna som faktiskt levererar och vilka som
behöver en URL-korrigering.

Verifierat isolerat (AST-parsning av `nyheter.py`): samtliga 11 nya
källor finns i `feeds`-listan OCH har en matchande `FEED_KATEGORIER`-post
(29 statiska feeds + 18 Reddit-grupper = 47 totalt, i linje med CLAUDE.md:s
tidigare "~44"-uppskattning). Verifierat att alla 11 nya URL:ers domäner
(efter www-strippning) matchar `rss-proxy`s allowlist-logik.
