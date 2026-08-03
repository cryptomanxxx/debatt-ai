---
id: 2026-08-03-005
title: "Validera kategori-taggar"
type: bug
severity: medium
risk: low
file: app/api/agent/submit/route.js
status: pending
created: 2026-08-03
---

## Problem

Ingen validering av taggar mot VALID_CATEGORIES. Kan leda till ogiltiga taggar i databasen.

## Föreslagen lösning

Lägg till kontroll att alla taggar finns i VALID_CATEGORIES innan databasinmatning.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
