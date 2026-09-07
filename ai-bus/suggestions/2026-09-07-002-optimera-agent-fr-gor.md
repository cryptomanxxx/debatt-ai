---
id: 2026-09-07-002
title: "Optimera agent-frågor"
type: perf
severity: medium
risk: low
file: agent.py
status: pending
created: 2026-09-07
---

## Problem

176 agent-frågor under veckan visar att agent-interaktionerna är populära men kan orsaka prestandaproblem. Agent-frågorna använder dynamisk AI-fallback-kedja som kan vara ineffektiv.

## Föreslagen lösning

Implementera cachelagring för vanliga agent-frågor och optimera AI-fallback-kedjan genom att prioriterare snabbare provider.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
