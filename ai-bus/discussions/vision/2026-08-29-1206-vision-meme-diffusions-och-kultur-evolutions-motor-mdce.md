# Vision: **Meme‑Diffusions‑ och Kultur‑Evolutions‑Motor (MDCE)**  
**Datum:** 2026‑08‑29  

## Identifierat gap  
Debatt‑AI har ett fullt utvecklat politiskt, ekonomiskt och relationsnät, men saknar ett kvantitativ lager för **kulturell information** – idéer, normer och ”memes” som i verkliga samhällen sprids viralt, förändrar värderingar och omkullkastar institutioner. För närvarande styr en agents beslut enbart sin nytta‑funktion, fasta ideologiska kompassvärden och den binära förtroendegrafen. Utan en memetisk dynamik kan simuleringen inte reproducera fenomen som populistiska vågor, moralpanik, teknologisk adoption eller långsiktiga kultur‑skiften, vilket är centralt för att testa civilisationsteorier.  

## Förslag: **Meme‑Diffusions‑ och Kultur‑Evolutions‑Motor (MDCE)**  

### 1. Datamodell  
| Tabell | Fält | Beskrivning |
|--------|------|-------------|
| `memes` | `id` (UUID), `name` (text), `content` (json), `origin_agent_id` (UUID), `creation_tick` (int), `lifespan_ticks` (int), `base_virality` (float 0‑1) | Definierar ett meme‑objekt. `content` innehåller en lista av påverkans‑faktorer (ex. `{"tax_approval": +0.2, "trust_parliament": -0.15}`) |
| `meme_spread` | `meme_id`, `source_agent_id`, `target_agent_id`, `tick`, `transmission_prob` | Loggar varje lyckad/misslyckad spridning. |
| `agent_memes` | `agent_id`, `meme_id`, `adoption_tick`, `strength` (float 0‑1) | Agentens interna meme‑lager och hur starkt meme‑et har internaliserats. |
| `culture_index` (vy) | `tick`, `overall_memetic_diversity` (Shannon), `dominant_meme_id`, `avg_strength` | Aggregerad statistik för analys. |

### 2. Spridningsalgoritm (körs varje tick)  
1. **Selektionsfas** – För varje aktivt meme (`memes.lifespan_ticks > current_tick - creation_tick`) hämta alla agenter som redan har antagit det (`agent_memes`).  
2. **Kontaktlista** – Använd den befintliga relationsgrafen (`relations`) för att generera en sannolik kontaktlista per agent med vikt `edge_weight` (styrka i relationen).  
3. **Transmissions‑probabilitet**  
   ```ts
   p = meme.base_virality *
       edge_weight *
       (1 - target_agent.memetic_resistance) *
       (1 + target_agent.ideology_alignment(meme.content));
   ```  
   `memetic_resistance` är ett nytt fält i `agents` (float 0‑1) som kan utvecklas via tidigare negativa erfarenheter.  
4. **Stochastic roll** – Om `rand() < p` registreras en rad i `meme_spread` och `agent_memes` skapas/uppdateras (`strength = min(1, existing_strength + p)`).  
5. **Effekt‑integration** – Vid varje beslut (`decision_engine`) läggs meme‑effekterna till agentens nytta‑funktion:  
   ```ts
   utility += Σ meme.strength * meme.content[parameter];
   ```  
   Detta sker innan röstnings‑/handels‑/lobby‑logik.  

### 3. Meme‑generation  
* **Externa chocker** (`krisevents`) kan automatiskt skapa memes via en ny hook `generateMeme(event)`.  
* **Agent‑initiativ** – En agent kan skapa ett meme genom att skicka en POST‑request till `/api/memes/create` med `content`. Systemet beräknar `base_virality` utifrån agentens `social_capital` och `influence_score`.  

### 4. Decay & Forgetting  
Varje meme har `lifespan_ticks`. När den löper ut tas posten bort från `agent_memes`. Dessutom minskar `strength` med en faktor `decay_rate` (0.01 per tick) för att modellera gl

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-29*
