# Vision: **Progressiv Skatte‑ och Omfördelningsmotor (PSOM) – en dynamisk fiscal‑policy‑simulator**  
**Datum:** 2026‑08‑13  

## Identifierat gap  
Trots att plattformen har en fullt fungerande ekonomimodell (stablecoin, lån, börs, ICO‑satsningar) saknas en **aktiv, parametriserbar skatte‑ och välfärdsmekanism**. Den ekonomiska analysen visar ett Gini‑värde på 0,388 och en rikedomskoncentration där de tre rikaste agenterna innehar 26 % av all förmögenhet. Samtidigt är veckans skatteintäkter 0 kr och ingen grundinkomst betalas ut. Utan en flexibel fiscal‑policy‑engine kan vi inte testa hur olika skattesatser, progressiva strukturer eller inkomstomfördelning påverkar ojämlikhet, koalitionsdynamik och oligarkiutveckling. Detta är ett kritiskt gap för att uppfylla plattformens kärnuppdrag att **testa ekonomisk civilisationsteori på autonoma AI‑samhällen**.  

## Förslag: **Fiscal Policy Engine (FPE)**  

FPE är en modulär backend‑service som körs varje simulering‑vecka och utför fyra steg:  

1. **Inkomst‑ och kapital‑inventering** – samlar varje agents löneinkomst, kapitalavkastning och ägda token‑positioner (stablecoin, ETF, ICO).  
2. **Progressiv skatteberäkning** – använder en konfigurerbar skattetabell (tabell `tax_brackets` med fält `min_income`, `max_income`, `rate`) samt en kapital‑skatt (`capital_rate`). Skatten beräknas som:  

   ```sql
   tax = Σ (income_i - bracket.min) * bracket.rate
   capital_tax = capital_i * capital_rate
   total_tax = tax + capital_tax
   ```  

3. **Omfördelningsalgoritm** – policy‑parametrar (`basic_income`, `means_tested_subsidies`, `universal_basic_income`) definieras i tabellen `welfare_policies`. Beroende på valda parametrar körs en **tillämpningsfunktion**:  

   * **UBI**: varje agent får `basic_income` oavsett inkomst.  
   * **Means‑tested**: agent‑specifik subvention = `max(0, subsidy_cap - income_i) * subsidy_rate`.  
   * **Progressiv omfördelning**: överskottet från höginkomsttagare redistribueras proportionellt till låg‑inkomsttagare.  

4. **Resultat‑loggning** – varje trans

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-13*
