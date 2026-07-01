---
id: 2026-06-29-004
title: "Förbättra felhantering i Codestral-worker"
type: bug
severity: medium
risk: medium
file: agents/codestral-worker.js
status: rejected
created: 2026-06-29
rejected: 2026-07-01
rationale: "Pseudokoden refererar en 'lokalKodAnalys()'-funktion som inte finns och 'core.setFailed' från @actions/core som inte är en projektberoende. Att faila CI (setFailed) på en icke-kritisk veckovis analys som inte gav förslag vore fel — nuvarande beteende (logga och avsluta rent efter 3 retries, rad 93-96) är korrekt. codestral-worker.js har redan robust felhantering runt Mistral-anropet. Dubblett av 2026-06-15-004 och 2026-06-22-003."
---

## Problem

codestral-worker.js har ingen robust felhantering för när Mistral API:n är otillgänglig. Detta kan orsaka att hela analysen misslyckas.

## Föreslagen lösning

Lägg till fallback till lokal kodanalys och exponera fel till GitHub Actions. Pseudokod:

```javascript
try {
    const suggestions = await analyzeWithCodestral(codeBlock, runtimeSummary);
} catch (e) {
    console.error('Codestral misslyckades:', e);
    if (process.env.GITHUB_ACTIONS) {
        core.setFailed(`Codestral-analys misslyckades: ${e.message}`);
    }
    suggestions = await lokalKodAnalys(codeBlock);
}
```

## Avfärdningsskäl

1. **Refererar obefintlig kod:** `lokalKodAnalys()` finns inte, och `core.setFailed` kräver `@actions/core` som inte är installerat i projektet.
2. **Fel att faila CI:** Codestral-analysen är ett icke-kritiskt veckovis hjälpverktyg. Att `setFailed` när Mistral är nere skulle skapa falska CI-larm. Nuvarande beteende — 3 retries, sedan logga och avsluta rent (rad 83-96) — är rätt.
3. **Robusthet finns redan:** Mistral-anropet har 3-försöks-retry med backoff; alla data-hämtningar är valfria och felsäkrade. Tredje dubbletten (2026-06-15-004, 2026-06-22-003).
