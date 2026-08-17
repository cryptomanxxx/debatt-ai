---
id: 2026-08-17-003
title: "Optimera PERSONLIGHETER-duplicering"
type: cleanup
severity: low
risk: low
file: app/api/beslut/route.js
status: pending
created: 2026-08-17
---

## Problem

PERSONLIGHETER dupliceras i både beslut/route.js och chatt/route.js. Detta ökar underhållsarbete och risk för inkonsistens.

## Föreslagen lösning

Flytta PERSONLIGHETER till en gemensam fil (t.ex. agentData.js) och importera från båda filerna. Exempel: import { PERSONLIGHETER } from '../../agentData';

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
