---
id: 2026-06-01-002
title: "Visuell QA-observatör misslyckas ofta"
type: bug
severity: medium
risk: low
file: agents/qa-observer.js
status: pending
created: 2026-06-01
---

## Problem

Visuell QA-observatör har 3 misslyckade körningar under senaste 30 dagarna enligt weekly digest. Detta påverkar inte produktionsmiljön direkt men är ett underhållsproblem.

## Föreslagen lösning

Lägg till mer robust felhantering och fallback-mekanismer. Pseudokod:

```javascript
async function takeScreenshot(url) {
    try {
        const screenshot = await puppeteer.screenshot(url);
        return screenshot;
    } catch (error) {
        console.warn(`Misslyckades med ${url}, försöker fallback...`);
        return await takeScreenshotWithFallback(url);
    }
}
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
