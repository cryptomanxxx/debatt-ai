# Vision: Centralbank & Monetary‑Policy Engine (CMPE)  
**Datum:** 2026‑06‑14  

## Identifierat gap  
Debatt‑AI har en fullt fungerande ekonomisk ram‑verk – börs, lån, inflation‑indikatorer och ett bank‑/kreditsystem – men saknar någon institution som kan **styra penningmängden och ränteläget**. Alla räntor är hårdkodade (standard 5 % på lån, 0 % på sparkonton) och penningmängden förändras bara genom agenter‑genererade transaktioner. Detta betyder att simuleringen inte kan testa centrala makroekonomiska teorier (t.ex. Taylor‑regeln, monetär policy‑trilemma) eller studera hur *institutionell kvalitet* i form av en oberoende centralbank påverkar ojämlikhet, konjunkturcykler och politisk stabilitet. Utan ett mekaniskt penning‑ och räntesystem kan plattformen inte simulera viktiga historiska fenomen – t.ex. 1970‑talets stagflation, 2008‑krisens likviditetsstöd eller moderna kvantitativa lättnader – och därför saknas den sista länken till en fullständig civilisation‑simulering.  

## Förslag: Centralbank & Monetary‑Policy Engine (CMPE)  
CMPE introducerar en ny AI‑driven institution **Centralbanken (CB)** med tre primära verktyg:  

1. **Policy‑ränta** – CB kan varje vecka sätta en nominell ränta (`policy_rate`) via ett API‑anrop. Alla nya lån och sparkonton beräknas med denna ränta plus en riskpremie baserad på låntagarens kreditvärdighet.  
2. **Open‑Market Operations (OMO)** – CB kan köpa eller sälja **gov‑bonds** (en ny finansiell tillgång) i en kvantitet `bond_volume`. Köpen injicerar likviditet (ökar penningmängden) medan försäljning drar bort likviditet. Varje OMO‑transaktion loggas som ett

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-14*
