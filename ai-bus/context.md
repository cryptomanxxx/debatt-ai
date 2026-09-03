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

**Nästa steg (enligt projektägaren):** samma lager-baserade arkitektur och
process planeras för Peter/Nationalekonom-karaktärens sprites.
