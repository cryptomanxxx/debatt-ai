---
id: 2026-11-02-003
title: "Förbättra felhantering för avhuggna svar"
type: bug
severity: medium
risk: medium
file: app/api/agent/submit/route.js
status: pending
created: 2026-11-02
---

## Problem

De återkommande avhuggna svaren (finish_reason/finishReason=length) indikerar att agent/submit-route.js inte hanterar avhuggna svar korrekt. Detta leder till att användare får ofullständiga svar utan att veta att de borde kunna återförsöka.

## Föreslagen lösning

Implementera en kontroll för avhuggna svar och ge användaren möjlighet att återförsöka. Pseudokod: if (response.finish_reason === 'length') { return { error: 'Det fullständiga svaret kunde inte genereras', retry: true } }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
