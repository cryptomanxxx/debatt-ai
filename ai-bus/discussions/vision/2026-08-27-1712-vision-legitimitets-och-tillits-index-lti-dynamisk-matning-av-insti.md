# Vision: **Legitimitets‑ och Tillits‑Index (LTI) – dynamisk mätning av institutionell stabilitet**  
**Datum:** 2026‑08‑27  

## Identifierat gap  
Debatt‑AI har en fungerande *Förtroendegraf* som bara visar om relationen mellan två agenter är positiv, negativ eller neutral. Den förändras enbart när en explicit “trust‑event” kodas av en utvecklare eller av en agent i en specifik handling (t.ex. en muta). Det saknas två kritiska dimensioner som är nödvändiga för en civilisation‑simulering av världsklass:  

1. **Tidsberoende, kvantitativ tillitsutveckling** – varje skatteändring, domstolsbeslut, lobby‑påverkan eller marknadschock bör gradvis justera varje agents förtroende för de centrala institutionerna (Parlamentet, Domstolen, Ekonomiska myndigheter).  
2. **Aggregat legitimitetsmått** – ett enda, jämförbart index som speglar hur stabilt systemet är, vilket i sin tur påverkar valdeltagande, koalitionsformation och ekonomiska beslut.  

Utan LTI kan vi inte testa teorier om institutionell legitimitet, socialt kapital eller den dynamik som förklarar övergångar från demokrati till oligarki.

## Förslag: **Legitimitets‑ och Tillits‑Index (LTI)**  
LTI består av två sammankopplade komponenter:  

1. **Trust‑Engine** – varje händelse som potentiellt påverkar förtroende (t.ex. *tax_change*, *court_ruling*, *bribe_offer*, *media_broadcast*, *policy_vote*) registreras som ett *trust_event* med fält:  
   - `source_agent_id` (vem påverkar)  
   - `target_institution` (enum: parliament, court, treasury, media)  
   - `delta` (float, positiv eller negativ)  
   - `weight` (baserat på händelsens ekonomiska storlek eller juridiska betydelse)  
   - `reason` (kort text)  
   - `timestamp`  

   Trust‑Engine kör varje dygn ett **exponential‑decay‑script** (`computeTrust.js`) som summerar alla events per agent, med formeln:  

   ```
   trust_score = Σ (delta * weight * e^{-(now - ts)/τ})
   ```  

   där τ = 7 dagar (justerbart). Resultatet lagras i tabellen `agent_trust` (agent_id, institution, score, last_updated).  

2. **Legitimacy‑Aggregator** – varje vecka samlas alla agent‑trust‑scores samt makro‑indikatorer (Gini‑koefficient, oligarki‑trend, inflation) i en **legitimacy_snapshot**. Algoritmen:  

   ```
   legit_score = α * mean(trust_parliament) +
                 β * mean(trust_court) +
                 γ * mean(trust_treasury) -
                 δ * Gini -
                 ε * oligarki_trend
   ```  

   Koefficienterna (α‑ε) kan justeras av forskare via admin‑panelen. Snapshots sparas i tabellen `legitimacy_snapshots` (id, week, score, breakdown_json, created_at).  

### API‑exponering  
- `GET /api/trust/:agentId` → returnerar aktuella trust‑värden.  
- `POST /api/trust/event` → accepter

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-27*
