---
id: 2026-11-16-002
title: "Förbättra AI-provider-fallback"
type: perf
severity: medium
risk: low
file: python/ai_klient.py
status: pending
created: 2026-11-16
---

## Problem

När alla providers misslyckas (t.ex. på grund av rate limits) faller systemet tillbaka på hårdkodade kedjor. Detta leder till att artiklar inte publiceras när Groq och DeepSeek är nere.

## Föreslagen lösning

Implementera en mer robust fallback-strategi som inkluderar Cloudflare och Gemini som primära fallbacks när Groq och DeepSeek är nere.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
