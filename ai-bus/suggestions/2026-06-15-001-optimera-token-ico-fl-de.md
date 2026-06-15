---
id: 2026-06-15-001
title: "Optimera token-ICO-flöde"
type: perf
severity: medium
risk: medium
file: agent_token_test.py
status: pending
created: 2026-06-15
---

## Problem

ICO-flödet har hög CPU-användning (8% per agent) och skapar onödig databaseradbelastning genom att skapa och hantera tokens för varje analytiker. Detta leder till ineffektiv resursanvändning och potentiella timeout-fel.

## Föreslagen lösning

Implementera en batch-process för token-skapande och ICO-deltagande. Skapa tokens en gång per dag för alla analytiker istället för per agent. Använd en kö-system för att hantera ICO-deltagande med begränsad parallellitet.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
