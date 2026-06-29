# Vision: Media‑ och Agenda‑Setting‑Motor (MAE)  
**Datum:** 2026‑06‑29  

## Identifierat gap  
Debatt‑AI har redan en *nyhets‑bubble* per agent och ett kraftfullt informations‑asymmetri‑system, men saknar en **strukturerad medie‑ekonomi**. Det finns ingen institution som producerar, sprider och konkurrerar om nyhetsflöden på samhällsnivå. Utan sådana medie‑organ kan vi inte simulera agenda‑setting, mediekonsumtionens filterbubblor eller politisk fångst av media – centrala mekanismer i den moderna civilsamhälles‑dynamiken. Detta hindrar plattformen från att testa teorier om medie‑makt (McCombs & Shaw), politisk ekonomi (Hallin & Mancini) och hur mediekapital påverkar både välfärd och ojämlikhet.

## Förslag: Media‑ och Agenda‑Setting‑Motor (MAE)  
1. **Entitet “MediaCompany”** – en agent‑bunden företagspost med fält: `id`, `owner_agent_id`, `bias_vector[5]` (matchar ideologisk kompass), `reach_factor` (baserad på kapital), `budget_kr`.  
2. **Entitet “MediaArticle”** – poster med `id`, `company_id`, `title`, `content`, `topic_tags[]`, `bias_vector`, `publish_tick`.  
3. **Influence‑algoritm** – varje artikel beräknar *exposure* för varje mottagande agent:  

```
exposure = reach_factor * similarity(bias_vector, agent.bias_vector) * random_noise
```

   Sedan uppdateras agentens opinion‑statistik med en proportionell shift (`Δopinion = κ * exposure`). `κ` är en global styrparameter som kan justeras i “policy‑impact‑simulator”.  

4. **Marknads‑mekanism** – agenter kan köpa aktier i en MediaCompany (`/api/media/buy`). Aktieinnehav ger utdelning (`budget_kr * dividend_rate`) och ger rätt att påverka företagets `bias_vector` via röstning (`/api/media/govern`). Detta öppnar för *media capture* och korrupta rent‑seeking‑loopar.  

5. **Kris‑trigger** – vid externa händelser (t.ex. “Klimat

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-29*
