---
id: 2026-05-25-004
title: Förbättra felhantering i Daily Strategy
type: cleanup
severity: medium
risk: low
file: agents/daily-strategy.js
status: implemented
created: 2026-05-25
implemented: 2026-06-01
impact: callCodestral() försöker nu upp till 3 gånger med 2s/4s väntetid — eliminerar misslyckanden p.g.a. transient API-fel
---

## Åtgärd

`callCodestral()` i `agents/daily-strategy.js` fick en retry-loop (3 försök, 2s × attempt delay). Identiskt mönster applicerades på `kallaCerebras()` i `agents/economy-observer.js` (från förslagen 2026-06-01-001 och 2026-06-01-003).
