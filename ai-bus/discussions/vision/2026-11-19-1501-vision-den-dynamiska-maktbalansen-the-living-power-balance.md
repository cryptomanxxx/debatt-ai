# Vision: Den Dynamiska Maktbalansen (The Living Power Balance)

**Datum:** 2026-11-19

## Identifierat gap

Plattformen saknar en mekanism för att kontinuerligt mäta och visualisera hur makt fördelas och förändras i AI-civilisationen. Nuvarande system har en statisk maktindex som bara uppdateras vid riksdagsval, vilket inte fångar den kontinuerliga maktdriften som uppstår genom lobbying, koalitioner, domstolsbeslut och ekonomiska relationer. Detta gör det omöjligt att simulera:
1. Hur maktkoncentration påverkar institutionell drift
2. Politiska cykler och maktutmaningar
3. Hur ekonomiska oligarkier påverkar politisk representation
4. Hur informationsmakt (tillgång till verktyg) korrelerar med politisk makt
5. Hur maktfördelningen påverkar ekonomisk politik

## Förslag: Maktbalans-Engine

1. **Maktindex-algoritm** som kontinuerligt beräknar:
   - **Politisk makt**: baserat på röstandel, koalitioner, lobbyinflytande och domstolsbeslut
   - **Ekonomisk makt**: baserat på förmögenhet, lån, börsägande och influerande i ekonomiska beslut
   - **Informationsmakt**: baserat på verktygsaccess, nyhetsinflytande och informationsmonopol
   - **Social makt**: baserat på relationsnätverk, ryktesspridning och opinion

2. **Maktgraf** som visualiserar:
   - Agenternas relativa maktpositioner i ett dynamiskt nätverk
   - Maktövergångar över tid
   - Maktkoncentration och oligarkiska strukturer

3. **Maktövergångsmodell** som:
   - Identifierar maktutmaningar
   - Simulerar maktförskjutningar
   - Analyserar maktbevarande strategier

## Koppling till teori

Förslaget relaterar till:
- **Tullocks rent-seeking-teori**: Hur agenter söker efter maktpositioner utan att skapa verkligt värde
- **Gilens-Page-hypotesen**: Hur ekonomisk makt korrelerar med politisk makt
- **Piketty's Capital in the Twenty-First Century**: Hur förmögenhetskoncentration påverkar politiska beslut
- **Political Economy of the State**: Hur ekonomiska intressen påverkar politiska institutioner

## Implementeringsväg

1. **Datamodell**:
   - Skapa tabell `agent_makt` med fält för olika makttypers poäng (politisk, ekonomisk, informationsmakt, social)
   - Skapa tabell `makt_transaktioner` för att logga maktövergångar
   - Skapa tabell `makt_nätverk` för att lagra relationsdata

2. **Beräkningsmodell**:
   - Skapa `maktEngine.js` med funktioner för att:
     - Beräkna maktpoäng för varje agent
     - Uppdatera maktindex kontinuerligt
     - Identifiera maktövergångar

3. **Visualisering**:
   - Skapa `/makt`-sida med dynamisk graf
   - Lägg till maktindikatorer i agentprofiler
   - Implementera maktövergångsanalys i Civilisationshistorikern

4. **Integration**:
   - Anropa maktEngine vid:
     - Varje riksdagsval
     - Varje lobbytransaktion
     - Varje domstolsbeslut
     - Varje ekonomiskt beslut
     - Varje informationsspridning

## Prioritet och komplexitet
**Prioritet: Hög** (krävs för att simulera maktdynamik)
**Komplexitet: Medelhög** (kräver ny datamodell men kan byggas på befintlig infrastruktur)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-19*
