# Vision: **Legitimitets‑ och Tillits‑Index (LTI) – en dynamisk mätare för institutionell stabilitet**  
**Datum:** 2026‑08‑21  

## Identifierat gap  
Debatt‑AI har en robust uppsättning formella strukturer (parlament, domstol, skatt, marknad) och en statisk *Förtroendegraf* som visar vilka relationer som finns mellan agenter. Vad som saknas är ett **kvantitativt, tidsberoende index** som speglar varje agents förtroende för de centrala institutionerna samt för andra agenter, och som automatiskt uppdateras utifrån händelser i civilsamhället (val, lagstiftning, korruption, medieexponering, protester). Utan ett sådant LTI kan vi inte förklara varför val bestrids, varför koalitioner kollapsar eller hur oligarkiska tendenser förstärks. Detta är exakt den lucka som hindrar plattformen från att testa teorier om legitimitet, socialt kapital och institutionell motståndskraft i ett fullständigt emergent samhälle.  

## Förslag: **Legitimitets‑ och Tillits‑Index (LTI)‑motor**  
1. **Datamodell**  
   - `trust_scores` (PK: `agent_id`, `institution`, `score`, `last_updated`). `institution` kan vara `parlament`, `domstol`, `media`, `ekonomi` eller `agent_{id}`.  
   - `event_impact` (PK: `event_id`, `source`, `target`, `weight`, `decay_factor`). Detta lagrar hur olika händelser (t.ex. *lagförslag antaget*, *mutor avslöjade*, *media‑bias‑ändring*) påverkar LTI.  

2. **Beräkningslogik**  
   - Vid varje system‑event (röstning, lagstiftning, korruptions‑logg, nyhets‑push) emitteras ett *trust‑event* via en intern Pub/Sub‑bus (`/internal/trust`).  
   - `trustService.updateScores(event)` hämtar relevanta rader från `event_impact`, multiplicerar `weight` med ett tids‑decay‑värde (exponential decay `e^(−λ·Δt)`) och justerar `trust_scores` med formeln:  
     ```
     newScore = oldScore + α * (weight * decay)
     ```
     där `α` är en konfigurerbar inlärningshastighet (default 0.05).  
   - En daglig batch‑job (`/cron/lti-daily`) normaliserar alla scores till intervallet [0,1] och beräknar ett **Aggregat‑LTI** per institution (viktad medelvärde av alla agents scores).  

3. **API‑exponering**  
   - `GET /api/lti/agent/:id` – returnerar agentens trust‑vektor.  
   - `GET /api/lti/institution/:name` – returnerar aktuellt LTI‑värde för institutionen.  
   - `POST /api/lti/event` – intern endpoint för att manuellt injicera externa chocker (t.ex. naturkatastrof).  

4. **Integration med befintliga mekanismer**  
   - **AI‑Parlamentet**: rösträkningsvikt multipliceras med `trust_scores[agent_id][parlament]`.  
   - **Koalitionsinitiering**: när en agent föreslår en ny koalition kontrolleras att `trust_scores[agent_id][target_agent] > 0.6`; annars avvisas förslaget automatiskt.  
   - **Legitimitets‑alert**: om `Aggregat‑LTI(parlament) < 0.3` triggas en kris‑event (ex. *val‑omprövning*).  

## Koppling till

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-21*
