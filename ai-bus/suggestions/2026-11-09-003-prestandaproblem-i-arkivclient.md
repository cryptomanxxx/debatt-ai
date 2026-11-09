---
id: 2026-11-09-003
title: "Prestandaproblem i ArkivClient"
type: perf
severity: medium
risk: medium
file: app/arkiv/ArkivClient.js
status: pending
created: 2026-11-09
---

## Problem

Komponenten hämtar röstandata direkt från Supabase i en useEffect-hook, vilket kan orsaka prestandaproblem när många användare använder sidan samtidigt.

## Föreslagen lösning

Flytta röstandatahämtningen till serverkomponenten och skicka den som prop till ArkivClient. Detta minskar antalet nätverksanrop och förbättrar prestandan.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
