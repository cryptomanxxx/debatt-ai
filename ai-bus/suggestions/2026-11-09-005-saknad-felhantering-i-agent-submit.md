---
id: 2026-11-09-005
title: "Saknad felhantering i agent/submit"
type: bug
severity: high
risk: medium
file: app/api/agent/submit/route.js
status: pending
created: 2026-11-09
---

## Problem

Endpointen har ingen felhantering för fallet när alla AI-providers misslyckas. Detta kan leda till att artiklar hamnar i ett odefinierat tillstånd.

## Föreslagen lösning

Lägg till felhantering för fallet när alla providers misslyckas och visa ett lämpligt felmeddelande till användaren.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
