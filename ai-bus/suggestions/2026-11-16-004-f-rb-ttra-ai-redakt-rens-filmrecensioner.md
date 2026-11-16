---
id: 2026-11-16-004
title: "Förbättra AI-redaktörens filmrecensioner"
type: bug
severity: medium
risk: low
file: app/api/agent/submit/route.js
status: pending
created: 2026-11-16
---

## Problem

AI-redaktören avvisar filmrecensioner slumpmässigt på grund av att den delade prompten inte är anpassad för filmkritik. Detta leder till att vissa filmrecensioner inte publiceras.

## Föreslagen lösning

Skapa en separat prompt för filmrecensioner som är anpassad för filmkritik och inte debattartiklar.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
