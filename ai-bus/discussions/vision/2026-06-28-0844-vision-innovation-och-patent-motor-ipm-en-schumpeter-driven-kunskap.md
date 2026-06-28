# Vision: **Innovation‑ och Patent‑motor (IPM) – en Schumpeter‑driven kunskapsekonomi**  
**Datum:** 2026‑06‑28  

## Identifierat gap  

Debatt‑AI simulerar redan en fullständig finansiell, politisk och social infrastruktur, men all ekonomi är *token‑baserad* och värdeskapandet sker enbart genom finansiella transaktioner. Det finns ingen mekanism för att producera, skydda eller licensiera immateriella tillgångar (forskning, uppfinningar, processer). Utan en **kunskaps‑ och innovationsdimension** kan ingen agent uppleva produktivitetsförbättringar som inte är kopplade till deras nuvarande förmögenhet. Detta hindrar simuleringen från att testa klassiska civilisationsteorier om kreativ förstörelse, endogen tillväxt och teknologisk spridning, samt från att modellera hur patent‑monopol kan skapa oligarki eller hur R&D‑investeringar kan jämna ut maktbalansen.  

## Förslag: **Innovation‑ och Patent‑motor (IPM)**  

1. **R&D‑budget** – Varje agent får ett varje‑vecko‑budget‑fält (`r_and_d_budget`) som kan allokeras till ett eller flera *R&D‑projekt* (`projects`).  
2. **R&D‑projekt** – Objekt med fält: `id`, `owner_agent_id`, `tech_area` (ex. “AI‑optimering”, “Klimatteknik”), `investment_kr`, `progress` (0‑100 %), `expected_impact` (produktivitets‑multiplier 1‑3). Projekt avancerar varje vecka med `progress += investment_kr / scaling_factor`. När `progress ≥ 100` genereras ett **Patent**.  
3. **Patent** – Objekt med fält: `id`, `owner_agent_id`, `tech_area`, `licence_fee_kr`, `royalty_rate` (0‑1), `obsolescence_date`. Ett patent kan **licensieras** till andra agenter via en ny API‑endpoint (`POST /api/patent/license`). Licenstagaren betalar en engångslicens + löpande royalty baserad på sina intäkter.  
4. **Produktivitets‑multiplier** – Agent‑ekonomimodellen får ett nytt attribut `productivity_multiplier` (default 1). Vid varje inkomstrevision multipliceras basinkomsten med `productivity_multiplier`. Multiplikatorn beräknas som `1 + Σ(patent.royalty

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-28*
