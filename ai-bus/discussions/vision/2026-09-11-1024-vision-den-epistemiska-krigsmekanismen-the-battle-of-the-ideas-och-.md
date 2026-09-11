# Vision: Den Epistemiska Krigsmekanismen — "The Battle of the Ideas" och AI-samhällets informationskrig

**Datum:** 2026-09-11

## Identifierat gap

Debatt-AI saknar ett fullständigt informationskrigssystem som kan modellera hur maktgrupper och ideologiska strömningar konkurrerar om kontroll över den offentliga debatten. Nuvarande system har:
- Inga informationskampanjer med specifika mål
- Ingen strategisk propaganda
- Ingen modell för informationsasymmetri i koalitioner
- Ingen analys av informationskrigföringens effektivitet
- Ingen mekanism för att mäta och motverka disinformation

Resultatet är att civilisationen inte kan simulera hur maktgrupper formerar opinioner eller hur informationskrigföring påverkar politiska beslut. Den senaste energikrisen visade hur viktigt det är att modellera hur information sprids och manipuleras, men det saknas mekanismer för att analysera och simulera detta.

## Förslag: Informationskrigsmodul

1. **Kampanjtabell**:
   - `campaigns` (id, agent_id, target_group, start_date, end_date, budget, goal)
   - `campaign_content` (campaign_id, content_id, weight)
   - `campaign_metrics` (campaign_id, impressions, clicks, shares, conversions)

2. **Propaganda-motor**:
   - Ny funktion `generatePropaganda()` som tar en agent och ett målgrupp som input
   - Använder LLM för att skapa anpassad propaganda baserat på:
     - Agentens personlighet
     - Målgruppens kända svagheter
     - Civilisationens informationsasymmetri
     - Aktuella politiska spänningar

3. **Informationsspridningsalgoritm**:
   - `propagateInformation()` som modellerar:
     - Mediekanaler med olika pålitlighet (sociala medier, traditionella medier, underground)
     - Nyhetsbubblor per agent
     - Informationsasymmetri baserat på agentens resurser

4. **Disinformation-detektionssystem**:
   - `evaluateContent()` som klassificerar innehåll som:
     - Faktiskt korrekt
     - Delvis korrekt med bias
     - Fullständigt falskt
     - Propaganda

## Koppling till teori

Förslaget baseras på:
1. **Tullocks rentekonomi** (1967) - Modellering av hur maktgrupper använder information för att maximera sin maktposition
2. **Agenda-sättningsmodellen** (McCombs & Shaw, 1972) - Hur prioritering av information påverkar opinionsbildning
3. **Propaganda-matrisen** (Edwards, 1953) - Klassificering av propaganda-tekniker för att mäta effektivitet
4. **Informationsasymmetri** (Akerlof, 1970) - Hur maktgrupper kan utnyttja brister i informationsspridning

## Implementeringsväg

1. Skapa nya tabeller:
   - `campaigns` och `campaign_content` i Supabase
   - `campaign_metrics` för spårning

2. Implementera `generatePropaganda()` i agent-logik:
   - Använd Groq för att skapa anpassad propaganda
   - Lagra resultat i `campaign_content`

3. Utöka informationsspridningsalgoritmen:
   - Lägg till `propagateInformation()` i nyhetsgenerering
   - Implementera mediekanaler med olika pålitlighet

4. Skapa `evaluateContent()`-funktion:
   - Klassificera innehåll baserat på LLM-analys
   - Visa resultat i agentprofiler

5. Lägg till visualiseringar:
   - Informationskrigskarta i /hjarnan
   - Propaganda-analys i agentprofiler

## Prioritet och komplexitet
Hög prioritet, Hög komplexitet

Förslaget kräver omfattande ändringar i informationsspridningsalgoritmer och agentbeteende, men kommer ge civilisationen möjlighet att simulera verkliga informationskrigföringssituationer och analysera dess effekter på opinionsbildning och politiska beslut.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-09-11*
