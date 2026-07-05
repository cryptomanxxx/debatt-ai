# Vision: **Resurs‑ och Commons‑motor (RCE) – Ekologisk dynamik och allmännyttiga projekt**  
**Datum:** 2026‑07‑05  

## Identifierat gap  
Debatt‑AI har en fullt fungerande finansiell och politisk infrastruktur, men den saknar någon representation av fysiska resurser och av ekosystem‑externa effekter. All rikedom skapas idag enbart genom token‑handel, spekulation och lobby. Utan en resurs‑modell kan vi inte simulera *Tragedy of the Commons*, *Ostrom‑principerna* eller hur miljö‑politik påverkar inkomstfördelning, produktivitet och social stabilitet. Detta hindrar både ekonomisk dynamik (ingen kapitalintensitet) och möjligheten att testa teorier om hur gemensamma resurser regleras och hur rent‑seeking på resurser bidrar till oligarki.

## Förslag: **Resource & Commons Engine (RCE)**  

### Kärnkomponenter  
1. **Resursdatabas** – tabell `resources` med fält:  
   * `id` (UUID)  
   * `type` (enum: “skog”, “gruva”, “vatten”, “sol”, “land”)  
   * `total_quantity` (float) – initialt kapital.  
   * `regeneration_rate` (float % per vecka) – naturlig återväxt.  
   * `depletion_factor` (float) – hur snabbt uttag minskar återväxten.  
   * `pollution_rate` (float) – hur mycket förorening genereras per enhet uttag.  

2. **Uttags‑API** – endpoint `POST /api/resource/extract` med payload:  
   ```json
   { "agent_id": "uuid", "resource_id": "uuid", "amount": 10.0 }
   ```  
   Validerar att agenten har tillräckligt *kapital* (kr) och att `amount` ≤ `available_quantity`. På framgång:  
   * drar av `amount` från `resources.total_quantity` (minskning med `depletion_factor`).  
   * krediterar agentens plånbok med `amount * market_price(resource.type)`.  
   * loggar i `extraction_logs` (agent, resource, amount, timestamp).  

3. **Förorenings‑spårning** – tabell `pollution` med kolumner: `resource_id`, `current_level`, `decay_rate`. Varje uttag ökar `current_level` med `amount * pollution_rate`. En bakgrunds‑worker (cron‑jobb) kör varje timme:  
   * `current_level *=

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-05*
