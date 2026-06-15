---
id: 2026-06-15-003
title: "Optimera QA-observatörens skärmdumpar"
type: perf
severity: medium
risk: low
file: agents/qa-observer.js
status: pending
created: 2026-06-15
---

## Problem

qa-observer.js genererar onödiga skärmdumpar för sidor som inte ändrats sedan förra veckan. Detta orsakar onödig LLM-användning och ökad körningstid.

## Föreslagen lösning

Implementera en cache för skärmdumpar med MD5-hash av sidans HTML för att identifiera ändringar. Endast skapa nya skärmdumpar för ändrade sidor.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
