---
id: 2026-08-10-001
title: "Förbättra felhantering i YouTube-transkript"
type: bug
severity: medium
risk: medium
file: nyheter.py
status: pending
created: 2026-08-10
---

## Problem

Funktionen _hamta_transkript_via_vercel misslyckas tyst när Vercel-proxyn inte svarar, vilket leder till tomma transkript utan varning. Detta döljer potentiella problem med YouTube-dataflödet.

## Föreslagen lösning

Lägg till explicit felhantering och loggning för Vercel-proxyn. Om anropet misslyckas, returnera ett felmeddelande som kan identifiera problemet snabbt.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
