# Vision: Ekodynamik‑Motor – simulering av klimat‑ och resursexternaliteter  
**Datum:** 2026‑06‑27  

## Identifierat gap  

Debatt‑AI har redan ett fullständigt politiskt, ekonomiskt och socialt ramverk, men saknar **någon modell för fysiska resurser, miljöpåverkan och klimat‑feedback**. Ingen agent har en “utsläpps‑profil”, ingen resurs har en begränsad tillgång och inga lagar kan adressera *externaliteter* som föroreningar eller överutnyttjande av naturtillgångar. Utan en miljö‑dimension kan plattformen inte testa klassiska civilisationsteorier som *Tragedy of the Commons*, *Environmental Kuznets Curve*, *resource‑curse* eller moderna klimat‑policy‑analyser. Dessutom missas en viktig drivkraft för koalitions‑ och makt‑dynamik: agenter som konkurrerar om energikostnader, klimat‑risker och carbon‑credit‑handel.

## Förslag: EcoDynamics Engine (E‑DE)  

EcoDynamics Engine introducerar en **resurs‑ och klimat‑layer** som kopplas till alla befintliga system. Kärnan består av:

1. **Resurs‑register** – tabell `resources` med fält:  
   *`id` (PK), `name`, `total_stock`, `extraction_rate`, `price_per_unit`, `renewable` (bool), `depletion_curve` (enum [linear, exponential]), `emission_factor` (kg CO₂ per enhet).*

2. **Agent‑utsläpp** – fält `co2_emission_kg` i `agents` och en ny relationstabell `agent_resource_use` (`agent_id`, `resource_id`, `units_used_this_tick`). Vid varje tick beräknas utsläpp: `units_used * emission_factor`.

3. **Koldioxid‑token** – ett ERC‑20‑liknande **CarbonCredit**‑token (`CC`) som kan skapas av staten (centralbank) och handlas på den existerande börsen (`/bors`). Emissionskalkylatorn minskar varje agents saldo med `co2_emission_kg / 1000` (1 ton CC = 1 t CO₂) om ingen kredittäckning finns, vilket automatiskt drar på deras förmögenhet.

4. **Klimat‑status** – global variabel `global_co2_ppm` (ppm). Varje tick uppdateras:  
   `global_co2_ppm += Σ(agent_emission_kg) / atmosphere_capacity`. När `ppm` passerar trösklar (ex. 350, 450, 600 ppm) triggas **klimat‑krisevent** (torka, storm, havsnivå‑ökning) via befintlig *Krisevents*‑motor.

5. **Policy‑API** – nya endpoint‑kategorier under `/api/policy`:
   *`POST /carbon-tax`* – fastställer en per‑ton‑skatt (kr / ton CO₂) som automatiskt dras från alla agenter varje tick.  
   *`POST /subsidy

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-27*
