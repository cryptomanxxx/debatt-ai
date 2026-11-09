---
id: 2026-11-09-004
title: "Saknad felhantering i ParlamentPage"
type: bug
severity: medium
risk: low
file: app/parlament/page.js
status: pending
created: 2026-11-09
---

## Problem

Komponenten har ingen felhantering för fallet när Supabase-anropen misslyckas. Detta kan leda till att sidan renderas med tomma eller felaktiga data.

## Föreslagen lösning

Lägg till felhantering för Supabase-anropen och visa ett felmeddelande till användaren om något går fel.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
