# Vision: **Adaptive Preference & Learning Engine (APLE) – Själv‑uppdaterande ideologier**  
**Datum:** 2026‑07‑19  

## Identifierat gap  
Debatt‑AI har välutvecklade politiska, ekonomiska och sociala lager, men varje agents ideologiska kompass är *statiskt* – den förändras bara genom manuella “ideologiska drifts‑parametrar” eller externa chocker (kriser, lagförslag). Det saknas en **automatisk lärandemekanism** som låter agenter justera sina preferenser utifrån egna erfarenheter och observationer av kollegors beteende. Utan ett adaptivt preferenssystem kan vi inte simulera centrala civilisationsteorier om *adaptiva förväntningar*, *social inlärning* eller *politik‑ekonomisk feedback* (t.ex. Lucas‑kritik, habit‑formation, herd‑behaviour). Resultatet blir en simulering där aktörerna svarar på chocker men aldrig ”lär” sig av dem, vilket hindrar emergenta dynamiker som uppstår när preferenser evolve‑ras över tid.

## Förslag: **Adaptive Preference & Learning Engine (APLE)**  
APLE inför en *per‑agent* vektor av policy‑prefenser (`pref_vector`) med dimensioner motsvarande alla debatt‑kategorier (ekologi, teknologi, ekonomi, kultur, etc.). Varje vecka (eller efter varje simulationsteg) beräknas för varje agent ett **feedback‑signal** (`ΔU`) baserat på:  

1. **Ekonomisk avkastning** – förändring i personlig förmögenhet (`Δwealth`).  
2. **Socialt kapital** – förändring i relation‑/reputations‑score (`Δsocial_capital`).  
3. **Politiskt inflytande** – antal accepterade lagförslag eller koalitions‑bidrag (`Δpolitical_power`).  

Feedback‑signalen matas in i en **stochastic gradient‑ascent**‑algoritm:  

```
pref_vector ← pref_vector + η * ΔU * grad(pref_vector)
```

där η är en lärhastighetsparameter (per‑agent konfigurerbar). För att förhindra orealistiska preferenser läggs en **soft‑max‑normalisering** och en **läkande term** (`λ * (pref_vector0 - pref_vector)`) som drar tillbaka mot agentens ursprungliga personlighet.  

APLE levereras via ett nytt API‑endpunkt:  

- `POST /api/agent/{id}/learn` – triggar en uppdatering manuellt (för experiment).  
- `GET /api/agent/{id}/preferences` – returnerar aktuell `pref_vector`.  
- `GET /api/agent/{id}/preference_history?since=...` – historik över förändringar.  

## Koppling till teori  
1. **Adaptive Expectations (Cagan, 1956; Lucas, 1972)** – agenters förväntningar justeras gradvis mot faktiska utfall, vilket möjliggör test av Lucas‑kritiken i en endogen modell.  
2. **Habit Formation & Bounded Rationality (Friedman, 1957; Simon, 1955)** – den återgående “läkande term” fångar vanebildning och begränsad rational

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-19*
