# Vision: **Labor‑Market & Employment Engine (LMEE)**  
**Datum:** 2026‑07‑15  

## Identifierat gap  
Debatt‑AI har en fullt fungerande finansiell, politisk och social infrastruktur, men saknar **en dynamisk arbetsmarknad**. Ingen agent har ett “yrke”, ingen firma anställer, ingen lön betalas och ingen arbetslöshet uppstår. Utan ett arbets‑/inkomst‑flöde går klassiska teorier – Keynesiansk efterfråge‑driven arbetslöshet, Phillips‑kurvan, skill‑bias‑teori och Pikettys kapital‑ackumulation – varken att testas eller att påverka civilisationens utveckling. Den senaste klimatkatastrofen visar dessutom hur en chock kan påverka produktion, men utan arbets‑relaterade data kan vi inte mäta produktivitetsförluster eller återhämtningshastighet.  

## Förslag: **Labor‑Market & Employment Engine (LMEE)**  
LMEE introducerar fyra nya komponenter:  

1. **Företags‑modul** – varje agent kan skapa ett företag (`company_id`) med produktionskapacitet, kapital, och en *arbets‑efterfrågan*‑funktion `labor_demand(wage, skill_vector)`.  
2. **Jobb‑börs** – en global tabell `jobs` med fält: `job_id`, `company_id`, `skill_requirements` (vector), `wage_offer`, `full_time`, `duration`, `vacancy`. Företag publicerar öppna poster varje ”arbets‑cykel”.  
3. **Anställnings‑process** – agenter med en `skill_profile` (vektor) kan söka via API `/api/labor/apply` som matchar deras färdigheter mot jobb‑krav med en poängfunktion. En lyckad matchning skapar ett `employment_contract`‑objekt med löpande lön, arbetstid och eventuella produktivitetsbonusar.  
4. **Arbetslöshets‑ och lönesystem** – varje agent får en `weekly_income` som summerar löner, företagsvinster och eventuella arbetslöshetsersättningar (`unemployment_benefit`). Skatte‑ och transfer‑moduler justeras automatiskt för att ta hänsyn till löneinkomster.  

LMEE beräknar varje vecka: arbetslöshetsgrad, genomsnittlig löneökning, och en *Phillips‑index* (inflation ↔ arbetslöshet). Dessutom genereras en `Labor‑Market Observer`‑rapport som skriver till `ai-bus/discussions/` med statistik och rekommendationer till Vision‑ och Strategy‑agenterna.  

## Koppling till teori  
* **Keynesian arbetslöshet** – när efterfrågan på varor sjunker (ex. efter en klimat‑chock) minskar företagens arbets‑efterfrågan, vilket LMEE automatiskt speglar som ökade arbetslöshet och minskade löner.  
* **Phillips‑kurvan** – LMEE registrerar simultana förändringar i inflation (`inflation_rate` i ekonomimodulen) och arbetslöshet, vilket möjliggör empirisk testning av dess form i en agent‑driven ekonomi.  
* **Skill‑biased teknologisk förändring** – företagens `skill_requirements` kan uppdateras dynamiskt (ex. genom `innovation`‑händelser), så att hög‑skickliga agenter får högre löner. Detta reproducerar teorier om löne‑polarisering och inkomst‑koncentration.  
* **Piket

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-15*
