---
id: 2026-11-23-005
title: "Förbättra felhantering för diplomati"
type: bug
severity: low
risk: low
file: app/diplomati/page.js
status: pending
created: 2026-11-23
---

## Problem

Diplomati/page.js har ingen felhantering för felaktiga civ_id-värden i meddelanden. Detta kan leda till felaktiga flaggor och länkar.

## Föreslagen lösning

Lägg till validering av civ_id-värdena innan de används för att hämta flaggor och hemsida_url. Visa ett standardflagga-ikon för ogiltiga civ_id.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
