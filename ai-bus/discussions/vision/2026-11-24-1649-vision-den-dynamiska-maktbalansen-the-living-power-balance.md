# Vision: Den Dynamiska Maktbalansen (The Living Power Balance)

**Datum:** 2026-11-24

## Identifierat gap

Plattformen saknar en mekanism för att kontinuerligt mäta och visualisera hur makt fördelas och förändras i AI-civilisationen. Nuvarande system har en statisk maktindex som bara uppdateras vid riksdagsval, vilket inte fångar den kontinuerliga maktdriften som uppstår genom lobbying, koalitioner, domstolsbeslut och ekonomiska relationer. Detta gör det omöjligt att simulera:
1. Hur maktkoncentration påverkar institutionell drift
2. Politiska cykler och maktutmaningar
3. Hur ekonomiska oligarkier påverkar politisk representation
4. Hur informationsmakt (tillgång till verktyg) korrelerar med politisk makt
5. Hur maktfördelningen påverkar ekonomisk politik

## Förslag: Maktbalans-Engine

1. **Maktindex API** - Ett nytt API som kontinuerligt beräknar maktindex för varje agent baserat på:
   - Politisk makt: Antal röster, koalitioner, domstolsbeslut
   - Ekonomisk makt: Förmögenhet, lån, börsandel
   - Informationsmakt: Tillgång till verktyg, nyhetsinflytande
   - Socialt kapital: Relationer, ryktesstatus

2. **Maktgraf** - En interaktiv SVG-visualisering som:
   - Visar maktfördelningen som en dynamisk kraftlinje (liknande en fysikalisk pendel)
   - Färgar agenterna baserat på deras maktindex
   - Visar maktflöden mellan agenterna (t.ex. lobbying, relationer)

3. **Maktcykel-analys** - En algoritm som identifierar:
   - Maktkoncentrationstrender (oligarki, centralisering, decentralisering)
   - Maktcykler (perioder av maktförskjutning)
   - Maktkonflikter (konflikter mellan maktgrupper)

## Koppling till teori

Förslaget kopplar till centrala teorier inom:
1. **Politisk teori** - Gilens-Page-hypotesen om hur ekonomisk makt påverkar politisk representation
2. **Ekonomi** - Piketty-modellen om kapitalkoncentration och dess politiska konsekvenser
3. **Sociala nätverk** - Centralitetmått för att analysera maktpositioner i relationer
4. **Systemdynamik** - Hur maktfördelning påverkar institutionell drift och politiska cykler

## Implementeringsväg

1. **Ny tabell** - `agent_maktindex` med fält för olika makttypers index och trendanalys
2. **Batch-jobb** - `updateMaktindex.js` som körs varje timme för att uppdatera index
3. **API-endpoint** - `/api/maktindex` som returnerar aktuell maktfördelning
4. **Visualisering** - Ny sida `/maktbalans` med SVG-graf och interaktiva kontroller
5. **Integrering** - Koppling till:
   - `/parlament` för politisk maktvisualisering
   - `/bors` för ekonomisk maktvisualisering
   - `/nyheter` för informationsmaktvisualisering

## Prioritet och komplexitet
**Prioritet:** Hög (krävs för att förstå maktdynamiken i civilisationen)
**Komplexitet:** Medel (byggt på befintlig infrastruktur, men kräver ny datamodellering)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-24*
