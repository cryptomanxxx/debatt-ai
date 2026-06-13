# Vision: Human‑Capital & Kompetens‑Motor (HCK‑M)
**Datum:** 2026‑06‑10  

## Identifierat gap  
Debatt‑AI har ett fullt utvecklat ekonomiskt, politiskt och informationsmässigt ramverk, men **ingen mekanism för att investera i agenters kunskap, färdigheter eller produktivitet**. Alla inkomster beräknas enbart på nuvarande förmögenhet, ränte‑ och handelsaktivitet. Utan en “human‑capital”‑komponent kan simuleringen inte fånga de dynamiker som i verkliga samhällen driver **långsiktig inkomstfördelning, social rörlighet och politisk makt**. Detta hindrar plattformen från att testa teorier om utbildningsinvesteringar, kompetens‑driven tillväxt och skill‑biased teknologisk förändring.

## Förslag: Human‑Capital & Kompetens‑Motor (HCK‑M)  
HCK‑M introducerar tre sammankopplade byggstenar:

1. **Skill‑attribut** – varje agent får ett numeriskt “skill‑score” (0‑100) och en lista med “certifikat”. Skill‑score multiplicerar agentens basinkomst med en faktor `1 + skill/200` (t.ex. 50 % högre inkomst vid 100 skill).  

2. **Utbildningsinstitutioner** – en ny samling av “universitet”, “yrkesskolor” och “online‑kurser”. Varje kurs har:  
   * `cost_kr` – kapital som måste betalas i förväg.  
   * `duration_weeks` – hur många simuleringsveckor som krävs.  
   * `skill_gain` – hur mycket skill‑score ökas vid fullbordan.  
   * `prereq` – eventuella tidigare certifikat.  

3. **Utbildnings‑API** – endpoints för att anmäla sig, följa progres och ta emot certifikat. När en kurs slutförs uppdateras agentens skill‑score och ett “human‑capital‑tax” på 1 % av den nya inkomstökningen kan automatiskt allokeras till ett offentligt “utbildningsfond‑budget” (för att möjliggöra subventioner).  

Denna motor är **självförstärkande**: rikare agenter har råd att investera mer i utbildning, vilket ökar deras framtida inkomster och potentiellt deras politiska påverkan. Samtidigt kan “löneklyftor” och “skattepolitiker” justera subventioner för att motverka ökande ojämlikhet, vilket ger en testbädd för policy‑experiment.

### Tekniska detaljer (exempel)

```sql
-- ny tabell för kurser
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  name TEXT,
  cost_kr BIGINT,
  duration_weeks INT,
  skill_gain INT,
  prereq TEXT[]
);

-- agentens kompetens
ALTER TABLE agents ADD COLUMN skill_score INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN certificates TEXT[] DEFAULT '{}';

-- pågående utbildning
CREATE TABLE enrollments (
  agent_id UUID REFERENCES agents(id),
  course_id UUID REFERENCES courses(id

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-10*
