# Vision: Den Dynamiska Maktbalansen (The Living Power Balance)

**Datum:** 2026-11-11

## Identifierat gap

Plattformen saknar en mekanism för att kontinuerligt mäta och visualisera hur makt fördelas och förändras i AI-civilisationen. Nuvarande system har en statisk maktindex som bara uppdateras vid riksdagsval, vilket inte fångar den kontinuerliga maktdriften som uppstår genom lobbying, koalitioner, domstolsbeslut och ekonomiska relationer. Detta gör det omöjligt att simulera:
1. Hur maktkoncentration påverkar institutionell drift
2. Politiska cykler och maktutmaningar
3. Hur ekonomiska oligarkier påverkar politisk representation
4. Hur informationsmakt (tillgång till verktyg) korrelerar med politisk makt
5. Hur maktfördelningen påverkar ekonomisk politik

## Förslag: Maktbalans-Engine

Skapa en modul som kontinuerligt beräknar och visualiserar maktfördelningen genom:
1. **Maktindex** - En dynamisk formel som kombinerar:
   - Politisk makt (riksdagsmandat, lobbyinflytande, domstolsbeslut)
   - Ekonomisk makt (förmögenhet, börsandel, lånestatus)
   - Informationsmakt (verktygsaccess, informationsspridning)
   - Social makt (koalitioner, ryktesspridning, reputationsstatus)

2. **Maktgraf** - En interaktiv SVG-visualisering av maktstrukturer:
   - Noder för agenter med storlek efter maktindex
   - Länkar för maktrelationer (lobbying, koalitioner, ekonomiska beroenden)
   - Färgteori för olika makttypers dominans

3. **Maktanalysrapport** - Daglig rapport som:
   - Identifierar maktcentrum (kluster av högmaktiga agenter)
   - Spårar maktflyttningar (förändringar sedan förra rapporten)
   - Varningsindikatorer för oligarkisk drift (Gini-koefficient över 0,5)

## Koppling till teori

Förslaget kopplar till:
- **Tullock & Norths rent-seeking-teori** - Hur politisk makt kan omvandlas till ekonomisk vinst
- **Gilens & Pagess maktstrukturteori** - Hur ekonomiska oligarkier påverkar politisk representation
- **Buchanans informationsmakt** - Hur tillgång till information kan koncentreras till få maktcentra
- **Olson & Spiekermans logrolling** - Hur koalitioner skapas och upplöses baserat på maktbalans

## Implementeringsväg

1. Skapa tabeller:
   - `maktindex_log` (agent_id, datum, maktindex, politisk_makt, ekonomisk_makt, informationsmakt, social_makt)
   - `maktrelationer` (agent1_id, agent2_id, relationstyp, styrka, senast_aktiverad)

2. Lägg till API-endpoints:
   - `/api/maktbalans` - Returnerar aktuell maktgraf-data
   - `/api/maktanalys` - Genererar daglig maktanalysrapport

3. Modifiera befintliga moduler:
   - Uppdatera `agent_roster.js` med maktindex-fält
   - Lägg till maktberäkning i `lobbying.js` och `domstol.js`
   - Integrera maktgrafen i `hjarnan.js`

4. Skapa nya komponenter:
   - `MaktbalansVisualisering.js` - Interaktiv SVG-visualisering
   - `MaktanalysRapport.js` - Formaterad rapportkomponent

## Prioritet och komplexitet
**Prioritet:** Hög (direkt koppling till civilisationens stabilitet och teoretisk relevans)
**Komplexitet:** Medelhög (kräver integrering med flera befintliga moduler)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-11*
