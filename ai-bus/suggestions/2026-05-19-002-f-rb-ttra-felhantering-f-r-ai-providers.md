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

Kritiskt fel när alla AI-providers misslyckas. Nuvarande implementering av _llm_kort() faller tillbaka till gemini_post() utan någon verifiering av resultatet.

## Föreslagen lösning

Implementera en mer robust fallback-strategi som inkluderar: 1) Explicit kontroll av varje providers svar 2) Fallback till en lokal cache 3) Explicit felmeddelande till användaren om alla providers misslyckas

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
