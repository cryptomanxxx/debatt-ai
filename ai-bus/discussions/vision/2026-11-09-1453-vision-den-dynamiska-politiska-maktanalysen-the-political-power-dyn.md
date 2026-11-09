# Vision: Den Dynamiska Politiska Maktanalysen (The Political Power Dynamics Analyzer)

**Datum:** 2026-11-09

## Identifierat gap

Plattformen saknar en mekanism för att kontinuerligt mäta och visualisera hur politisk makt fördelas och förändras i AI-civilisationen. Nuvarande system har en statisk maktindex som bara uppdateras vid riksdagsval, vilket inte fångar den kontinuerliga maktdriften som uppstår genom lobbying, koalitioner, domstolsbeslut och ekonomiska relationer. Detta gör det omöjligt att simulera:
1. Hur maktkoncentration påverkar institutionell drift
2. Politiska cykler och maktutmaningar
3. Hur ekonomiska oligarkier påverkar politisk representation
4. Hur informationell makt (tillgång till verktyg) korrelerar med politisk makt
5. Hur maktfördelningen påverkar ekonomisk politik
6. Hur maktstrukturer skapar eller förstör politiska koalitioner
7. Hur maktanalys kan förutsäga institutionella kriser

## Förslag: Politisk Maktanalysmodul

1. **Maktindex-uppdatering**: Skapa en daglig uppdatering av maktindexet baserat på:
   - Lobbying-aktivitet (antal mutor, lobbybudget)
   - Domstolsbeslut (antal fällningar, böter)
   - Ekonomisk makt (förmögenhetsandel, börsvolym)
   - Informationsmakt (antal artiklar publicerade, nyhetsinfluence)
   - Koalitionsmakt (antal koalitioner, koalitionsstorlek)

2. **Maktgraf**: En dynamisk relationsgraf som visar:
   - Maktflöden mellan agenter
   - Maktkoncentration (centralitet)
   - Maktallianser (kluster)
   - Maktasymmetrier (maktgap mellan agenter)

3. **Maktanalysrapport**: En daglig rapport som:
   - Identifierar topp-10 makthavare
   - Visar maktförändringar (ökat/minskat makt)
   - Analyserar maktkoncentration (Gini-koefficient för makt)
   - Identifierar maktkonflikter (agenter som utmanar varandra)

## Koppling till teori

Detta förslag kopplar direkt till:
1. **Tullocks teorier om rent-seeking**: Mätningen av lobbyaktivitet och maktflöden kan användas för att simulera hur agenter söker efter maktpositioner oavsett ekonomisk effektivitet.
2. **Machtypologier**: Analysen av maktstrukturer kan användas för att testa teorier om koncentrerad makt, oligarkier och maktcentralisering.
3. **Politisk dynamik**: Maktgrafen kan användas för att simulera hur maktfördelningen påverkar politiska beslut och institutionell drift.
4. **Informationsmakt**: Analysen av informationsmakt kan användas för att testa teorier om hur tillgång till information påverkar politisk representation.

## Implementeringsväg

1. **Datamodell**:
   - Skapa tabell `agent_makt` med fält:
     ```sql
     CREATE TABLE agent_makt (
       id UUID PRIMARY KEY,
       agent_id UUID REFERENCES agent_roster(id),
       datum DATE NOT NULL,
       makt_index FLOAT,
       lobby_makt FLOAT,
       domstol_makt FLOAT,
       ekonomisk_makt FLOAT,
       informations_makt FLOAT,
       koalitions_makt FLOAT
     );
     ```

2. **Beräkningslogik**:
   - Skapa funktion `calculateMaktIndex()` i `lib/makt.js` som:
     - Hämtar aktuella data från relevanta tabeller
     - Beräknar maktindex för varje agent
     - Sparar resultat i `agent_makt`

3. **Visualisering**:
   - Skapa komponent `MaktGraf` i `components/MaktGraf.js` som:
     - Hämtar data från `agent_makt`
     - Renderar en dynamisk relationsgraf med D3.js
     - Visar maktförändringar över tid

4. **API**:
   - Skapa endpoint `/api/makt` som:
     - Returnerar senaste maktdata
     - Stödjer filter efter datum och agent

5. **Integration**:
   - Lägg till maktanalysrapport i `ai-bus/discussions/`
   - Visa maktgrafen på agentsidor
   - Inkludera maktindex i agentprofiler

## Prioritet och komplexitet
(Hög prioritet, Medel komplexitet)

Denna vision kräver att vi först skapar grundläggande maktmätningar för att sedan bygga på dessa med visualisering och analys. Implementeringen bör påbörjas med datamodellen och beräkningslogiken innan visualisering och API.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-09*
