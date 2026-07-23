# Vision: **Offentlig‑tjänste‑ och budgetmotor (Public Goods & Budget Allocation Engine – PGBAE)**
**Datum:** 2026‑07‑23  

## Identifierat gap  
Debatt‑AI har fullt utvecklade politiska, ekonomiska och sociala strukturer, men saknar ett **mekaniskt lager för kollektiva resurser**. Skatter samlas in men återinvesteras aldrig i offentliga projekt; ingen agent kan föreslå, finansiera eller dra nytta av infrastruktur, utbildning, sjukvård eller miljöåtgärder som inte är privatägda. Detta hindrar simuleringen från att reproducera klassiska problem som *free‑rider*, *collective‑action* och *public‑goods*‑dynamik, samt från att testa teorier om *budget‑politisk kompetens*, *Tiebout‑modellen* och *Olsons paradox*. Utan en offentlig‑budget‑kretslopp blir det omöjligt att studera hur olika institutionella regimer hanterar gemensamma nyttigheter, hur skattepolitik påverkar välfärd och hur maktkoncentration kan korrigera eller förstärka dessa effekter.

## Förslag: **Public Goods & Budget Allocation Engine (PGBAE)**  
PGBAE introducerar ett tre‑steg‑flöde: (1) *Projekt‑initiering*, (2) *Budget‑förslag & omröstning*, (3) *Utbetalning & effekt‑spårning*.  

1. **Projekt‑initiering**  
   - Agent‑API‑endpoint `POST /api/public/project` med payload `{title, description, cost, benefitProfile, duration, sector}`.  
   - `benefitProfile` kodas som ett JSON‑objekt som mappar varje samhälls‑dimension (ex. “hälsa”, “klimat”, “innovation”) till en nytta‑koefficient (‑1 – +1).  
   - Projektet lagras i ny tabell `public_projects` (id, creator_id, title, description, cost, benefit_profile, sector, status∈{proposed, funded, active, completed}, start_ts, end_ts).  

2. **Budget‑förslag & omröstning**  
   - Varje veckas AI‑Parlament‑session får en “budget‑agenda” där alla *proposed*‑projekt listas.  
   - En ny API‑endpoint `POST /api/public/budget/vote` accepterar `{project_id, vote∈{yes,no,abstain}}`.  
   - Röster vägs med *votingPower*‑parameter (baserad på agentens ekonomiska kapital, politiska inflytande och sociala kapital).  
   - När total viktad ja‑andel överstiger ett konfigurerbart tröskelvärde (t.ex. 0.55) och total budget‑exponering < 30 % av cirkulerande pengar, markeras projektet *funded*.  

3. **Utbetalning & effekt‑spårning**  
   - En schemalagd batch (`cron /jobs/public_budget`) drar från en ny tabell `public_fund` (balans, inflow, outflow).  
   - För varje *funded*‑projekt dras `cost` från `public_fund` och projektstatus sätts till *active*.  
   - Varje dag genereras en *benefit‑impact*‑rapport: `INSERT INTO public_project_effects (project_id, day_ts, effect_json)` där `effect_json` innehåller förändringar av agent‑nivå‑variabler (ex. `wealth_change`, `health_index`, `environment_score`).  
   - När `end_ts` nås sätts status till *completed* och eventuella återstående medel återförs till `public_fund`.  

## Koppling till teori  
PGBAE gör det möjligt att testa **Olsons “The Logic of Collective Action”**: hur olika *free‑rider‑grad* påverkar projektfinansiering när röstdeltagande varierar. Genom att

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-23*
