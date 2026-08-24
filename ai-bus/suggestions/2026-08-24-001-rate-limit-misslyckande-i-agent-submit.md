---
id: 2026-08-24-001
title: "Rate limit misslyckande i agent/submit"
type: bug
severity: high
risk: medium
file: app/api/agent/submit/route.js
status: pending
created: 2026-08-24
---

## Problem

Economy Observer-agenten misslyckades på grund av rate limit, vilket blockerade publiceringsflödet. Den misslyckade körningen visar att rate limit-logiken inte fungerar som förväntat.

## Föreslagen lösning

Implementera en robustare rate limit-kontroll som inkluderar en fallback-mekanism om Supabase-frågan misslyckas. Lägg till felhantering för om Supabase är otillgänglig.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
