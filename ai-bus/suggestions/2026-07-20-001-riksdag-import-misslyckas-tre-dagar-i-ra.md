---
id: 2026-07-20-001
title: "Riksdag Import misslyckas tre dagar i rad"
type: bug
severity: high
risk: medium
file: agents/riksdag-utfall.js
status: pending
created: 2026-07-20
---

## Problem

Riksdag Import-funktionen har misslyckats tre dagar i rad, vilket stör integriteten med riksdagens data. Problemet påverkar alla dokumentstatusuppdateringar och röstningsanalyser.

## Föreslagen lösning

Implementera felhantering och återförsökslogik i getVoteCountUtfall-funktionen. Lägg till timeout och retry-logik för API-anrop. Lägg till logging för att spåra misslyckade försök.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
