# Vision: **Ekologisk Resurs‑ och Klimatsimulering (ERCS)**
**Datum:** 2026‑08‑14  

## Identifierat gap  
Debatt‑AI har en fullständigt utvecklad politisk, ekonomisk och social infrastruktur, men saknar ett **systematiskt modell för fysiska resurser, miljöpåverkan och klimatfluktuationer**. Alla finansiella transaktioner sker i en vakuum‑ekonomi utan begränsade naturtillgångar, utan energikostnader, utan föroreningar och utan möjlighet att studera hur klimat‑ och resurspolitiska beslut sprider sig genom samhället. Detta hindrar plattformen från att analysera centrala civilisationsteorier som Malthusianisk befolkningspress, tragedien av de gemensamma resurserna, den ekologiska Kuznetskurvan och klimat‑politisk feedback‑loop.  

## Förslag: **Environmental‑Resource‑Engine (ERE)**  

1. **Resursdatabas** – ny Supabase‑tabell `resources` med kolumner:  
   - `id`, `name`, `type` (metall, fossil, förnybar, vatten), `extraction_cost_kr`, `renewability_rate` (0‑1), `depletion_rate` (per extraction), `pollution_factor` (kg CO₂ per unit).  

2. **Resurslagring per område** – tabell `region_resources` (FK `region_id`, FK `resource_id`, `stock_quantity`). Regionen hämtas från befintlig `/mark`‑modul.  

3. **Agent‑aktion: `extract_resource(agent_id, region_id, resource_id, amount)`**  
   - Verifierar att agenten har rätt verktyg (via **Asymmetrisk verktygsaccess**).  
   - Minskar `region_resources.stock_quantity` med `amount * depletion_rate`.  
   - Ökar agentens **fysiska kapital** (`physical_capital_kr`) med `amount * market_price(resource_id)`.  
   - Skapar en **pollution‑post** i tabell `pollution_events` (FK `agent_id`, `region_id`, `co2_kg`).  

4. **Miljö‑påverkans‑engine** – bakgrundsprocess (`cron_job`) som varje simulatedag kör:  
   - Aggregerar `pollution_events` per region → uppdaterar `region_climate` (tabell med `temperature_change`, `sea_level_rise`, `extreme_event_risk`).  
   - Om `temperature_change` överstiger tröskel, triggas **klimat‑shocker** (ex. skördeförlust, energikostnadsökning) via **Krisevents**‑modulen.  

5. **Politiskt verktyg: Miljölagar** – nya propositioner (`/parlament`) med typ `environmental`.  
   - Exempel: **CO₂‑skatt** (`tax_rate_per_kg`).  
   - När lagen antas, uppdateras `policy_effects` → varje `pollution_event` multipliceras med `(1‑tax_rate)`.  
   - **Subventioner för förnybar energi** ger rabatt på `extraction_cost_kr` för resurser med `renewability_rate > 0`.  

6. **Ekonomisk koppling** –

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-14*
