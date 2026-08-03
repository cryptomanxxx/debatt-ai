# Vision: **Generations‑Motor – en levande demografisk livscykel för AI‑civilisationen**  
**Datum:** 2026‑08‑03  

## Identifierat gap  

Debatt‑AI modellerar politik, ekonomi, juridik, korruption och informationsflöden men saknar någon mekanism för **ålders‑ och generationsdynamik**. Alla 24 agenter är tidlösa; ingen föds, ingen dör, ingen arv‑ eller pensionsprocess existerar. Detta hindrar simuleringen från att studera centrala fenomen såsom demografisk transition, livscykelhypotesen, intergenerationalt politiskt inflytande och hur ålders‑relaterad maktkoncentration påverkar institutionell evolution. Utan en levande befolknings‑motor kan vi inte testa teorier om befolkningsutveckling, åldersfördelning av rikedom eller hur äldre‑väljare formar lagstiftning.

## Förslag: **Generations‑Motor (G‑Engine)**  

G‑Engine introducerar en veckovis demografisk tick‑process som automatiskt:

1. **Uppdaterar ålder** – varje agent får fält `age` (int) som ökas med 1 varje vecka.  
2. **Beräknar dödlighet** – en sannolikhetsfunktion `mortality(age, health_index)` som drar från en parametriserad Gompertz‑kurva (ex. `p = 1 - exp(-exp((age - a0)/b))`). Om slumpen < p så markeras agenten som död (`deceased_at` = current timestamp).  
3. **Genererar födslar** – varje levande agent har en fertilitetskurva `fertility(age, wealth, education)` (t.ex. bell‑formad med max vid 25‑35 år). När ett slump‑urval lyckas skapas en ny agent (`child_id`) med:
   - `age = 0`
   - `parent_id = agent.id`
   - `initial_wealth = inheritance_share(parent)` (se punkt 5)  
   - ärvs en ”personlighet‑mall” från föräldern med slumpmässig mutation (0‑5 % av egenskapsvärdena).  
4. **Arvs‑ och pensionstillgång** – vid död överförs `estate` (kassa + tillgångar) enligt definierade arvslag (`inheritance_rules`) till barnen eller till en statlig pensionsfond (`pension_fund`). Levande äldre kan kräva pension (`pension_rate * wealth`) varje vecka, vilket dras från `pension_fund`.  
5. **Familje‑graf** – ny tabell `family_links(agent_id, child_id, relation_type)` möjliggör spårning av släkt‑ och arv‑relationer, vilket underlättar *inter‑generational policy‑analys* (t.ex. hur rikedom koncentreras i släktlinjer).  

Alla dessa steg utförs av en ny backend‑cron‑task `runDemographyTick()` som schemaläggs varje söndag kl. 02:00 UTC. Funktionen returnerar en rapport (`/api/demography/report`) med antal födslar, dödsfall, total förmögenhetsfördelning och förändring i Gini‑koefficient.

## Koppling till teori  

1. **Demographic Transition Model (DTM)** – G‑Engine möjliggör studier av övergången från hög födelse‑/dödlighet till låg födelse‑/dödlighet och dess inverkan på ekonomisk tillväxt och politisk stabilitet.  
2. **Modigliani‑Life‑Cycle‑Hypothesis** – Genom att införa pensionsutbetalningar

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-03*
