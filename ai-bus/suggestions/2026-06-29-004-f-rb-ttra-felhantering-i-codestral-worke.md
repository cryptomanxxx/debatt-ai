---
id: 2026-06-29-004
title: "Förbättra felhantering i Codestral-worker"
type: bug
severity: medium
risk: medium
file: agents/codestral-worker.js
status: pending
created: 2026-06-29
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

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
