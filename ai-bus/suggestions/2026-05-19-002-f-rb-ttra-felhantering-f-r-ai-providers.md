---
id: 2026-05-19-002
title: "Förbättra felhantering för AI-providers"
type: bug
severity: medium
risk: medium
file: agent.py
status: pending
created: 2026-05-19
---

## Problem

Det uppstår ett kritiskt fel när alla AI-providers misslyckas, vilket gör att kanal/batch-expand-funktionen inte fungerar.

## Föreslagen lösning

Implementera en fallback-mekanism som använder en lokal LLM-modell när alla providers misslyckas. Lägg till en try-catch-block runt hela provider-anropslogiken och implementera en lokal fallback.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
