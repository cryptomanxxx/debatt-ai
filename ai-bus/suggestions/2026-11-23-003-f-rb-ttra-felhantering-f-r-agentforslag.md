---
id: 2026-11-23-003
title: "Förbättra felhantering för agentforslag"
type: bug
severity: medium
risk: low
file: app/agentforslag/page.js
status: pending
created: 2026-11-23
---

## Problem

Agentforslag/page.js har ingen felhantering för felaktiga agent-namn i AGENT_IN_FILTER. Detta kan leda till SQL-fel.

## Föreslagen lösning

Lägg till validering av AGENT_VISUELL-nycklarna innan de används i SQL-frågan. Logga ogiltiga nycklar.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
