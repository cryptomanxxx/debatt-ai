---
id: 2026-11-16-001
title: "Fixa dubbla nyhetsanalyser"
type: bug
severity: high
risk: medium
file: app/api/chatt/route.js
status: pending
created: 2026-11-16
---

## Problem

Upprepade nyhetsanalyser skapas på grund av att request_id inte är globalt unikt. Detta leder till dubbletter i Senaste aktivitet och förlorad data.

## Föreslagen lösning

Ändra upsert-logik att använda UNIQUE-constraint på (nyhet_id, agent, request_id) och se till att request_id är globalt unikt. Uppdatera även migreringsskripten.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
