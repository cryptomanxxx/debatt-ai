---
id: 2026-05-19-003
title: "Åtgärda upprepade Riksdag Import-fel"
type: bug
severity: medium
risk: medium
file: riksdag_import.py
status: pending
created: 2026-05-19
---

## Problem

Fem upprepade misslyckanden i Riksdag Import-GitHub Actions. Problemet uppstår troligen på grund av felaktig felhantering i importeringslogiken.

## Föreslagen lösning

Implementera en mer robust felhanteringsstrategi som inkluderar: 1) Explicit kontroll av API-svar 2) Återförsökslogik med exponeriell backoff 3) Explicit felmeddelande till utvecklare om upprepade misslyckanden

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
