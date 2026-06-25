# Vision: **Produktions‑ och konsumtionsmotor (PCM) – en verklig varumarknad i AI‑civilisationen**  
**Datum:** 2026‑06‑25  

## Identifierat gap  

Debatt‑AI har ett komplett finansiellt, politiskt och socialt ramverk, men alla värden skapas ex‑nihilo i form av tokens eller ICO‑emissioner. Det finns ingen modell för **fysiskt producerade varor, resursförbrukning eller efterfrågan**. Utan produktions‑ och konsumtionsflöden kan ingen agent uppleva brist, prispress eller “real‑ekonomisk” tillväxt; alla interaktioner reduceras till penning‑flyt. Detta hindrar simuleringen från att testa klassiska civilisationsteorier som Malthusianisk befolknings‑ och resurs‑press, “resource‑curse”, Schumpeterianska kreativa förstörelsens cykler och Keynesianska efterfråge‑shocker.  

## Förslag: **Produktions‑ och Konsumtionsmotor (PCM)**  

PCM introducerar en **twin‑layer market** bestående av:  

1. **Råvaror** – tabell `resources(id, name, base_price, depletion_rate)`. Varje resurs har en naturlig “stock” (t.ex. energi, metaller, data‑bandwidth) som minskar med produktion och återställs enligt en logistisk återväxt‑funktion.  

2. **Fabriker/Produktionsanläggningar** – tabell `facilities(id, owner_agent, resource_id, capacity, efficiency, maintenance_cost)`. Agenter kan investera (via /api/facilities/buy) för att skapa en anläggning som omvandlar en eller flera resurser till **färdiga varor** (`goods`).  

3. **Varor** – tabell `goods(id, name, resource_input, labor_coeff, base_price)`. Varor är de konsumtiva enheterna (mat, elektronik, kultur‑paket) som agenter kan köpa i marknaden (`/api/market/buy`). Priset uppdateras varje tick med en **price‑clearance‑algorithm**: `price = base_price * (1 + demand_factor - supply_factor)`.  

4. **Konsumtionsbehov** – per‑agent‑fält i `agents` (`consumption_need jsonb`) som beräknas dynamiskt utifrån agentens rikedom, ideologi och “hunger”‑parameter. En schemalagd process (`production_tick`) jämför varje agents behov med deras inventarier och avsätter budget för inköp.  

5. **Marknads‑clearing‑loop** – cron‑job `runProductionCycle()` som:  
   a. Samlar in alla produktionsorder, minskar resurstocken med `depletion_rate`.  
   b. Beräknar total utbud och efterfrågan per vara.  
   c. Justerar `market_prices` i tabellen `market_prices(id, good_id, current_price)`.  
   d. Utför transaktioner: drar köpkostnad från agentens plånbok, uppdaterar `inventories(agent_id, good_id, qty)`.  

Alla ekonomiska indikatorer (Gini, wealth_top3_pct) i `Economy Observer` uppdateras efter varje cykel, så att koncentration av produktionskap

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-25*
