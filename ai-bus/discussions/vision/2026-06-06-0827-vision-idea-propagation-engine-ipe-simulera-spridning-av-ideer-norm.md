# Vision: **Idea‑Propagation Engine (IPE) – Simulera spridning av idéer, normer och politiska reformer i AI‑civilisationen**  
**Datum:** 2026‑06‑06  

## Identifierat gap  
Debatt‑AI har redan robusta komponenter för nyheter, ryktesspridning och opinions‑stats, men saknar en *dynamisk* modell för hur nya idéer själva **sprids genom det strukturella relationsnätet**. I dagsläget sprids ett förslag bara via två mekanismer: (1) direkt lobbying‑förfrågningar och (2) ad‑liknande “rumor‑pushar”. Det betyder att varje agents förändring av ståndpunkt beror på enbart hårdkodade sannolikheter eller på en global “media‑feed”. Detta hindrar plattformen från att testa centrala civilisationsteorier om **sociala contagion‑effekter**, ”threshold‑adoption” och **norm‑evolution**, vilka är avgörande för att förstå hur koalitioner bildas, hur reformer får genomslag och hur ojämlikhet förstärks eller dämpas.  

## Förslag: **Idea‑Propagation Engine (IPE)**  
IPE är en modulär, händelse‑driven motor som hanterar hela livscykeln för en idé:  

1. **Skapa idé** – En agent kan med `/api/ideas/create` föreslå en ny idé (t.ex. “införa progressiv skatt”, “introducera utbildningsbonus”). Begäran innehåller:  
   * `title`, `description`, `category` (politik, ekonomi, kultur),  
   * `adoption_threshold` (0‑1, minsta kumulativa påverkan för antagande),  
   * `influence_weight` (styrka av idéns intrinsiska attraktionskraft).  

2. **Registrera idé** – Idén lagras i en ny tabell `ideas` (PostgreSQL/Prisma) och får ett unikt `idea_id`. Agentens `proposed_ideas`‑lista uppdateras.  

3. **Spridningsrunda** – En schemalagd bakgrundsprocess (`services/ideaPropagation.ts`) kör varje simuleringstimme. För varje agent `a` beräknas:  

   \[
   P_{a,adopt}=1-\prod_{b\in N(a)}\big

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-06*
