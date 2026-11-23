---
id: 2026-11-23-001
title: "Optimera Supabase-frågor för debattrad"
type: perf
severity: medium
risk: low
file: app/debattrad/page.js
status: pending
created: 2026-11-23
---

## Problem

Debattrad-page.js hämtar 2000 artiklar utan filtrering, vilket orsakar långa laddningstider. Den visar bara 8 debattträd, så frågan bör begränsas till relevanta artiklar.

## Föreslagen lösning

Lägg till filter för att bara hämta artiklar med parent_id eller som har barn (children). Begränsa till 500 artiklar som standard.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
