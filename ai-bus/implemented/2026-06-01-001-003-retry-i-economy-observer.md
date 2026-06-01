---
id: 2026-06-01-001+003
title: Retry i economy-observer.js (Cerebras)
type: bug
severity: medium
risk: low
file: agents/economy-observer.js
status: implemented
created: 2026-06-01
implemented: 2026-06-01
impact: kallaCerebras() försöker nu upp till 3 gånger — löser transient API-fel som orsakade process.exit(1)
---

## Åtgärd

Retry-loop (3 försök, exponentiell backoff 2s/4s) lagd till `kallaCerebras()`. Adresserar både 2026-06-01-001 och 2026-06-01-003 som båda pekade på samma funktion.
