# Vision: Den Epistemiska Krigsmekanismen 2.0 - "The Battle of the Ideas" och AI-samhällets informationskrig

**Datum:** 2026-09-15

## Identifierat gap

Debatt-AI saknar en fullständig modell för informationskrigföring som kan simulera hur maktgrupper och ideologiska strömningar konkurrerar om kontroll över den offentliga debatten. Nuvarande system har:
- Inga informationskampanjer med specifika mål
- Ingen strategisk propaganda
- Ingen modell för informationsasymmetri i koalitioner
- Ingen analys av informationskrigföringens effektivitet
- Ingen mekanism för att mäta och motverka disinformation

Resultatet är att civilisationen inte kan simulera hur maktgrupper formerar opinioner eller hur informationskrigföring påverkar politiska beslut. Den senaste energikrisen visade hur viktigt det är att modellera hur maktgrupper kan manipulera informationsflödet för att påverka beslutsfattande.

## Förslag: Informationskrigsmodul (IKM)

1. **Informationskampanjer** (ikm_kampanjer-tabell):
   - agent_id (FK till agents)
   - målgrupp (JSON-array med agent_id eller koalition_id)
   - strategi ('disinformation', 'propaganda', 'opinionforming')
   - start_datum, slut_datum
   - budget (kr för kampanjen)
   - effektivitet (0-1, dynamiskt uppdaterat)

2. **Propaganda-verktyg** (ikm_propaganda-tabell):
   - kampanjer_id
   - verktyg ('fake_news', 'social_media_ads', 'echo_chamber')
   - styrka (0-1)
   - kostnad_per_dag

3. **Informationsasymmetri-mätare** (ikm_asymmetri-tabell):
   - agent_id
   - informationsnivå (0-1)
   - access_nivå (0-1)
   - kognitiv_bias (0-1)

4. **Informationskrigsanalys** (ikm_analys-tabell):
   - datum
   - koalition_id
   - effektivitet (0-1)
   - påverkan_på_omröstningar (JSON-array)
   - kostnad

## Koppling till teori

Förslaget bygger på:
1. **Tullock's Laws of Organization** - Modellering av informationskrigföring som rent-seeking-aktivitet
2. **Staggen's Media Bias Theory** - Analys av hur olika informationsstrategier påverkar opinionsbildning
3. **Gilens-Page-hypotesen** - Utvärdering av informationskrigföringens effekt på politisk maktfördelning
4. **Brunner's Theory of Information Warfare** - Modellering av informationsasymmetri i maktstrukturer

## Implementeringsväg

1. Skapa nya tabeller:
   - ikm_kampanjer (agent_id, målgrupp, strategi, budget)
   - ikm_propaganda (kampanjer_id, verktyg, styrka)
   - ikm_asymmetri (agent_id, informationsnivå, access_nivå)
   - ikm_analys (datum, koalition_id, effektivitet)

2. Ändra befintliga funktioner:
   - Lägg till informationskrigs-parameter i agent_roster
   - Uppdatera omröstningslogik med informationsasymmetri-faktorer
   - Lägg till informationskrigsrapport i Civilisationshistorikern

3. Skapa nya API-endpoints:
   - POST /api/ikm/start_kampanj
   - GET /api/ikm/analys
   - GET /api/ikm/asymmetri/[agent_id]

4. Uppdatera befintliga endpoints:
   - Lägg till informationskrigsdata i /api/agent/[agent_id]
   - Lägg till informationskrigsrapporter i /api/civilisation

## Prioritet och komplexitet
Hög prioritet, Medelhög komplexitet

Förslaget kräver samarbete mellan ekonomimodulen (budgethantering), koalitionsmodulen (målgruppsdefinition) och debattmodulen (påverkan på beslutsfattande). Implementeringen bör ske i två faser: först grundläggande mekanismer, sedan avancerade analysfunktioner.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-09-15*
