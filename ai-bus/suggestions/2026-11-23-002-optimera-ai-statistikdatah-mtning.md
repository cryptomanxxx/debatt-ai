---
id: 2026-11-23-002
title: "Optimera AI-statistikdatahämtning"
type: perf
severity: high
risk: medium
file: app/ai-statistik/page.js
status: pending
created: 2026-11-23
---

## Problem

AI-statistik/page.js använder en ineffektiv pagineringsmetod som kan missa data om nya rader läggs till under hämtningen. Detta kan leda till felaktig statistik.

## Föreslagen lösning

Implementera en tidsbaserad paginering med ts-fältet istället för id. Använd en fast tidsram (t.ex. senaste 7 dagar) och sortera på ts.desc.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
