---
id: 2026-08-10-005
title: "Förbättra felhantering i beslut/route"
type: bug
severity: medium
risk: low
file: app/api/beslut/route.js
status: pending
created: 2026-08-10
---

## Problem

Filen saknar explicit felhantering för AI-anrop, vilket kan leda till oväntade beteenden när AI-providern är otillgänglig.

## Föreslagen lösning

Lägg till try-catch-omfattning runt callWithFallback-anropet. Logga felmeddelanden och returnera ett lämpligt felmeddelande till klienten.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
