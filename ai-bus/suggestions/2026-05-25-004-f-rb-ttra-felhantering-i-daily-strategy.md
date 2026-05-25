---
id: 2026-05-25-004
title: "Förbättra felhantering i Daily Strategy"
type: cleanup
severity: medium
risk: low
file: agents/daily-strategy.js
status: pending
created: 2026-05-25
---

## Problem

Felhanteringen i Daily Strategy är begränsad. Om Cerebras API-anrop misslyckas, avbryts hela processen utan någon återställning eller återförsök.

## Föreslagen lösning

Lägg till återförsök för Cerebras API-anrop. Till exempel tre försök med väntetid mellan försöken. Pseudokod: for (let attempt = 1; attempt <= 3; attempt++) { try { const text = await callCerebras(prompt); return text; } catch (e) { if (attempt === 3) throw e; await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); } }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
