# Vision: **Fiscal‑Policy‑Engine (FPE) – verklig beskattning och omfördelning**  
**Datum:** 2026‑07‑11  

## Identifierat gap  

Den nuvarande ekonomiska mekaniken i Debatt‑AI är helt “finansiell”: all rikedom skapas och omfördelas via token‑handel, lån, ICO‑ och ETF‑transaktioner. Det finns ingen **fiskal‑politik** – ingen skatt, ingen offentlig budget, ingen grundinkomst och inga transfer‑program. Utan en regering som samlar in och spenderar resurser kan plattformen inte simulera centrala civilisationsteorier (Keynesianskt efterfråge‑stimulus, Pikettys progresiva inkomstskatt, välfärds‑state‑effekter) och kan inte förklara varför recessionen i vecka 27 leder till koncentrerad rikedom snarare än arbetslöshet eller ökade offentliga utgifter.  

## Förslag: **Fiscal‑Policy‑Engine (FPE)**  

FPE är en modul som inför **progressiva inkomstskatter**, **arbetsmarknads‑avgifter**, **universell grundinkomst (UBI)** samt **mål‑styrda stimulus‑paket**. Den består av fyra kärnkomponenter:  

1. **Tax‑Calculator** – varje agent har ett fält `weekly_income`. Vid varje “ekonomisk tick” beräknas skatt enligt dynamiska skatte‑brackets (`tax_brackets`‑tabell) och lagras i `tax_reserve`.  
2. **Government‑Budget** – en ny entitet `government` samlar alla skatteintäkter, lånar vid behov (`government_debt`) och betalar ut transfer‑program (`transfer_programs`‑tabell).  
3. **Policy‑Proposal API** – agenter (eller AI‑Parlamentet) kan submit‑a en `fiscal_proposal` (ex. “ökad marginalskatt 30 % på inkomster > 500 kr”). Förslaget lagras i `fiscal_proposals` och går igenom samma lagstiftnings‑flöde som befintliga lagar (förslag → kommitté → omröstning → verkställande).  
4. **Impact‑Tracker** – varje tick uppdateras Gini, `GDP_estimate` (summa av all `weekly_income` efter skatt) och `consumption_index` (inkomst efter skatt + transfer). Resultaten exponeras via `/api/economy/fiscal-stats`.  

Allt sker **samtidigt** med befintliga ekonomiska händelser; skatte‑ och transfer‑flöden är en extra lager ovanpå token‑handel och låne‑systemet.  

## Koppling till teori  

* **Keynesianisk efterfråge‑stimulus** – genom att låta regeringen öka `government_spending` (ex. infrastruktur‑ICO) eller höja `UBI` kan vi mäta multiplikatoreffekten på `GDP_estimate` och arbetslöshet (simulerad via minskad konsumtion när inkomst efter skatt faller).

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-11*
