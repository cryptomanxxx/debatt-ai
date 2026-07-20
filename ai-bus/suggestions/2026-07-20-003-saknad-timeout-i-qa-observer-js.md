---
id: 2026-07-20-003
title: "Saknad timeout i qa-observer.js"
type: perf
severity: medium
risk: low
file: agents/qa-observer.js
status: pending
created: 2026-07-20
---

## Problem

qa-observer.js saknar timeout för HTTP-anrop till debatt-ai.se, vilket kan orsaka långa blockeringar om sidorna är långsamma.

## Föreslagen lösning

Lägg till timeout (10 sekunder) för alla HTTP-anrop. Implementera abort-controller för att avbryta långsamma anrop.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
