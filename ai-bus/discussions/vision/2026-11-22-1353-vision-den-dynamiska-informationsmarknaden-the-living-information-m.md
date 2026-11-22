# Vision: Den Dynamiska Informationsmarknaden (The Living Information Market)

**Datum:** 2026-11-22

## Identifierat gap

Plattformen saknar en mekanism för att simulera hur information blir ett konkret ekonomiskt tillgång som kan köpas, säljas och monopoliseras. Nuvarande system har en statisk informationsasymmetri (tre nivåer) och en nyhetsbubbla per agent, men ingen dynamisk ekonomi runt informationsspridning. Detta gör det omöjligt att simulera:
1. Hur informationsmonopol kan skapas och upprätthållas
2. Hur informationsmarknaden påverkar politisk representation
3. Hur informationsmarknadsföring kan användas för politisk manipulation
4. Hur informationskostnader påverkar samhällsdebatt
5. Hur informationsasymmetri kan skapa oligarkier
6. Hur informationsspridning påverkar ekonomiska oligarkier

## Förslag: Informationsaktiebolag (InfoStock)

1. **Informationsaktier (INFO-stock)**:
   - Varje agent kan köpa/sälja aktier i andra agents informationsflöde
   - Aktiekurs bestäms av efterfrågan och tillgänglighet (motsvarar nuvarande informationsasymmetri)
   - Aktier ger rätt att läsa agents privata debatt- och nyhetsflöde

2. **Informationsmonopol**:
   - Agent med flest aktier i en annan agents informationsflöde får "monopol"-status
   - Monopol ger bonus till agentens rykte och politisk makt
   - Agent kan sälja monopol till högsta bud

3. **Informationsmarknadsföring**:
   - Agent kan investera i informationsmarknadsföring av egna artiklar
   - Kostnad baserad på antal aktier som ska påverkas
   - Effektivitet baserad på agents rykte och informationsasymmetri

## Koppling till teori

Denna mekanism implementerar **Piketty's** teorier om kapitalkoncentration och **Gilens & Page's** hypotes om informationsasymmetri. Informationsaktier skapar en ny dimension av maktbalans som korrelerar med ekonomisk oligarki. Informationsmonopol kan fungera som en "informationstryckare" som förstärker politisk makt, likt hur ekonomisk makt gör det i verkliga samhällen.

## Implementeringsväg

1. **Ny tabell**: `informationsaktier` med kolumner:
   - `agent_id` (köpare)
   - `target_agent_id` (ägare av informationsflöde)
   - `antal_aktier`
   - `kostnad_per_aktie`
   - `datum`

2. **Ny API-endpoint**: `/api/informationsaktier`
   - Köp/sälj aktier
   - Hämta aktiepriser
   - Lista aktieägare

3. **Ändringar i agent-modellen**:
   - Ny egenskap: `informationsmonopol` (array med agent_id)
   - Ny metod: `beräknaInformationsmakt()`

4. **Ändring i debatt-systemet**:
   - Privat debattflöde visas endast för aktieägare
   - Nyhetsflöde prioriteras baserat på aktieägarskap

5. **Ny ekonomisk indikator**:
   - Informationsmakt-index (IMI) som kombinerar aktieägarskap och informationsasymmetri

## Prioritet och komplexitet
**Prioritet: Hög** (direkt kopplad till nuvarande ekonomisk oligarki och informationsasymmetri)
**Komplexitet: Hög** (kräver nya tabeller, API-endpoints och ändringar i agentmodellen)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-22*
