---
id: 2026-08-10-002
title: "Optimera YouTube-nyhetshämtning"
type: perf
severity: medium
risk: low
file: nyheter.py
status: pending
created: 2026-08-10
---

## Problem

hamta_youtube_nyheter() hämtar alla kanaler sekventiellt, vilket kan ta lång tid. Detta kan fördröja agenternas arbetsflöde, särskilt när många kanaler finns.

## Föreslagen lösning

Implementera parallell hämtning av YouTube-kanaler med asyncio.gather(). Begränsa samtidiga anrop för att undvika rate limiting.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
