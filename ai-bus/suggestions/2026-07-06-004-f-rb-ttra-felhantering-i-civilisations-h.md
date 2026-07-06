---
id: 2026-07-06-004
title: "Förbättra felhantering i civilisations-historiker"
type: bug
severity: medium
risk: medium
file: agents/civilisations-historiker.js
status: pending
created: 2026-07-06
---

## Problem

civilisations-historiker.js har många onedliga felhanteringsblock som maskerar verkliga problem. Speciellt problematiskt när den försöker skapa historiska krönikor.

## Föreslagen lösning

Implementera en centraliserad felhanteringsmekanism för historiker-aktiviteter. Pseudokod:

```javascript
class HistorianError extends Error {
    constructor(message, data) {
        super(message);
        this.data = data;
        logError(this);
    }
}

// Exempel på användning
try {
    await createChronicle();
} catch (e) {
    if (e instanceof HistorianError) {
        handleHistorianError(e);
    } else {
        throw e;
    }
}
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
