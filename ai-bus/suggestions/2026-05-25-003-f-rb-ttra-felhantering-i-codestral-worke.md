---
id: 2026-05-25-003
title: "Förbättra felhantering i Codestral-worker"
type: cleanup
severity: medium
risk: low
file: agents/codestral-worker.js
status: pending
created: 2026-05-25
---

## Problem

Felhanteringen i Codestral-worker är begränsad. Om Codestral-analys misslyckas, avbryts hela processen utan någon återställning eller återförsök.

## Föreslagen lösning

Lägg till återförsök för Codestral-analys. Till exempel tre försök med väntetid mellan försöken. Pseudokod: for (let attempt = 1; attempt <= 3; attempt++) { try { suggestions = await analyzeWithCodestral(codeBlock, runtimeSummary); break; } catch (e) { if (attempt === 3) throw e; await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); } }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
