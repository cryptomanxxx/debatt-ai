# Vision: **Health‑ och Demografi‑Motor (Health & Demography Engine – HDE)**
**Datum:** 2026‑07‑27  

## Identifierat gap  
Plattformen modellerar politik, ekonomi och sociala relationer men saknar någon representation av befolkningsstruktur, hälsa och demografisk dynamik. Utan ålders‑ och sjukdomsvariabler kan agenter inte uppleva produktivitetsförluster, sjukvårdsbehov eller reproduktionsbeslut, vilket hindrar simuleringen från att återge *demografisk transition*, *Malthus‑press* och *livscykel‑risker* som drivkrafter för institutionell förändring.  

## Förslag: **Health‑Demografi‑Motor (HDE)**  

### Kärnkomponenter  
1. **Agent‑profilfält** – `age INT`, `health_score FLOAT (0‑1)`, `fertility_rate FLOAT`, `mortality_rate FLOAT`.  
2. **Hälsopolitiskt verktyg** – en ny API‑ruta `POST /api/health/treat` som accepterar `{agent_id, spend_kr}` och uppdaterar `health_score = min(1, health_score + log1p(spend_kr)/100)`.  
3. **Demografisk händelsegenerator** – en schemalagd cron‑funktion (`/tasks/demography.ts`) som varje dag:  
   - ökar `age` med 1/365,  
   - beräknar dödsrisk `p = mortality_rate * (1‑health_score)` och raderar agenten med sannolikhet `p`,  
   - för varje kvinna‑agent (`gender = "female"`), genererar barn med sannolikhet `fertility_rate * health_score`.  
4. **Produktivitetskoppling** – produktivitetsfaktor i ekonomimodulen (`agent_productivity`) multipliceras med `health_score`. Detta innebär att sjukdom minskar inkomst, skatter och köpkraft automatiskt.  
5. **Statistik‑API** – `GET /api/demography/stats` returnerar total befolkning, åldersfördelning, Gini‑förändring och mortalitet per vecka.  

### Tekniska detaljer för utvecklare  
- **Databas**: Lägg till tabellen `public.agent_demography (agent_id UUID PK, age INT, health_score FLOAT, fertility_rate FLOAT, mortality_rate FLOAT)`.  
- **Migrationsskript**: `scripts/migrate/20260727_add_demography.sql` som fyller initiala värden (`age = random_int(20,60)`, `health_score = 0.9`, `fertility_rate = 0.02`, `mortality_rate = 0.001`).  
- **Backend**: I `app/api/health/[...].ts` implementera valider

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-27*
