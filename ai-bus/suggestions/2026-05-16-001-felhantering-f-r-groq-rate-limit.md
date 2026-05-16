---
id: 2026-05-16-001
title: "Felhantering för Groq rate-limit"
type: bug
severity: high
file: ai_klient.py
status: pending
created: 2026-05-16
---

## Problem

groq_post() misslyckas inte korrekt när rate-limit kvarstår efter 3 försök. Detta leder till osynliga fel för användare som inte ser några artiklar.

## Föreslagen lösning

Lägg till explicit felhantering för kvarvarande rate-limit och logga felmeddelande med detaljer om försök. Exempel:

raise Exception(f"Groq rate-limit kvarstår efter 3 försök. Sista svar: {last_r.status_code} {last_r.text[:200]}")

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
