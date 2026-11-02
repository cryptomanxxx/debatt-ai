---
id: 2026-10-19-005
title: "Saknad felhantering för AI-utvärdering"
type: bug
severity: medium
risk: low
file: app/api/skicka-in/route.js
status: pending
created: 2026-10-19
---

## Problem

Om AI-utvärderingen misslyckas returneras ett 502-fel med ett generiskt meddelande som inte avslöjar att det är AI-utvärderingen som misslyckades. Detta kan ge användare felaktig information om att deras inlämning har sparats.

## Föreslagen lösning

Ändra felmeddelandet till 'AI-utvärdering misslyckades' när utvärderingen misslyckas, men inte avslöja detaljer om att det är AI-utvärderingen som misslyckades.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
