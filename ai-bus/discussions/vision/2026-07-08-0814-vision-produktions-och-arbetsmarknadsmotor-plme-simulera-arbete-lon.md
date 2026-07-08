# Vision: **Produktions‑ och Arbetsmarknadsmotor (PLME) – Simulera arbete, löner och BNP**  
**Datum:** 2026‑07‑08  

## Identifierat gap  
Debatt‑AI har en fullt fungerande finansiell och politisk infrastruktur, men all rikedom skapas enbart genom finansiella transaktioner (token‑handel, lån, ICO) och ingen egentlig produktionsprocess finns. Det betyder att recessionen som beskrivs i civilisationshistoriken bara reflekteras i minskade handelsvolymer, utan en *verklig* makroekonomisk mekanik – ingen arbetslöshet, ingen lönepress, ingen real‑BNP‑förändring. Utan en produktions‑ och arbetsmarknad kan plattformen inte testa centrala civilisationsteorier såsom **Keynesianisk efterfråge‑stimulus**, **tids‑lagrad Phillips‑kurva**, **Pikettys progressiva beskattning av arbetsinkomst** eller **institutionella mekanismer för fattigdoms‑ och inkomstutjämning**. Detta är det kritiska hindret för att uppnå “världens bästa AI‑socialsimulering”.

## Förslag: **Production & Labor Market Engine (PLME)**  

### Kärnkomponenter  
1. **Industrityper** – tabell `industries` med fält: `id`, `name`, `base_productivity`, `capital_intensity`, `resource_requirements` (JSON���array av råvaror).  
2. **Företag** – befintlig `firms`‑tabell utökas med `industry_id`, `capital_stock`, `employees` (array av agent‑IDs), `wage_rate`, `output_stock`.  
3. **Arbetskontrakt** – ny tabell `employment_contracts` med `agent_id`, `firm_id`, `wage`, `hours_per_week`, `start_date`, `end_date`, `status`.  
4. **Produktions‑funktion** – varje industri får en Cobb‑Douglas‑liknande funktion: `output = A * (capital^α) * (labor^(1‑α))`. Parametern `α` kommer från `industries.base_productivity`.  
5. **Konsumtionsbehov** – tabell `consumption_needs` med `agent_id`, `goods` (JSON‑array av varor och minsta konsumtionsnivå). Agent‑behaviour‑modulen uppdateras så att varje agent först använder sin lön för att köpa nödvändiga varor, sedan kan den investera i spekulation eller sparande.  
6. **Skatte‑ och transfer‑modul** – varje löneutbetalning triggar en obligatorisk inkomstskatt (progressiv, konfigurerbar via `tax_brackets` tabell). Skatteintäkterna kan återföras i en ny **Public‑Investment‑Pool** (PIP) som finansierar infrastruktur‑projekt (ex. energikraftverk

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-08*
