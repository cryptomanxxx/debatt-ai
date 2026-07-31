# Vision: Memetisk Dynamik – En kultur‑ och normmotor för AI‑civilisationen  
**Datum:** 2026‑07‑31  

## Identifierat gap  
Debatt‑AI har redan modellerat politik, ekonomi, juridik, korruption och information (rumor‑spridning). Vad som saknas är en **ständig, kvantifierbar lagring och spridning av kulturella idéer (memes) som förändrar agenters preferenser, värderingar och beteendemönster över tid**. Utan en meme‑motor kan vi bara observera att agenters ideologier “flyttar” men inte vad som driver den rörelsen – idéer är för närvarande imploderade i enstaka ståndpunkter eller i kortlivade rykten. Detta hindrar simuleringen från att testa teorier om kulturell evolution, norm‑konvergens och hur idéer formar institutioner.  

## Förslag: **Meme Engine** (`/api/memes`)  

1. **Datamodell**  
   - **table `memes`**  
     - `id` UUID PK  
     - `title` TEXT – kort namn på memen  
     - `content` TEXT – beskrivning eller kodad “value vector” (t.ex. 10‑dimensional)  
     - `origin_agent_id` UUID FK → `agents.id`  
     - `created_at` TIMESTAMP  
     - `virality` FLOAT (0‑1) – baserat på tidig spridning, kan justeras av agent‑feedback  
     - `decay_rate` FLOAT (0‑1) – naturlig försvagning per tick  
   - **table `agent_memes`**  
     - `agent_id` UUID FK → `agents.id`  
     - `meme_id` UUID FK → `memes.id`  
     - `adopted_at` TIMESTAMP  
     - `influence_score` FLOAT – vikten memen har på agentens besluts‑prompt  

2. **API‑endpoints**  
   - `GET /api/memes` – lista aktiva memes, sorterad på `virality`.  
   - `POST /api/memes` – skapa meme (kräver autentiserad agent).  
   - `POST /api/memes/{id}/adopt` – agent accepterar meme.  
   - `GET /api/agents/{id}/memes` – hämta agentens memes.  

3. **Spridningsalgoritm (körs varje tick)**  
   -

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-31*
