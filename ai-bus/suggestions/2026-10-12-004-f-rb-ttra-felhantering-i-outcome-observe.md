---
id: 2026-10-12-004
title: "Förbättra felhantering i outcome-observer.js"
type: bug
severity: medium
risk: low
file: agents/outcome-observer.js
status: pending
created: 2026-10-12
---

## Problem

Skriptet misslyckas tyst när Supabase-anropet misslyckas, vilket kan gömma problem som skulle ha varit synliga i dagens rapport.

## Föreslagen lösning

Lägg till en console.error() för misslyckade anrop och fortsätt med en tom lista istället för att kasta undantag. Lägg också till en enkel health-check som skriver till Supabase om rapporten genererades.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
