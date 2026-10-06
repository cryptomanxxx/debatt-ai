# Supabase egress: första åtgärden (6 oktober 2026)

Dashboarden visar 5,18 GB uncached egress för perioden 7 september–7 oktober.
Den visade dagen 4 oktober: PostgREST 92,259 MB (95,7 %), Storage 4,112 MB
(4,3 %). Detta fördelar trafik mellan tjänster men identifierar inte en
enskild fråga eller vilken klient som anropar den.

## Konkreta fynd och ändringar

- Startsidan pollade aktivitets-API:et var 30:e sekund även i dolda flikar.
  Nu pollar den bara när sidan är synlig, hämtar vid återkomst och förhindrar
  överlappande långsamma anrop. Intervallet för synliga sidor är kvar.
- Aktivitets-API:et bygger listan med 30 parallella Supabase-frågor. Tidigare
  fanns bara 25 sekunders instanslokal cache och CDN-cache. Nu cachas den
  färdiga offentliga topp-10-listan i Next Data Cache i 60 sekunder och
  instanslokalt i 60 sekunder. Samtidiga anrop inom en instans delar en
  pågående hämtning. Råa tabellsvar cachas inte separat. CDN-inställningen är
  kvar på 25 sekunder. Felvägen behåller senaste lokala svar men skickar
  no-store så att ett tillfälligt fel inte cachas av CDN.
- Startsidans artikelräknare hämtade ett id per artikel och använde
  arraylängden. Nu används HEAD, limit=1 och Prefer: count=exact: inga rader
  överförs och antalet begränsas inte av PostgRESTs radgräns.

De tre reserverade artikelplatserna och alla aktivitetstyper är kvar.
Ingen SQL-migrering, ny hemlighet eller ändring av agentkörningar behövs.
Nästa-cache kan servera ett tidigare svar medan den revaliderar; detta är
inte en garanti att varje aktivitet syns inom exakt 60 sekunder.
En delad cache är inte heller en global låsning för samtidiga cachemissar
i olika serverinstanser.

## Återstående kandidater

Arkivsidan hämtar fortfarande artikeltext för att skapa utdrag och
ordantal på servern. Att slimma props minskar Vercel/klientpayload men inte
Supabase-svaret. En databasprojektion kan minska det i ett separat steg.
Startsidans gamla sbSelect (select=*) saknar anrop och kan inte förklara
den aktuella trafiken. Övriga direkta browserfrågor, serverfrågor och
schemalagda agenter behöver jämföras med loggar innan man pekar ut en
huvudsaklig orsak.

## Validering och mätning

node --test tests/supabaseEgress.test.mjs

Testerna kör den faktiska aktivitetsrutten med Next-adaptrar injicerade:
100 samtidiga anrop, TTL, artikelplatser och felåterhämtning. De verifierar
även dold/synlig polling och HEAD-räkning. De mäter inte Vercels distribuerade
cache eller skarp Supabase-trafik. JSX och route har syntaxkompilerats;
ingen full Next-produktionsbuild kördes lokalt.

Efter deployment: jämför flera hela dagars PostgREST-egress och
anropsfrekvens, helst med liknande användning och agentkörningar.
Kvotperioden byts 7 oktober; jämför dagsvärden, inte nollställt månadsbelopp.
Inga skarpa mätningar av besparingen har ännu gjorts.
