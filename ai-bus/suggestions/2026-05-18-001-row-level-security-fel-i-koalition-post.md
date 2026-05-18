---
id: 2026-05-18-001
title: "Row-level security fel i koalition POST"
type: bug
severity: high
risk: high
file: app/api/koalition/route.js
status: pending
created: 2026-05-18
---

## Problem

Det upprepade row-level security felet i koalition POST API-route indikerar att RLS-regler inte tillämpas korrekt. Detta kan exponera känslig data och bryta applikationens säkerhet.

## Föreslagen lösning

Verifiera att RLS-regler är korrekt konfigurerade i Supabase för koalitioner-tabellen. Lägg till explicit felhantering för RLS-fel i API-route.js med lämplig loggning och felmeddelande till klienten.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
