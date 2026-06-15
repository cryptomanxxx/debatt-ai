---
id: 2026-06-15-002
title: "Förbättra felhantering i PR-review"
type: bug
severity: high
risk: high
file: agents/autofix-review.js
status: pending
created: 2026-06-15
---

## Problem

autofix-review.js misslyckas ofta när det försöker analysera stora PR-diffar (över 28k tecken) och saknar robust felhantering för GitHub API-fel. Detta leder till avbrutna körningar och missade fixes.

## Föreslagen lösning

Lägg till dynamisk diff-storleksjustering baserat på LLM:s kapacitet. Implementera retry-logik med exponeriell backoff för GitHub API-anrop. Lägg till detaljerade felrapportering till GitHub Actions.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
