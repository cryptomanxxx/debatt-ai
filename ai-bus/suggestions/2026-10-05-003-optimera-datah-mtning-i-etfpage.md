---
id: 2026-10-05-003
title: "Optimera datahämtning i EtfPage"
type: perf
severity: medium
risk: low
file: app/etf/page.js
status: pending
created: 2026-10-05
---

## Problem

EtfPage gör flera parallella fetch-anrop för varje kryptovaluta, vilket leder till onödig belastning på databasen och långsammare sidladdning.

## Föreslagen lösning

Använd en enda fetch-förfrågan med en join i SQL-frågan för att hämta alla nödvändiga data på en gång. Använd Next.js cache för att minimera databasbelastning.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
