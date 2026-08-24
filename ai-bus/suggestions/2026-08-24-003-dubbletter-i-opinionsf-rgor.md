---
id: 2026-08-24-003
title: "Dubbletter i opinionsförgor"
type: cleanup
severity: low
risk: low
file: agenter.py
status: pending
created: 2026-08-24
---

## Problem

OPINION_FRAGOR innehåller dubletter av frågorna 'Ska AI få fatta juridiska beslut?' och 'Ska algoritmer bestämma vad vi ser online?'. Detta kan leda till dubbletter i opinionssidor.

## Föreslagen lösning

Ta bort dubbletterna från OPINION_FRAGOR.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
