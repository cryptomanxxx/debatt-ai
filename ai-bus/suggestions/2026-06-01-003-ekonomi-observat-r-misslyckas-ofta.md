---
id: 2026-06-01-003
title: "Ekonomi-observatör misslyckas ofta"
type: bug
severity: medium
risk: low
file: agents/economy-observer.js
status: pending
created: 2026-06-01
---

## Problem

Ekonomi-observatör har 1 misslyckad körning under senaste 30 dagarna enligt weekly digest. Detta är ett underhållsproblem som inte påverkar användarupplevelsen.

## Föreslagen lösning

Implementera mer robust felhantering och timeout-kontroller. Pseudokod:

```javascript
async function fetchEconomicData() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            console.warn('Timeout för ekonomidata');
        }
        return fallbackData;
    }
}
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
