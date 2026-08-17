# Vision: **Legitimitets‑ och Tillitsmotor (LTM) – dynamisk modell för förtroende och institutionell stabilitet**  
**Datum:** 2026‑08‑17  

## Identifierat gap  
Den pågående krisen “Demokratin ifrågasätts — val bestrids” visar att plattformen saknar ett **kvantitativ lager för förtroende och legitimitet** mellan agenter och institutioner. Utan en mekanism som mäter hur agenters tillit till parlamentet, domstolen, media‑outlets och andra maktcentra förändras över tid, kan vi inte förklara varför val bestrids, varför koalitioner kollapsar eller varför protester uppstår. Detta gap hindrar test av teorier om demokratisk konsolidering, legitimitets‑erosion och sociala kapitalets roll i institutionell motståndskraft.  

## Förslag: **Legitimitets‑ och Tillitsmotor (LTM)**  

1. **Datamodell**  
   - Ny tabell `institution_trust(agent_id uuid, institution_id uuid, trust_score float, last_update timestamp)`. `trust_score` initieras på 0.5 (neutral).  
   - Ny tabell `institution_events(event_id uuid, institution_id uuid, type enum('policy','scandal','judgment','media_coverage'), impact float, timestamp)`. `impact` är en relativ förändringsfaktor (±0.0‑1.0).  
   - Ny tabell `protest_events(event_id uuid, location varchar, magnitude int, cause varchar, timestamp)`.  

2. **Algoritm**  
   - Vid varje *policy‑ eller lag‑event* (`type='policy'` eller `'judgment'`) beräknas en **policy‑impact**: `Δtrust = impact * (agent.ideology_match - 0.5)`.  
   - Vid *skandal‑event* (`type='scandal'`) beräknas `Δtrust = -impact * (1 - agent.integrity)` där `integrity` är en befintlig personlighetsegenskap.  
   - Vid *media_coverage* används den redan existerande `media_outlet`‑bias för att justera `Δtrust` proportionellt mot agentens nyhetskonsumtion (`agent.news_bias`).  
   - Trust‑score klipps mellan 0.0 och 1.0.  
   - En **aggregat‑tillitsindex** per institution (`avg(trust_score)`) publiceras dagligen via `/api/trust/summary`.  

3. **Trigger för protest**  
   - Om `avg(trust_score) < 0.3` för någon institution under tre på varandra följande dagar, genereras automatiskt en `protest_event`. Magnituden är `ceil((0.3 - avg_trust) * 100)`.  
   - Protest‑eventet påverkar ekonomin (tillfällig minskning av `weekly_kr` med 5 % och ökad `bor_volym` med 10 %).  

4. **API**  
   - `GET /api/trust/{institution_id}` – returnerar lista på agent‑trust‑scores.  
   - `POST /api/trust/event` – skapar ett `institution_event`.  
   - `GET /api/protest` – listar aktiva protest‑event.  

5. **UI**  
   - Ny sida `/trust-dashboard` visar stapeldiagram över institutionella trust‑index, historik över förändringar och pågående protester.  
   - På varje agents profil läggs en “Tillits‑panel” med deras aktuella betyg för varje institution.  

## Koppling till teori  
LTM operationaliserar **Weber’s legitimitetsbegrepp** (legal‑rational, traditionell, karismatisk) genom att låta policy‑impact justeras efter agentens ideologi‑matchning. **Lipset’s teori om demokratisk stabilitet** föreslår att hög socioekonomisk utveckling och förtroende för institutioner korrelerar med demokratiskt beständighet; vår Gini‑data och trust‑index kan korsanalysas för att testa detta. **Putnam’s sociala

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-17*
