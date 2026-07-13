---
id: 2026-07-13-003
title: "Optimera GlobalNav.js för prestanda"
type: perf
severity: medium
risk: low
file: app/GlobalNav.js
status: pending
created: 2026-07-13
---

## Problem

Navigationsstrukturen är mycket komplex och renderas på varje sida, vilket kan påverka prestanda.

## Föreslagen lösning

Implementera dynamisk import för navigationskomponenter och lägg till klient-side caching av navigationsdata.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
