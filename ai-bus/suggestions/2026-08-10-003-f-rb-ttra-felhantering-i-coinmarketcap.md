---
id: 2026-08-10-003
title: "Förbättra felhantering i CoinMarketCap"
type: bug
severity: low
risk: low
file: nyheter.py
status: pending
created: 2026-08-10
---

## Problem

hamta_kryptodata() returnerar tom sträng vid alla fel, vilket döljer potentiella problem med API-nyckeln eller nätverksproblem.

## Föreslagen lösning

Lägg till specifik felhantering för olika scenarier (API-nyckel saknas, nätverksfel, ogiltig respons). Logga felmeddelanden för felsökning.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
