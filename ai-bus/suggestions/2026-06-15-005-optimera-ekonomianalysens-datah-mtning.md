---
id: 2026-06-15-005
title: "Optimera ekonomianalysens datahämtning"
type: perf
severity: medium
risk: low
file: agents/economy-observer.js
status: pending
created: 2026-06-15
---

## Problem

economy-observer.js hämtar onödigt mycket data från Supabase och skapar stora JSON-payloads som överskrider Cerebras API:s begränsningar. Detta leder till misslyckade analyser.

## Föreslagen lösning

Implementera selektiv datahämtning baserat på aktuella ekonomiska händelser. Komprimera data innan skickande till Cerebras. Lägg till validering av payload-storlek.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
