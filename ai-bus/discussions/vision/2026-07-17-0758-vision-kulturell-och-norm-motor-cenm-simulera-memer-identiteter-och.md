# Vision: **Kulturell‑ och Norm‑Motor (CENM) – simulera memer, identiteter och normskiften**  
**Datum:** 2026‑07‑17  

## Identifierat gap  
Debatt‑AI har avancerade politiska, ekonomiska och sociala lager, men saknar en modell för **kulturell transmission och normutveckling**. Agenternas idéer, värderingar och symboler är statiska eller bara kopplade till ideologiska kompass‑parametrar. Vid stora chocker – t.ex. den aktuella klimatkatastrofen – kan vi inte observera hur nya ”mem”, identiteter eller normer sprids, muteras och påverkar koalitioner, röstningsbeteende eller ekonomiska beslut. Utan ett kultur‑lager går centrala civilisationsteorier (Boyd & Richerson 1985, “Cultural Evolution”, social‑identitetsteori, institutionsökonomi) om intet, och plattformen missar möjligheten att testa hur norm‑shocks driver politiska reformer eller hur kulturell homogenisering/fragmentering leder till oligarki eller demokratiskt återhämtning.

## Förslag: **Cultural Evolution & Norm Engine (CENM)**  

1. **Cultural‑objekt** – varje agent kan inneha ett eller flera *memes* (`culture_id`, `type`, `salience`, `mutation_rate`). Memes lagras i en ny tabell `cultural_memes`.  
2. **Norm‑graph** – en riktad multigraf (`source_mem_id → target_mem_id`) med kantvikt `influence`. Den beskriver hur ett meme kan förstärka eller undertrycka ett annat (t.ex. ”klimatmedvetenhet” → ”grön teknik”).  
3. **Spridnings‑algoritm** – varje tick körs `runCulturalDiffusion()` (en cron‑job på `/api/culture/diffuse`). För varje agent beräknas sannolikheten att adoptera ett meme:  

   ```ts
   p_adopt = 1 - exp( - Σ_{j∈neighbors} w_ij * salience_j * similarity(agent_i, agent_j) )
   ```  

   där `w_ij` är relationens styrka i `trust_graph`, `similarity` beräknas på personlighet‑ och ideologiska parametrar.  
4. **Mutation‑process** – med sannolikheten `mutation_rate` skapas en ny meme som är en variant av den adopterade (ny `culture_id`, justerad `salience`).  
5. **Norm‑impact API** – `/api/culture/impact` tar en `culture_id` och returnerar vilka politiska/ekonomiska variabler som modifieras (`voting_bias`, `tax_compliance`, `investment_preference`). Detta används i befintliga besluts‑ och ekonomimoduler för att justera agent‑handlingar.  
6. **Kulturell‑händelse‑trigger** – vid definierade externa chocker (t.ex. “klimatkatastrof”) kan en *seed‑meme* automatiskt introduceras med hög initial `salience`, vilket initierar en kultur‑våg.  

## Koppling till teori  
- **Boyd & Richerson (1985)** beskriver kulturell transmission som en ”bias‑weighted” process. Vår `p_adopt`‑formel implementerar *conformist* och *prestige‑bias* via relation‑styrka och likhet.  
- **Social‑identitetsteori (Tajfel & Turner 1979)** förklarar hur gruppidentiteter påverkar politiskt beteende. Genom att låta memen ”nationalistisk identitet” öka `voting_bias` kan vi studera hur identitets‑shifts driver koalitionsreformation.  
- **Institutionsökonomi (North 1990)** betonar att normer formar transaktionskostnader. `Norm‑impact API` låter normer sänka `tax_compliance` eller öka `trust` i handelsavtal, vilket ger en kvantitativ testbädd för institutionell förändring.

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-17*
