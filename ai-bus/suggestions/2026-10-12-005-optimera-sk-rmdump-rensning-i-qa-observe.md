---
id: 2026-10-12-005
title: "Optimera skärmdump-rensning i qa-observer.js"
type: perf
severity: medium
risk: medium
file: agents/qa-observer.js
status: pending
created: 2026-10-12
---

## Problem

Skriptet raderar skärmdumpar äldre än 52 veckor, men bara från Storage-bucket. Den gamla base64-kolumnen i qa_snapshots innehåller fortfarande 12 MB/vecka av oanvänd data.

## Föreslagen lösning

Lägg till en migration som rensar screenshot_b64-kolumnen och migrerar alla gamla bilder till Storage-bucket. Uppdatera sedan SKARMDUMP_RETENTION_VECKOR till 26 veckor för att matcha den faktiska lagringen.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
