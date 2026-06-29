---
id: 2026-06-29-003
title: "Optimera QA-observatörens skärmdumpsprocess"
type: perf
severity: medium
risk: low
file: agents/qa-observer.js
status: pending
created: 2026-06-29
---

## Problem

qa-observer.js gör onödiga skärmdumpar av sidor som inte ändrats sedan förra körningen. Detta orsakar onödig belastning på både servern och vision-LLM.

## Föreslagen lösning

Implementera en hash-baserad ändringsdetektion för sidorna. Pseudokod:

```javascript
const sidorsHashar = {};
for (const sida of SIDOR) {
    const hash = await beräknaSidaHash(sida.path);
    if (hash !== sidorsHashar[sida.path]) {
        await görSkärmdump(sida.path);
        sidorsHashar[sida.path] = hash;
    }
}
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
