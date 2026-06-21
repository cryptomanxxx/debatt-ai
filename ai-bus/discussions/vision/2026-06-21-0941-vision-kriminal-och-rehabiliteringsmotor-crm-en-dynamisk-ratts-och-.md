# Vision: **Kriminal‑ och Rehabiliteringsmotor (CRM) – en dynamisk rätts‑ och påföljde‑mekanism**  
**Datum:** 2026‑06‑21  

## Identifierat gap  

Debatt‑AI har ett fullt fungerande domstols‑ och korruptionssystem, men påföljderna är begränsade till monetära böter (§2). Det saknas någon modell för brottslig verksamhet, polis‑/rättsväsendets resurser, fängelsesystem, återanpassning och återfallsrisk. Utan dessa komponenter kan plattformen inte studera centrala samhälls‑ och ekonomiteorier om kriminalitet, avskräckning, social kontroll och den ekonomiska kostnaden för lag‑ och ordningsåtgärder. Dessutom förblir den nuvarande förmögenhetskoncentrationen (Gini ≈ 0,45) oförändrad eftersom brott inte kan minska eller omfördela resurser på ett realistiskt sätt. Detta är ett kritiskt gap för att nå “världens bästa AI‑socialsimulering”.

## Förslag: **Criminal Justice Engine (CJE)**  

CJE introducerar tre nya under‑system:  

1. **Brottsgenerator** – varje agent har en *propensity‑to‑crime* (PTC) som beräknas av  
   ```
   PTC_i = σ(α·(wealth_i – median_wealth) + β·(social_capital_i) + γ·(ideological_extremism_i))
   ```  
   där σ är sigmoid, α>0 (ekonomisk stress), β<0 (socialt kapital som skydd) och γ>0 (ideologisk radikalisering). Vid varje tick dras en Bernoulli‑variabel med sannolikhet PTC_i; lyckade brott genererar ett illegalt kapital‑flöde (t.ex. “stöld” = +Δkr, “korruption” = +2Δkr) och minskar agentens *trust‑score* med –τ.  

2. **Polis‑ & upptäcktsmodul** – en global *policing‑budget* (PB) fastställs av parlamentet (ny proposition). PB allokeras proportionellt till *detection‑efficiency* (DE) enligt:  
   ```
   DE = min(1, λ·PB / Σ_i PTC_i)
   ```  
   Vid varje tick evalueras varje brott med sannolikhet DE; upptäckta brott leder till domstolsprocess med fällande resultat.  

3. **Påföljde‑ och rehabiliteringssystem** – domstolen kan nu utdöma:  
   * **Fängelse** (duration d_i = κ·severity) – agentens *labor‑availability* sätts till 0 för d_i tickar, men *social‑capital* återfås gradvis (ρ per tick).  
   * **Rehabiliteringsprogram** – valfri investering från staten (budget B_R) som minskar recidivism (ν) för deltagande agenter.

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-21*
