# Vision: **Public Goods & Infrastruktur‑Motor (PGIM)**  
**Datum:** 2026‑07‑18  

## Identifierat gap  
Ekonomiska rapporter visar att civilisationen har **ingen offentlig budget, inga skatteintäkter och ingen mekanism för att producera kollektiva resurser**. All kapitalspridning sker genom privata transaktioner (börshandel, token‑ICO, hedgefonder) medan samhälleliga externa effekter – t.ex. klimatkatastrofen, sjukvårdsberedskap eller utbildningssystem – saknas helt. Utan en *public‑goods‑motor* kan vi inte testa centrala civilisationsteorier såsom Ramsey‑skatt‑optimering, Lindahl‑prissättning, Bowley‑effekter på produktivitet eller teorier om statlig infrastruktur som drivkraft för endogen tillväxt (Romer 1990; Acemoglu‑Johnson‑Robinson 2001). Detta hindrar simuleringen från att generera relevanta chocker och policy‑feedback‑loopar som krävs för att nå ”världens bästa AI‑socialsimulering”.

## Förslag: **Public Goods & Infrastruktur‑Motor (PGIM)**  
PGIM introducerar en *fiskal‑policy‑ och projekt‑plattform* där:  

1. **Skatteuppsamling** – varje agent betalar en procentuell inkomstskatt (`tax_rate`) varje cykel. Skattesatsen styrs av ett **Budget‑Proposal** som röstas i AI‑Parlamentet.  
2. **Public‑Goods‑Projekt** – en ny resurs‑typ *Projekt* (`pgim_projects`) med fält: `id`, `title`, `description`, `cost_kr`, `benefit_factor`, `category` (ex. “klimat‑resiliens”, “hälsa”, “utbildning”), `status` (proposed/active/completed), `start_cycle`, `end_cycle`.  
3. **Budgetallokering** – godkända projekt drar automatiskt `cost_kr` från den samlade skattekassan varje cykel tills `status` blir *completed*. När färdigställda projekt släpps en **Benefit‑Modifier** (`public_goods_effects`) som multiplicerar relevanta agent‑variabler:  
   - `productivity` ↑ `benefit_factor` för alla agenter (klimat‑resiliens).  
   - `health_index` ↑ för agenter i `health`‑kategorin.  
   - `education_level` ↑ för `education`‑projekt.  
4. **Feedback‑loop** – varje slutfört projekt påverkar statistik i *Economy Observer* (t.ex. Gini, produktivitetsökning) och triggar en **Policy‑Impact‑Simulator API**‑kallning som beräknar marginala effekter och föreslår nästa skattesats.  

Genom att låta agenter *debattera*, *lösa* och *rösta* om budgetförslag får vi en dynamisk skatt‑/utgift‑cykel som kan analyseras med standard‑makroekonomiska verktyg och jämföras mot historiska data.

## Koppling till teori  
- **Ramsey‑optimal beskattning** (Ramsey 1927) – PGIM möjliggör att simulera hur olika skattesatser påverkar konsumtion, sparande och kapitalackumulation.  
- **Lindahl‑prissättning** för offentliga varor – genom att låta agenter uttrycka “willingness‑to‑pay” i budget‑förslag kan vi approximera Lindahl‑ekvivalenter.  
- **Endogen tillväxt** – offentliga infrastrukturella investeringar ökar `benefit_factor`, vilket speglar Romer‑modellen där kunskaps‑ och nätverksexternaliteter drivs av statligt stöd.  
- **Klimat‑resiliens & katastrof‑ekonomi** – projekt i “klimat‑resiliens” låter oss mäta hur offentliga skyddsåtgärder dämpar produktivitetsförluster vid

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-18*
