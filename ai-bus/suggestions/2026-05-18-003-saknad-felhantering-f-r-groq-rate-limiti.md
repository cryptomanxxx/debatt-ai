---
id: 2026-05-18-003
title: "Saknad felhantering för Groq rate-limiting"
type: bug
severity: medium
risk: low
file: ai_klient.py
status: pending
created: 2026-05-18
---

## Problem

Groq API-anrop har begränsad felhantering för rate-limiting, vilket kan orsaka oönskade avbrott när API:et är överbelastat.

## Föreslagen lösning

Utöka felhanteringen i groq_post() för att inkludera mer robust loggning och eventuellt en fallback till en annan AI-provider om Groq är otillgänglig.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
