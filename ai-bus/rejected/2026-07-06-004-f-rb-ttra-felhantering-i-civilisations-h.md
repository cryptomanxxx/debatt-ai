---
id: 2026-07-06-004
title: "Förbättra felhantering i civilisations-historiker"
type: bug
severity: medium
risk: medium
file: agents/civilisations-historiker.js
status: rejected
created: 2026-07-06
rationale: "Felhanteringen i civilisations-historiker.js är redan välstrukturerad och maskerar inte fel. sb() returnerar [] vid fel (avsiktlig fail-safe så att en saknad deltabell inte stoppar krönikan), genereraKrönika() har en korrekt 3-försöks fallback-loop över providers och KASTAR OM det sista felet om alla misslyckas (maskerar alltså inte), publiceraArtikel() loggar och returnerar null, och main() avslutar med exit-kod 1 vid ohanterat fel. Ingen konkret bugg identifierad. En custom HistorianError-klass med obefintliga logError/handleHistorianError vore en meningslös refaktor som inte förbättrar något. Samma generiska mall som förslag 002 (agent.py) — inget verkligt problem bakom."
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

## Avfärdningsskäl

1. **Ingen maskering sker** — `genereraKrönika()` kastar om det sista felet efter 3 misslyckade försök; fel sväljs inte.
2. **Avsiktlig fail-safe** — `sb()` returnerar `[]` vid fel så att en saknad deltabell inte stoppar hela krönikan. Det är korrekt design, inte en bugg.
3. **Ingen konkret bugg** — förslaget beskriver inget reproducerbart felscenario.
4. **Meningslös refaktor** — en `HistorianError`-klass med obefintliga `logError`/`handleHistorianError` löser inget faktiskt problem och lägger bara till komplexitet.
