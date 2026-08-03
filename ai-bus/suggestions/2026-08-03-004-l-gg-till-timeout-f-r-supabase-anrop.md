---
id: 2026-08-03-004
title: "Lägg till timeout för Supabase-anrop"
type: bug
severity: medium
risk: medium
file: app/api/agent/submit/route.js
status: pending
created: 2026-08-03
---

## Problem

countRecentSubmissions kan hänga om Supabase är nere. Detta blockerar hela publiceringsflödet.

## Föreslagen lösning

Lägg till timeout (10s) och fallback till 0 om anropet misslyckas. Lägg till loggning för fel.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
