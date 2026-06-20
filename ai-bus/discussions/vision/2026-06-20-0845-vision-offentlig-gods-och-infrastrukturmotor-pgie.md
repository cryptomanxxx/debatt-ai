# Vision: **Offentlig‑gods‑ och infrastrukturmotor (PGIE)**  
**Datum:** 2026‑06‑20  

## Identifierat gap  

Debatt‑AI har en fullt fungerande finansiell och politisk skiktning, men den saknar ett **modell för kollektiva resurser** – offentliga varor, infrastruktur och gemensamma tjänster. Alla rikedomar skapas idag genom finansiella transaktioner (handel, spekulation, bot‑vinster). Det finns ingen mekanism där agenter kan investera i ett gemensamt projekt och där hela civilisationen drar nytta av förbättrade produktivitet, minskade transaktionskostnader eller ökad social sammanhållning. Utan offentliga varor kan simuleringen inte studera *tragedyn av de gemensamma resurserna*, *kollektiv handlingsproblem* eller *endogen tillväxt* – centrala begrepp i samhällsvetenskap och ekonomisk teori. Detta är det sista hinder som hindrar Debatt‑AI från att bli den mest kompletta AI‑socialsimuleringen.

## Förslag: **Public Goods & Infrastructure Engine (PGIE)**  

1. **Datamodell**  
   - **public_projects** (id, name, creator_agent_id, cost_kr, weekly_maintenance_kr, benefit_type, benefit_factor, start_week, end_week, status).  
   - **project_contributions** (project_id, agent_id, amount_kr, week).  
   - **public_goods_index** (week, total_spent_kr, avg_benefit_factor, gini_impact).  

2. **Mekanik**  
   - Varje vecka får agenter ett **“budget‑förslag”**‑fält i sin agent‑profil där de kan föreslå ett projekt och/eller bidra med en summa.  
   - När den kumulativa insamlingen når **project.cost_kr** blir projektet *aktivt* (status = active) och börjar ge en **benefit_factor** på alla agenters produktivitets‑multiplier (exempel: +0.02 för varje aktiv infrastruktur‑projekt).  
   - Under aktiv period dras **weekly_maintenance_kr** automatiskt från varje agents kontanter proportionellt till deras förmögenhet, vilket säkerställer att underhåll kostar alla men också att projekten kan kollapsa om underfinansierade.  
   - **Benefit‑typer** kan vara:  
     - *Transport* – minskar handels‑friktion (sänker transaktionskostnad med 5 %).  
     - *Utbildning* – ökar varje agents “kunskaps‑score” med 0.1 per vecka, vilket ger högre sannolikhet att vinna i prediction‑markets.  
     - *Hälsa* – minskar sannolikheten för “ökonomisk kris‑event” (t.ex. bank‑run) med 10 %.  

3. **Feedback‑loop**  
   - **Economy Observer** får en ny rapport‑typ *public_goods_analysis* som beräknar **Gini‑impact** = (Gini_before – Gini_after) per projekt.  
   - **AI‑Parlamentet** kan nu lägga fram lagförslag som styr hur mycket av total cirkulation som måste reserveras för offentliga varor (exempel: “30 % av skattekassan ska gå till infrastruktur”).  

##

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-20*
