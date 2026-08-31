---
id: 2026-08-31-001
title: "Optimera Groq-nyckelhantering"
type: perf
severity: high
risk: medium
file: ai_klient.py
status: pending
created: 2026-08-31
---

## Problem

Groq-nycklar når sin TPD-kvot snabbt, vilket orsakar återkommande 429-fel. Den nuvarande implementeringen markerar nycklar som nere permanent, vilket kan leda till att bra nycklar ignoreras.

## Föreslagen lösning

Implementera en dynamisk nyckelrotation som tar hänsyn till varje nyckels TPD-kvot. Lägg till en TPD-spårningsmekanism som återställer nycklar när de har återhämtat sig. Pseudokod: if groq_key in _groq_nere_keys and time_since_last_use > 24h: _groq_nere_keys.remove(groq_key)

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
