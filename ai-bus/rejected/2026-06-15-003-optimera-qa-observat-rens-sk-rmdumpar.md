---
id: 2026-06-15-003
title: "Optimera QA-observatörens skärmdumpar"
type: perf
severity: medium
risk: low
file: agents/qa-observer.js
status: rejected
created: 2026-06-15
rejected: 2026-07-01
rationale: "MD5-hash av HTML skulle aldrig ge cache-träff — sidorna är datadrivna (saldon, röster, priser, feeds) och HTML ändras vid varje körning. QA-observatören är dessutom en VISUELL regressionskontroll som körs veckovis; att hoppa över 'oförändrade' sidor motverkar hela syftet (fånga layoutregressioner mellan veckor). Dubblett av tidigare avfärdade 2026-06-01-002."
---

## Problem

qa-observer.js genererar onödiga skärmdumpar för sidor som inte ändrats sedan förra veckan. Detta orsakar onödig LLM-användning och ökad körningstid.

## Föreslagen lösning

Implementera en cache för skärmdumpar med MD5-hash av sidans HTML för att identifiera ändringar. Endast skapa nya skärmdumpar för ändrade sidor.

## Avfärdningsskäl

1. **Cache ger aldrig träff:** Sidorna är helt datadrivna (agentsaldon, börskurser, röster, RSS-feeds). HTML skiljer sig vid i praktiken varje körning → MD5-hashen matchar aldrig → ingen sida hoppas över. Ren komplexitetsökning utan besparing.
2. **Motverkar syftet:** QA-observatören fångar *visuella* regressioner (bruten layout, tomma grafer) och jämför status mot föregående vecka (`byggDiff` rad 290). Att inte ta en skärmdump betyder ingen statusrad och därmed ingen diff — man förlorar precis det verktyget är till för.
3. **Icke-kritiskt, veckovis:** Körningen sker en gång/vecka; körtiden (~3s/sida) är inte ett faktiskt problem.
