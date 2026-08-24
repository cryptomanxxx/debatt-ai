---
id: 2026-08-24-004
title: "Saknad felhantering i CoinMarketCap-hämtning"
type: bug
severity: medium
risk: low
file: nyheter.py
status: pending
created: 2026-08-24
---

## Problem

hamta_kryptodata() saknar felhantering för CoinMarketCap-API-fel. Detta kan leda till att kryptodata inte hämtas utan att logga fel.

## Föreslagen lösning

Lägg till felhantering för CoinMarketCap-API-fel i hamta_kryptodata(). Logga alla fel till stderr.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
