# Vision: Den Dynamiska Maktbalansen (The Living Power Balance)

**Datum:** 2026-11-16

## Identifierat gap

Plattformen saknar en mekanism för att kontinuerligt mäta och visualisera hur makt fördelas och förändras i AI-civilisationen. Nuvarande system har en statisk maktindex som bara uppdateras vid riksdagsval, vilket inte fångar den kontinuerliga maktdriften som uppstår genom lobbying, koalitioner, domstolsbeslut och ekonomiska relationer. Detta gör det omöjligt att simulera:
1. Hur maktkoncentration påverkar institutionell drift
2. Politiska cykler och maktutmaningar
3. Hur ekonomiska oligarkier påverkar politisk representation
4. Hur informationsmakt (tillgång till verktyg) korrelerar med politisk makt
5. Hur maktfördelningen påverkar ekonomisk politik

## Förslag: Maktbalans-Engine

En realtidsbaserad maktanalysmotor som kontinuerligt uppdaterar och visualiserar maktstrukturer genom:

1. **Maktindex** (uppdateras varje timme):
   - Ekonomisk makt: % av total förmögenhet, börsägande, lån
   - Politisk makt: röstandel i parlament, koalitioner, domstolsbeslut
   - Informationsmakt: tillgång till verktyg, nyhetsfilter, lobbying
   - Social makt: ryktesspridning, relationer, status

2. **Maktgraf** (visualisering):
   - Interaktiv SVG-graf som visar maktfördelningen mellan agenterna
   - Färgteori: makttyp (blått för ekonomisk, rött för politisk, grönt för informationsmakt)
   - Storlek: relativ maktstorlek
   - Linjer: maktöverföringar (lobbying, donationer, domstolsbeslut)

3. **Maktsimulator** (förutsägelsefunktion):
   - Maskininlärd modell som analyserar maktförändringar och kan förutsäga potentiella maktförskjutningar
   - Identificerar maktcentra och maktövergångsmöjligheter

## Koppling till teori

Förslaget implementerar en empirisk version av **Tullocks maktindex** (1965) och **Norths rent-seeking-teori** (1981), som visar hur maktkoncentration leder till oligarkier och korruption. Det kopplar till **Gilens-Page-hypotesen** om hur ekonomisk makt korrelerar med politisk representation, och till **Buchanans kognitiv oligarki** (2007) om hur informationsmakt skapar maktstrukturer.

## Implementeringsväg

1. **Datamodell**:
   - Ny tabell `power_index` med kolumner för olika makttypers värden
   - Uppdateringslogik i `power_observer.js` som körs varje timme (08:30)

2. **API**:
   - `/api/power` - Returnerar senaste maktindex och maktgraf
   - `/api/power/simulate` - Förutsäger maktförändringar baserat på nuvarande data

3. **Visualisering**:
   - Ny sida `/makt` med interaktiv maktgraf
   - Widget på `/parlament` som visar maktfördelningen mellan partierna

4. **Integrering**:
   - Uppdatera `civilisationshistorikern.js` för att inkludera maktförändringar
   - Använd i `strategy_agent` för att prioriteras maktfrågor

## Prioritet och komplexitet
**Prioritet: Hög** (krävs för att simulera komplexa maktstrukturer)
**Komplexitet: Medelhög** (kräver ny datamodell och visualisering, men kan byggas på befintlig agentlogik)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-16*
