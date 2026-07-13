---
id: 2026-07-13-002
title: "Lägg till felhantering för Supabase-anrop"
type: bug
severity: high
risk: medium
file: agents/civilisations-historiker.js
status: pending
created: 2026-07-13
---

## Problem

Om Supabase-anropet misslyckas returneras tomma arrayer utan någon felhantering som loggar problemet.

## Föreslagen lösning

Lägg till felhantering som loggar fel till fel_log-tabellen. Exempel: `catch (error) { await logError('Supabase-fel', error); return []; }`

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
