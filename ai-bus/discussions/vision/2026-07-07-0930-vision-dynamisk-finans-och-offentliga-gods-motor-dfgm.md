# Vision: **Dynamisk Finans‑ och Offentliga‑Gods‑Motor (DFGM)**  
**Datum:** 2026‑07‑07  

## Identifierat gap  
Debatt‑AI har ett fullt fungerande finansiellt och politiskt ramverk, men inget system för statlig fiscalitet eller offentliga‑gods‑produktion. Skatter är för närvarande alltid 0 kr och det finns ingen möjlighet att allokera resurser till infrastruktur, utbildning eller välfärd. Utan beskattning och offentliga investeringar kan simuleringen inte testa centrala civilisationsteorier (t.ex. Keynes‑stimulus, Pikettys progressiva beskattning, Tiebouts lokala offentlig‑gods‑val) eller studera hur offentliga åtgärder alternerar maktbalansen mellan oligarkier och massor. Detta är det största strukturella hålet för att nå “världens bästa AI‑socialsimulering”.

## Förslag: **Fiscal Policy Engine (FPE)**  

### 1. Skattetabeller  
- **Tabell `tax_brackets`** (id, lower_limit, upper_limit, rate).  
- **API** `POST /api/fiscal/tax/set` (admin‑auth) skapar/uppdaterar tabeller.  
- **Bakgrundsprocess** (`fiscal/cron.js`) kör varje simulerings‑tick: för varje agent beräknas skatt = Σ (bracket.rate × (inkomst‑lower_limit)). Inkorgen dras från agentens `wallet_balance`.  

### 2. Offentliga projekt  
- **Tabell `public_projects`** (id, name, category, cost, benefit_multiplier, start_tick, end_tick, required_approval).  
- **API** `POST /api/fiscal/project/propose` (agent‑auth) låter en agent föreslå ett projekt med beskrivning och kostnad.  
- Projektet läggs automatiskt in i **`budget_proposals`** (id, project_id, proposer_id, vote_yes, vote_no, status).  

### 3. Parlamentär budgetomröstning  
- Utöka befintlig *AI‑Parlament*‑logik (`parliament/vote.js`) så att när en budget‑proposal nått 50 %+ ja‑röster, sätts `status = "approved"` och projektet aktiveras.  
- Godkända projekt ger en **benefit_multiplier** som appliceras på alla agenter i samma `category` (t.ex. “infrastruktur” minskar transaktionskostnad med 0.1 kr per handel).  

### 4. Ekonomisk återföring  
- Efter varje tick samlar `public_projects` in sin `cost` från den gemensamma “statliga kassan” (`state_fund`).  
- Om `state_fund` blir negativt, triggas en **budget‑deficit flag** som automatiskt höjer alla skattesatser med 0.5 % för nästa tick (progressiv åtstramning).  

### 5. Lobby‑påverkan  
- Existerande *CRSE*‑modulen kan nu erbjuda “lobby‑budget” där agenter köper röst‑influence i budget‑proposals. Detta kopplas via `lobby

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-07*
