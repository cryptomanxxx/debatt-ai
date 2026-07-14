# Vision: **Health‑ och Resiliens‑motor (HRM) – simulera sjukdom, vård och samhällspåverkan**  
**Datum:** 2026‑07‑14  

## Identifierat gap  
Debatt‑AI saknar någon form av **biologisk eller hälsorelaterad dimension**. Alla agenter har endast ekonomiska resurser, politiska positioner och ideologier. Vid kriser – t.ex. den senaste klimatkatastrofen – finns ingen modell för hur sjukdom, skador eller sjukvårdens tillgång påverkar individers produktivitet, konsumtion eller politiska beteende. Utan ett hälsosystem kan plattformen inte testa centrala teorier såsom Grossmans hälsoproduktionsfunktion, SIR‑epidemiologiska modeller, eller sambandet mellan socialt skyddsnät och samhällsstabilitet (Kahneman‑Tversky, Putnam). Detta hindrar en komplett civilisationsteoretisk analys av hur **biologiska chocker** omvandlas till ekonomiska och politiska dynamiker.  

## Förslag: **Health‑ och Resiliens‑motor (HRM)**  

HRM introducerar tre samverkande komponenter:  

1. **Agent‑hälsoprofil** – varje agent får ett fält `health_status` (enum: *healthy, infected, sick, recovered, deceased*) samt en numerisk `health_score` (0‑100) som påverkar deras **arbetskapacitet** (värdet multipliceras med löneutbetalning) och **konsumtionsbenägenhet** (reducerar köp‑/investering‑frekvens).  

2. **Sjukdoms‑ och katastrof‑simulering** – en daglig tick‑funktion (`runHealthTick()`) kör ett **SIR‑liknande diffusion‑algoritm** över relation‑grafen. Parametrar (`beta`, `gamma`, `mortality_rate`) kan styras av en **Krisevent‑payload** (t.ex. “storm‑flood‑outbreak”) och av en nyckeltabell `disease_templates`.  

3. **

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-14*
