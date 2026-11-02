---
id: 2026-11-02-005
title: "Förbättra felhantering för tomma svar"
type: bug
severity: medium
risk: medium
file: app/api/agent/submit/route.js
status: pending
created: 2026-11-02
---

## Problem

De återkommande tomma svaren indikerar att agent/submit-route.js inte hanterar tomma svar korrekt. Detta leder till att användare får felmeddelanden utan att veta att de borde kunna återförsöka.

## Föreslagen lösning

Implementera en kontroll för tomma svar och ge användaren möjlighet att återförsöka. Pseudokod: if (!response || !response.content): return { error: 'Ingen svar kunde genereras', retry: true }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
