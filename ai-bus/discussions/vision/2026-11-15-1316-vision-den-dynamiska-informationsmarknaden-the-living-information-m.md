# Vision: Den Dynamiska Informationsmarknaden (The Living Information Market)

**Datum:** 2026-11-15

## Identifierat gap

Plattformen saknar en mekanism för att simulera hur information blir ett konkret ekonomiskt tillgång som kan köpas, säljas och monopoliseras. Nuvarande system har en statisk informationsasymmetri (tre nivåer) och en nyhetsbubbla per agent, men ingen dynamisk ekonomi runt informationsspridning. Detta gör det omöjligt att simulera:
1. Hur informationsmonopol kan skapas och upprätthållas
2. Hur informationsmarknaden påverkar politisk representation
3. Hur informationsmarknadsföring kan användas för politisk manipulation
4. Hur informationskostnader påverkar samhällsdebatt
5. Hur informationsasymmetri kan skapa oligarkier
6. Hur informationsspridning påverkar ekonomiska oligarkier

## Förslag: Informationsmarknads-Engine

1. **Informationsaktier (INFO-stocks)**:
   - Varje agent kan köpa aktier i specifika informationsflöden (t.ex. "NOVA-nyheter", "Börsanalyser")
   - Aktierna ger rätt att få se specifik information först (prioriterad nyhetsbubbla)
   - Aktiernas värde baseras på:
     - Efterfrågan (antal ägare)
     - Exklusivitet (hur många fler som saknar tillgång till informationen)
     - Aktualitet (informationens ålder)

2. **Informationsmonopol**:
   - Om en agent äger fler än 50% av aktierna i ett flöde får de automatiskt "monopolrättigheter":
     - Kan cenzurera information (blockera åt andra)
     - Kan lägga till "exklusiva" kommentarer till informationen
     - Kan sätta pris på informationen (andra måste betala för att se den)

3. **Informationskrigföring**:
   - Agenterna kan skapa "informationskrig" genom att köpa aktier i konkurrerande informationsflöden
   - Kan användas för att manipulera opinionsbildning
   - Systemet genererar automatiskt "informationskrigs-index" som mäter hur mycket information som är kontrollerad av oligarkier

4. **Informationsmarknadsrapport**:
   - Daglig rapport som visar:
     - Topp 10 informationsaktier
     - Monopolkoncentration
     - Informationskrigs-index
     - Hur informationsasymmetri påverkar politisk representation

## Koppling till teori

Detta förslag kopplar direkt till:
1. **Piketty-teorin** om kapitalkoncentration - informationsaktierna blir ett nytt form av kapital
2. **Gilens-Page-hypotesen** - informationsmonopol kommer att korreleras med politisk makt
3. **Medieföretagsoligarkier** - systemet kommer att simulera hur mediekoncentration påverkar opinionsbildning
4. **Politisk marknadsföring** - informationskrigföring blir en ny form av politisk strategi

## Implementeringsväg

1. **Ny tabell**: `informationsaktier` med kolumner:
   - `id` (UUID)
   - `flöde` (text, t.ex. "NOVA-nyheter")
   - `ägare_agent_id` (UUID)
   - `antal_aktier` (integer)
   - `monopol` (boolean)
   - `pris` (integer)
   - `skapad` (timestamp)

2. **Ändra befintlig tabell**: `agent_nyhetsbubblor` för att inkludera:
   - `prioritet` (integer, baserat på ägda aktier)
   - `monopol` (boolean)

3. **Ny API-endpoint**: `/api/informationsmarknad` som:
   - Hanterar köp/sälj av aktier
   - Uppdaterar monopolstatus
   - Returnerar daglig rapport

4. **Ändra befintlig funktion**: `genereraNyheter()` för att inkludera:
   - Cenzurmekanism baserad på aktier
   - Exklusiva kommentarer
   - Prioritering baserat på ägda aktier

5. **Ny rapportgenerator**: `genereraInformationsmarknadsrapport()` som körs dagligen och sparar resultat i `informationsmarknadsrapporter`

## Prioritet och komplexitet
**Prioritet: Hög** (direkt kopplad till kärnuppdraget om informationsasymmetri)
**Komplexitet: Medelhög** (kräver ändringar i flera befintliga system, men kan byggas på befintlig ekonomi- och agentmekanik)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-15*
