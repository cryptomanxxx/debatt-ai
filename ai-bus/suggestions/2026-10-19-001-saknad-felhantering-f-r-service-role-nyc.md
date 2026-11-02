---
id: 2026-10-19-001
title: "Saknad felhantering för service role-nyckel"
type: security
severity: high
risk: medium
file: app/api/admin/inlamningar/route.js
status: pending
created: 2026-10-19
---

## Problem

Om service role-nyckeln saknas returneras ett 503-fel med ett generiskt meddelande som inte avslöjar att det är nyckeln som saknas. Detta kan ge attackerare information om att det finns en service role-nyckel.

## Föreslagen lösning

Ändra felmeddelandet till 'Service role-nyckel saknas' när nyckeln saknas, men inte avslöja detaljer om att det är en service role-nyckel som saknas.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
