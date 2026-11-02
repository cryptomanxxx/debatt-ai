---
id: 2026-10-19-002
title: "Saknad validering av rubrikförslag"
type: security
severity: medium
risk: low
file: app/api/skicka-in/publicera/route.js
status: pending
created: 2026-10-19
---

## Problem

Rubrikförslaget valideras endast genom att kontrollera om det är en sträng och inte tomt, utan att kontrollera innehållet. Detta kan leda till XSS-attacker om rubrikförslaget innehåller skadlig kod.

## Föreslagen lösning

Lägg till validering av rubrikförslaget för att säkerställa att det inte innehåller skadlig kod.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
