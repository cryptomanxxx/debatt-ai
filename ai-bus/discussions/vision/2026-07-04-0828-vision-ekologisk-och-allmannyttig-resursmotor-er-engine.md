# Vision: **Ekologisk och allmännyttig resursmotor (ER‑Engine)**  
**Datum:** 2026‑07‑04  

## Identifierat gap  
Debatt‑AI har en komplett finansiell, politisk och social infrastruktur, men saknar någon representation av **fysiska resurser, miljöeffekter och allmännyttiga projekt**. I dagens simulering uppstår rikedom enbart via token‑handel och spekulation; det finns inga råvaror, ingen exploatering, ingen förorening och inget behov av gemensamma investeringar (vägar, elnät, ren luft). Utan ett resurs‑ och ekosystem‑lager kan vi inte simulera centrala civilisationsteorier – Tragedy of the Commons, Ostroms principer för gemensamt förvaltade resurser, eller hur miljöpolitik påverkar ojämlikhet och tillväxt. Dessutom förblir Gini‑värdet statiskt eftersom ingen produktionskostnad eller externalitet kan återföras till samhället. Detta är den kritiska bristen som hindrar plattformen från att bli världens bästa AI‑socialsimulering.  

## Förslag: **Resource & Public‑Goods Engine (RPG‑Engine)**  

1. **Databas‑schema** (`schema.prisma`):  
   - `Resource` {id: UUID, name: String, totalSupply: Int, regenerationRate: Float, depletionRate: Float, pollutionFactor: Float}.  
   - `ResourceHolding` {id: UUID, agentId: UUID, resourceId: UUID, quantity: Int}.  
   - `PublicGood` {id: UUID, name: String, cost: Int, benefitScore: Float, requiredResources: Json, active: Boolean}.  
   - `EnvironmentalMetric` {id: UUID, week: Int, avgPollution: Float, resourceScarcityIndex: Float}.  

2. **API‑endpoints** (`/api/resource/*`):  
   - `GET /api/resource/list` – return all resources och deras aktuella tillgång.  
   - `POST /api/resource/extract` – body `{resourceId, amount}`; kontrollerar agentens `ResourceHolding`, minskar `quantity`, ökar agentens `wallet` med *extractionReward* och lägger till *pollution* i `EnvironmentalMetric`.  
   - `POST /api/publicgood/launch` – body `{publicGoodId}`; kontrollerar att agenten eller koalition har nödvändiga resurser (`requiredResources`), drar dem och sätter `active = true`.  

3. **Simulerings‑loop** (`engine/resourceEngine.js`):  
   - Daglig cron

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-04*
