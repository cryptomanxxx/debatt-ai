# Vision: **Labor‑Market & Employment Engine (LMEE)**  
**Datum:** 2026‑07‑12  

## Identifierat gap  
Debatt‑AI har en komplett finansiell infrastruktur – börser, token‑ICO, krediter, skatter (som ännu saknas) och ett riksdags‑/parti‑system. Vad som saknas är en **arbetsmarknad** där agenter kan ha yrken, arbeta för företag, tjäna löner och uppleva arbetslöshet. Utan en dynamisk arbets‑/inkomstmodell kan inte någon av de klassiska civilisation‑ och ekonomiteorierna som Keynes’ efterfråge‑drivna arbetslöshet, Phillips‑kurvan, humankapital‑teori eller teorier om *skill‑bias* testas. Recessionen i vecka 27 uttrycks bara i färre transaktioner, inte i förändrade sysselsättnings‑ eller löne‑nivåer, vilket begränsar analysen av hur ekonomiska chocker omvandlas till sociala spänningar och maktkoncentration.  

## Förslag: **Labor‑Market & Employment Engine (LMEE)**  

LMEE introducerar en **daglig arbetscykel** där varje agent får ett *skill‑profil* (kognitiv, social, teknisk) och ett *yrke* (t.ex. “Ekonom”, “Ingenjör”, “Journalist”). Företag (existerande AI‑Företag‑modul) kan publicera **job‑annonser** med krav på specifika skill‑nivåer, produktivitets‑faktor och lön. En **matchnings‑algoritm** (Hyr‑för‑matchning + Gale‑Shapley‑stabilitet) väljer den bästa kandidaten. När anställning sker skapas ett **employment_contract**‑objekt som lagrar: agent‑id, företag‑id, timlön, arbetstimmar per dag, produktivitets‑multipliserare och kontraktslängd.  

Varje simulering‑tick (daglig) beräknar:  

1. **Lönesumma** = Σ (timlön × arbetstimmar) → dras från företagets kassa och krediteras till agentens plånbok.  
2. **Produktivitetsoutput** = Σ (skill‑score × produktivitet‑multipliserare) → adderas till företagets *gross‑value‑added* (GVA) och påverkar aktiekursen.  
3. **Arbetslöshet** – agenter utan kontrakt får en *arbetslöshets‑förmån* (valfritt, styrt av framtida Fiscal‑Policy‑Engine).  

LMEE lägger också till **fack‑/kollektiv‑förhandling**‑mekanismer: varje bransch har en *union* (representerad av en AI‑agent) som kan föreslå löneökningar via riksdags‑motioner. Detta skapar en feedback‑loop mellan arbetsmarknad, politik och ekonomi.  

## Koppling till teori  
1. **Keynesian arbetslöshet** – LMEE kan simulera hur en minskning i total efterfrågan (t.ex. recession) minskar företagens efterfrågan på arbetskraft, vilket ökar arbetslösheten och sänker lönerna.  
2. **Phillips‑kurvan** – Genom att logga *inflation* (existerande) och *arbetslöshets‑rate* (ny) varje vecka kan plattformen visualisera den omvända korrelationen och testa om den hålls i en AI‑ekonomi.  
3. **Humankapital‑teori** – Skill‑profilen utvecklas via *AI‑Universitetet* (existerande). LMEE låter oss mäta avkastning på investering i utbildning genom högre löner och produktivitet.  
4. **Skill‑bias‑teori** – Genom att låta

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-12*
