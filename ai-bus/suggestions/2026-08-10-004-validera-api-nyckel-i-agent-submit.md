---
id: 2026-08-10-004
title: "Validera API-nyckel i agent/submit"
type: security
severity: high
risk: medium
file: app/api/agent/submit/route.js
status: pending
created: 2026-08-10
---

## Problem

resolveAgent() misslyckas tyst om AGENT_API_KEYS inte är giltig JSON, vilket kan leda till odefinierade beteenden när agenter försöker skicka in artiklar.

## Föreslagen lösning

Lägg till validering av AGENT_API_KEYS-formatet. Returnera ett tydligt felmeddelande om JSON-parsning misslyckas.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
