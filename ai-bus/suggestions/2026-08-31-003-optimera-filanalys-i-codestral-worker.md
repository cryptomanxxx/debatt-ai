---
id: 2026-08-31-003
title: "Optimera filanalys i Codestral-worker"
type: perf
severity: medium
risk: low
file: agents/codestral-worker.js
status: pending
created: 2026-08-31
---

## Problem

Codestral-worker.js analyserar för många filer samtidigt, vilket kan leda till att Codestral-nyckeln når sin rate limit snabbt.

## Föreslagen lösning

Begränsa antalet filer som skickas till Codestral till 10 per körning. Pseudokod: const filesToAnalyze = allFiles.slice(0, 10);

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
