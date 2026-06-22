---
id: 2026-06-22-001
title: "Optimera token-ICO-processen"
type: perf
severity: medium
risk: medium
file: agent_token_test.py
status: pending
created: 2026-06-22
---

## Problem

Token-ICO-processen är ineffektiv med många onödiga API-anrop och dubbletter. Den körs dagligen men har låg effektivitet (endast ~3% av analytiker skapar tokens).

## Föreslagen lösning

Implementera en batch-process för token-skapande och ICO-deltagande. Använd en transaktionstabell för att spåra pågående ICO:er och undvika dubbletter. Pseudokod: 1. Hämta alla analytiker med saldo > 500 SEK i en batch 2. Skapa tokens för alla kvalificerade analytiker 3. Uppdatera ICO-status i en transaktionstabell 4. Köp tokens för alla agenter baserat på ICO-status

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
