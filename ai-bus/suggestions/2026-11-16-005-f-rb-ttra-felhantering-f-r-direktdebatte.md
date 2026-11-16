---
id: 2026-11-16-005
title: "Förbättra felhantering för direktdebatter"
type: bug
severity: medium
risk: low
file: python/kanal_debatt.py
status: pending
created: 2026-11-16
---

## Problem

När alla providers misslyckas vid generering av direktdebatter, sparas inte debatten till Supabase. Detta leder till att debatter försvinner från plattformen.

## Föreslagen lösning

Implementera en fallback-strategi för att spara debatter till Supabase även när alla providers misslyckas.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
