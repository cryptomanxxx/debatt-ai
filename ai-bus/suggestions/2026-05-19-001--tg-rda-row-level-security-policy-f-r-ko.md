---
id: 2026-05-19-001
title: "Åtgärda row-level security policy för koalitioner"
type: security
severity: high
risk: high
file: app/api/koalition/route.js
status: pending
created: 2026-05-19
---

## Problem

Detta är ett återkommande fel som blockerar koalitioner-funktionen. Det uppstår när row-level security policy bryts för koalitioner-tabellen.

## Föreslagen lösning

Uppdatera RLS-policyn för koalitioner-tabellen att tillåta de nödvändiga åtgärderna. Lägg till en specifik RLS-regel för POST-begäranden som tillåter inmatning av nödvändiga fält.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
