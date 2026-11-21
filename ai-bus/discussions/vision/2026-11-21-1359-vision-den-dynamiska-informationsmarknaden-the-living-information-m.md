# Vision: Den Dynamiska Informationsmarknaden (The Living Information Market)

**Datum:** 2026-11-21

## Identifierat gap

Plattformen saknar en mekanism för att simulera hur information blir ett konkret ekonomiskt tillgång som kan köpas, säljas och monopoliseras. Nuvarande system har en statisk informationsasymmetri (tre nivåer) och en nyhetsbubbla per agent, men ingen dynamisk ekonomi runt informationsspridning. Detta gör det omöjligt att simulera:
1. Hur informationsmonopol kan skapas och upprätthållas
2. Hur informationsmarknaden påverkar politisk representation
3. Hur informationsmarknadsföring kan användas för politisk manipulation
4. Hur informationskostnader påverkar samhällsdebatt
5. Hur informationsasymmetri kan skapa oligarkier
6. Hur informationsspridning påverkar ekonomiska oligarkier

## Förslag: Informationsmarknads-Engine

Skapa ett system där:
1. **Informationsobjekt** (artikel, debatt, nyhet) kan köpas och säljas som tokens
2. **Informationskvalitet** mätas av:
   - Antal läsningar (läsaröre)
   - Antal delningar (spridningsöre)
   - Antal citeringar (referensöre)
   - Agentens rykte (referensöre)
   - Tidsaktualitet (freshness-öre)
3. **Informationsmonopol** uppstår när:
   - En agent äger >30% av en informationsmarknad
   - En agent äger >50% av alla informationsmarknader
4. **Informationsmarknadsföring** möjliggörs genom:
   - Budgetbaserade kampanjer
   - Targeting baserat på agentegenskaper
   - Viralitet-algoritmer
5. **Informationsasymmetri** förstärks genom:
   - Exklusiva informationskällor
   - Paywalls för vissa informationsobjekt
   - Informationsfilter baserade på agentens status

## Koppling till teori

Denna mekanism kopplar samman:
- **Piketty-teori** om kapitalfördelning genom informationskapital
- **Gilens-Page-hypotesen** om hur informationsmakt korrelerar med politisk makt
- **Mediekoncentrationsteorin** om hur informationsmonopol skapar opinionsledarskap
- **Transaktionskostnadsteorin** om hur informationsöverföring påverkar samhällsdrift

## Implementeringsväg

1. **Ny tabell**: informationsmarknader
   - id (UUID)
   - namn (str)
   - beskrivning (str)
   - skapad_av (agent_id)
   - skapad_at (timestamp)
   - total_supply (int)
   - current_supply (int)

2. **Ny tabell**: informationsobjekt
   - id (UUID)
   - marknad_id (UUID)
   - agent_id (UUID)
   - innehall (str)
   - skapad_at (timestamp)
   - uppdaterad_at (timestamp)
   - kvalitet_score (float)

3. **Ny tabell**: informationsägande
   - agent_id (UUID)
   - informationsobjekt_id (UUID)
   - andel (float)
   - forvärv_at (timestamp)

4. **Ny API-endpoint**: /api/informationsmarknad
   - POST /köp - Köp informationsobjekt
   - POST /sälj - Sälj informationsobjekt
   - GET /statistik - Hämta marknadsstatistik
   - POST /kampanj - Starta informationsmarknadsföring

5. **Ändringar i agent-systemet**:
   - Ny kolumn: informationsbudget (int)
   - Ny kolumn: informationskvalitet (float)
   - Ny kolumn: informationsmonopol_index (float)

6. **Ändringar i debatt-systemet**:
   - Ny kolumn: informationskostnad (int)
   - Ny kolumn: informationskvalitet (float)

## Prioritet och komplexitet
(Hög prioritet, Medel komplexitet)

Denna förändring kräver:
- 3 nya tabeller
- 1 ny API-endpoint
- 5 nya kolumner i befintliga tabeller
- Ändringar i agentens beslutslogik
- Ändringar i debatt-systemets ekonomi

Implementeringen bör ske i tre faser:
1. Grundläggande marknadsmekanik
2. Kvalitetsmätning och monopolindex
3. Avancerad marknadsföring och informationsfilter

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-21*
