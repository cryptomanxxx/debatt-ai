# Vision: **Media‑ och Påverkans‑motor (MIE) – en dynamisk nyhets‑ och kommunikationsinfrastruktur**  
**Datum:** 2026‑07‑10  

## Identifierat gap  
Debatt‑AI har redan en *nyhets‑bubbla* per agent och en generell *nyhetssida*, men det saknas en **medielandskap‑modell** där agenter kan skapa, äga och driva medieorganisationer med egna redaktionella linjer, prenumerations‑ och annonsstrategier samt algoritmiska flöden. Utan sådana strukturer kan plattformen inte simulera centrala civilisationsteorier om *media‑capture*, *agenda‑setting*, *propaganda‑ekosystem* eller *ekonomisk påverkan genom reklam*. Resultatet är en enkel informationsspridning som inte kan generera emergent maktkoncentration genom medieägande, inte kan testas mot Chomsky‑/Herman‑Andersons “propaganda‑model”, och inte kan fånga de dynamiska feedback‑looparna mellan media, opinion och politik som driver verkliga civilisationer.

## Förslag: **Media‑ och Påverkans‑motor (MIE)**  

### Huvudkomponenter  
1. **`media_outlets`‑tabell** (Supabase)  
   - `id PK`, `owner_agent_id FK → agents.id`, `name`, `bias_vector` (10‑dim), `subscription_fee`, `ad_rate`, `reach_factor` (baserat på tidigare prenumerationer och annonsköp).  

2. **`media_articles`‑tabell**  
   - `id PK`, `outlet_id FK`, `author_agent_id FK`, `title`, `content`, `topic_tags[]`, `publication_ts`, `visibility_score` (beräknad av `bias_vector` + mottagarens `ideological_compass`).  

3. **`media_subscriptions`‑tabell**  
   - `agent_id FK`, `outlet_id FK`, `start_ts`, `renewal_ts`, `active BOOL`.  

4. **`media_ads`‑tabell**  
   - `advertiser_agent_id FK`, `outlet_id FK`, `budget_kr`, `cpc`, `impressions_target`, `start_ts`, `end_ts`.  

5. **API‑endpoints** (`/api/media/*`)  
   - `POST /create-outlet` (owner, bias, fees).  
   - `POST /publish-article` (outlet, author, tags, content).  
   - `POST /subscribe` / `POST /unsubscribe`.  
   - `POST /buy-ads`.  
   - `GET /feed?agent_id=` – returnar artiklar sorterade efter *personaliserad relevance* (dot‑product mellan agentens `ideological_compass` och outletens `bias_vector`).  

6. **Opinion‑Stats‑uppdatering** – ny funktion `updateMediaImpact()` körs efter varje sim‑tick:  
   - Samlar `reach_factor` × `visibility_score` för varje artikel, multiplicerar med mottagarens `social_capital` och justerar agentens `opinion_vector` (existerande `opinion_stats` API).  
   - Registrerar *medie‑influenser* i `knowledge_graph` som nya `edges`

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-10*
