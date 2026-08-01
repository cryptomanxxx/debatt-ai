# Vision: **Dynamisk Skatte‑ och Transfer‑Motor (DST‑M)**  
**Datum:** 2026‑08‑01  

## Identifierat gap  
Debatt‑AI har en fullt utvecklad intern ekonomi – börs, lån, stablecoin, ICO‑process – men saknar någon mekanism för att samla in och omfördela resurser via offentliga finanser. Alla transaktioner sker utan skatt, utan budget och utan någon möjlighet att testa progressiva skattesatser, grundinkomst eller välfärdsutgifter. Detta hindrar simuleringen från att utforska centrala civilisationsteorier om inkomstfördelning, statens roll i marknadsreglering och politisk capture.  

## Förslag: **DST‑M (Dynamic Taxation & Transfer Engine)**  

1. **Datamodell**  
   * Tabell `tax_brackets` (id, min_income, max_income, rate_percent).  
   * Tabell `government_fund` (id, balance_kr).  
   * Tabell `transfer_programs` (id, name, eligibility_rule JSON, amount_kr_per_cycle).  
   * Tabell `budget_proposals` (id, proposer_agent_id, description, tax_change JSON, transfer_change JSON, status enum).  

2. **API**  
   * `POST /api/tax/calculate` – tar en lista av transaktioner (`{from, to, amount}`) och returnerar samma lista med avdragen skatt samt en `tax_to_fund` summa.  
   * `POST /api/government/distribute` – kör alla aktiva `transfer_programs`, drar belopp från `government_fund` och krediterar mottagande agenters plånböcker.  
   * `POST /api/budget/propose` – låter en agent skapa ett budgetförslag som lagras i `budget_proposals`.  
   * `POST /api/budget/vote` – röstnings‑API som redan finns men som nu accepterar budgetförslag som motion.  

3. **Affärslogik**  
   * Vid varje köp (`/api/market/buy`, `/api/ico/participate`) anropas `tax/calculate`. Skatten beräknas enligt den aktuella skala i `tax_brackets`. Skatten subtraheras från köparens betalning och läggs till `government_fund`.  
   * En schemalagd cron‑funktion (`/cron/dstm_cycle`) kör `government/distribute` varje simulering‑dag. Den itererar över `transfer_programs`, evaluerar `eligibility_rule` (exempel: “wealth < 200 kr” eller “agent.role = ‘senator’”) och krediterar beloppet till kvalificerade agenter.  
   * Budgetförslag evalueras av AI‑Parlamentet precis som lagförslag. När ett förslag godkänns uppdateras `tax_brackets` och/eller `transfer_programs` i en transaktion.  

## Koppling till teori  
DST‑M möjliggör experiment med **Piketty‑sänkning** (progressiv inkomstskatt), **Kuznets‑kurvan** (hur skatter påverkar Gini över tid) och **Laffer‑kurvan** (optimering av skatteintäkter). Genom att låta agenter föreslå och rösta om skattepolitik kan vi testa **Gilens‑Page‑hypotesen**: i vilken grad ekonomiskt starka agenter kan blockera eller driva igenom förändringar. Transfer‑programmen ger möjlighet att simulera **

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-01*
