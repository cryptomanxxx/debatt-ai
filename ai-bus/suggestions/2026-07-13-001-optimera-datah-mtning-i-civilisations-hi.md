---
id: 2026-07-13-001
title: "Optimera datahämtning i civilisations-historiker.js"
type: perf
severity: medium
risk: low
file: agents/civilisations-historiker.js
status: pending
created: 2026-07-13
---

## Problem

Funktionen hämtaCivilisationsData() gör flera oberoende anrop till Supabase som skulle kunna slås ihop till ett enda anrop med komplexa filter.

## Föreslagen lösning

Använd en enda Supabase-fråga med komplexa filter istället för flera separata anrop. Exempel: `SELECT * FROM händelser WHERE typ IN ('artikel', 'debatt') AND skapad > '2026-07-01' ORDER BY skapad DESC`

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
