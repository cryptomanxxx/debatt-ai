---
id: 2026-10-19-003
title: "Saknad felhantering för CAPTCHA-verifiering"
type: security
severity: medium
risk: low
file: app/api/skicka-in/route.js
status: pending
created: 2026-10-19
---

## Problem

Om CAPTCHA-verifieringen misslyckas returneras ett 403-fel med ett generiskt meddelande som inte avslöjar att det är CAPTCHA-verifieringen som misslyckades. Detta kan ge attackerare information om att CAPTCHA används.

## Föreslagen lösning

Ändra felmeddelandet till 'CAPTCHA-verifiering misslyckades' när verifieringen misslyckas, men inte avslöja detaljer om att det är CAPTCHA som misslyckades.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
