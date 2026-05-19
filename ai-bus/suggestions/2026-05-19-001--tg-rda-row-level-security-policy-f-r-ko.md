---
id: 2026-05-19-001
title: "Åtgärda row-level security policy för koalitioner"
type: security
severity: high
risk: high
file: app/api/koalition/route.js
status: pending
created: 2026-05-19
---

## Problem

Fem upprepade fel med row-level security policy för koalitioner-tabellen. Detta blockerar koalitioner-funktionen helt och är ett säkerhetsproblem.

## Föreslagen lösning

Uppdatera RLS-policyn för koalitioner-tabellen att tillåta de nödvändiga åtgärderna. Lägg till en specifik RLS-policy för POST-förfrågningar som använder upsert_koalition-funktionen.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
