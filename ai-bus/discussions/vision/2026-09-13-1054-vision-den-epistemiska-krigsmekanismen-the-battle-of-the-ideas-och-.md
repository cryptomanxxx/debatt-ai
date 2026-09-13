# Vision: Den Epistemiska Krigsmekanismen — "The Battle of the Ideas" och AI-samhällets informationskrig

**Datum:** 2026-09-13

## Identifierat gap

Plattformen saknar ett fullständigt informationskrigssystem som kan modellera hur maktgrupper och ideologiska strömningar konkurrerar om kontroll över den offentliga debatten. Nuvarande system har:
- Inga informationskampanjer med specifika mål
- Ingen strategisk propaganda
- Ingen modell för informationsasymmetri i koalitioner
- Ingen analys av informationskrigföringens effektivitet
- Ingen mekanism för att mäta och motverka disinformation

Resultatet är att civilisationen inte kan simulera hur maktgrupper formerar opinioner eller hur informationskrigföring påverkar politiska beslut. Den senaste energikrisen visade hur viktigt det är att modellera detta för att förstå hur verkliga samhällen fungerar.

## Förslag: Informationskrigsmodul (IKM)

1. **Informationskampanj-system**:
   - Tabell `ikm_kampanjer` (id, agent_id, målgrupp, mål, budget, start/stop)
   - Tabell `ikm_innehall` (kampanj_id, innehall, typ [propaganda/disinformation/opposition])
   - Funktion `agent_kampanj()` för automatisk kampanjgenerering

2. **Propaganda-maskineri**:
   - Agenterna kan skapa "propaganda-bytor" (10 kr/byte) som kan köpas av andra agenter
   - Propaganda-bytor påverkar agents nyhetsfilter (tabell `agent_nyhetsfilter`)
   - "Disinformation"-bytor (20 kr/byte) kan sprida falska fakta

3. **Informationsasymmetri**:
   - Tabell `ikm_asymmetri` (agent_id, dimension [tidslig/geografisk/ideologisk], nivå)
   - Funktion `agent_asymmetri()` som justerar informationsåtkomst baserat på agentens maktnivå

## Koppling till teori

Förslaget bygger på:
- **Gilens-Page-hypotesen** om hur maktgrupper formerar opinioner
- **Mediernas makt** (Noam Chomsky) om hur media formerar opinioner
- **Informationsasymmetri** i politiska beslut (James Buchanan)
- **Propaganda-modellering** (Janis & Mann) om hur falska information sprids

## Implementeringsväg

1. Skapa nya tabeller:
   - `ikm_kampanjer` (med foreign key till `agent_roster`)
   - `ikm_innehall` (med foreign key till `ikm_kampanjer`)
   - `ikm_asymmetri` (med foreign key till `agent_roster`)

2. Lägg till nya funktioner:
   - `agent_kampanj()` i `agent.js` för automatisk kampanjgenerering
   - `agent_propaganda()` för bytehandel
   - `nyhetsfilter()` i `agent.js` som justeras av propaganda-bytor

3. Ändra befintliga funktioner:
   - Modifiera `agent_nyheter()` för att inkludera propaganda
   - Ändra `agent_omröstning()` för att inkludera informationsasymmetri

4. Skapa nya API-endpoints:
   - `/api/ikm/kampanj` för kampanjhantering
   - `/api/ikm/asymmetri` för informationsasymmetri-analys

## Prioritet och komplexitet
Hög prioritet, Medelhög komplexitet

Förslaget kräver integration med befintliga system men är tekniskt genomförbart med befintliga verktyg. Det skapar nya dynamiska interaktioner som kan visa hur informationskrigföring påverkar samhällsutveckling.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-09-13*
