# Vision: Centralbank‑ och penningpolitisk motor (CB‑Policy Engine)  
**Datum:** 2026‑07‑28  

## Identifierat gap  
Debatt‑AI har ett fullt fungerande skattesystem, en fungerande börs, stablecoins och ett kredit‑/bank‑lager, men saknar en **ekonomisk styrningsenhet som kan formulera och verkställa penningpolitik**. Räntor på lån är hårdkodade eller slumpmässiga, det finns ingen möjlighet att justera penningmängden, reseerveratioer eller genomföra öppna marknadsoperationer. Utan en centralbank kan simuleringen inte reproducera makroekonomiska fenomen som inflation‑/deflationsspiraler, kreditcykler, recessioner eller ”quantitative easing”. Detta hindrar både testning av Keynes‑type teorier och av monetära‑policy‑experiment (t.ex. Taylor‑regeln, “too‑big‑to‑fail”‑interventioner).

## Förslag: Centralbank‑ och penningpolitisk motor (CB‑Policy Engine)  

### Kärnkomponenter  
1. **Centralbank‑tillstånd** – en ny databas‑tabell `central_bank` med kolumner:  
   - `policy_rate FLOAT` (basränta, % per år)  
   - `reserve_requirement FLOAT` (minsta reserv‑% av insättningar)  
   - `open_market_ops JSONB` (lista av senaste köp/försäljningar av statsobligationer)  
   - `inflation_target FLOAT` (t.ex. 2 %)  
   - `last_adjust TIMESTAMP`  

2. **Ränte‑ och kredit‑modul** – låne‑API (`/api/loan/create`) beräknar ränta som `policy_rate + risk_spread(agent_id)`. `risk_spread` hämtas från en ny tabell `agent_risk` (uppdateras av CRSE och kredit‑historia).  

3. **Öppna marknadsoperationer** – endpoint `POST /api/centralbank/open_market` med payload `{type:"buy"|"sell", amount:INTEGER, asset:"gov_bond"}`. Köpta obligationer ökar bankernas reserver med motsvarande mängd; försäljning minskar dem. Resultatet registreras i `open_market_ops`.  

4. **Automatisk Taylor‑regel‑loop** – en schemalagd bakgrunds‑funktion (`cron` varje timme) som läser den senaste inflationsrapporten (`economy_analysis`) och BNP‑gap (`SELECT SUM(wealth) FROM agents`) och uppdaterar `policy_rate` enligt:  
   ```
   policy_rate = inflation_target + 0.5*(inflation_actual - inflation_target) + 0.5*output_gap
   ```  
5. **Dashboard** – ny sida `/centralbank` som visar aktuell ränta, reservkrav, senaste OM‑operationer samt grafer för inflation, penningmängd och kreditvolym.  

### Tekniska detaljer  
* **Supabase‑migration**: `create_central_bank_table.sql`, `create_agent_risk_table.sql`.  
*

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-28*
