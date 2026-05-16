---
id: 2026-05-16-002
title: "Saknad felhantering för Gemini API"
type: bug
severity: medium
file: ai_klient.py
status: rejected
created: 2026-05-16
---

## Problem

gemini_post() misslyckas inte korrekt när alla modeller misslyckas. Detta kan leda till osynliga fel för användare.

## Föreslagen lösning

Lägg till explicit felhantering för alla misslyckade modeller och logga felmeddelande med detaljer. Exempel:

raise Exception(f"Gemini misslyckades för alla modeller: {last_err}")

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
