# Vision: **Corruption‑ och rent‑seeking‑motor (CRSE)**  
**Datum:** 2026‑06‑13  

## Identifierat gap  
Debatt‑AI har en fullt fungerande politisk maskin – AI‑Parlamentet, lobby‑systemet och en konstitutionell domstol. Vad som saknas är en **mekanism för korruption och rent‑seeking**. I den nuvarande modellen påverkas besluten enbart av ideologisk kompass, röststyrka och formella lobby‑budgetar. I verkliga civilisationer makt kan köpas, resurser kan omdirigeras via mutor eller nepotism, och dessa “informella” institutioner har avgörande inverkan på ojämlikhet, tillväxt och politisk stabilitet. Utan en korruptionsmotor kan simuleringen aldrig testa teorier om institutional kvalitet (North, 1990), rent‑seeking (Tullock, 1967) eller den dynamik som binder ekonomisk koncentration till politisk makt. Detta är det sista strukturella elementet som hindrar Debatt‑AI från att bli den *världsledande* AI‑socialsimuleringen.  

## Förslag: **Corruption‑ och rent‑seeking‑motor (CRSE)**  
CRSE lägger till tre sammankopplade komponenter:  

1. **Bribebutik** – varje agent kan avsätta en del av sin förmögenhet (max 10 % per vecka) till ett *bribe‑pool* med syfte att influera ett specifikt lagförslag eller ministeri.  
2. **Korruptions‑viktör** – varje röst i AI‑Parlamentet får en dynamisk vikt `voteWeight = baseWeight × (1 + κ·bribeScore)`. `bribeScore` är den kumulativa summa av bribes som mottagits från samma avsändare under den pågående lagperioden. `κ` är en konfigurerbar konstant (standard 0.05).  
3. **Domstols‑kontroll** – AI‑Domstolen kan initiera en *corruption audit* när en agents bribe‑score överstiger ett tröskelvärde (t.ex. 15 % av total förmögenhet). Auditen kan leda till straff: konfiskering av bribe‑pool, minskad röstvikt (negativ multiplier) och en offentlig “corruption‑badge” som minskar agentens trovärdighet i nyhetsflödet.  

**Data‑modell**  

| Tabell | Fält | Beskrivning |
|--------|------|-------------|
| `bribe_offers` | `id`, `giver_agent_id`, `receiver_agent_id`, `proposal_id`, `amount_kr`, `timestamp` | Registrerar varje muta. |
| `bribe_scores` | `agent_id`, `period_id`, `total_bribe_kr` | Aggregerad summa per lagperiod. |
| `corruption_cases` | `case_id`, `target_agent_id`, `initiator_agent_id`, `severity`, `outcome`, `timestamp` | Resultat av domstols‑audit. |

**API‑endpoints**  

- `POST /api/corruption/offer` – validerar att `amount_kr ≤

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-13*
