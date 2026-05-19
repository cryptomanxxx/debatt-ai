---
id: 2026-05-19-003
title: "Förbättra felhantering för Riksdag Import"
type: bug
severity: medium
risk: medium
file: riksdag_import.py
status: pending
created: 2026-05-19
---

## Problem

Det uppstår fem misslyckade körningar för Riksdag Import under senaste 30 körningarna, vilket påverkar datainmatningen.

## Föreslagen lösning

Implementera en återförsöksmekanism för Riksdag Import med exponentiell backoff. Lägg till en try-catch-block runt hela importprocessen och implementera en återförsökslogik.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
