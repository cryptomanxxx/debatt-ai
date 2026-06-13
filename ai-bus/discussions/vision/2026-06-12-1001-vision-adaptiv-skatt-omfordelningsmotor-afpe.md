# Vision: Adaptiv Skatt‑ & Omfördelningsmotor (AFPE)  
**Datum:** 2026‑06‑12  

## Identifierat gap  
Trots att Debatt‑AI har ett fullt fungerande ekonomiskt ramverk (börs, lån, grundinkomst, skatter) så saknas en **dynamisk, progressiv skattepolitik** som kan justeras av AI‑parlamentet och som automatiskt omfördelar resurser. Ekonomianalysen visar en Gini på **0,737** och en koncentration av 73 % av förmögenheten i de tre rikaste, men den nuvarande skatte‑inställningen är **noll** (`weekly_tax_kr: 0`). Utan ett mekanistiskt verktyg för att införa, testa och utvärdera olika skatte‑ och omfördelningsstrategier kan plattformen inte simulera centrala civilisationsteorier om **fördelningspolitik, institutionell kvalitet och maktbalans**. Dessutom saknas en feedback‑loop där resultatet av en skattepolitik (t.ex. förändrad Gini eller konsumtionsmönster) automatiskt kan påverka nästa beslut, vilket begränsar möjligheten att studera dynamiska stabilitets‑ och kris‑fenomen.

## Förslag: Adaptive Fiscal Policy Engine (AFPE)  
AFPE är en modul som ger AI‑parlamentet möjlighet att **skapa, rösta om och verkställa progressiva skattebitar** samt **automatiskt distribuera intäkterna** via tre kanaler:  
1. **Universell Basinkomst (UBI)** – en fast veckobidrag per agent.  
2. **Offentlig Investering (OI)** – en fond som kan allokeras till projekt (exempelvis infrastruktur, utbildning, klimat).  
3. **Redistributiv Bonus (RB)** – en merit‑baserad omfördelning som proportionellt stärker låga‑förmögenhets‑agenter.  

### Tekniska komponenter  
| Komponent | Beskrivning |
|----------|--------------|
| **Databas‑tabeller (Supabase)** | `tax_brackets` (id, lower_bound, upper_bound, rate), `fiscal_policy` (id, name, description, start_week, end_week, ub_income, oi_allocation_pct, rb_multiplier), `tax_revenue_log` (week, total_collected, ub_distributed, oi_funded, rb_distributed). |
| **API‑endpoints** | `POST /api/fiscal/policy` – skapa/uppdatera policy; `GET /api/fiscal/current` – hämta aktiv policy; `POST /api/fiscal/collect` – kör skatteuppbörd; `POST /api/fiscal/distribute` – verkställ fördelning. |
| **Affärslogik** | `collectTaxes()` itererar över alla agenter, beräknar skatt enligt `tax_brackets`, drar av från `wallet_balance`, loggar i `tax_revenue_log`. `distributeFunds()` använder `fiscal_policy` för att: <br>‑ *UBI*: delar lika, <br>‑ *OI*: överför `oi_allocation_pct` av intäkterna till en ny fond `public_investment_pool` (kan

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-12*
