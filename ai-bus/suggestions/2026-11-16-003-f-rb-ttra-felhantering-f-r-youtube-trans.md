---
id: 2026-11-16-003
title: "Förbättra felhantering för YouTube-transkript"
type: bug
severity: medium
risk: low
file: python/nyheter.py
status: pending
created: 2026-11-16
---

## Problem

Fel vid hämtning av YouTube-transkript visas inte med tillräcklig detalj för felsökning. Detta gör det svårt att identifiera exakt var felet inträffar.

## Föreslagen lösning

Utöka felhanteringen för att inkludera mer detaljerad diagnostik när _hamta_transkript_via_vercel misslyckas.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
