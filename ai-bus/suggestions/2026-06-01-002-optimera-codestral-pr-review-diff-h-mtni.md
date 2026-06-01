---
id: 2026-06-01-002
title: "Optimera Codestral PR-review diff-hämtning"
type: perf
severity: medium
risk: low
file: agents/codestral-pr-review.js
status: pending
created: 2026-06-01
---

## Problem

Den nuvarande implementeringen av hamtaDiff() kan missa filer om PR:en innehåller fler än 1000 filer (10 sidor × 100 filer/sida). Detta kan leda till att vissa ändringar inte granskas.

## Föreslagen lösning

Uppdatera hamtaDiff() för att hantera fler sidor och lägga till en kontroll för att avbryta om diffen blir för stor. Exempel:

```javascript
async function hamtaDiff() {
  // ...
  let page = 1;
  const MAX_PAGES = 20; // 2000 filer max
  let totalChars = 0;

  while (page <= MAX_PAGES && totalChars < MAX_DIFF_CHARS) {
    // ...
    for (const fil of data) {
      if (totalChars + fil.patch.length > MAX_DIFF_CHARS) {
        console.warn(`Diff för stor — avbryter efter ${page} sidor`);
        break;
      }
      // ...
      totalChars += fil.patch.length;
    }
    // ...
  }
}
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
