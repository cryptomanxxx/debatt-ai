---
id: 2026-07-27-003
title: "Inconsistent agent data"
type: bug
severity: medium
risk: low
file: app/api/chatt/route.js
status: pending
created: 2026-07-27
---

## Problem

PERSONLIGHETER in chatt/route.js differs from beslut/route.js and agentData.js, causing inconsistent agent behavior

## Föreslagen lösning

Centralize agent data in agentData.js and import consistently. Pseudocode: import PERSONLIGHETER from '../../agentData'

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
