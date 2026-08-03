---
id: 2026-08-03-003
title: "Optimera PERSONLIGHETER-duplikering"
type: perf
severity: medium
risk: low
file: app/api/beslut/route.js
status: pending
created: 2026-08-03
---

## Problem

PERSONLIGHETER dupliceras i både beslut/route.js och chatt/route.js. Detta ökar bundle-storleken och riskerar konsistensproblem.

## Föreslagen lösning

Flytta PERSONLIGHETER till en gemensam fil (t.ex. app/lib/personligheter.js) och exportera från båda filerna.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
