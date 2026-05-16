---
id: 2026-05-16-001
title: "Felhantering för Groq API-anrop"
type: bug
severity: medium
file: ai_klient.py
status: pending
created: 2026-05-16
---

## Problem

Funktionen groq_post misslyckas inte korrekt när alla försök misslyckas. Den kastar ett undantag med en begränsad felmeddelande som inte innehåller detaljer om det sista försöket.

## Föreslagen lösning

Uppdatera felhanteringen för att inkludera mer detaljerat felmeddelande från det sista försöket. Exempel:
raise Exception(f"Groq rate-limit kvarstår efter 3 försök. Sista svar: {last_r.text if last_r else 'okänt'}")

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
