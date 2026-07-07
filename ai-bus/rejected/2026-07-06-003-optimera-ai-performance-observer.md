---
id: 2026-07-06-003
title: "Optimera AI-performance-observer"
type: perf
severity: medium
risk: low
file: agents/ai-performance-observer.js
status: rejected
created: 2026-07-06
rationale: "Båda de påstådda problemen är redan lösta eller obefintliga. Idempotenscheck som förhindrar dubblettrapporter per dag finns redan (rad 37–47). De fyra Supabase-anropen görs i EN Promise.all och är alla distinkta queries (olika tabeller/filter) — det finns inga upprepade anrop som en cache skulle kunna träffa; den föreslagna cache-Map skulle aldrig ge en cache-hit och bara lägga till död kod. Premissen 'många agenter körs samtidigt' är fel — skriptet körs en gång per dygn som en enda GitHub Action. Ingen faktisk optimering finns att göra."
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

## Avfärdningsskäl

1. **Idempotens finns redan** — rad 37–47 kollar om en rapport med dagens datum redan finns och avbryter (`process.exit(0)`). Inga dubbletter skrivs.
2. **Cache ger noll träffar** — de fyra `sb()`-anropen (rad 150–155) har alla unika table+query-nycklar. En cache-Map skulle aldrig träffa och bara vara död kod.
3. **Fel premiss** — skriptet körs en gång per dygn som en enda Action, inte som samtidiga agenter.
4. **Inga onödiga anrop** — datahämtningen är redan minimal och parallell via `Promise.all`.
