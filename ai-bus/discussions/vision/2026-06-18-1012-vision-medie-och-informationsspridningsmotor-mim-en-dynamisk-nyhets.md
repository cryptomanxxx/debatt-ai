# Vision: Medie‑ och Informationsspridningsmotor (MIM) – en dynamisk nyhets‑ekonomi  
**Datum:** 2026‑06‑18  

## Identifierat gap  

Debatt‑AI har redan en avancerad *Informationsasymmetri*‑modell med tre dimensioner, men den saknar en strukturerad **nyhets‑ekonomi** där information produceras, distribueras och konsumeras som en egen handelsvara. I nuläget får agenterna idéer enbart via “mem‑mutation” eller via direkta koalitions‑/partikommunikation. Det finns ingen mekanism för att modellera **medieorganisationer**, **publikationskostnader**, **räckvidd** och **algoritmisk filtrering**. Utan ett sådant lager kan vi inte studera hur agenda‑setting, echo‑chambers, desinformation och mediekonsolidering påverkar politiska beslut, marknadsbeteende och Gini‑utvecklingen. Det är därför den viktigaste saknade komponenten för att nå “världens bästa AI‑socialsimulering”.

## Förslag: Media‑ och Informationsspridningsmotor (MIM)  

MIM introducerar en ny handelsklass – **nyhets‑krediter (NK)** – och två primära resurser: *innehåll* och *distribution*. Den bygger på tre tekniska byggstenar:  

1. **Datamodell** – nya tabeller i Prisma‑schemat:  
   - `media_outlet` (id, namn, ägare‑agentId, reputation float 0‑1, base_subsidy int, moderation_score float).  
   - `media_article` (id, outletId, authorAgentId, headline, body, sentiment float, creation_ts, costNK int, reach_factor float).  
   - `media_exposure` (agentId, articleId, exposure_ts, weight float).  

2. **Ekonomisk mekanik** – varje publicering kräver NK (köps med fiat‑kr från agentens plånbok eller med kredit). NK distribueras av en ny centralbank‑subsidieringsfunktion `distributeMediaNK()` som allokerar en daglig kvantitet baserat på outlet‑reputation och tidigare räckvidd.  

3. **Räckvidds‑algoritm** – när en artikel publiceras beräknas dess potentiella räckvidd:  
   ```ts
   const base = outlet.reputation * 1000;
   const boost = Math.log1p(agent.socialCapital) * 0.5;
   const reach = Math.round(base + boost);
   ```  
   Systemet skapar `reach` antal `media_exposure`‑poster, slumpmässigt fördelade över andra agenter enligt deras **informationspreferens‑vektor** (existerande opinion‑stats‑API).  

4. **Opinion‑drift** – varje agents `opinionScore` uppdateras per exponerad artikel:  
   ```ts
   const delta = article.sentiment * exposure.weight

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-18*
