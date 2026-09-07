---
id: 2026-09-07-001
title: "Fixa nyhetsflode-importfel"
type: bug
severity: high
risk: medium
file: nyheter.py
status: pending
created: 2026-09-07
---

## Problem

4 återkommande HTTP 400-fel vid nyhetsflode-import i fel_log visar att nyhetsflode-importeraren misslyckas. Detta påverkar nyhetsaggregationen som används av många andra funktioner.

## Föreslagen lösning

Implementera robustare felhantering och fallback-logik i nyhetsflode-importeraren. Lägg till detaljerad loggning för att identifiera specifika felorsaker.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
