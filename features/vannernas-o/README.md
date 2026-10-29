# Vännernas ö

Debatt-AI:s fristående 3D-värld med åtta AI-vänner, svenska/engelska,
vattenhjulsuppdrag och skattjakt. Entrén `/vannernas-o` leder till den
versionerade statiska sidan `/vannernas-o/v1/index.html`.

## Utveckling och kontroll

```sh
npm ci --prefix features/vannernas-o
npm run build --prefix features/vannernas-o
npm test --prefix features/vannernas-o
npm run build
```

Källkod finns i `web/`; byggskriptet paketerar Three.js och sidans moduler i
`public/vannernas-o/v1/index.html`. Modell- och ljudanalysfiler serveras separat
från samma versionerade katalog. Checka in det genererade resultatet efter ändringar.
De åtta GLB-filerna är de aktuella riggade figurerna, inte tidigare Rufus-modeller.
Utvecklingsmenyn ”Animation och modellprov” finns inte i den publika kopian.

## Serverinställningar före driftsättning

Next.js-rutterna `/api/vannernas-o/status` och `/api/vannernas-o/session` använder:

- `DEBATT_AI_ANIMAL_ZOO_GEMINI_API_KEY`: endast servern. Använd den separata
  Google AI Studio-nyckeln med visningsnamnet ”Debatt-AI Animal Zoo”.
  Ingen fallback till webbplatsens generella `GEMINI_API_KEY` görs. Måste ha tillgång till `gemini-3.8-live`
  och Googles `v1beta/auth_tokens`.
- `TURNSTILE_SECRET_KEY` och `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: webbplatsens
  befintliga Cloudflare Turnstile-nycklar. Tillåt produktionsdomänen och
  eventuell Vercel-förhandsvisningsdomän i widgetens inställningar.

Inga hemligheter eller ChatGPT Sites-behörigheter kopieras. Om någon inställning
saknas är ön fortfarande tillgänglig, men AI-samtal är avstängda med ett meddelande.
Turnstile verifieras före varje ny session, med hostname och action
`friends_island_voice`. Därefter får webbläsaren en engångstoken med 45 sekunder
att öppna anslutningen och 30 minuters teknisk giltighet. Ljud och text går direkt
till Gemini via WebSocket. Servernyckeln når aldrig webbläsaren.

Fem samtidiga personer är inte ett applikationstak. Aktiva samtal kan pågå längre
än tre minuter; efter 90 sekunders inaktivitet visas en fråga och efter 120 sekunder
avslutas samtalet. Google kan fortfarande neka anslutningar vid sin kvotgräns.
Turnstile är botskydd, inte en garanti för en budget eller obegränsad kapacitet.

Framsteg och samtalsloggen hålls i flikens minne. Endast språkval sparas lokalt.
Ingen serverlagring av samtal introduceras. Se sidans befintliga information om
Googles/webbläsarens behandling av ljud och text.

## Kontroll i Vercels PR-förhandsvisning

1. Följ startsidans nya banner, kontrollera mobilmenyn och alla åtta besök.
2. Kontrollera svenska/engelska, hälsningar, blink och munrörelser under ett
   riktigt samtal. Lokal automatiserad kontroll ersätter inte mikrofon/GPU-test.
3. Slutför vattenhjulets steg med tal och kontrollera att nästa besöksknapp visas.
4. Ange testkoden `28942137`: kameran ska hinna fram före lock, fanfar och fyrverkerier.
5. Kontrollera Turnstile, ett längre aktivt samtal och avstängning efter inaktivitet.

## Proveniens och licenser

Importerad från den av ägaren angivna Vännernas ö-prototypen, källrevision
`5175ba677cd7d9830c8c0bb77099d6c2b3d86855`. Figurernas GLB-filer är byteidentiska
med denna revision. Referensbilderna till figurerna lämnades av ägaren och
omvandlades via to3D/Qubico, därefter riggades och animerades de i projektet.
Ingen rättighetslicens för andra än projektägaren införs genom denna import.

Three.js (MIT) bundlas med sin licenskommentar. HeadAudio används för analys av
uppspelat AI-tal: https://github.com/met4citizen/HeadAudio,
revision `c6d8af35034068b1c98dcc0fa3ec9602d711e784`. MIT-licensen finns i
`web/rufus/vendor/headaudio/LICENSE` samt vid de publika ljudmodulerna.
Webbläsarens AudioWorklet och riktig Gemini-anslutning behöver testas på en enhet.

## Gemini-tokenformat och felsökning

REST-anropet använder `bidiGenerateContentSetup`, med `generationConfig` och
servervald röst. SDK-fälten `liveConnectConstraints`/`config` får inte skickas
direkt till REST-API:t. `fieldMask: "model,generationConfig"` låser modell,
ljudsvar och röst; övriga fält kan sättas av klienten, inklusive uppdragsverktyg,
systeminstruktioner och återanslutningens `sessionResumption.handle`.
Ingen fallback till obegränsade token införs.

Testfixturen `tests/fixtures/gemini-token-sdk-2.31.0.json` fångades genom
`@google/genai@2.31.0` med falsk nyckel och mockad fetch. Den visar SDK:ns
faktiska REST-serialisering, utan något anrop till Google. Fältmasken
sätts separat till två toppnivåfält så att alla övriga klientfält förblir fria.
Primärkällor:
- https://github.com/googleapis/js-genai/blob/main/src/tokens.ts
- https://github.com/googleapis/js-genai/blob/main/src/converters/_tokens_converters.ts
- https://ai.google.dev/api/generate-content#AuthToken

Vid ett avvisat Google-anrop loggas `island_gemini_token_rejected` med HTTP-status
och fasta, tillåtna felkoder/orsakskoder. Samma säkra diagnos visas i svaret.
Googles fria feltext, metadata, API-nycklar och samtal loggas aldrig här.
