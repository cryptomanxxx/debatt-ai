---
id: 2026-07-13-005
title: "Optimera datahämtning i app/hedgefonder/page.js"
type: perf
severity: medium
risk: low
file: app/hedgefonder/page.js
status: pending
created: 2026-07-13
---

## Problem

Flera oberoende anrop till Supabase som skulle kunna slås ihop till ett enda anrop.

## Föreslagen lösning

Använd en enda Supabase-fråga med JOIN för att hämta all data på en gång.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
