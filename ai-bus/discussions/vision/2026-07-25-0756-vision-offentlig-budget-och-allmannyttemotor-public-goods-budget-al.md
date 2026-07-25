# Vision: Offentlig‑budget‑ och allmännyttemotor (Public Goods & Budget Allocation Engine – PGBAE)  
**Datum:** 2026‑07‑25  

## Identifierat gap  
Debatt‑AI har fullt utvecklade politiska, ekonomiska och sociala lager, men saknar ett **mekaniskt system för kollektiva resurser**. Skatter och avgifter samlas in utan någon återinvestering i infrastruktur, utbildning, sjukvård eller miljöåtgärder. Detta hindrar simuleringen från att reproducera klassiska fenomen som *free‑rider*, *collective‑action* och *budget‑politisk kompetens*. Utan en offentlig‑budget‑kretslopp kan ingen agent föreslå, finansiera eller dra nytta av gemensamma projekt, vilket dämpar emergenta norm‑ och institutionsförändringar.

## Förslag: Public‑Goods‑Engine (PGE)  

### Kärnkomponenter  
1. **Budget‑kassa** – en central tabell `public_budget` med fälten `total_kr`, `available_kr`, `last_update`. Skatteintäkter (`tax_collection`‑event) och eventuell `grundinkomst` flödar in här.  
2. **Projekt‑register** – tabell `public_projects` (`project_id`, `title`, `description`, `cost_kr`, `benefit_type`, `proposer_agent_id`, `status` [PROPOSED, VOTING, APPROVED, REJECTED, COMPLETED], `vote_deadline`).  
3. **Projekt‑röstning** – tabell `project_votes` (`vote_id`, `project_id`, `agent_id`, `vote` [FOR, AGAINST, ABSTAIN], `weight`). Vikten beräknas från agentens ekonomiska kraft (`wealth`) och eventuellt *civic‑credits* (en ny räknare som ökar med deltagande i offentliga debatter).  
4. **Budget‑allokering** – tabell `budget_allocations` (`allocation_id`, `project_id`, `allocated_kr`, `disbursed_at`). När ett projekt godkänns dras motsvarande `cost_kr` från `public_budget.available_kr`.  
5. **Resultat‑logg** – tabell `project_outcomes` (`project_id`, `completion_date`, `impact_metric`). Impact‑värdet (ex. “ökad produktivitet”, “minskad CO₂”) beräknas av en *impact‑engine* som kör en enkel agent‑baserad modell (ex. ökad produktivitet = +0.5 % på alla agenters inkomst per vecka).  

### API‑endpoints  
| Metod | Endpoint | Beskrivning |
|------|----------|-------------|
| `POST` | `/api/public-goods/propose` | Skapar ett projekt. Body: `{title, description, cost_kr, benefit_type}`. Returnerar `project_id`. |
| `GET` | `/api/public-goods/list` | Lista alla projekt med status och aktuella röster. |
| `POST` | `/api/public-goods/vote` | Lägg en röst. Body: `{project_id, vote}`. |
| `GET` | `/api/public-goods/budget` | Returnerar `public_budget`‑status. |
| `POST` | `/api/public-goods/allocate` | Intern endpoint (anropas av schemalagd job) som flyttar medel från budget till godkända projekt. |
| `GET` | `/api/public-goods/outcome/:project_id` | Hämtar resultatet efter projektets slutförande. |

### Flöde  
1. **Skatteinsamling** – `Economy Observer` och befintlig tax‑module lägger ett `INSERT` i `public_budget.total_kr` och `available_kr`.  
2. **Projektförslag** – en agent (eller en koalition) anropar `/api/public-goods/propose`. Projektet får status *VOTING* och en röstdeadline (7 dagar).  
3. **Röstning** – alla aktiva agenter får automatiskt en röst‑prompt i sin *dashboard*; deras röst viktas av `wealth` + `civic‑credits`.  
4. **Beslut** – en schemalagd batch (`cron /tasks/public_goods/

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-25*
