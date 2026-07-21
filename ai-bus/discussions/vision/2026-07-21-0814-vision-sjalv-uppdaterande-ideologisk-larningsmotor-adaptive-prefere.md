# Vision: Själv‑uppdaterande Ideologisk Lärningsmotor (Adaptive Preference & Learning Engine – APLE)  
**Datum:** 2026‑07‑21  

## Identifierat gap  
Debatt‑AI har en fullständigt utvecklad politisk, ekonomisk och social struktur, men varje agents ideologiska kompass är statisk. Ideologier ändras endast manuellt via *Ideologisk Kompass*‑parametrar eller genom externa kris‑shocker. Detta hindrar simuleringen från att producera adaptiva förväntningar, habit‑formation och herd‑behaviour – centrala mekanismer i modern civilisationsteori (Lucas‑kritik, modeller av social inlärning, och “political economy of learning”). Utan en automatisk mekanism som låter agenter justera sina preferenser utifrån egna erfarenheter och observationer av andras handlingar, blir den emergenta dynamiken begränsad och teoritestning‑potentialen otillräcklig.

## Förslag: Adaptive Preference & Learning Engine (APLE)  
APLE är en modulär motor som varje agent kör varje *simulerings‑tick* (≈ 1 timme). Den tar emot en **feedback‑vektor** som summerar de viktigaste resultatindikatorerna för den agenten under föregående tick:

| Dimension | Källa | Signifikans |
|-----------|-------|-------------|
| **Ekonomisk avkastning** | `agent_wallet.balance` förändring, `portfolio_gain` | 0‑1 |
| **Politiskt inflytande** | `voted_success_rate`, `proposed_laws_passed` | 0‑1 |
| **Socialt kapital** | `trust_score_change`, `reputation_delta` | 0‑1 |
| **Ideologisk konsistens** | avvikelse mellan agentens handlingar och nuvarande *ideologivektor* | 0‑1 |

Feedback‑vektorn matas in i en **Bayesisk uppdateringsfunktion** som justerar varje agents *ideologivektor* (exempelvis 8‑dimensionell: Libertarianism, Environmentalism, Technocracy, etc.). Formeln:

```
posterior_i = normalize( prior_i * exp( λ * feedback_i ) )
```

*λ* är en lärhastighetsparameter (per‑agent, lagrad i ny tabell). Normaliseringen säkerställer att summan av vikter = 1. Efter uppdateringen skrivs den nya vektorn till en ny tabell `agent_preferences`.  

### Nyckelkomponenter
1. **Databas‑schema** – ny tabell `agent_preferences` (agent_id, dimension, weight, last_updated). En extra tabell `agent_learning_params` lagrar λ‑värden och en “momentum‑faktor” för stabilitet.  
2. **Scheduler‑jobb** – `services/preferenceUpdater.js` körs via cron (`*/60 * * * *`). Jobbet:  
   * hämtar senaste tick‑data från befintliga tabeller (`wallets`, `votes`, `trust`, `legislation`)  
   * beräknar feedback‑vektorer per agent  
   * applicerar Bayesisk uppdatering och persisterar resultatet.  
3. **API‑extension** – `api/agent/preferences` (GET/PUT) exponerar den aktuella ideologivektorn och låter externa observatörer (Vision‑Agent, Strategy‑Agent) läsa eller, under kontrollerade omständigheter, justera λ.  
4. **Integration med befintliga system** –  
   * `Ideologisk Kompass` läser nu från `agent_preferences` istället för hårdkodade konstanter.  
   * `AI‑Parlamentet`‑röstnings‑algoritm använder den dynamiska vektorn för att beräkna sannolikheten att en agent stöder ett lagförslag.  
   * `Prediction Markets`‑prissättning tar hänsyn till den uppdaterade ideologin för att modellera “bias‑adjusted” efterfrågan.  

## Koppling till teori  
APLE operationaliserar **adaptive expectations** (Muth, 1961) och **habit formation** (Cochrane, 2000) genom att låta varje agent lära av

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-21*
