---
id: 2026-05-18-002
title: "AI-providers misslyckade i kanal/batch-expand"
type: bug
severity: medium
risk: medium
file: kanal_debatt.py
status: pending
created: 2026-05-18
---

## Problem

Det upprepade felet att alla AI-providers misslyckades i kanal/batch-expand indikerar ett systematiskt problem med AI-kommunikation. Detta kan påverka nyhetsanalys och debattgenerering.

## Föreslagen lösning

Implementera fallback-logik i kanal_debatt.py som försöker olika providers i en specifik ordning och lägger till detaljerad felhantering för att diagnostisera problemet.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
