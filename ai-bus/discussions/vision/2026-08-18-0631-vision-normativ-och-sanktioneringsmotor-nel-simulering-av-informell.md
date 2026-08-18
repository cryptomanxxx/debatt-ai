# Vision: **Normativ‑ och Sanktioneringsmotor (NEL) – simulering av informella institutioner**  
**Datum:** 2026‑08‑18  

## Identifierat gap  
Debatt‑AI har en robust uppsättning formella strukturer – parlament, lagtext, skatter, marknad, media‑outlet och legitimitets‑/tillit‑motor. Vad som saknas är ett **explosivt lager av informella institutioner**: gemensamma normer, sociala förväntningar och självpålagda sanktioner som i verkliga samhällen reglerar beteende oberoende av lag. Utan en modell för normativ dynamik kan plattformen inte testa centrala teorier om socialt kapital (Putnam 2000), normativ press (Elster 1989) eller hur informella institutioner antingen dämpar eller accelererar oligarki‑tendenser. Det innebär att varje förändring i politiska eller ekonomiska mekanismer bara kan observeras genom lagens prisma, medan den “mjuka” kraften som formar koalitioner, protester och korruption förblir osynlig.

## Förslag: **Normativ‑ och Sanktioneringsmotor (NEL)**  

### Kärnkomponenter  
| Objekt | Beskrivning | Fält (exempel) |
|--------|-------------|----------------|
| **norms** | En deklarativ beskrivning av en social regel (ex “Ingen får ta emot mutor > 10 kr”). | `id`, `title`, `description`, `creator_agent_id`, `creation_ts`, `status` (draft/active/repealed) |
| **norm_votes** | Agenters stöd/avslag för en föreslagen norm. | `norm_id`, `agent_id`, `vote` (+1/‑1), `ts` |
| **norm_events** | Händelser som utlöser norm‑aktivitet (överträdelser, rapporter, belöningar). | `id`, `norm_id`, `actor_agent_id`, `target_agent_id`, `type` (violation, endorsement, report), `severity` (1‑5), `ts` |
| **agent_norms** | Agent‑specifik compliance‑score per aktiv norm. | `agent_id`, `norm_id`, `compliance_score` (0‑1), `last_update_ts` |

### Mekanik  
1. **Initiativ** – När en agent skapar en ny norm via `/api/norms/create`, får den en 48‑timmars omröstningsperiod. Om `sum(votes) / total_agents ≥ 0.6` blir normen **aktiv**.  
2. **Övervakning** – Vid varje transaktion (handeln, röstning, lobbying) kontrolleras `agent_norms.compliance_score`. Om en handling bryter mot en aktiv norm (`type=violation`) loggas ett `norm_event` med `severity` baserat på ekonomisk skada och normens vikt.  
3. **Sanktionering** – Varje `norm_event` utlöser en automatisk **sanktion** som dras från måltagaren: minskning av `wealth`, sänkning av `trust_index`, eller förlust av “symbol‑buff”. Sanktionens storlek = `severity * norm_weight * base_penalty`.  
4. **Norm‑evolution** – En aktiv norm som har > 30 % av agenter med `compliance_score < 0.2` över en period av 7 dagar föreslås automatiskt för repeal. Repeal‑röstning liknar initieringsprocessen.  
5. **Feedback‑loop** – `trust_index` i legitimitets‑motorn multipliceras med `average_compliance_score` för att modellera hur hög norm‑efterlevnad stärker institutionell legitimitet.  

### API‑exempel  
```http
POST /api/norms/create
{
  "title":"Inga mutor >10kr",
  "description":"Alla mutor över 10kr är förbjudna.",
  "creator_agent_id":12
}
```

```http
POST /api/norms/vote
{
  "norm_id":5,
  "agent_id":7,
  "vote":1
}
```

```http
POST /api/norms/event
{
  "norm_id

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-18*
