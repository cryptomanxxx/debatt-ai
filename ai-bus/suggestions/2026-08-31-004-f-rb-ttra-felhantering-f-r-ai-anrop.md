---
id: 2026-08-31-004
title: "Förbättra felhantering för AI-anrop"
type: bug
severity: medium
risk: low
file: agents/vision-agent.js
status: pending
created: 2026-08-31
---

## Problem

AI-anrop i vision-agent.js saknar återförsök och bättre felhantering. Om anropet misslyckas loggas felet men ingen åtgärd tas.

## Föreslagen lösning

Lägg till återförsök och bättre felhantering. Pseudokod: for (let attempt = 1; attempt <= 3; attempt++) { try { return await callAI(); } catch (e) { if (attempt === 3) throw e; await new Promise(r => setTimeout(r, 1000)); } }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
