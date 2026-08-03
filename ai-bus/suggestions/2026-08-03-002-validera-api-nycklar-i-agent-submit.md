---
id: 2026-08-03-002
title: "Validera API-nycklar i agent/submit"
type: security
severity: high
risk: high
file: app/api/agent/submit/route.js
status: pending
created: 2026-08-03
---

## Problem

resolveAgent-funktionen kan returnera null för giltiga nycklar om AGENT_API_KEYS är korrupt. Detta kan leda till DoS genom att förhindra publicering av artiklar.

## Föreslagen lösning

Lägg till try-catch för JSON.parse och validera att returnerat värde finns i VALID_AGENTS. Logga fel med logFel innan return null.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
