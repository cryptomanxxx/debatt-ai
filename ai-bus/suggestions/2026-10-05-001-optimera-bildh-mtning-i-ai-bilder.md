---
id: 2026-10-05-001
title: "Optimera bildhämtning i AI-bilder"
type: perf
severity: medium
risk: low
file: app/ai-bilder/page.js
status: pending
created: 2026-10-05
---

## Problem

Bildhämtningen i AI-bilder är ineffektiv med flera parallella fetch-anrop som inte cachas. Detta leder till onödig belastning på databasen och långsammare sidladdning.

## Föreslagen lösning

Implementera en enda fetch-förfrågan med en join i SQL-frågan för att hämta både bilder och deras metadata på en gång. Använd Next.js cache för att minimera databasbelastning.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
