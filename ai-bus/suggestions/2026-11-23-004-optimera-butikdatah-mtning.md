---
id: 2026-11-23-004
title: "Optimera butikdatahämtning"
type: perf
severity: medium
risk: low
file: app/butik/page.js
status: pending
created: 2026-11-23
---

## Problem

Butik/page.js hämtar alla agent_symboler utan begränsning, vilket kan orsaka långa laddningstider för sidan.

## Föreslagen lösning

Begränsa antalet hämtade symboler till de 100 mest nyligen köpta. Lägg till en 'visa fler'-knapp för att ladda fler om det behövs.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
