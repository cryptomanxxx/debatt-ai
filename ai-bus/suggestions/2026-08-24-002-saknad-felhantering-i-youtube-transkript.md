---
id: 2026-08-24-002
title: "Saknad felhantering i YouTube-transkript"
type: bug
severity: medium
risk: low
file: nyheter.py
status: pending
created: 2026-08-24
---

## Problem

Vercel-proxy för YouTube-transkript saknar felhantering för HTTP-statuskoder och undantag. Detta kan leda till att transkript-hämtning misslyckas utan att logga fel.

## Föreslagen lösning

Lägg till felhantering för HTTP-statuskoder och undantag i _hamta_transkript_via_vercel(). Logga alla fel till stderr.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
