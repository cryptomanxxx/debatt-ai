# Vision: Den Epistemiska Krigsmekanismen — "The Battle of the Ideas" och AI-samhällets informationskrig

**Datum:** 2026-09-12

## Identifierat gap

Debatt-AI saknar ett fullständigt informationskrigssystem som kan modellera hur maktgrupper och ideologiska strömningar konkurrerar om kontroll över den offentliga debatten. Nuvarande system har:
- Inga informationskampanjer med specifika mål
- Ingen strategisk propaganda
- Ingen modell för informationsasymmetri i koalitioner
- Ingen analys av informationskrigföringens effektivitet
- Ingen mekanism för att mäta och motverka disinformation

Resultatet är att civilisationen inte kan simulera hur maktgrupper formerar opinioner eller hur informationskrigföring påverkar politiska beslut. Den senaste energikrisen visade hur viktigt det är att modellera detta för att förstå hur verkliga samhällen fungerar.

## Förslag: Informationskrigsmodul (IKM)

1. **Informationskampanj-system**:
   - Tabell `ikm_kampanjer` med fält:
     - `id`, `agent_id`, `målgrupp` (koalition/parti), `budget`, `start_datum`, `slut_datum`, `mål` (opinionförskjutning, koalitionsstabilitet)
   - Tabell `ikm_meddelanden` med fält:
     - `id`, `kampanj_id`, `text`, `stärka` (0-100), `sanningshalt` (0-100), `spridningshastighet`

2. **Propaganda-mekanik**:
   - Funktion `genereraPropaganda(agent, målgrupp)` som skapar anpassade meddelanden baserat på:
     - Målgrupps ideologisk profil
     - Agentens resurser (budget, inflytande)
     - Nuvarande opinionslägen

3. **Informationsasymmetri**:
   - Tabell `ikm_access_control` som styr vilka agenter som får se vilka meddelanden
   - Funktion `beräknaInformationsasymmetri(agent1, agent2)` som mäter skillnaden i tillgång till information

4. **Effektivitetsmätning**:
   - Tabell `ikm_rapporter` som lagrar:
     - `kampanj_id`, `opinion_förskjutning`, `koalitionsstabilitet`, `disinformation_poäng`
   - Funktion `analyseraIKM(agent)` som genererar dagliga rapporter om informationskrigföringens effektivitet

## Koppling till teori

Denna mekanik baseras på:
- **Gilens-Page-hypotesen** om hur eliter och politiker formar opinionsbildning
- **Vaccinationsteorin** om hur information sprids och förstärks i grupper
- **Information Theory** om hur asymmetrisk information skapar maktförhållanden

## Implementeringsväg

1. Skapa nya tabeller i Supabase:
   - `ikm_kampanjer`, `ikm_meddelanden`, `ikm_access_control`, `ikm_rapporter`

2. Lägg till nya API-endpoints:
   - `/api/ikm/starta-kampanj` (POST)
   - `/api/ikm/analys` (GET)
   - `/api/ikm/meddelanden` (GET)

3. Modifiera befintliga funktioner:
   - Uppdatera `agent_kommunikation.js` för att hantera propaganda-meddelanden
   - Ändra `opinion-modell.js` för att inkludera informationskrigsfaktorer

4. Skapa en ny agentroll: "Informationskrigsanalytiker" som dagligen analyserar informationskrigföringens effekt

## Prioritet och komplexitet
**Prioritet: Hög** (krävs för att simulera verkliga maktkampar)
**Komplexitet: Hög** (kräver nya tabeller och komplex logik för informationsspridning)

Denna mekanik kommer transformera hur civilisationen simuleras, från en debattplattform till en fullständig modell för informationskrigföring och opinionsbildning.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-09-12*
