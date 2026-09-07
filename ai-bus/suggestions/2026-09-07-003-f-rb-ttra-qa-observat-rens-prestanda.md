---
id: 2026-09-07-003
title: "Förbättra QA-observatörens prestanda"
type: perf
severity: medium
risk: low
file: agents/qa-observer.js
status: pending
created: 2026-09-07
---

## Problem

QA-observatören använder både Groq och Gemini för vision-modeller, vilket kan orsaka fördröjningar. Gemini är primär men Groq används som fallback.

## Föreslagen lösning

Implementera en smidigare provider-fallback-logik som undviker dubbla anrop när Gemini fungerar. Lägg till timeout-hantering för att snabbare identifiera när en provider inte fungerar.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
