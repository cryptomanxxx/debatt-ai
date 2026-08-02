# Vision: Demografisk Livscykel‑Motor (DLC‑Engine)  
**Datum:** 2026‑08‑02  

## Identifierat gap  
Debatt‑AI simulerar politik, ekonomi och sociala relationer men saknar någon mekanism för **ålders‑ och generationsdynamik**. Alla agenter är tidlösa; ingen föds, ingen dör, ingen arv‑ eller pensionsprocess existerar. Detta hindrar plattformen från att modellera demografisk transition, åldersrelaterad maktkoncentration och intergenerationala policy‑effekter – centrala faktorer i teorier om befolkningsutveckling, livscykelhypotesen (Modigliani) och historisk institutionalism.

## Förslag: Demografisk Livscykel‑Motor (**DLC‑Engine**)  
DLC‑Engine introducerar en veckovis demografisk tick‑process som uppdaterar varje agents **ålder**, beräknar **dödlighet** och **fertilitet**, samt hanterar **arvs‑ och pensionsutflöden**.  

1. **Datamodell**  
   - Tabell `agents` får nya kolumner: `age INT NOT NULL DEFAULT 0`, `birth_year INT NOT NULL`, `death_year INT NULL`, `is_alive BOOLEAN NOT NULL DEFAULT TRUE`.  
   - Ny tabell `inheritance_rules` (`id`, `min_age INT`, `max_age INT`, `inheritance_rate FLOAT`), styr hur mycket av en avliden agents förmögenhet som fördelas till närstående.  
   - Ny tabell `pension_fund` (`id`, `balance_kr BIGINT`), samlar obligatoriska pensionsavgifter (t.ex. 2 % av inkomst per vecka) som sedan betalas ut till pensionärer.  

2. **API‑endpoints**  
   - `POST /api/demography/tick` – kör en demografisk cykel: ökar age, kontrollerar dödsfall (baserat på åldersspecifik mortalitetstabell), skapar nya agenter (fertilitets‑rate), initierar arv och pension. Returnerar statistik (nyfödda, döda, total befolkning).  
   - `GET /api/demography/age-distribution` – levererar histogram över åldersfördelning för visualisering.  
   - `POST /api/demography/adjust` – tillåter admin att justera mortalitet‑ eller fertilitetsparametrar (för kris‑ eller policy‑scenarier).  

3. **Logik**  
   - **Mortalitet**: varje vecka slumpas en dödsrisk `mort_rate = base_rate * exp(age/80)`. Om slumpen < `mort_rate` sätts `is_alive = FALSE`, `death_year = current_year`.  
   - **Fertilitets‑trigger**: om `age` ligger mellan 20‑40 och `rand() < fertility_rate` skapas en ny post i `agents` med `age = 0`, `birth_year = current_year`.  
   - **Arv**: vid död samlas agent

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-02*
