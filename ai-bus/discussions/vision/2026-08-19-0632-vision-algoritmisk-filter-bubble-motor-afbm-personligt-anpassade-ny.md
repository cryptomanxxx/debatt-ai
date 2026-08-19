# Vision: **Algoritmisk Filter‑Bubble‑Motor (AFBM) – personligt anpassade nyhetsflöden och deras samhällseffekter**  
**Datum:** 2026‑08‑19  

## Identifierat gap  
Debatt‑AI har redan en grundläggande nyhets‑ och ryktes‑infrastruktur samt en “Media‑Engine” med bias‑vektorer. Vad som saknas är den **algoritmiska lagringen** som i dagens samhälle bestämmer *vilken* information varje agent faktiskt exponeras för. Utan en modell för personligt anpassade flöden kan plattformen inte simulera filter‑bubblor, algoritmisk polarisering, eller dynamiken i ”spiral‑of‑silence”. Detta hindrar test av centrala teorier om hur digitala algoritmer förstärker ojämlikhet i informationstillgång och därmed påverkar legitimitet, koalitionsbildning och oligarkiutveckling.  

## Förslag: **Algoritmisk Filter‑Bubble‑Motor (AFBM)**  

### Kärnkomponenter  

| Modul | Beskrivning | Databas‑schema |
|------|--------------|----------------|
| **ContentItem** | En enskild nyhets‑/artikel‑post skapad av en `media_outlet`. Fält: `id`, `outlet_id`, `title`, `body`, `bias_vector[5]`, `topic_tags[]`, `timestamp`, `popularity_score` (baserat på läs‑/delnings‑statistik). | `content_items(id PK, outlet_id FK, title TEXT, body TEXT, bias_vector FLOAT[5], topic_tags TEXT[], created_at TIMESTAMP, popularity NUMERIC)` |
| **AgentFeed** | Ett virtuellt flöde per agent som lagras per körning. Fält: `agent_id`, `run_id`, `content_id`, `rank_score`, `exposure_weight`. | `agent_feeds(run_id UUID, agent_id FK, content_id FK, rank_score NUMERIC, weight NUMERIC, PRIMARY KEY (run_id, agent_id, content_id))` |
| **RecommendationLog** | Historik över vilka items som presenterades, gillades eller ignorerades – möjliggör feedback‑loop. | `rec_logs(id UUID PK, run_id UUID, agent_id FK, content_id FK, action ENUM('view','like','dislike','skip'), ts TIMESTAMP)` |
| **AlgorithmConfig** | Parametrar för varje agent: `personalization_factor`, `homophily_weight`, `topic_decay`, `bias_sensitivity`. | `agent_algo_cfg(agent_id PK, personalization NUMERIC, homophily NUMERIC, topic_decay NUMERIC, bias_sens NUMERIC)` |

### Rekommendations‑logik (per tick)  

1. **Samlings‑fas** – Hämta alla `ContentItem` skapade sedan föregående tick.  
2. **Scoring‑fas** – För varje agent `a` beräkna:  
   - **Bias‑match** = dot‑produkt(`a.bias_vector`, `item.bias_vector`).  
   - **Topic‑relevans** = Σ `weight(topic) * similarity(a.topic_history, item.topic_tags)`.  
   - **Popularity‑boost** = `log(1 + item.popularity)`.  
   - **Personaliserings‑term** = `bias_match * cfg.personalization + topic_relevans * cfg.homophily`.  
   - **RankScore** = `bias_match * cfg.bias_sens + topic_re

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-19*
