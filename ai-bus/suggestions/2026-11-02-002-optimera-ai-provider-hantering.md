---
id: 2026-11-02-002
title: "Optimera AI-provider-hantering"
type: perf
severity: medium
risk: low
file: python/ai_klient.py
status: pending
created: 2026-11-02
---

## Problem

De återkommande rate-limited och circuit-breaker-felen visar att ai_klient.py inte hanterar provider-försök och cooldown-perioder optimalt. Detta leder till att användare får felmeddelanden när de borde kunna fortsätta.

## Föreslagen lösning

Implementera en smidigare hantering av provider-försök och cooldown-perioder. Pseudokod: class ProviderCooldown: def __init__(self): self.cooldowns = {} def is_ready(self, provider): return time.time() > self.cooldowns.get(provider, 0) def set_cooldown(self, provider, duration): self.cooldowns[provider] = time.time() + duration

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
