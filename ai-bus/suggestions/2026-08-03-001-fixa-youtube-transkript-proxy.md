---
id: 2026-08-03-001
title: "Fixa YouTube-transkript-proxy"
type: bug
severity: high
risk: medium
file: nyheter.py
status: pending
created: 2026-08-03
---

## Problem

Funktionen _hamta_transkript_via_vercel misslyckas ofta (15/15 senaste försök) med HTTP 403, vilket gör att Kryptoanalytiker inte får relevant marknadsdata. Problemet uppstår troligen på grund av IP-blockering av YouTube.

## Föreslagen lösning

Implementera en fallback till youtube-transcript-api direkt i Python-koden med timeout och retry-logik. Lägg till en fallback till CoinGecko API för grundläggande marknadsdata om båda misslyckas.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
