# Vision: **Medie‑ och Informationsflödesmotor (MIFM) – dynamisk agenda‑ och opinion‑simulering**  
**Datum:** 2026‑08‑16  

## Identifierat gap  
Trots avancerade politiska, ekonomiska och sociala lager saknar Debatt‑AI en **explicit mediemodell** som kan producera, distribuera och mäta effekter av nyhetsflöden på agenters åsiktsdrift. Nu sker informationsspridning endast via enkla nyhets‑ och rykte‑kanaler utan redaktionell bias, utan prenumerations‑ eller algoritmiska filter. Detta hindrar plattformen från att simulera fenomen som agenda‑setting, filter‑bubblor, spiral‑of‑silence och mediekoncentrationens roll i makt‑ och oligarkiutveckling.

## Förslag: **Media‑Engine (MIFM)**  

### Huvudkomponenter  
1. **MediaOutlet‑entity** – tabell `media_outlets(id, namn, bias_vector[5], budget_kr, publication_schedule)` där `bias_vector` representerar ideologisk lutning (t.ex. 5‑dimensional idé‑vektor).  
2. **Article‑entity** – tabell `articles(id, outlet_id, title, content, bias_vector, publish_ts, engagement_score)`; `bias_vector` är ärvd från outlet med möjlighet till slump‑mutation (±0.05 per dimension).  
3. **Feed‑subscription** – tabell `feed_subs(agent_id, outlet_id, subscription_type, algorithm)`; `algorithm` kan vara `RANDOM`, `IDEOLOGICAL_MATCH`, eller `POPULARITY_WEIGHTED`.  
4. **MediaMetrics** – vy `media_metrics` som aggregerar daglig räckvidd, klick‑through‑rate, och sentiment‑score per outlet.  

### Flöde  
- **Daglig artikelgenerering**: en schemalagd Lambda‑funktion (`/tasks/media/generate.js`) anropar LLM (ex. Cerebras Qwen‑3) med prompt ”Skriv en kort nyhetsartikel som reflekterar outlet‑bias_vector”. Svaret sparas i `articles`.  
- **Distribuerad leverans**: en batch‑process (`/tasks/media/distribute.js`) itererar över `feed_subs`, beräknar sannolikheten för att en agent läser artikeln (`P = sigmoid( dot(agent.bias, outlet.bias) ) * algorithm_factor`). Läs‑event loggas i `article_reads(agent_id, article_id, read_ts)`.  
- **Opinion‑update**: varje gång en artikel läses, körs `update_opinion(agent_id, article.bias_vector, weight = engagement_score * P)`. Detta anropar befintlig `Opinion Stats API` och justerar agentens ideologiska vektor med en låg‑learning‑rate (t.ex. 0.02).  
- **Ekonomisk avtryck**: outlets får `advertising_income = Σ engagement_score * CPM`. Detta läggs till deras `budget_kr`, vilket i sin tur påverkar deras förmåga att öka publiceringsfrekvensen (dynamisk feedback‑loop).  

### Parametrar för experiment  
- **Bias‑styrka**: justerbara värden i `media_outlets.bias_vector` (0–1).  
- **Subscription‑typ**: kan bytas via API `/api/media/subscribe`.  
- **Algoritm‑modifierare**: `algorithm_factor` kan sättas till 0.5 (för begränsad räckvidd) eller 1.5 (för virala bubblor).  

## Koppling till teori  
MIFM möjliggör test av **Agenda‑Setting Theory** (McCombs & Shaw, 1972) genom att mäta korrelationen mellan outlet‑bias och förändring i agenters top‑5‑issues. Den stödjer **Spiral‑of‑Silence** (Noelle‑Neumann, 1974) genom att låta `subscription_type = POPULARITY_WEIGHTED` skapa socialt tryck att ignorera minoritetsåsikter. Medie‑koncentration studeras via `media_outlets.budget_kr` och dess effekt på Gini‑index och **Political Capture

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-16*
