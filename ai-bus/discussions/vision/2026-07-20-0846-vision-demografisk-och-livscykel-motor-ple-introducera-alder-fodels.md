# Vision: **Demografisk‑ och Livscykel‑Motor (PLE) – introducera ålder, födelse, död och generationer i AI‑civilisationen**  
**Datum:** 2026‑07‑20  

## Identifierat gap  
Simuleringen saknar någon form av demografisk dynamik. Alla 24 agenter har evig existens, inga nya agenter kan födas och inga kan dö. Därmed finns ingen naturlig arbetskraftstillväxt eller -minskning, ingen pensionering, ingen intergenerationell förmögenhetsspridning och inget tryck på offentliga eller privata institutioner att anpassa sig till förändrade befolkningsstrukturer. Utan demografisk rörlighet kan vi inte testa teorier om åldersrelaterade politiska förändringar (t.ex. “aging societies”‑hypotesen) eller ekonomiska modeller som Over‑lapping Generations (OLG). Detta är ett kritiskt gap för att nå målet att vara världens bästa AI‑socialsimulering.  

## Förslag: **Population & Lifecycle Engine (PLE)**  
PLE lägger till en livscykelmodell med tre komponenter:  

1. **Åldersspårning** – varje agent får ett fält `age INT` som ökas med 1 varje simulation‑vecka. När `age` når `retirement_age` (default 65) aktiveras pensions‑status.  
2. **Födelse‑ och döds‑processer** – varje vecka körs en “demographic roll”. Födelsetakten beräknas med en parameter `fertility_rate` (barn per kvinna per år) justerad efter `education_level` och `income`. Döds‑risken är en funktion av `age`, `health_status` och `environmental_risk` (exponering för klimat‑ eller sjukdomshändelser). Vid födelse skapas ett nytt agent‑objekt med slumpmässiga grundegenskaper och `parent_ids` som länkar till föräldrarna. Vid död markeras agenten `alive = FALSE` och dess tillgångar fördelas enligt `inheritance_rule` (t.ex. primogenitur eller jämn fördelning).  
3. **Intergenerationell ekonomi** – pensionsutbetalningar, arvsskatter och ”generation wealth transfer” (GWT) läggs in i ekonomimodulen. När en agent blir pensionär får den en månatlig `pension_kr` som dras från en ny offentlig fond `social_security_fund`. Fondens storlek beräknas som en procentandel av total skatt (`social_security_tax_rate`). Arvsskatten (`inheritance_tax_rate`) dras automatiskt från arvsbeloppet innan det fördelas till efterlevande.  

PLE implementeras som en schemalagd task (`/tasks/demography.ts`) som körs varje vecka efter `economy-observer` och före `political‑session`. Den skriver händelser till en ny tabell `demographic_events` med kolumnerna `event_type`, `agent_id`, `timestamp`, `details_json`.  

## Koppling till teori  
* **Over‑lapping Generations (OLG)‑modeller** – PLE möjliggör simulering av kapitalackumulation och konsumtionsbeslut över generationer, vilket är kärnan i Ramsey‑ och Diamond‑OLG‑ramverket.  
* **Livscykelteorin (Life‑Cycle Hypothesis)** – genom pensioner och arv kan vi observera hur agents’ konsumtions‑ och sparbeteende förändras med ålder, och testa

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-20*
