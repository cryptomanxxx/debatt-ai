# Vision: **Memetisk Spridningsmotor – Opinion Diffusion Engine (ODE)**
**Datum:** 2026‑08‑08  

## Identifierat gap  
Debatt‑AI har en rik nyhets‑ och informationsinfrastruktur samt en detaljerad rykten‑spridningsmodul, men saknar ett **explicit, nätverksbaserat spridningssystem för idéer och “memes”.** Nuvarande informationsflöden levereras som en bulk‑feed till varje agent och påverkar opinionen endast via aggregerade sentiment‑värden. Detta hindrar plattformen från att studera centrala fenomen som *kritisk mass‑adoption*, *kaskadeffekter*, *sociala förstärkningar* och *polarisering* som beskrivs i Granovetters tröskel‑modell, Axelrod’s kultur‑spridning och epidemiska SIR‑modeller för memes. Utan en mekanism som räknar varje agents exponering och beräknar adoption under hänsyn till nätverkets topologi och homofili, kan vi inte testa teorier om hur idéer ”viraliseras” eller hur koalitioner omformas av idéflöden.

## Förslag: **Opinion Diffusion Engine (ODE)**  

ODE introducerar en **tidssteg‑baserad diffusion‑loop** i simuleringens kärna. På varje tick (exempelvis varje timme i sim‑tiden) utförs följande steg:

1. **Idégenerering** – En ny idé skapas via `/api/diffusion/ideas/create` med attribut:  
   - `idea_id` (UUID)  
   - `creator_agent_id`  
   - `topic_tag` (referens till befintliga `tags`)  
   - `initial_utility` (numerisk baseline‑värde)  
   - `adoption_threshold` (Granovetter‑tröskel, 0‑1)  
   - `decay_rate` (för fallande attraktionskraft)

2. **Exponering** – För varje agent `A` identifieras sina *närmaste grannar* i `relationsgrafen` (max 5 starkaste kanter). En post i tabellen `idea_exposures` registreras:
   ```sql
   INSERT INTO idea_exposures (idea_id, agent_id, source_agent_id, exposure_ts)
   VALUES ($idea, $agent, $source, now());
   ```
   Samtidigt räknas hur många av A:s grannar redan har adopterat idén (`adopted = TRUE`).

3. **Adoptionsbeslut** – Agenten beräknar sannolikheten `p = sigmoid( (k / total_neighbors) - threshold )`, där `k` är antalet adopterande grannar.  
   - Om `random() < p` uppdateras `agent_opinions[topic_tag] += influence_factor` och en rad i `idea_adoptions` sparas.  
   - `influence_factor` kan justeras av agentens personlighet (t.ex. *open‑mindedness*).

4. **Decay & Forgetting** – Idéns `current_utility` multipliceras med `(1 - decay_rate)`; idéer som faller under `utility_min` tas automatiskt ur exponeringstabellen.

5. **Mätvärden** – Efter varje tick beräknas:
   - *Adoptionskurva* (`cumulative_adoptions`)  
   - *R0‑värde* (genomsnittligt antal nya exponeringar per adoption)  
   - *

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-08*
