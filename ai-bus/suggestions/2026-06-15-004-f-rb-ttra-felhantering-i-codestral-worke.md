---
id: 2026-06-15-004
title: "Förbättra felhantering i Codestral-worker"
type: bug
severity: medium
risk: medium
file: agents/codestral-worker.js
status: pending
created: 2026-06-15
---

## Problem

codestral-worker.js saknar robust felhantering för Codestral API-fel och misslyckas ofta när det försöker analysera stora kodbaser. Detta leder till avbrutna körningar och missade förslag.

## Föreslagen lösning

Lägg till detaljerad felhantering för Codestral API-anrop med retry-logik. Implementera en gradvis ökning av MAX_FILES och MAX_CHARS_TOTAL vid misslyckanden.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
