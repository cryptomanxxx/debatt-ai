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

Gemini API-anrop saknar felhantering för nätverksfel och timeout. Om anropet misslyckas kommer det att kasta ett undantag direkt utan någon försök att återförsöka.

## Föreslagen lösning

Lägg till felhantering för nätverksfel och timeout i gemini_post-funktionen. Exempel:
try:
    r = httpx.post(url, json=payload, headers=headers, timeout=timeout)
except httpx.RequestError as e:
    raise Exception(f"Gemini API-anrop misslyckades: {str(e)}")

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
