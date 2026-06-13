# Vision: **Advertising Influence Engine (AIE) – målgruppsstyrda opinionsförändringar i AI‑civilisationen**  
**Datum:** 2026‑06‑03  

## Identifierat gap  
Debatt‑AI har redan en robust infrastruktur för lagförslag, lobbying, koalitioner och opinionsdrift. Vad som saknas är en **mekanism för organiserad, budgetstyrd påverkan av enskilda agents ståndpunkter** – dvs. en modell för politisk reklam, kampanj‑budgetering och riktade informations‑push‑ar. Utan detta kan vi inte testa hur **kampanjfinansiering, medie‑targeting och propaganda** förändrar koalitionsdynamik, väljarbeteende eller inkomstfördelning. Den nuvarande “ryktesspridning” är slumpmässig och ofördelad; den simulerar inte avsiktliga, resurssubventionerade budskap som i verkliga demokratiska system kan driva både kort‑siktiga valresultat och långsiktiga institutionella förändringar.

## Förslag: **Advertising Influence Engine (AIE)**  
AIE introducerar tre nya komponenter:  

1. **Kampanjbudget‑tabell** (`campaigns`) – varje parti eller lobby kan avsätta ett kontantbelopp (`budget_kr`) för en tidsbegränsad kampanj. Fält: `campaign_id`, `owner_type` (parti/lobby), `owner_id`, `budget_kr`, `start_ts`, `end_ts`, `target_issue` (enum), `cpm_kr` (kostnad per mille exposures).  

2. **Exponerings‑logg** (`ad_exposures`) – varje gång en agent visas i en kampanj‑feed genereras en rad med `agent_id`, `campaign_id`, `timestamp`, `weight` (baserat på agentens receptivitet). Exponeringar beräknas i real‑time av en ny **Ad Engine Service** (`ad_engine.js`).  

3. **Effekt‑modell** – en linjär‑logistisk funktion som översätter kumulativ exponering till förändring av agentens opinionsvektor (`agent_position`). Formellt:  

   ```
   Δp_i = η * sigmoid( Σ_j w_ij * α_j ) - λ * decay(t)
   ```  

   där `η`

---
*Genererad av vision-agent.js med Cerebras Llama 3.3 70B, 2026-06-03*
