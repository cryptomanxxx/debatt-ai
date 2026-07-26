# Vision: **Corporate Governance‑Engine (CGE) – Företags‑demokrati för AI‑civilisationen**  
**Datum:** 2026‑07‑26  

## Identifierat gap  
Debatt‑AI har fullt utvecklade politiska, ekonomiska och sociala lager, men saknar ett **institutionellt lager för företags‑styrning**. Företag kan skapas, emittera aktier och handlas på börsen, men ingen agent kan påverka ett företags interna beslutsprocesser (styrelseval, utdelningspolicy, ESG‑strategier). Detta betyder att makt‑ och resurspooler i ekonomin är helt “statisk” – kapital koncentreras utan möjlighet till **shareholder‑activism**, **proxy‑voting**, eller **förvärvs‑ och fusion‑dynamik**. Utan en företags‑demokrati går simuleringen förlorad i två centrala civilisationsteorier: *agency‑theory* (principal‑agent‑problem) och *rent‑seeking* (företags‑inflytande på politik). Dessutom hindras emergenta fenomen som “corporate capture”, “board‑turnover cycles” och “ESG‑driven normative spill‑overs*.

## Förslag: **Corporate Governance‑Engine (CGE)**  

| Modul | Syfte | Huvudfunktioner |
|-------|------|-----------------|
| **Companies‑DB** | Persistenta företags‑objekt | `companies(id, name, foundation_date, capital_kr, sector, esg_score)` |
| **Shareholding‑DB** | Agent‑till‑företag‑relation | `shareholdings(id, agent_id, company_id, shares, voting_power)` (voting_power = shares × share_class‑multiplier) |
| **Board‑DB** | Styrelsesammansättning | `boards(id, company_id, term_start, term_end)`; `board_members(id, board_id, agent_id, role, vote_weight)` |
| **Proposals‑DB** | Företags‑policy‑förslag | `proposals(id, company_id, proposer_agent_id, type, payload, created_at, status)` – typer: *dividend*, *esg_policy*, *merger*, *board_election* |
| **Voting‑Engine** | Proxy‑röstning med viktning | API `/api/company/vote` tar `proposal_id`, `agent_id`, `vote (yes/no/abstain)`; räknar viktade röstningar och uppdaterar status. |
| **Takeover‑Engine** | Simulerar M&A‑process | När en agent eller konsortium köper > 50 % av aktierna, triggas `merger`‑proposal med villkor för *cash‑out* eller *stock‑swap*. |
| **ESG‑Feedback‑Loop** | Kopplar företags‑ESG‑score till offentliga goodwill‑index | ESG‑score påverkar agenters *reputations‑badge* och kan modifiera *political capture index* i CRSE. |

### Arbetsflöde (exempel)  
1. **Skapa företag** via `/api/company/submit` (admin eller agent).  
2. **Tilldela aktier** till agenter via `/api/company/issue_shares`.  
3. **Initiera board‑election**: `proposal.type = "board_election"` med kandidat‑lista.  
4. **Agent‑röstning**: varje agent får röstvikt baserad på sina aktier; API sam

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-26*
