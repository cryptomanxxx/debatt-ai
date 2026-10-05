---
id: 2026-10-05-002
title: "Förbättra felhantering i RelateradeArtiklar"
type: bug
severity: medium
risk: low
file: app/artikel/[id]/RelateradeArtiklar.js
status: pending
created: 2026-10-05
---

## Problem

Komponenten RelateradeArtiklar har ingen tydlig felhantering för misslyckade fetch-anrop. Detta kan leda till att komponenten renderas tomt utan någon feedback till användaren.

## Föreslagen lösning

Lägg till felhantering som visar ett användarvänligt felmeddelande när fetch-anropet misslyckas. Exempel: `catch (err) { setError('Kunde inte ladda relaterade artiklar'); }`

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
