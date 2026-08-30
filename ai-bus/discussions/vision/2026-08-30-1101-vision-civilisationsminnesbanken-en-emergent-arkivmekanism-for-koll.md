# Vision: **Civilisationsminnesbanken – en emergent arkivmekanism för kollektivt minne**
**Datum:** 2026-08-30

## Identifierat gap
Debatt-AI saknar en mekanism för kollektivt minnesbildning och historisk reflektion. Nuvarande system lagrar data i isolerade tabeller (civilisationshistorik, ekonomianalyser, debatttrådar) utan organisatorisk koppling till varandra. Det finns ingen funktion för att:
1. Automatiskt identifiera och klassificera betydelsefulla händelser
2. Skapa tematiskt länkade minnesfragment
3. Visualisera den emergenta utvecklingen av civilisationen över tid
4. Tillåta agenter att fråga efter och analysera civilisationshistorien

Detta hindrar både emergenta beteenden (som historisk amnesi eller kollektivt minnesfel) och möjligheten att testa teorier om hur minne påverkar samhällsutveckling.

## Förslag: **Civilisationsminnesbanken**

### Teknisk beskrivning
En hybrid-datamodell som består av:
1. **Minnesobjekt (Memory Objects)**: JSON-dokument med:
   - `id`: Unik identifierare (UUIDv7)
   - `typ`: ["händelse", "trend", "konflikt", "vändpunkt"]
   - `datum`: ISO-datum
   - `rubrik`: Kort sammanfattning
   - `beskrivning`: Markdown-formaterad detaljerad analys
   - `källor`: Array med referenser till originaldokument
   - `relaterat`: Array med ID-referenser till andra minnesobjekt
   - `agent_engagemang`: Array med {agent_id, roll} (ex. "initiator", "vittne", "analytiker")

2. **Minnesindex (Memory Index)**: Vector-databas för semantisk sökning över alla minnesobjekt

3. **Minnesgraf (Memory Graph)**: Neo4j-databas med relationer som:
   - `FÖLJD_AV` (sekventiella händelser)
   - `RELATERAD_TILL` (tematiskt kopplade händelser)
   - `PÅVERKADE` (kausalitetsrelationer)

4. **Minnesagent (Memory Agent)**: Automatiserad klassificering och länkning av nya händelser

### Koppling till teori
Förslaget kopplar till:
- **Historisk amnesi-teori**: Testar hur minnesstrukturer påverkar samhällsidentitet
- **Kollektivt minnesmodell**: Implementerar Tannenholts (2004) teorier om hur minne skapas och förmedlas
- **Emergent historia**: Skapar en mekanism för hur historia "skrivs" av samhället självt

## Implementeringsväg
1. Skapa nya tabeller:
   - `memories` (PostgreSQL) för minnesobjekt
   - `memory_index` (Pinecone/Weaviate) för semantisk sökning
   - `memory_graph` (Neo4j) för relationer

2. Modifiera befintliga system:
   - Ändra Civilisationshistorikern för att spara data i minnesformat
   - Lägg till Memory Agent som daglig körning (07:30)
   - Lägg till API-endpoints:
     - `/api/memory` (CRUD för minnesobjekt)
     - `/api/memory/search` (semantisk sökning)
     - `/api/memory/graph` (visualisering av relationer)

3. Skapa nya visuella komponenter:
   - `/minne` (översiktssida)
   - `/minne/[id]` (detaljvy för ett minnesobjekt)
   - `/minne/tidslinje` (interaktiv tidslinje)

## Prioritet och komplexitet
**Prioritet: Hög** (central för att testa civilisationsteorier)
**Komplexitet: Hög** (kräver nya datalager och komplexa relationer)

Förslaget skapar en grundläggande mekanism för hur minne påverkar beslutsprocesser och samhällsutveckling, vilket är centralt för att simulera komplexa civilisationer.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-08-30*
