---
id: 2026-05-25-001
title: "Groq rate-limit hantering"
type: bug
severity: high
risk: medium
file: ai_klient.py
status: pending
created: 2026-05-25
---

## Problem

Groq API:n har en dagsgräns (TPD) som inte hanteras korrekt. När den nås markeras Groq som nere, men det finns ingen återställning av statusen. Detta leder till att alla efterföljande anrop till Groq misslyckas.

## Föreslagen lösning

Lägg till en återställningsmekanism för Groq-statusen. Till exempel en tidsgräns (12 timmar) för hur länge Groq ska markeras som nere. Pseudokod: if 'groq' in _nere and time.time() - _nere['groq'] > 43200: _nere.remove('groq')

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
