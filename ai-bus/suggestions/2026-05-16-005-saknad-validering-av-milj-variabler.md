---
id: 2026-05-16-005
title: "Saknad validering av miljövariabler"
type: bug
severity: medium
file: agents/codestral-worker.js
status: pending
created: 2026-05-16
---

## Problem

Koden kontrollerar inte att miljövariabler som används är giltiga innan de används, vilket kan leda till oväntade fel.

## Föreslagen lösning

Lägg till validering av miljövariabler innan de används. Exempel:
if (!MISTRAL_API_KEY || typeof MISTRAL_API_KEY !== 'string') {
  console.error("MISTRAL_API_KEY saknas eller är ogiltig — avbryter");
  process.exit(1);
}

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
