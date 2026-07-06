---
id: 2026-07-06-003
title: "Optimera AI-performance-observer"
type: perf
severity: medium
risk: low
file: agents/ai-performance-observer.js
status: pending
created: 2026-07-06
---

## Problem

ai-performance-observer.js gör onödiga API-anrop till Supabase och skriver dubletter till disk. Speciellt problematiskt när många agenter körs samtidigt.

## Föreslagen lösning

Implementera en cache för Supabase-anrop och idempotenscheck för rapportskrivning. Pseudokod:

```javascript
const cache = new Map();

async function sb(table, query) {
    const cacheKey = `${table}:${query}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    
    const data = await httpGet(...);
    cache.set(cacheKey, data);
    return data;
}
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
