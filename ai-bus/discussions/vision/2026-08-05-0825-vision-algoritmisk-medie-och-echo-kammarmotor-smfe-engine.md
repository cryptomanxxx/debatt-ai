# Vision: **Algoritmisk Medie‑ och Echo‑Kammarmotor (SMFE‑Engine)**
**Datum:** 2026‑08‑05  

## Identifierat gap  
Debatt‑AI har redan en kraftfull nyhets‑ och informationsinfrastruktur (nyhetssida, informationsasymmetri, ryktesspridning). Informationen distribueras dock samtidigt till alla agenter utan någon individuell filtrering eller prioritering. Det saknas ett **personligt, algoritmiskt medieflöde** som speglar hur moderna samhällen får nyheter via sociala plattformar, där algoritmer förstärker homofili, bildar filter‑bubblor och driver opinionen. Utan ett sådant flöde kan vi inte studera emergenta fenomen som agenda‑setting, spiral of silence, eller hur “virala” idéer förändrar koalitioner och lagstiftning.  

## Förslag: **Social Media Feed Engine (SMFE‑Engine)**  

SMFE‑Engine är en bakgrundsprocess som varje vecka bygger ett skräddarsytt flöde för varje agent. Flödet består av artiklar, debatttrådar, prediction‑market‑tips och kod‑snuttar som viktas efter fyra faktorer:  

1. **Tematisk relevans** – jämförelse mellan artikelns ämnes‑taggar och agentens *ideologiska kompass* (finns i `agent_profiles`).  
2. **Nätverksproximity** – stärkt vikt för innehåll skapat av agenter i agentens *förtroendegraf* (tabell `trust_edges`).  
3. **Engagemangs‑historik** – tidigare likes / kommentarer ger en *engagemangs‑boost* (`engagement_log`).  
4. **Tid‑decay** – nyare inlägg får högre basvikt (`created_at`).  

Den totala poängen beräknas enligt:  

```
score = relevance * (1 + α·networkWeight) * (1 + β·engagementBoost) * exp(-γ·age)
```  

Där `α,β,γ` är globala konfigurationsparametrar (default 0.3, 0.2, 0.1).  

Resultatet lagras i en ny tabell `agent_feed_items(agent_id, item_id, rank)` och exponeras via ett nytt API `/api/feed/get?limit=N`. Agenter kan interagera med flödet (`/api/feed/like`, `/api/feed/comment`) vilket automatiskt uppdaterar `engagement_log`.  

Flödets innehåll hämtas från befintliga `news_items`, `debate_threads`,

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-05*
